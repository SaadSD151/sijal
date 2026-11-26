// builds single-file versions of the game into dist/
const fs=require('fs'),path=require('path'),p=f=>fs.readFileSync(path.join(__dirname,'src',f),'utf8');
// older browsers: expand the inset shorthand, and add right/left fallbacks for inset-inline-* (RTL is the default language)
const compatCss=css=>{
  css=css.replace(/(^|[;{\s])inset:([^;}]+)/g,(m,pre,v)=>{const p=v.trim().split(/\s+/),[t,r,b,l]=p.length===1?[p[0],p[0],p[0],p[0]]:p.length===2?[p[0],p[1],p[0],p[1]]:p.length===3?[p[0],p[1],p[2],p[1]]:p;return `${pre}top:${t};right:${r};bottom:${b};left:${l}`;});
  const fb=[];css.replace(/([^{}]+)\{([^{}]*inset-inline-(?:start|end)[^{}]*)\}/g,(m,sel,body)=>{const d=[];body.replace(/inset-inline-(start|end):([^;}]+)/g,(x,k,v)=>{d.push(`${k==='start'?'right':'left'}:${v.trim()}`);});if(d.length)fb.push(`${sel.trim()}{${d.join(';')}}`);});
  return css+(fb.length?`\n@supports not (inset-inline-start:0){${fb.join('\n')}}\n`:'');
};
const src=['core','map','game','ai','render','i18n','net','ui'].map(f=>p(f+'.js')).join('\n'),js=`const BUILD_ID='${require('crypto').createHash('sha1').update(src).digest('hex').slice(0,10)}';\n`+src,css=compatCss(p('style.css')),body=p('body.html');
const TITLE='<title>سِجال حرب المدن</title>';
const FONTS='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap">';
const script=m=>`<script>\n${m?`window.SIJAL_MODE='${m}';`:''}(function(){"use strict";\n${js}\n})();\n</script>`;
const out=(f,s)=>{fs.writeFileSync(path.join(__dirname,'dist',f),s);console.log(f,(s.length/1024).toFixed(0)+' KB');};
// page fragment for the hosted version (the host adds the document skeleton)
out('sijal-artifact.html',`${TITLE}\n<meta name="claude:viewport-fit-sides" content="cover">\n${FONTS}\n<style>\n${css}</style>\n${body}${script()}\n`);
// standalone files: auto-detect, forced mobile, forced PC
const full=m=>`<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n<meta name="theme-color" content="#092440">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-capable" content="yes">\n${TITLE}\n${FONTS}\n<style>:root{padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}[hidden]{display:none!important}</style>\n<style>\n${css}</style>\n</head>\n<body>\n${body}${script(m)}\n</body>\n</html>\n`;
out('sijal.html',full());try{fs.mkdirSync(path.join(__dirname,'dist','site'));}catch(e){}const SITE='https://sijalwar.com/',DESC='سِجال حرب المدن: لعبة حرب استراتيجية مجانية على المتصفح، وسّع أرضك واحتلّ المدن والعب أونلاين مع أخوياك.';
const META=`<meta name="description" content="${DESC}">\n<link rel="icon" type="image/png" href="icon.png">\n<link rel="apple-touch-icon" href="icon.png">\n<link rel="manifest" href="manifest.json">\n<meta property="og:type" content="website">\n<meta property="og:site_name" content="سِجال">\n<meta property="og:title" content="سِجال حرب المدن">\n<meta property="og:description" content="${DESC}">\n<meta property="og:url" content="${SITE}">\n<meta property="og:image" content="${SITE}preview.png">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="${SITE}preview.png">\n<meta name="theme-color"`;
// the website serves its own copy of the fonts (also kept offline by the service worker)
out('site/index.html',full().replace(FONTS,'<link rel="stylesheet" href="fonts/fonts.css">').replace('<meta name="theme-color"',META));
const FD=path.join(__dirname,'src','assets','fonts'),FO=path.join(__dirname,'dist','site','fonts'),FF=fs.readdirSync(FD);try{fs.mkdirSync(FO);}catch(e){}for(const f of FF)fs.copyFileSync(path.join(FD,f),path.join(FO,f));
fs.writeFileSync(path.join(__dirname,'dist','site','version.json'),JSON.stringify({build:js.match(/BUILD_ID='([0-9a-f]+)'/)[1]}));
fs.copyFileSync(path.join(__dirname,'vendor','peerjs-1.5.4-compat.js'),path.join(__dirname,'dist','site','peer.js'));
for(const f of['icon.png','preview.png'])fs.copyFileSync(path.join(__dirname,'src','assets',f),path.join(__dirname,'dist','site',f));
// offline play: a service worker keeps the game and its fonts on the device; the page always tries the network first, so updates still arrive
{const bid=js.match(/BUILD_ID='([0-9a-f]+)'/)[1];
fs.writeFileSync(path.join(__dirname,'dist','site','sw.js'),`// built by build.js
const C='sijal-${bid}',CORE=['./','index.html','icon.png','peer.js','manifest.json',${JSON.stringify(FF.map(f=>'fonts/'+f)).slice(1,-1)}];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(K=>Promise.all(K.filter(k=>k!==C&&k.startsWith('sijal-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET')return;
  // fonts: from the device first, refreshed in the background
  if(/fonts\\.(googleapis|gstatic)\\.com$/.test(u.hostname)){e.respondWith(caches.open('sijalfonts').then(c=>c.match(r).then(hit=>{const net=fetch(r).then(res=>{if(res.ok||res.type==='opaque')c.put(r,res.clone());return res;}).catch(()=>hit);return hit||net;})));return;}
  if(u.origin!==location.origin||/version\\.json/.test(u.pathname))return;
  // the game itself: network first (with a short wait), the saved copy when offline
  e.respondWith(new Promise(res=>{let done=false;const fall=()=>caches.match(r,{ignoreSearch:true}).then(h=>h||caches.match('index.html')).then(h=>{if(!done&&h){done=true;res(h);}});
    const tm=setTimeout(fall,4000);fetch(r).then(n=>{clearTimeout(tm);if(n.ok){const cp=n.clone();caches.open(C).then(c=>c.put(r,cp));}if(!done){done=true;res(n);}}).catch(()=>{clearTimeout(tm);fall().then(()=>{if(!done){done=true;res(Response.error());}});});}));
});
`);
fs.writeFileSync(path.join(__dirname,'dist','site','manifest.json'),JSON.stringify({name:'سِجال حرب المدن',short_name:'سِجال',lang:'ar',dir:'rtl',start_url:'./',scope:'./',display:'standalone',orientation:'any',background_color:'#06101c',theme_color:'#0b1726',icons:[{src:'icon.png',sizes:'512x512',type:'image/png',purpose:'any'}]}));}out('sijal-mobile.html',full('mobile'));out('sijal-pc.html',full('pc'));
