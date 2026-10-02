import { neon } from "@neondatabase/serverless";
import { prepareProviderAuthRequest } from "./auth-proxy.js";
import { renderHome } from "./home-ui.js";
import { normalizeCountryCode, normalizeEmail, normalizePhoneE164, validateLegalIdentity, type LegalIdentityInput } from "./beatcore-legal-identity.js";
interface Env {
  DATABASE_URL: string;
  BOOTSTRAP_TOKEN?: string;
  NEON_AUTH_BASE_URL?: string;
  IDENTITY_ENCRYPTION_KEY?: string;
  TWILIO_API_KEY?: string;
  TWILIO_API_SECRET?: string;
  TWILIO_VERIFY_SERVICE_SID?: string;
}

type DbSql = ReturnType<typeof neon>;

const AUTH_BASE_URL =
  "https://ep-solitary-brook-b5iyh2sc.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth";

const headers = (extra?: HeadersInit): Headers => {
  const h = new Headers({
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    ...extra
  });
  return h;
};

const json = (body: unknown, status = 200, extra?: HeadersInit): Response =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: headers({
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type, authorization",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      ...extra
    })
  });

const requireDatabase = (env: Env): DbSql => {
  if (!env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  return neon(env.DATABASE_URL);
};

const authBase = (env: Env) => (env.NEON_AUTH_BASE_URL || AUTH_BASE_URL).replace(/\/$/, "");

function providerCookies(response: Response): string[] {
  const h = response.headers as Headers & { getSetCookie?: () => string[]; getAll?: (name: string) => string[] };
  return h.getSetCookie?.() ?? h.getAll?.("Set-Cookie") ?? (h.get("set-cookie") ? [h.get("set-cookie") as string] : []);
}

async function providerRequest(
  request: Request,
  env: Env,
  endpoint: string,
  body?: unknown
): Promise<Response> {
  const prepared = body === undefined
    ? { headers: new Headers({ accept: "application/json", origin: request.headers.get("origin") || new URL(request.url).origin }), body }
    : prepareProviderAuthRequest(request, body);

  return fetch(new Request(authBase(env) + endpoint, {
    method: body === undefined ? request.method : "POST",
    headers: prepared.headers,
    body: body === undefined ? undefined : JSON.stringify(prepared.body),
    redirect: "manual"
  }));
}

async function readJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function providerUser(payload: any): any {
  return payload?.user ?? payload?.data?.user ?? null;
}

function providerSession(payload: any): any {
  return payload?.session ?? payload?.data?.session ?? null;
}

async function syncCanonicalAuth(
  env: Env,
  user: any,
  providerSessionValue: any,
  cookieHeader: string | null,
  setCookies: string[]
): Promise<{ participantId: string; accountId: string; sessionId: string }> {
  if (!user?.id || !user?.email) throw new Error("AUTH_PROVIDER_USER_MISSING");

  const sql = requireDatabase(env);
  const email = String(user.email).trim().toLowerCase();
  const identity = await sql`
    SELECT i.id AS identity_id, p.id AS participant_id, a.id AS account_id
    FROM public.auth_methods am
    JOIN public.identities i ON i.id = am.identity_id
    JOIN public.participants p ON p.identity_id = i.id
    JOIN public.accounts a ON a.identity_id = i.id
    WHERE am.kind = 'email' AND am.identifier = ${email} AND am.status = 'active'
    LIMIT 1
  `;

  let identityId: string;
  let participantId: string;
  let accountId: string;

  if (identity.length) {
    identityId = identity[0].identity_id;
    participantId = identity[0].participant_id;
    accountId = identity[0].account_id;
  } else {
    const suffix = String(user.id).replace(/[^a-zA-Z0-9_-]/g, "");
    identityId = "identity-neon-" + suffix;
    participantId = "participant-neon-" + suffix;
    accountId = "account-neon-" + suffix;
    const personId = "person-neon-" + suffix;
    const credentialId = "credential-neon-" + suffix;
    const authMethodId = "auth-method-neon-" + suffix;

    await sql.transaction([
      sql`INSERT INTO public.persons (id) VALUES (${personId}) ON CONFLICT DO NOTHING`,
      sql`INSERT INTO public.identities (id, kind, person_id) VALUES (${identityId}, 'human', ${personId}) ON CONFLICT DO NOTHING`,
      sql`INSERT INTO public.participants (id, identity_id) VALUES (${participantId}, ${identityId}) ON CONFLICT DO NOTHING`,
      sql`INSERT INTO public.accounts (id, identity_id, status) VALUES (${accountId}, ${identityId}, 'ACTIVE') ON CONFLICT DO NOTHING`,
      sql`INSERT INTO public.credentials (id, kind, status, account_id) VALUES (${credentialId}, 'email', 'ACTIVE', ${accountId}) ON CONFLICT DO NOTHING`,
      sql`INSERT INTO public.auth_methods (id, identity_id, kind, identifier, status, verified_at)
          VALUES (${authMethodId}, ${identityId}, 'email', ${email}, 'active', CASE WHEN ${Boolean(user.emailVerified)} THEN now() ELSE NULL END)
          ON CONFLICT DO NOTHING`
    ]);
  }

  const emailHash = await sha256Hex(email);
  const emailContactId = "identity-contact-email-" + crypto.randomUUID();
  await sql`
    INSERT INTO public.identity_contacts(id, identity_id, kind, value_normalized, value_hash, status, verified_at, is_primary, updated_at)
    VALUES(
      ${emailContactId}, ${identityId}, 'email', ${email}, ${emailHash},
      CASE WHEN ${Boolean(user.emailVerified)} THEN 'active' ELSE 'pending' END,
      CASE WHEN ${Boolean(user.emailVerified)} THEN now() ELSE NULL END,
      true, now()
    )
    ON CONFLICT (kind, value_hash) DO UPDATE SET
      identity_id=EXCLUDED.identity_id,
      status=EXCLUDED.status,
      verified_at=EXCLUDED.verified_at,
      is_primary=true,
      updated_at=now()
  `;

  await sql`
    UPDATE public.auth_methods
    SET status = CASE WHEN ${Boolean(user.emailVerified)} THEN 'active' ELSE 'pending' END,
        verified_at = CASE WHEN ${Boolean(user.emailVerified)} THEN now() ELSE NULL END
    WHERE identity_id = ${identityId} AND kind = 'email' AND identifier = ${email} AND status <> 'revoked'
  `;

  const cookieMaterial = cookieHeader || setCookies.join("; ");
  if (!cookieMaterial) throw new Error("AUTH_SESSION_COOKIE_MISSING");
  const sessionId = "session-neon-" + crypto.randomUUID();
  const expiresAt =
    providerSessionValue?.expiresAt ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await sql`
    INSERT INTO public.sessions (id, account_id, authenticated_at, expires_at)
    VALUES (${sessionId}, ${accountId}, now(), ${expiresAt})
    ON CONFLICT (id) DO NOTHING
  `;

  await sql`
    UPDATE public.auth_sessions
    SET revoked_at = now()
    WHERE participant_id = ${participantId} AND revoked_at IS NULL AND expires_at <= now()
  `;

  return { participantId, accountId, sessionId };
}

async function authMutation(request: Request, env: Env, endpoint: string): Promise<Response> {
  try {
    const body = await request.json();
    const upstream = await providerRequest(request, env, endpoint, body);
    const payload = await readJson(upstream);
    const setCookies = providerCookies(upstream);

    if (!upstream.ok) {
      return json({ service: "Zalagren", error: payload?.message || payload?.error || "AUTHENTICATION_FAILED" }, upstream.status);
    }

    const user = providerUser(payload);
    const session = providerSession(payload);
    const canonical = user
      ? await syncCanonicalAuth(env, user, session, null, setCookies)
      : null;

    let emailVerificationRequested = false;
    if (endpoint === "/sign-up/email" && user?.email) {
      try {
        const verification = await providerRequest(
          request,
          env,
          "/send-verification-email",
          { email: String(user.email).trim().toLowerCase(), callbackURL: new URL("/", request.url).toString() }
        );
        emailVerificationRequested = verification.ok;
      } catch {
        emailVerificationRequested = false;
      }
    }

    const outHeaders = headers({
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*"
    });
    for (const cookie of setCookies) {
      const normalized = cookie.replace(/;\s*Domain=[^;]+/gi, "").replace(/;\s*Path=\/[^;]*/i, "; Path=/");
      outHeaders.append("set-cookie", normalized);
    }

    return new Response(JSON.stringify({
      service: "Zalagren",
      status: "authenticated",
      user: user ? { id: user.id, name: user.name, email: user.email, emailVerified: Boolean(user.emailVerified) } : undefined,
      canonical,
      verification: { email: Boolean(user?.emailVerified), emailVerificationRequested }
    }), { status: upstream.status, headers: outHeaders });
  } catch (error) {
    return json({ service: "Zalagren", error: error instanceof Error ? error.message : "AUTHENTICATION_FAILED" }, 500);
  }
}

async function currentSession(request: Request, env: Env): Promise<{ user: any; session: any; canonical: any } | null> {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  const upstream = await providerRequest(request, env, "/get-session");
  if (!upstream.ok) return null;
  const payload = await readJson(upstream);
  const user = providerUser(payload);
  const session = providerSession(payload);
  if (!user?.id || !user?.email) return null;

  const sql = requireDatabase(env);
  const rows = await sql`
    SELECT p.id AS participant_id, a.id AS account_id, s.id AS session_id
    FROM public.auth_methods am
    JOIN public.identities i ON i.id = am.identity_id
    JOIN public.participants p ON p.identity_id = i.id
    JOIN public.accounts a ON a.identity_id = i.id
    LEFT JOIN public.sessions s ON s.account_id = a.id AND s.expires_at > now()
    WHERE am.kind = 'email' AND am.identifier = ${String(user.email).trim().toLowerCase()} AND am.status = 'active'
    LIMIT 1
  `;
  const canonical = rows[0] || await syncCanonicalAuth(env, user, session, cookie, []);
  return { user, session, canonical };
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function base64FromBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function bytesFromBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function encryptSensitive(value: string, env: Env): Promise<string> {
  if (!env.IDENTITY_ENCRYPTION_KEY) throw new Error("IDENTITY_ENCRYPTION_NOT_CONFIGURED");
  const keyBytes = bytesFromBase64(env.IDENTITY_ENCRYPTION_KEY);
  if (keyBytes.length !== 32) throw new Error("IDENTITY_ENCRYPTION_KEY_INVALID");
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value));
  return base64FromBytes(iv) + "." + base64FromBytes(new Uint8Array(ciphertext));
}

