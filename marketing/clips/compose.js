// Pass 2 of the TikTok clips: edits the raw frames from record.js into the finished vertical clip.
//   node marketing/clips/compose.js <empire|revenge|naval> <rawdir> <outdir>
// Adds the hook, the rewind, captions, flashes, screen shake and the outro; writes <outdir>/f/*.jpg and <outdir>/marks.json (seconds, for the music).
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const STORY=process.argv[2],RAW=path.resolve(process.argv[3]),OUT=path.resolve(process.argv[4]),FPS=30;
const M=JSON.parse(fs.readFileSync(path.join(RAW,'marks.json'),'utf8')),X=M.extra.M||{},TOT=M.total;
const LOGO='data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'../sijal-logo.png')).toString('base64');
const m=k=>X[k]!=null?X[k]:M[k];

// ── the edit: which raw frame each output frame shows ──
const frames=[];const seg=(a,b,step,fx)=>{if(step>0)for(let i=a;i<=b;i+=step)frames.push({s:Math.round(i),fx});else for(let i=a;i>=b;i+=step)frames.push({s:Math.round(i),fx});};
let H=0;
if(STORY==='empire'){
  // the payoff first: the finished empire, then a fast rewind to the first city
  seg(TOT-46,TOT-1,1,'hook');H=frames.length/FPS;const r0=frames.length;seg(TOT-1,0,-(TOT/18),'rew');const R=(frames.length-r0)/FPS;H+=R;
}
const main0=frames.length;seg(0,TOT-1,1,'main');
const outro=frames.length/FPS;for(let i=0;i<Math.round(2.9*FPS);i++)frames.push({s:TOT-1,fx:'out'});
const LEN=frames.length/FPS,T=raw=>(main0+raw)/FPS;

