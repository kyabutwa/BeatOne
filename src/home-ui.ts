const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const ZALAGREN_LOGO = "https://raw.githubusercontent.com/kyabutwa/BeatOne/main/IMG_1383.jpeg";
const ZALAGREN_REFERENCE_IMAGE = "https://raw.githubusercontent.com/kyabutwa/BeatOne/main/IMG_1384.jpeg";

export const renderHome = (headers: (extra?: HeadersInit) => Headers): Response =>
  new Response(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#ffffff">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="preload" as="image" href="${ZALAGREN_LOGO}">
<link rel="icon" href="${ZALAGREN_LOGO}">
<title>Zalagren</title>
<style>
:root{
 --canvas:#fff;--surface:#fff;--surface-2:#f6f8fb;--navy:#071a33;--blue:#f27a21;
 --orange:#f27a21;--muted:#64748b;--line:#dfe5ec;--line-soft:#edf1f5;
 --danger:#a63a2b;--radius-xl:24px;--radius-lg:20px;--radius-md:16px;
 --shadow:0 12px 34px rgba(7,26,51,.07);
 font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display","Segoe UI",sans-serif;
}
*{box-sizing:border-box}
html{background:var(--canvas);scroll-behavior:smooth}
body{margin:0;background:var(--canvas);color:var(--navy);min-height:100vh;-webkit-font-smoothing:antialiased}
button,input{font:inherit}button{cursor:pointer}
button:focus-visible,input:focus-visible{outline:3px solid rgba(242,122,33,.34);outline-offset:2px}
.shell{width:min(100% - 24px,1080px);margin:0 auto;padding:6px 0 94px}
.topbar{
 position:sticky;top:6px;z-index:40;display:grid;grid-template-columns:44px 1fr auto;align-items:center;
 min-height:58px;padding:7px 8px;border:1px solid var(--line);border-radius:20px;background:rgba(255,255,255,.96);
 box-shadow:0 8px 28px rgba(7,26,51,.07);backdrop-filter:saturate(180%) blur(18px)
}
.top-action{width:42px;height:42px;border:0;border-radius:13px;background:transparent;color:var(--navy);display:grid;place-items:center}
.menu-lines{width:18px;display:grid;gap:4px}.menu-lines span{height:2px;border-radius:2px;background:currentColor}
.brand-lockup{display:flex;justify-content:center;align-items:center;height:44px;min-width:0}
.brand-logo{display:block;width:auto;height:34px;max-width:min(190px,46vw);object-fit:contain;object-position:center}
.account-control{display:flex;align-items:center;gap:8px;min-height:42px;padding:0 11px;border:1px solid var(--line);border-radius:13px;background:var(--surface);color:var(--navy);font-size:13px;font-weight:700;white-space:nowrap}
.account-dot{width:7px;height:7px;border-radius:50%;background:var(--orange)}
.page{padding:14px 0}
.eyebrow{font-size:11px;line-height:16px;font-weight:750;letter-spacing:.105em;text-transform:uppercase;color:var(--orange)}
.title{font-size:clamp(29px,6vw,42px);line-height:1.08;letter-spacing:-.025em;font-weight:760;margin:7px 0 9px;max-width:720px}
.lede{font-size:15px;line-height:23px;color:var(--muted);max-width:700px;margin:0}
.home-intro{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}
.context-chip{display:inline-flex;align-items:center;gap:7px;min-height:32px;padding:7px 10px;border:1px solid var(--line);border-radius:999px;background:var(--surface-2);font-size:12px;font-weight:700;color:var(--navy);white-space:nowrap}
.context-chip i{width:7px;height:7px;border-radius:50%;background:var(--orange);display:block}
.section{margin-top:28px}
.section-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:12px}
.section-title{font-size:20px;line-height:26px;letter-spacing:-.01em;font-weight:760;margin:0}
.section-copy{font-size:13px;line-height:19px;color:var(--muted);margin:3px 0 0}
.link-button{border:0;background:none;color:var(--orange);font-size:13px;font-weight:750;padding:5px 0}
.context-card,.auth-card,.detail-card{
 border:1px solid var(--line);border-radius:var(--radius-xl);background:var(--surface);box-shadow:var(--shadow)
}
.context-card{padding:18px}
.context-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.context-item{padding:13px;border-radius:15px;background:var(--surface-2);border:1px solid var(--line-soft);min-height:82px}
.context-label{font-size:11px;line-height:16px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.07em}
.context-value{font-size:15px;line-height:21px;font-weight:730;margin-top:5px}
.surface-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.surface{
 min-height:148px;padding:17px;text-align:left;border:1px solid var(--line);border-radius:var(--radius-lg);background:var(--surface);
 box-shadow:0 6px 20px rgba(7,26,51,.045);transition:transform .16s ease,border-color .16s ease
}
.surface:hover{transform:translateY(-1px);border-color:#b8c6d6}
.surface-mark{font-size:11px;line-height:16px;color:var(--orange);font-weight:750;letter-spacing:.08em}
.surface-title{font-size:18px;line-height:23px;font-weight:750;margin-top:10px}
.surface-copy{font-size:13px;line-height:19px;color:var(--muted);margin-top:5px;max-width:390px}
.surface-state{margin-top:14px;font-size:12px;line-height:17px;color:var(--orange);font-weight:700}
.participant-card{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;padding:18px}
.identity{font-size:16px;line-height:22px;font-weight:730}.identity-meta{font-size:13px;line-height:20px;color:var(--muted);margin-top:3px;overflow-wrap:anywhere}
.pill{display:inline-flex;align-items:center;min-height:25px;padding:4px 9px;border-radius:999px;background:#fff1e8;color:var(--orange);font-size:11px;line-height:16px;font-weight:750}
.detail-card{display:none;margin-top:12px;padding:18px}.detail-card.active{display:block}
.detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px}
.detail-title{font-size:20px;line-height:26px;font-weight:760;margin:0}.detail-sub{font-size:13px;line-height:19px;color:var(--muted);margin-top:3px}
.row{padding:13px 0;border-top:1px solid var(--line-soft)}.row:first-child{border-top:0}.row-title{font-size:14px;line-height:20px;font-weight:700}.row-meta{font-size:13px;line-height:19px;color:var(--muted);margin-top:3px}
.auth-wrap{max-width:480px}.auth-card{padding:20px}.auth-title{font-size:18px;line-height:24px;font-weight:750}
.label{display:block;font-size:13px;line-height:19px;font-weight:700;margin:15px 0 6px}
input{width:100%;min-height:46px;padding:11px 13px;border:1px solid #cbd5e1;border-radius:13px;background:#fff;color:var(--navy)}
input::placeholder{color:#7a8798}
.actions{display:flex;gap:9px;margin-top:17px}.action{min-height:44px;padding:10px 15px;border:0;border-radius:13px;font-weight:750}.primary{background:var(--navy);color:#fff}.secondary{background:var(--surface-2);color:var(--navy);border:1px solid var(--line)}
.error{min-height:20px;margin-top:10px;color:var(--danger);font-size:13px;line-height:19px}.hidden{display:none!important}
.status{margin-top:14px;padding:14px 15px;border-radius:16px;background:var(--surface-2);border:1px solid var(--line);font-size:13px;line-height:19px;color:var(--muted)}.status strong{color:var(--navy)}
.bottom-nav{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:35;width:min(calc(100% - 24px),620px);display:grid;grid-template-columns:repeat(5,1fr);padding:6px;border:1px solid var(--line);border-radius:20px;background:rgba(255,255,255,.96);box-shadow:0 10px 30px rgba(7,26,51,.11);backdrop-filter:saturate(180%) blur(18px)}
.bottom-nav button{min-height:42px;border:0;border-radius:14px;background:transparent;color:var(--muted);font-size:11px;font-weight:750}.bottom-nav button.active{background:#fff1e8;color:var(--orange)}
.overlay{position:fixed;inset:0;z-index:60;background:rgba(255,255,255,.98);display:none;overflow:auto}.overlay.open{display:block}
.overlay-shell{width:min(100% - 28px,900px);margin:0 auto;padding:18px 0 50px}.overlay-head{display:flex;align-items:center;justify-content:space-between}.overlay-title{font-size:28px;line-height:34px;font-weight:760;margin:30px 0 6px}.overlay-copy{font-size:14px;line-height:21px;color:var(--muted);max-width:600px}
.menu-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:22px}.menu-item{text-align:left;padding:16px;border:1px solid var(--line);border-radius:18px;background:#fff}.menu-item strong{font-size:15px;line-height:20px}.menu-item span{display:block;font-size:12px;line-height:18px;color:var(--muted);margin-top:4px}
@media(max-width:700px){.shell{padding-top:4px}.topbar{top:4px}.account-control span{display:none}.home-intro{display:block}.context-chip{margin-top:12px}.context-grid{grid-template-columns:1fr}.surface-grid{grid-template-columns:1fr}.surface{min-height:128px}.participant-card{grid-template-columns:1fr}.actions{flex-direction:column}.action{width:100%}.menu-grid{grid-template-columns:1fr}}
@media(min-width:701px){.page{padding-top:18px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.surface{transition:none}.surface:hover{transform:none}}
/* Owner-provided EarthBeat/Zalagren reference artwork remains intact and is never recolored. Interface blue accents are unified to Tsavo orange. */</style>
</head>
<body>
<div class="overlay" id="menuOverlay" aria-hidden="true">
 <div class="overlay-shell">
  <div class="overlay-head"><img class="brand-logo" src="${ZALAGREN_LOGO}" alt="Zalagren"><button class="top-action" id="closeMenu" type="button" aria-label="Close menu">×</button></div>
  <div class="eyebrow" style="margin-top:34px">Zalagren</div>
  <h2 class="overlay-title">Everything connected to participation.</h2>
  <p class="overlay-copy">Navigate the ecosystem by context, capability and authority. A surface may be ready, modelled, externally pending or Phase 2; the interface never hides that state.</p>
  <div class="menu-grid">
   <button class="menu-item" data-nav="home"><strong>Home</strong><span>Participant context and operating surfaces</span></button>
   <button class="menu-item" data-nav="world"><strong>World</strong><span>Communities, places, phases and context</span></button>
   <button class="menu-item" data-nav="services"><strong>Services</strong><span>Capabilities and available actions</span></button>
   <button class="menu-item" data-nav="community"><strong>Community</strong><span>People, relationships and participation</span></button>
   <button class="menu-item" data-nav="genesis"><strong>GENESIS</strong><span>Knowledge and proposal-only intelligence</span></button>
   <button class="menu-item" data-nav="activity"><strong>Activity</strong><span>Actions, events and evidence</span></button>
   <button class="menu-item" data-nav="account"><strong>My Zalagren</strong><span>Identity, authority, requests and settings</span></button>
   <button class="menu-item" data-nav="management"><strong>Team Workspace</strong><span>Management and provider operations</span></button>
  </div>
 </div>
</div>

<main class="shell">
<header class="topbar">
 <button class="top-action" id="openMenu" type="button" aria-label="Open Zalagren menu"><span class="menu-lines"><span></span><span></span><span></span></span></button>
 <div class="brand-lockup"><img class="brand-logo" src="${ZALAGREN_LOGO}" alt="Zalagren"></div>
 <button class="account-control" id="account" type="button"><i class="account-dot"></i><span>My Zalagren</span></button>
</header>

<section class="page" id="auth">
 <div class="eyebrow">Intelligent Living Infrastructure</div>
 <h1 class="title">One identity. Connected possibilities.</h1>
 <p class="lede">Zalagren coordinates people, places, needs, capabilities, authority and resources without pretending to be the regulated provider underneath them.</p>
 <div class="auth-wrap">
  <form class="auth-card" id="authForm">
   <div id="formTitle" class="auth-title">Create your identity</div>
   <label class="label" for="name">Name</label><input id="name" autocomplete="name" placeholder="Your name">
   <label class="label" for="email">Email</label><input id="email" autocomplete="email" inputmode="email" type="email" placeholder="you@example.com">
   <label class="label" for="password">Password</label><input id="password" autocomplete="new-password" type="password" placeholder="Password (8+ characters)">
   <div class="actions"><button id="submit" class="action primary" type="submit">Create account</button><button id="mode" class="action secondary" type="button">Sign in instead</button></div>
   <div id="error" class="error" role="alert" aria-live="polite"></div>
  </form>
 </div>
</section>

<section class="page hidden" id="home">
 <div class="home-intro">
  <div><div class="eyebrow">Participant Home</div><h1 id="welcome" class="title">Welcome.</h1><p class="lede">Your Zalagren starts from identity, then becomes useful through real context and explicit authority.</p></div>
  <div class="context-chip"><i></i><span id="contextText">No active community context</span></div>
 </div>

 <section class="section" id="contextSection">
  <div class="section-head"><div><h2 class="section-title">Current context</h2><p class="section-copy">Context comes before action.</p></div><button class="link-button" data-detail="identityDetail">View identity</button></div>
  <div class="context-card"><div class="context-grid">
   <div class="context-item"><div class="context-label">Participant</div><div class="context-value" id="contextParticipant">—</div></div>
   <div class="context-item"><div class="context-label">Community</div><div class="context-value">Not connected</div></div>
   <div class="context-item"><div class="context-label">Authority</div><div class="context-value">Context required</div></div>
  </div></div>
 </section>

 <section class="section">
  <div class="section-head"><div><h2 class="section-title">What do you need to do?</h2><p class="section-copy">Operating surfaces are organized by capability, not by disconnected apps.</p></div></div>
  <div class="surface-grid">
   <button class="surface" data-detail="identityDetail"><div class="surface-mark">FOUNDATION</div><div class="surface-title">Identity</div><div class="surface-copy">Persistent participant identity, account and session state.</div><div class="surface-state">READY · REAL FOUNDATION</div></button>
   <button class="surface" data-detail="communityDetail"><div class="surface-mark">PARTICIPATION</div><div class="surface-title">Community</div><div class="surface-copy">Connect to communities, places, relationships and participation context.</div><div class="surface-state">READY · DATA-DEPENDENT</div></button>
   <button class="surface" data-detail="serviceDetail"><div class="surface-mark">CAPABILITIES</div><div class="surface-title">Services</div><div class="surface-copy">BeatFood, BeatRide, Marketplace, BeatHealth, Genzi and future services share one foundation.</div><div class="surface-state">MODEL READY · PROVIDERS PENDING</div></button>
   <button class="surface" data-detail="genesisDetail"><div class="surface-mark">INTELLIGENCE</div><div class="surface-title">GENESIS</div><div class="surface-copy">Knowledge and proposals that never silently become authority or execution.</div><div class="surface-state">PROPOSAL-ONLY</div></button>
  </div>
 </section>

 <section class="section">
  <div class="section-head"><div><h2 class="section-title">Participant</h2><p class="section-copy">Your persistent Zalagren foundation.</p></div><button class="link-button" id="accountInline">My Zalagren</button></div>
  <div class="context-card participant-card"><div><div class="identity" id="identityName">Participant</div><div class="identity-meta" id="identityMeta"></div></div><span class="pill">AUTHENTICATED</span></div>
 </section>

 <section id="identityDetail" class="detail-card"><div class="detail-head"><div><h3 class="detail-title">Identity</h3><div class="detail-sub">Canonical participant foundation</div></div></div><div id="identityBody"></div></section>
 <section id="communityDetail" class="detail-card"><div class="detail-head"><div><h3 class="detail-title">Community</h3><div class="detail-sub">Participation and context</div></div></div><div id="communityBody"></div></section>
 <section id="serviceDetail" class="detail-card"><div class="detail-head"><div><h3 class="detail-title">Services</h3><div class="detail-sub">Declared capabilities, never invented provider connections</div></div></div><div id="serviceBody"></div></section>
 <section id="genesisDetail" class="detail-card"><div class="detail-head"><div><h3 class="detail-title">GENESIS</h3><div class="detail-sub">Intelligence proposes; authorized participants decide</div></div></div><div id="genesisBody"></div></section>
 <section id="worldDetail" class="detail-card"><div class="detail-head"><div><h3 class="detail-title">World</h3><div class="detail-sub">Community → phase → place → context</div></div></div><div class="row"><div class="row-title">No world context connected yet.</div><div class="row-meta">The platform preserves a truthful empty state.</div></div></section>
 <section id="activityDetail" class="detail-card"><div class="detail-head"><div><h3 class="detail-title">Activity</h3><div class="detail-sub">Action → event → evidence</div></div></div><div class="row"><div class="row-title">No participant activity yet.</div><div class="row-meta">Nothing is fabricated before a real authorized action occurs.</div></div></section>

 <div class="status"><strong>Session:</strong> authenticated through the production identity boundary. External provider integrations remain explicitly bounded.</div>
 <div class="actions"><button id="signout" class="action secondary" type="button">Sign out</button></div>
</section>
</main>

<nav class="bottom-nav hidden" id="bottomNav" aria-label="Primary navigation">
 <button class="active" data-nav="home">Home</button><button data-nav="world">World</button><button data-nav="services">Services</button><button data-nav="activity">Activity</button><button data-nav="account">Account</button>
</nav>

<script>
let signup=true;
const $=id=>document.getElementById(id);
const setError=message=>{ $("error").textContent=message||""; };
function mode(){
 $("formTitle").textContent=signup?"Create your identity":"Welcome back";
 $("submit").textContent=signup?"Create account":"Sign in";
 $("mode").textContent=signup?"Sign in instead":"Create an account";
 $("name").classList.toggle("hidden",!signup);
 $("password").autocomplete=signup?"new-password":"current-password";
 $("password").placeholder=signup?"Password (8+ characters)":"Password";
}
function openDetail(id){
 document.querySelectorAll(".detail-card").forEach(v=>v.classList.remove("active"));
 const v=$(id); if(v){v.classList.add("active");v.scrollIntoView({behavior:"smooth",block:"nearest"});}
}
function openMenu(){ $("menuOverlay").classList.add("open");$("menuOverlay").setAttribute("aria-hidden","false"); }
function closeMenu(){ $("menuOverlay").classList.remove("open");$("menuOverlay").setAttribute("aria-hidden","true"); }
function navigate(name){
 closeMenu();
 document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.nav===name));
 const map={home:null,world:"worldDetail",services:"serviceDetail",activity:"activityDetail",account:"identityDetail",community:"communityDetail",genesis:"genesisDetail",management:"serviceDetail"};
 if(name==="home"){window.scrollTo({top:0,behavior:"smooth"});return;}
 openDetail(map[name]||"identityDetail");
}
function showHome(d){
 $("auth").classList.add("hidden");$("home").classList.remove("hidden");$("bottomNav").classList.remove("hidden");
 const identity=d?.identity||{};const participant=d?.participant||{};
 $("welcome").textContent="Welcome, "+(identity.name||"participant")+".";
 $("identityName").textContent=identity.name||"Participant";
 $("identityMeta").textContent=(identity.email||"")+" · Participant "+(participant.participantId||"unavailable");
 $("contextParticipant").textContent=participant.participantId||"—";
 $("contextText").textContent="No active community context";
 $("identityBody").innerHTML="<div class='row'><div class='row-title'>Participant</div><div class='row-meta'></div></div><div class='row'><div class='row-title'>Identity provider</div><div class='row-meta'></div></div><div class='row'><div class='row-title'>Account</div><div class='row-meta'></div></div>";
 const rows=$("identityBody").querySelectorAll(".row-meta");rows[0].textContent=participant.participantId||"unavailable";rows[1].textContent=identity.provider||"neon-auth";rows[2].textContent=participant.accountId||"ready";
 loadViews();
}
async function loadViews(){
 try{
  const responses=await Promise.all([fetch("/api/home/communities"),fetch("/api/home/services"),fetch("/api/home/foundation")]);
  const [communities,services,foundation]=await Promise.all(responses.map(r=>r.json()));
  if(responses.some(r=>!r.ok))throw new Error("HOME_DATA_UNAVAILABLE");
  $("communityBody").innerHTML=communities.items?.length?communities.items.map(()=>"<div class='row'><div class='row-title'></div><div class='row-meta'></div></div>").join(""):"<div class='row'><div class='row-title'>No communities connected yet.</div><div class='row-meta'>No participation has been invented.</div></div>";
  communities.items?.forEach((x,i)=>{const row=$("communityBody").children[i];row.querySelector(".row-title").textContent=x.name||"";row.querySelector(".row-meta").textContent=(x.type||"")+" · "+(x.location||"")+" · "+(x.verification||"");});
  $("serviceBody").innerHTML=services.items?.length?services.items.map(()=>"<div class='row'><div class='row-title'></div><div class='row-meta'></div></div>").join(""):"<div class='row'><div class='row-title'>No services are registered yet.</div><div class='row-meta'>Zalagren will not pretend a provider is connected.</div></div>";
  services.items?.forEach((x,i)=>{const row=$("serviceBody").children[i];row.querySelector(".row-title").textContent=x.name||"";row.querySelector(".row-meta").textContent=(x.domain||"")+" · "+(x.status||"")+" · Capabilities: "+((x.capabilities||[]).map(c=>c.name).join(", ")||"none");});
  const f=foundation.foundation||{};
  $("genesisBody").innerHTML="<div class='row'><div class='row-title'>Proposal-only intelligence</div><div class='row-meta'>GENESIS cannot authorize or execute actions.</div></div><div class='row'><div class='row-title'>Live foundation</div><div class='row-meta'></div></div>";
  $("genesisBody").lastElementChild.querySelector(".row-meta").textContent="Participants: "+(f.participants??"not exposed")+" · Actions: "+(f.actions??"not exposed")+" · Events: "+(f.events??"not exposed")+" · Evidence: "+(f.evidences??"not exposed");
 }catch{const states={communityBody:"Community context could not be loaded. The interface is preserving the participant shell without inventing community data.",serviceBody:"Services are ready for real context. Verified provider-backed data appears here when a real connection and authorized context exist. No provider connection is being invented or simulated.",genesisBody:"GENESIS context could not be loaded. Proposals remain separate from authority and execution."};Object.entries(states).forEach(([id,msg])=>$(id).innerHTML="<div class='row'><div class='row-title'>"+msg+"</div><div class='row-meta'>Truthful runtime state · no fabricated data</div></div>");}
}
document.querySelectorAll("[data-detail]").forEach(el=>el.addEventListener("click",()=>openDetail(el.dataset.detail)));
document.querySelectorAll("[data-nav]").forEach(el=>el.addEventListener("click",()=>navigate(el.dataset.nav)));
$("openMenu").onclick=openMenu;$("closeMenu").onclick=closeMenu;$("account").onclick=()=>navigate("account");$("accountInline").onclick=()=>navigate("account");
$("mode").onclick=()=>{signup=!signup;setError("");mode();};
$("authForm").onsubmit=async event=>{
 event.preventDefault();setError("");
 const body={email:$("email").value.trim(),password:$("password").value};if(signup)body.name=$("name").value.trim();
 if(!body.email||!body.password||(signup&&!body.name)){setError("Complete the required fields.");return;}
 const r=await fetch(signup?"/api/auth/sign-up/email":"/api/auth/sign-in/email",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
 const d=await r.json().catch(()=>({}));if(!r.ok){setError(d.error||"Authentication failed.");return;}
 showHome(d.canonical?{identity:d.user,participant:d.canonical}:await(await fetch("/api/me")).json());
};
$("signout").onclick=async()=>{await fetch("/api/auth/sign-out",{method:"POST"});location.reload();};
async function check(){const r=await fetch("/api/me");if(r.ok)showHome(await r.json());}
mode();check();
</script>
</body>
</html>`,{headers:headers({"content-type":"text/html; charset=utf-8"})});
