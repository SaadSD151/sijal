// The 90-second Sijal trailer, cut from real game footage recorded by marketing/clips/record.js and stills of the menus.
//   node marketing/trailer/trailer.js <v|h> <workdir> <outdir>
// <workdir> holds <story>-<v|h>/ (raw frames + marks.json from record.js) and ui-<name>-<v|h>.png stills.
// Writes <outdir>/f/*.jpg (30 fps) and <outdir>/marks.json (the moments the music hits on).
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const O=process.argv[2]||'v',W=path.resolve(process.argv[3]),OUT=path.resolve(process.argv[4]),FPS=30,V=O==='v',WD=V?1080:1920,HT=V?1920:1080;
const LOGO='data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'../sijal-logo.png')).toString('base64');
const font=fs.readFileSync(path.join(__dirname,'../../src/assets/fonts/fonts.css'),'utf8').replace(/url\(([^)]+)\)/g,(m,f)=>'url(data:font/woff2;base64,'+fs.readFileSync(path.join(__dirname,'../../src/assets/fonts',f)).toString('base64')+')');
const mk=s=>{const p=path.join(W,s+'-'+O,'marks.json');if(!fs.existsSync(p))return null;const j=JSON.parse(fs.readFileSync(p,'utf8'));return Object.assign({},j,j.extra&&j.extra.M||{});};
const M={speed:mk('speed'),swarm:mk('swarm'),naval:mk('naval'),mercy:mk('mercy'),dome:mk('dome'),six7:mk('six7')};
const fr=(s,i)=>path.join(W,s+'-'+O,'f',String(Math.max(0,Math.min(M[s].total-1,Math.round(i)))).padStart(5,'0')+'.jpg');
const ui=n=>path.join(W,'ui-'+n+'-'+O+'.png');

// ── the cut: [seconds, source] where source is footage (story, from, to) or a still (ui) ──
const frames=[],caps=[],hits=[],booms=[];let t=0;
const clip=(s,a,b,dur,o={})=>{if(!M[s])return;const n=Math.round(dur*FPS),t0=t;for(let k=0;k<n;k++){const u=n>1?k/(n-1):0;frames.push({src:fr(s,a+(b-a)*(o.ease?o.ease(u):u)),kb:o.kb||0,u,fx:o.fx||''});}t+=dur;return t0;};
const still=(n,dur,o={})=>{const N=Math.round(dur*FPS),t0=t;for(let k=0;k<N;k++)frames.push({src:ui(n),kb:1,u:k/(N-1),fx:'ui',pan:o.pan||0});t+=dur;return t0;};
const black=(dur,fx)=>{const N=Math.round(dur*FPS),t0=t;for(let k=0;k<N;k++)frames.push({src:'',u:k/(N-1),fx});t+=dur;return t0;};
const cap=(a,b,txt,st)=>caps.push([a,b,txt,st||'']);
const at=(s,key,fb)=>M[s]&&M[s][key]!=null?M[s][key]:fb;

// 1 · the hook: the doomsday bomb lands, in slow motion
{const h=at('dome','hit2',150);const t0=clip('dome',h-3,h+44,3.4,{ease:u=>Math.pow(u,.8)});booms.push(t0+.1);cap(.9,3.3,'الحرب بدأت','hook');}
// 2 · title
{const t0=black(2.2,'title');hits.push(t0);}
// 3 · from one city to an empire
{const e=at('speed','end',300);const t0=clip('speed',0,e,12);cap(t0+.2,t0+5,'ابدأ بـ<y>مدينة وحدة</y>…');cap(t0+5.2,t0+11.8,'وسّع أرضك… <y>واحتلّ الخريطة</y> 🗺️');hits.push(t0);}
// 4 · three against one
{const e=at('swarm','end',360),t0=t,sc=12/e;clip('swarm',0,e,12);cap(t0+.2,t0+4,'ثلاث دول <r>ضدك؟</r>');cap(t0+4.2,t0+11.8,'صدّهم… <y>واكتسحهم</y> ⚔️');hits.push(t0);
  for(const k of['turn','k1','k2','k3'])if(M.swarm&&M.swarm[k]!=null)hits.push(t0+M.swarm[k]*sc);}
