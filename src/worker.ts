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
    WHERE am.kind = 'email' AND am.identifier = ${email} AND am.status <> 'revoked'
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

    if (endpoint === "/sign-in/email" && user && !Boolean(user.emailVerified)) {
      let verificationRequested = false;
      try {
        const verification = await providerRequest(
          request,
          env,
          "/send-verification-email",
          { email: String(user.email).trim().toLowerCase(), callbackURL: new URL("/", request.url).toString() }
        );
        verificationRequested = verification.ok;
      } catch {}
      return json(
        { service: "Zalagren", error: "EMAIL_NOT_VERIFIED", verificationRequested },
        403
      );
    }

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
    const identityRows = await sql`SELECT i.id FROM public.identities i JOIN public.participants p ON p.identity_id=i.id WHERE p.id=${participantId} LIMIT 1`;
    if (!identityRows.length) return json({service:"Zalagren",error:"IDENTITY_NOT_FOUND"},404);
    const identity = identityRows[0].id;
    const documentNumber = input.documentType === "zalagren_identity"
      ? "ZLG-" + participantId.replace(/[^a-zA-Z0-9]/g, "").slice(-24).toUpperCase()
      : input.documentNumber.trim();
    const documentHash = await sha256Hex(documentNumber.toUpperCase());
    const encrypted = await encryptSensitive(documentNumber, env);
    const nationalIdentifier = String((input as any).nationalIdentifier || "").trim();
    const nationalIdentifierHash = nationalIdentifier ? await sha256Hex(nationalIdentifier.toUpperCase()) : null;
    const nationalIdentifierEncrypted = nationalIdentifier ? await encryptSensitive(nationalIdentifier, env) : null;
    const documentSerial = String((input as any).documentSerialNumber || "").trim();
    const documentSerialHash = documentSerial ? await sha256Hex(documentSerial.toUpperCase()) : null;
    const documentSerialEncrypted = documentSerial ? await encryptSensitive(documentSerial, env) : null;
    const docId = "identity-document-" + crypto.randomUUID();
    const profileId = "legal-identity-" + participantId;
    const profile = await sql`
      INSERT INTO public.legal_identity_profiles (
        id, participant_id, legal_name, given_names, middle_names, family_name, date_of_birth, sex,
        nationality, birth_country_code, birth_place, country_of_residence, residence_country_code,
        address_line1, address_line2, city, region, postal_code, status, updated_at
      ) VALUES (
        ${profileId}, ${participantId}, ${input.legalName.trim()}, ${input.givenNames?.trim() || null},
        ${input.middleNames?.trim() || null}, ${input.familyName?.trim() || null}, ${input.dateOfBirth || null},
        ${input.sex?.trim() || null}, ${input.nationalityCountryCode ? normalizeCountryCode(input.nationalityCountryCode) : null},
        ${input.birthCountryCode ? normalizeCountryCode(input.birthCountryCode) : null}, ${input.birthPlace?.trim() || null},
        ${input.residenceCountryCode ? normalizeCountryCode(input.residenceCountryCode) : null},
        ${input.residenceCountryCode ? normalizeCountryCode(input.residenceCountryCode) : null},
        ${input.addressLine1?.trim() || null}, ${input.addressLine2?.trim() || null}, ${input.city?.trim() || null},
        ${input.region?.trim() || null}, ${input.postalCode?.trim() || null}, 'pending', now()
      )
      ON CONFLICT (participant_id) DO UPDATE SET
        legal_name=EXCLUDED.legal_name, given_names=EXCLUDED.given_names, middle_names=EXCLUDED.middle_names,
        family_name=EXCLUDED.family_name, date_of_birth=EXCLUDED.date_of_birth, sex=EXCLUDED.sex,
        nationality=EXCLUDED.nationality, birth_country_code=EXCLUDED.birth_country_code, birth_place=EXCLUDED.birth_place,
        country_of_residence=EXCLUDED.country_of_residence, residence_country_code=EXCLUDED.residence_country_code,
        address_line1=EXCLUDED.address_line1, address_line2=EXCLUDED.address_line2, city=EXCLUDED.city,
        region=EXCLUDED.region, postal_code=EXCLUDED.postal_code, status='pending', updated_at=now()
      RETURNING participant_id, legal_name, status
    `;
    await sql`
      INSERT INTO public.identity_documents (
        id, identity_id, document_type, issuing_country_code, issuing_authority,
        document_number_ciphertext, document_number_hash, document_number_last4,
        national_identifier_ciphertext, national_identifier_hash, national_identifier_last4,
        document_serial_ciphertext, document_serial_hash, document_serial_last4, issue_place,
        issue_date, expiry_date, status, verification_method, updated_at
      ) VALUES (
        ${docId}, ${identity}, ${input.documentType}, ${normalizeCountryCode(input.issuingCountryCode)},
        ${input.issuingAuthority?.trim() || null}, ${encrypted}, ${documentHash}, ${documentNumber.slice(-4)},
        ${nationalIdentifierEncrypted}, ${nationalIdentifierHash}, ${nationalIdentifier ? nationalIdentifier.slice(-4) : null},
        ${documentSerialEncrypted}, ${documentSerialHash}, ${documentSerial ? documentSerial.slice(-4) : null},
        ${(input as any).issuePlace?.trim() || null}, ${input.issueDate || null}, ${input.expiryDate || null}, 'pending', null, now()
      )
      ON CONFLICT (identity_id, document_number_hash) DO UPDATE SET
        document_number_ciphertext=EXCLUDED.document_number_ciphertext,
        document_number_last4=EXCLUDED.document_number_last4,
        national_identifier_ciphertext=EXCLUDED.national_identifier_ciphertext,
        national_identifier_hash=EXCLUDED.national_identifier_hash,
        national_identifier_last4=EXCLUDED.national_identifier_last4,
        document_serial_ciphertext=EXCLUDED.document_serial_ciphertext,
        document_serial_hash=EXCLUDED.document_serial_hash,
        document_serial_last4=EXCLUDED.document_serial_last4,
        issue_place=EXCLUDED.issue_place, issue_date=EXCLUDED.issue_date, expiry_date=EXCLUDED.expiry_date,
        status='pending', updated_at=now()
    `;
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
    const rows=await sql`SELECT i.id FROM public.identities i JOIN public.participants p ON p.identity_id=i.id WHERE p.id=${participantId} LIMIT 1`;
    if(!rows.length) return json({service:"Zalagren",error:"IDENTITY_NOT_FOUND"},404);
    const hash=await sha256Hex(phone);
    const contactId="identity-contact-"+crypto.randomUUID();
    await sql`INSERT INTO public.identity_contacts(id,identity_id,kind,value_normalized,value_hash,status,is_primary,updated_at)
      VALUES(${contactId},${rows[0].id},'phone',${phone},${hash},'pending',false,now())
      ON CONFLICT (kind,value_hash) DO UPDATE SET identity_id=EXCLUDED.identity_id,status='pending',updated_at=now()`;
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
    const rows=await sql`SELECT i.id FROM public.identities i JOIN public.participants p ON p.identity_id=i.id WHERE p.id=${participantId} LIMIT 1`;
    if(!rows.length) return json({service:"Zalagren",error:"IDENTITY_NOT_FOUND"},404);
    const identity=rows[0].id, hash=await sha256Hex(phone);
    const contactId="identity-contact-"+crypto.randomUUID(), methodId="auth-method-phone-"+crypto.randomUUID(), credentialId="credential-phone-"+crypto.randomUUID();
    await sql.transaction([
      sql`UPDATE public.identity_contacts SET status='revoked',is_primary=false,updated_at=now() WHERE identity_id=${identity} AND kind='phone' AND status='active' AND value_hash<>${hash}`,
      sql`INSERT INTO public.identity_contacts(id,identity_id,kind,value_normalized,value_hash,status,verified_at,is_primary,updated_at)
          VALUES(${contactId},${identity},'phone',${phone},${hash},'active',now(),true,now())
          ON CONFLICT (kind,value_hash) DO UPDATE SET identity_id=EXCLUDED.identity_id,status='active',verified_at=now(),is_primary=true,updated_at=now()`,
      sql`INSERT INTO public.auth_methods(id,identity_id,kind,identifier,status,verified_at)
          VALUES(${methodId},${identity},'phone',${phone},'active',now())
          ON CONFLICT DO NOTHING`,
      sql`INSERT INTO public.credentials(id,kind,status,account_id)
          SELECT ${credentialId},'phone','ACTIVE',a.id FROM public.accounts a WHERE a.identity_id=${identity}
          ON CONFLICT DO NOTHING`,
      sql`INSERT INTO public.identity_verification_records(id,identity_id,target_type,target_id,method,status,external_reference,completed_at)
          VALUES('identity-verification-'+crypto.randomUUID(),${identity},'phone',${methodId},'twilio-verify','verified',${payload?.sid||null},now())`
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


async function domainEvent(sql: DbSql, participantId: string, type: string, source: string, contextId?: string) {
  const eventId = "event-" + crypto.randomUUID();
  await sql`INSERT INTO public.events(id,type,context_id,actor_id,source,occurred_at,state,version)
    VALUES(${eventId},${type},${contextId || null},${participantId},${source},now(),'COMPLETED',1)`;
  return eventId;
}

async function participantIdFromSession(request: Request, env: Env): Promise<{active:any; participantId:string; sql:DbSql}> {
  const active=await requireActive(request,env);
  const participantId=active.canonical.participant_id || active.canonical.participantId;
  return {active,participantId,sql:requireDatabase(env)};
}

async function listParticipation(request: Request, env: Env): Promise<Response> {
  try {
    const {participantId,sql}=await participantIdFromSession(request,env);
    const [communities, memberships, listings, rides, foodOrders] = await Promise.all([
      sql`SELECT id,name,type,location,verification FROM public.communities ORDER BY created_at DESC LIMIT 100`,
      sql`SELECT cp.*,c.name community_name FROM public.community_participations cp JOIN public.communities c ON c.id=cp.community_id WHERE cp.participant_id=${participantId} ORDER BY cp.created_at DESC`,
      sql`SELECT * FROM public.marketplace_listings WHERE participant_id=${participantId} ORDER BY created_at DESC`,
      sql`SELECT * FROM public.beatride_requests WHERE participant_id=${participantId} ORDER BY created_at DESC`,
      sql`SELECT * FROM public.beatfood_orders WHERE participant_id=${participantId} ORDER BY created_at DESC`
    ]);
    return json({service:"Zalagren",participantId,communities,memberships,listings,rides,foodOrders});
  } catch(e){const m=e instanceof Error?e.message:"PARTICIPATION_LOOKUP_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:500);}
}

async function joinCommunity(request: Request, env: Env): Promise<Response> {
  try {
    const {participantId,sql}=await participantIdFromSession(request,env);
    const body=await request.json() as {communityId?:string;role?:string};
    if(!body.communityId) return json({service:"Zalagren",error:"COMMUNITY_REQUIRED"},400);
    const exists=await sql`SELECT id FROM public.communities WHERE id=${body.communityId} LIMIT 1`;
    if(!exists.length) return json({service:"Zalagren",error:"COMMUNITY_NOT_FOUND"},404);
    const id="participation-"+crypto.randomUUID();
    const rows=await sql`INSERT INTO public.community_participations(id,community_id,participant_id,role,status,source)
      VALUES(${id},${body.communityId},${participantId},${String(body.role||"member").trim()},'pending','participant_request')
      ON CONFLICT(community_id,participant_id) DO UPDATE SET role=EXCLUDED.role,status='pending',source='participant_request'
      RETURNING *`;
    await domainEvent(sql,participantId,"community.participation.requested","zalagren-worker");
    return json({service:"Zalagren",status:"participation_requested",participation:rows[0]},201);
  } catch(e){const m=e instanceof Error?e.message:"COMMUNITY_JOIN_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}

async function communityPlans(request: Request, env: Env): Promise<Response> {
  try {
    const {sql}=await participantIdFromSession(request,env);
    const body=await request.json().catch(()=>({})) as {communityId?:string};
    if(!body.communityId) return json({service:"Zalagren",error:"COMMUNITY_REQUIRED"},400);
    const plans=await sql`SELECT * FROM public.community_subscription_plans WHERE community_id=${body.communityId} AND status='active' ORDER BY created_at`;
    return json({service:"Zalagren",plans});
  } catch(e){const m=e instanceof Error?e.message:"COMMUNITY_PLANS_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}

async function requestCommunitySubscription(request: Request, env: Env): Promise<Response> {
  try {
    const {participantId,sql}=await participantIdFromSession(request,env);
    const body=await request.json().catch(()=>({})) as {communityId?:string;planId?:string};
    if(!body.communityId) return json({service:"Zalagren",error:"COMMUNITY_REQUIRED"},400);
    const id="community-subscription-"+crypto.randomUUID();
    const rows=await sql`INSERT INTO public.community_subscription_requests(id,community_id,participant_id,plan_id,status)
      VALUES(${id},${body.communityId},${participantId},${body.planId||null},'pending')
      ON CONFLICT(community_id,participant_id,plan_id) DO UPDATE SET status='pending',updated_at=now()
      RETURNING *`;
    await domainEvent(sql,participantId,"community.subscription.requested","zalagren-worker");
    return json({service:"Zalagren",status:"subscription_requested",subscription:rows[0]},201);
  } catch(e){const m=e instanceof Error?e.message:"COMMUNITY_SUBSCRIPTION_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}

async function createMarketplaceListing(request: Request, env: Env): Promise<Response> {
  try {
    const {participantId,sql}=await participantIdFromSession(request,env);
    const b=await request.json() as {title?:string;description?:string;category?:string;priceMinor?:number;currency?:string;communityId?:string};
    if(!b.title?.trim()||!b.description?.trim()||!b.category?.trim()) return json({service:"Zalagren",error:"LISTING_FIELDS_REQUIRED"},400);
    if(b.priceMinor!==undefined && (!Number.isInteger(b.priceMinor)||b.priceMinor<0)) return json({service:"Zalagren",error:"INVALID_PRICE"},400);
    const id="listing-"+crypto.randomUUID();
    const rows=await sql`INSERT INTO public.marketplace_listings(id,participant_id,community_id,title,description,category,price_minor,currency,status)
      VALUES(${id},${participantId},${b.communityId||null},${b.title.trim()},${b.description.trim()},${b.category.trim()},${b.priceMinor??null},${b.currency||null},'published') RETURNING *`;
    await domainEvent(sql,participantId,"marketplace.listing.created","zalagren-worker");
    return json({service:"Zalagren",status:"listing_created",listing:rows[0]},201);
  } catch(e){const m=e instanceof Error?e.message:"MARKETPLACE_CREATE_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}

async function listMarketplace(request: Request, env: Env): Promise<Response> {
  try {const {sql}=await participantIdFromSession(request,env);const u=new URL(request.url);const communityId=u.searchParams.get("communityId");const rows=communityId?await sql`SELECT * FROM public.marketplace_listings WHERE status='published' AND (community_id=${communityId} OR community_id IS NULL) ORDER BY created_at DESC LIMIT 100`:await sql`SELECT * FROM public.marketplace_listings WHERE status='published' ORDER BY created_at DESC LIMIT 100`;return json({service:"Zalagren",items:rows});}
  catch(e){const m=e instanceof Error?e.message:"MARKETPLACE_LOOKUP_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:500);}
}

async function createBeatFoodMerchant(request: Request, env: Env): Promise<Response> {
  try {const {participantId,sql}=await participantIdFromSession(request,env);const b=await request.json() as {name?:string;communityId?:string};if(!b.name?.trim())return json({service:"Zalagren",error:"MERCHANT_NAME_REQUIRED"},400);const id="food-merchant-"+crypto.randomUUID();const rows=await sql`INSERT INTO public.beatfood_merchants(id,participant_id,community_id,name,status) VALUES(${id},${participantId},${b.communityId||null},${b.name.trim()},'active') RETURNING *`;await domainEvent(sql,participantId,"beatfood.merchant.created","zalagren-worker");return json({service:"Zalagren",status:"merchant_created",merchant:rows[0]},201);}
  catch(e){const m=e instanceof Error?e.message:"BEATFOOD_MERCHANT_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}

async function createBeatFoodItem(request: Request, env: Env): Promise<Response> {
  try {const {participantId,sql}=await participantIdFromSession(request,env);const b=await request.json() as {merchantId?:string;name?:string;description?:string;priceMinor?:number;currency?:string};if(!b.merchantId||!b.name?.trim()||!Number.isInteger(b.priceMinor)||Number(b.priceMinor)<0)return json({service:"Zalagren",error:"FOOD_ITEM_FIELDS_REQUIRED"},400);const owner=await sql`SELECT id FROM public.beatfood_merchants WHERE id=${b.merchantId} AND participant_id=${participantId} LIMIT 1`;if(!owner.length)return json({service:"Zalagren",error:"MERCHANT_NOT_OWNED"},403);const id="food-item-"+crypto.randomUUID();const rows=await sql`INSERT INTO public.beatfood_items(id,merchant_id,name,description,price_minor,currency) VALUES(${id},${b.merchantId},${b.name.trim()},${b.description?.trim()||null},${b.priceMinor},${b.currency||"KES"}) RETURNING *`;await domainEvent(sql,participantId,"beatfood.item.created","zalagren-worker");return json({service:"Zalagren",status:"food_item_created",item:rows[0]},201);}
  catch(e){const m=e instanceof Error?e.message:"BEATFOOD_ITEM_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}

async function createBeatFoodOrder(request: Request, env: Env): Promise<Response> {
  try {const {participantId,sql}=await participantIdFromSession(request,env);const b=await request.json() as {merchantId?:string;communityId?:string;items?:Array<{itemId:string;quantity:number}>;idempotencyKey?:string};if(!b.merchantId||!b.items?.length||!b.idempotencyKey)return json({service:"Zalagren",error:"FOOD_ORDER_FIELDS_REQUIRED"},400);const ids=b.items.map(x=>x.itemId);const items=await sql`SELECT id,price_minor,currency FROM public.beatfood_items WHERE merchant_id=${b.merchantId} AND available=true AND id = ANY(${ids})`;if(items.length!==ids.length)return json({service:"Zalagren",error:"FOOD_ITEM_NOT_AVAILABLE"},409);const byId=new Map(items.map(x=>[x.id,x]));let total=0;for(const x of b.items){if(!Number.isInteger(x.quantity)||x.quantity<1)return json({service:"Zalagren",error:"INVALID_QUANTITY"},400);total+=Number(byId.get(x.itemId).price_minor)*x.quantity;}const orderId="food-order-"+crypto.randomUUID();const rows=await sql`INSERT INTO public.beatfood_orders(id,participant_id,merchant_id,community_id,status,total_minor,currency,idempotency_key) VALUES(${orderId},${participantId},${b.merchantId},${b.communityId||null},'requested',${total},${items[0].currency||"KES"},${b.idempotencyKey}) ON CONFLICT(participant_id,idempotency_key) DO UPDATE SET updated_at=now() RETURNING *`;for(const x of b.items) await sql`INSERT INTO public.beatfood_order_items(id,order_id,item_id,quantity,unit_price_minor) VALUES('food-order-item-'||gen_random_uuid()::text,${rows[0].id},${x.itemId},${x.quantity},${byId.get(x.itemId).price_minor}) ON CONFLICT DO NOTHING`;await domainEvent(sql,participantId,"beatfood.order.requested","zalagren-worker");return json({service:"Zalagren",status:"food_order_requested",order:rows[0]},201);}
  catch(e){const m=e instanceof Error?e.message:"BEATFOOD_ORDER_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}

async function createBeatRideProfile(request: Request, env: Env): Promise<Response> {
  try {const {participantId,sql}=await participantIdFromSession(request,env);const b=await request.json() as {role?:string;displayName?:string;communityId?:string};if(!b.role||!b.displayName?.trim())return json({service:"Zalagren",error:"RIDE_PROFILE_FIELDS_REQUIRED"},400);const role=["rider","driver","provider"].includes(b.role)?b.role:null;if(!role)return json({service:"Zalagren",error:"INVALID_RIDE_ROLE"},400);const id="ride-profile-"+crypto.randomUUID();const rows=await sql`INSERT INTO public.beatride_profiles(id,participant_id,community_id,role,display_name,status) VALUES(${id},${participantId},${b.communityId||null},${role},${b.displayName.trim()},'active') RETURNING *`;await domainEvent(sql,participantId,"beatride.profile.created","zalagren-worker");return json({service:"Zalagren",status:"ride_profile_created",profile:rows[0]},201);}
  catch(e){const m=e instanceof Error?e.message:"BEATRIDE_PROFILE_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}

async function requestBeatRide(request: Request, env: Env): Promise<Response> {
  try {const {participantId,sql}=await participantIdFromSession(request,env);const b=await request.json() as {pickup?:string;destination?:string;communityId?:string};if(!b.pickup?.trim()||!b.destination?.trim())return json({service:"Zalagren",error:"RIDE_ROUTE_REQUIRED"},400);const id="ride-request-"+crypto.randomUUID();const rows=await sql`INSERT INTO public.beatride_requests(id,participant_id,community_id,pickup_text,destination_text,status) VALUES(${id},${participantId},${b.communityId||null},${b.pickup.trim()},${b.destination.trim()},'requested') RETURNING *`;await domainEvent(sql,participantId,"beatride.requested","zalagren-worker");return json({service:"Zalagren",status:"ride_requested",ride:rows[0],provider:"none"} ,201);}
  catch(e){const m=e instanceof Error?e.message:"BEATRIDE_REQUEST_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}

async function submitCommunityProposal(request: Request, env: Env): Promise<Response> {
  try {const {participantId,sql}=await participantIdFromSession(request,env);const b=await request.json() as {communityId?:string;proposalType?:string;title?:string;description?:string};if(!b.communityId||!b.title?.trim()||!b.description?.trim())return json({service:"Zalagren",error:"COMMUNITY_PROPOSAL_FIELDS_REQUIRED"},400);const community=await sql`SELECT id,name FROM public.communities WHERE id=${b.communityId} LIMIT 1`;if(!community.length)return json({service:"Zalagren",error:"COMMUNITY_NOT_FOUND"},404);const id="community-proposal-"+crypto.randomUUID();const rows=await sql`INSERT INTO public.community_proposals(id,community_id,participant_id,proposal_type,title,description,status) VALUES(${id},${b.communityId},${participantId},${b.proposalType||"service"},${b.title.trim()},${b.description.trim()},'pending') RETURNING *`;await domainEvent(sql,participantId,"community.proposal.submitted","zalagren-worker");return json({service:"Zalagren",status:"proposal_submitted",community:community[0],proposal:rows[0]},201);}
  catch(e){const m=e instanceof Error?e.message:"COMMUNITY_PROPOSAL_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}

async function proposeCommunityOnboarding(request: Request, env: Env): Promise<Response> {
  try {const {participantId,sql}=await participantIdFromSession(request,env);const b=await request.json() as {communityId?:string;communityName?:string;nodeName?:string;proposal?:string;planCode?:string;seats?:number};if(!b.communityName?.trim()||!b.proposal?.trim())return json({service:"Zalagren",error:"COMMUNITY_ONBOARDING_FIELDS_REQUIRED"},400);const id="community-onboarding-"+crypto.randomUUID();const req=await sql`INSERT INTO public.community_onboarding_requests(id,community_id,requested_by_participant_id,community_name,node_name,proposal) VALUES(${id},${b.communityId||null},${participantId},${b.communityName.trim()},${b.nodeName?.trim()||null},${b.proposal.trim()}) RETURNING *`;let subscription=null;if(b.communityId&&b.planCode){const sid="platform-subscription-"+crypto.randomUUID();const rows=await sql`INSERT INTO public.platform_community_subscriptions(id,community_id,requested_by_participant_id,plan_code,status,seats) VALUES(${sid},${b.communityId},${participantId},${b.planCode},'proposed',${b.seats||null}) RETURNING *`;subscription=rows[0];}await domainEvent(sql,participantId,"community.onboarding.proposed","zalagren-worker");return json({service:"Zalagren",status:"community_onboarding_submitted",request:req[0],subscription});}
  catch(e){const m=e instanceof Error?e.message:"COMMUNITY_ONBOARDING_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}


async function requireCommunityRepresentative(request: Request, env: Env, communityId: string) {
  const {participantId,sql}=await participantIdFromSession(request,env);
  if(!communityId?.trim()) throw new Error("COMMUNITY_REQUIRED");
  const rows=await sql`SELECT cr.*,c.name AS community_name FROM public.community_representatives cr JOIN public.communities c ON c.id=cr.community_id WHERE cr.community_id=${{communityId} AND cr.participant_id=${{participantId} AND cr.status='active' LIMIT 1`;
  if(!rows.length) throw new Error("COMMUNITY_REPRESENTATIVE_REQUIRED");
  return {participantId,sql,representation:rows[0]};
}
async function communityManagement(request: Request, env: Env): Promise<Response> {
  try {
    const communityId=new URL(request.url).searchParams.get("communityId")||"";
    const {participantId,sql}=await participantIdFromSession(request,env);
    if(!communityId){
      const communities=await sql`SELECT cr.id AS representation_id,cr.community_id,cr.role,cr.status,c.name,c.type,c.location,c.verification FROM public.community_representatives cr JOIN public.communities c ON c.id=cr.community_id WHERE cr.participant_id=${participantId} AND cr.status='active' ORDER BY c.name`;
      return json({service:"Zalagren",communities});
    }
    const {representation}=await requireCommunityRepresentative(request,env,communityId);
    const [community,onboarding,proposals,subscriptions,participations,serviceBindings,capabilityBindings,places,serviceCatalog,capabilityCatalog,representatives]=await Promise.all([
      sql`SELECT * FROM public.communities WHERE id=${{communityId} LIMIT 1`,
      sql`SELECT * FROM public.community_onboarding_requests WHERE community_id=${{communityId} AND status IN ('submitted','pending') ORDER BY created_at DESC`,
      sql`SELECT * FROM public.community_proposals WHERE community_id=${{communityId} AND status='pending' ORDER BY created_at DESC`,
      sql`SELECT * FROM public.platform_community_subscriptions WHERE community_id=${{communityId} ORDER BY created_at DESC`,
      sql`SELECT cp.*,p.id AS requester_participant_id FROM public.community_participations cp JOIN public.participants p ON p.id=cp.participant_id WHERE cp.community_id=${{communityId} AND cp.status='pending' ORDER BY cp.created_at DESC`,
      sql`SELECT b.*,s.name AS service_name,s.domain,s.status AS service_status FROM public.community_service_bindings b JOIN public.services s ON s.id=b.service_id WHERE b.community_id=${{communityId} ORDER BY s.name`,
      sql`SELECT b.*,c.name AS capability_name,c.action,c.service_id,c.resource_type FROM public.community_capability_bindings b JOIN public.capabilities c ON c.id=b.capability_id WHERE b.community_id=${{communityId} ORDER BY c.name`,
      sql`SELECT * FROM public.places WHERE community_id=${{communityId} ORDER BY created_at DESC`,
      sql`SELECT * FROM public.services ORDER BY name`,
      sql`SELECT c.* FROM public.capabilities c JOIN public.services s ON s.id=c.service_id ORDER BY s.name,c.name`,
      sql`SELECT * FROM public.community_representatives WHERE community_id=${{communityId} ORDER BY created_at`
    ]);
    return json({service:"Zalagren",community:community[0]||null,representative, onBoarding:onboarding,proposals,subscriptions,participations,serviceBindings,capabilityBindings,places,serviceCatalog,capabilityCatalog,representatives});
  } catch(e) { const m=e instanceof Error?e.message:"COMMUNITY_MANAGEMENT_FAILED"; return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:m==="COMMUNITY_REPRESENTATIVE_REQUIRED"?403:400); }
}
async function requestRepresentative(request: Request, env: Env): Promise<Response> {
  try {
    const {participantId,sql}=await participantIdFromSession(request,env);
    const b=await request.json() as {communityId?:string;role?:string};
    if(!b.communityId) return json({service:"Zalagren",error:"COMMUNITY_REQUIRED"},400);
    const c=await sql`SELECT id FROM public.communities WHERE id=${{b.communityId} LIMIT 1`;
    if(!c.length) return json({service:"Zalagren",error:"COMMUNITY_NOT_FOUND"},404);
    const id="community-representative-"+crypto.randomUUID();
    const rows=await sql`INSERT INTO public.community_representatives(id,community_id,participant_id,role,status,source) VALUES(${{id},${{b.communityId},${{participantId},${{b.role||"representative"},'pending','representative_request') ON CONFLICT(community_id,participant_id) DO UPDATE SET role=EXCLUDED.role,status='pending',source='representative_request',updated_at=now() RETURNING *`;
    await domainEvent(sql,participantId,"community.representative.requested","zalagren-worker");
    return json({service:"Zalagren",status:"representative_request_submitted",representation:rows[0]},201);
  } catch(e){const m=e instanceof Error?e.message:"REPRESENTATIVE_REQUEST_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}
async function communityOnboardingDecision(request: Request, env: Env): Promise<Response> {
  try {
    const b=await request.json() as {communityId?:string;requestId?:string;decision?:string};
    if(!b.communityId||!b.requestId||!["approved","rejected"].includes(b.decision||"")) return json({service:"Zalagren",error:"ONBOARDING_DECISION_FIELDS_REQUIRED"},400);
    const {participantId,sql}=await requireCommunityRepresentative(request,env,b.communityId);
    const rows=await sql`UPDATE public.community_onboarding_requests SET status=${{b.decision} WHERE id=${{b.requestId} AND community_id=${{b.communityId} AND status IN ('submitted','pending') RETURNING *`;
    if(!rows.length) return json({service:"Zalagren",error:"ONBOARDING_REQUEST_NOT_FOUND"},404);
    await domainEvent(sql,participantId,"community.onboarding."+b.decision,"zalagren-community-management");
    return json({service:"Zalagren",status:"onboarding_"+b.decision,request:rows[0]});
  } catch(e){const m=e instanceof Error?e.message:"ONBOARDING_DECISION_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:m==="COMMUNITY_REPRESENTATIVE_REQUIRED"?403:400);}
}
async function communitySubscriptionDecision(request: Request, env: Env): Promise<Response> {
  try {
    const b=await request.json() as {communityId?:string;subscriptionId?:string;decision?:string};
    if(!b.communityId||!b.subscriptionId||!["approved","rejected"].includes(b.decision||"")) return json({service:"Zalagren",error:"SUBSCRIPTION_DECISION_FIELDS_REQUIRED"},400);
    const {participantId,sql}=await requireCommunityRepresentative(request,env,b.communityId);
    const rows=await sql`UPDATE public.platform_community_subscriptions SET status=${{b.decision},updated_at=now(),starts_at=CASE WHEN ${{b.decision}='approved' THEN COALESCE(starts_at,now()) ELSE starts_at END WHERE id=${{b.subscriptionId} AND community_id=${{b.communityId} AND status IN ('proposed','pending') RETURNING *`;
    if(!rows.length) return json({service:"Zalagren",error:"SUBSCRIPTION_NOT_FOUND"},404);
    await domainEvent(sql,participantId,"community.subscription."+b.decision,"zalagren-community-management");
    return json({service:"Zalagren",status:"subscription_"+b.decision,subscription:rows[0],billing:"No payment provider execution is claimed by this approval."});
  } catch(e){const m=e instanceof Error?e.message:"SUBSCRIPTION_DECISION_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:m==="COMMUNITY_REPRESENTATIVE_REQUIRED"?403:400);}
}
async function communityServiceBinding(request: Request, env: Env): Promise<Response> {
  try {
    const b=await request.json() as {communityId?:string;serviceId?:string;status?:string;settings?:unknown};
    if(!b.communityId||!b.serviceId||!["active","disabled"].includes(b.status||"")) return json({service:"Zalagren",error:"SERVICE_BINDING_FIELDS_REQUIRED"},400);
    const {participantId,sql}=await requireCommunityRepresentative(request,env,b.communityId);
    const service=await sql`SELECT id FROM public.services WHERE id=${{b.serviceId} LIMIT 1`;
    if(!service.length) return json({service:"Zalagren",error:"SERVICE_NOT_FOUND"},404);
    const id="community-service-"+crypto.randomUUID();
    const rows=await sql`INSERT INTO public.community_service_bindings(id,community_id,service_id,status,settings,created_by_participant_id) VALUES(${{id},${{b.communityId},${{b.serviceId},${{b.status},${{JSON.stringify(b.settings||{})}::jsonb,${{participantId}) ON CONFLICT(community_id,service_id) DO UPDATE SET status=EXCLUDED.status,settings=EXCLUDED.settings,updated_at=now() RETURNING *`;
    await domainEvent(sql,participantId,"community.service."+b.status,"zalagren-community-management");
    return json({service:"Zalagren",status:"service_binding_saved",binding:rows[0]},201);
  } catch(e){const m=e instanceof Error?e.message:"SERVICE_BINDING_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:m==="COMMUNITY_REPRESENTATIVE_REQUIRED"?403:400);}
}
async function communityCapabilityBinding(request: Request, env: Env): Promise<Response> {
  try {
    const b=await request.json() as {communityId?:string;capabilityId?:string;status?:string;scope?:unknown};
    if(!b.communityId||!b.capabilityId||!["active","disabled"].includes(b.status||"")) return json({service:"Zalagren",error:"CAPABILITY_BINDING_FIELDS_REQUIRED"},400);
    const {participantId,sql}=await requireCommunityRepresentative(request,env,b.communityId);
    const cap=await sql`SELECT id,service_id FROM public.capabilities WHERE id=${{b.capabilityId} LIMIT 1`;
    if(!cap.length) return json({service:"Zalagren",error:"CAPABILITY_NOT_FOUND"},404);
    const service=await sql`SELECT id FROM public.community_service_bindings WHERE community_id=${{b.communityId} AND service_id=${{cap[0].service_id} AND status='active' LIMIT 1`;
    if(!service.length) return json({service:"Zalagren",error:"SERVICE_MUST_BE_ACTIVE_FIRST"},409);
    const id="community-capability-"+crypto.randomUUID();
    const rows=await sql`INSERT INTO public.community_capability_bindings(id,community_id,capability_id,status,scope,created_by_participant_id) VALUES(${{id},${{b.communityId},${{b.capabilityId},${{b.status},${{JSON.stringify(b.scope||[])}::jsonb,${{participantId}) ON CONFLICT(community_id,capability_id) DO UPDATE SET status=EXCLUDED.status,scope=EXCLUDED.scope,updated_at=now() RETURNING *`;
    await domainEvent(sql,participantId,"community.capability."+b.status,"zalagren-community-management");
    return json({service:"Zalagren",status:"capability_binding_saved",binding:rows[0]},201);
  } catch(e){const m=e instanceof Error?e.message:"CAPABILITY_BINDING_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:m==="COMMUNITY_REPRESENTATIVE_REQUIRED"?403:400);}
}
async function communityPlaceCreate(request: Request, env: Env): Promise<Response> {
  try {
    const b=await request.json() as {communityId?:string;name?:string;type?:string;parentId?:string;latitude?:number;longitude?:number};
    if(!b.communityId||!b.name?.trim()||!b.type?.trim()) return json({service:"Zalagren",error:"PLACE_FIELDS_REQUIRED"},400);
    const {participantId,sql}=await requireCommunityRepresentative(request,env,b.communityId);
    if(b.parentId){
      const parent=await sql`SELECT community_id FROM public.places WHERE id=${{b.parentId} LIMIT 1`;
      if(!parent.length||parent[0].community_id!==b.communityId) return json({service:"Zalagren",error:"PLACE_PARENT_INVALID"},409);
    }
    const id="place-"+crypto.randomUUID();
    const rows=await sql`INSERT INTO public.places(id,community_id,name,type,parent_id,latitude,longitude,geometry_status) VALUES(${{id},${{b.communityId},${{b.name.trim()},${{b.type.trim()},${{b.parentId||null},${{Number.isFinite(b.latitude)?b.latitude:null},${{Number.isFinite(b.longitude)?b.longitude:null},'unverified') RETURNING *`;
    await domainEvent(sql,participantId,"community.place.created","zalagren-community-management");
    return json({service:"Zalagren",status:"place_created",place:rows[0]},201);
  } catch(e){const m=e instanceof Error?e.message:"PLACE_CREATE_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:m==="COMMUNITY_REPRESENTATIVE_REQUIRED"?403:400);}
}
async function communityParticipationDecision(request: Request, env: Env): Promise<Response> {
  try {
    const b=await request.json() as {communityId?:string;participationId?:string;decision?:string;role?:string;placeId?:string;capabilityIds?:string[]};
    if(!b.communityId||!b.participationId||!["approved","rejected"].includes(b.decision||"")) return json({service:"Zalagren",error:"PARTICIPATION_DECISION_FIELDS_REQUIRED"},400);
    const {participantId:issuerId,sql}=await requireCommunityRepresentative(request,env,b.communityId);
    const rows=await sql`SELECT * FROM public.community_participations WHERE id=${{b.participationId} AND community_id=${{b.communityId} AND status='pending' LIMIT 1`;
    if(!rows.length) return json({service:"Zalagren",error:"PARTICIPATION_REQUEST_NOT_FOUND"},404);
    const target=rows[0];
    if(b.decision==="rejected"){
      const rejected=await sql`UPDATE public.community_participations SET status='rejected' WHERE id=${{b.participationId} RETURNING *`;
      await domainEvent(sql,issuerId,"community.participation.rejected","zalagren-community-management");
      return json({service:"Zalagren",status:"participation_rejected",participation:rejected[0]});
    }
    const role=String(b.role||target.role||"member").trim();
    const capabilityIds=Array.isArray(b.capabilityIds)?Array.from(new Set(b.capabilityIds.filter(Boolean))):[];
    if(!capabilityIds.length) return json({service:"Zalagren",error:"CAPABILITY_APPROVAL_REQUIRED"},400);
    if(b.placeId){
      const place=await sql`SELECT id FROM public.places WHERE id=${{b.placeId} AND community_id=${{b.communityId} LIMIT 1`;
      if(!place.length) return json({service:"Zalagren",error:"PLACE_NOT_FOUND"},404);
    }
    const caps=await sql`SELECT c.id,c.action,c.name FROM public.capabilities c JOIN public.community_capability_bindings b ON b.capability_id=c.id WHERE b.community_id=${{b.communityId} AND b.status='active' AND c.id=ANY(${{capabilityIds})`;
    if(caps.length!==capabilityIds.length) return json({service:"Zalagren",error:"CAPABILITY_NOT_ENABLED_FOR_COMMUNITY"},409);
    const contextId="context-"+crypto.randomUUID();
    const state=JSON.stringify({source:"community_approval",approvedBy:issuerId,approvedAt:new Date().toISOString(),capabilities:caps.map((c:any)=>c.id)});
    const relationshipId="relationship-"+crypto.randomUUID();
    const statements=[
      sql`UPDATE public.community_participations SET status='active',role=${{role},starts_at=now() WHERE id=${{b.participationId}`,
      sql`INSERT INTO public.contexts(id,participant_id,community_id,place_id,role,purpose,active_at,state) VALUES(${{contextId},${{target.participant_id},${{b.communityId},${{b.placeId||null},${{role},'community_participation',now(),${{state}::jsonb)`,
      sql`INSERT INTO public.relationships(id,subject_id,relationship_type,object_id,status,valid_from) VALUES(${{relationshipId},${{target.participant_id},'community_participation',${{b.communityId},'active',now())`
    ];
    for(const c of caps) statements.push(sql`INSERT INTO public.authorizations(id,participant_id,context_id,capability_id,action,source,issued_by_participant_id,status) VALUES(${{"authorization-"+crypto.randomUUID()},${{target.participant_id},${{contextId},${{c.id},${{c.action},'explicit',${{issuerId},'active')`);
    await sql.transaction(statements);
    await domainEvent(sql,target.participant_id,"community.participation.approved","zalagren-community-management",contextId);
    return json({service:"Zalagren",status:"participation_approved",contextId,authorizationCount:caps.length,approvedBy:issuerId});
  } catch(e){const m=e instanceof Error?e.message:"PARTICIPATION_DECISION_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:m==="COMMUNITY_REPRESENTATIVE_REQUIRED"?403:400);}
}
async function communityProposalDecision(request: Request, env: Env): Promise<Response> {
  try {
    const b=await request.json() as {communityId?:string;proposalId?:string;decision?:string};
    if(!b.communityId||!b.proposalId||!["approved","rejected"].includes(b.decision||"")) return json({service:"Zalagren",error:"PROPOSAL_DECISION_FIELDS_REQUIRED"},400);
    const {participantId,sql}=await requireCommunityRepresentative(request,env,b.communityId);
    const rows=await sql`UPDATE public.community_proposals SET status=${{b.decision} WHERE id=${{b.proposalId} AND community_id=${{b.communityId} AND status='pending' RETURNING *`;
    if(!rows.length) return json({service:"Zalagren",error:"PROPOSAL_NOT_FOUND"},404);
    await domainEvent(sql,participantId,"community.proposal."+b.decision,"zalagren-community-management");
    return json({service:"Zalagren",status:"proposal_"+b.decision,proposal:rows[0]});
  } catch(e){const m=e instanceof Error?e.message:"PROPOSAL_DECISION_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:m==="COMMUNITY_REPRESENTATIVE_REQUIRED"?403:400);}
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
             EXISTS(SELECT 1 FROM public.identity_documents d WHERE d.identity_id=i.id AND d.status='verified') AS document_verified,
             EXISTS(SELECT 1 FROM public.legal_identity_profiles lp2 WHERE lp2.participant_id=p.id AND lp2.status='verified') AS legal_identity_verified
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
      verification: {
        email: Boolean(identityRows[0]?.email_verified),
        phone: Boolean(identityRows[0]?.phone_verified),
        document: Boolean(identityRows[0]?.document_verified),
        legalIdentity: Boolean(identityRows[0]?.legal_identity_verified)
      },
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
    if (request.method === "GET" && url.pathname === "/api/participation") return listParticipation(request, env);
    if (request.method === "GET" && url.pathname === "/api/community/management") return communityManagement(request, env);
    if (request.method === "POST" && url.pathname === "/api/community/representative/request") return requestRepresentative(request, env);
    if (request.method === "POST" && url.pathname === "/api/community/management/onboarding/decision") return communityOnboardingDecision(request, env);
    if (request.method === "POST" && url.pathname === "/api/community/management/subscription/decision") return communitySubscriptionDecision(request, env);
    if (request.method === "POST" && url.pathname === "/api/community/management/service") return communityServiceBinding(request, env);
    if (request.method === "POST" && url.pathname === "/api/community/management/capability") return communityCapabilityBinding(request, env);
    if (request.method === "POST" && url.pathname === "/api/community/management/place") return communityPlaceCreate(request, env);
    if (request.method === "POST" && url.pathname === "/api/community/management/participation/decision") return communityParticipationDecision(request, env);
    if (request.method === "POST" && url.pathname === "/api/community/management/proposal/decision") return communityProposalDecision(request, env);
    if (request.method === "POST" && url.pathname === "/api/participation/community/join") return joinCommunity(request, env);
    if (request.method === "POST" && url.pathname === "/api/community/plans") return communityPlans(request, env);
    if (request.method === "POST" && url.pathname === "/api/community/subscription") return requestCommunitySubscription(request, env);
    if (request.method === "POST" && url.pathname === "/api/community/proposal") return submitCommunityProposal(request, env);
    if (request.method === "POST" && url.pathname === "/api/community/onboarding") return proposeCommunityOnboarding(request, env);
    if (request.method === "GET" && url.pathname === "/api/marketplace") return listMarketplace(request, env);
    if (request.method === "POST" && url.pathname === "/api/marketplace/listing") return createMarketplaceListing(request, env);
    if (request.method === "POST" && url.pathname === "/api/beatfood/merchant") return createBeatFoodMerchant(request, env);
    if (request.method === "POST" && url.pathname === "/api/beatfood/item") return createBeatFoodItem(request, env);
    if (request.method === "POST" && url.pathname === "/api/beatfood/order") return createBeatFoodOrder(request, env);
    if (request.method === "POST" && url.pathname === "/api/beatride/profile") return createBeatRideProfile(request, env);
    if (request.method === "POST" && url.pathname === "/api/beatride/request") return requestBeatRide(request, env);
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
