// "Georgia long ago" village scene for the Cherokee/Creek unit. Every piece is one fact from the study
// guide; pieces unlock as Tori plays (rules live in the unit's `build`). Draw order here = z-order.
// Hand-drawn flat SVG in the app's sticker style: ink outlines, bold flat fills.

const INK = '#1D1A2B';
const s = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

// Palisade stakes along the back half of an ellipse around the plaza.
function stakes() {
  let out = '';
  for (let x = 236; x <= 484; x += 16) {
    const t = (x - 360) / 140;
    const base = 352 - 46 * Math.sqrt(Math.max(0, 1 - t * t));
    const top = base - 46;
    out += `<path d="M${x - 7},${base.toFixed(1)} L${x - 7},${(top + 9).toFixed(1)} L${x},${top.toFixed(1)} L${x + 7},${(top + 9).toFixed(1)} L${x + 7},${base.toFixed(1)} Z" fill="#A0673A" ${s}/>`;
  }
  return out;
}

const corn = x => `
  <path d="M${x},462 L${x},392" stroke="#2E8B3E" stroke-width="6" stroke-linecap="round"/>
  <path d="M${x},430 q-16,-6 -22,-20 M${x},418 q16,-6 20,-20" stroke="#2E8B3E" stroke-width="4" fill="none" stroke-linecap="round"/>
  <ellipse cx="${x + 6}" cy="406" rx="6" ry="12" fill="#FFC93C" ${s}/>
  <circle cx="${x - 5}" cy="442" r="4" fill="#5BBF4A"/><circle cx="${x + 5}" cy="428" r="4" fill="#5BBF4A"/>`;

