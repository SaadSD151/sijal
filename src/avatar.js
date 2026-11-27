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
// the frame for a level: a simple shape that changes every 10 levels up to 100, then every 100 levels up to 1000
const lvTier=l=>l<100?Math.floor(l/10):Math.min(19,10+Math.floor((l-100)/100));
const FRAME_MAT=[['#7d828a','#b9bec6','#4a4e55'],['#9a6a3a','#d9a46a','#5a3816'],['#a8733a','#e8b57a','#6a4216'],['#8c97a3','#eef2f6','#55606c'],['#9aa6b2','#ffffff','#5a6672'],['#b8860b','#ffe08a','#6a4a00'],['#c9952d','#fff0b0','#7a5400'],['#1f8a5a','#8ff0c0','#0e4a30'],['#1f5fb8','#9fd0ff','#0b2f66'],['#6a3ab8','#d2b4ff','#34146a'],
  ['#c9952d','#fff3c4','#7a5600'],['#c9d6e3','#ffffff','#6f7f90'],['#d4441a','#ffc070','#7a1e00'],['#e0a020','#fff6c0','#8a5a00'],['#3ab8c8','#d8fbff','#0d5a66'],['#b81d3a','#ffb3c2','#6a0a1e'],['#4fa83a','#e0ffd0','#245a14'],['#e05a1a','#ffe0a0','#7a2400'],['#8a3ad8','#f0d8ff','#40107a'],['#f4c542','#ffffff','#9a6a00']];
