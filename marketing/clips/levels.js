// A TikTok clip about the level frames: what your account looks like from level 1 to level 1000.
//   node marketing/clips/levels.js <bg.jpg> <outdir>
// Draws every frame with the game's own frame art (src/avatar.js); writes <outdir>/f/*.jpg and <outdir>/marks.json for music.js.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const BG=path.resolve(process.argv[2]),OUT=path.resolve(process.argv[3]),FPS=30;
const AV=fs.readFileSync(path.join(__dirname,'../../src/avatar.js'),'utf8');
const LOGO='data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'../sijal-logo.png')).toString('base64');
const BGD='data:image/jpeg;base64,'+fs.readFileSync(BG).toString('base64');

// the level over time: [second, level]; linear between points, with the climb slowing into each milestone
const HOOK=2.2,REW=.7,M0=HOOK+REW;
const KEY=[[0,1000],[HOOK,1000],[M0,1],[M0+1.3,1],[M0+6.3,100],[M0+7.3,100],[M0+11.3,900],[M0+12.9,1000]];
const PEAK=KEY[KEY.length-1][0],OUTRO=PEAK+2.4,LEN=OUTRO+3;
function levelAt(t){if(t>=PEAK)return 1000;for(let i=1;i<KEY.length;i++){const[a,la]=KEY[i-1],[b,lb]=KEY[i];if(t<=b){const u=(t-a)/(b-a||1);return Math.max(1,Math.round(la+(lb-la)*u));}}return 1000;}
const CAPS=[[0,HOOK,'وش شكل حسابك…','hook'],[.7,HOOK,'في <y>لفل 1000</y>؟ 👀','hook2'],[HOOK,M0,'⏪','rew'],
  [M0,M0+1.3,'أول ما تبدأ: <y>لفل 1</y> 😐'],[M0+1.3,M0+6.3,'كل <y>10 لفلات</y>… شكل جديد ✨'],[M0+6.3,M0+7.3,'<y>لفل 100</y> 🔥','big'],
  [M0+7.3,PEAK-1.2,'وبعدها كل <y>100 لفل</y> أفخم 💎'],[PEAK-1.2,PEAK,'وأخيراً…'],[PEAK,OUTRO,'👑 <y>لفل 1000</y>','big'],[PEAK+.6,OUTRO,'أعلى شكل في اللعبة','low']];
const SKINS=[25,50,75,100];