// ── words on screen: [from s, to s, text, style] ──
const C={
  empire:[[0,H-.62,'بديت بمدينة وحدة…','hook'],[.55,H-.62,'وصرت <y>كذا 👑</y>','hook2'],[H-.62,H,'⏪','rew'],
    [T(m('spawn')+2),T(m('expand')),'حطيت عاصمتي هنا 📍'],[T(m('expand')+4),T(m('met')),'وتوسّعت شوي شوي…'],[T(m('met')),T(m('camp')),'لين وصلت <y>حدود جاري</y> 👀'],
    [T(m('camp')),T(m('attack')),'جهّزت <y>الدبابات</y> 🪖'],[T(m('attack')),T(Math.max(m('attack')+40,m('cityFall'))),'هجوم مركّز على <y>عاصمته</y> ⚔️'],[T(Math.max(m('attack')+40,m('cityFall'))),T(m('conquer')+30),'طاحت العاصمة 🔥'],
    [T(m('conquer')+30),T(m('kill')),'وكمّلت على الباقي…'],[T(m('kill')),T(m('end')),'دولته <y>انتهت</y> 💀'],[T(m('end')),outro,'وهذي البداية بس 😏']],
  revenge:[[0,2.1,'جاري <r>هجم علي</r> 😡','hook'],[.7,2.1,'وما يدري وش ينتظره…','hook2'],[2.1,T(m('defend')),'دخل أرضي ويحسب نفسه بطل 😤'],[T(m('defend')),T(m('launch1')),'صدّيت الهجوم <y>ورجّعته</y> 🛡️'],
    [T(m('launch1')),T(m('intercept')||m('launch1')+22),'طيب… خذ هذا الصاروخ 🚀'],[T(m('intercept')||m('launch1')+22),T(m('launch2')),'صدّه <y>بالقبة</y> 😒'],
    [T(m('launch2')),T(m('doom')-2),'بس ما يدري عن <r>هذي</r> ☢️'],[T(m('doom')+16),T(m('end')),'💀💀💀','big'],[T(m('end')),outro,'محد يهجم علي 😎']],
  naval:[[0,T(m('port')),'ما بيني وبينه حدود…','hook'],[.8,T(m('port')),'بس <y>بيننا بحر</y> 🌊','hook2'],[T(m('port')),T(m('boats')),'بنيت <y>ميناء</y> ⚓'],[T(m('boats')),T(m('land')||m('assault')),'إنزال بحري! 🚢'],
    [T(m('land')||m('assault')),T(m('assault')+25),'نزلوا على ساحله'],[T(m('assault')+25),T(m('capital')||m('end')),'على <y>العاصمة</y> مباشرة ⚔️'],[T(m('capital')||m('end')),T(m('end')),'العاصمة صارت لي 👑'],[T(m('end')),outro,'البحر ما يحميك 😏']],
  swarm:[[0,T(m('hold')),'كلهم <r>ضدي</r> 😨','hook'],[.8,T(m('hold')),'ثلاث دول هجموا علي مرة وحدة…','hook2'],[T(m('hold')),T(m('sweep')),'صدّيتهم كلهم 🛡️'],[T(m('sweep')),T(m('k1')||m('sweep')+40),'الحين <y>دوري</y> 😤'],
    [T(m('k1')),T(m('k2')||m('end')),'واحد 💀'],[T(m('k2')),T(m('k3')||m('end')),'اثنين 💀💀'],[T(m('k3')),T(m('end')),'وثلاثة 💀💀💀'],[T(m('end')),outro,'محد يقدر علي 😎']].filter(c=>isFinite(c[0])&&isFinite(c[1])),
  betray:[[0,T(m('gift')),'وثق فيني… 🤝','hook'],[.9,T(m('gift')),'وهذي كانت <r>غلطته</r> 😈','hook2'],[T(m('gift')),T(m('prep')),'حتى عطيته <y>هدية</y> 🎁'],[T(m('prep')),T(m('stab')),'وأنا أجهّز بصمت… 🤫'],
    [T(m('stab')),T(m('kill')||m('end')),'<r>غدرت فيه</r> 🗡️'],[T(m('kill')),T(m('end')),'دولته راحت بثواني 💀'],[T(m('end')),outro,'لا تثق بأحد في سِجال 😈']].filter(c=>isFinite(c[0])&&isFinite(c[1])),
  speed:[[0,2.4,'كم ثانية أحتاج','hook'],[.6,2.4,'عشان <y>أسيطر على الخريطة</y>؟ ⏱️','hook2'],[2.4,4.6,'من مدينة وحدة…'],
    ...Object.keys(X).filter(k=>/^kill\d+$/.test(k)).map(k=>[T(X[k]),T(X[k])+1.1,'+ دولة 💀','pop']),[T(m('done')),outro,'والخريطة <y>صارت لي</y> 👑']]
}[STORY];
const SER=M.extra.ser||null,T0hold=STORY==='swarm'?T(m('hold')):0;
const CTA={empire:'تقدر تسوي أحسن مني؟ 🤔',revenge:'وش كنت بتسوي مكاني؟ 👀',naval:'جرّب تسويها أنت 😏',swarm:'لو كنت مكاني وش بتسوي؟ 🤔',betray:'تثق بحلفائك؟ 👀',speed:'تقدر تكسر رقمي؟ ⏱️'}[STORY];
// big moments: white flash, punch-in and shake
const HITS={empire:[[T(m('cityFall')),.5,6],[T(m('kill')),.7,10]],revenge:[[T(m('intercept')),.35,4],[T(m('doom')),1,22]],naval:[[T(m('land')),.3,4],[T(m('capital')),.6,9]],swarm:[[T(m('turn')),.45,6],[T(m('k1')),.5,8],[T(m('k2')),.5,8],[T(m('k3')),.8,12]],betray:[[T(m('stab')),.7,10],[T(m('kill')),.6,9]],speed:[...Object.keys(X).filter(k=>/^kill\d+$/.test(k)).map(k=>[T(X[k]),.25,3]),[T(m('done')),.5,6]]}[STORY].filter(h=>isFinite(h[0]));

