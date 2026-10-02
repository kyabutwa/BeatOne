// Canonical BeatOne visual identity reconstructed mathematically from the owner-provided IMG_1489.jpeg reference.
// No generated/third-party logo is substituted. The geometry preserves the supplied reference's circular
// gemstone emblem, navy palette, ring rhythm and horizontal wordmark; service logos add deterministic symbols.

const polar = (cx:number, cy:number, radius:number, angle:number) => ({
  x: cx + radius * Math.cos(angle),
  y: cy + radius * Math.sin(angle)
});

const ringDots = (cx:number, cy:number, radius:number, count:number, offset=0, dotRadius=4): string =>
  Array.from({length: count}, (_, i) => {
    const p = polar(cx, cy, radius, (Math.PI * 2 * i) / count + offset);
    return `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${dotRadius}" fill="#91A4BF" opacity=".78"/>`;
  }).join("");

const hex = (cx:number, cy:number, radius:number, rotation=-Math.PI/2): string =>
  Array.from({length:6}, (_, i) => {
    const p = polar(cx, cy, radius, rotation + (Math.PI * 2 * i) / 6);
    return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  }).join(" ");

const serviceSymbols: Record<string,string> = {
  BeatPay: `<g transform="translate(197 197) scale(.55)" fill="none" stroke="#F8FAFC" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><rect x="-25" y="-17" width="50" height="34" rx="6"/><circle cx="-8" cy="0" r="6"/><path d="M4 8h12"/></g>`,
  BeatRide: `<g transform="translate(197 197) scale(.55)" fill="none" stroke="#F8FAFC" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M-25 7h50v10h-50z"/><path d="M-18 7l6-16h24l10 16"/><circle cx="-14" cy="18" r="5" fill="#F8FAFC" stroke="none"/><circle cx="15" cy="18" r="5" fill="#F8FAFC" stroke="none"/></g>`,
  BeatFood: `<g transform="translate(197 197) scale(.55)" fill="none" stroke="#F8FAFC" stroke-width="4" stroke-linecap="round"><path d="M-15-25v50M-22-25v15M-15-25v15M-8-25v15M-22-10h14M10-25c0 10 0 17 0 24v26M10-1c13 0 16-9 16-24"/></g>`,
  BeatHealth: `<g transform="translate(197 197)"><path d="M0-25v50M-25 0h50" stroke="#F8FAFC" stroke-width="8" stroke-linecap="round"/></g>`,
  BeatMarket: `<g transform="translate(197 197) scale(.55)" fill="none" stroke="#F8FAFC" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M-22-10h44l-4 34h-36z"/><path d="M-12-10c0-11 24-11 24 0"/><path d="M-16 3h32" stroke-width="3"/></g>`,
  BeatGenzi: `<g transform="translate(197 197)"><path d="M0-28l6 20 20 6-20 6-6 20-6-20-20-6 20-6z" fill="none" stroke="#F8FAFC" stroke-width="4" stroke-linejoin="round"/><circle cx="23" cy="-23" r="3" fill="#F8FAFC"/></g>`,
  BeatGuardian: `<g transform="translate(197 197)"><path d="M0-29l25 10v18c0 17-12 27-25 33-13-6-25-16-25-33v-18z" fill="none" stroke="#F8FAFC" stroke-width="4" stroke-linejoin="round"/><path d="M-11 0l8 8 15-18" fill="none" stroke="#F8FAFC" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  BeatUtilities: `<g transform="translate(197 197)"><path d="M8-29L-15 2h17l-9 27 24-35H0z" fill="none" stroke="#F8FAFC" stroke-width="4" stroke-linejoin="round"/></g>`,
};

export const beatLogoSvg = (label:string, service?:string):string => {
  const safeLabel = label.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const cx=197, cy=197;
  const outerDots=ringDots(cx,cy,184,72,0,4.1);
  const innerDots=ringDots(cx,cy,139,54,Math.PI/54,3.2);
  const gem=hex(cx,cy,86);
  const symbol=service ? (serviceSymbols[service] ?? "") : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 394" role="img" aria-label="${safeLabel}">
  <defs>
    <radialGradient id="gemFace" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="#173F74"/><stop offset=".72" stop-color="#08234A"/><stop offset="1" stop-color="#04152F"/></radialGradient>
    <linearGradient id="gemTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3F6FB"/><stop offset=".55" stop-color="#B9C6D7"/><stop offset="1" stop-color="#61738C"/></linearGradient>
    <linearGradient id="gemSide" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#315783"/><stop offset="1" stop-color="#071A33"/></linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="1.2"/></filter>
  </defs>
  <g>
    <circle cx="${cx}" cy="${cy}" r="191" fill="#F8FAFC"/>
    <circle cx="${cx}" cy="${cy}" r="190" fill="none" stroke="#071A33" stroke-width="5"/>
    <circle cx="${cx}" cy="${cy}" r="180" fill="#0B2545" stroke="#D7DFEA" stroke-width="3"/>
    ${outerDots}
    <circle cx="${cx}" cy="${cy}" r="160" fill="none" stroke="#071A33" stroke-width="5"/>
    <circle cx="${cx}" cy="${cy}" r="151" fill="none" stroke="#D7DFEA" stroke-width="3"/>
    <circle cx="${cx}" cy="${cy}" r="140" fill="#0B2545" stroke="#071A33" stroke-width="4"/>
    ${innerDots}
    <circle cx="${cx}" cy="${cy}" r="119" fill="#F8FAFC" stroke="#071A33" stroke-width="5"/>
    <circle cx="${cx}" cy="${cy}" r="105" fill="#F8FAFC" stroke="#0B2545" stroke-width="3"/>
    <polygon points="${gem}" fill="#061A35" stroke="#071A33" stroke-width="7"/>
    <polygon points="197,111 272,154 197,174 123,154" fill="url(#gemTop)" stroke="#071A33" stroke-width="3"/>
    <polygon points="123,154 197,174 197,283 123,240" fill="url(#gemSide)" stroke="#071A33" stroke-width="3"/>
    <polygon points="197,174 272,154 272,240 197,283" fill="#09254B" stroke="#071A33" stroke-width="3"/>
    <polygon points="197,174 238,185 238,244 197,270" fill="url(#gemFace)" opacity=".96"/>
    ${symbol}
  </g>
  <text x="430" y="231" font-family="-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Arial,sans-serif" font-size="72" font-weight="700" letter-spacing="-2.2" fill="#0B2545">${safeLabel}</text>
</svg>`;
};