(async()=>{
  fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(path.join(OUT,'f'),{recursive:true});
  const b=await chromium.launch(),pg=await (await b.newContext({viewport:{width:360,height:640},deviceScaleFactor:3})).newPage();
  const page=path.join(OUT,'levels.html');fs.writeFileSync(page,`<!doctype html><html dir="ltr"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@500;700&display=swap" rel="stylesheet"><style>
    html,body{margin:0;width:360px;height:640px;overflow:hidden;background:#05080f;font-family:'IBM Plex Sans Arabic',sans-serif}#wrap{position:fixed;left:0;top:0;width:360px;height:640px;overflow:hidden}.cap,#lv,#skin,#out{direction:rtl}
    #bg{position:absolute;inset:-20px;width:400px;height:680px;object-fit:cover;filter:blur(7px) saturate(.8) brightness(.45)}
    #shade{position:absolute;inset:0;background:radial-gradient(circle at 50% 46%,rgba(241,207,110,.18),rgba(3,6,12,.75) 62%)}
    #rays{position:absolute;left:50%;top:45%;width:760px;height:760px;margin:-380px 0 0 -380px;border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(255,224,138,.16) 0 7deg,rgba(255,224,138,0) 7deg 20deg);-webkit-mask:radial-gradient(circle,#000 0,#000 30%,transparent 68%);mask:radial-gradient(circle,#000 0,#000 30%,transparent 68%);opacity:0}
    #glow{position:absolute;left:50%;top:45%;width:330px;height:330px;margin:-165px 0 0 -165px;border-radius:50%;background:radial-gradient(circle,rgba(255,224,138,.55),rgba(255,224,138,0) 65%);opacity:.4}
    #fr{position:absolute;left:50%;top:45%;width:250px;height:250px;margin:-125px 0 0 -125px;filter:drop-shadow(0 14px 30px rgba(0,0,0,.6))}
    #fr svg{width:250px;height:250px}
    #lv{position:absolute;left:0;right:0;top:66.5%;text-align:center;color:#ffe08a;font-weight:700;font-size:44px;-webkit-text-stroke:5px #000;paint-order:stroke fill;text-shadow:0 0 18px rgba(241,207,110,.6);font-variant-numeric:tabular-nums}
    #bar{position:absolute;left:14%;right:14%;top:77%;height:12px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden;direction:ltr}#bar u{display:block;height:100%;width:0;background:linear-gradient(90deg,#c9952d,#f1cf6e)}
    #ring{position:absolute;left:50%;top:45%;width:250px;height:250px;margin:-125px 0 0 -125px;border-radius:50%;border:4px solid #ffe08a;opacity:0}
    #skin{position:absolute;left:50%;top:81%;transform:translateX(-50%);padding:7px 16px;border-radius:999px;background:linear-gradient(180deg,#5fd37a,#2f9c4c);color:#04210d;font-weight:700;font-size:19px;opacity:0;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.45)}
    #scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.06) 0 2px,rgba(0,0,0,0) 2px 5px);opacity:0}
    #fl{position:absolute;inset:0;background:#fff;opacity:0}
    .cap{position:absolute;left:5%;right:5%;top:9%;text-align:center;color:#fff;font-weight:700;font-size:29px;line-height:1.35;opacity:0;-webkit-text-stroke:5px #000;paint-order:stroke fill;text-shadow:0 4px 14px rgba(0,0,0,.6)}
    .cap y{color:#ffd23f}.hook{top:8%;font-size:36px}.hook2{top:17%;font-size:36px}.big{font-size:44px;top:10%}.low{top:88%;font-size:22px}
    .rew{top:40%;font-size:90px;-webkit-text-stroke:0;text-shadow:0 0 24px rgba(0,0,0,.8)}
    #out{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;opacity:0;background:rgba(4,10,20,.8);backdrop-filter:blur(6px)}
    #out img{width:74%;filter:drop-shadow(0 10px 30px rgba(0,0,0,.7)) drop-shadow(0 0 26px rgba(227,185,90,.4))}
    #out .q{color:#fff;font-weight:700;font-size:27px;-webkit-text-stroke:4px #000;paint-order:stroke fill;text-align:center;padding:0 16px}
    #out .s{color:#d7e6f5;font-weight:500;font-size:16px}
    #out .l{direction:ltr;padding:10px 20px;border-radius:999px;background:linear-gradient(180deg,#f1cf6e,#c9952d);color:#1a1205;font-weight:700;font-size:22px;box-shadow:0 8px 24px rgba(0,0,0,.5)}
    #out .b{color:#ffd23f;font-weight:700;font-size:19px;-webkit-text-stroke:3px #000;paint-order:stroke fill}
    #brand{position:absolute;left:10px;bottom:12px;width:74px;opacity:.85;filter:drop-shadow(0 2px 6px rgba(0,0,0,.8))}
  </style></head><body><div id="wrap"><img id="bg" src="${BGD}"><div id="shade"></div><div id="rays"></div><div id="glow"></div><div id="ring"></div><div id="fr"></div><div id="lv"></div><div id="bar"><u></u></div><div id="skin">🎁 سكن جديد!</div>
    ${CAPS.map((c,i)=>`<div class="cap ${c[3]||''}" id="c${i}">${c[2]}</div>`).join('')}<img id="brand" src="${LOGO}"><div id="scan"></div>
    <div id="out"><img src="${LOGO}"><div class="q">كم لفلك أنت؟ 👀</div><div class="s">العبها مجاناً من المتصفح · بدون تحميل</div><div class="l">sijalwar.com</div><div class="b">🔗 الرابط في البايو</div></div><div id="fl"></div></div>
    <script>${AV}
    window.lvFrame=lvFrame;window.lvTier=lvTier;</script></body></html>`);
  await pg.goto('file://'+page);await pg.waitForTimeout(1500);await pg.evaluate(()=>document.fonts.ready);
  const N=Math.round(LEN*FPS),marks={story:'levels',len:LEN,hook:HOOK,main:M0,outro:OUTRO,peak:PEAK,l100:M0+6.3},tiers=[];let lastTier=-1,lastSkin=-1,lastL=-1;
  for(let i=0;i<N;i++){
    const t=i/FPS,L=levelAt(t),tr=await pg.evaluate(L=>lvTier(L),L);
    if(t>=M0&&tr!==lastTier){if(lastTier>=0)tiers.push(t);lastTier=tr;}
    let sk=-1;for(const s of SKINS)if(t>=M0&&t<PEAK&&L>=s&&lastL<s&&lastL>0)sk=s;if(sk>0)lastSkin=t;lastL=L;
    await pg.evaluate(([t,L,C,tiers,skinAt,M0,HOOK,PEAK,OUTRO])=>{
      const fr=document.getElementById('fr');if(fr.dataset.l!==String(L)){fr.innerHTML=lvFrame(L,250,0);fr.dataset.l=L;}
      // a pop on every new frame shape, a big one at 1000
      let pop=1,ring=0,fl=0;for(const x of tiers){const d=t-x;if(d>=0&&d<.35){pop=Math.max(pop,1+.16*(1-d/.35));ring=Math.max(ring,1-d/.35);}}
      const dp=t-PEAK;if(dp>=0&&dp<.6){pop=Math.max(pop,1+.3*(1-dp/.6));fl=Math.max(fl,.9*(1-dp/.6));ring=Math.max(ring,1-dp/.6);}
      const dh=t-HOOK;if(dh>=0&&dh<.2)fl=Math.max(fl,.5*(1-dh/.2));
      fr.style.transform='scale('+pop+')';const rg=document.getElementById('ring');rg.style.opacity=ring;rg.style.transform='scale('+(1+.5*(1-ring))+')';
      const tier=lvTier(L),rays=document.getElementById('rays');rays.style.opacity=Math.min(1,tier/12)+(t>=PEAK?.3:0);rays.style.transform='rotate('+(t*14)+'deg)';
      document.getElementById('glow').style.opacity=.3+Math.min(.6,tier/20)+(t>=PEAK?.3:0);
      document.getElementById('lv').textContent='لفل '+L;
      document.getElementById('bar').firstElementChild.style.width=Math.min(100,L/10)+'%';
      const sk=document.getElementById('skin'),ds=t-skinAt;sk.style.opacity=ds>=0&&ds<.9?Math.min(1,(.9-ds)/.2,ds/.08):0;
      document.getElementById('scan').style.opacity=t>=HOOK&&t<M0?1:0;document.getElementById('fl').style.opacity=fl;
      C.forEach((c,j)=>{const e=document.getElementById('c'+j),on=t>=c[0]&&t<c[1];if(!on){e.style.opacity=0;return;}const a=t-c[0],o=Math.min(1,a/.12,(c[1]-t)/.12),p=a<.1?.7+3*a:a<.2?1.08-(a-.1)*.8:1;e.style.opacity=o;e.style.transform='scale('+p+')';});
      const ou=Math.max(0,Math.min(1,(t-OUTRO)/.35)),o=document.getElementById('out');o.style.opacity=ou;
      o.querySelectorAll('.q,.s,.l,.b').forEach((e,k)=>{const v=Math.max(0,Math.min(1,(t-OUTRO-.25-k*.22)/.25));e.style.opacity=v;e.style.transform='translateY('+(1-v)*10+'px)';});
      document.getElementById('brand').style.opacity=t<OUTRO?.85:0;
    },[t,L,CAPS,tiers,lastSkin<0?-9:lastSkin,M0,HOOK,PEAK,OUTRO]);
    await pg.screenshot({path:path.join(OUT,'f',String(i).padStart(5,'0')+'.jpg'),type:'jpeg',quality:92});
    if(i%90===0)process.stdout.write((t).toFixed(0)+'s ');
  }
  marks.tiers=tiers;fs.writeFileSync(path.join(OUT,'marks.json'),JSON.stringify(marks));console.log('\nlevels',JSON.stringify(marks));await b.close();
})();
