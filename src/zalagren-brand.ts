// Canonical Zalagren visual identity boundary.
// The owner-provided emblem is served as a transparent vector asset so only the emblem
// is visible on light or navy surfaces; it is never recreated or recolored in CSS.
export const ZALAGREN_LOGO = "/zalagren-emblem.svg";

const escape = (v:string) => v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const serviceLogo = (label:string) => {
  const safe=escape(label);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 96" role="img" aria-label="${safe} logo"><rect width="420" height="96" rx="20" fill="#ffffff"/><circle cx="48" cy="48" r="24" fill="#0B7A3B"/><path d="M37 48h22M48 37v22" stroke="#fff" stroke-width="5" stroke-linecap="round"/><text x="88" y="61" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif" font-size="38" font-weight="700" fill="#071A33">${safe}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
export const ZALAGREN_SERVICE_LOGOS:Record<string,string>={
 BeatPay:serviceLogo("BeatPay"),BeatRide:serviceLogo("BeatRide"),BeatFood:serviceLogo("BeatFood"),BeatHealth:serviceLogo("BeatHealth"),
 BeatMarket:serviceLogo("BeatMarket"),BeatGenzi:serviceLogo("BeatGenzi"),BeatGuardian:serviceLogo("BeatGuardian"),BeatUtilities:serviceLogo("BeatUtilities")
};
