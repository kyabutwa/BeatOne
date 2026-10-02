import { neon } from "@neondatabase/serverless";

interface Env {
  DATABASE_URL: string;
  BOOTSTRAP_TOKEN?: string;
}

type DbSql = ReturnType<typeof neon>;

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type, authorization",
      "access-control-allow-methods": "GET,POST,OPTIONS"
    }
  });

const html = (): Response =>
  new Response(\`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Zalagren</title>
<style>
:root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#0b1f3a;background:#fff}
*{box-sizing:border-box}body{margin:0;min-height:100vh}main{max-width:980px;margin:auto;padding:28px 20px 64px}
header{display:flex;align-items:center;justify-content:space-between;border:1px solid #dbe3ee;border-radius:20px;padding:16px 18px;background:#fff;box-shadow:0 8px 30px #0b1f3a0d}
.brand{font-size:22px;font-weight:750;color:#14833b}.menu{font-size:22px;color:#0b1f3a}.hero{padding:64px 8px 36px}
.eyebrow{font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#c66b22}
h1{font-size:clamp(42px,8vw,76px);line-height:.98;margin:12px 0 20px;color:#0b1f3a}
p{font-size:18px;line-height:1.6;color:#43536a;max-width:700px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin-top:28px}
.card{border:1px solid #dbe3ee;border-radius:18px;padding:20px;background:#fff}.card b{display:block;font-size:17px;margin-bottom:7px}.card span{color:#627188;font-size:14px;line-height:1.5}
.status{margin-top:28px;padding:16px 18px;border-radius:16px;background:#f4f7fb;border:1px solid #dbe3ee}
</style></head><body><main><header><div class="brand">Zalagren</div><div class="menu">•••</div></header>
<section class="hero"><div class="eyebrow">Intelligent Living Infrastructure</div>
<h1>One identity.<br>Connected possibilities.</h1>
<p>Zalagren coordinates people, places, needs, capabilities, authority and resources into real-world outcomes — with participant and community authority at the center.</p>
<div class="grid"><div class="card"><b>Identity</b><span>Persistent participant foundation and contextual access.</span></div>
<div class="card"><b>Communities</b><span>People, places, relationships and shared context.</span></div>
<div class="card"><b>Services</b><span>Actions, execution, events and evidence across the ecosystem.</span></div>
<div class="card"><b>GENESIS</b><span>Intelligence and proposals without becoming authority.</span></div></div>
<div class="status"><b>Infrastructure:</b> production service boundary is connected to the canonical foundation.</div>
</section></main></body></html>\`,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}});

const requireDatabase = (env: Env): DbSql => {
  if (!env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  return neon(env.DATABASE_URL);
};

async function health(env: Env): Promise<Response> {
  try {
    const sql = requireDatabase(env);
    const [db] = await sql\`SELECT current_database() AS database, now() AS server_time\`;
    const [ledger] = await sql\`SELECT count(*)::int AS migrations FROM public.zalagren_schema_migrations\`;
    return json({service:"Zalagren",status:"ok",database:db?.database,serverTime:db?.server_time,migrationCount:ledger?.migrations ?? 0});
  } catch (error) {
    return json({service:"Zalagren",status:"database_unavailable",error:error instanceof Error?error.message:"UNKNOWN_ERROR"},503);
  }
}

async function foundation(env: Env): Promise<Response> {
  try {
    const sql = requireDatabase(env);
    const [row] = await sql\`
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
    \`;
    return json({service:"Zalagren",foundation:row});
  } catch (error) {
    return json({service:"Zalagren",status:"database_unavailable",error:error instanceof Error?error.message:"UNKNOWN_ERROR"},503);
  }
}

async function bootstrapParticipant(request: Request, env: Env): Promise<Response> {
  if (!env.BOOTSTRAP_TOKEN) return json({error:"BOOTSTRAP_NOT_CONFIGURED"},503);
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\\s+/i,"");
  if (!supplied || supplied !== env.BOOTSTRAP_TOKEN) return json({error:"UNAUTHORIZED"},401);
  try {
    const sql = requireDatabase(env);
    const id = crypto.randomUUID();
    const personId = "person-" + id, identityId = "identity-" + id, participantId = "participant-" + id, accountId = "account-" + id;
    await sql.transaction([
      sql\`INSERT INTO public.persons (id) VALUES (\${personId})\`,
      sql\`INSERT INTO public.identities (id, kind, person_id) VALUES (\${identityId}, 'human', \${personId})\`,
      sql\`INSERT INTO public.participants (id, identity_id) VALUES (\${participantId}, \${identityId})\`,
      sql\`INSERT INTO public.accounts (id, identity_id, status) VALUES (\${accountId}, \${identityId}, 'ACTIVE')\`
    ]);
    return json({service:"Zalagren",status:"provisioned",personId,identityId,participantId,accountId,next:"credential_and_session_authentication"},201);
  } catch (error) {
    return json({error:error instanceof Error?error.message:"PROVISIONING_FAILED"},500);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null,{status:204});
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") return html();
    if (request.method === "GET" && url.pathname === "/api/health") return health(env);
    if (request.method === "GET" && url.pathname === "/api/foundation") return foundation(env);
    if (request.method === "POST" && url.pathname === "/api/onboarding/participant") return bootstrapParticipant(request,env);
    return json({service:"Zalagren",error:"NOT_FOUND"},404);
  }
};