(async()=>{
  fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(path.join(OUT,'f'),{recursive:true});
  const b=await chromium.launch(),pg=await (await b.newContext({viewport:{width:360,height:640},deviceScaleFactor:3})).newPage();
  const page=path.join(OUT,'compose.html');fs.writeFileSync(page,`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@500;700&display=swap" rel="stylesheet"><style>
    html,body{margin:0;width:360px;height:640px;overflow:hidden;background:#000;font-family:'IBM Plex Sans Arabic',sans-serif}
    #bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform-origin:50% 50%}
    #vig{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 50%,rgba(0,0,0,.5) 100%)}
    #red{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(255,0,0,0) 40%,rgba(255,20,20,.55) 100%);opacity:0}
    #scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.06) 0 2px,rgba(0,0,0,0) 2px 5px);opacity:0}
    #fl{position:absolute;inset:0;background:#fff;opacity:0}
    .cap{position:absolute;left:5%;right:5%;top:27%;text-align:center;color:#fff;font-weight:700;font-size:31px;line-height:1.35;opacity:0;
      -webkit-text-stroke:5px #000;paint-order:stroke fill;text-shadow:0 4px 14px rgba(0,0,0,.6)}
    .cap y{color:#ffd23f}.cap r{color:#ff4d4d}
    .hook{top:22%;font-size:38px}.hook2{top:36%;font-size:34px}.big{font-size:64px;top:30%}
    .rew{top:44%;font-size:90px;-webkit-text-stroke:0;text-shadow:0 0 24px rgba(0,0,0,.8)}
    #out{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;opacity:0;background:rgba(4,10,20,.72);backdrop-filter:blur(6px)}
    #out img{width:74%;filter:drop-shadow(0 10px 30px rgba(0,0,0,.7)) drop-shadow(0 0 26px rgba(227,185,90,.4))}
    #out .q{color:#fff;font-weight:700;font-size:27px;-webkit-text-stroke:4px #000;paint-order:stroke fill;text-align:center;padding:0 16px}
    #out .s{color:#d7e6f5;font-weight:500;font-size:16px}
    #out .l{direction:ltr;padding:10px 20px;border-radius:999px;background:linear-gradient(180deg,#f1cf6e,#c9952d);color:#1a1205;font-weight:700;font-size:22px;box-shadow:0 8px 24px rgba(0,0,0,.5)}
    #out .b{color:#ffd23f;font-weight:700;font-size:19px;-webkit-text-stroke:3px #000;paint-order:stroke fill}
    #hud2{position:absolute;left:50%;top:6%;transform:translateX(-50%);display:flex;gap:10px;opacity:0;direction:ltr}#hud2 span{padding:6px 14px;border-radius:14px;background:rgba(6,12,22,.78);border:1.5px solid rgba(241,207,110,.7);color:#ffe7a6;font-weight:700;font-size:24px;font-variant-numeric:tabular-nums;box-shadow:0 6px 18px rgba(0,0,0,.5)}
    .pop{top:42%;font-size:30px}
    #brand{position:absolute;left:10px;bottom:12px;width:74px;opacity:.85;filter:drop-shadow(0 2px 6px rgba(0,0,0,.8))}
  </style></head><body><img id="bg"><div id="vig"></div><div id="red"></div><div id="scan"></div>
    ${C.map((c,i)=>`<div class="cap ${c[3]||''}" id="c${i}">${c[2]}</div>`).join('')}<img id="brand" src="${LOGO}">
    <div id="out"><img src="${LOGO}"><div class="q">${CTA}</div><div class="s">العبها مجاناً من المتصفح · بدون تحميل</div><div class="l">saadsd151.github.io/sijal</div><div class="b">🔗 الرابط في البايو</div></div><div id="hud2"><span id="tmr">⏱️ 0:00</span><span id="pct">🗺️ 0%</span></div><div id="fl"></div></body></html>`);await pg.goto('file://'+page);
  await pg.waitForTimeout(1500);await pg.evaluate(()=>document.fonts.ready);
  for(let i=0;i<frames.length;i++){
    const F=frames[i],t=i/FPS,src='file://'+path.join(RAW,'f',String(F.s).padStart(5,'0')+'.jpg');
    await pg.evaluate(async([src,t,F,C,HITS,outro,STORY,H,ser,T0hold])=>{
      if(STORY==='speed'){const h=document.getElementById('hud2');h.style.opacity=t>=.2&&t<outro?1:0;if(ser){document.getElementById('tmr').textContent='⏱️ '+Math.floor(ser[0]/60)+':'+String(Math.floor(ser[0]%60)).padStart(2,'0');document.getElementById('pct').textContent='🗺️ '+Math.round(ser[1]*100)+'%';}}
      const bg=document.getElementById('bg');if(bg.dataset.s!==src){bg.src=src;bg.dataset.s=src;await bg.decode().catch(()=>{});}
      // flashes, punch-in and shake on the big moments
      let fl=0,sc=1,sx=0,sy=0;for(const[h,amt,shk]of HITS){const d=t-h;if(d>=0&&d<.45)fl=Math.max(fl,amt*(1-d/.45));if(d>=0&&d<.7){const k=1-d/.7;sc=Math.max(sc,1+.07*k*amt);sx+=Math.sin(t*93)*shk*k;sy+=Math.cos(t*71)*shk*k;}}
      if(F.fx==='rew'){sc=1.04;}
      bg.style.transform=`translate(${sx}px,${sy}px) scale(${sc})`;bg.style.filter=F.fx==='rew'?'saturate(.4) contrast(1.15) blur(.6px)':F.fx==='out'?'blur(3px) saturate(.7)':'none';
      document.getElementById('fl').style.opacity=fl;document.getElementById('scan').style.opacity=F.fx==='rew'?1:0;
      document.getElementById('red').style.opacity=(STORY==='revenge'&&t<2.1)||(STORY==='swarm'&&t<T0hold)?.55+.45*Math.sin(t*9):0;
      C.forEach((c,j)=>{const e=document.getElementById('c'+j),on=t>=c[0]&&t<c[1];if(!on){e.style.opacity=0;return;}
        const a=t-c[0],o=Math.min(1,a/.12,(c[1]-t)/.12),pop=a<.1?.7+3*a:a<.2?1.08-(a-.1)*.8:1;e.style.opacity=o;e.style.transform=`scale(${pop})`;});
      const ou=Math.max(0,Math.min(1,(t-outro)/.35));const o=document.getElementById('out');o.style.opacity=ou;
      o.querySelectorAll('.q,.s,.l,.b').forEach((e,k)=>{const v=Math.max(0,Math.min(1,(t-outro-.25-k*.22)/.25));e.style.opacity=v;e.style.transform=`translateY(${(1-v)*10}px)`;});
      document.getElementById('brand').style.opacity=t<outro?.85:0;
    },[src,t,F,C,HITS,outro,STORY,H,SER?(SER[F.s]||SER.slice(0,F.s+1).filter(Boolean).pop()||null):null,T0hold]);
    await pg.screenshot({path:path.join(OUT,'f',String(i).padStart(5,'0')+'.jpg'),type:'jpeg',quality:92});
    if(i%90===0)process.stdout.write((i/FPS).toFixed(0)+'s ');
  }
  // moments for the music, in seconds of the finished clip
  const mk={story:STORY,len:LEN,hook:H,outro,main:T(0)};for(const k of Object.keys(M))if(typeof M[k]==='number'&&k!=='total')mk[k]=T(M[k]);for(const k in X)mk[k]=T(X[k]);
  fs.writeFileSync(path.join(OUT,'marks.json'),JSON.stringify(mk));console.log('\n'+STORY,JSON.stringify(mk));
  await b.close();
})();