const poly=(n,r,rot,cx=60,cy=60)=>Array.from({length:n},(_,k)=>{const a=rot+k*2*Math.PI/n;return(k?'L':'M')+(cx+r*Math.cos(a)).toFixed(1)+' '+(cy+r*Math.sin(a)).toFixed(1);}).join('')+'Z';
const starP=(n,R,r,rot=-Math.PI/2)=>Array.from({length:n*2},(_,k)=>{const a=rot+k*Math.PI/n,q=k%2?r:R;return(k?'L':'M')+(60+q*Math.cos(a)).toFixed(1)+' '+(60+q*Math.sin(a)).toFixed(1);}).join('')+'Z';
const SHIELD='M60 14L98 28V58C98 82 82 98 60 106C38 98 22 82 22 58V28Z';
function lvShape(t){
  switch(t){
    case 0:return'<circle cx="60" cy="60" r="36"/>';
    case 1:return'<circle cx="60" cy="60" r="38"/>';
    case 2:return'<rect x="22" y="22" width="76" height="76" rx="18"/>';
    case 3:return`<path d="${poly(4,48,0)}"/>`;
    case 4:return`<path d="${poly(6,44,-Math.PI/2)}"/>`;
    case 5:return`<path d="${poly(8,43,Math.PI/8)}"/>`;
    case 6:return`<path d="${SHIELD}"/>`;
    case 7:return`<path d="${starP(8,50,38)}"/>`;
    case 8:return`<path d="${starP(12,50,40)}"/>`;
    default:return`<path d="${Array.from({length:16},(_,k)=>{const a=k*Math.PI/8;return`${k?'L':'M'}${(60+40*Math.cos(a)).toFixed(1)} ${(60+40*Math.sin(a)).toFixed(1)}A7 7 0 0 1 ${(60+40*Math.cos(a+Math.PI/8)).toFixed(1)} ${(60+40*Math.sin(a+Math.PI/8)).toFixed(1)}`;}).join('')}Z"/>`;
  }
}
function lvFrame(lv,size,av){
  const t=lvTier(lv),id='f'+(++_svgN),M=FRAME_MAT[t],A=AVATARS[av|0]||AVATARS[0];
  const defs=`<defs><linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${M[1]}"/><stop offset=".55" stop-color="${M[0]}"/><stop offset="1" stop-color="${M[2]}"/></linearGradient>
    <radialGradient id="${id}a" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="${A[1]}"/><stop offset="1" stop-color="${A[0]}"/></radialGradient><clipPath id="${id}c"><circle cx="60" cy="60" r="29"/></clipPath></defs>`;
  const fill=`fill="url(#${id}m)" stroke="${M[2]}" stroke-width="1.4" stroke-linejoin="round"`;
  let back='',front='',frame;
  if(t<10)frame=`<g ${fill}>${lvShape(t)}</g>`;
  else{
    // level 100 and every 100 after: a new emblem each time
    const wings=`<g ${fill}><path d="M26 60C14 50 6 36 8 24c6 8 14 12 22 14-6-8-6-16-2-22 6 10 12 16 22 20z"/><path d="M94 60c12-10 20-24 18-36-6 8-14 12-22 14 6-8 6-16 2-22-6 10-12 16-22 20z"/></g>`;
    const crown=`<path d="M42 26l4-16 8 9 6-12 6 12 8-9 4 16z" ${fill}/><circle cx="60" cy="6" r="2.6" fill="#ff3d6e"/>`;
    const rays=`<g class="fr-spin" style="transform-origin:60px 60px" fill="${M[1]}" opacity=".45"><path d="${starP(16,58,36)}"/></g>`;
    const flames=`<g fill="#ff8a2a"><path d="${starP(10,56,40)}" class="fr-pulse"/></g>`;
    switch(t){
      case 10:frame=`<path d="${SHIELD}" ${fill}/>`+crown;break;
      case 11:frame=wings+`<path d="${poly(6,44,-Math.PI/2)}" ${fill}/>`;break;
      case 12:frame=flames+`<path d="${starP(8,48,38)}" ${fill}/>`;break;
      case 13:frame=rays+`<circle cx="60" cy="60" r="40" ${fill}/>`;break;
      case 14:frame=`<path d="${poly(4,54,0)}" ${fill}/><path d="${poly(4,44,0)}" fill="none" stroke="${M[1]}" stroke-width="1.4"/>`+[[60,8],[112,60],[60,112],[8,60]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="#3dd6ff" stroke="#fff" stroke-width="1"/>`).join('');break;
      case 15:frame=`<path d="${starP(16,54,42)}" ${fill}/><circle cx="60" cy="60" r="38" fill="none" stroke="${M[1]}" stroke-width="2"/>`;break;
      case 16:frame=`<circle cx="60" cy="60" r="40" ${fill}/>`+[1,-1].map(s=>Array.from({length:7},(_,k)=>{const a=(105+k*12)*Math.PI/180,x=60+s*46*Math.cos(a),y=60+46*Math.sin(a);return`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="6" ry="2.6" transform="rotate(${s*(k*12+15)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${M[1]}" stroke="${M[2]}" stroke-width=".7"/>`;}).join('')).join('');break;
      case 17:frame=wings+`<path d="${SHIELD}" ${fill}/>`+crown;break;
      case 18:frame=rays+`<path d="${starP(12,52,40)}" ${fill}/>`+crown;break;
      default:frame=rays+wings+`<path d="${starP(8,50,40)}" ${fill}/>`+crown+`<g class="fr-spin2" style="transform-origin:60px 60px">${Array.from({length:6},(_,k)=>{const a=k*Math.PI/3;return`<circle cx="${(60+56*Math.cos(a)).toFixed(1)}" cy="${(60+56*Math.sin(a)).toFixed(1)}" r="2.4" fill="#fff"/>`;}).join('')}</g>`;
    }
  }
  const pic=`<circle cx="60" cy="60" r="31.5" fill="${M[2]}"/><g clip-path="url(#${id}c)"><circle cx="60" cy="60" r="29" fill="url(#${id}a)"/><g transform="translate(31 31) scale(.58)">${A[2]}</g></g>`;
  const w=String(lv).length*6+10;
  front=`<rect x="${60-w/2}" y="88" width="${w}" height="15" rx="7.5" fill="#0b1626" stroke="${M[1]}" stroke-width="1.6"/><text x="60" y="99.4" text-anchor="middle" font-family="IBM Plex Sans Arabic,sans-serif" font-weight="800" font-size="10.5" fill="#fff">${lv}</text>`;
  return`<svg class="lvf" viewBox="0 0 120 120" width="${size}" height="${size}" aria-label="level ${lv}">${defs}${back}${frame}${pic}${front}</svg>`;
}
// a picture on its own (for the picker)
function avPic(i,size){const A=AVATARS[i],id='p'+(++_svgN);return`<svg viewBox="0 0 100 100" width="${size}" height="${size}"><defs><radialGradient id="${id}" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="${A[1]}"/><stop offset="1" stop-color="${A[0]}"/></radialGradient></defs><circle cx="50" cy="50" r="50" fill="url(#${id})"/>${A[2]}</svg>`;}