export const georgiaLongAgo = {
  viewBox: '0 0 800 480',
  background: `
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#BFE6FF"/><stop offset="1" stop-color="#FFF1D6"/></linearGradient></defs>
    <rect width="800" height="480" fill="url(#sky)"/>
    <circle cx="712" cy="78" r="38" fill="#FFC93C" ${s}/>
    <g fill="#fff" ${s}><path d="M470,92 q0,-26 28,-26 q10,-22 36,-14 q22,-6 30,16 q22,2 20,24 Z"/></g>
    <path d="M-5,302 C200,286 600,292 805,280 L805,485 L-5,485 Z" fill="#A8D47F" ${s}/>
    <g stroke="#6FA84B" stroke-width="3" stroke-linecap="round">
      <path d="M90,470 l4,-10 l4,10 M380,468 l4,-10 l4,10 M700,470 l4,-10 l4,10"/></g>`,
  pieces: [
    { id: 'mountains', at: [285, 180], svg: `
      <path d="M-12,306 L110,140 L232,306 Z" fill="#3E8E63" ${s}/>
      <path d="M120,306 L285,95 L450,306 Z" fill="#2E7A52" ${s}/>
      <path d="M285,95 L252,138 L268,133 L285,148 L302,133 L318,138 Z" fill="#fff" ${s}/>
      <path d="M110,140 L89,169 L104,165 L112,174 L123,164 L132,169 Z" fill="#fff" ${s}/>` },
    { id: 'river', at: [690, 400], svg: `
      <path d="M805,262 C730,280 740,320 680,345 C610,375 640,430 585,485 L690,485 C720,440 700,405 760,380 C790,368 805,352 805,345 Z" fill="#4BA3E3" ${s}/>
      <path d="M720,330 q12,-6 24,0 M650,380 q12,-6 24,0 M640,450 q12,-6 24,0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M638,402 Q675,428 712,402 Q675,414 638,402 Z" fill="#9A5B2E" ${s}/>
      <path d="M690,384 L668,420" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` },
    { id: 'palisade', at: [360, 290], svg: stakes() },
    { id: 'plaza', at: [360, 382], svg: `
      <ellipse cx="360" cy="382" rx="122" ry="30" fill="#E7C98E" ${s}/>
      <g fill="#C9A86A"><circle cx="300" cy="380" r="3"/><circle cx="410" cy="388" r="3"/><circle cx="360" cy="396" r="3"/><circle cx="440" cy="374" r="3"/></g>` },
    { id: 'council', at: [360, 300], svg: `
      <path d="M306,362 L306,312 Q360,296 414,312 L414,362 Q360,370 306,362 Z" fill="#C98A4E" ${s}/>
      <path d="M296,316 Q360,226 424,316 Q360,298 296,316 Z" fill="#8B5A2B" ${s}/>
      <path d="M318,290 l12,6 M344,276 l8,8 M376,276 l-8,8 M402,290 l-12,6" stroke="#5E3B1A" stroke-width="3" stroke-linecap="round"/>
      <rect x="350" y="330" width="20" height="34" rx="8" fill="${INK}"/>
      <path d="M360,250 q-8,-14 4,-24 q8,-8 0,-18" stroke="#9AA3AD" stroke-width="5" fill="none" stroke-linecap="round"/>` },
    { id: 'summer', at: [200, 322], svg: `
      <rect x="160" y="312" width="82" height="42" fill="#D9A066" ${s}/>
      <path d="M150,315 L201,280 L252,315 Z" fill="#9C6B34" ${s}/>
      <rect x="184" y="324" width="34" height="30" fill="#6E4422" ${s}/>
      <path d="M201,324 L201,354" stroke="${INK}" stroke-width="3"/>` },
    { id: 'winter', at: [95, 335], svg: `
      <path d="M64,368 L64,338 Q95,327 126,338 L126,368 Q95,374 64,368 Z" fill="#B9784A" ${s}/>
      <path d="M56,342 L95,298 L134,342 Q95,332 56,342 Z" fill="#7A4E26" ${s}/>
      <rect x="86" y="348" width="18" height="22" rx="7" fill="${INK}"/>
      <path d="M95,292 q-6,-12 4,-20" stroke="#9AA3AD" stroke-width="4" fill="none" stroke-linecap="round"/>` },
    { id: 'creekhouse', at: [624, 312], svg: `
      <rect x="586" y="302" width="76" height="46" fill="#C7A574" ${s}/>
      <path d="M596,306 L612,344 M612,306 L596,344 M634,306 L650,344 M650,306 L634,344" stroke="#7A5634" stroke-width="3" stroke-linecap="round"/>
      <path d="M576,305 L624,268 L672,305 Z" fill="#D9B45A" ${s}/>
      <path d="M598,296 L624,276 M610,300 L630,284 M640,300 L630,290" stroke="#A88530" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="616" y="320" width="16" height="28" rx="6" fill="${INK}"/>` },
    { id: 'garden', at: [140, 430], svg: `
      <rect x="38" y="440" width="206" height="32" rx="12" fill="#8A5A35" ${s}/>
      ${[62, 104, 146, 188, 226].map(corn).join('')}
      <g fill="#F08A24" ${s}><circle cx="83" cy="458" r="10"/><circle cx="167" cy="460" r="10"/><circle cx="208" cy="458" r="9"/></g>` },
    { id: 'alphabet', at: [303, 440], svg: `
      <rect x="298" y="440" width="10" height="38" fill="#7A4E26" ${s}/>
      <rect x="254" y="410" width="100" height="40" rx="8" fill="#FFF4E2" ${s}/>
      <text x="304" y="440" text-anchor="middle" font-size="26" font-weight="700" fill="${INK}"
        font-family="'Noto Sans Cherokee', Gadugi, 'Plantagenet Cherokee', sans-serif">ᏣᎳᎩ</text>` },
    { id: 'trading', at: [474, 440], svg: `
      <rect x="432" y="424" width="86" height="46" fill="#B57A45" ${s}/>
      <path d="M422,427 L475,398 L528,427 Z" fill="#7A4E26" ${s}/>
      <rect x="444" y="438" width="26" height="32" fill="#6E4422" ${s}/>
      <circle cx="495" cy="456" r="11" fill="#E7C98E" ${s}/>
      <ellipse cx="495" cy="450" rx="5" ry="8" fill="#FFC93C"/>` },
    { id: 'fishing', at: [566, 440], svg: `
      <path d="M540,470 L540,414 M592,470 L592,414 M532,418 L600,418" stroke="#7A4E26" stroke-width="6" stroke-linecap="round"/>
      ${[552, 566, 580].map(x => `<path d="M${x},420 L${x},428" stroke="${INK}" stroke-width="2"/>
        <path d="M${x},428 q7,8 0,20 q-7,-12 0,-20 Z M${x - 5},452 L${x},446 L${x + 5},452 Z" fill="#7FB3D5" ${s}/>`).join('')}` },
  ],
};

export const SCENES = { georgiaLongAgo };
