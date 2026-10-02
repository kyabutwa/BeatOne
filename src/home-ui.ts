export const renderHome = (headers: (extra?: HeadersInit) => Headers): Response =>
  new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Zalagren</title>
<style>
:root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#0b1f3a;background:#fff}
*{box-sizing:border-box}body{margin:0;min-height:100vh}main{max-width:980px;margin:auto;padding:20px 16px 64px}
header{display:flex;align-items:center;justify-content:space-between;border:1px solid #dbe3ee;border-radius:20px;padding:14px 18px;background:#fff;box-shadow:0 8px 30px #0b1f3a0d;position:sticky;top:12px;z-index:3}
.brand{font-size:22px;font-weight:750;color:#14833b}.menu{font-size:22px;color:#0b1f3a;letter-spacing:3px}
.hero{padding:42px 4px 24px}.eyebrow{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#c66b22}
h1{font-size:clamp(38px,9vw,68px);line-height:1;margin:12px 0 16px;color:#0b1f3a}p{font-size:16px;line-height:1.55;color:#43536a;max-width:700px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin-top:24px}.card{border:1px solid #dbe3ee;border-radius:18px;padding:20px;background:#fff;box-shadow:0 8px 24px #0b1f3a08;cursor:pointer;transition:transform .15s,border-color .15s}.card:hover{transform:translateY(-2px);border-color:#9eb0c8}.card b{display:block;font-size:17px;margin-bottom:7px}.card span{color:#627188;font-size:14px;line-height:1.5}
.status{margin-top:24px;padding:15px 17px;border-radius:16px;background:#f4f7fb;border:1px solid #dbe3ee}
.view{display:none;margin-top:18px;border:1px solid #dbe3ee;border-radius:20px;padding:20px;background:#fff}.view.active{display:block}.view h2{margin:0 0 8px}.row{padding:13px 0;border-top:1px solid #edf1f6}.row:first-child{border-top:0}.muted{color:#627188;font-size:14px}.pill{display:inline-block;padding:4px 8px;border-radius:999px;background:#eef3f8;font-size:12px;margin-left:6px}
button{width:100%;padding:13px 14px;border-radius:12px;border:0;font:inherit;font-weight:700;cursor:pointer;background:#0b1f3a;color:#fff;margin-top:12px}.secondary{background:#f4f7fb;color:#0b1f3a}
.auth{max-width:460px;border:1px solid #dbe3ee;border-radius:20px;padding:20px;background:#fff;box-shadow:0 12px 36px #0b1f3a0b}input{width:100%;padding:13px 14px;border-radius:12px;border:1px solid #cdd8e6;font:inherit;margin-top:10px}.switch{font-size:13px;color:#627188;margin-top:12px;text-align:center;cursor:pointer}.error{color:#a33b2b;font-size:13px;margin-top:10px}.hidden{display:none}
</style></head><body><main>
<header><div class="brand">Zalagren</div><div class="menu">•••</div></header>
<section class="hero" id="auth"><div class="eyebrow">Intelligent Living Infrastructure</div><h1>One identity.<br>Connected possibilities.</h1>
<p>Enter Zalagren through a real participant identity. Authentication is handled by the production auth boundary; participant authority remains in BeatCore.</p>
<div class="auth"><b id="formTitle">Create your identity</b><input id="name" placeholder="Your name"><input id="email" type="email" placeholder="Email"><input id="password" type="password" placeholder="Password (8+ characters)"><button id="submit">Create account</button><button id="demo" class="secondary" type="button">Sign in instead</button><div id="error" class="error"></div></div></section>
<section class="hero hidden" id="home"><div class="eyebrow">Participant home</div><h1 id="welcome">Welcome.</h1><p id="identity"></p>
<div class="grid">
<div class="card" data-view="identityView"><b>Identity</b><span>Persistent participant foundation and session state.</span></div>
<div class="card" data-view="communityView"><b>Communities</b><span>Explore communities currently connected to your participation.</span></div>
<div class="card" data-view="serviceView"><b>Services</b><span>See the real service catalog and capability state.</span></div>
<div class="card" data-view="genesisView"><b>GENESIS</b><span>View intelligence state without granting intelligence authority.</span></div>
</div>
<div id="identityView" class="view"><h2>Identity</h2><div id="identityBody" class="muted">Loading…</div></div>
<div id="communityView" class="view"><h2>Communities</h2><div id="communityBody" class="muted">Loading…</div></div>
<div id="serviceView" class="view"><h2>Services</h2><div id="serviceBody" class="muted">Loading…</div></div>
<div id="genesisView" class="view"><h2>GENESIS</h2><div id="genesisBody" class="muted">Loading…</div></div>
<div class="status"><b>Session:</b> authenticated through the production auth boundary.</div>
<button id="signout" class="secondary">Sign out</button></section>
</main>
<script>
let signup=true;
const $=id=>document.getElementById(id);
function mode(){ $("formTitle").textContent=signup?"Create your identity":"Welcome back"; $("submit").textContent=signup?"Create account":"Sign in"; $("demo").textContent=signup?"Sign in instead":"Create an account"; $("name").classList.toggle("hidden",!signup); $("password").placeholder=signup?"Password (8+ characters)":"Password"; }
function showHome(d){ $("auth").classList.add("hidden"); $("home").classList.remove("hidden"); $("welcome").textContent="Welcome, "+(d.identity.name||"participant")+"."; $("identity").textContent=d.identity.email+" · Participant "+d.participant.participantId; $("identityBody").innerHTML="<b>Participant</b><div>"+d.participant.participantId+"</div><div class='muted'>Identity provider: "+d.identity.provider+"</div><div class='muted'>Account: "+(d.participant.accountId||"ready")+"</div>"; loadViews(); }
async function loadViews(){
  try{const [c,s,f]=await Promise.all([fetch("/api/home/communities"),fetch("/api/home/services"),fetch("/api/home/foundation")]);
  const communities=await c.json(), services=await s.json(), foundation=await f.json();
  $("communityBody").innerHTML=communities.items?.length?communities.items.map(x=>"<div class='row'><b>"+x.name+"</b><div class='muted'>"+x.type+" · "+x.location+" <span class='pill'>"+x.verification+"</span></div></div>").join(""):"<div class='row'><b>No communities connected yet.</b><div class='muted'>This is a real empty state; nothing has been invented for your participant.</div></div>";
  $("serviceBody").innerHTML=services.items?.length?services.items.map(x=>"<div class='row'><b>"+x.name+"</b><div class='muted'>"+x.domain+" <span class='pill'>"+x.status+"</span></div>"+(x.capabilities?.length?"<div class='muted'>Capabilities: "+x.capabilities.map(c=>c.name).join(", ")+"</div>":"")+"</div>").join(""):"<div class='row'><b>No services are registered yet.</b><div class='muted'>The service layer is empty in production; Zalagren will not pretend a provider is connected.</div></div>";
  $("genesisBody").innerHTML="<div class='row'><b>Proposal-only intelligence</b><div class='muted'>GENESIS does not authorize or execute actions.</div></div><div class='row'><b>Live foundation</b><div class='muted'>Participants: "+foundation.foundation.participants+" · Contexts: "+foundation.foundation.contexts+" · Intents: "+foundation.foundation.intents+" · Proposals: "+foundation.foundation.proposals+" · Actions: "+foundation.foundation.actions+" · Events: "+foundation.foundation.events+"</div></div>";
  }catch(e){["communityBody","serviceBody","genesisBody"].forEach(id=>$(id).textContent="Unable to load live data.");}
}
document.querySelectorAll(".card").forEach(card=>card.onclick=()=>{document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));$(card.dataset.view).classList.add("active");$(card.dataset.view).scrollIntoView({behavior:"smooth",block:"start"});});
$("demo").onclick=()=>{signup=!signup;mode();$("error").textContent=""};
$("submit").onclick=async()=>{$("error").textContent="";const body={email:$("email").value.trim(),password:$("password").value};if(signup)body.name=$("name").value.trim();const r=await fetch(signup?"/api/auth/sign-up/email":"/api/auth/sign-in/email",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const d=await r.json();if(!r.ok){$("error").textContent=d.error||"Authentication failed";return}showHome(d.canonical?{identity:d.user,participant:d.canonical}:await(await fetch("/api/me")).json());};
$("signout").onclick=async()=>{await fetch("/api/auth/sign-out",{method:"POST"});location.reload()};
async function check(){const r=await fetch("/api/me");if(r.ok)showHome(await r.json())} mode();check();
</script></body></html>`,{headers:headers({"content-type":"text/html; charset=utf-8"})});
