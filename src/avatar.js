// ── SIJAL · profile pictures and level frames (drawn as SVG, no image files) ──
// 15 pictures anyone can pick; each is drawn in a 100x100 box over a coloured disc
const AVATARS=[
  // falcon
  ['#1f4e79','#3d8bd6','<path d="M22 64c10-4 18-14 22-26 6 8 16 12 30 12-6 6-14 8-22 8 8 4 14 10 16 20-10-6-22-8-34-6l-12-8z" fill="#f4e3b5"/><path d="M58 40c4-6 10-8 16-6-4 2-6 5-6 9z" fill="#2a1d10"/><circle cx="64" cy="40" r="2.6" fill="#111"/><path d="M70 37l9 2-7 4z" fill="#f1b53a"/>'],
  // lion
  ['#7a3b10','#d98a2b','<circle cx="50" cy="52" r="30" fill="#8a4a12"/><circle cx="50" cy="54" r="20" fill="#f2c26b"/><circle cx="43" cy="50" r="2.6" fill="#2a1a0a"/><circle cx="57" cy="50" r="2.6" fill="#2a1a0a"/><path d="M46 58h8l-4 5z" fill="#5a2c0c"/><path d="M44 66q6 4 12 0" stroke="#5a2c0c" stroke-width="2.4" fill="none"/>'],
  // wolf
  ['#2b3442','#6b7a90','<path d="M26 30l14 16 10-6 10 6 14-16-2 26c0 14-10 24-22 26-12-2-22-12-22-26z" fill="#c9d1db"/><path d="M38 58c4-2 8-2 12 0 4-2 8-2 12 0-2 10-8 16-12 16s-10-6-12-16z" fill="#f2f4f7"/><circle cx="42" cy="52" r="2.6" fill="#f1b53a"/><circle cx="58" cy="52" r="2.6" fill="#f1b53a"/><path d="M46 64h8l-4 4z" fill="#222"/>'],
  // knight helmet
  ['#3a3f4a','#9aa4b2','<path d="M30 70V44c0-14 9-24 20-24s20 10 20 24v26z" fill="#d7dde5"/><path d="M30 46h40v6H30z" fill="#7d8796"/><path d="M36 56h28v4H36zM36 63h28v4H36z" fill="#3a3f4a"/><path d="M48 20c2-8 10-10 16-6-6 0-10 4-12 8z" fill="#c0392b"/>'],
  // crossed swords
  ['#4a1414','#c0392b','<path d="M28 26l40 40-4 4-40-40z" fill="#e6ebf1"/><path d="M72 26L32 66l4 4 40-40z" fill="#e6ebf1"/><path d="M22 70l8-8 6 6-8 8zM78 70l-8-8-6 6 8 8z" fill="#f1b53a"/><circle cx="50" cy="48" r="5" fill="#f1b53a"/>'],
  // castle
  ['#2e3b2a','#6e8f4e','<path d="M24 76V40h8v6h6v-6h8v6h8v-6h8v6h6v-6h8v36z" fill="#d9cfb8"/><path d="M44 76V62a6 6 0 0112 0v14z" fill="#3b2a18"/><path d="M48 28v12M48 28l10 4-10 4" stroke="#c0392b" stroke-width="2.4" fill="#c0392b"/>'],
  // camel
  ['#8a5a1a','#e0a84a','<path d="M18 74h64" stroke="#7a4a12" stroke-width="3"/><path d="M26 72V60c0-6 4-10 8-12 2-8 8-12 12-6 2-6 8-8 12-2 4 2 6 6 6 12v8h6V44c0-4 4-6 8-4l2 6h-4v26h-4V62h-6v10h-4V62H36v10h-4V62h-2v10z" fill="#5a3410"/>'],
  // palm and sun
  ['#b8541a','#f2a33a','<circle cx="62" cy="40" r="14" fill="#ffe08a"/><path d="M46 80c2-14 2-26 0-36" stroke="#3a2410" stroke-width="5" fill="none"/><path d="M46 44c-10-6-20-4-26 4 10-2 18 0 26-4zM46 44c8-8 18-10 26-6-10 2-18 4-26 6zM46 44c-6-10-16-14-24-10 10 2 18 6 24 10zM46 44c4-12 12-16 22-14-10 4-16 8-22 14z" fill="#2f6b2a"/><path d="M14 80h72" stroke="#c98b2a" stroke-width="6"/>'],
  // crown
  ['#4a2a6e','#9b59d0','<path d="M22 66l6-30 14 14 8-20 8 20 14-14 6 30z" fill="#f4c542"/><path d="M22 66h56v8H22z" fill="#d9a52a"/><circle cx="50" cy="56" r="4.5" fill="#e74c3c"/><circle cx="36" cy="58" r="3.4" fill="#3498db"/><circle cx="64" cy="58" r="3.4" fill="#2ecc71"/>'],
  // horse
  ['#3a2a1a','#8a5a32','<path d="M34 80c0-14 2-24 6-32-6-2-12-8-12-14l14 4 6-12c8 0 16 6 20 14l6 16c2 4-2 8-6 6l-6-4c-2 8 0 16 4 22z" fill="#2a1a0c"/><path d="M46 26c6-2 12 2 14 8-6-4-10-4-14-2z" fill="#c9a06a"/><circle cx="54" cy="40" r="2.2" fill="#fff"/>'],
  // shield and star
  ['#123a5a','#2f80c0','<path d="M50 18l28 10v18c0 18-12 30-28 36-16-6-28-18-28-36V28z" fill="#e8eef5"/><path d="M50 24l22 8v14c0 14-10 24-22 30-12-6-22-16-22-30V32z" fill="#1f5f9a"/><path d="M50 34l4.4 9 9.6 1.4-7 6.8 1.7 9.6L50 56.2l-8.6 4.6 1.7-9.6-7-6.8 9.6-1.4z" fill="#f4c542"/>'],
  // scorpion
  ['#5a3a10','#c08a2a','<path d="M50 70c-8 0-12-6-12-12s4-10 12-10 12 4 12 10-4 12-12 12z" fill="#2a1a08"/><path d="M50 48c0-10 4-18 12-22 6-2 10 2 8 8l-6-2c-6 4-8 8-8 16z" fill="#2a1a08"/><path d="M70 34l6-4-1 7z" fill="#c0392b"/><path d="M38 58l-12-6M38 62l-12 2M62 58l12-6M62 62l12 2M42 70l-8 8M58 70l8 8" stroke="#2a1a08" stroke-width="3"/><path d="M40 50l-10-10-4 4M60 50l10-10 4 4" stroke="#2a1a08" stroke-width="3.4" fill="none"/>'],
  // crescent and stars
  ['#0e1a3a','#2a3f80','<path d="M56 20a30 30 0 100 60a36 36 0 010-60z" fill="#f4e3a0"/><path d="M70 30l2 5 5 .6-4 3.4 1.2 5L70 41l-4.2 3 1.2-5-4-3.4 5-.6z" fill="#fff"/><circle cx="76" cy="58" r="2" fill="#fff"/><circle cx="66" cy="70" r="1.5" fill="#fff"/>'],
  // flame
  ['#5a120a','#e0441a','<path d="M50 82c-16 0-24-12-22-26 2-12 12-16 12-30 8 6 12 14 12 22 4-4 6-8 6-14 10 8 14 18 14 26 0 14-8 22-22 22z" fill="#ff8a2a"/><path d="M50 82c-8 0-12-6-11-13 1-6 6-9 7-16 6 6 9 10 9 16 2-2 3-4 3-7 4 4 5 9 5 12 0 6-5 8-13 8z" fill="#ffe08a"/>'],
  // khanjar dagger
  ['#2a1a3a','#6a3a8a','<path d="M44 20h12v14H44z" fill="#c9a24a"/><path d="M40 34h20v6H40z" fill="#f4c542"/><path d="M45 40h10c2 14-2 26-10 38-2-14-2-26 0-38z" fill="#e6ebf1"/><path d="M50 42c1 10-1 20-4 30" stroke="#9aa4b2" stroke-width="1.6" fill="none"/><circle cx="50" cy="26" r="3" fill="#e74c3c"/>']
];
let _svgN=0;
// the frame for a level: a disc of metal that gains studs, gems, laurels, wings, a crown, light and fire as the level climbs
// looks change every 10 levels up to 100, then every 50 up to 1000 (29 looks)
const lvTier=l=>l<100?Math.floor(l/10):Math.min(28,10+Math.floor((l-100)/50));
const FRAME_MAT=[['#5b5f66','#9aa0a8','#3a3d42'],['#6e4a2a','#b07a45','#4a2e16'],['#8a5a2a','#d49a5a','#5a3412'],['#7f8a96','#e3e9ef','#4f5964'],['#8a6a1a','#ffd86b','#5a420a'],['#1f6e4a','#7ff0b4','#0e3e28'],['#1a4a8a','#8fc8ff','#0b2a55'],['#4a2a8a','#c9a6ff','#26124d'],['#8a1a3a','#ff8fb0','#4d0b1f'],['#9a6a0a','#fff0b0','#5a3a00'],
  ['#b8860b','#fff3c4','#7a5600'],['#c9d6e3','#ffffff','#7f8fa0'],['#b81d3a','#ffb3c2','#6a0a1e'],['#5a1fb0','#e1c4ff','#2e0b66'],['#0f8f8a','#b6fff8','#06504c'],['#d4a017','#fffbe0','#8a6400']];
