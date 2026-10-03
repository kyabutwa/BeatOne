const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

import { ZALAGREN_LOGO, ZALAGREN_SERVICE_LOGOS } from "./zalagren-brand.js";

export const renderHome = (headers: (extra?: HeadersInit) => Headers): Response =>
  new Response(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#ffffff"><meta name="application-name" content="Zalagren">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="preload" as="image" href="${ZALAGREN_LOGO}">
<link rel="icon" href="${ZALAGREN_LOGO}">
<title>Zalagren</title>
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
/* Hero copy contrast: explicit across both appearance modes. */
#auth .eyebrow,#auth .title,#auth .lede,
#home .eyebrow,#home .title,#home .lede,
.page#auth .eyebrow,.page#auth .title,.page#auth .lede{
 color:var(--text)!important;
 text-shadow:none!important;
}
#auth .eyebrow,#home .eyebrow{color:var(--orange)!important}
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
/* Canonical Zalagren visual system.
   One source of truth: white/light mode by default, optional navy mode.
   The shell uses the transparent canonical Zalagren emblem asset. */
:root{
 --canvas:#fff;--surface:#fff;--surface-2:#f6f8fb;--navy:#071a33;--text:#071a33;
 --blue:#1554a6;--orange:#f27a21;--muted:#52657d;--line:#dfe5ec;--line-soft:#edf1f5;
 --green:#3aa86a;--danger:#a63a2b;--shadow:0 12px 34px rgba(7,26,51,.07)
}
html,body{background:var(--canvas)!important;color:var(--text)!important}
body{min-height:100vh}
.topbar{background:rgba(255,255,255,.96)!important;color:var(--text)!important;border-color:var(--line)!important}
.topbar *,.top-action,.account-control{color:var(--text)!important}
.account-control{background:#fff!important;border-color:var(--line)!important}
.context-card,.auth-card,.detail-card,.surface,.control-card,.menu-item,.context-item,.life-step,.verification-box,.status,.participant-card,.account-hero{
 background:var(--surface)!important;color:var(--text)!important;border-color:var(--line)!important;box-shadow:var(--shadow)!important
}
.context-card *,.auth-card *,.detail-card *,.surface *,.control-card *,.menu-item *,.context-item *,.life-step *,.verification-box *,.status *,.participant-card *,.account-hero *{color:inherit}
.context-item,.life-step,.verification-box,.status,.control-card,.menu-item{background:var(--surface-2)!important}
.overlay{background:rgba(255,255,255,.985)!important;color:var(--text)!important}
.overlay *{color:inherit}
input,select,textarea,.mini-actions button,.secondary{
 background:#fff!important;color:var(--text)!important;border-color:#cbd5e1!important
}
input::placeholder,textarea::placeholder{color:#7a8798!important}
.primary{background:var(--navy)!important;color:#fff!important}
.secondary{background:var(--surface-2)!important;color:var(--navy)!important}
.bottom-nav{background:rgba(255,255,255,.97)!important;border-color:var(--line)!important}
.bottom-nav button{color:var(--muted)!important}
.bottom-nav button.active{background:#eef4fb!important;color:var(--navy)!important}
.eyebrow,.surface-mark,.surface-state,.control-kicker,.link-button{color:var(--orange)!important}
.context-chip,.pill{background:#f6f8fb!important;color:var(--navy)!important;border-color:var(--line)!important}
.context-chip i,.account-dot{background:var(--orange)!important}
.account-hero{display:grid;grid-template-columns:auto 1fr;gap:15px;align-items:center;padding:18px;margin-bottom:12px}
.account-avatar{width:56px;height:56px;border-radius:18px;display:grid;place-items:center;background:#eef4fb;border:1px solid #cbd9e8;font-size:22px;font-weight:800;color:var(--navy)!important}
.account-id{font-size:12px;line-height:18px;opacity:.72;overflow-wrap:anywhere}
.verification-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}
.verification-state{padding:14px;border:1px solid var(--line);border-radius:17px;background:var(--surface-2)}
.verification-state-head{display:flex;align-items:center;gap:8px;font-weight:760}
.verification-symbol{width:9px;height:9px;border-radius:50%;flex:0 0 auto;background:var(--muted)}
.verification-state.pending .verification-symbol{background:var(--orange)}
.verification-state.verified .verification-symbol{background:var(--green)}
.verification-state-label{font-size:13px;font-weight:760}
.verification-state-value{font-size:11px;line-height:17px;margin-top:5px;color:var(--muted)}
.service-logo-stack{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;align-items:center;margin-bottom:8px}
.service-logo{display:block;width:74px;height:42px;object-fit:contain;object-position:left center;margin-bottom:8px;border-radius:10px}
.surface .service-logo{max-width:100%;width:180px;height:54px;object-position:left center}
.truth-verified .truth-dot{background:#1d7a4d}.truth-supported .truth-dot{background:#315f9a}.truth-proposed .truth-dot{background:#6b7280}.truth-failed .truth-dot{background:#a63a2b}
body.navy-mode{
 --canvas:#071a33;--surface:#0b2a52;--surface-2:#123a6b;--text:#fff;--navy:#fff;
 --muted:#dce8f5;--line:rgba(255,255,255,.16);--line-soft:rgba(255,255,255,.09);
 --shadow:0 14px 34px rgba(0,0,0,.22)
}
body.navy-mode .topbar,body.navy-mode .bottom-nav{background:#061a33!important;color:#fff!important;border-color:rgba(255,255,255,.16)!important}
body.navy-mode .topbar *,.navy-mode .top-action,.navy-mode .account-control{color:#fff!important}
body.navy-mode .account-control{background:#0b2a52!important;border-color:rgba(255,255,255,.16)!important}
body.navy-mode .context-card,body.navy-mode .auth-card,body.navy-mode .detail-card,body.navy-mode .surface,body.navy-mode .control-card,body.navy-mode .menu-item,body.navy-mode .context-item,body.navy-mode .life-step,body.navy-mode .verification-box,body.navy-mode .status,body.navy-mode .participant-card,body.navy-mode .account-hero{background:var(--surface)!important;color:#fff!important}
body.navy-mode .context-item,body.navy-mode .life-step,body.navy-mode .verification-box,body.navy-mode .status,body.navy-mode .control-card,body.navy-mode .menu-item{background:var(--surface-2)!important}
body.navy-mode .overlay{background:#061a33!important;color:#fff!important}
body.navy-mode input,body.navy-mode select,body.navy-mode textarea,body.navy-mode .mini-actions button,body.navy-mode .secondary{background:#0b2a52!important;color:#fff!important;border-color:rgba(255,255,255,.18)!important}
body.navy-mode .primary{background:#fff!important;color:#071a33!important}
body.navy-mode .secondary{background:#123a6b!important;color:#fff!important}
body.navy-mode .bottom-nav button{color:#dce8f5!important}
body.navy-mode .bottom-nav button.active{background:#1554a6!important;color:#fff!important}
body.navy-mode .context-chip,body.navy-mode .pill{background:#123a6b!important;color:#fff!important;border-color:rgba(255,255,255,.18)!important}
body.navy-mode .account-avatar{background:#123a6b;border-color:rgba(255,255,255,.18);color:#fff!important}
body.navy-mode .verification-state{background:#123a6b;border-color:rgba(255,255,255,.14)}
body.navy-mode .verification-state-value{color:#dce8f5}
@media(max-width:700px){.verification-grid{grid-template-columns:1fr}.account-hero{grid-template-columns:auto 1fr}}

/* Zalagren 2026 immersive interface layer — content first, controls floating above it. */
:root{
 --glass-bg:rgba(255,255,255,.62);
 --glass-border:rgba(255,255,255,.78);
 --glass-shadow:0 18px 60px rgba(7,26,51,.10);
 --glass-highlight:rgba(255,255,255,.92);
 --motion-spring:cubic-bezier(.22,1,.36,1);
}
html{background:linear-gradient(180deg,#f8fbff 0%,#fff 42%,#f7f9fc 100%)!important}
body{
 background:
   radial-gradient(700px 360px at 15% -8%,rgba(36,95,168,.11),transparent 62%),
   radial-gradient(620px 320px at 100% 10%,rgba(242,122,33,.10),transparent 60%),
   linear-gradient(180deg,#f8fbff 0%,#fff 48%,#f7f9fc 100%)!important;
}
.shell{width:min(100% - 20px,1100px);padding:8px 0 112px}
.topbar{
 top:8px;min-height:62px;padding:8px 10px;border:1px solid rgba(255,255,255,.86)!important;
 border-radius:24px!important;background:rgba(255,255,255,.68)!important;
 box-shadow:0 14px 45px rgba(7,26,51,.10),inset 0 1px 0 rgba(255,255,255,.95)!important;
 backdrop-filter:saturate(190%) blur(24px)!important;-webkit-backdrop-filter:saturate(190%) blur(24px);
 transition:transform .45s var(--motion-spring),box-shadow .45s ease,background .35s ease;
}
.topbar:hover{box-shadow:0 20px 60px rgba(7,26,51,.13),inset 0 1px 0 rgba(255,255,255,.98)!important}
.brand-logo{height:36px;filter:drop-shadow(0 4px 10px rgba(7,26,51,.08))}
.top-action,.account-control{border-radius:16px!important}
.account-control{background:rgba(255,255,255,.48)!important;border-color:rgba(255,255,255,.85)!important}
.page{padding:20px 0}
.home-intro{padding:18px 4px 4px}
.title{font-size:clamp(34px,7vw,52px);letter-spacing:-.045em;line-height:1.03}
.lede{font-size:16px;line-height:25px;max-width:680px}
.section{margin-top:34px}
.section-head{margin-bottom:14px}
.section-title{font-size:21px;letter-spacing:-.025em}
.context-card,.auth-card,.detail-card,.participant-card,.account-hero{
 position:relative;overflow:hidden;
 background:var(--glass-bg)!important;
 border:1px solid var(--glass-border)!important;
 box-shadow:var(--glass-shadow),inset 0 1px 0 var(--glass-highlight)!important;
 backdrop-filter:saturate(180%) blur(24px)!important;-webkit-backdrop-filter:saturate(180%) blur(24px);
}
.context-card::before,.auth-card::before,.detail-card::before,.surface::before,.participant-card::before,.account-hero::before,.menu-item::before{
 content:"";position:absolute;inset:-35% 20% auto -10%;height:70px;
 background:linear-gradient(105deg,transparent 0%,rgba(255,255,255,.0) 35%,rgba(255,255,255,.72) 50%,transparent 67%);
 transform:translateX(-120%) rotate(-5deg);pointer-events:none;opacity:.7;
 transition:transform 1s var(--motion-spring);
}
.context-card:hover::before,.auth-card:hover::before,.detail-card:hover::before,.surface:hover::before,.participant-card:hover::before,.account-hero:hover::before,.menu-item:hover::before{transform:translateX(170%) rotate(-5deg)}
.surface-grid{gap:14px}
.surface{
 position:relative;min-height:164px;padding:20px!important;border-radius:24px!important;
 background:rgba(255,255,255,.58)!important;border:1px solid rgba(255,255,255,.84)!important;
 box-shadow:0 12px 36px rgba(7,26,51,.075),inset 0 1px 0 rgba(255,255,255,.95)!important;
 backdrop-filter:saturate(180%) blur(22px)!important;-webkit-backdrop-filter:saturate(180%) blur(22px);
 transition:transform .42s var(--motion-spring),box-shadow .42s ease,border-color .32s ease;
}
.surface:hover{transform:translateY(-5px) scale(1.008)!important;box-shadow:0 22px 55px rgba(7,26,51,.12),inset 0 1px 0 rgba(255,255,255,.98)!important;border-color:rgba(36,95,168,.20)!important}
.surface:active{transform:scale(.985)!important;transition-duration:.12s}
.surface-title{font-size:20px;letter-spacing:-.02em}
.surface-copy{font-size:14px;line-height:21px}
.service-logo{filter:drop-shadow(0 6px 12px rgba(7,26,51,.10));transition:transform .45s var(--motion-spring)}
.surface:hover .service-logo{transform:translateY(-2px) scale(1.035)}
.context-grid{gap:10px}
.context-item{
 border-radius:18px!important;background:rgba(246,248,251,.62)!important;
 border:1px solid rgba(255,255,255,.82)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.92)!important;
 transition:transform .35s var(--motion-spring),background .3s ease;
}
.context-item:hover{transform:translateY(-2px);background:rgba(255,255,255,.78)!important}
.context-chip{background:rgba(255,255,255,.62)!important;border-color:rgba(255,255,255,.86)!important;box-shadow:0 8px 24px rgba(7,26,51,.06);backdrop-filter:blur(18px)}
.bottom-nav{
 width:min(calc(100% - 20px),680px)!important;bottom:10px!important;padding:7px!important;
 border-radius:25px!important;background:rgba(255,255,255,.67)!important;
 border:1px solid rgba(255,255,255,.88)!important;box-shadow:0 18px 55px rgba(7,26,51,.14),inset 0 1px 0 rgba(255,255,255,.98)!important;
 backdrop-filter:saturate(190%) blur(24px)!important;-webkit-backdrop-filter:saturate(190%) blur(24px);
}
.bottom-nav button{min-height:46px;border-radius:17px!important;transition:transform .3s var(--motion-spring),background .25s ease,color .25s ease}
.bottom-nav button:hover{transform:translateY(-2px)}
.bottom-nav button.active{background:rgba(238,244,251,.82)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.95),0 5px 15px rgba(7,26,51,.06)}
.overlay{background:rgba(248,251,255,.80)!important;backdrop-filter:blur(30px) saturate(180%)!important;-webkit-backdrop-filter:blur(30px) saturate(180%)}
.overlay-shell{padding-top:10px}
.menu-item{
 position:relative;border-radius:21px!important;background:rgba(255,255,255,.58)!important;
 border-color:rgba(255,255,255,.84)!important;box-shadow:0 10px 30px rgba(7,26,51,.07),inset 0 1px 0 rgba(255,255,255,.94)!important;
 transition:transform .38s var(--motion-spring),box-shadow .38s ease;
 overflow:hidden;
}
.menu-item:hover{transform:translateY(-3px);box-shadow:0 18px 42px rgba(7,26,51,.11),inset 0 1px 0 rgba(255,255,255,.98)!important}
.action,.primary,.secondary,.mini-actions button{
 border-radius:16px!important;transition:transform .28s var(--motion-spring),box-shadow .28s ease!important
}
.action:hover,.primary:hover,.secondary:hover,.mini-actions button:hover{transform:translateY(-2px)}
.detail-card.active{animation:zalagrenIn .46s var(--motion-spring)}
@keyframes zalagrenIn{from{opacity:0;transform:translateY(12px) scale(.992)}to{opacity:1;transform:translateY(0) scale(1)}}
@media(prefers-reduced-motion:reduce){
 .topbar,.surface,.context-item,.bottom-nav button,.menu-item,.action,.primary,.secondary,.mini-actions button{transition:none!important}
 .context-card::before,.auth-card::before,.detail-card::before,.surface::before,.participant-card::before,.account-hero::before,.menu-item::before{display:none!important}
}
body.navy-mode{
 background:radial-gradient(700px 360px at 10% -10%,rgba(36,95,168,.25),transparent 60%),linear-gradient(180deg,#061a33 0%,#071a33 100%)!important;
}
body.navy-mode .context-card,body.navy-mode .auth-card,body.navy-mode .detail-card,body.navy-mode .participant-card,body.navy-mode .account-hero,body.navy-mode .surface,body.navy-mode .menu-item{
 background:rgba(11,42,82,.64)!important;border-color:rgba(255,255,255,.15)!important;
 box-shadow:0 18px 55px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.08)!important;
}
body.navy-mode .context-item{background:rgba(18,58,107,.62)!important;border-color:rgba(255,255,255,.12)!important}
body.navy-mode .context-chip{background:rgba(18,58,107,.62)!important}
body.navy-mode .bottom-nav{background:rgba(6,26,51,.72)!important;border-color:rgba(255,255,255,.16)!important}
body.navy-mode .overlay{background:rgba(6,26,51,.82)!important}
.account-id,.surface-state,.truth,.control-grid,.lifecycle{display:none!important}
.verification-state-value{font-size:12px;line-height:18px}
.settings-hero{padding:18px;border:1px solid var(--line);border-radius:20px;background:var(--surface-2);margin-bottom:12px}.settings-hero-title{font-size:22px;line-height:28px;font-weight:780;margin:5px 0}.settings-section{margin-top:12px;border:1px solid var(--line);border-radius:20px;background:var(--surface);overflow:hidden}.settings-section-title{padding:14px 16px;border-bottom:1px solid var(--line-soft);font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--orange)}.settings-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:15px 16px;border-top:1px solid var(--line-soft)}.settings-row:first-of-type{border-top:0}.settings-row strong,.settings-toggle strong,.settings-select strong{display:block;font-size:14px}.settings-row span,.settings-toggle small,.settings-select small{display:block;color:var(--muted);font-size:12px;line-height:18px;margin-top:3px}.settings-action{min-width:84px;flex:0 0 auto}.settings-toggle,.settings-select{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:15px 16px;border-top:1px solid var(--line-soft)}.settings-toggle input{width:48px;height:28px;min-height:0;accent-color:var(--orange)}.settings-select select{min-height:42px;padding:8px 10px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--text)}@media(max-width:700px){.settings-row{align-items:flex-start}.settings-action{margin-top:2px}.settings-select{align-items:flex-start;flex-direction:column}.settings-select select{width:100%}}


</style>
</head>
<body>
<div class="overlay" id="menuOverlay" aria-hidden="true">
 <div class="overlay-shell">
  <div class="overlay-head"><img class="brand-logo" src="${ZALAGREN_LOGO}" alt="Zalagren"><button class="top-action" id="closeMenu" type="button" aria-label="Close menu">×</button></div>
  <div class="eyebrow" style="margin-top:34px">Zalagren</div>
  <h2 class="overlay-title">Everything connected to participation.</h2>
  <p class="overlay-copy">Move through your Zalagren experience by what you need, where you are, and what you are allowed to do.</p>
  <div class="menu-grid">
   <button class="menu-item" data-nav="home"><strong>Home</strong><span>Participant context and operating surfaces</span></button>
   <button class="menu-item" data-nav="world"><strong>World</strong><span>Communities, places, phases and context</span></button>
   <button class="menu-item" data-nav="services"><strong>Services</strong><span>Capabilities and available actions</span></button>
   <button class="menu-item" data-nav="community"><strong>Community</strong><span>People, relationships and participation</span></button>
   <button class="menu-item" data-nav="genesis"><strong>GENESIS</strong><span>Knowledge and proposal-only intelligence</span></button>
   <button class="menu-item" data-nav="activity"><strong>Activity</strong><span>Actions, events and evidence</span></button>
   <button class="menu-item" data-nav="account"><strong>My Zalagren</strong><span>Your participant identity and account</span></button>
   <button class="menu-item" data-nav="settings"><strong>Settings</strong><span>Identity, privacy, security, permissions and controls</span></button>
   <button class="menu-item" data-nav="management"><strong>Team Workspace</strong><span>Workspaces and operations</span></button>
   <button class="menu-item" id="inviteCommunity" type="button"><strong>Invite my community</strong><span>Bring a real community into Zalagren coordination.</span></button>
   <button class="menu-item" id="inviteBusiness" type="button"><strong>Invite my business</strong><span>Register and connect a business or service.</span></button>
   <button class="menu-item" id="joinService" type="button"><strong>Join a service</strong><span>Offer your capability directly through Zalagren.</span></button>
   <button class="menu-item" id="themeToggle" type="button"><strong>Appearance</strong><span id="themeToggleLabel">Use navy mode</span></button>
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
   <label class="label" for="email">Email</label><input id="email" autocomplete="email" inputmode="email" type="email" placeholder="you@example.com"><div id="signupPhoneField"><label class="label" for="phone">Phone number</label><input id="phone" autocomplete="tel" inputmode="tel" type="tel" placeholder="+254 7XX XXX XXX"></div>
   <label class="label" for="password">Password</label><input id="password" autocomplete="new-password" type="password" placeholder="Password (8+ characters)">
   <div class="actions"><button id="submit" class="action primary" type="submit">Create account</button><button id="mode" class="action secondary" type="button">Sign in instead</button></div>
   <div class="status" id="authAssuranceNote"><strong>Account access:</strong> Create or sign in with your account credentials. Contact verification is optional; stronger identity verification is requested only when a capability, regulation, recovery event, or sensitive action requires it.</div>
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

 <section class="section zalagren-search">
  <div class="section-head"><div><h2 class="section-title">Ask Zalagren</h2><p class="section-copy">Tell Zalagren what you need and it will take you to the right place.</p></div></div>
  <div class="context-card" style="padding:16px">
   <input id="zalagrenIntent" aria-label="Ask Zalagren" placeholder="Ask Zalagren or describe what you need…" autocomplete="off">
   <div id="zalagrenIntentHint" class="status">Try: “find a doctor”, “book an appointment”, “find medicine”, “request a ride”, or “help me with my community”.</div>
  </div>
 </section>

 <section class="section">
  <div class="section-head"><div><h2 class="section-title">What do you need to do?</h2><p class="section-copy">Everything you use stays connected to your Zalagren context.</p></div></div>
  <div class="surface-grid">
   <button class="surface" data-detail="identityDetail"><div class="surface-mark">FOUNDATION</div><div class="surface-title">Identity</div><div class="surface-copy">Your Zalagren identity and account.</div></button>
   <button class="surface" data-detail="communityDetail"><div class="surface-mark">PARTICIPATION</div><div class="surface-title">Community</div><div class="surface-copy">Connect with the people and places that matter to you.</div></button>
   <button class="surface" data-detail="serviceDetail"><div class="surface-mark">CAPABILITIES</div><div class="surface-title">Services</div><div class="surface-copy">Discover useful services and capabilities in one place.</div></button>
   <button class="surface" data-detail="genesisDetail"><div class="surface-mark">INTELLIGENCE</div><div class="surface-title">GENESIS</div><div class="surface-copy">Understand your options and get help deciding what to do next.</div></button>
  </div>
 </section>

 <section class="section">
  <div class="section-head"><div><h2 class="section-title">Your Zalagren</h2><p class="section-copy">One connected experience for your identity, places, people and services.</p></div></div>
  

 <section class="section">
  <div class="section-head"><div><h2 class="section-title">Create & participate</h2><p class="section-copy">Create, request and participate. Zalagren keeps important actions clear and intentional.</p></div></div>
  <div class="surface-grid">
   <button class="surface" id="createListing"><div class="surface-mark">MARKETPLACE</div><div class="surface-title">Create a listing</div><div class="surface-copy">Describe the real offer, commercial meaning, fulfillment and compliance state before publication.</div></button>
   <button class="surface" id="requestRide"><div class="surface-mark">BEATRIDE</div><div class="surface-title">Request a ride</div><div class="surface-copy">Create a mobility request tied to your participation context.</div></button>
   <button class="surface" id="createFood"><div class="surface-mark">BEATFOOD</div><div class="surface-title">Become a food provider</div><div class="surface-copy">Create your merchant identity and build a menu.</div></button>
   <button class="surface" id="communityJoin"><div class="surface-mark">COMMUNITY</div><div class="surface-title">Join or subscribe</div><div class="surface-copy">Request participation in a community or propose a community node.</div></button>
  </div>
  <div id="operationStatus" class="status hidden"></div>
 </section>

 <section class="section">
  <div class="section-head"><div><h2 class="section-title">Your ecosystem</h2><p class="section-copy">One connected experience across your identity, places, services, mobility, health and community.</p></div></div>
  <div class="surface-grid">
   <button class="surface" data-detail="identityDetail"><div class="surface-mark">01 · IDENTITY</div><div class="surface-title">Identity</div><div class="surface-copy">Your identity, account and privacy.</div></button>
   <button class="surface" data-detail="worldDetail"><div class="surface-mark">02 · ACCESS</div><div class="surface-title">Access</div><div class="surface-copy">Access to the places and spaces connected to you.</div></button>
   <button class="surface" data-detail="worldDetail"><div class="surface-mark">03 · SPATIAL</div><div class="surface-title">Buildings & Units</div><div class="surface-copy">Places, buildings, units and the spaces around you.</div></button>
   <button class="surface" data-detail="serviceDetail"><div class="surface-mark">04 · ECONOMY</div><div class="surface-title">Payments & Economy</div><div class="surface-copy">Payments and financial activity, where available.</div></button>
   <button class="surface" data-detail="serviceDetail"><div class="surface-mark">05 · SERVICES</div><div class="surface-title">Services</div><div class="surface-copy">Utilities, maintenance and everyday services.</div></button>
   <button class="surface" data-detail="serviceDetail"><div class="surface-mark">06 · MOBILITY</div><div class="surface-title">Mobility</div><div class="surface-copy">Mobility and transport services connected to your context.</div></button>
   <button class="surface" data-detail="marketplaceDetail"><div class="surface-mark">07 · COMMERCE</div><div class="surface-title">Commerce</div><div class="surface-copy">BeatMarket/Marketplace, BeatFood and accommodation share one participant foundation.</div></button>
   <button class="surface" data-detail="genesisDetail"><div class="surface-mark">08 · KNOWLEDGE</div><div class="surface-title">Education & Environment</div><div class="surface-copy">Knowledge, sustainability and future sensor/edge inputs feed context without granting hidden authority.</div></button>
  </div>
 </section>

 <section class="section">
  <div class="section-head"><div><h2 class="section-title">Ecosystem domains</h2><p class="section-copy">One participant foundation, many governed capabilities. Availability depends on context, authorization, provider and jurisdiction.</p></div></div>
  <div class="surface-grid">
   <button class="surface" data-detail="worldDetail"><div class="surface-mark">ACCESS</div><div class="surface-title">Access & invitations</div><div class="surface-copy">Contextual access built from participant, place, relationship, capability and authorization.</div></button>
   <button class="surface" data-detail="marketplaceDetail"><img class="service-logo" src="${ZALAGREN_SERVICE_LOGOS.BeatMarket}" alt="BeatMarket logo"><div class="surface-mark">COMMERCE</div><div class="surface-title">BeatMarket & BnB</div><div class="surface-copy">Offers and accommodation remain reviewable, evidence-driven and provider-bound.</div></button>
   <button class="surface" data-detail="serviceDetail"><img class="service-logo" src="${ZALAGREN_SERVICE_LOGOS.BeatPay}" alt="BeatPay logo"><div class="surface-mark">PAYMENTS</div><div class="surface-title">BeatPay</div><div class="surface-copy">Zalagren owns the payment coordination layer; regulated payment execution remains on authorized rails with idempotent intents and auditable reconciliation.</div></button>
   <button class="surface" data-detail="serviceDetail"><img class="service-logo" src="${ZALAGREN_SERVICE_LOGOS.BeatRide}" alt="BeatRide logo"><div class="surface-mark">MOBILITY</div><div class="surface-title">BeatRide</div><div class="surface-copy">Zalagren operates the mobility coordination network: rider, driver, vehicle, dispatch, trip and evidence remain in the Zalagren system.</div><div class="surface-state">FIRST-PARTY · READY</button>
   <button class="surface" data-detail="serviceDetail"><img class="service-logo" src="${ZALAGREN_SERVICE_LOGOS.BeatFood}" alt="BeatFood logo"><div class="surface-mark">FOOD</div><div class="surface-title">BeatFood</div><div class="surface-copy">Zalagren operates the commerce coordination layer: merchants, offers, orders and fulfillment share the participant foundation.</div></button>
   <button class="surface" data-detail="serviceDetail"><img class="service-logo" src="${ZALAGREN_SERVICE_LOGOS.BeatHealth}" alt="BeatHealth logo"><div class="surface-mark">HEALTH</div><div class="surface-title">BeatHealth</div><div class="surface-copy">Zalagren provides protected health coordination while clinical care, credentials and regulated providers remain authoritative.</div></button>
   <button class="surface" data-detail="genesisDetail"><div class="surface-mark">INTELLIGENCE</div><div class="surface-title">GENESIS</div><div class="surface-copy">Knowledge, explanation and proposals never become authority or silent execution.</div></button>
   <button class="surface" data-detail="serviceDetail"><div class="service-logo-stack"><img class="service-logo" src="${ZALAGREN_SERVICE_LOGOS.BeatGenzi}" alt="BeatGenzi logo"><img class="service-logo" src="${ZALAGREN_SERVICE_LOGOS.BeatGuardian}" alt="BeatGuardian logo"><img class="service-logo" src="${ZALAGREN_SERVICE_LOGOS.BeatUtilities}" alt="BeatUtilities logo"></div><div class="surface-mark">COMMUNITY</div><div class="surface-title">BeatGenzi · BeatGuardian · BeatUtilities</div><div class="surface-copy">Future service capabilities inherit the same participant, context, authorization and evidence model.</div></button>
  </div>
 </section>

 <section class="section">
  <div class="section-head"><div><h2 class="section-title">Participant</h2><p class="section-copy">Your persistent Zalagren foundation.</p></div><button class="link-button" id="accountInline">My Zalagren</button></div>
  <div class="context-card participant-card"><div><div class="identity" id="identityName">Participant</div><div class="identity-meta" id="identityMeta"></div></div><span class="pill">AUTHENTICATED</span></div>
 </section>

 <section id="marketplaceDetail" class="detail-card">
  <div class="detail-head"><div><h3 class="detail-title">Marketplace</h3><div class="detail-sub">Structured commerce: offer → trust → compliance → fulfillment → transaction</div></div></div>
  <div class="verification-box">
   <div class="verification-title">Publication is not verification</div>
   <div class="verification-copy">Every listing carries separate verification, compliance and tax states. Zalagren does not claim a seller, permit, eTIMS status or regulated provider connection without evidence.</div>
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
  <div class="detail-head"><div><h3 class="detail-title">My Zalagren</h3><div class="detail-sub">Your identity and account</div></div></div>
  <div class="account-hero"><div class="account-avatar" id="accountAvatar">B</div><div><div class="identity" id="accountDisplayName">Participant</div></div></div>
  <div id="identityBody"></div>
  <div class="section-head" style="margin-top:18px"><div><h4 class="section-title" style="font-size:18px!important">Verification Center</h4><p class="section-copy">Your verification details stay private and are shown only when relevant.</p></div></div>
  <div class="verification-grid" id="verificationGrid">
   <div class="verification-state not_started" data-verification="email"><div class="verification-state-head"><i class="verification-symbol"></i><span class="verification-state-label">Email</span></div><div class="verification-state-value">Not started</div></div>
   <div class="verification-state not_started" data-verification="phone"><div class="verification-state-head"><i class="verification-symbol"></i><span class="verification-state-label">Phone</span></div><div class="verification-state-value">Not started</div></div>
   <div class="verification-state not_started" data-verification="document"><div class="verification-state-head"><i class="verification-symbol"></i><span class="verification-state-label">Identity document</span></div><div class="verification-state-value">Not started</div></div>
   <div class="verification-state not_started" data-verification="legalIdentity"><div class="verification-state-head"><i class="verification-symbol"></i><span class="verification-state-label">Legal identity</span></div><div class="verification-state-value">Not started</div></div>
  </div>
  <div class="status" style="margin-top:12px">Verification status is shown here. Some services may require additional verification.</div>
 </section>
 
 <section id="settingsDetail" class="detail-card">
  <div class="detail-head"><div><h3 class="detail-title">Settings</h3><div class="detail-sub">Your control center — identity, security, privacy, permissions, regulation and preferences.</div></div></div>
  <div class="settings-hero">
   <div><div class="eyebrow">Participant control</div><div class="settings-hero-title">You decide what Zalagren knows, uses and can do.</div><div class="row-meta">Controls are grouped by consequence. Regulated actions remain subject to the relevant provider, law and authorization.</div></div>
  </div>
  <div class="settings-section"><div class="settings-section-title">Identity & verification</div>
   <div class="settings-row"><div><strong>Verification Center</strong><span>Finish email, phone, document and legal identity verification.</span></div><button class="action primary settings-action" id="settingsVerification" type="button">Open</button></div>
   <div class="settings-row"><div><strong>Legal identity</strong><span>Review or correct your legal identity information and supporting document.</span></div><button class="action secondary settings-action" id="settingsLegalIdentity" type="button">Review</button></div>
  </div>
  <div class="settings-section"><div class="settings-section-title">Security & access</div>
   <div class="settings-row"><div><strong>Account security</strong><span>Review sign-in, verification and recovery controls.</span></div><button class="action secondary settings-action" id="settingsSecurity" type="button">Review</button></div>
   <div class="settings-row"><div><strong>Sign out</strong><span>End this participant session on this device.</span></div><button class="action secondary settings-action" id="settingsSignOut" type="button">Sign out</button></div>
  </div>
  <div class="settings-section"><div class="settings-section-title">Privacy & sharing</div>
   <label class="settings-toggle"><span><strong>Contextual sharing</strong><small>Allow Zalagren to use relevant participant context when an authorized action needs it.</small></span><input type="checkbox" id="prefContext"></label>
   <label class="settings-toggle"><span><strong>Location for active services</strong><small>Allow location only when a service or action needs it. This preference does not bypass device permissions.</small></span><input type="checkbox" id="prefLocation"></label>
   <label class="settings-toggle"><span><strong>Service communications</strong><small>Receive operational messages from services you have joined or used.</small></span><input type="checkbox" id="prefServiceMessages"></label>
  </div>
  <div class="settings-section"><div class="settings-section-title">Regulation & consent</div>
   <div class="settings-row"><div><strong>Regulatory profile</strong><span>Review the jurisdiction, legal basis and evidence requirements that may apply to your participation.</span></div><button class="action secondary" id="settingsRegulation" type="button">Review</button></div>
   <div class="settings-row"><div><strong>Consents & authorizations</strong><span>Review permissions you granted to communities, providers and Zalagren services.</span></div><button class="action secondary" id="settingsAuthorizations" type="button">Review</button></div>
  </div>
  <div class="settings-section"><div class="settings-section-title">Data & corrections</div>
   <div class="settings-row"><div><strong>Correct my information</strong><span>Flag identity, profile or participation information that is inaccurate.</span></div><button class="action secondary" id="settingsCorrection" type="button">Start</button></div>
   <div class="settings-row"><div><strong>Data export</strong><span>Request a copy of participant information Zalagren holds about you.</span></div><button class="action secondary" id="settingsExport" type="button">Request</button></div>
  </div>
  <div class="settings-section"><div class="settings-section-title">Experience</div>
   <label class="settings-toggle"><span><strong>Navy mode</strong><small>Switch between the white and navy Zalagren appearance.</small></span><input type="checkbox" id="prefNavy"></label>
   <label class="settings-toggle"><span><strong>Reduced motion</strong><small>Reduce interface motion on this device.</small></span><input type="checkbox" id="prefReducedMotion"></label>
   <label class="settings-select"><span><strong>Language</strong><small>Interface language preference.</small></span><select id="prefLanguage"><option value="en">English</option><option value="sw">Kiswahili</option><option value="neoolien">Neoolien</option><option value="luxaria">Luxaria</option></select></label>
  </div>
  <div id="settingsStatus" class="status hidden"></div>
 </section>
 <section id="communityDetail" class="detail-card"><div class="detail-head"><div><h3 class="detail-title">Community</h3><div class="detail-sub">Participation and context</div></div></div><div id="communityBody"></div></section>
 <section id="serviceDetail" class="detail-card"><div class="detail-head"><div><h3 class="detail-title">Services</h3><div class="detail-sub">Services available through Zalagren</div></div></div><div id="serviceBody"></div></section>
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
   <div class="section-head" style="margin-top:22px"><div><h4 class="section-title" style="font-size:19px!important">Community operations</h4><p class="section-copy">Coordinate independent providers, maintenance, utilities and everyday services around this community.</p></div></div>
   <div class="surface-grid">
    <div class="surface"><div class="surface-mark">PROVIDERS</div><div class="surface-title">Provider network</div><div class="surface-copy">Invite providers or connect an existing Zalagren provider to this community.</div>
     <div class="form-grid"><input id="communityProviderName" placeholder="Provider / company name"><select id="communityProviderService"></select><input id="communityProviderCategory" placeholder="Category"></div>
     <div class="actions"><button class="action primary" id="communityProviderInvite" type="button">Invite provider</button><button class="action secondary" id="communityProviderJoin" type="button">Connect provider</button></div>
     <div id="communityProviders" class="rows"></div>
    </div>
    <div class="surface"><div class="surface-mark">MAINTENANCE</div><div class="surface-title">Work orders</div><div class="surface-copy">Capture requests, priorities and place context.</div>
     <div class="form-grid"><input id="communityWorkTitle" placeholder="Work needed"><input id="communityWorkPlace" placeholder="Place / unit (optional)"><select id="communityWorkPriority"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
     <button class="action primary" id="communityCreateWork" type="button">Create work order</button><div id="communityWorkOrders" class="rows"></div>
    </div>
    <div class="surface"><div class="surface-mark">UTILITIES</div><div class="surface-title">Utility coordination</div><div class="surface-copy">Keep electricity, water, gas, waste and other provider relationships visible.</div>
     <div class="form-grid"><input id="communityUtilityProvider" placeholder="Utility provider"><select id="communityUtilityType"><option>electricity</option><option>water</option><option>gas</option><option>waste</option><option>internet</option><option>other</option></select><input id="communityUtilityRef" placeholder="Account / reference"></div>
     <button class="action primary" id="communityLinkUtility" type="button">Link utility</button><div id="communityUtilities" class="rows"></div>
    </div>
    <div class="surface"><div class="surface-mark">COMMAND CENTER</div><div class="surface-title">Community activity</div><div class="surface-copy">Provider joins, service changes and work coordination in one timeline.</div><div id="communityEvents" class="rows"></div></div>
   </div>

   <div class="surface-grid">
    <div class="surface"><div class="surface-mark">NODE</div><div class="surface-title">Onboarding & proposals</div><div class="surface-copy">Review participant proposals and community onboarding requests.</div><div id="managementRequests" class="rows"></div></div>
    <div class="surface"><div class="surface-mark">SUBSCRIPTION</div><div class="surface-title">Zalagren subscription</div><div class="surface-copy">Approve or reject the community subscription request. Billing remains a separate provider boundary.</div><div id="managementSubscriptions" class="rows"></div></div>
    <div class="surface"><div class="surface-mark">PARTICIPATION</div><div class="surface-title">Participation requests</div><div class="surface-copy">Approve a participant only with an explicit role, enabled capability and optional place.</div><div id="managementParticipations" class="rows"></div></div>
    <div class="surface"><div class="surface-mark">SERVICES</div><div class="surface-title">Service integrations</div><div class="surface-copy">Configure how Zalagren services integrate with this community node. The community does not own or disable the service.</div><div id="managementServices" class="rows"></div></div>
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

<section class="section hidden" id="networkPanel">
 <div class="section-head"><div><div class="eyebrow">ZALAGREN NETWORK</div><h2 class="section-title">Services available to every participant</h2><p class="section-copy">Use Zalagren services directly, or join as a real provider. Communities coordinate context without owning or disabling services.</p></div></div>
 <div class="surface-grid" id="networkServices"></div>
 <div class="surface-grid" style="margin-top:12px">
  <button class="surface" id="networkInviteCommunity"><div class="surface-mark">PARTICIPATION</div><div class="surface-title">Invite my community</div><div class="surface-copy">Create a secure invitation for a community to join Zalagren.</div></button>
  <button class="surface" id="networkInviteBusiness"><div class="surface-mark">BUSINESS</div><div class="surface-title">Invite my business</div><div class="surface-copy">Register a business and connect its services, people and place context.</div></button>
 </div>
</section>

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
function applyTheme(navy){
 document.body.classList.toggle("navy-mode",!!navy);
 const label=$("themeToggleLabel");
 if(label)label.textContent=navy?"Use white mode":"Use navy mode";
 try{localStorage.setItem("zalagren-theme",navy?"navy":"white");}catch{}
}
function openDetail(id){
 document.querySelectorAll(".detail-card").forEach(v=>v.classList.remove("active"));
 const v=$(id); if(v){v.classList.add("active");v.scrollIntoView({behavior:"smooth",block:"nearest"});}
}
function setTruth(el,state){if(!el)return;el.classList.remove("truth-verified","truth-supported","truth-proposed","truth-failed","truth-pending");el.classList.add("truth-"+state.toLowerCase());}

function showSettingsStatus(message){const el=$("settingsStatus");if(!el)return;el.classList.remove("hidden");el.textContent=message;}
function loadSettingsPreferences(){try{const get=(k,d)=>{const v=localStorage.getItem(k);return v===null?d:v==="true";};$("prefContext").checked=get("zalagren-pref-context",true);$("prefLocation").checked=get("zalagren-pref-location",false);$("prefServiceMessages").checked=get("zalagren-pref-service-messages",true);$("prefNavy").checked=localStorage.getItem("zalagren-theme")==="navy";$("prefReducedMotion").checked=get("zalagren-pref-reduced-motion",false);$("prefLanguage").value=localStorage.getItem("zalagren-language")||"en";}catch{}}
function saveSetting(id,key){const el=$(id);if(!el)return;try{localStorage.setItem(key,String(el.checked));}catch{}showSettingsStatus("Preference saved on this device.");}
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
$("communityJoin").onclick=async()=>{const name=prompt("Community name (for a new node proposal)","TSAVO");if(!name)return;const proposal=prompt("What should Zalagren enable for this community?");if(!proposal)return;try{const d=await apiPost("/api/community/onboarding",{communityName:name,nodeName:name==="TSAVO"?"TSAVO first node":name+" node",proposal});showOperation("Community onboarding proposal submitted.");}catch(e){showOperation(e.message);}};
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
  await loadCommunityOperations();
 }catch(e){$("managementGate").innerHTML="<div class='row-title'>Management authority could not be loaded.</div><div class='row-meta'>Truthful runtime state · no authority is assumed.</div>";}
}
async function managementPost(path,body){const r=await fetch(path,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"MANAGEMENT_REQUEST_FAILED");return d;}
function managementRow(title,meta,buttons){
 return "<div class='row'><div class='row-title'>"+String(title)+"</div><div class='row-meta'>"+String(meta||"")+"</div>"+(buttons||"")+"</div>";
}
async function loadCommunityOperations(){
 const communityId=$("managementCommunity")?.value;if(!communityId)return;
 try{
  const r=await fetch("/api/community/management/operations");const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"COMMUNITY_OPERATIONS_LOAD_FAILED");
  const services=(d.services||[]).filter(x=>x.provider_joinable);
  $("communityProviderService").innerHTML=services.map(x=>"<option value='"+escapeHtml(x.id)+"'>"+escapeHtml(x.name)+"</option>").join("");
  $("communityProviders").innerHTML=(d.bindings||[]).filter(x=>x.community_id===communityId).map(x=>managementRow(x.display_name,(x.service_name||"Service")+" · "+x.category+" · "+x.status,"<span class='pill'>"+escapeHtml(x.verification_state||"pending")+"</span>")).join("")||"<div class='row-title'>No community providers connected yet.</div>";
  $("communityWorkOrders").innerHTML=(d.workOrders||[]).filter(x=>x.community_id===communityId).slice(0,8).map(x=>managementRow(x.title,(x.service_name||"Community service")+" · "+x.priority+" · "+x.status)).join("")||"<div class='row-title'>No work orders.</div>";
  $("communityUtilities").innerHTML=(d.utilities||[]).filter(x=>x.community_id===communityId).map(x=>managementRow(x.provider_name,x.utility_type+" · "+x.status+(x.external_reference?" · "+x.external_reference:""))).join("")||"<div class='row-title'>No utility relationships connected.</div>";
  $("communityEvents").innerHTML=(d.events||[]).filter(x=>x.community_id===communityId).slice(0,10).map(x=>managementRow(x.summary,new Date(x.occurred_at).toLocaleString())).join("")||"<div class='row-title'>No operational events yet.</div>";
 }catch(e){$("managementStatus").classList.remove("hidden");$("managementStatus").textContent=e.message;}
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
$("managementCommunity").onchange=async()=>{await loadManagement();await loadCommunityOperations();};
$("managementCreatePlace").onclick=async()=>{try{const communityId=$("managementCommunity").value;const name=$("managementPlaceName").value.trim();const type=$("managementPlaceType").value.trim();const parentId=$("managementPlaceParent").value.trim()||undefined;if(!name||!type)throw new Error("Place name and type are required.");await managementPost("/api/community/management/place",{communityId,name,type,parentId});$("managementPlaceName").value="";$("managementPlaceType").value="";$("managementPlaceParent").value="";$("managementStatus").classList.remove("hidden");$("managementStatus").textContent="Place created.";await loadManagement();}catch(e){$("managementStatus").classList.remove("hidden");$("managementStatus").textContent=e.message;}};
$("communityProviderInvite").onclick=async()=>{try{const communityId=$("managementCommunity").value;const serviceId=$("communityProviderService").value;const providerName=$("communityProviderName").value.trim();if(!providerName)throw new Error("Provider name is required.");await managementPost("/api/community/management/provider/invite",{communityId,serviceId,providerName});$("communityProviderName").value="";await loadCommunityOperations();}catch(e){$("managementStatus").classList.remove("hidden");$("managementStatus").textContent=e.message;}};
$("communityProviderJoin").onclick=async()=>{try{const communityId=$("managementCommunity").value;const serviceId=$("communityProviderService").value;const providerName=$("communityProviderName").value.trim();if(!providerName)throw new Error("Provider name is required.");await managementPost("/api/community/management/provider",{communityId,serviceId,displayName:providerName,category:$("communityProviderCategory").value.trim()||"service"});$("communityProviderName").value="";$("communityProviderCategory").value="";await loadCommunityOperations();}catch(e){$("managementStatus").classList.remove("hidden");$("managementStatus").textContent=e.message;}};
$("communityCreateWork").onclick=async()=>{try{const communityId=$("managementCommunity").value;const title=$("communityWorkTitle").value.trim();if(!title)throw new Error("Work description is required.");await managementPost("/api/community/management/work-order",{communityId,title,priority:$("communityWorkPriority").value,placeId:$("communityWorkPlace").value.trim()||undefined});$("communityWorkTitle").value="";await loadCommunityOperations();}catch(e){$("managementStatus").classList.remove("hidden");$("managementStatus").textContent=e.message;}};
$("communityLinkUtility").onclick=async()=>{try{const communityId=$("managementCommunity").value;const providerName=$("communityUtilityProvider").value.trim();if(!providerName)throw new Error("Utility provider is required.");await managementPost("/api/community/management/utility",{communityId,providerName,utilityType:$("communityUtilityType").value,externalReference:$("communityUtilityRef").value.trim()||undefined});$("communityUtilityProvider").value="";await loadCommunityOperations();}catch(e){$("managementStatus").classList.remove("hidden");$("managementStatus").textContent=e.message;}};
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
 }catch{const states={communityBody:"Community context could not be loaded. The interface is preserving the participant shell without inventing community data.",serviceBody:"Zalagren owns and manages the service layer. Communities coordinate local integration, configuration and context through their management dashboard; they do not own, disable or block Zalagren services. Real provider-backed execution appears only when a genuine connection and authorized context exist.",genesisBody:"GENESIS context could not be loaded. Proposals remain separate from authority and execution."};Object.entries(states).forEach(([id,msg])=>$(id).innerHTML="<div class='row'><div class='row-title'>"+msg+"</div><div class='row-meta'>Zalagren-managed · community-coordinated · no fabricated provider data</div></div>");}
}
document.querySelectorAll("[data-detail]").forEach(el=>el.addEventListener("click",()=>openDetail(el.dataset.detail)));
document.querySelectorAll("[data-nav]").forEach(el=>el.addEventListener("click",()=>navigate(el.dataset.nav)));
const zalagrenIntent=$("zalagrenIntent"),zalagrenIntentHint=$("zalagrenIntentHint");
if(zalagrenIntent){zalagrenIntent.oninput=()=>{const q=zalagrenIntent.value.trim().toLowerCase();if(!q){zalagrenIntentHint.textContent="Examples: access, community, ride, food, payment, marketplace, health, GENESIS.";return;}const routes=[["access","worldDetail","Access"],["community","communityDetail","Communities"],["ride","serviceDetail","BeatRide"],["mobility","serviceDetail","BeatRide"],["food","serviceDetail","BeatFood"],["payment","serviceDetail","BeatPay"],["pay","serviceDetail","BeatPay"],["market","marketplaceDetail","BeatMarket"],["bnb","marketplaceDetail","BeatMarket & BnB"],["health","serviceDetail","BeatHealth"],["genesis","genesisDetail","GENESIS"],["education","genesisDetail","Knowledge"],["environment","genesisDetail","Knowledge"]];const hit=routes.find(([k])=>q.includes(k));zalagrenIntentHint.textContent=hit?"Open "+hit[2]+" to continue. Consequential actions remain authorization-gated.":"No direct surface matched yet. Zalagren will not invent a provider, authority or action.";if(hit)zalagrenIntentHint.onclick=()=>openDetail(hit[1]);zalagrenIntentHint.style.cursor=hit?"pointer":"default";};}

$("settingsVerification").onclick=()=>navigate("account");
$("settingsLegalIdentity").onclick=()=>navigate("account");
$("settingsSecurity").onclick=()=>showSettingsStatus("Security review is anchored to your authenticated participant session. Additional recovery controls will appear when supported by the account provider.");
$("settingsRegulation").onclick=()=>showSettingsStatus("Regulatory review is context-specific. Zalagren will show applicable evidence and authorization requirements when a regulated capability is requested.");
$("settingsAuthorizations").onclick=()=>showSettingsStatus("Authorization review: participant authority is separate from authentication. Community and service permissions are evaluated in their active context.");
$("settingsCorrection").onclick=()=>showSettingsStatus("Correction request prepared. Use the Verification Center to correct identity evidence; participation data is corrected within its owning context.");
$("settingsExport").onclick=()=>showSettingsStatus("Data export request is not yet connected to a verified export processor. No export is claimed until that workflow is implemented.");
$("settingsSignOut").onclick=async()=>{try{await apiPost("/api/auth/sign-out",{});location.reload();}catch(e){showSettingsStatus("Sign-out failed: "+e.message);}};
$("prefContext").onchange=()=>saveSetting("prefContext","zalagren-pref-context");$("prefLocation").onchange=()=>saveSetting("prefLocation","zalagren-pref-location");$("prefServiceMessages").onchange=()=>saveSetting("prefServiceMessages","zalagren-pref-service-messages");
$("prefNavy").onchange=()=>{applyTheme($("prefNavy").checked);showSettingsStatus("Appearance saved.");};$("prefReducedMotion").onchange=()=>{try{localStorage.setItem("zalagren-pref-reduced-motion",String($("prefReducedMotion").checked));}catch{}document.documentElement.style.scrollBehavior=$("prefReducedMotion").checked?"auto":"";showSettingsStatus("Motion preference saved.");};$("prefLanguage").onchange=()=>{try{localStorage.setItem("zalagren-language",$("prefLanguage").value);}catch{}showSettingsStatus("Language preference saved. Interface translation is enabled progressively by language pack.");};
loadSettingsPreferences();
$("openMenu").onclick=openMenu;$("closeMenu").onclick=closeMenu;$("account").onclick=()=>navigate("account");$("accountInline").onclick=()=>navigate("account");
$("themeToggle").onclick=()=>applyTheme(!document.body.classList.contains("navy-mode"));
try{applyTheme(localStorage.getItem("zalagren-theme")==="navy");}catch{applyTheme(false);}
$("mode").onclick=()=>{signup=!signup;setError("");mode();};
$("authForm").onsubmit=async event=>{
 event.preventDefault();setError("");
 const body={email:$("email").value.trim(),password:$("password").value};if(signup){body.name=$("name").value.trim();body.phone=$("phone").value.trim();}
 if(!body.email||!body.password||(signup&&!body.name)||(signup&&!body.phone)){setError("Name, email, phone number and password are required to create your account.");return;}
 const authBody={email:body.email,password:body.password};if(signup)authBody.name=body.name;
 try {
  const r=await fetch(signup?"/api/auth/sign-up/email":"/api/auth/sign-in/email",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify(authBody)});
  const d=await r.json().catch(()=>({}));
  if(!r.ok){setError(d.error||"Authentication failed.");return;}
  // Let the browser commit the HttpOnly canonical cookie before the first authenticated read.
  // A full same-origin reload is intentional: it exercises the exact persisted session boundary.
  if(!d.canonical){setError("Authentication succeeded but no canonical Zalagren session was issued.");return;}
  location.reload();
 } catch (error) {
  setError(error instanceof Error ? error.message : "Authentication failed. Please try again.");
 }
};
$("signout").onclick=async()=>{await fetch("/api/auth/sign-out",{method:"POST"});location.reload();};
async function check(){const r=await fetch("/api/me");if(r.ok)showHome(await r.json());}
mode();check();
</script>
<script>
(function(){
 const panel=document.getElementById("networkPanel"),grid=document.getElementById("networkServices");
 async function loadNetwork(){
  if(!panel||!grid)return;
  try{const r=await fetch("/api/services/catalog",{credentials:"same-origin"});if(!r.ok){panel.classList.add("hidden");return;}const d=await r.json();
   grid.innerHTML=(d.items||[]).map(s=>'<button class="surface network-service" data-service-id="'+String(s.id).replace(/"/g,'&quot;')+'"><div class="surface-mark">'+String(s.domain).toUpperCase()+'</div><div class="surface-title">'+String(s.name)+'</div><div class="surface-copy">'+(s.first_party?"Zalagren-operated service.":"Zalagren-coordinated service with provider/regulatory boundaries.")+' '+(s.provider_joinable?"Anyone can join as a provider.":"Provider onboarding is restricted.")+'</div></button>').join("");
   panel.classList.remove("hidden");grid.querySelectorAll(".network-service").forEach(b=>b.onclick=()=>joinService(b.dataset.serviceId));
  }catch{panel.classList.add("hidden")}
 }
 async function joinService(serviceId){const name=prompt("How should your capability appear in Zalagren?");if(!name)return;const r=await fetch("/api/services/provider",{method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",body:JSON.stringify({serviceId,displayName:name,providerKind:"individual"})});const d=await r.json();alert(r.ok?"Provider registration saved. Verification state: PROPOSED.":(d.error||"Could not register service."));}
 async function invite(type){const name=prompt(type==="community"?"Community name":"Business name");if(!name)return;const contact=prompt("Email or phone for the invitation");if(!contact)return;const r=await fetch("/api/invite",{method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",body:JSON.stringify({type,name,contact})});const d=await r.json();alert(r.ok?"Invitation ready. Share: "+d.sharePath:(d.error||"Invitation failed."));}
 document.addEventListener("click",e=>{const t=e.target.closest("#inviteCommunity,#networkInviteCommunity,#inviteBusiness,#networkInviteBusiness,#joinService");if(!t)return;if(t.id==="joinService")return loadNetwork();if(t.id.toLowerCase().includes("community"))return invite("community");return invite("business");});
 window.zalagrenLoadNetwork=loadNetwork;setTimeout(loadNetwork,1000);
})();
</script>
</body>
</html>`,{headers:headers({"content-type":"text/html; charset=utf-8"})});