// 6 · they beg for peace
{const ask=at('mercy','ask',160),no=at('mercy','no',ask+80),b=Math.min(at('mercy','end',no+200),no+120),a=ask-30,t0=clip('mercy',a,b,8);cap(t0+.2,t0+3.6,'يطلبون <y>السلام</y> 🏳️');cap(t0+3.8,t0+7.8,'والقرار <r>لك</r> 😈');hits.push(t0+(no-a)/(b-a)*8);}
// 7 · upgrade the army
{const t0=still('army',4.4);cap(t0+.2,t0+4.2,'طوّر <y>جيشك</y> 🎖️','ui');hits.push(t0);}
// 8 · missiles, the dome, and the one it cannot stop
{const r=at('dome','rocket',40),h=at('dome','hit2',150),t0=t;
  const t1=clip('dome',r,h-4,10);const sc=10/(h-4-r);
  for(const[k,c]of[['stop0','صاروخ 🚀… <y>صدّته القبة</y> 🛡️'],['stop1','نووي ☢️… <y>صدّته بعد</y>']]){const m=at('dome',k,null);if(m!=null){hits.push(t1+(m-r)*sc);}}
  cap(t0+.2,t0+4.6,'صواريخ ونووي 🚀☢️');cap(t0+4.8,t0+9.8,'وقبّة <y>تصدّها</y> 🛡️');
  const t2=clip('dome',h-4,h+70,4.2,{ease:u=>u<.3?u*.5:.15+(u-.3)*1.214});booms.push(t2+.1);cap(t2+.1,t2+4,'إلا <r>قنبلة الفناء</r> 💀','big');}
// 9 · the daily challenge
{const t0=still('daily',4);cap(t0+.2,t0+3.8,'تحدّي <y>كل يوم</y> 📅 · أبطال اليوم 🏆','ui');hits.push(t0);}
// 10 · Season Zero
{const t0=still('pass',3.2);still('skins',2.8);cap(t0+.2,t0+5.8,'<y>السيزون صفر</y> 🎖️ · سكنات حصرية','ui');hits.push(t0);}
// 11 · the 67 reply
{const s7=at('six7','67',at('six7','six7',100)),t0=clip('six7',s7-6,s7+80,4.4);cap(t0+.2,t0+4.2,'واستفز <y>خصمك</y> 😏');hits.push(t0);}
// 12 · online with friends
{const t0=still('menu',5);cap(t0+.2,t0+4.8,'العب <y>أونلاين</y> مع أخوياك 🌍','ui');hits.push(t0);}
// 13 · the end card: the address, big
{const t0=black(12,'out');booms.push(t0+.05);}
const LEN=frames.length/FPS,OUTRO=LEN-12;

