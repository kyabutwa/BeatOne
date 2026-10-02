const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

import { BEATONE_LOGO, BEAT_SERVICE_LOGOS } from "./beatone-brand.js";

export const renderHome = (headers: (extra?: HeadersInit) => Headers): Response =>
  new Response(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#ffffff">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="preload" as="image" href="${BEATONE_LOGO}">
<link rel="icon" href="${BEATONE_LOGO}">
<title>BeatOne</title>
<style>
:root{
 --canvas:#fff;--surface:#fff;--surface-2:#f6f8fb;--navy:#071a33;--blue:#245fa8;
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
.actions{display:flex;gap:9px;margin-top:17px}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.form-grid .label{margin-top:10px}.signup-only-hidden{display:none!important}.verification-box{margin-top:14px;padding:14px;border:1px solid var(--line);border-radius:16px;background:var(--surface-2)}.verification-title{font-size:13px;font-weight:750}.verification-copy{font-size:12px;line-height:18px;color:var(--muted);margin-top:3px}.mini-actions{display:flex;gap:8px;margin-top:9px}.mini-actions button{min-height:38px;padding:8px 11px;border:1px solid var(--line);border-radius:11px;background:#fff;color:var(--navy);font-size:12px;font-weight:750}@media(max-width:700px){.form-grid{grid-template-columns:1fr}}.action{min-height:44px;padding:10px 15px;border:0;border-radius:13px;font-weight:750}.primary{background:var(--navy);color:#fff}.secondary{background:var(--surface-2);color:var(--navy);border:1px solid var(--line)}
.error{min-height:20px;margin-top:10px;color:var(--danger);font-size:13px;line-height:19px}.hidden{display:none!important}
.status{margin-top:14px;padding:14px 15px;border-radius:16px;background:var(--surface-2);border:1px solid var(--line);font-size:13px;line-height:19px;color:var(--muted)}.status strong{color:var(--navy)}
.bottom-nav{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:35;width:min(calc(100% - 24px),620px);display:grid;grid-template-columns:repeat(5,1fr);padding:6px;border:1px solid var(--line);border-radius:20px;background:rgba(255,255,255,.96);box-shadow:0 10px 30px rgba(7,26,51,.11);backdrop-filter:saturate(180%) blur(18px)}
.bottom-nav button{min-height:42px;border:0;border-radius:14px;background:transparent;color:var(--muted);font-size:11px;font-weight:750}.bottom-nav button.active{background:#fff1e8;color:var(--orange)}
.overlay{position:fixed;inset:0;z-index:60;background:rgba(255,255,255,.98);display:none;overflow:auto}.overlay.open{display:block}
.overlay-shell{width:min(100% - 28px,900px);margin:0 auto;padding:18px 0 50px}.overlay-head{display:flex;align-items:center;justify-content:space-between}.overlay-title{font-size:28px;line-height:34px;font-weight:760;margin:30px 0 6px}.overlay-copy{font-size:14px;line-height:21px;color:var(--muted);max-width:600px}
.menu-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:22px}.menu-item{text-align:left;padding:16px;border:1px solid var(--line);border-radius:18px;background:#fff}.menu-item strong{font-size:15px;line-height:20px}.menu-item span{display:block;font-size:12px;line-height:18px;color:var(--muted);margin-top:4px}
.control-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.control-card{padding:15px;border:1px solid var(--line);border-radius:17px;background:var(--surface);box-shadow:0 5px 18px rgba(7,26,51,.04)}.control-kicker{font-size:10px;line-height:15px;font-weight:800;letter-spacing:.09em;color:var(--orange);text-transform:uppercase}.control-title{font-size:15px;line-height:20px;font-weight:760;margin-top:6px}.control-copy{font-size:12px;line-height:18px;color:var(--muted);margin-top:4px}.truth{display:inline-flex;align-items:center;gap:5px;margin-top:10px;font-size:10px;font-weight:800;letter-spacing:.05em}.truth-dot{width:7px;height:7px;border-radius:50%;display:inline-block}.truth-verified .truth-dot{background:#1d7a4d}.truth-supported .truth-dot{background:#315f9a}.truth-proposed .truth-dot{background:#6b7280}.truth-failed .truth-dot{background:#a63a2b}.truth-pending .truth-dot{background:var(--orange)}.lifecycle{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.life-step{padding:12px;border:1px solid var(--line);border-radius:14px;background:var(--surface-2)}.life-step strong{display:block;font-size:12px}.life-step span{display:block;font-size:11px;line-height:16px;color:var(--muted);margin-top:3px}@media(max-width:700px){.control-grid,.lifecycle{grid-template-columns:1fr}}@media(max-width:700px){.shell{padding-top:4px}.topbar{top:4px}.account-control span{display:none}.home-intro{display:block}.context-chip{margin-top:12px}.context-grid{grid-template-columns:1fr}.surface-grid{grid-template-columns:1fr}.surface{min-height:128px}.participant-card{grid-template-columns:1fr}.actions{flex-direction:column}.action{width:100%}.menu-grid{grid-template-columns:1fr}}
@media(min-width:701px){.page{padding-top:18px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.surface{transition:none}.surface:hover{transform:none}}
/* Temporary self-contained BeatOne mark: the owner-provided IMG_1383 artwork is not present in this repository yet. */
/* BeatOne interface integration — iPhone-class spatial shell. */
:root{
 --canvas:#060B14;--surface:rgba(255,255,255,.08);--surface-2:rgba(255,255,255,.055);
 --navy:#F8FAFC;--blue:#1B365D;--orange:#F27A21;--muted:#94A3B8;--line:rgba(255,255,255,.14);--line-soft:rgba(255,255,255,.08);
 --danger:#f87171;--shadow:0 18px 55px rgba(0,0,0,.28);
}
html,body{background:var(--canvas);color:var(--navy)}
.topbar,.bottom-nav,.context-card,.auth-card,.detail-card,.surface,.control-card,.menu-item,.context-item,.life-step,.verification-box,.status{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.14);box-shadow:0 18px 55px rgba(0,0,0,.20);backdrop-filter:blur(20px) saturate(145%);-webkit-backdrop-filter:blur(20px) saturate(145%)}
.topbar,.bottom-nav{background:rgba(6,11,20,.78)}
.overlay{background:rgba(6,11,20,.97)}
.account-control,input,.mini-actions button,.secondary{background:rgba(255,255,255,.08);color:#F8FAFC;border-color:rgba(255,255,255,.14)}
input::placeholder,.lede,.section-copy,.surface-copy,.control-copy,.row-meta,.detail-sub,.identity-meta,.verification-copy,.status{color:#94A3B8}
.primary{background:#F8FAFC;color:#060B14}.surface:hover{border-color:rgba(255,255,255,.28)}\n.service-logo-stack{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;align-items:center;margin-bottom:8px}.service-logo-stack .service-logo{margin:0;width:100%;height:48px}.service-logo{display:block;width:74px;height:42px;object-fit:contain;object-position:left center;margin-bottom:8px;border-radius:10px}.surface .service-logo{max-width:100%;width:180px;height:54px;object-position:left center}
.bottom-nav button.active{background:rgba(16,185,129,.16);color:#10B981}.pill{background:rgba(16,185,129,.14);color:#10B981}
.context-chip{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.14);color:#F8FAFC}
.truth-verified .truth-dot{background:#10B981}.truth-supported .truth-dot{background:#60A5FA}.truth-proposed .truth-dot{background:#A78BFA}.truth-failed .truth-dot{background:#F87171}
/* Preserve readable dark-on-light controls where necessary. */

/* BeatOne iPhone-class dark system surface: Apple HIG-inspired, not a copy of proprietary Apple UI. */
:root{--canvas:#050B16;--surface:rgba(255,255,255,.075);--surface-2:rgba(255,255,255,.055);--navy:#F8FAFC;--blue:#1B365D;--orange:#10B981;--muted:#F8FAFC;--line:rgba(255,255,255,.14);--line-soft:rgba(255,255,255,.08);--danger:#FF6B6B;--green:#10B981;--white:#F8FAFC;--shadow:0 22px 70px rgba(0,0,0,.34)}
html,body{background:var(--canvas)!important;color:var(--white)!important}body,*{color:#F8FAFC}.lede,.section-copy,.surface-copy,.control-copy,.row-meta,.detail-sub,.identity-meta,.verification-copy,.status,.context-label,.life-step span,.overlay-copy,.menu-item span{color:#F8FAFC!important;opacity:.78}.title,.overlay-title,.section-title,.detail-title,.auth-title,.surface-title,.control-title,.row-title,.verification-title,.identity{color:#F8FAFC!important}.eyebrow,.surface-mark,.surface-state,.control-kicker,.link-button{color:#10B981!important}.topbar,.bottom-nav,.context-card,.auth-card,.detail-card,.surface,.control-card,.menu-item,.context-item,.life-step,.verification-box,.status,.participant-card{background:rgba(255,255,255,.075)!important;border-color:rgba(255,255,255,.14)!important;box-shadow:var(--shadow)!important;backdrop-filter:blur(24px) saturate(150%);-webkit-backdrop-filter:blur(24px) saturate(150%)}.topbar,.bottom-nav{background:rgba(5,11,22,.82)!important}.overlay{background:rgba(5,11,22,.985)!important}.account-control,input,select,textarea,.mini-actions button,.secondary{background:rgba(255,255,255,.075)!important;color:#F8FAFC!important;border-color:rgba(255,255,255,.16)!important}input::placeholder,textarea::placeholder{color:#F8FAFC!important;opacity:.55}.primary{background:#10B981!important;color:#06110D!important;border:0!important}.action,.mini-actions button,.secondary,.top-action,.bottom-nav button{color:#F8FAFC!important}.bottom-nav button.active{background:rgba(16,185,129,.17)!important;color:#10B981!important}.account-dot,.context-chip i,.truth-dot,.verification-symbol{background:#10B981!important}.pill{background:rgba(16,185,129,.14)!important;color:#10B981!important;border:1px solid rgba(16,185,129,.22)}.title{font-size:clamp(34px,7vw,50px)!important;font-weight:780!important;letter-spacing:-.035em}.section-title{font-size:22px!important;font-weight:780!important}.detail-title{font-size:26px!important;font-weight:780!important}.surface-title{font-size:20px!important;font-weight:760!important}.account-hero{display:grid;grid-template-columns:auto 1fr;gap:15px;align-items:center;padding:18px;border-radius:22px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.22);margin-bottom:12px}.account-avatar{width:56px;height:56px;border-radius:18px;display:grid;place-items:center;background:rgba(16,185,129,.16);border:1px solid rgba(16,185,129,.35);font-size:22px;font-weight:800;color:#10B981!important}.account-id{font-size:12px;line-height:18px;opacity:.72;overflow-wrap:anywhere}.verification-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.verification-state{padding:14px;border:1px solid rgba(255,255,255,.13);border-radius:17px;background:rgba(255,255,255,.045)}.verification-state-head{display:flex;align-items:center;gap:8px;font-weight:760}.verification-symbol{width:9px;height:9px;border-radius:50%;flex:0 0 auto}.verification-state.pending .verification-symbol{background:#F59E0B!important}.verification-state.verified .verification-symbol{background:#10B981!important}.verification-state.required .verification-symbol,.verification-state.not_started .verification-symbol{background:#94A3B8!important}.verification-state-label{font-size:13px;font-weight:760}.verification-state-value{font-size:11px;line-height:17px;margin-top:5px;opacity:.72}@media(max-width:700px){.verification-grid{grid-template-columns:1fr}.account-hero{grid-template-columns:auto 1fr}}
</style>
</head>
<body>
<div class="overlay" id="menuOverlay" aria-hidden="true">
 <div class="overlay-shell">
  <div class="overlay-head"><img class="brand-logo" src="${BEATONE_LOGO}" alt="BeatOne"><button class="top-action" id="closeMenu" type="button" aria-label="Close menu">×</button></div>
  <div class="eyebrow" style="margin-top:34px">BeatOne</div>
  <h2 class="overlay-title">Everything connected to participation.</h2>
  <p class="overlay-copy">Navigate the ecosystem by context, capability and authority. A surface may be verified, supported, proposed or failed; empty and provider-dependent states remain explicitly described.</p>
  <div class="menu-grid">
   <button class="menu-item" data-nav="home"><strong>Home</strong><span>Participant context and operating surfaces</span></button>
   <button class="menu-item" data-nav="world"><strong>World</strong><span>Communities, places, phases and context</span></button>
   <button class="menu-item" data-nav="services"><strong>Services</strong><span>Capabilities and available actions</span></button>
   <button class="menu-item" data-nav="community"><strong>Community</strong><span>People, relationships and participation</span></button>
   <button class="menu-item" data-nav="genesis"><strong>GENESIS</strong><span>Knowledge and proposal-only intelligence</span></button>
   <button class="menu-item" data-nav="activity"><strong>Activity</strong><span>Actions, events and evidence</span></button>
   <button class="menu-item" data-nav="account"><strong>My BeatOne</strong><span>Identity, authority, requests and settings</span></button>
   <button class="menu-item" data-nav="management"><strong>Team Workspace</strong><span>Management and provider operations</span></button>
  </div>
 </div>
</div>

<main class="shell">
<header class="topbar">
 <button class="top-action" id="openMenu" type="button" aria-label="Open BeatOne menu"><span class="menu-lines"><span></span><span></span><span></span></span></button>
 <div class="brand-lockup"><img class="brand-logo" src="${BEATONE_LOGO}" alt="BeatOne"></div>
 <button class="account-control" id="account" type="button"><i class="account-dot"></i><span>My BeatOne</span></button>
</header>

<section class="page" id="auth">
 <div class="eyebrow">Intelligent Living Infrastructure</div>
 <h1 class="title">One identity. Connected possibilities.</h1>
 <p class="lede">BeatOne coordinates people, places, needs, capabilities, authority and resources without pretending to be the regulated provider underneath them.</p>
 <div class="auth-wrap">
  <form class="auth-card" id="authForm">
   <div id="formTitle" class="auth-title">Create your identity</div>
   <label class="label" for="name">Name</label><input id="name" autocomplete="name" placeholder="Your name">
   <label class="label" for="email">Email</label><input id="email" autocomplete="email" inputmode="email" type="email" placeholder="you@example.com"><div id="signupPhoneField"><label class="label" for="phone">Phone number</label><input id="phone" autocomplete="tel" inputmode="tel" type="tel" placeholder="+254 7XX XXX XXX"></div>
   <label class="label" for="password">Password</label><input id="password" autocomplete="new-password" type="password" placeholder="Password (8+ characters)">
   <div class="actions"><button id="submit" class="action primary" type="submit">Create account</button><button id="mode" class="action secondary" type="button">Sign in instead</button></div>
   <div id="verificationBox" class="verification-box">
 <div class="verification-title">Verify your contact details</div>
 <div id="verificationCopy" class="verification-copy"></div>
 <label class="label" for="emailVerificationCode">Email verification code</label>
 <input id="emailVerificationCode" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="Enter the code from your email">
 <div class="mini-actions">
  <button id="verifyEmailCode" type="button">Verify email</button>
  <button id="resendEmail" type="button">Send email verification again</button>
 </div>
 <div id="phoneVerificationSection">
  <div class="verification-title" style="margin-top:14px">Phone verification</div>
  <label class="label" for="phoneVerificationCode">SMS verification code</label>
  <input id="phoneVerificationCode" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="Enter the SMS code">
  <div class="mini-actions">
   <button id="verifyPhoneCode" type="button">Verify phone</button>
   <button id="resendPhone" type="button">Send SMS code again</button>
  </div>
 </div>
</div>
   <div id="error" class="error" role="alert" aria-live="polite"></div>
  </form>
 </div>
</section>

<section class="page hidden" id="home">
 <div class="home-intro">
  <div><div class="eyebrow">Participant Home</div><h1 id="welcome" class="title">Welcome.</h1><p class="lede">Your BeatOne starts from identity, then becomes useful through real context and explicit authority.</p></div>
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

 <section class="section beatone-search">
  <div class="section-head"><div><h2 class="section-title">Ask BeatOne</h2><p class="section-copy">Describe what you need. BeatOne routes the request to the relevant ecosystem surface; authorization still governs consequential actions.</p></div></div>
  <div class="context-card" style="padding:16px">
   <input id="beatoneIntent" aria-label="Ask BeatOne" placeholder="Ask BeatOne or describe what you need…" autocomplete="off">
   <div id="beatoneIntentHint" class="status">Examples: access, community, ride, food, payment, marketplace, health, GENESIS.</div>
  </div>
 </section>

 <section class="section">
  <div class="section-head"><div><h2 class="section-title">What do you need to do?</h2><p class="section-copy">Operating surfaces are organized by capability, not by disconnected apps.</p></div></div>
  <div class="surface-grid">
   <button class="surface" data-detail="identityDetail"><div class="surface-mark">FOUNDATION</div><div class="surface-title">Identity</div><div class="surface-copy">Persistent participant identity, account and session state.</div><div class="surface-state">SUPPORTED · LIVE FOUNDATION</div></button>
   <button class="surface" data-detail="communityDetail"><div class="surface-mark">PARTICIPATION</div><div class="surface-title">Community</div><div class="surface-copy">Connect to communities, places, relationships and participation context.</div><div class="surface-state">SUPPORTED · EMPTY UNTIL REAL PARTICIPATION</div></button>
   <button class="surface" data-detail="serviceDetail"><div class="surface-mark">CAPABILITIES</div><div class="surface-title">Services</div><div class="surface-copy">BeatFood, BeatRide, Marketplace, BeatHealth, Genzi and future services share one foundation.</div><div class="surface-state">SUPPORTED · PROVIDER-DEPENDENT</div></button>
   <button class="surface" data-detail="genesisDetail"><div class="surface-mark">INTELLIGENCE</div><div class="surface-title">GENESIS</div><div class="surface-copy">Knowledge and proposals that never silently become authority or execution.</div><div class="surface-state">PROPOSAL-ONLY</div></button>
  </div>
 </section>

 <section class="section">
  <div class="section-head"><div><h2 class="section-title">BeatOne operating system</h2><p class="section-copy">The ecosystem is one connected control plane. Every state is implementation truth, not regulatory certification.</p></div></div>
  <div class="control-grid">
   <button class="control-card" data-detail="identityDetail"><div class="control-kicker">01 · Foundation</div><div class="control-title">Identity → Participant</div><div class="control-copy">Account, credential, session and legal-identity boundaries remain separate.</div><div class="truth truth-supported"><i class="truth-dot"></i>SUPPORTED · LIVE FOUNDATION</div></button>
   <button class="control-card" data-detail="communityDetail"><div class="control-kicker">02 · Participation</div><div class="control-title">Community → Place → Relationship</div><div class="control-copy">Participation becomes contextual before capabilities or authority are exposed.</div><div class="truth truth-pending"><i class="truth-dot"></i>DATA-DEPENDENT</div></button>
   <button class="control-card" data-detail="managementDetail"><div class="control-kicker">03 · Governance</div><div class="control-title">Capability → Authorization</div><div class="control-copy">Community authority must be explicit and evidenced; login never grants it.</div><div class="truth truth-pending"><i class="truth-dot"></i>AUTHORITY-GATED</div></button>
   <button class="control-card" data-detail="marketplaceDetail"><div class="control-kicker">04 · Commerce</div><div class="control-title">Offer → Compliance → Fulfillment</div><div class="control-copy">Marketplace and accommodation share structured commercial boundaries.</div><div class="truth truth-supported"><i class="truth-dot"></i>SUPPORTED · RECONCILIATION ACTIVE</div></button>
   <button class="control-card" data-detail="serviceDetail"><div class="control-kicker">05 · Services</div><div class="control-title">Food · Ride · Pay · Health</div><div class="control-copy">Provider execution remains outside BeatOne unless a real integration exists.</div><div class="truth truth-pending"><i class="truth-dot"></i>PROVIDER-DEPENDENT</div></button>
   <button class="control-card" data-detail="genesisDetail"><div class="control-kicker">06 · Intelligence</div><div class="control-title">Knowledge → GENESIS Proposal</div><div class="control-copy">GENESIS can explain and propose; authorization and execution remain human/provider boundaries.</div><div class="truth truth-proposed"><i class="truth-dot"></i>PROPOSAL-ONLY</div></button>
  </div>
  <div class="context-card" style="margin-top:12px;padding:16px">
   <div class="section-head" style="margin-bottom:10px"><div><div class="section-title" style="font-size:16px">Canonical action lifecycle</div><div class="section-copy">No authorization → no consequential action.</div></div></div>
   <div class="lifecycle">
    <div class="life-step"><strong>Identity → Context</strong><span>Participant, community, place, relationship.</span></div>
    <div class="life-step"><strong>Capability → Authority</strong><span>Capability is not permission; authorization is explicit.</span></div>
    <div class="life-step"><strong>Intent → Proposal</strong><span>Intent is recorded; GENESIS may propose.</span></div>
    <div class="life-step"><strong>Authorized Action</strong><span>Only an authorized action may cross into execution.</span></div>
    <div class="life-step"><strong>Event → Evidence</strong><span>Consequential outcomes create durable evidence.</span></div>
    <div class="life-step"><strong>Knowledge → Intelligence</strong><span>Evidence feeds future context without becoming authority.</span></div>
   </div>
  </div>
 </section>

 <section class="section">
  <div class="section-head"><div><h2 class="section-title">Create & participate</h2><p class="section-copy">Your participation gives you the ability to create, request and propose. Provider execution remains a separate verified boundary.</p></div></div>
  <div class="surface-grid">
   <button class="surface" id="createListing"><div class="surface-mark">MARKETPLACE</div><div class="surface-title">Create a listing</div><div class="surface-copy">Describe the real offer, commercial meaning, fulfillment and compliance state before publication.</div><div class="surface-state">SUPPORTED · REVIEWABLE</div></button>
   <button class="surface" id="requestRide"><div class="surface-mark">BEATRIDE</div><div class="surface-title">Request a ride</div><div class="surface-copy">Create a mobility request tied to your participation context.</div><div class="surface-state">SUPPORTED · PROVIDER-DEPENDENT</div></button>
   <button class="surface" id="createFood"><div class="surface-mark">BEATFOOD</div><div class="surface-title">Become a food provider</div><div class="surface-copy">Create your merchant identity and build a menu.</div><div class="surface-state">SUPPORTED · REAL PERSISTENCE</div></button>
   <button class="surface" id="communityJoin"><div class="surface-mark">COMMUNITY</div><div class="surface-title">Join or subscribe</div><div class="surface-copy">Request participation in a community or propose a community node.</div><div class="surface-state">SUPPORTED · AUTHORITY-GATED</div></button>
  </div>
  <div id="operationStatus" class="status hidden"></div>
 </section>

 <section class="section">
  <div class="section-head"><div><h2 class="section-title">BeatOne · 8 pillars</h2><p class="section-copy">One contextual authorization layer across identity, spaces, economy, services, mobility, commerce and knowledge.</p></div></div>
  <div class="surface-grid">
   <button class="surface" data-detail="identityDetail"><div class="surface-mark">01 · IDENTITY</div><div class="surface-title">Identity</div><div class="surface-copy">Participant identity, credentials, verification boundaries and account security.</div><div class="surface-state">SUPPORTED · FOUNDATION</div></button>
   <button class="surface" data-detail="worldDetail"><div class="surface-mark">02 · ACCESS</div><div class="surface-title">Access</div><div class="surface-copy">Contextual permissions for places, units, gates and secure digital surfaces.</div><div class="surface-state">SUPPORTED · AUTHORITY-GATED</div></button>
   <button class="surface" data-detail="worldDetail"><div class="surface-mark">03 · SPATIAL</div><div class="surface-title">Buildings & Units</div><div class="surface-copy">Phase → building → floor → unit and other canonical place relationships.</div><div class="surface-state">SUPPORTED · CONTEXT-DEPENDENT</div></button>
   <button class="surface" data-detail="serviceDetail"><div class="surface-mark">04 · ECONOMY</div><div class="surface-title">Payments & Economy</div><div class="surface-copy">Payment intents, external regulated rails, settlement and reconciliation evidence.</div><div class="surface-state">SUPPORTED · PROVIDER-DEPENDENT</div></button>
   <button class="surface" data-detail="serviceDetail"><div class="surface-mark">05 · SERVICES</div><div class="surface-title">Services</div><div class="surface-copy">Utilities, maintenance, concierge and future governed service capabilities.</div><div class="surface-state">PROPOSED · PROVIDER/CONTEXT-DEPENDENT</div></button>
   <button class="surface" data-detail="serviceDetail"><div class="surface-mark">06 · MOBILITY</div><div class="surface-title">Mobility</div><div class="surface-copy">BeatRide and other mobility flows remain bounded by provider, licence and insurance evidence.</div><div class="surface-state">SUPPORTED · PROVIDER-DEPENDENT</div></button>
   <button class="surface" data-detail="marketplaceDetail"><div class="surface-mark">07 · COMMERCE</div><div class="surface-title">Commerce</div><div class="surface-copy">BeatMarket/Marketplace, BeatFood and accommodation share one participant foundation.</div><div class="surface-state">SUPPORTED · COMPLIANCE-DEPENDENT</div></button>
   <button class="surface" data-detail="genesisDetail"><div class="surface-mark">08 · KNOWLEDGE</div><div class="surface-title">Education & Environment</div><div class="surface-copy">Knowledge, sustainability and future sensor/edge inputs feed context without granting hidden authority.</div><div class="surface-state">PROPOSED · CONTEXT-DEPENDENT</div></button>
  </div>
 </section>

 <section class="section">
  <div class="section-head"><div><h2 class="section-title">Ecosystem domains</h2><p class="section-copy">One participant foundation, many governed capabilities. Availability depends on context, authorization, provider and jurisdiction.</p></div></div>
  <div class="surface-grid">
   <button class="surface" data-detail="worldDetail"><div class="surface-mark">ACCESS</div><div class="surface-title">Access & invitations</div><div class="surface-copy">Contextual access built from participant, place, relationship, capability and authorization.</div><div class="surface-state">SUPPORTED · AUTHORITY-GATED</div></button>
   <button class="surface" data-detail="marketplaceDetail"><img class="service-logo" src="${BEAT_SERVICE_LOGOS.BeatMarket}" alt="BeatMarket logo"><div class="surface-mark">COMMERCE</div><div class="surface-title">BeatMarket & BnB</div><div class="surface-copy">Offers and accommodation remain reviewable, evidence-driven and provider-bound.</div><div class="surface-state">SUPPORTED · COMPLIANCE-DEPENDENT</div></button>
   <button class="surface" data-detail="serviceDetail"><img class="service-logo" src="${BEAT_SERVICE_LOGOS.BeatPay}" alt="BeatPay logo"><div class="surface-mark">PAYMENTS</div><div class="surface-title">BeatPay</div><div class="surface-copy">Payment intent and reconciliation can coordinate regulated external rails without becoming a wallet.</div><div class="surface-state">SUPPORTED · PROVIDER-DEPENDENT</div></button>
   <button class="surface" data-detail="serviceDetail"><img class="service-logo" src="${BEAT_SERVICE_LOGOS.BeatRide}" alt="BeatRide logo"><div class="surface-mark">MOBILITY</div><div class="surface-title">BeatRide</div><div class="surface-copy">Mobility requests remain separate from provider execution, licensing and insurance evidence.</div><div class="surface-state">SUPPORTED · PROVIDER-DEPENDENT</div></button>
   <button class="surface" data-detail="serviceDetail"><img class="service-logo" src="${BEAT_SERVICE_LOGOS.BeatFood}" alt="BeatFood logo"><div class="surface-mark">FOOD</div><div class="surface-title">BeatFood</div><div class="surface-copy">Merchant, menu, order and fulfillment boundaries use the common BeatOne foundation.</div><div class="surface-state">SUPPORTED · PROVIDER-DEPENDENT</div></button>
   <button class="surface" data-detail="serviceDetail"><img class="service-logo" src="${BEAT_SERVICE_LOGOS.BeatHealth}" alt="BeatHealth logo"><div class="surface-mark">HEALTH</div><div class="surface-title">BeatHealth</div><div class="surface-copy">Health coordination remains isolated from generic commerce with protected sensitive-data boundaries.</div><div class="surface-state">PROPOSED · PROTECTED DOMAIN</div></button>
   <button class="surface" data-detail="genesisDetail"><div class="surface-mark">INTELLIGENCE</div><div class="surface-title">GENESIS</div><div class="surface-copy">Knowledge, explanation and proposals never become authority or silent execution.</div><div class="surface-state">PROPOSED · NON-AUTHORITATIVE</div></button>
   <button class="surface" data-detail="serviceDetail"><div class="service-logo-stack"><img class="service-logo" src="${BEAT_SERVICE_LOGOS.BeatGenzi}" alt="BeatGenzi logo"><img class="service-logo" src="${BEAT_SERVICE_LOGOS.BeatGuardian}" alt="BeatGuardian logo"><img class="service-logo" src="${BEAT_SERVICE_LOGOS.BeatUtilities}" alt="BeatUtilities logo"></div><div class="surface-mark">COMMUNITY</div><div class="surface-title">BeatGenzi · BeatGuardian · BeatUtilities</div><div class="surface-copy">Future service capabilities inherit the same participant, context, authorization and evidence model.</div><div class="surface-state">PROPOSED · CONTEXT-DEPENDENT</div></button>
  </div>
 </section>

 <section class="section">
  <div class="section-head"><div><h2 class="section-title">Participant</h2><p class="section-copy">Your persistent BeatOne foundation.</p></div><button class="link-button" id="accountInline">My BeatOne</button></div>
  <div class="context-card participant-card"><div><div class="identity" id="identityName">Participant</div><div class="identity-meta" id="identityMeta"></div></div><span class="pill">AUTHENTICATED</span></div>
 </section>

 <section id="marketplaceDetail" class="detail-card">
  <div class="detail-head"><div><h3 class="detail-title">Marketplace</h3><div class="detail-sub">Structured commerce: offer → trust → compliance → fulfillment → transaction</div></div></div>
  <div class="verification-box">
   <div class="verification-title">Publication is not verification</div>
   <div class="verification-copy">Every listing carries separate verification, compliance and tax states. BeatOne does not claim a seller, permit, eTIMS status or regulated provider connection without evidence.</div>
  </div>
  <form id="marketplaceForm" class="auth-card" style="margin-top:12px;box-shadow:none">
   <div class="form-grid">
    <div><label class="label" for="listingTitle">Title</label><input id="listingTitle" required placeholder="What are you offering?"></div>
    <div><label class="label" for="listingKind">Type</label><select id="listingKind" style="width:100%;min-height:46px;padding:11px 13px;border:1px solid #cbd5e1;border-radius:13px;background:#fff;color:var(--navy)"><option value="goods">Goods</option><option value="service">Service</option><option value="asset">Asset</option><option value="project">Project</option><option value="opportunity">Opportunity</option><option value="capability">Capability</option><option value="accommodation">Accommodation / BnB</option></select></div>
    <div><label class="label" for="listingCategory">Category</label><input id="listingCategory" required placeholder="Category"></div>
    <div><label class="label" for="listingPrice">Price (minor KES units)</label><input id="listingPrice" type="number" min="0" step="1" placeholder="Optional"></div>
    <div><label class="label" for="listingFulfillment">Fulfillment</label><select id="listingFulfillment" style="width:100%;min-height:46px;padding:11px 13px;border:1px solid #cbd5e1;border-radius:13px;background:#fff;color:var(--navy)"><option value="direct">Direct</option><option value="delivery">Delivery</option><option value="pickup">Pickup</option><option value="digital">Digital</option><option value="appointment">Appointment</option><option value="stay">Stay</option><option value="provider_dispatch">Provider dispatch</option></select></div>
   </div>
   <label class="label" for="listingDescription">Description</label><textarea id="listingDescription" required rows="4" placeholder="Describe the offer, important conditions and what the participant receives." style="width:100%;padding:11px 13px;border:1px solid #cbd5e1;border-radius:13px;background:#fff;color:var(--navy);resize:vertical"></textarea>
   <div class="verification-box"><div class="verification-title">Initial trust state</div><div class="verification-copy">Submitted listings enter reviewable state. Verification, compliance and tax evidence remain separate and are never inferred from the form.</div></div>
   <div class="actions"><button class="action primary" type="submit">Submit listing</button></div>
   <div id="marketplaceFormStatus" class="status hidden"></div>
  </form>
 </section>

 <section id="identityDetail" class="detail-card">
  <div class="detail-head"><div><h3 class="detail-title">My BeatOne</h3><div class="detail-sub">Account → identity → participant → verification → authority</div></div></div>
  <div class="account-hero"><div class="account-avatar" id="accountAvatar">B</div><div><div class="identity" id="accountDisplayName">Participant</div><div class="account-id" id="accountDisplayMeta">BeatOne Account</div></div></div>
  <div id="identityBody"></div>
  <div class="section-head" style="margin-top:18px"><div><h4 class="section-title" style="font-size:18px!important">Verification Center</h4><p class="section-copy">Each proof has its own lifecycle. Pending is not verified.</p></div></div>
  <div class="verification-grid" id="verificationGrid">
   <div class="verification-state not_started" data-verification="email"><div class="verification-state-head"><i class="verification-symbol"></i><span class="verification-state-label">Email</span></div><div class="verification-state-value">Not started</div></div>
   <div class="verification-state not_started" data-verification="phone"><div class="verification-state-head"><i class="verification-symbol"></i><span class="verification-state-label">Phone</span></div><div class="verification-state-value">Not started</div></div>
   <div class="verification-state not_started" data-verification="document"><div class="verification-state-head"><i class="verification-symbol"></i><span class="verification-state-label">Identity document</span></div><div class="verification-state-value">Not started</div></div>
   <div class="verification-state not_started" data-verification="legalIdentity"><div class="verification-state-head"><i class="verification-symbol"></i><span class="verification-state-label">Legal identity</span></div><div class="verification-state-value">Not started</div></div>
  </div>
  <div class="status" style="margin-top:12px"><strong>Lifecycle:</strong> account created → contact pending → contact verified → identity submitted → identity pending review → identity verified → contextual authority.</div>
 </section>
 <section id="communityDetail" class="detail-card"><div class="detail-head"><div><h3 class="detail-title">Community</h3><div class="detail-sub">Participation and context</div></div></div><div id="communityBody"></div></section>
 <section id="serviceDetail" class="detail-card"><div class="detail-head"><div><h3 class="detail-title">Services</h3><div class="detail-sub">BeatOne-managed services · community-coordinated integrations</div></div></div><div id="serviceBody"></div></section>
 <section id="genesisDetail" class="detail-card"><div class="detail-head"><div><h3 class="detail-title">GENESIS</h3><div class="detail-sub">Intelligence proposes; authorized participants decide</div></div></div><div id="genesisBody"></div></section>
 <section id="worldDetail" class="detail-card"><div class="detail-head"><div><h3 class="detail-title">World</h3><div class="detail-sub">Community → phase → place → context</div></div></div><div class="row"><div class="row-title">No world context connected yet.</div><div class="row-meta"><span class="pill">SUPPORTED · EMPTY</span> The platform preserves a truthful empty state.</div></div></section>
 <section id="activityDetail" class="detail-card"><div class="detail-head"><div><h3 class="detail-title">Activity</h3><div class="detail-sub">Action → event → evidence</div></div></div><div class="row"><div class="row-title">No participant activity yet.</div><div class="row-meta"><span class="pill">SUPPORTED · EMPTY</span> Nothing is fabricated before a real authorized action occurs.</div></div></section>


 <section id="managementDetail" class="detail-card">
  <div class="detail-head"><div><h3 class="detail-title">Community Management</h3><div class="detail-sub">Representative authority → node configuration → participant approval → authorized context</div></div></div>
  <div id="managementGate" class="row"><div class="row-title">Checking community representative authority…</div><div class="row-meta">Participant identity alone never grants community authority.</div></div>
  <div id="managementWorkspace" class="hidden">
   <div class="context-card">
    <label class="label" for="managementCommunity">Managed community</label>
    <select id="managementCommunity"></select>
    <div class="row-meta" style="margin-top:8px">Only communities where this participant has active representative authority appear here.</div>
   </div>
   <div id="managementStatus" class="status hidden"></div>
   <div class="surface-grid">
    <div class="surface"><div class="surface-mark">NODE</div><div class="surface-title">Onboarding & proposals</div><div class="surface-copy">Review participant proposals and community onboarding requests.</div><div id="managementRequests" class="rows"></div></div>
    <div class="surface"><div class="surface-mark">SUBSCRIPTION</div><div class="surface-title">BeatOne subscription</div><div class="surface-copy">Approve or reject the community subscription request. Billing remains a separate provider boundary.</div><div id="managementSubscriptions" class="rows"></div></div>
    <div class="surface"><div class="surface-mark">PARTICIPATION</div><div class="surface-title">Participation requests</div><div class="surface-copy">Approve a participant only with an explicit role, enabled capability and optional place.</div><div id="managementParticipations" class="rows"></div></div>
    <div class="surface"><div class="surface-mark">SERVICES</div><div class="surface-title">Service integrations</div><div class="surface-copy">Configure how BeatOne services integrate with this community node. The community does not own or disable the service.</div><div id="managementServices" class="rows"></div></div>
    <div class="surface"><div class="surface-mark">CAPABILITIES</div><div class="surface-title">Capability coordination</div><div class="surface-copy">Coordinate contextual capabilities for this node. Authorization remains explicit and does not transfer service ownership to the community.</div><div id="managementCapabilities" class="rows"></div></div>
    <div class="surface"><div class="surface-mark">PLACES</div><div class="surface-title">Define places</div><div class="surface-copy">Create the node's real places without inventing geometry verification.</div>
      <div class="form-grid">
       <input id="managementPlaceName" placeholder="Place name">
       <input id="managementPlaceType" placeholder="Type, e.g. property / building / unit">
       <input id="managementPlaceParent" placeholder="Parent place ID (optional)">
      </div>
      <button class="action" id="managementCreatePlace" type="button">Create place</button>
    </div>
   </div>
  </div>
 </section>
 <div class="status"><strong>Session:</strong> authenticated through the production identity boundary. External provider integrations remain explicitly bounded.</div>
 <div class="actions"><button id="signout" class="action secondary" type="button">Sign out</button></div>
</section>
</main>

<nav class="bottom-nav hidden" id="bottomNav" aria-label="Primary navigation">
 <button class="active" data-nav="home">Home</button><button data-nav="community">Communities</button><button data-nav="services">Services</button><button data-nav="genesis">GENESIS</button><button data-nav="activity">Activity</button>
</nav>

<script>
let signup=true;
const $=id=>document.getElementById(id);
const setError=message=>{ $("error").textContent=message||""; };
function mode(){
 $("formTitle").textContent=signup?"Create your identity":"Welcome back";
 $("submit").textContent=signup?"Create account":"Sign in";
 $("mode").textContent=signup?"Sign in instead":"Create an account";
 const phoneField=$("signupPhoneField");
 if(phoneField)phoneField.classList.toggle("signup-only-hidden",!signup);
}
function openDetail(id){
 document.querySelectorAll(".detail-card").forEach(v=>v.classList.remove("active"));
 const v=$(id); if(v){v.classList.add("active");v.scrollIntoView({behavior:"smooth",block:"nearest"});}
}
function setTruth(el,state){if(!el)return;el.classList.remove("truth-verified","truth-supported","truth-proposed","truth-failed","truth-pending");el.classList.add("truth-"+state.toLowerCase());}
function openMenu(){ $("menuOverlay").classList.add("open");$("menuOverlay").setAttribute("aria-hidden","false"); }
function closeMenu(){ $("menuOverlay").classList.remove("open");$("menuOverlay").setAttribute("aria-hidden","true"); }
function navigate(name){
 closeMenu();
 document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.nav===name));
 const map={home:null,world:"worldDetail",services:"serviceDetail",activity:"activityDetail",account:"identityDetail",community:"communityDetail",genesis:"genesisDetail",management:"managementDetail"};
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
 const rows=$("identityBody").querySelectorAll(".row-meta");rows[0].textContent=participant.participantId||"unavailable";rows[1].textContent=identity.provider||"neon-auth";rows[2].textContent=d?.account?.id||participant.accountId||"ready";
 const displayName=identity.name||identity.legalName||"Participant";$("accountDisplayName").textContent=displayName;$("accountDisplayMeta").textContent=(identity.email||"")+" · "+(d?.account?.id||participant.accountId||"account");
 $("accountAvatar").textContent=displayName.trim().slice(0,1).toUpperCase()||"B";
 const verification=d?.verification||{};
 document.querySelectorAll("[data-verification]").forEach(card=>{const key=card.dataset.verification;const state=verification[key]?.status||"not_started";card.className="verification-state "+state;card.querySelector(".verification-state-value").textContent=state==="verified"?"Verified":state==="pending"?"Pending verification":state==="required"?"Verification required":"Not started";});
 loadViews();
}
async function apiPost(path,body){const r=await fetch(path,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"REQUEST_FAILED");return d;}
function showOperation(message){$("operationStatus").classList.remove("hidden");$("operationStatus").textContent=String(message);}
$("createListing").onclick=()=>{document.querySelectorAll(".detail-card").forEach(x=>x.classList.remove("active"));$("marketplaceDetail").classList.add("active");$("marketplaceDetail").scrollIntoView({behavior:"smooth",block:"start"});};
$("marketplaceForm").onsubmit=async(event)=>{event.preventDefault();const status=$("marketplaceFormStatus");status.classList.remove("hidden");status.textContent="Submitting…";const price=$("listingPrice").value.trim();try{const d=await apiPost("/api/marketplace/listing",{title:$("listingTitle").value.trim(),description:$("listingDescription").value.trim(),category:$("listingCategory").value.trim(),listingKind:$("listingKind").value,fulfillmentMode:$("listingFulfillment").value,priceMinor:price?Number(price):undefined,currency:"KES"});status.textContent="Submitted for marketplace review. Verification, compliance and tax status remain separate and are not claimed.";showOperation("Marketplace listing submitted for review · "+(d.listing?.id||"created"));event.target.reset();}catch(e){status.textContent=e.message;}};
$("requestRide").onclick=async()=>{const pickup=prompt("Pickup");if(!pickup)return;const destination=prompt("Destination");if(!destination)return;try{await apiPost("/api/beatride/request",{pickup,destination});showOperation("BeatRide request created. No transport provider has been invented.");}catch(e){showOperation(e.message);}};
$("createFood").onclick=async()=>{const name=prompt("Food merchant name");if(!name)return;try{const d=await apiPost("/api/beatfood/merchant",{name});showOperation("BeatFood merchant created. Merchant ID: "+(d.merchant?.id||"created"));}catch(e){showOperation(e.message);}};
$("communityJoin").onclick=async()=>{const name=prompt("Community name (for a new node proposal)","TSAVO");if(!name)return;const proposal=prompt("What should BeatOne enable for this community?");if(!proposal)return;try{const d=await apiPost("/api/community/onboarding",{communityName:name,nodeName:name==="TSAVO"?"TSAVO first node":name+" node",proposal});showOperation("Community onboarding proposal submitted.");}catch(e){showOperation(e.message);}};
async function loadManagementDirectory(){
 try{
  const r=await fetch("/api/community/management");const d=await r.json().catch(()=>({}));
  if(!r.ok||!Array.isArray(d.communities)||!d.communities.length){
    $("managementWorkspace").classList.add("hidden");
    $("managementGate").innerHTML="<div class='row-title'>Community representative authority is not active for this account.</div><div class='row-meta'>A participant proposal or invitation does not create authority. A verified community representative must be active first.</div>";
    return;
  }
  $("managementGate").classList.add("hidden");$("managementWorkspace").classList.remove("hidden");
  $("managementCommunity").innerHTML=d.communities.map(c=>"<option value='"+c.community_id+"'></option>").join("");
  d.communities.forEach((c,i)=>{const o=$("managementCommunity").options[i];o.textContent=c.name+" · "+c.role;o.value=c.community_id;});
  await loadManagement();
 }catch(e){$("managementGate").innerHTML="<div class='row-title'>Management authority could not be loaded.</div><div class='row-meta'>Truthful runtime state · no authority is assumed.</div>";}
}
async function managementPost(path,body){const r=await fetch(path,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"MANAGEMENT_REQUEST_FAILED");return d;}
function managementRow(title,meta,buttons){
 return "<div class='row'><div class='row-title'>"+String(title)+"</div><div class='row-meta'>"+String(meta||"")+"</div>"+(buttons||"")+"</div>";
}
async function loadManagement(){
 const communityId=$("managementCommunity").value;if(!communityId)return;
 try{
  const r=await fetch("/api/community/management?communityId="+encodeURIComponent(communityId));const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"MANAGEMENT_LOAD_FAILED");
  $("managementRequests").innerHTML=(d.onboarding?.length||d.proposals?.length)?(d.onboarding||[]).map(x=>managementRow(x.community_name||x.node_name||"Onboarding request",x.proposal,"<button class='action' data-mgmt='onboard' data-id='"+x.id+"'>Approve</button><button class='action secondary' data-mgmt='reject-onboard' data-id='"+x.id+"'>Reject</button>")).join("")+(d.proposals||[]).map(x=>managementRow(x.title,x.description,"<button class='action' data-mgmt='proposal' data-id='"+x.id+"'>Approve</button><button class='action secondary' data-mgmt='reject-proposal' data-id='"+x.id+"'>Reject</button>")).join(""):"<div class='row-title'>No pending proposals.</div>";
  $("managementSubscriptions").innerHTML=d.subscriptions?.length?d.subscriptions.map(x=>managementRow(x.plan_code,x.status+" · "+(x.billing_currency||"")+" "+(x.amount_minor??"amount not set"),"<button class='action' data-mgmt='subscription' data-id='"+x.id+"'>Approve</button><button class='action secondary' data-mgmt='reject-subscription' data-id='"+x.id+"'>Reject</button>")).join(""):"<div class='row-title'>No subscription request.</div>";
  $("managementParticipations").innerHTML=d.participations?.length?d.participations.map(x=>managementRow(x.requester_participant_id,x.role+" · pending","<button class='action' data-mgmt='participation' data-id='"+x.id+"'>Approve & authorize</button><button class='action secondary' data-mgmt='reject-participation' data-id='"+x.id+"'>Reject</button>")).join(""):"<div class='row-title'>No pending participation.</div>";
  $("managementServices").innerHTML=(d.serviceCatalog||[]).map(x=>{const bound=(d.serviceBindings||[]).find(b=>b.service_id===x.id&&b.status==="active");return managementRow(x.name,x.domain+" · "+x.status,bound?"<span class='pill'>INTEGRATED</span>":"<button class='action' data-mgmt='service' data-id='"+x.id+"'>Configure integration</button>");}).join("")||"<div class='row-title'>No services registered.</div>";
  $("managementCapabilities").innerHTML=(d.capabilityCatalog||[]).map(x=>{const bound=(d.capabilityBindings||[]).find(b=>b.capability_id===x.id&&b.status==="active");return managementRow(x.name,x.action+" · "+x.resource_type,bound?"<span class='pill'>COORDINATED</span>":"<button class='action' data-mgmt='capability' data-id='"+x.id+"'>Coordinate</button>");}).join("")||"<div class='row-title'>No capabilities registered.</div>";
  $("managementStatus").classList.add("hidden");
  document.querySelectorAll("[data-mgmt]").forEach(el=>el.onclick=()=>handleManagement(el.dataset.mgmt,el.dataset.id));
 }catch(e){$("managementStatus").classList.remove("hidden");$("managementStatus").textContent=e.message;}
}
async function handleManagement(kind,id){
 const communityId=$("managementCommunity").value;
 try{
  if(kind==="onboard"||kind==="reject-onboard") await managementPost("/api/community/management/onboarding/decision",{communityId,requestId:id,decision:kind==="onboard"?"approved":"rejected"});
  else if(kind==="proposal"||kind==="reject-proposal") await managementPost("/api/community/management/proposal/decision",{communityId,proposalId:id,decision:kind==="proposal"?"approved":"rejected"});
  else if(kind==="subscription"||kind==="reject-subscription") await managementPost("/api/community/management/subscription/decision",{communityId,subscriptionId:id,decision:kind==="subscription"?"approved":"rejected"});
  else if(kind==="service") await managementPost("/api/community/management/service",{communityId,serviceId:id,status:"active"});
  else if(kind==="capability") await managementPost("/api/community/management/capability",{communityId,capabilityId:id,status:"active"});
  else if(kind==="participation"||kind==="reject-participation"){
   const role=kind==="participation"?(prompt("Approved community role","member")||"member"):"member";
   const placeId=kind==="participation"?(prompt("Place ID (optional)","")||undefined):undefined;
   const capabilityIds=kind==="participation"?(prompt("Enabled capability IDs (comma separated)")||"").split(",").map(x=>x.trim()).filter(Boolean):[];
   await managementPost("/api/community/management/participation/decision",{communityId,participationId:id,decision:kind==="participation"?"approved":"rejected",role,placeId,capabilityIds});
  }
  $("managementStatus").classList.remove("hidden");$("managementStatus").textContent="Management change saved.";
  await loadManagement();
 }catch(e){$("managementStatus").classList.remove("hidden");$("managementStatus").textContent=e.message;}
}
$("managementCommunity").onchange=loadManagement;
$("managementCreatePlace").onclick=async()=>{try{const communityId=$("managementCommunity").value;const name=$("managementPlaceName").value.trim();const type=$("managementPlaceType").value.trim();const parentId=$("managementPlaceParent").value.trim()||undefined;if(!name||!type)throw new Error("Place name and type are required.");await managementPost("/api/community/management/place",{communityId,name,type,parentId});$("managementPlaceName").value="";$("managementPlaceType").value="";$("managementPlaceParent").value="";$("managementStatus").classList.remove("hidden");$("managementStatus").textContent="Place created.";await loadManagement();}catch(e){$("managementStatus").classList.remove("hidden");$("managementStatus").textContent=e.message;}};
async function loadViews(){
 try{
  const responses=await Promise.all([fetch("/api/home/communities"),fetch("/api/home/services"),fetch("/api/home/foundation")]);
  const [communities,services,foundation]=await Promise.all(responses.map(r=>r.json()));
  if(responses.some(r=>!r.ok))throw new Error("HOME_DATA_UNAVAILABLE");
  $("communityBody").innerHTML=communities.items?.length?communities.items.map(()=>"<div class='row'><div class='row-title'></div><div class='row-meta'></div></div>").join(""):"<div class='row'><div class='row-title'>No communities connected yet.</div><div class='row-meta'>No participation has been invented.</div></div>";
  communities.items?.forEach((x,i)=>{const row=$("communityBody").children[i];row.querySelector(".row-title").textContent=x.name||"";row.querySelector(".row-meta").textContent=(x.type||"")+" · "+(x.location||"")+" · "+(x.verification||"");});
  $("serviceBody").innerHTML=services.items?.length?services.items.map(()=>"<div class='row'><div class='row-title'></div><div class='row-meta'></div></div>").join(""):"<div class='row'><div class='row-title'>No services are registered yet.</div><div class='row-meta'>BeatOne will not pretend a provider is connected.</div></div>";
  services.items?.forEach((x,i)=>{const row=$("serviceBody").children[i];row.querySelector(".row-title").textContent=x.name||"";row.querySelector(".row-meta").textContent=(x.domain||"")+" · "+(x.status||"")+" · Capabilities: "+((x.capabilities||[]).map(c=>c.name).join(", ")||"none");});
  const f=foundation.foundation||{};
  $("genesisBody").innerHTML="<div class='row'><div class='row-title'>Proposal-only intelligence</div><div class='row-meta'>GENESIS cannot authorize or execute actions.</div></div><div class='row'><div class='row-title'>Live foundation</div><div class='row-meta'></div></div>";
  $("genesisBody").lastElementChild.querySelector(".row-meta").textContent="Participants: "+(f.participants??"not exposed")+" · Actions: "+(f.actions??"not exposed")+" · Events: "+(f.events??"not exposed")+" · Evidence: "+(f.evidences??"not exposed");
 }catch{const states={communityBody:"Community context could not be loaded. The interface is preserving the participant shell without inventing community data.",serviceBody:"BeatOne owns and manages the service layer. Communities coordinate local integration, configuration and context through their management dashboard; they do not own, disable or block BeatOne services. Real provider-backed execution appears only when a genuine connection and authorized context exist.",genesisBody:"GENESIS context could not be loaded. Proposals remain separate from authority and execution."};Object.entries(states).forEach(([id,msg])=>$(id).innerHTML="<div class='row'><div class='row-title'>"+msg+"</div><div class='row-meta'>BeatOne-managed · community-coordinated · no fabricated provider data</div></div>");}
}
document.querySelectorAll("[data-detail]").forEach(el=>el.addEventListener("click",()=>openDetail(el.dataset.detail)));
document.querySelectorAll("[data-nav]").forEach(el=>el.addEventListener("click",()=>navigate(el.dataset.nav)));
const beatoneIntent=$("beatoneIntent"),beatoneIntentHint=$("beatoneIntentHint");
if(beatoneIntent){beatoneIntent.oninput=()=>{const q=beatoneIntent.value.trim().toLowerCase();if(!q){beatoneIntentHint.textContent="Examples: access, community, ride, food, payment, marketplace, health, GENESIS.";return;}const routes=[["access","worldDetail","Access"],["community","communityDetail","Communities"],["ride","serviceDetail","BeatRide"],["mobility","serviceDetail","BeatRide"],["food","serviceDetail","BeatFood"],["payment","serviceDetail","BeatPay"],["pay","serviceDetail","BeatPay"],["market","marketplaceDetail","BeatMarket"],["bnb","marketplaceDetail","BeatMarket & BnB"],["health","serviceDetail","BeatHealth"],["genesis","genesisDetail","GENESIS"],["education","genesisDetail","Knowledge"],["environment","genesisDetail","Knowledge"]];const hit=routes.find(([k])=>q.includes(k));beatoneIntentHint.textContent=hit?"Open "+hit[2]+" to continue. Consequential actions remain authorization-gated.":"No direct surface matched yet. BeatOne will not invent a provider, authority or action.";if(hit)beatoneIntentHint.onclick=()=>openDetail(hit[1]);beatoneIntentHint.style.cursor=hit?"pointer":"default";};}
$("openMenu").onclick=openMenu;$("closeMenu").onclick=closeMenu;$("account").onclick=()=>navigate("account");$("accountInline").onclick=()=>navigate("account");
$("mode").onclick=()=>{signup=!signup;setError("");mode();};
$("authForm").onsubmit=async event=>{
 event.preventDefault();setError("");
 const body={email:$("email").value.trim(),password:$("password").value};if(signup){body.name=$("name").value.trim();body.phone=$("phone").value.trim();}
 if(!body.email||!body.password||(signup&&!body.name)||(signup&&!body.phone)){setError("Name, email, phone number and password are required to create your account.");return;}
 const authBody={email:body.email,password:body.password};if(signup)authBody.name=body.name;const r=await fetch(signup?"/api/auth/sign-up/email":"/api/auth/sign-in/email",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(authBody)});
 const d=await r.json().catch(()=>({}));
 if(!r.ok){
  if(d.error==="EMAIL_NOT_VERIFIED"){
   $("verificationBox").classList.remove("hidden");
   $("phoneVerificationSection").classList.remove("hidden");
   $("verificationCopy").textContent="Your email address is not verified yet. Enter the email code below. If you are verifying a phone number, enter the SMS code in the phone section below.";
   $("resendEmail").disabled=false;
   $("resendEmail").textContent="Send verification email again";
   setError("");
   return;
  }
  setError(d.error||"Authentication failed.");
  return;
 }
 if(signup){
   $("verificationBox").classList.remove("hidden");
   $("phoneVerificationSection").classList.remove("hidden");
   $("verificationCopy").textContent="Your account was created. Verify your email and phone before continuing.";
   // Sign-up authMutation already issues the canonical email-verification OTP.
   // Do not immediately request a second OTP: Better Auth may invalidate the previous code.
   try{
    const pr=await fetch("/api/contact/phone/start",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({phone:body.phone})});
    if(!pr.ok){const pd=await pr.json().catch(()=>({}));$("verificationCopy").textContent+=" Phone verification: "+(pd.error||"could not be started");}
   }catch{$("verificationCopy").textContent+=" Phone verification could not be started.";}
   return;
 }
 const meResponse=await fetch("/api/me"); const meData=meResponse.ok?await meResponse.json():{}; showHome(d.canonical?Object.assign({},meData,{identity:d.user,participant:d.canonical,verification:meData.verification||d.verification}):meData);
};
async function requestEmailVerification(){
 const email=$("email").value.trim();
 const r=await fetch("/api/auth/email/verification/send",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email})});
 const d=await r.json().catch(()=>({}));
 $("verificationCopy").textContent=r.ok?"Email verification requested. Enter the code from your email when it arrives.":(d.error||"Email verification could not be requested yet.");
}
$("resendEmail").onclick=requestEmailVerification;
$("verifyEmailCode").onclick=async()=>{
 const email=$("email").value.trim(), otp=$("emailVerificationCode").value.trim();
 if(!/^\\d{4,10}$/.test(otp)){ $("verificationCopy").textContent="Enter the verification code from your email."; return; }
 const r=await fetch("/api/auth/email/verification/verify",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,otp})});
 const d=await r.json().catch(()=>({}));
 if(!r.ok){$("verificationCopy").textContent=d.error||"Email verification failed.";return;}
 $("verificationCopy").textContent="Email verified. You can now sign in.";
 $("emailVerificationCode").value="";
};
$("resendPhone").onclick=async()=>{
 const phone=$("phone").value.trim();
 const r=await fetch("/api/contact/phone/start",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({phone})});
 const d=await r.json().catch(()=>({}));
 $("verificationCopy").textContent=r.ok?"SMS verification code sent to your phone.":(d.error||"Phone verification could not be started yet.");
};
$("verifyPhoneCode").onclick=async()=>{
 const phone=$("phone").value.trim(), code=$("phoneVerificationCode").value.trim();
 if(!/^\\d{4,10}$/.test(code)){ $("verificationCopy").textContent="Enter the SMS verification code."; return; }
 const r=await fetch("/api/contact/phone/verify",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({phone,code})});
 const d=await r.json().catch(()=>({}));
 if(!r.ok){$("verificationCopy").textContent=d.error||"Phone verification failed.";return;}
 $("verificationCopy").textContent="Phone verified. Your contact details are now confirmed.";
 $("phoneVerificationCode").value="";
};
$("signout").onclick=async()=>{await fetch("/api/auth/sign-out",{method:"POST"});location.reload();};
async function check(){const r=await fetch("/api/me");if(r.ok)showHome(await r.json());}
mode();check();
</script>
</body>
</html>`,{headers:headers({"content-type":"text/html; charset=utf-8"})});