export const toDataUri = (svg:string):string => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export const BEATONE_LOGO = toDataUri(beatLogoSvg("BeatOne"));
export const BEATPAY_LOGO = toDataUri(beatLogoSvg("BeatPay","BeatPay"));
export const BEATRIDE_LOGO = toDataUri(beatLogoSvg("BeatRide","BeatRide"));
export const BEATFOOD_LOGO = toDataUri(beatLogoSvg("BeatFood","BeatFood"));
export const BEATHEALTH_LOGO = toDataUri(beatLogoSvg("BeatHealth","BeatHealth"));
export const BEATMARKET_LOGO = toDataUri(beatLogoSvg("BeatMarket","BeatMarket"));
export const BEATGENZI_LOGO = toDataUri(beatLogoSvg("BeatGenzi","BeatGenzi"));
export const BEATGUARDIAN_LOGO = toDataUri(beatLogoSvg("BeatGuardian","BeatGuardian"));
export const BEATUTILITIES_LOGO = toDataUri(beatLogoSvg("BeatUtilities","BeatUtilities"));

export const BEAT_SERVICE_LOGOS:Record<string,string> = {
  BeatPay:BEATPAY_LOGO,
  BeatRide:BEATRIDE_LOGO,
  BeatFood:BEATFOOD_LOGO,
  BeatHealth:BEATHEALTH_LOGO,
  BeatMarket:BEATMARKET_LOGO,
  BeatGenzi:BEATGENZI_LOGO,
  BeatGuardian:BEATGUARDIAN_LOGO,
  BeatUtilities:BEATUTILITIES_LOGO,
};