(async()=>{
  fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(path.join(OUT,'f'),{recursive:true});
  const b=await chromium.launch(),pg=await (await b.newContext({viewport:{width:WD,height:HT},deviceScaleFactor:1})).newPage();
  const page=path.join(OUT,'t.html'),S=V?1:1.18;// type scale
  fs.writeFileSync(page,`<!doctype html><html><head><meta charset="utf-8"><style>${font}
  html,body{margin:0;width:${WD}px;height:${HT}px;overflow:hidden;direction:ltr;background:#000;font-family:'IBM Plex Sans Arabic',sans-serif}
  #bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform-origin:50% 50%}
  #vig{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 45%,rgba(0,0,0,.65) 100%)}
  #grade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,170,60,.06),rgba(0,40,90,.12));mix-blend-mode:overlay}
  #fl{position:absolute;inset:0;background:#fff;opacity:0}#dark{position:absolute;inset:0;background:#000;opacity:0}
  .cap{direction:rtl;position:absolute;left:4%;right:4%;top:${V?'24%':'70%'};text-align:center;color:#fff;font-weight:700;font-size:${Math.round(74*S)}px;line-height:1.3;opacity:0;
    -webkit-text-stroke:${Math.round(10*S)}px #000;paint-order:stroke fill;text-shadow:0 8px 30px rgba(0,0,0,.8)}
  .cap y{color:#ffd23f}.cap r{color:#ff4a3d}
  .cap.hook{top:${V?'40%':'40%'};font-size:${Math.round(130*S)}px;letter-spacing:2px}.cap.big{font-size:${Math.round(96*S)}px}
  .cap.ui{top:${V?'6%':'76%'};font-size:${Math.round(62*S)}px}
  #title,#out{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${Math.round(26*S)}px;opacity:0}
  #title img,#out img{width:${V?'74%':'32%'};filter:drop-shadow(0 12px 40px rgba(0,0,0,.8)) drop-shadow(0 0 60px rgba(227,185,90,.55))}
  #title p{direction:rtl;margin:0;color:#e9d9b0;font-size:${Math.round(52*S)}px;font-weight:600;letter-spacing:1px}
  #out .p,#out .s{direction:rtl}#out .p{color:#fff;font-weight:700;font-size:${Math.round(60*S)}px;-webkit-text-stroke:${Math.round(6*S)}px #000;paint-order:stroke fill}
  #out .u{direction:ltr;padding:${Math.round(22*S)}px ${Math.round(56*S)}px;border-radius:999px;background:linear-gradient(180deg,#f6d77c,#c9952d);color:#1a1205;font-weight:700;font-size:${Math.round(96*S)}px;box-shadow:0 0 60px rgba(241,207,110,.6),0 16px 40px rgba(0,0,0,.6)}
  #out .s{color:#cfe0f0;font-size:${Math.round(40*S)}px;font-weight:600}
  #rwrap{position:absolute;inset:0;overflow:hidden}
  #rays{position:absolute;left:50%;top:50%;width:${Math.max(WD,HT)*1.6}px;height:${Math.max(WD,HT)*1.6}px;margin:-${Math.max(WD,HT)*.8}px;background:repeating-conic-gradient(from 0deg,rgba(241,207,110,.09) 0 6deg,rgba(0,0,0,0) 6deg 18deg);opacity:0;border-radius:50%}
  #wm{position:absolute;${V?'left:40px;bottom:46px;width:200px':'left:44px;bottom:40px;width:230px'};opacity:.85;filter:drop-shadow(0 4px 12px rgba(0,0,0,.8))}
  #bars i{position:absolute;left:0;right:0;height:${V?0:6}%;background:#000}#bars i:first-child{top:0}#bars i:last-child{bottom:0}
  </style></head><body><img id="bg"><div id="grade"></div><div id="vig"></div><div id="bars"><i></i><i></i></div>
  ${caps.map((c,i)=>`<div class="cap ${c[3]}" id="c${i}">${c[2]}</div>`).join('')}
  <div id="rwrap"><div id="rays"></div></div><div id="title"><img src="${LOGO}"><p>لعبة حرب استراتيجية سعودية</p></div>
  <div id="out"><img src="${LOGO}"><div class="p">العب مجاناً 🔥</div><div class="u">sijalwar.com</div><div class="s">من المتصفح · بدون تحميل · جوال وكمبيوتر</div></div>
  <img id="wm" src="${LOGO}"><div id="dark"></div><div id="fl"></div></body></html>`);
  await pg.goto('file://'+page);await pg.waitForTimeout(800);await pg.evaluate(()=>document.fonts.ready);
  for(let i=0;i<frames.length;i++){
    const F=frames[i],tt=i/FPS;
    await pg.evaluate(async([F,tt,caps,hits,booms,LEN,OUTRO,V])=>{
      const bg=document.getElementById('bg');if(F.src){if(bg.dataset.s!==F.src){bg.src='file://'+F.src;bg.dataset.s=F.src;await bg.decode().catch(()=>{});}bg.style.opacity=1;}else bg.style.opacity=0;
      // camera: a slow push on stills, a punch-in and shake on every hit, a big one on the bombs
      let sc=F.fx==='ui'?1.02+.08*F.u:1.04,sx=0,sy=0,fl=0;
      for(const h of hits){const d=tt-h;if(d>=0&&d<.35){const k=1-d/.35;sc+=.05*k;fl=Math.max(fl,.35*k);sx+=Math.sin(tt*97)*8*k;sy+=Math.cos(tt*83)*8*k;}}
      for(const h of booms){const d=tt-h;if(d>=0&&d<1.1){const k=1-d/1.1;sc+=.1*k;fl=Math.max(fl,k);sx+=Math.sin(tt*91)*26*k;sy+=Math.cos(tt*73)*26*k;}}
      bg.style.transform=`translate(${sx}px,${sy}px) scale(${sc})`;bg.style.filter=F.fx==='ui'?'brightness(.82) saturate(1.1)':'saturate(1.18) contrast(1.06)';
      document.getElementById('fl').style.opacity=fl;
      // section changes: a quick dip
      document.getElementById('dark').style.opacity=F.u<.06&&F.fx!=='title'&&F.fx!=='out'&&tt>.5?1-F.u/.06:0;
      for(let j=0;j<caps.length;j++){const c=caps[j],e=document.getElementById('c'+j),on=tt>=c[0]&&tt<c[1];if(!on){e.style.opacity=0;continue;}
        const a=tt-c[0],o=Math.min(1,a/.14,(c[1]-tt)/.16),k=Math.min(1,a/.22),s=1.35-.35*(1-Math.pow(1-k,3));e.style.opacity=o;e.style.transform=`scale(${s})`;e.style.filter=`blur(${(1-k)*6}px)`;}
      const ti=document.getElementById('title');ti.style.opacity=F.fx==='title'?Math.min(1,F.u/.15,(1-F.u)/.15):0;ti.style.transform=`scale(${F.fx==='title'?1.12-.12*F.u:1})`;
      const ou=F.fx==='out'?Math.min(1,F.u*12/1.2):0,o=document.getElementById('out');o.style.opacity=ou;
      const ry=document.getElementById('rays');ry.style.opacity=F.fx==='out'||F.fx==='title'?.9:0;ry.style.transform=`rotate(${tt*8}deg)`;
      if(F.fx==='out'){const k=tt-OUTRO;[...o.children].forEach((e,j)=>{const v=Math.max(0,Math.min(1,(k-.15-j*.45)/.35));e.style.opacity=v;e.style.transform=`scale(${1.4-.4*(1-Math.pow(1-v,3))})`;});
        const u=o.querySelector('.u');u.style.boxShadow=`0 0 ${60+40*Math.sin(tt*4)}px rgba(241,207,110,${.5+.25*Math.sin(tt*4)}),0 16px 40px rgba(0,0,0,.6)`;}
      document.getElementById('wm').style.opacity=F.fx==='out'||F.fx==='title'?0:.85;
    },[F,tt,caps,hits,booms,LEN,OUTRO,V]);
    await pg.screenshot({path:path.join(OUT,'f',String(i).padStart(5,'0')+'.jpg'),type:'jpeg',quality:90});
    if(i%300===0)process.stdout.write((tt|0)+'s ');
  }
  fs.writeFileSync(path.join(OUT,'marks.json'),JSON.stringify({story:'trailer',len:LEN,hits,booms,outro:OUTRO,title:3.4}));
  console.log('\n'+O,'len',LEN.toFixed(1),'hits',hits.length);await b.close();
})();
