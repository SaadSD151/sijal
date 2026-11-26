// built by build.js
const C='sijal-14a6b1d6d8',CORE=['./','index.html','icon.png','peer.js','manifest.json',"fonts/ArefRuqaa-400-arabic.woff2","fonts/ArefRuqaa-400-latin.woff2","fonts/ArefRuqaa-700-arabic.woff2","fonts/ArefRuqaa-700-latin.woff2","fonts/IBMPlexSansArabic-400-arabic.woff2","fonts/IBMPlexSansArabic-400-latin.woff2","fonts/IBMPlexSansArabic-500-arabic.woff2","fonts/IBMPlexSansArabic-500-latin.woff2","fonts/IBMPlexSansArabic-600-arabic.woff2","fonts/IBMPlexSansArabic-600-latin.woff2","fonts/IBMPlexSansArabic-700-arabic.woff2","fonts/IBMPlexSansArabic-700-latin.woff2","fonts/fonts.css"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(K=>Promise.all(K.filter(k=>k!==C&&k.startsWith('sijal-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET')return;
  // fonts: from the device first, refreshed in the background
  if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){e.respondWith(caches.open('sijalfonts').then(c=>c.match(r).then(hit=>{const net=fetch(r).then(res=>{if(res.ok||res.type==='opaque')c.put(r,res.clone());return res;}).catch(()=>hit);return hit||net;})));return;}
  if(u.origin!==location.origin||/version\.json/.test(u.pathname))return;
  // the game itself: network first (with a short wait), the saved copy when offline
  e.respondWith(new Promise(res=>{let done=false;const fall=()=>caches.match(r,{ignoreSearch:true}).then(h=>h||caches.match('index.html')).then(h=>{if(!done&&h){done=true;res(h);}});
    const tm=setTimeout(fall,4000);fetch(r).then(n=>{clearTimeout(tm);if(n.ok){const cp=n.clone();caches.open(C).then(c=>c.put(r,cp));}if(!done){done=true;res(n);}}).catch(()=>{clearTimeout(tm);fall().then(()=>{if(!done){done=true;res(Response.error());}});});}));
});