function lvFrame(lv,size,av){
  const t=lvTier(lv),id='f'+(++_svgN),M=FRAME_MAT[t<10?t:10+((t-10)%6)],A=AVATARS[av|0]||AVATARS[0],hi=t>=10;
  const g=`<defs><linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${M[1]}"/><stop offset=".5" stop-color="${M[0]}"/><stop offset="1" stop-color="${M[2]}"/></linearGradient>
    <radialGradient id="${id}a" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="${A[1]}"/><stop offset="1" stop-color="${A[0]}"/></radialGradient>
    <radialGradient id="${id}g" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="${M[1]}" stop-opacity=".55"/><stop offset="1" stop-color="${M[1]}" stop-opacity="0"/></radialGradient>
    <clipPath id="${id}c"><circle cx="60" cy="60" r="30"/></clipPath></defs>`;
  let back='',front='';
  // behind the disc: rays, spikes, wings, aura
  if(t>=14)back+=`<g class="fr-spin" style="transform-origin:60px 60px">${Array.from({length:16},(_,k)=>`<path d="M60 60L${60+58*Math.cos((k*22.5-4)*Math.PI/180)} ${60+58*Math.sin((k*22.5-4)*Math.PI/180)}L${60+58*Math.cos((k*22.5+4)*Math.PI/180)} ${60+58*Math.sin((k*22.5+4)*Math.PI/180)}z" fill="${M[1]}" opacity=".3"/>`).join('')}</g>`;
  if(t>=18)back+=`<circle class="fr-pulse" cx="60" cy="60" r="56" fill="url(#${id}g)"/>`;
  if(t>=6){const n=t>=12?16:12;back+=`<path d="${Array.from({length:n},(_,k)=>{const a=k*2*Math.PI/n,b=a+Math.PI/n;return`${k?'L':'M'}${60+46*Math.cos(a)} ${60+46*Math.sin(a)}L${60+38*Math.cos(b)} ${60+38*Math.sin(b)}`;}).join('')}z" fill="url(#${id}m)" stroke="${M[2]}" stroke-width="1"/>`;}
  if(t>=8){const wing=s=>`<path transform="translate(60 60) scale(${s} 1)" d="M30 -6c10-10 22-14 28-12-4 4-6 8-6 12 4-2 8-2 10 0-4 2-6 6-6 10 3 0 6 1 8 3-8 4-18 4-26 0z" fill="url(#${id}m)" stroke="${M[2]}" stroke-width="1"/>`;back+=wing(1)+wing(-1);}
  // the disc: picture, metal ring, an inner line
  const body=`<circle cx="60" cy="60" r="36" fill="url(#${id}m)" stroke="${M[2]}" stroke-width="1.2"/>${t>=1?`<circle cx="60" cy="60" r="33" fill="none" stroke="${M[1]}" stroke-width="1" opacity=".8"/>`:''}
    <g clip-path="url(#${id}c)"><circle cx="60" cy="60" r="30" fill="url(#${id}a)"/><g transform="translate(30 30) scale(.6)">${A[2]}</g></g><circle cx="60" cy="60" r="30" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="1.4"/>`;
  // on top: studs, gems, laurels, crown, orbiting sparks
  if(t>=2)front+=Array.from({length:8},(_,k)=>{const a=k*Math.PI/4+Math.PI/8;return`<circle cx="${60+34.5*Math.cos(a)}" cy="${60+34.5*Math.sin(a)}" r="1.7" fill="${M[1]}" stroke="${M[2]}" stroke-width=".6"/>`;}).join('');
  if(t>=4){const leaf=(s)=>Array.from({length:6},(_,k)=>{const a=(100+k*13)*Math.PI/180,x=60+s*41*Math.cos(a),y=60+41*Math.sin(a);return`<ellipse cx="${x}" cy="${y}" rx="5" ry="2.2" transform="rotate(${s*(k*13+10)} ${x} ${y})" fill="${hi?M[1]:'#4f9a3a'}" stroke="${hi?M[2]:'#2a5a1a'}" stroke-width=".6"/>`;}).join('');front+=leaf(1)+leaf(-1);}
  if(t>=3)front+=`<path d="M60 18l5 6-5 6-5-6z" fill="${t>=12?'#ff3d6e':t>=7?'#3dd6ff':'#e74c3c'}" stroke="#fff" stroke-width=".8"/>`;
  if(t>=6)front+=`<circle cx="24" cy="60" r="3.4" fill="#2ecc71" stroke="#fff" stroke-width=".7"/><circle cx="96" cy="60" r="3.4" fill="#2ecc71" stroke="#fff" stroke-width=".7"/>`;
  if(t>=10)front+=`<path d="M44 22l4-14 6 8 6-10 6 10 6-8 4 14z" fill="url(#${id}m)" stroke="${M[2]}" stroke-width="1"/><circle cx="60" cy="10" r="2.6" fill="#ff3d6e"/>`;
  if(t>=22)front+=`<g class="fr-spin2" style="transform-origin:60px 60px">${Array.from({length:5},(_,k)=>{const a=k*2*Math.PI/5;return`<circle cx="${60+52*Math.cos(a)}" cy="${60+52*Math.sin(a)}" r="2.2" fill="#fff"/>`;}).join('')}</g>`;
  // the level, on a ribbon
  const w=lv>=1000?34:lv>=100?28:22;
  front+=`<path d="M${60-w/2-6} 92l6-5h${w}l6 5-6 5h-${w}z" fill="url(#${id}m)" stroke="${M[2]}" stroke-width="1"/><text x="60" y="95.6" text-anchor="middle" font-family="IBM Plex Sans Arabic,sans-serif" font-weight="800" font-size="10" fill="${t>=4&&t<10?'#1a1205':'#fff'}" stroke="${t>=4&&t<10?'none':'rgba(0,0,0,.6)'}" stroke-width=".6" paint-order="stroke">${lv}</text>`;
  return`<svg class="lvf" viewBox="0 0 120 120" width="${size}" height="${size}" aria-label="level ${lv}">${g}${back}${body}${front}</svg>`;
}
// a picture on its own (for the picker)
function avPic(i,size){const A=AVATARS[i],id='p'+(++_svgN);return`<svg viewBox="0 0 100 100" width="${size}" height="${size}"><defs><radialGradient id="${id}" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="${A[1]}"/><stop offset="1" stop-color="${A[0]}"/></radialGradient></defs><circle cx="50" cy="50" r="50" fill="url(#${id})"/>${A[2]}</svg>`;}
