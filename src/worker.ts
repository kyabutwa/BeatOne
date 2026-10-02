import { neon } from "@neondatabase/serverless";

interface Env {
  DATABASE_URL: string;
  BOOTSTRAP_TOKEN?: string;
  NEON_AUTH_BASE_URL?: string;
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

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

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
  const upstream = new Headers({ accept: "application/json" });
  const cookie = request.headers.get("cookie");
  if (cookie) upstream.set("cookie", cookie);
  const contentType = request.headers.get("content-type");
  if (contentType) upstream.set("content-type", contentType);

  return fetch(new Request(authBase(env) + endpoint, {
    method: body === undefined ? request.method : "POST",
    headers: upstream,
    body: body === undefined ? undefined : JSON.stringify(body),
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

  const cookieMaterial = cookieHeader || setCookies.join("; ");
  if (!cookieMaterial) throw new Error("AUTH_SESSION_COOKIE_MISSING");
  const tokenHash = await sha256(cookieMaterial);
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
      user: user ? { id: user.id, name: user.name, email: user.email } : undefined,
      canonical
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

async function me(request: Request, env: Env): Promise<Response> {
  try {
    const active = await currentSession(request, env);
    if (!active) return json({ service: "Zalagren", error: "UNAUTHORIZED" }, 401);
    return json({
      service: "Zalagren",
      authenticated: true,
      participant: active.canonical,
      identity: { provider: "neon-auth", userId: active.user.id, name: active.user.name, email: active.user.email },
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

const html = (): Response =>
  new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Zalagren</title>
<style>
:root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#0b1f3a;background:#fff}
*{box-sizing:border-box}body{margin:0;min-height:100vh}main{max-width:980px;margin:auto;padding:20px 16px 64px}
header{display:flex;align-items:center;justify-content:space-between;border:1px solid #dbe3ee;border-radius:20px;padding:14px 18px;background:#fff;box-shadow:0 8px 30px #0b1f3a0d;position:sticky;top:12px;z-index:2}
.brand{font-size:22px;font-weight:750;color:#14833b}.menu{font-size:22px;color:#0b1f3a}
.hero{padding:48px 4px 28px}.eyebrow{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#c66b22}
h1{font-size:clamp(40px,9vw,72px);line-height:.98;margin:12px 0 18px;color:#0b1f3a}p{font-size:17px;line-height:1.55;color:#43536a;max-width:700px}
.panel{max-width:460px;border:1px solid #dbe3ee;border-radius:20px;padding:20px;background:#fff;box-shadow:0 12px 36px #0b1f3a0b}
input,button{width:100%;padding:13px 14px;border-radius:12px;border:1px solid #cdd8e6;font:inherit;margin-top:10px}button{background:#0b1f3a;color:#fff;border:0;font-weight:700;cursor:pointer}.secondary{background:#f4f7fb;color:#0b1f3a}
.switch{font-size:13px;color:#627188;margin-top:12px;text-align:center;cursor:pointer}.error{color:#a33b2b;font-size:13px;margin-top:10px}.hidden{display:none}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin-top:24px}.card{border:1px solid #dbe3ee;border-radius:18px;padding:20px;background:#fff}.card b{display:block;font-size:17px;margin-bottom:7px}.card span{color:#627188;font-size:14px;line-height:1.5}.status{margin-top:24px;padding:15px 17px;border-radius:16px;background:#f4f7fb;border:1px solid #dbe3ee}
</style></head><body><main>
<header><div class="brand">Zalagren</div><div class="menu">•••</div></header>
<section class="hero" id="auth"><div class="eyebrow">Intelligent Living Infrastructure</div><h1>One identity.<br>Connected possibilities.</h1>
<p>Enter Zalagren through a real participant identity. Authentication is handled by the frozen Neon Managed Better Auth boundary; participant authority remains in BeatCore.</p>
<div class="panel"><b id="formTitle">Create your identity</b><input id="name" placeholder="Your name"><input id="email" type="email" placeholder="Email"><input id="password" type="password" placeholder="Password (8+ characters)"><button id="submit">Create account</button><button id="demo" class="secondary" type="button">Sign in instead</button><div id="error" class="error"></div></div></section>
<section class="hero hidden" id="home"><div class="eyebrow">Participant home</div><h1 id="welcome">Welcome.</h1><p id="identity"></p><div class="grid"><div class="card"><b>Identity</b><span>Your persistent participant foundation is active.</span></div><div class="card"><b>Communities</b><span>Context and participation can be connected here.</span></div><div class="card"><b>Services</b><span>Services become actions only through authorized context.</span></div><div class="card"><b>GENESIS</b><span>Intelligence proposes; authorized participants decide.</span></div></div><div class="status"><b>Session:</b> authenticated through the production auth boundary.</div><button id="signout" class="secondary">Sign out</button></section>
</main>
<script>
let signup=true;
const $=id=>document.getElementById(id);
function mode(){ $("formTitle").textContent=signup?"Create your identity":"Welcome back"; $("submit").textContent=signup?"Create account":"Sign in"; $("demo").textContent=signup?"Sign in instead":"Create an account"; $("name").classList.toggle("hidden",!signup); $("password").placeholder=signup?"Password (8+ characters)":"Password"; }
async function check(){ const r=await fetch("/api/me"); if(r.ok){const d=await r.json(); showHome(d)}}
function showHome(d){$("auth").classList.add("hidden");$("home").classList.remove("hidden");$("welcome").textContent="Welcome, "+(d.identity.name||"participant")+"."; $("identity").textContent=d.identity.email+" · Participant "+d.participant.participantId}
$("demo").onclick=()=>{signup=!signup;mode();$("error").textContent=""};
$("submit").onclick=async()=>{ $("error").textContent=""; const body={email:$("email").value.trim(),password:$("password").value}; if(signup)body.name=$("name").value.trim(); const r=await fetch(signup?"/api/auth/sign-up/email":"/api/auth/sign-in/email",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}); const d=await r.json(); if(!r.ok){$("error").textContent=d.error||"Authentication failed";return} showHome(d.canonical?{identity:d.user,participant:d.canonical}:await (await fetch("/api/me")).json())};
$("signout").onclick=async()=>{await fetch("/api/auth/sign-out",{method:"POST"}); location.reload()};
mode(); check();
</script></body></html>`, {headers: headers({"content-type":"text/html; charset=utf-8"})});

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
    if (request.method === "GET" && url.pathname === "/") return html();
    if (request.method === "GET" && url.pathname === "/api/health") return health(env);
    if (request.method === "GET" && url.pathname === "/api/foundation") return foundation(env);
    if (request.method === "GET" && url.pathname === "/api/me") return me(request, env);
    if (request.method === "POST" && url.pathname === "/api/auth/sign-up/email") return authMutation(request, env, "/sign-up/email");
    if (request.method === "POST" && url.pathname === "/api/auth/sign-in/email") return authMutation(request, env, "/sign-in/email");
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
