import { neon } from "@neondatabase/serverless";
import { prepareProviderAuthRequest } from "./auth-proxy.js";
import { beginVerificationChallenge, recordVerificationAttempt, recordVerificationProviderResult } from "./beatone-verification.js";
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

async function providerRequest(
  request: Request,
  env: Env,
  endpoint: string,
  body?: unknown
): Promise<Response> {
  const isEmailOtp = endpoint === "/email-otp/send-verification-otp" || endpoint === "/email-otp/verify-email";
  const prepared = body === undefined
    ? { headers: new Headers({
        accept: "application/json",
        origin: request.headers.get("origin") || new URL(request.url).origin,
        ...(request.headers.get("cookie") ? { cookie: request.headers.get("cookie") as string } : {})
      }), body }
    : isEmailOtp
      ? {
          headers: new Headers({
            accept: "application/json",
            "content-type": "application/json",
            origin: request.headers.get("origin") || new URL(request.url).origin
          }),
          body
        }
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
  providerSessionValue: any
): Promise<{ participantId: string; accountId: string; sessionId: string; sessionToken: string; expiresAt: string }> {
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
    SET status = 'active',
        verified_at = CASE WHEN ${Boolean(user.emailVerified)} THEN COALESCE(verified_at, now()) ELSE verified_at END
    WHERE identity_id = ${identityId} AND kind = 'email' AND identifier = ${email} AND status <> 'revoked'
  `;

  const sessionId = "session-neon-" + crypto.randomUUID();
  const sessionToken = base64UrlFromBytes(crypto.getRandomValues(new Uint8Array(32)));
  const sessionTokenHash = await sha256Hex(sessionToken);
  const expiresAt =
    providerSessionValue?.expiresAt ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await sql`
    INSERT INTO public.sessions (id, account_id, authenticated_at, expires_at, session_token_hash)
    VALUES (${sessionId}, ${accountId}, now(), ${expiresAt}, ${sessionTokenHash})
    ON CONFLICT (id) DO NOTHING
  `;

  await sql`
    UPDATE public.auth_sessions
    SET revoked_at = now()
    WHERE participant_id = ${participantId} AND revoked_at IS NULL AND expires_at <= now()
  `;

  return { participantId, accountId, sessionId, sessionToken, expiresAt };
}

async function authMutation(request: Request, env: Env, endpoint: string): Promise<Response> {
  try {
    const body = await request.json() as {email?:string;password?:string;name?:string;phone?:string};
    let signupPhone: string | null = null;
    if (endpoint === "/sign-up/email" && body.phone?.trim()) {
      try { signupPhone = normalizePhoneE164(body.phone.trim()); }
      catch { return json({ service: "Zalagren", error: "PHONE_NUMBER_INVALID" }, 400); }
    }
    const upstream = await providerRequest(request, env, endpoint, { email: body.email, password: body.password, ...(body.name ? { name: body.name } : {}) });
    const payload = await readJson(upstream);

    if (!upstream.ok) {
      return json({ service: "Zalagren", error: payload?.message || payload?.error || "AUTHENTICATION_FAILED" }, upstream.status);
    }

    const user = providerUser(payload);
    const session = providerSession(payload);

    // Account creation and login are session-first.
    // Email/phone contact verification is optional and never blocks ordinary access.
    // Legal identity verification and sensitive-action step-up remain separate assurance layers.

    const canonical = user ? await syncCanonicalAuth(env, user, session) : null;
    if (canonical && signupPhone) {
      const sql = requireDatabase(env);
      const phoneHash = await sha256Hex(signupPhone);
      const phoneContactId = "identity-contact-phone-" + crypto.randomUUID();
      await sql`
        INSERT INTO public.identity_contacts(
          id, identity_id, kind, value_normalized, value_hash, status, verified_at, is_primary, updated_at
        ) VALUES(
          ${phoneContactId},
          (SELECT identity_id FROM public.accounts WHERE id=${canonical.accountId} LIMIT 1),
          'phone', ${signupPhone}, ${phoneHash}, 'pending', NULL, true, now()
        )
        ON CONFLICT (kind, value_hash) DO UPDATE SET
          identity_id=EXCLUDED.identity_id, status='pending', is_primary=true, updated_at=now()
      `;
    }
    const emailVerificationRequested = false;

    const outHeaders = headers({
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*"
    });

    // Zalagren owns the browser session boundary. Issue exactly one canonical cookie.
    if (canonical?.sessionToken && canonical?.expiresAt) {
      const maxAge = Math.max(60, Math.floor((new Date(canonical.expiresAt).getTime() - Date.now()) / 1000));
      outHeaders.append("set-cookie", "__Host-zalagren_session=" + encodeURIComponent(canonical.sessionToken) + "; Path=/; Max-Age=" + maxAge + "; HttpOnly; Secure; SameSite=Lax");
    }

    return new Response(JSON.stringify({
      service: "Zalagren",
      status: "authenticated",
      user: user ? { id: user.id, name: user.name, email: user.email, emailVerified: Boolean(user.emailVerified) } : undefined,
      canonical: canonical ? { participantId: canonical.participantId, accountId: canonical.accountId } : undefined,
      verification: { email: Boolean(user?.emailVerified), emailVerificationRequested }
    }), { status: upstream.status, headers: outHeaders });
  } catch (error) {
    return json({ service: "Zalagren", error: error instanceof Error ? error.message : "AUTHENTICATION_FAILED" }, 500);
  }
}

async function currentSession(request: Request, env: Env): Promise<{ user: any; session: any; canonical: any } | null> {
  const cookieHeader = request.headers.get("cookie") || "";
  const tokenMatches = [
    cookieHeader.match(/(?:^|;\s*)__Host-zalagren_session=([^;]+)/)
  ].filter(Boolean) as RegExpMatchArray[];
  const sql = requireDatabase(env);
  for (const tokenMatch of tokenMatches) {
    const tokenHash = await sha256Hex(decodeURIComponent(tokenMatch[1]));
    const rows = await sql`
      SELECT p.id AS participant_id, a.id AS account_id, s.id AS session_id,
             i.id AS identity_id, am.identifier AS email,
             COALESCE(lp.legal_name, '') AS legal_name
      FROM public.sessions s
      JOIN public.accounts a ON a.id=s.account_id AND a.status='ACTIVE'
      JOIN public.identities i ON i.id=a.identity_id
      JOIN public.participants p ON p.identity_id=i.id
      JOIN public.auth_methods am ON am.identity_id=i.id AND am.kind='email' AND am.status <> 'revoked'
      LEFT JOIN public.legal_identity_profiles lp ON lp.participant_id=p.id
      WHERE s.session_token_hash=${tokenHash} AND s.expires_at > now()
      LIMIT 1
    `;
    if (rows.length) {
      const row = rows[0];
      let providerUserRecord: any = null;
      try {
        const userRows = await sql`
          SELECT u.id, u.name, u.email, u."emailVerified"
          FROM neon_auth."user" u
          WHERE lower(u.email)=lower(${row.email})
          LIMIT 1
        `;
        providerUserRecord = userRows[0] || null;
      } catch {}
      return {
        user: {
          id: providerUserRecord?.id || null,
          name: providerUserRecord?.name || row.legal_name || null,
          email: providerUserRecord?.email || row.email,
          emailVerified: providerUserRecord ? Boolean(providerUserRecord.emailVerified) : true
        },
        session: null,
        canonical: row
      };
    }
  }
  return null;
}
async function verificationAccountForContact(sql: DbSql, kind: "email" | "phone", value: string): Promise<{identityId:string;accountId:string}|null> {
  const rows = await sql`
    SELECT i.id AS identity_id, a.id AS account_id
    FROM public.identities i
    JOIN public.accounts a ON a.identity_id=i.id
    JOIN public.identity_contacts c ON c.identity_id=i.id
    WHERE c.kind=${kind} AND c.value_normalized=${value} AND c.status <> 'revoked'
    ORDER BY c.is_primary DESC, c.updated_at DESC
    LIMIT 1
  `;
  if (!rows.length) return null;
  return { identityId: rows[0].identity_id, accountId: rows[0].account_id };
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

function base64UrlFromBytes(bytes: Uint8Array): string {
  return base64FromBytes(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function normalizeSetCookieForHost(cookie: string): string {
  return cookie
    .replace(/;\s*Domain=[^;]+/gi, "")
    .replace(/;\s*Path=\/[^;]*/i, "; Path=/");
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

async function verifyEmailVerificationCode(request: Request, env: Env): Promise<Response> {
  try {
    const body=await request.json().catch(()=>({})) as {email?:string;otp?:string};
    const email=normalizeEmail(body.email || "");
    const otp=String(body.otp || "").trim();
    if(!email) return json({service:"Zalagren",error:"EMAIL_REQUIRED"},400);
    if(!/^\d{4,10}$/.test(otp)) return json({service:"Zalagren",error:"INVALID_VERIFICATION_CODE"},400);
    const sql=requireDatabase(env);
    const target=await verificationAccountForContact(sql,"email",email);
    if(!target) return json({service:"Zalagren",error:"ACCOUNT_NOT_FOUND"},404);
    const challengeRows=await sql`SELECT id, expires_at, status FROM public.verification_challenges
      WHERE account_id=${target.accountId} AND identity_id=${target.identityId}
        AND channel='email' AND target_hash=${await sha256Hex(email)}
      ORDER BY requested_at DESC LIMIT 1`;
    if(!challengeRows.length) return json({service:"Zalagren",error:"VERIFICATION_CHALLENGE_NOT_FOUND"},409);
    const challengeId=challengeRows[0].id;
    if(String(challengeRows[0].status)!=="PENDING") return json({service:"Zalagren",error:"VERIFICATION_CHALLENGE_NOT_ACTIVE"},409);
    if(new Date(String(challengeRows[0].expires_at)).getTime()<=Date.now()){
      await recordVerificationAttempt(sql,challengeId,{ok:false,errorCode:"VERIFICATION_CHALLENGE_EXPIRED"});
      return json({service:"Zalagren",error:"VERIFICATION_CHALLENGE_EXPIRED"},409);
    }
    const upstream=await providerRequest(request,env,"/email-otp/verify-email",{email,otp});
    const payload=await readJson(upstream);
    await recordVerificationAttempt(sql,challengeId,{ok:upstream.ok,errorCode:upstream.ok?null:(payload?.message||payload?.error||"INVALID_VERIFICATION_CODE")});
    if(!upstream.ok) return json({service:"Zalagren",error:payload?.message||payload?.error||"EMAIL_NOT_VERIFIED",provider:payload},upstream.status);
    const rows=await sql`SELECT am.id AS auth_method_id FROM public.identities i
      JOIN public.identity_contacts c ON c.identity_id=i.id
      LEFT JOIN public.auth_methods am ON am.identity_id=i.id AND am.kind='email' AND am.identifier=${email}
      WHERE i.id=${target.identityId} AND c.kind='email' AND c.value_normalized=${email} LIMIT 1`;
    if(rows.length){
      await sql.transaction([
        sql`UPDATE public.identity_contacts SET status='active',verified_at=now(),updated_at=now()
             WHERE identity_id=${target.identityId} AND kind='email' AND value_normalized=${email}`,
        sql`UPDATE public.auth_methods SET status='active',verified_at=now() WHERE identity_id=${target.identityId} AND kind='email' AND identifier=${email}`,
        sql`INSERT INTO public.identity_verification_records(
              id,identity_id,target_type,target_id,method,status,external_reference,completed_at
            ) VALUES(
              'identity-verification-'+crypto.randomUUID(),${target.identityId},'email',
              ${rows[0].auth_method_id || 'email:'+email},'neon-auth-email-otp','verified',null,now()
            )`
      ]);
    }
    return json({service:"Zalagren",status:"email_verified",challengeId});
  }catch(error){const m=error instanceof Error?error.message:"EMAIL_VERIFICATION_FAILED";return json({service:"Zalagren",error:m},400);}
}
async function startPhoneVerification(request: Request, env: Env): Promise<Response> {
  try {
    const active = await requireActive(request, env);
    const body=await request.json() as {phone?:string};
    const phone=normalizePhoneE164(body.phone);
    const sql=requireDatabase(env);
    const participantId=active.canonical.participant_id || active.canonical.participantId;
    const rows=await sql`SELECT i.id, a.id AS account_id FROM public.identities i
      JOIN public.participants p ON p.identity_id=i.id
      JOIN public.accounts a ON a.identity_id=i.id
      WHERE p.id=${participantId} LIMIT 1`;
    if(!rows.length) return json({service:"Zalagren",error:"IDENTITY_NOT_FOUND"},404);
    const hash=await sha256Hex(phone);
    const challenge=await beginVerificationChallenge(sql,{
      accountId:rows[0].account_id,identityId:rows[0].id,channel:"phone",targetHash:hash,provider:"twilio_verify"
    });
    let payload:any;
    try {
      payload=await twilioRequest(env,"/Verifications",new URLSearchParams({channel:"sms",to:phone}));
      await recordVerificationProviderResult(sql,challenge.id,{ok:true,providerReference:payload?.sid||null});
    } catch (error) {
      await recordVerificationProviderResult(sql,challenge.id,{ok:false,errorCode:error instanceof Error?error.message:"PHONE_VERIFICATION_FAILED"});
      throw error;
    }
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
    const sql=requireDatabase(env);
    const participantId=active.canonical.participant_id || active.canonical.participantId;
    const rows=await sql`SELECT i.id, a.id AS account_id FROM public.identities i
      JOIN public.participants p ON p.identity_id=i.id
      JOIN public.accounts a ON a.identity_id=i.id
      WHERE p.id=${participantId} LIMIT 1`;
    if(!rows.length) return json({service:"Zalagren",error:"IDENTITY_NOT_FOUND"},404);
    const identity=rows[0].id, accountId=rows[0].account_id, hash=await sha256Hex(phone);
    const challengeRows=await sql`SELECT id, expires_at, status FROM public.verification_challenges
      WHERE account_id=${accountId} AND identity_id=${identity}
        AND channel='phone' AND target_hash=${hash}
      ORDER BY requested_at DESC LIMIT 1`;
    if(!challengeRows.length) return json({service:"Zalagren",error:"VERIFICATION_CHALLENGE_NOT_FOUND"},409);
    const challengeId=challengeRows[0].id;
    if(String(challengeRows[0].status)!=="PENDING") return json({service:"Zalagren",error:"VERIFICATION_CHALLENGE_NOT_ACTIVE"},409);
    if(new Date(String(challengeRows[0].expires_at)).getTime()<=Date.now()){
      await recordVerificationAttempt(sql,challengeId,{ok:false,errorCode:"VERIFICATION_CHALLENGE_EXPIRED"});
      return json({service:"Zalagren",error:"VERIFICATION_CHALLENGE_EXPIRED"},409);
    }
    const payload=await twilioRequest(env,"/VerificationCheck",new URLSearchParams({to:phone,code}));
    if(payload?.status!=="approved"){
      await recordVerificationAttempt(sql,challengeId,{ok:false,errorCode:"PHONE_NOT_VERIFIED"});
      return json({service:"Zalagren",error:"PHONE_NOT_VERIFIED",status:payload?.status||"pending"},400);
    }
    await recordVerificationAttempt(sql,challengeId,{ok:true});
    
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
    const body=await request.json().catch(()=>({}));
    const active=await currentSession(request,env);
    const requestedEmail=normalizeEmail(body.email || active?.user?.email || "");
    if(!requestedEmail) return json({service:"Zalagren",error:"EMAIL_REQUIRED"},400);
    if(active?.user?.email && normalizeEmail(active.user.email)!==requestedEmail) return json({service:"Zalagren",error:"EMAIL_MISMATCH"},400);
    const sql=requireDatabase(env);
    const target=await verificationAccountForContact(sql,"email",requestedEmail);
    if(!target) return json({service:"Zalagren",error:"ACCOUNT_NOT_FOUND"},404);
    const challenge=await beginVerificationChallenge(sql,{
      accountId:target.accountId,identityId:target.identityId,channel:"email",
      targetHash:await sha256Hex(requestedEmail),provider:"neon_auth"
    });
    const upstream=await providerRequest(request,env,"/email-otp/send-verification-otp",{email:requestedEmail,type:"email-verification"});
    const payload=await readJson(upstream);
    await recordVerificationProviderResult(sql,challenge.id,{
      ok:upstream.ok,errorCode:upstream.ok?null:"EMAIL_OTP_PROVIDER_FAILED"
    });
    return json({
      service:"Zalagren",
      status:upstream.ok?"email_verification_requested":"email_verification_failed",
      challengeId:challenge.id,
      provider:payload
    },upstream.status);
  }catch(error){const m=error instanceof Error?error.message:"EMAIL_VERIFICATION_FAILED";return json({service:"Zalagren",error:m},400);}
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
    const b=await request.json().catch(()=>({})) as {
      title?:string;description?:string;category?:string;priceMinor?:number;currency?:string;communityId?:string;
      listingKind?:string;fulfillmentMode?:string;providerKind?:string;jurisdictionCountry?:string
    };
    const listingKinds=["goods","service","asset","project","opportunity","capability","accommodation"];
    const fulfillmentModes=["direct","delivery","pickup","digital","appointment","stay","provider_dispatch"];
    const providerKinds=["individual","business","organization","community"];
    if(!b.title?.trim()||!b.description?.trim()||!b.category?.trim()) return json({service:"Zalagren",error:"LISTING_FIELDS_REQUIRED"},400);
    if(b.priceMinor!==undefined && (!Number.isInteger(b.priceMinor)||b.priceMinor<0)) return json({service:"Zalagren",error:"INVALID_PRICE"},400);
    if(b.listingKind && !listingKinds.includes(b.listingKind)) return json({service:"Zalagren",error:"INVALID_LISTING_KIND"},400);
    if(b.fulfillmentMode && !fulfillmentModes.includes(b.fulfillmentMode)) return json({service:"Zalagren",error:"INVALID_FULFILLMENT_MODE"},400);
    if(b.providerKind && !providerKinds.includes(b.providerKind)) return json({service:"Zalagren",error:"INVALID_PROVIDER_KIND"},400);
    const id="listing-"+crypto.randomUUID();
    const rows=await sql`INSERT INTO public.marketplace_listings(
      id,participant_id,community_id,title,description,category,price_minor,currency,status,listing_kind,provider_kind,
      fulfillment_mode,jurisdiction_country,verification_state,compliance_state,tax_state
    ) VALUES(
      ${id},${participantId},${b.communityId||null},${b.title.trim()},${b.description.trim()},${b.category.trim()},
      ${b.priceMinor??null},${b.currency||"KES"},"pending_review",${b.listingKind||"service"},${b.providerKind||"individual"},
      ${b.fulfillmentMode||"direct"},${(b.jurisdictionCountry||"KE").toUpperCase()},"proposed","proposed","not_assessed"
    ) RETURNING *`;
    await domainEvent(sql,participantId,"marketplace.listing.submitted","zalagren-worker");
    return json({service:"Zalagren",status:"listing_submitted_for_review",listing:rows[0]},201);
  } catch(e){const m=e instanceof Error?e.message:"MARKETPLACE_CREATE_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}

async function listMarketplace(request: Request, env: Env): Promise<Response> {
  try {
    const {sql}=await participantIdFromSession(request,env);
    const u=new URL(request.url);const communityId=u.searchParams.get("communityId");
    const rows=communityId
      ?await sql`SELECT ml.*,mlp.summary,mlp.terms,mlp.availability AS profile_availability
        FROM public.marketplace_listings ml LEFT JOIN public.marketplace_listing_profiles mlp ON mlp.listing_id=ml.id
        WHERE ml.status='published' AND ml.verification_state IN ('supported','verified') AND ml.compliance_state IN ('supported','verified')
        AND (ml.community_id=${communityId} OR ml.community_id IS NULL) ORDER BY ml.created_at DESC LIMIT 100`
      :await sql`SELECT ml.*,mlp.summary,mlp.terms,mlp.availability AS profile_availability
        FROM public.marketplace_listings ml LEFT JOIN public.marketplace_listing_profiles mlp ON mlp.listing_id=ml.id
        WHERE ml.status='published' AND ml.verification_state IN ('supported','verified') AND ml.compliance_state IN ('supported','verified')
        ORDER BY ml.created_at DESC LIMIT 100`;
    return json({service:"Zalagren",items:rows});
  } catch(e){const m=e instanceof Error?e.message:"MARKETPLACE_LOOKUP_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:500);}
}

async function listMyMarketplace(request: Request, env: Env): Promise<Response> {
  try {
    const {participantId,sql}=await participantIdFromSession(request,env);
    const rows=await sql`SELECT ml.*,mlp.summary,mlp.terms,mlp.availability AS profile_availability
      FROM public.marketplace_listings ml LEFT JOIN public.marketplace_listing_profiles mlp ON mlp.listing_id=ml.id
      WHERE ml.participant_id=${participantId} ORDER BY ml.created_at DESC LIMIT 100`;
    return json({service:"Zalagren",items:rows});
  } catch(e){const m=e instanceof Error?e.message:"MARKETPLACE_MINE_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:500);}
}

async function createAccommodationProfile(request: Request, env: Env): Promise<Response> {
  try {
    const {participantId,sql}=await participantIdFromSession(request,env);
    const b=await request.json().catch(()=>({})) as {
      listingId?:string;accommodationType?:string;stayType?:string;maxGuests?:number;bedrooms?:number;bathrooms?:number;
      checkInTime?:string;checkOutTime?:string;amenities?:string[];houseRules?:string[];locationVisibility?:string;addressLabel?:string
    };
    if(!b.listingId||!b.accommodationType?.trim()||!Number.isInteger(b.maxGuests)||b.maxGuests<1) return json({service:"Zalagren",error:"ACCOMMODATION_FIELDS_REQUIRED"},400);
    const listing=await sql`SELECT id,listing_kind FROM public.marketplace_listings WHERE id=${b.listingId} AND participant_id=${participantId} LIMIT 1`;
    if(!listing.length)return json({service:"Zalagren",error:"LISTING_NOT_OWNED"},403);
    if(listing[0].listing_kind!=="accommodation")return json({service:"Zalagren",error:"LISTING_NOT_ACCOMMODATION"},400);
    const visibility=["hidden","approximate","exact"];if(b.locationVisibility&&!visibility.includes(b.locationVisibility))return json({service:"Zalagren",error:"INVALID_LOCATION_VISIBILITY"},400);
    const stay=["short_stay","long_stay","both"];if(b.stayType&&!stay.includes(b.stayType))return json({service:"Zalagren",error:"INVALID_STAY_TYPE"},400);
    const rows=await sql`INSERT INTO public.marketplace_accommodation_profiles(
      listing_id,accommodation_type,stay_type,max_guests,bedrooms,bathrooms,check_in_time,check_out_time,amenities,house_rules,location_visibility,address_label
    ) VALUES(
      ${b.listingId},${b.accommodationType.trim()},${b.stayType||"short_stay"},${b.maxGuests},${b.bedrooms??null},${b.bathrooms??null},
      ${b.checkInTime||null},${b.checkOutTime||null},${JSON.stringify(b.amenities||[])},${JSON.stringify(b.houseRules||[])},
      ${b.locationVisibility||"approximate"},${b.addressLabel||null}
    ) ON CONFLICT(listing_id) DO UPDATE SET accommodation_type=EXCLUDED.accommodation_type,stay_type=EXCLUDED.stay_type,max_guests=EXCLUDED.max_guests,
      bedrooms=EXCLUDED.bedrooms,bathrooms=EXCLUDED.bathrooms,check_in_time=EXCLUDED.check_in_time,check_out_time=EXCLUDED.check_out_time,
      amenities=EXCLUDED.amenities,house_rules=EXCLUDED.house_rules,location_visibility=EXCLUDED.location_visibility,address_label=EXCLUDED.address_label,updated_at=now()
    RETURNING *`;
    await domainEvent(sql,participantId,"marketplace.accommodation.profile.updated","zalagren-worker");
    return json({service:"Zalagren",status:"accommodation_profile_saved",profile:rows[0]},201);
  } catch(e){const m=e instanceof Error?e.message:"ACCOMMODATION_PROFILE_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
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
  try { const {participantId,sql}=await participantIdFromSession(request,env); const b=await request.json() as {pickup?:string;destination?:string;communityId?:string};
    if(!b.pickup?.trim()||!b.destination?.trim())return json({service:"Zalagren",error:"RIDE_ROUTE_REQUIRED"},400); const id="ride-request-"+crypto.randomUUID();
    const rows=await sql`INSERT INTO public.beatride_requests(id,participant_id,community_id,pickup_text,destination_text,status,provider_reference) VALUES(${id},${participantId},${b.communityId||null},${b.pickup.trim()},${b.destination.trim()},'searching',null) RETURNING *`;
    const drivers=await sql`SELECT p.id AS profile_id,v.id AS vehicle_id FROM public.beatride_profiles p JOIN public.beatride_driver_presence dp ON dp.profile_id=p.id AND dp.availability='available' AND dp.last_seen_at>now()-interval '3 minutes' LEFT JOIN public.beatride_vehicles v ON v.profile_id=p.id AND v.status='verified' AND v.verification_state='verified' WHERE p.role IN ('driver','provider') AND p.status='active' AND (p.community_id=${b.communityId||null} OR ${b.communityId||null} IS NULL OR p.community_id IS NULL) ORDER BY CASE WHEN p.community_id=${b.communityId||null} THEN 0 ELSE 1 END,dp.last_seen_at DESC LIMIT 5`;
    const offers=[]; for(const d of drivers){const offerId="ride-offer-"+crypto.randomUUID(); await sql`INSERT INTO public.beatride_dispatch_offers(id,request_id,driver_profile_id,vehicle_id,status,expires_at) VALUES(${offerId},${id},${d.profile_id},${d.vehicle_id||null},'offered',now()+interval '45 seconds')`; offers.push(offerId);}
    return json({service:"Zalagren",status:offers.length?"drivers_notified":"searching_for_driver",ride:rows[0],dispatch:{ownedBy:"Zalagren",providerDependency:false,offersCreated:offers.length}},201);
  } catch(e){const m=e instanceof Error?e.message:"BEATRIDE_REQUEST_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
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
             a.id AS account_id, a.status AS account_status,
             EXISTS(SELECT 1 FROM public.identity_contacts ic WHERE ic.identity_id=i.id AND ic.kind='email' AND ic.status='active' AND ic.verified_at IS NOT NULL) AS email_verified,
             EXISTS(SELECT 1 FROM public.identity_contacts ic WHERE ic.identity_id=i.id AND ic.kind='email' AND ic.status='pending') AS email_pending,
             EXISTS(SELECT 1 FROM public.identity_contacts ic WHERE ic.identity_id=i.id AND ic.kind='phone' AND ic.status='active' AND ic.verified_at IS NOT NULL) AS phone_verified,
             EXISTS(SELECT 1 FROM public.identity_contacts ic WHERE ic.identity_id=i.id AND ic.kind='phone' AND ic.status='pending') AS phone_pending,
             EXISTS(SELECT 1 FROM public.identity_documents d WHERE d.identity_id=i.id AND d.status='verified') AS document_verified,
             EXISTS(SELECT 1 FROM public.identity_documents d WHERE d.identity_id=i.id AND d.status='pending') AS document_pending,
             EXISTS(SELECT 1 FROM public.legal_identity_profiles lp2 WHERE lp2.participant_id=p.id AND lp2.status='verified') AS legal_identity_verified,
             EXISTS(SELECT 1 FROM public.legal_identity_profiles lp3 WHERE lp3.participant_id=p.id AND lp3.status='pending') AS legal_identity_pending
      FROM public.identities i
      JOIN public.participants p ON p.identity_id=i.id
      JOIN public.accounts a ON a.identity_id=i.id
      LEFT JOIN public.legal_identity_profiles lip ON lip.participant_id=p.id
      WHERE p.id=${participantId}
      LIMIT 1
    `;
    const responseHeaders = headers({
      "content-type": "application/json; charset=utf-8"
    });
    if (active.canonical?.sessionToken && active.canonical?.expiresAt) {
      const maxAge = Math.max(
        60,
        Math.floor((new Date(active.canonical.expiresAt).getTime() - Date.now()) / 1000)
      );
      responseHeaders.append(
        "set-cookie",
        "__Host-zalagren_session=" +
          encodeURIComponent(active.canonical.sessionToken) +
          "; Path=/; Max-Age=" +
          maxAge +
          "; HttpOnly; Secure; SameSite=Lax"
      );
    }

    return new Response(JSON.stringify({
      service: "Zalagren",
      authenticated: true,
      participant: active.canonical,
      identity: { provider: "neon-auth", userId: active.user.id, name: active.user.name, email: active.user.email, legalName: identityRows[0]?.legal_name || null },
      account: {
        id: identityRows[0]?.account_id || active.canonical.account_id || active.canonical.accountId || null,
        status: identityRows[0]?.account_status || "unknown"
      },
      verification: {
        email: {
          status: identityRows[0]?.email_verified ? "verified" : identityRows[0]?.email_pending ? "pending" : "required",
          verified: Boolean(identityRows[0]?.email_verified)
        },
        phone: {
          status: identityRows[0]?.phone_verified ? "verified" : identityRows[0]?.phone_pending ? "pending" : "required",
          verified: Boolean(identityRows[0]?.phone_verified)
        },
        document: {
          status: identityRows[0]?.document_verified ? "verified" : identityRows[0]?.document_pending ? "pending" : "not_started",
          verified: Boolean(identityRows[0]?.document_verified)
        },
        legalIdentity: {
          status: identityRows[0]?.legal_identity_verified ? "verified" : identityRows[0]?.legal_identity_pending ? "pending" : "not_started",
          verified: Boolean(identityRows[0]?.legal_identity_verified)
        }
      },
      home: {
        identity: "Ready",
        communities: "Available",
        services: "Ready for participant context",
        genesis: "Proposal-only intelligence"
      }
    }), { status: 200, headers: responseHeaders });
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

async function publicServiceCatalog(request: Request, env: Env): Promise<Response> {
  try { const active=await currentSession(request,env); if(!active)return json({service:"Zalagren",error:"UNAUTHORIZED"},401); const sql=requireDatabase(env);
    const items=await sql`SELECT id,name,domain,status,owner_mode,public_visibility,provider_joinable,first_party,launch_state FROM public.services WHERE public_visibility='authenticated' AND status='available' ORDER BY first_party DESC,name`;
    return json({service:"Zalagren",access:"authenticated_public",items});
  } catch(e){return json({service:"Zalagren",error:e instanceof Error?e.message:"SERVICE_CATALOG_FAILED"},500);}
}
async function registerServiceProvider(request: Request, env: Env): Promise<Response> {
  try { const {participantId,sql}=await participantIdFromSession(request,env); const b=await request.json() as {serviceId?:string;displayName?:string;providerKind?:string;serviceArea?:unknown};
    if(!b.serviceId||!b.displayName?.trim())return json({service:"Zalagren",error:"SERVICE_PROVIDER_FIELDS_REQUIRED"},400);
    const [service]=await sql`SELECT id,name,provider_joinable FROM public.services WHERE id=${b.serviceId} AND public_visibility='authenticated' AND status='available' LIMIT 1`; if(!service)return json({service:"Zalagren",error:"SERVICE_NOT_AVAILABLE"},404);
    const kind=["individual","business","organization","community"].includes(b.providerKind||"")?b.providerKind:"individual"; const id="service-provider-"+crypto.randomUUID();
    const rows=await sql`INSERT INTO public.service_provider_profiles(id,service_id,participant_id,provider_kind,display_name,service_area,status,verification_state) VALUES(${id},${service.id},${participantId},${kind},${b.displayName.trim()},${JSON.stringify(b.serviceArea||{})}::jsonb,'proposed','proposed') ON CONFLICT(service_id,participant_id) DO UPDATE SET display_name=EXCLUDED.display_name,service_area=EXCLUDED.service_area,updated_at=now() RETURNING *`;
    return json({service:"Zalagren",status:"provider_registration_created",provider:rows[0]},201);
  } catch(e){const m=e instanceof Error?e.message:"SERVICE_PROVIDER_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}
async function createBusinessProfile(request: Request, env: Env): Promise<Response> {
  try { const {participantId,sql}=await participantIdFromSession(request,env); const b=await request.json() as {tradingName?:string;legalName?:string;category?:string;serviceArea?:unknown};
    if(!b.tradingName?.trim()||!b.category?.trim())return json({service:"Zalagren",error:"BUSINESS_FIELDS_REQUIRED"},400); const id="business-"+crypto.randomUUID();
    const rows=await sql`INSERT INTO public.business_profiles(id,participant_id,legal_name,trading_name,category,service_area) VALUES(${id},${participantId},${b.legalName?.trim()||null},${b.tradingName.trim()},${b.category.trim()},${JSON.stringify(b.serviceArea||{})}::jsonb) ON CONFLICT(participant_id,trading_name) DO UPDATE SET legal_name=EXCLUDED.legal_name,category=EXCLUDED.category,service_area=EXCLUDED.service_area,updated_at=now() RETURNING *`;
    return json({service:"Zalagren",status:"business_created",business:rows[0]},201);
  } catch(e){const m=e instanceof Error?e.message:"BUSINESS_CREATE_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}
async function createZalagrenInvitation(request: Request, env: Env): Promise<Response> {
  try { const {participantId,sql}=await participantIdFromSession(request,env); const b=await request.json() as {type?:string;name?:string;contact?:string;reference?:string;communityId?:string;businessId?:string;serviceId?:string;expiresInHours?:number};
    if(!["community","business","service","participant"].includes(b.type||""))return json({service:"Zalagren",error:"INVITATION_TYPE_INVALID"},400); if(!b.contact?.trim()&&!b.reference?.trim())return json({service:"Zalagren",error:"INVITATION_TARGET_REQUIRED"},400);
    const token=base64UrlFromBytes(crypto.getRandomValues(new Uint8Array(24))); const hash=await sha256Hex(token); const id="invite-"+crypto.randomUUID(); const hours=Math.min(Math.max(Number(b.expiresInHours||168),1),720);
    const rows=await sql`INSERT INTO public.zalagren_invitations(id,inviter_participant_id,invitation_type,target_name,target_contact,target_reference,community_id,business_id,service_id,token_hash,expires_at) VALUES(${id},${participantId},${b.type},${b.name?.trim()||null},${b.contact?.trim()||null},${b.reference?.trim()||null},${b.communityId||null},${b.businessId||null},${b.serviceId||null},${hash},${new Date(Date.now()+hours*3600000).toISOString()}) RETURNING id,invitation_type,target_name,target_contact,target_reference,community_id,business_id,service_id,status,expires_at,created_at`;
    return json({service:"Zalagren",status:"invitation_created",invitation:rows[0],inviteToken:token,sharePath:"/invite/"+encodeURIComponent(token)},201);
  } catch(e){const m=e instanceof Error?e.message:"INVITATION_CREATE_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}
async function acceptZalagrenInvitation(request: Request, env: Env): Promise<Response> {
  try { const {participantId,sql}=await participantIdFromSession(request,env); const b=await request.json() as {token?:string}; if(!b.token?.trim())return json({service:"Zalagren",error:"INVITATION_TOKEN_REQUIRED"},400);
    const hash=await sha256Hex(b.token.trim()); const rows=await sql`SELECT * FROM public.zalagren_invitations WHERE token_hash=${hash} AND status='pending' AND expires_at>now() LIMIT 1`; if(!rows.length)return json({service:"Zalagren",error:"INVITATION_INVALID_OR_EXPIRED"},404); const inv=rows[0];
    if(inv.invitation_type==='community'&&inv.community_id)await sql`INSERT INTO public.community_participations(id,community_id,participant_id,role,status,source) VALUES('participation-invite-'||replace(gen_random_uuid()::text,'-',''),${inv.community_id},${participantId},'member','pending','invitation') ON CONFLICT(community_id,participant_id) DO NOTHING`;
    await sql`UPDATE public.zalagren_invitations SET status='accepted',accepted_by_participant_id=${participantId},accepted_at=now() WHERE id=${inv.id}`; return json({service:"Zalagren",status:"invitation_accepted",invitationId:inv.id,type:inv.invitation_type});
  } catch(e){const m=e instanceof Error?e.message:"INVITATION_ACCEPT_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}
async function setBeatRidePresence(request: Request, env: Env): Promise<Response> {
  try { const {participantId,sql}=await participantIdFromSession(request,env); const b=await request.json() as {profileId?:string;availability?:string;latitude?:number;longitude?:number;accuracy?:number};
    if(!b.profileId||!["offline","available","busy"].includes(b.availability||""))return json({service:"Zalagren",error:"RIDE_PRESENCE_INVALID"},400); const [profile]=await sql`SELECT id FROM public.beatride_profiles WHERE id=${b.profileId} AND participant_id=${participantId} AND role IN ('driver','provider') LIMIT 1`; if(!profile)return json({service:"Zalagren",error:"RIDE_DRIVER_PROFILE_NOT_FOUND"},404);
    await sql`INSERT INTO public.beatride_driver_presence(profile_id,availability,latitude,longitude,location_accuracy_m,last_seen_at,updated_at) VALUES(${b.profileId},${b.availability},${Number.isFinite(b.latitude)?b.latitude:null},${Number.isFinite(b.longitude)?b.longitude:null},${Number.isFinite(b.accuracy)?b.accuracy:null},now(),now()) ON CONFLICT(profile_id) DO UPDATE SET availability=EXCLUDED.availability,latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude,location_accuracy_m=EXCLUDED.location_accuracy_m,last_seen_at=now(),updated_at=now()`; return json({service:"Zalagren",status:"ride_presence_updated",availability:b.availability});
  } catch(e){const m=e instanceof Error?e.message:"RIDE_PRESENCE_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}
async function addBeatRideVehicle(request: Request, env: Env): Promise<Response> {
  try { const {participantId,sql}=await participantIdFromSession(request,env); const b=await request.json() as {profileId?:string;registrationReference?:string;vehicleType?:string;makeModel?:string;capacity?:number;evidence?:unknown};
    if(!b.profileId||!b.registrationReference?.trim()||!b.vehicleType?.trim())return json({service:"Zalagren",error:"RIDE_VEHICLE_FIELDS_REQUIRED"},400); const [profile]=await sql`SELECT id FROM public.beatride_profiles WHERE id=${b.profileId} AND participant_id=${participantId} AND role IN ('driver','provider') LIMIT 1`; if(!profile)return json({service:"Zalagren",error:"RIDE_DRIVER_PROFILE_NOT_FOUND"},404);
    const id="ride-vehicle-"+crypto.randomUUID(); const rows=await sql`INSERT INTO public.beatride_vehicles(id,participant_id,profile_id,registration_reference,vehicle_type,make_model,capacity,evidence) VALUES(${id},${participantId},${b.profileId},${b.registrationReference.trim()},${b.vehicleType.trim()},${b.makeModel?.trim()||null},${Number.isFinite(b.capacity)?b.capacity:null},${JSON.stringify(b.evidence||{})}::jsonb) RETURNING *`; return json({service:"Zalagren",status:"vehicle_registered",vehicle:rows[0],verification:"proposed"},201);
  } catch(e){const m=e instanceof Error?e.message:"RIDE_VEHICLE_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}
async function acceptBeatRideOffer(request: Request, env: Env): Promise<Response> {
  try { const {participantId,sql}=await participantIdFromSession(request,env); const b=await request.json() as {offerId?:string}; if(!b.offerId)return json({service:"Zalagren",error:"RIDE_OFFER_REQUIRED"},400);
    const [offer]=await sql`SELECT o.*,r.participant_id AS rider_participant_id FROM public.beatride_dispatch_offers o JOIN public.beatride_requests r ON r.id=o.request_id WHERE o.id=${b.offerId} AND o.status='offered' AND o.expires_at>now() LIMIT 1`; if(!offer)return json({service:"Zalagren",error:"RIDE_OFFER_UNAVAILABLE"},404);
    const [driver]=await sql`SELECT id FROM public.beatride_profiles WHERE id=${offer.driver_profile_id} AND participant_id=${participantId} LIMIT 1`; if(!driver)return json({service:"Zalagren",error:"RIDE_OFFER_NOT_FOR_PARTICIPANT"},403);
    const [trip]=await sql`INSERT INTO public.beatride_trips(id,request_id,rider_participant_id,driver_profile_id,vehicle_id,status) VALUES('ride-trip-'||replace(gen_random_uuid()::text,'-',''),${offer.request_id},${offer.rider_participant_id},${offer.driver_profile_id},${offer.vehicle_id},'accepted') ON CONFLICT(request_id) DO UPDATE SET driver_profile_id=EXCLUDED.driver_profile_id,vehicle_id=EXCLUDED.vehicle_id,status='accepted' RETURNING *`;
    await sql`UPDATE public.beatride_dispatch_offers SET status='accepted',responded_at=now() WHERE id=${offer.id}`; await sql`UPDATE public.beatride_dispatch_offers SET status='expired',responded_at=now() WHERE request_id=${offer.request_id} AND id<>${offer.id} AND status='offered'`; await sql`UPDATE public.beatride_requests SET status='matched' WHERE id=${offer.request_id}`; return json({service:"Zalagren",status:"ride_matched",trip:trip[0]});
  } catch(e){const m=e instanceof Error?e.message:"RIDE_OFFER_ACCEPT_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}
async function updateBeatRideTrip(request: Request, env: Env): Promise<Response> {
  try { const {participantId,sql}=await participantIdFromSession(request,env); const b=await request.json() as {tripId?:string;status?:string}; if(!b.tripId||!["pickup_confirmed","in_progress","completed","cancelled"].includes(b.status||""))return json({service:"Zalagren",error:"RIDE_TRIP_UPDATE_INVALID"},400);
    const [trip]=await sql`SELECT t.* FROM public.beatride_trips t LEFT JOIN public.beatride_profiles d ON d.id=t.driver_profile_id WHERE t.id=${b.tripId} AND (t.rider_participant_id=${participantId} OR d.participant_id=${participantId}) LIMIT 1`; if(!trip)return json({service:"Zalagren",error:"RIDE_TRIP_NOT_FOUND"},404);
    const field=b.status==="pickup_confirmed"?"pickup_confirmed_at":b.status==="in_progress"?"started_at":b.status==="completed"?"completed_at":"cancelled_at"; const updated=await sql`UPDATE public.beatride_trips SET status=${b.status},${sql(field)}=now() WHERE id=${b.tripId} RETURNING *`; await sql`UPDATE public.beatride_requests SET status=${b.status} WHERE id=${trip.request_id}`; return json({service:"Zalagren",status:"ride_trip_updated",trip:updated[0]});
  } catch(e){const m=e instanceof Error?e.message:"RIDE_TRIP_UPDATE_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:400);}
}

async function guardianCreateIncident(request: Request, env: Env): Promise<Response> {
  try { const {participantId,sql}=await participantIdFromSession(request,env); const b=await request.json() as {incidentType?:string;severity?:string;description?:string;location?:unknown;communityId?:string};
    if(!b.incidentType?.trim())return json({service:"BeatGuardian",error:"INCIDENT_TYPE_REQUIRED"},400);
    const id="guardian-incident-"+crypto.randomUUID(); const rows=await sql`INSERT INTO public.beatguardian_incidents(id,participant_id,community_id,incident_type,severity,location,description) VALUES(${id},${participantId},${b.communityId||null},${b.incidentType.trim()},${b.severity||"normal"},${JSON.stringify(b.location||{})}::jsonb,${b.description?.trim()||null}) RETURNING id,incident_type,severity,status,created_at`;
    return json({service:"BeatGuardian",status:"incident_created",incident:rows[0],coordination:"Zalagren"},201);
  } catch(e){const m=e instanceof Error?e.message:"GUARDIAN_INCIDENT_FAILED";return json({service:"BeatGuardian",error:m},m==="UNAUTHORIZED"?401:400);}
}
async function guardianCreateCheckin(request: Request, env: Env): Promise<Response> {
  try { const {participantId,sql}=await participantIdFromSession(request,env); const b=await request.json() as {destination?:string;eta?:string};
    if(!b.destination?.trim()||!b.eta)return json({service:"BeatGuardian",error:"CHECKIN_FIELDS_REQUIRED"},400);
    const id="guardian-checkin-"+crypto.randomUUID(); const rows=await sql`INSERT INTO public.beatguardian_checkins(id,participant_id,destination,eta) VALUES(${id},${participantId},${b.destination.trim()},${b.eta}) RETURNING id,destination,eta,status,created_at`;
    return json({service:"BeatGuardian",status:"checkin_created",checkin:rows[0]},201);
  } catch(e){const m=e instanceof Error?e.message:"GUARDIAN_CHECKIN_FAILED";return json({service:"BeatGuardian",error:m},m==="UNAUTHORIZED"?401:400);}
}

async function beatHealthDashboard(request: Request, env: Env): Promise<Response> {
  try {
    const ctx=await participantIdFromSession(request,env); const participantId=ctx.participantId; const sql=ctx.sql;
    const profiles=await sql`SELECT id,provider_type,facility_name,specialty,service_area,verification_state,status FROM public.beathealth_provider_profiles WHERE participant_id=${participantId} ORDER BY created_at DESC`;
    const appointments=await sql`SELECT a.id,a.scheduled_at,a.reason,a.status,p.facility_name,p.specialty FROM public.beathealth_appointments a JOIN public.beathealth_provider_profiles p ON p.id=a.provider_profile_id WHERE a.patient_participant_id=${participantId} OR p.participant_id=${participantId} ORDER BY a.scheduled_at DESC LIMIT 50`;
    const orders=await sql`SELECT id,status,created_at FROM public.beathealth_pharmacy_orders WHERE patient_participant_id=${participantId} ORDER BY created_at DESC LIMIT 50`;
    const policies=await sql`SELECT p.id,i.name AS insurer,p.status,p.verification_state FROM public.beathealth_insurance_policies p JOIN public.beathealth_insurance_providers i ON i.id=p.insurer_id WHERE p.participant_id=${participantId} ORDER BY p.created_at DESC`;
    const workers=await sql`SELECT w.id,w.facility_id,w.worker_type,w.professional_title,w.verification_state,w.employment_state,w.status,f.name AS facility_name FROM public.beathealth_workers w JOIN public.beathealth_facilities f ON f.id=w.facility_id WHERE w.participant_id=${participantId} ORDER BY w.created_at DESC`;
    return json({service:"BeatHealth",status:"dashboard_ready",scope:"participant",protected:true,profiles,appointments,orders,policies,workers});
  } catch(e){const m=e instanceof Error?e.message:"BEATHEALTH_DASHBOARD_FAILED";return json({service:"BeatHealth",error:m},m==="UNAUTHORIZED"?401:400);}
}

async function beatHealthSearch(request: Request, env: Env): Promise<Response> {
  try {
    const ctx=await participantIdFromSession(request,env); const sql=ctx.sql; const url=new URL(request.url);
    const q=(url.searchParams.get("q")||"").trim(); if(!q)return json({service:"BeatHealth",error:"SEARCH_QUERY_REQUIRED"},400);
    const type=(url.searchParams.get("type")||"all").trim(); const limit=Math.min(50,Math.max(1,Number(url.searchParams.get("limit")||20))); const like="%"+q.replace(/[%_]/g,"")+"%";
    const facilities=(type==="medicine"||type==="doctor")?[]:await sql`SELECT id,name,facility_type,status,verification_state,location,contact FROM public.beathealth_facilities WHERE status='active' AND (name ILIKE ${like} OR facility_type ILIKE ${like}) ORDER BY verification_state='verified' DESC,name LIMIT ${limit}`;
    const providers=(type==="medicine"||type==="facility")?[]:await sql`SELECT id,provider_type,facility_name,specialty,service_area,verification_state,status FROM public.beathealth_provider_profiles WHERE status='active' AND (facility_name ILIKE ${like} OR specialty ILIKE ${like} OR provider_type ILIKE ${like}) ORDER BY verification_state='verified' DESC,facility_name LIMIT ${limit}`;
    const medicines=(type==="facility"||type==="doctor")?[]:await sql`SELECT p.id,p.name,p.generic_name,p.dosage_form,p.strength,p.pack_size,p.regulatory_state,p.status,f.name AS facility_name,i.availability_state,i.quantity_available FROM public.beathealth_medicine_products p LEFT JOIN public.beathealth_facilities f ON f.id=p.facility_id LEFT JOIN public.beathealth_medicine_inventory i ON i.product_id=p.id WHERE p.status='active' AND (p.name ILIKE ${like} OR COALESCE(p.generic_name,'') ILIKE ${like}) ORDER BY p.regulatory_state='verified' DESC,p.name LIMIT ${limit}`;
    return json({service:"BeatHealth",status:"search_ready",protected:true,query:q,facilities,providers,medicines});
  } catch(e){const m=e instanceof Error?e.message:"BEATHEALTH_SEARCH_FAILED";return json({service:"BeatHealth",error:m},m==="UNAUTHORIZED"?401:400);}
}

async function beatHealthCreateFacility(request: Request, env: Env): Promise<Response> {
  try {
    const ctx=await participantIdFromSession(request,env); const participantId=ctx.participantId; const sql=ctx.sql; const b=await request.json();
    if(!b.name?.trim()||!b.facilityType?.trim())return json({service:"BeatHealth",error:"FACILITY_FIELDS_REQUIRED"},400);
    const profileId="health-provider-"+crypto.randomUUID(), facilityId="health-facility-"+crypto.randomUUID();
    await sql.transaction([
      sql`INSERT INTO public.beathealth_provider_profiles(id,participant_id,provider_type,facility_name,verification_state) VALUES(${profileId},${participantId},${b.facilityType.trim()},${b.name.trim()},'proposed')`,
      sql`INSERT INTO public.beathealth_facilities(id,provider_profile_id,name,facility_type,location,contact,verification_state) VALUES(${facilityId},${profileId},${b.name.trim()},${b.facilityType.trim()},${JSON.stringify(b.location||{})}::jsonb,${JSON.stringify(b.contact||{})}::jsonb,'proposed')`
    ]);
    return json({service:"BeatHealth",status:"facility_created",verificationState:"PROPOSED",facilityId},201);
  } catch(e){const m=e instanceof Error?e.message:"BEATHEALTH_FACILITY_CREATE_FAILED";return json({service:"BeatHealth",error:m},m==="UNAUTHORIZED"?401:400);}
}

async function communityOperationsDashboard(request: Request, env: Env): Promise<Response> {
  try {
    const {participantId,sql}=await participantIdFromSession(request,env);
    const communities=await sql`
      SELECT c.* FROM public.communities c
      JOIN public.community_participations cp ON cp.community_id=c.id
      WHERE cp.participant_id=${participantId}
        AND cp.status IN ('active','approved')
        AND lower(cp.role) IN ('manager','community_manager','admin','representative','board')
      ORDER BY c.created_at DESC`;
    if(!communities.length) return json({service:"Zalagren",communities:[],message:"No community management role is currently connected to this participant."});
    const ids=communities.map((c:any)=>c.id);
    const [services,bindings,workOrders,invites,utilities,events]=await Promise.all([
      sql`SELECT id,name,domain,status,owner_mode,provider_joinable,first_party,launch_state FROM public.services ORDER BY name`,
      sql`SELECT b.*,s.name service_name,sp.display_name provider_profile_name FROM public.community_service_bindings b
          LEFT JOIN public.services s ON s.id=b.service_id
          LEFT JOIN public.service_provider_profiles sp ON sp.id=b.provider_profile_id
          WHERE b.community_id = ANY(${ids}) ORDER BY b.updated_at DESC`,
      sql`SELECT w.*,b.display_name service_name FROM public.community_work_orders w
          LEFT JOIN public.community_service_bindings b ON b.id=w.service_binding_id
          WHERE w.community_id = ANY(${ids}) ORDER BY w.created_at DESC LIMIT 100`,
      sql`SELECT i.*,s.name service_name FROM public.community_provider_invites i
          LEFT JOIN public.services s ON s.id=i.service_id
          WHERE i.community_id = ANY(${ids}) ORDER BY i.created_at DESC LIMIT 100`,
      sql`SELECT * FROM public.community_utility_accounts WHERE community_id = ANY(${ids}) ORDER BY updated_at DESC`,
      sql`SELECT e.*,b.display_name service_name FROM public.community_service_events e
          LEFT JOIN public.community_service_bindings b ON b.id=e.service_binding_id
          WHERE e.community_id = ANY(${ids}) ORDER BY e.occurred_at DESC LIMIT 100`
    ]);
    return json({service:"Zalagren",communities,services,bindings,workOrders,providerInvites:invites,utilities,events});
  } catch(e){const m=e instanceof Error?e.message:"COMMUNITY_OPERATIONS_LOOKUP_FAILED";return json({service:"Zalagren",error:m},m==="UNAUTHORIZED"?401:500);}
}

async function communityProviderJoin(request: Request, env: Env): Promise<Response> {
  try {
    const {participantId,sql}=await participantIdFromSession(request,env);
    const body=await request.json() as {communityId?:string;serviceId?:string;providerProfileId?:string;displayName?:string;category?:string;coverage?:unknown;contact?:unknown};
    if(!body.communityId||!body.serviceId||!body.displayName) return json({service:"Zalagren",error:"COMMUNITY_SERVICE_PROVIDER_REQUIRED"},400);
    const auth=await sql`SELECT 1 FROM public.community_participations WHERE community_id=${body.communityId} AND participant_id=${participantId} AND status IN ('active','approved') AND lower(role) IN ('manager','community_manager','admin','representative','board') LIMIT 1`;
    if(!auth.length) return json({service:"Zalagren",error:"COMMUNITY_MANAGEMENT_REQUIRED"},403);
    const service=await sql`SELECT id FROM public.services WHERE id=${body.serviceId} LIMIT 1`;
    if(!service.length) return json({service:"Zalagren",error:"SERVICE_NOT_FOUND"},404);
    const id="community-binding-"+crypto.randomUUID();
    const rows=await sql`INSERT INTO public.community_service_bindings(id,community_id,service_id,provider_profile_id,display_name,category,status,verification_state,coverage,contact,created_by_participant_id)
      VALUES(${id},${body.communityId},${body.serviceId},${body.providerProfileId||null},${String(body.displayName).trim()},${String(body.category||"service").trim()},'proposed','pending',${JSON.stringify(body.coverage||{})}::jsonb,${JSON.stringify(body.contact||{})}::jsonb,${participantId}) RETURNING *`;
    await sql`INSERT INTO public.community_service_events(id,community_id,service_binding_id,event_type,actor_participant_id,summary) VALUES(${"community-event-"+crypto.randomUUID()},${body.communityId},${id},'provider_join_requested',${participantId},${"Provider "+String(body.displayName).trim()+" requested community coordination."})`;
    return json({service:"Zalagren",status:"provider_join_requested",binding:rows[0]},201);
  } catch(e){return json({service:"Zalagren",error:e instanceof Error?e.message:"COMMUNITY_PROVIDER_JOIN_FAILED"},400);}
}

async function communityProviderInvite(request: Request, env: Env): Promise<Response> {
  try {
    const {participantId,sql}=await participantIdFromSession(request,env);
    const body=await request.json() as {communityId?:string;serviceId?:string;providerName?:string;contact?:unknown;message?:string};
    if(!body.communityId||!body.serviceId||!body.providerName) return json({service:"Zalagren",error:"PROVIDER_INVITE_REQUIRED"},400);
    const auth=await sql`SELECT 1 FROM public.community_participations WHERE community_id=${body.communityId} AND participant_id=${participantId} AND status IN ('active','approved') AND lower(role) IN ('manager','community_manager','admin','representative','board') LIMIT 1`;
    if(!auth.length) return json({service:"Zalagren",error:"COMMUNITY_MANAGEMENT_REQUIRED"},403);
    const id="community-provider-invite-"+crypto.randomUUID();
    const rows=await sql`INSERT INTO public.community_provider_invites(id,community_id,service_id,invited_by_participant_id,provider_name,contact,message) VALUES(${id},${body.communityId},${body.serviceId},${participantId},${String(body.providerName).trim()},${JSON.stringify(body.contact||{})}::jsonb,${body.message||null}) RETURNING *`;
    return json({service:"Zalagren",status:"provider_invited",invite:rows[0]},201);
  } catch(e){return json({service:"Zalagren",error:e instanceof Error?e.message:"COMMUNITY_PROVIDER_INVITE_FAILED"},400);}
}

async function communityWorkOrderCreate(request: Request, env: Env): Promise<Response> {
  try {
    const {participantId,sql}=await participantIdFromSession(request,env);
    const body=await request.json() as {communityId?:string;serviceBindingId?:string;title?:string;description?:string;priority?:string;placeId?:string;scheduledFor?:string};
    if(!body.communityId||!body.title) return json({service:"Zalagren",error:"WORK_ORDER_REQUIRED"},400);
    const auth=await sql`SELECT 1 FROM public.community_participations WHERE community_id=${body.communityId} AND participant_id=${participantId} AND status IN ('active','approved') AND lower(role) IN ('manager','community_manager','admin','representative','board') LIMIT 1`;
    if(!auth.length) return json({service:"Zalagren",error:"COMMUNITY_MANAGEMENT_REQUIRED"},403);
    const id="community-work-"+crypto.randomUUID();
    const rows=await sql`INSERT INTO public.community_work_orders(id,community_id,service_binding_id,requested_by_participant_id,title,description,priority,place_id,scheduled_for)
      VALUES(${id},${body.communityId},${body.serviceBindingId||null},${participantId},${String(body.title).trim()},${body.description||null},${String(body.priority||"normal").trim()},${body.placeId||null},${body.scheduledFor?new Date(body.scheduledFor):null}) RETURNING *`;
    return json({service:"Zalagren",status:"work_order_created",workOrder:rows[0]},201);
  } catch(e){return json({service:"Zalagren",error:e instanceof Error?e.message:"COMMUNITY_WORK_ORDER_FAILED"},400);}
}

async function communityUtilityLink(request: Request, env: Env): Promise<Response> {
  try {
    const {participantId,sql}=await participantIdFromSession(request,env);
    const body=await request.json() as {communityId?:string;providerName?:string;utilityType?:string;externalReference?:string;serviceBindingId?:string;metadata?:unknown};
    if(!body.communityId||!body.providerName||!body.utilityType) return json({service:"Zalagren",error:"UTILITY_LINK_REQUIRED"},400);
    const auth=await sql`SELECT 1 FROM public.community_participations WHERE community_id=${body.communityId} AND participant_id=${participantId} AND status IN ('active','approved') AND lower(role) IN ('manager','community_manager','admin','representative','board') LIMIT 1`;
    if(!auth.length) return json({service:"Zalagren",error:"COMMUNITY_MANAGEMENT_REQUIRED"},403);
    const id="community-utility-"+crypto.randomUUID();
    const rows=await sql`INSERT INTO public.community_utility_accounts(id,community_id,provider_name,utility_type,external_reference,service_binding_id,metadata) VALUES(${id},${body.communityId},${String(body.providerName).trim()},${String(body.utilityType).trim()},${body.externalReference||null},${body.serviceBindingId||null},${JSON.stringify(body.metadata||{})}::jsonb) RETURNING *`;
    return json({service:"Zalagren",status:"utility_linked",utility:rows[0]},201);
  } catch(e){return json({service:"Zalagren",error:e instanceof Error?e.message:"COMMUNITY_UTILITY_LINK_FAILED"},400);}
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null,{status:204,headers:headers({"access-control-allow-origin":"*","access-control-allow-headers":"content-type, authorization","access-control-allow-methods":"GET,POST,OPTIONS"})});
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") return renderHome(headers);
    if (request.method === "GET" && url.pathname === "/api/health") return health(env);
    if (request.method === "GET" && url.pathname === "/api/health/dashboard") return beatHealthDashboard(request, env);
    if (request.method === "GET" && url.pathname === "/api/health/search") return beatHealthSearch(request, env);
    if (request.method === "POST" && url.pathname === "/api/health/facility") return beatHealthCreateFacility(request, env);
    if (request.method === "GET" && url.pathname === "/api/foundation") return foundation(env);
    if (request.method === "GET" && url.pathname === "/api/home/communities") return homeCommunities(request, env);
    if (request.method === "GET" && url.pathname === "/api/home/services") return homeServices(request, env);
    if (request.method === "GET" && url.pathname === "/api/services/catalog") return publicServiceCatalog(request, env);
    if (request.method === "POST" && url.pathname === "/api/services/provider") return registerServiceProvider(request, env);
    if (request.method === "POST" && url.pathname === "/api/business") return createBusinessProfile(request, env);
    if (request.method === "POST" && url.pathname === "/api/invite") return createZalagrenInvitation(request, env);
    if (request.method === "POST" && url.pathname === "/api/invite/accept") return acceptZalagrenInvitation(request, env);
    if (request.method === "POST" && url.pathname === "/api/beatride/presence") return setBeatRidePresence(request, env);
    if (request.method === "POST" && url.pathname === "/api/beatride/vehicle") return addBeatRideVehicle(request, env);
    if (request.method === "POST" && url.pathname === "/api/beatride/offer/accept") return acceptBeatRideOffer(request, env);
    if (request.method === "POST" && url.pathname === "/api/beatride/trip") return updateBeatRideTrip(request, env);
    if (request.method === "POST" && url.pathname === "/api/guardian/incident") return guardianCreateIncident(request, env);
    if (request.method === "POST" && url.pathname === "/api/guardian/checkin") return guardianCreateCheckin(request, env);
    if (request.method === "GET" && url.pathname === "/api/home/foundation") return homeFoundation(request, env);
    if (request.method === "GET" && url.pathname === "/api/participation") return listParticipation(request, env);
    if (request.method === "GET" && url.pathname === "/api/community/management") return communityManagement(request, env);
    if (request.method === "GET" && url.pathname === "/api/community/management/operations") return communityOperationsDashboard(request, env);\n    if (request.method === "POST" && url.pathname === "/api/community/management/provider") return communityProviderJoin(request, env);\n    if (request.method === "POST" && url.pathname === "/api/community/management/provider/invite") return communityProviderInvite(request, env);\n    if (request.method === "POST" && url.pathname === "/api/community/management/work-order") return communityWorkOrderCreate(request, env);\n    if (request.method === "POST" && url.pathname === "/api/community/management/utility") return communityUtilityLink(request, env);\n
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
    if (request.method === "GET" && url.pathname === "/api/marketplace/mine") return listMyMarketplace(request, env);
    if (request.method === "POST" && url.pathname === "/api/marketplace/listing") return createMarketplaceListing(request, env);
    if (request.method === "POST" && url.pathname === "/api/marketplace/accommodation") return createAccommodationProfile(request, env);
    if (request.method === "POST" && url.pathname === "/api/beatfood/merchant") return createBeatFoodMerchant(request, env);
    if (request.method === "POST" && url.pathname === "/api/beatfood/item") return createBeatFoodItem(request, env);
    if (request.method === "POST" && url.pathname === "/api/beatfood/order") return createBeatFoodOrder(request, env);
    if (request.method === "POST" && url.pathname === "/api/beatride/profile") return createBeatRideProfile(request, env);
    if (request.method === "POST" && url.pathname === "/api/beatride/request") return requestBeatRide(request, env);
    if (request.method === "GET" && url.pathname === "/api/me") return me(request, env);
    if (request.method === "POST" && url.pathname === "/api/auth/sign-up/email") return authMutation(request, env, "/sign-up/email");
    if (request.method === "POST" && url.pathname === "/api/auth/sign-in/email") return authMutation(request, env, "/sign-in/email");
    if (request.method === "POST" && url.pathname === "/api/auth/email/verification/send") return sendEmailVerification(request, env);
    if (request.method === "POST" && url.pathname === "/api/auth/email/verification/verify") return verifyEmailVerificationCode(request, env);
    if (request.method === "POST" && url.pathname === "/api/identity/legal") return saveLegalIdentity(request, env);
    if (request.method === "POST" && url.pathname === "/api/contact/phone/start") return startPhoneVerification(request, env);
    if (request.method === "POST" && url.pathname === "/api/contact/phone/verify") return verifyPhone(request, env);
    if (request.method === "POST" && url.pathname === "/api/auth/sign-out") {
      try {
        const outHeaders = headers({"content-type":"application/json; charset=utf-8"});
        const cookieHeader = request.headers.get("cookie") || "";
        const tokenMatches = [
          cookieHeader.match(/(?:^|;\s*)__Host-zalagren_session=([^;]+)/)
        ].filter(Boolean) as RegExpMatchArray[];
        if (tokenMatches.length) {
          const sql = requireDatabase(env);
          for (const tokenMatch of tokenMatches) {
            const tokenHash = await sha256Hex(decodeURIComponent(tokenMatch[1]));
            await sql`UPDATE public.sessions SET expires_at=now() WHERE session_token_hash=${tokenHash} AND expires_at > now()`;
          }
        }
        try {
          const upstream = await providerRequest(request, env, "/sign-out");
          const setCookies = providerCookies(upstream);
          for (const cookie of setCookies) outHeaders.append("set-cookie", normalizeSetCookieForHost(cookie));
        } catch {}
        outHeaders.append("set-cookie", "__Host-zalagren_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax");
        return new Response(JSON.stringify({service:"Zalagren",status:"signed_out",sessionRevoked:true}),{status:200,headers:outHeaders});
      } catch (error) {
        return json({error:error instanceof Error?error.message:"SIGN_OUT_FAILED"},500);
      }
    }
    if (request.method === "POST" && url.pathname === "/api/onboarding/participant") return bootstrapParticipant(request,env);
    return json({service:"Zalagren",error:"NOT_FOUND"},404);
  }
};