async function requireActive(request: Request, env: Env) {
  const active = await currentSession(request, env);
  if (!active) throw new Error("UNAUTHORIZED");
  return active;
}

async function twilioRequest(env: Env, path: string, form: URLSearchParams): Promise<any> {
  if (!env.TWILIO_API_KEY || !env.TWILIO_API_SECRET || !env.TWILIO_VERIFY_SERVICE_SID) {
    throw new Error("PHONE_VERIFICATION_NOT_CONFIGURED");
  }
  const auth = btoa(env.TWILIO_API_KEY + ":" + env.TWILIO_API_SECRET);
  const response = await fetch("https://verify.twilio.com/v2/Services/" + encodeURIComponent(env.TWILIO_VERIFY_SERVICE_SID) + path, {
    method: "POST",
    headers: { authorization: "Basic " + auth, "content-type": "application/x-www-form-urlencoded" },
    body: form.toString()
  });
  const payload = await readJson(response);
  if (!response.ok) throw new Error(payload?.message || "PHONE_VERIFICATION_FAILED");
  return payload;
}

async function saveLegalIdentity(request: Request, env: Env): Promise<Response> {
  try {
    const active = await requireActive(request, env);
    const input = await request.json() as LegalIdentityInput;
    validateLegalIdentity(input);
    const sql = requireDatabase(env);
    const participantId = active.canonical.participant_id || active.canonical.participantId;
    const identityRows = await sql\`SELECT i.id FROM public.identities i JOIN public.participants p ON p.identity_id=i.id WHERE p.id=\${participantId} LIMIT 1\`;
    if (!identityRows.length) return json({service:"Zalagren",error:"IDENTITY_NOT_FOUND"},404);
    const identity = identityRows[0].id;
    const documentNumber = input.documentNumber.trim();
    const documentHash = await sha256Hex(documentNumber.toUpperCase());
    const encrypted = await encryptSensitive(documentNumber, env);
    const docId = "identity-document-" + crypto.randomUUID();
    const profile = await sql\`
      INSERT INTO public.legal_identity_profiles (
        identity_id, legal_name, given_names, middle_names, family_name, date_of_birth, sex,
        nationality_country_code, birth_country_code, birth_place, residence_country_code,
        address_line1, address_line2, city, region, postal_code, verification_status, updated_at
      ) VALUES (
        \${identity}, \${input.legalName.trim()}, \${input.givenNames?.trim() || null}, \${input.middleNames?.trim() || null},
        \${input.familyName?.trim() || null}, \${input.dateOfBirth || null}, \${input.sex?.trim() || null},
        \${input.nationalityCountryCode ? normalizeCountryCode(input.nationalityCountryCode) : null},
        \${input.birthCountryCode ? normalizeCountryCode(input.birthCountryCode) : null}, \${input.birthPlace?.trim() || null},
        \${input.residenceCountryCode ? normalizeCountryCode(input.residenceCountryCode) : null},
        \${input.addressLine1?.trim() || null}, \${input.addressLine2?.trim() || null}, \${input.city?.trim() || null},
        \${input.region?.trim() || null}, \${input.postalCode?.trim() || null}, 'pending', now()
      )
      ON CONFLICT (identity_id) DO UPDATE SET
        legal_name=EXCLUDED.legal_name, given_names=EXCLUDED.given_names, middle_names=EXCLUDED.middle_names,
        family_name=EXCLUDED.family_name, date_of_birth=EXCLUDED.date_of_birth, sex=EXCLUDED.sex,
        nationality_country_code=EXCLUDED.nationality_country_code, birth_country_code=EXCLUDED.birth_country_code,
        birth_place=EXCLUDED.birth_place, residence_country_code=EXCLUDED.residence_country_code,
        address_line1=EXCLUDED.address_line1, address_line2=EXCLUDED.address_line2, city=EXCLUDED.city,
        region=EXCLUDED.region, postal_code=EXCLUDED.postal_code, verification_status='pending', updated_at=now()
      RETURNING identity_id, legal_name, verification_status
    \`;
    await sql\`
      INSERT INTO public.identity_documents (
        id, identity_id, document_type, issuing_country_code, issuing_authority,
        document_number_ciphertext, document_number_hash, document_number_last4,
        issue_date, expiry_date, status, verification_method, updated_at
      ) VALUES (
        \${docId}, \${identity}, \${input.documentType}, \${normalizeCountryCode(input.issuingCountryCode)},
        \${input.issuingAuthority?.trim() || null}, \${encrypted}, \${documentHash}, \${documentNumber.slice(-4)},
        \${input.issueDate || null}, \${input.expiryDate || null}, 'pending', null, now()
      )
      ON CONFLICT (identity_id, document_number_hash) DO UPDATE SET
        document_number_ciphertext=EXCLUDED.document_number_ciphertext,
        document_number_last4=EXCLUDED.document_number_last4,
        issue_date=EXCLUDED.issue_date, expiry_date=EXCLUDED.expiry_date,
        status='pending', updated_at=now()
    \`;
    return json({service:"Zalagren",status:"legal_identity_saved",profile:profile[0],document:{type:input.documentType,issuingCountryCode:normalizeCountryCode(input.issuingCountryCode),last4:documentNumber.slice(-4),verificationStatus:"pending"}},201);
  } catch (error) {
    const message=error instanceof Error?error.message:"LEGAL_IDENTITY_SAVE_FAILED";
    return json({service:"Zalagren",error:message},message==="UNAUTHORIZED"?401:message==="IDENTITY_ENCRYPTION_NOT_CONFIGURED"?503:400);
  }
}

async function startPhoneVerification(request: Request, env: Env): Promise<Response> {
  try {
    const active = await requireActive(request, env);
    const body=await request.json() as {phone?:string};
    const phone=normalizePhoneE164(body.phone);
    const payload=await twilioRequest(env,"/Verifications",new URLSearchParams({channel:"sms",to:phone}));
    const sql=requireDatabase(env);
    const participantId=active.canonical.participant_id || active.canonical.participantId;
    const rows=await sql\`SELECT i.id FROM public.identities i JOIN public.participants p ON p.identity_id=i.id WHERE p.id=\${participantId} LIMIT 1\`;
    if(!rows.length) return json({service:"Zalagren",error:"IDENTITY_NOT_FOUND"},404);
    const hash=await sha256Hex(phone);
    const contactId="identity-contact-"+crypto.randomUUID();
    await sql\`INSERT INTO public.identity_contacts(id,identity_id,kind,value_normalized,value_hash,status,is_primary,updated_at)
      VALUES(\${contactId},\${rows[0].id},'phone',\${phone},\${hash},'pending',false,now())
      ON CONFLICT (kind,value_hash) DO UPDATE SET identity_id=EXCLUDED.identity_id,status='pending',updated_at=now()\`;
    return json({service:"Zalagren",status:"phone_verification_sent",phoneLast4:phone.slice(-4),providerStatus:payload?.status||"pending"});
  } catch(error){const m=error instanceof Error?error.message:"PHONE_VERIFICATION_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:m==="PHONE_VERIFICATION_NOT_CONFIGURED"?503:400);}
}

async function verifyPhone(request: Request, env: Env): Promise<Response> {
  try {
    const active=await requireActive(request,env);
    const body=await request.json() as {phone?:string;code?:string};
    const phone=normalizePhoneE164(body.phone);
    const code=String(body.code||"").trim();
    if(!/^\d{4,10}$/.test(code)) return json({service:"Zalagren",error:"INVALID_VERIFICATION_CODE"},400);
    const payload=await twilioRequest(env,"/VerificationCheck",new URLSearchParams({to:phone,code}));
    if(payload?.status!=="approved") return json({service:"Zalagren",error:"PHONE_NOT_VERIFIED",status:payload?.status||"pending"},400);
    const sql=requireDatabase(env);
    const participantId=active.canonical.participant_id || active.canonical.participantId;
    const rows=await sql\`SELECT i.id FROM public.identities i JOIN public.participants p ON p.identity_id=i.id WHERE p.id=\${participantId} LIMIT 1\`;
    if(!rows.length) return json({service:"Zalagren",error:"IDENTITY_NOT_FOUND"},404);
    const identity=rows[0].id, hash=await sha256Hex(phone);
    const contactId="identity-contact-"+crypto.randomUUID(), methodId="auth-method-phone-"+crypto.randomUUID(), credentialId="credential-phone-"+crypto.randomUUID();
    await sql.transaction([
      sql\`UPDATE public.identity_contacts SET status='revoked',is_primary=false,updated_at=now() WHERE identity_id=\${identity} AND kind='phone' AND status='active' AND value_hash<>\${hash}\`,
      sql\`INSERT INTO public.identity_contacts(id,identity_id,kind,value_normalized,value_hash,status,verified_at,is_primary,updated_at)
          VALUES(\${contactId},\${identity},'phone',\${phone},\${hash},'active',now(),true,now())
          ON CONFLICT (kind,value_hash) DO UPDATE SET identity_id=EXCLUDED.identity_id,status='active',verified_at=now(),is_primary=true,updated_at=now()\`,
      sql\`INSERT INTO public.auth_methods(id,identity_id,kind,identifier,status,verified_at)
          VALUES(\${methodId},\${identity},'phone',\${phone},'active',now())
          ON CONFLICT DO NOTHING\`,
      sql\`INSERT INTO public.credentials(id,kind,status,account_id)
          SELECT \${credentialId},'phone','ACTIVE',a.id FROM public.accounts a WHERE a.identity_id=\${identity}
          ON CONFLICT DO NOTHING\`,
      sql\`INSERT INTO public.identity_verification_records(id,identity_id,target_type,target_id,method,status,external_reference,completed_at)
          VALUES('identity-verification-'+crypto.randomUUID(),\${identity},'phone',\${methodId},'twilio-verify','verified',\${payload?.sid||null},now())\`
    ]);
    return json({service:"Zalagren",status:"phone_verified",phoneLast4:phone.slice(-4)});
  }catch(error){const m=error instanceof Error?error.message:"PHONE_VERIFICATION_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:m==="PHONE_VERIFICATION_NOT_CONFIGURED"?503:400);}
}

async function sendEmailVerification(request: Request, env: Env): Promise<Response> {
  try {
    const active=await requireActive(request,env);
    const body=await request.json().catch(()=>({}));
    const email=normalizeEmail(body.email || active.user.email);
    const upstream=await providerRequest(request,env,"/send-verification-email",{email,callbackURL:new URL("/",request.url).toString()});
    const payload=await readJson(upstream);
    return json({service:"Zalagren",status:upstream.ok?"email_verification_requested":"email_verification_failed",provider:payload},upstream.status);
  }catch(error){const m=error instanceof Error?error.message:"EMAIL_VERIFICATION_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}

async function me(request: Request, env: Env): Promise<Response> {
  try {
    const active = await currentSession(request, env);
    if (!active) return json({ service: "Zalagren", error: "UNAUTHORIZED" }, 401);
    const sql = requireDatabase(env);
    const participantId = active.canonical.participant_id || active.canonical.participantId;
    const identityRows = await sql`
      SELECT i.id AS identity_id, lip.legal_name,
             lip.status AS legal_verification_status,
             EXISTS(SELECT 1 FROM public.identity_contacts ic WHERE ic.identity_id=i.id AND ic.kind='email' AND ic.status='active' AND ic.verified_at IS NOT NULL) AS email_verified,
             EXISTS(SELECT 1 FROM public.identity_contacts ic WHERE ic.identity_id=i.id AND ic.kind='phone' AND ic.status='active' AND ic.verified_at IS NOT NULL) AS phone_verified,
             EXISTS(SELECT 1 FROM public.identity_documents d WHERE d.identity_id=i.id AND d.status='verified') AS document_verified
      FROM public.identities i
      LEFT JOIN public.legal_identity_profiles lip ON lip.participant_id=p.id
      JOIN public.participants p ON p.identity_id=i.id
      WHERE p.id=${participantId}
      LIMIT 1
    `;
    return json({
      service: "Zalagren",
      authenticated: true,
      participant: active.canonical,
      identity: { provider: "neon-auth", userId: active.user.id, name: active.user.name, email: active.user.email, legalName: identityRows[0]?.legal_name || null },
      home: {
        identity: "Ready",
        communities: "Available",
        services: "Ready for participant context",
        genesis: "Proposal-only intelligence"
      }
    });
  } catch (error) {
    return json({ service: "Zalagren", error: error instanceof Error ? error.message : "SESSION_LOOKUP_FAILED" }, 500);
  }
}


async function homeCommunities(request: Request, env: Env): Promise<Response> {
  try {
    const active = await currentSession(request, env);
    if (!active) return json({ service: "Zalagren", error: "UNAUTHORIZED" }, 401);
    const sql = requireDatabase(env);
    const items = await sql`SELECT id, name, type, location, verification FROM public.communities ORDER BY created_at DESC LIMIT 50`;
    return json({ service: "Zalagren", items });
  } catch (error) {
    return json({ service: "Zalagren", error: error instanceof Error ? error.message : "COMMUNITIES_LOOKUP_FAILED" }, 500);
  }
}

async function homeServices(request: Request, env: Env): Promise<Response> {
  try {
    const active = await currentSession(request, env);
    if (!active) return json({ service: "Zalagren", error: "UNAUTHORIZED" }, 401);
    const sql = requireDatabase(env);
    const items = await sql`
      SELECT
        s.id, s.name, s.domain, s.status,
        COALESCE(
          json_agg(
            json_build_object(
              'id', c.id,
              'name', c.name,
              'action', c.action,
              'requiresExplicitAuthorization', c.requires_explicit_authorization
            ) ORDER BY c.name
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'::json
        ) AS capabilities
      FROM public.services s
      LEFT JOIN public.capabilities c ON c.service_id = s.id
      GROUP BY s.id, s.name, s.domain, s.status
      ORDER BY s.name
      LIMIT 50
    `;
    return json({ service: "Zalagren", items });
  } catch (error) {
    return json({ service: "Zalagren", error: error instanceof Error ? error.message : "SERVICES_LOOKUP_FAILED" }, 500);
  }
}

async function homeFoundation(request: Request, env: Env): Promise<Response> {
  try {
    const active = await currentSession(request, env);
    if (!active) return json({ service: "Zalagren", error: "UNAUTHORIZED" }, 401);
    const sql = requireDatabase(env);
    const [row] = await sql`
      SELECT
        (SELECT count(*)::int FROM public.persons) AS persons,
        (SELECT count(*)::int FROM public.identities) AS identities,
        (SELECT count(*)::int FROM public.participants) AS participants,
        (SELECT count(*)::int FROM public.accounts) AS accounts,
        (SELECT count(*)::int FROM public.credentials) AS credentials,
        (SELECT count(*)::int FROM public.sessions) AS sessions,
        (SELECT count(*)::int FROM public.accesses) AS accesses,
        (SELECT count(*)::int FROM public.actions) AS actions,
        (SELECT count(*)::int FROM public.action_executions) AS action_executions,
        (SELECT count(*)::int FROM public.events) AS events,
        (SELECT count(*)::int FROM public.evidences) AS evidences
    `;
    return json({ service: "Zalagren", foundation: row, participant: active.canonical });
  } catch (error) {
    return json({ service: "Zalagren", status: "database_unavailable", error: error instanceof Error ? error.message : "FOUNDATION_LOOKUP_FAILED" }, 503);
  }
}

async function health(env: Env): Promise<Response> {
  try {
    const sql = requireDatabase(env);
    const [db] = await sql`SELECT current_database() AS database, now() AS server_time`;
    const [ledger] = await sql`SELECT count(*)::int AS migrations FROM public.zalagren_schema_migrations`;
    return json({service:"Zalagren",status:"ok",database:db?.database,serverTime:db?.server_time,migrationCount:ledger?.migrations ?? 0});
  } catch (error) {
    return json({service:"Zalagren",status:"database_unavailable",error:error instanceof Error?error.message:"UNKNOWN_ERROR"},503);
  }
}

async function foundation(env: Env): Promise<Response> {
  try {
    const sql = requireDatabase(env);
    const [row] = await sql`
      SELECT
        (SELECT count(*)::int FROM public.persons) AS persons,
        (SELECT count(*)::int FROM public.identities) AS identities,
        (SELECT count(*)::int FROM public.participants) AS participants,
        (SELECT count(*)::int FROM public.accounts) AS accounts,
        (SELECT count(*)::int FROM public.credentials) AS credentials,
        (SELECT count(*)::int FROM public.sessions) AS sessions,
        (SELECT count(*)::int FROM public.accesses) AS accesses,
        (SELECT count(*)::int FROM public.actions) AS actions,
        (SELECT count(*)::int FROM public.action_executions) AS action_executions,
        (SELECT count(*)::int FROM public.events) AS events,
        (SELECT count(*)::int FROM public.evidences) AS evidences
    `;
    return json({service:"Zalagren",foundation:row});
  } catch (error) {
    return json({service:"Zalagren",status:"database_unavailable",error:error instanceof Error?error.message:"UNKNOWN_ERROR"},503);
  }
}

async function bootstrapParticipant(request: Request, env: Env): Promise<Response> {
  if (!env.BOOTSTRAP_TOKEN) return json({error:"BOOTSTRAP_NOT_CONFIGURED"},503);
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
  if (!supplied || supplied !== env.BOOTSTRAP_TOKEN) return json({error:"UNAUTHORIZED"},401);
  try {
    const sql = requireDatabase(env);
    const id = crypto.randomUUID();
    const personId = "person-" + id, identityId = "identity-" + id, participantId = "participant-" + id, accountId = "account-" + id;
    await sql.transaction([
      sql`INSERT INTO public.persons (id) VALUES (${personId})`,
      sql`INSERT INTO public.identities (id, kind, person_id) VALUES (${identityId}, 'human', ${personId})`,
      sql`INSERT INTO public.participants (id, identity_id) VALUES (${participantId}, ${identityId})`,
      sql`INSERT INTO public.accounts (id, identity_id, status) VALUES (${accountId}, ${identityId}, 'ACTIVE')`
    ]);
    return json({service:"Zalagren",status:"provisioned",personId,identityId,participantId,accountId,next:"credential_and_session_authentication"},201);
  } catch (error) {
    return json({error:error instanceof Error?error.message:"PROVISIONING_FAILED"},500);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null,{status:204,headers:headers({"access-control-allow-origin":"*","access-control-allow-headers":"content-type, authorization","access-control-allow-methods":"GET,POST,OPTIONS"})});
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") return renderHome(headers);
    if (request.method === "GET" && url.pathname === "/api/health") return health(env);
    if (request.method === "GET" && url.pathname === "/api/foundation") return foundation(env);
    if (request.method === "GET" && url.pathname === "/api/home/communities") return homeCommunities(request, env);
    if (request.method === "GET" && url.pathname === "/api/home/services") return homeServices(request, env);
    if (request.method === "GET" && url.pathname === "/api/home/foundation") return homeFoundation(request, env);
    if (request.method === "GET" && url.pathname === "/api/me") return me(request, env);
    if (request.method === "POST" && url.pathname === "/api/auth/sign-up/email") return authMutation(request, env, "/sign-up/email");
    if (request.method === "POST" && url.pathname === "/api/auth/sign-in/email") return authMutation(request, env, "/sign-in/email");
    if (request.method === "POST" && url.pathname === "/api/auth/email/verification/send") return sendEmailVerification(request, env);
    if (request.method === "POST" && url.pathname === "/api/identity/legal") return saveLegalIdentity(request, env);
    if (request.method === "POST" && url.pathname === "/api/contact/phone/start") return startPhoneVerification(request, env);
    if (request.method === "POST" && url.pathname === "/api/contact/phone/verify") return verifyPhone(request, env);
    if (request.method === "POST" && url.pathname === "/api/auth/sign-out") {
      try {
        const upstream = await providerRequest(request, env, "/sign-out");
        const setCookies = providerCookies(upstream);
        const outHeaders = headers({"content-type":"application/json; charset=utf-8"});
        for (const cookie of setCookies) outHeaders.append("set-cookie", cookie.replace(/;\s*Domain=[^;]+/gi,"").replace(/;\s*Path=\/[^;]*/i,"; Path=/"));
        return new Response(JSON.stringify({service:"Zalagren",status:"signed_out"}),{status:upstream.status,headers:outHeaders});
      } catch (error) {
        return json({error:error instanceof Error?error.message:"SIGN_OUT_FAILED"},500);
      }
    }
    if (request.method === "POST" && url.pathname === "/api/onboarding/participant") return bootstrapParticipant(request,env);
    return json({service:"Zalagren",error:"NOT_FOUND"},404);
  }
};
