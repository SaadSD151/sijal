// Records the 15 s ad and the 30 s explainer from the real game:
//   node marketing/promo2.js <ad|ex> <vertical|horizontal> <outdir>
// A paused fake clock moves the game frame by frame, so every frame is captured at an even 30 fps.
// Writes frames to <outdir>/f and the moments worth a sound to <outdir>/marks.json.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const KIND=process.argv[2]||'ad',MODE=process.argv[3]||'vertical',OUT=path.resolve(process.argv[4]||'promo2-out'),FPS=30;
const V=MODE==='vertical',AD=KIND==='ad',LEN=AD?15:30;
const LOGO='data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'sijal-logo.png')).toString('base64');
// [start, end, caption]
const CAPS=AD?[
  [1.5,4.2,'ابدأ بمدينة…'],
  [4.2,7,'واكتسح بالدبابات'],
  [7,10.4,'دمّر بالقنابل'],
  [10.4,12,'سيطر على الخريطة']
]:[
  [2.8,7.6,'اختر مكان عاصمتك… وتوسّع'],
  [7.8,12.4,'ابنِ مدن وحصون ومعسكرات دبابات'],
  [12.6,17.6,'هاجم بالجيش والدبابات… وخذ مدنهم'],
  [17.8,22.6,'صواريخ وقنابل ذرّية… وقبة تصدّها'],
  [22.8,26.2,'تحالف أو سالم… أو اغدر']
];
// scene timings
const T=AD?{start:.2,expand:[1.4,4.2],tanks:3.6,city:4.2,cityEnd:7,msl1:7.2,msl2:8.3,mslEnd:10.4,kill:10.5,outro:12}
          :{start:.2,expand:[2.4,7.6],build:7.6,tanks:12.4,city:13.6,cityEnd:17.6,msl1:18.2,msl2:19.9,mslEnd:22.6,dip:22.6,dipCard:23.4,online:99,outro:26.4};
(async()=>{
  fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(path.join(OUT,'f'),{recursive:true});
  const b=await chromium.launch();
  const ctx=await b.newContext(V?{viewport:{width:360,height:640},deviceScaleFactor:3,isMobile:true,hasTouch:true}:{viewport:{width:1280,height:720},deviceScaleFactor:1.5});
  const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.clock.install({time:new Date('2026-11-22T20:00:00')});await pg.clock.pauseAt(new Date('2026-11-22T20:00:01'));
  await pg.addInitScript(()=>{try{localStorage.setItem('sijal.v1',JSON.stringify({seen:'9.9',sound:false,music:false,games:9,gfx:2,skin:{pat:'',bld:'gold'},passT:20}));}catch(e){}});
  await pg.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));
  await pg.waitForTimeout(2500);await pg.clock.runFor(500);
  await pg.evaluate(([logo,V,AD])=>{
    const S=__sijal;window.__ZM=V?1:2.2;window.__CT={};S.act('setBack');S.R.q=2;
    const st=document.createElement('style');st.textContent=`
      #pr{position:fixed;inset:0;pointer-events:none;z-index:60;font-family:'IBM Plex Sans Arabic',sans-serif}
      #prCap{position:absolute;left:6%;right:6%;top:${V?'15%':'auto'};bottom:${V?'auto':'20%'};text-align:center;opacity:0}
      #prCap span{display:inline-block;background:linear-gradient(180deg,rgba(10,22,38,.9),rgba(5,12,22,.9));border:2px solid #e3b95a;border-radius:16px;padding:${V?'10px 18px':'12px 28px'};color:#fff;font-weight:800;font-size:${V?(AD?'30px':'24px'):(AD?'42px':'34px')};line-height:1.45;box-shadow:0 12px 34px rgba(0,0,0,.55),0 0 22px rgba(227,185,90,.25)}
      #prIn,#prOut{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${V?'16px':'14px'};text-align:center;opacity:0}
      #prIn{background:radial-gradient(ellipse at center,rgba(5,12,22,.25),rgba(5,12,22,.92))}
      #prOut{background:radial-gradient(ellipse at 50% 40%,#1d3d61,#040b15 75%)}
      #pr img{width:${V?'80%':'44%'};filter:drop-shadow(0 12px 34px rgba(0,0,0,.65)) drop-shadow(0 0 30px rgba(227,185,90,.35))}
      #pr .q{color:#f4e3b0;font-weight:800;font-size:${V?'24px':'34px'};text-shadow:0 2px 10px #000}
      #pr .m{color:#fff;font-weight:800;font-size:${V?'28px':'40px'};text-shadow:0 2px 12px #000}
      #pr .s{color:#cfe0f2;font-weight:700;font-size:${V?'17px':'24px'}}
      #pr .l{margin-top:4px;padding:${V?'9px 18px':'10px 26px'};border-radius:999px;background:linear-gradient(180deg,#f1cf6e,#c9952d);color:#1a1205;font-weight:900;font-size:${V?'23px':'32px'};direction:ltr;box-shadow:0 8px 24px rgba(0,0,0,.5)}
      #prVig{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 55%,rgba(0,0,0,.45) 100%)}
      #prWm{position:absolute;left:50%;transform:translateX(-50%);bottom:${V?(AD?'4%':'13.5%'):(AD?'4%':'12%')};direction:ltr;color:#f4e3b0;font-weight:800;font-size:${V?'14px':'20px'};padding:5px 14px;border-radius:999px;background:rgba(5,12,22,.6);border:1px solid rgba(227,185,90,.55);opacity:0}
      #prFlash{position:absolute;inset:0;background:#fff;opacity:0}
      #amode,#feed,#hint,#fpick,.anx,#threat,#mini,#lb{display:none!important}
      ${AD?'#hud{display:none!important}':''}`;
    document.head.appendChild(st);
    const d=document.createElement('div');d.id='pr';d.innerHTML=`<div id="prVig"></div><div id="prFlash"></div><div id="prWm">sijalwar.com</div><div id="prCap"><span></span></div>
      <div id="prIn"><img src="${logo}" alt=""><div class="q">${AD?'الحرب بدأت…':'لعبة حرب استراتيجية… سعودية 🇸🇦'}</div></div>
      <div id="prOut"><img src="${logo}" alt=""><div class="m">${AD?'العب الحين مجاناً':'حرب المدن بانتظارك'}</div><div class="s">${AD?'جوال وكمبيوتر · بدون تحميل · أونلاين مع أخوياك':'أونلاين مع أخوياك لين 32 لاعب · جوال وكمبيوتر · بدون تحميل'}</div><div class="l">sijalwar.com</div></div>`;
    document.body.appendChild(d);
    for(const e of document.querySelectorAll('#menu > *'))e.style.visibility='hidden';
  },[LOGO,V,AD]);
  const marks={};const ev=(k,t)=>{if(marks[k]==null)marks[k]=t;};const at=(f,s)=>f===Math.round(s*FPS);
  let st={};
  for(let f=0;f<FPS*LEN;f++){
    const t=f/FPS;
    // ── start: a quick battle hidden behind the intro, capital placed near cities, missiles from bots switched off ──
    if(at(f,T.start)){await pg.evaluate(()=>{const S=__sijal;S.UI.prof.size=1;S.UI.prof.diff=1;S.UI.prof.type='continents';S.act('goQ');});}
    if(at(f,T.start+.35)){await pg.evaluate(()=>{const S=__sijal,g=S.G;S.UI.speed=3;g.grace=1e9;
        let best=-1,bs=-1;for(let k=0;k<5000;k++){const i=(Math.random()*g.N)|0,x=i%g.W,y=(i/g.W)|0;if(g.M.ter[i]!==2||g.owner[i]||g.M.coastD[i]<3||g.M.coastD[i]>10)continue;if(!g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>220))continue;
          let c=0;for(const s of g.structs)if(!s.dead&&s.type==='city'&&(s.x-x)**2+(s.y-y)**2<1600)c++;const sc=c+(Math.abs(x-g.W/2)<g.W*.3?3:0)+(Math.abs(y-g.H/2)<g.H*.3?2:0);if(sc>bs){bs=sc;best=i;}}
        if(best>=0)S.tap(best,0,0);let me=g.nations[g.human];for(let k=0;k<20000&&!(me&&me.cap);k++){const i=(Math.random()*g.N)|0;if(g.M.ter[i]<2||g.M.ter[i]===6||g.owner[i]||g.structAt[i])continue;S.tap(i,0,0);me=g.nations[g.human];}if(!me||!me.cap)throw new Error('spawn failed');for(const n of g.nations)if(n&&!n.human){n.ai.nextMsl=1e9;n.ultAt=1e9;}__CT.x=me.cap.x;__CT.y=me.cap.y;__CT.z=window.__ZM*4.5;__CT.snap=1;});ev('spawn',T.expand[0]);}
    // ── expansion: push out on every border, camera follows and slowly zooms out ──
    if(t>=T.expand[0]&&t<T.expand[1]&&f%8===0){await pg.evaluate(()=>{const S=__sijal,g=S.G,me=g.nations[g.human];if(!me||!me.alive)return;me.troops=Math.max(me.troops,90000);
        let tt=-1,bd=1e9;for(let i=0;i<g.N;i+=3){if(g.M.ter[i]<2||g.owner[i])continue;const d=(i%g.W-me.cx)**2+(((i/g.W)|0)-me.cy)**2;if(d<bd){bd=d;tt=i;}}
        if(tt>=0)S.fn.launchAttack(g,me.id,0,.5,-1,-1);__CT.x=me.cx;__CT.y=me.cy;__CT.z=window.__ZM*Math.max(1.9,Math.min(3.4,70/Math.sqrt(Math.max(me.tiles,300))*2.3));});}
    if(t>=T.expand[0]&&t<T.expand[1])await pg.evaluate(()=>__sijal.run(3));
    // ── explainer: build a city, a fort, a port, a shield and a tank camp near the capital ──
    if(!AD&&at(f,T.build)){await pg.evaluate(()=>{const S=__sijal,g=S.G,me=g.nations[g.human];me.era=4;me.gold=3e5;
        const own=[];for(let i=0;i<g.N;i+=2)if(g.owner[i]===me.id)own.push(i);const near=i=>(i%g.W-me.cap.x)**2+(((i/g.W)|0)-me.cap.y)**2;own.sort((a,b)=>near(a)-near(b));
        const put=ty=>{for(const i of own){if(near(i)<36)continue;if(!S.cb(g,me,ty,i)){S.fn.build(g,me,ty,i);return true;}}return false;};
        for(const ty of['city','fort','camp','shield','factory','port','silo'])put(ty);
        __CT.x=me.cap.x;__CT.y=me.cap.y;__CT.z=window.__ZM*3.6;});ev('build',t);}
    if(!AD&&t>T.build&&t<T.tanks&&f%15===0)await pg.evaluate(()=>{const S=__sijal,g=S.G,me=g.nations[g.human];for(const s of g.structs)if(s.owner===me.id&&s.build&&Math.random()<.5)s.build=g.tick;S.run(1);});
    // ── tanks: a camp near the next target, five tanks ready, then the attack that sends them to the front ──
    if(at(f,T.tanks)){st.tg=await pg.evaluate(()=>{const S=__sijal,g=S.G,me=g.nations[g.human];me.era=4;me.gold=Math.max(me.gold,3e5);for(const s of g.structs)if(s.owner===me.id)s.build=0;
        const K=g.nations.length,cs=g.structs.filter(s=>!s.dead&&s.type==='city'&&s.owner&&s.owner!==me.id&&!g.nations[s.owner].minor&&!me.ally[s.owner]).sort((a,b)=>((a.x-me.cx)**2+(a.y-me.cy)**2)-((b.x-me.cx)**2+(b.y-me.cy)**2));
        const c=cs.find(s=>g.nb[me.id*K+s.owner]>3&&!s.capital)||cs.find(s=>g.nb[me.id*K+s.owner]>3)||cs[0];if(!c)return null;g.nations[c.owner].troops=Math.max(g.nations[c.owner].troops,1.2e5);
        let camp=g.structs.find(s=>!s.dead&&s.owner===me.id&&s.type==='camp');
        if(!camp){let bi=-1,bd=1e18;for(let i=0;i<g.N;i++){if(g.owner[i]!==me.id||S.cb(g,me,'camp',i))continue;const d=(i%g.W-c.x)**2+(((i/g.W)|0)-c.y)**2;if(d<bd){bd=d;bi=i;}}if(bi>=0){S.fn.build(g,me,'camp',bi);camp=g.structs[g.structAt[bi]-1];}}
        if(camp){camp.build=0;camp.tkOwner=me.id;camp.tk=5;camp.tkAt=g.tick+1e6;for(let k=0;k<5;k++)g.tanks.push({id:++g.aid,a:me.id,c:camp,x:camp.x+.5+(k-2)*.9,y:camp.y+.5,vx:1,vy:0,k:0,path:null,pi:0,re:g.tick,fire:0,hp:100});}
        __CT.x=camp?camp.x:c.x;__CT.y=camp?camp.y:c.y;__CT.z=window.__ZM*9;return{c:c.i,cx:c.x,cy:c.y,o:c.owner};});}
    if(at(f,T.city)&&st.tg){await pg.evaluate(tg=>{const S=__sijal,g=S.G,me=g.nations[g.human];me.troops=Math.max(me.troops,2.2e5);S.fn.launchAttack(g,me.id,tg.o,.35,tg.cx,tg.cy,true);__CT.z=window.__ZM*7.5;},st.tg);ev('attack',t);}
    if(st.tg&&t>T.city&&t<T.cityEnd){const r=await pg.evaluate(tg=>{const S=__sijal,g=S.G,me=g.nations[g.human];S.run(2);const si=g.structAt[tg.c],s=si?g.structs[si-1]:null;
        if(s&&s.owner!==me.id&&!g.attacks.some(k=>k.a===me.id&&k.d===s.owner&&!k.cancel)){me.troops=Math.max(me.troops,2.2e5);S.fn.launchAttack(g,me.id,s.owner,.35,s.x,s.y,true);}
        const T=g.tanks.filter(x=>x.a===me.id);let ax=tg.cx,ay=tg.cy;if(T.length){ax=0;ay=0;for(const x of T){ax+=x.x;ay+=x.y;}ax=ax/T.length*.7+tg.cx*.3;ay=ay/T.length*.7+tg.cy*.3;}__CT.x=ax;__CT.y=ay;return s&&s.owner===me.id;},st.tg);if(r)ev('cityFall',t);}
    // ── missiles: a rocket at a city behind a shield (interceptor), then a doomsday bomb on a far capital ──
    if(at(f,T.msl1-.2)){st.m=await pg.evaluate(()=>{const S=__sijal,g=S.G,me=g.nations[g.human];me.era=4;me.gold=Math.max(me.gold,5e5);
        let silo=g.structs.find(s=>!s.dead&&s.owner===me.id&&s.type==='silo');if(!silo){for(let i=0;i<g.N;i++)if(g.owner[i]===me.id&&!S.cb(g,me,'silo',i)){S.fn.build(g,me,'silo',i);silo=g.structs[g.structAt[i]-1];break;}}if(silo){silo.build=0;silo.cd=0;}
        const foes=g.structs.filter(s=>!s.dead&&s.type==='city'&&s.owner&&s.owner!==me.id&&!g.nations[s.owner].minor&&!me.ally[s.owner]).sort((a,b)=>((a.x-me.cx)**2+(a.y-me.cy)**2)-((b.x-me.cx)**2+(b.y-me.cy)**2));
        const mid=foes.filter(s=>s.y>g.H*.32&&s.y<g.H*.85&&s.x>g.W*.12&&s.x<g.W*.88),F=mid.length>=2?mid:foes;const r=F[0],n=F.find(s=>s!==r&&s.capital&&((s.x-me.cx)**2+(s.y-me.cy)**2)>600)||F.find(s=>s!==r&&((s.x-r.x)**2+(s.y-r.y)**2)>300)||F[Math.min(2,F.length-1)];
        // the first target gets a shield dome so the interceptor shows
        if(r){const O=g.nations[r.owner];O.era=4;O.gold=1e6;let put=false;for(let dy=-4;dy<=4&&!put;dy++)for(let dx=-4;dx<=4&&!put;dx++){const i=(r.y+dy)*g.W+r.x+dx+3;if(!S.cb(g,O,'shield',i)){S.fn.build(g,O,'shield',i);const sh=g.structs[g.structAt[i]-1];sh.build=0;sh.level=2;put=true;}}}
        return r&&n?{r:r.i,rx:r.x,ry:r.y,n:n.i,nx:n.x,ny:n.y}:null;});}
    if(st.m&&at(f,T.msl1)){await pg.evaluate(m=>{const S=__sijal,g=S.G,me=g.nations[g.human];for(const s of g.structs)if(s.type==='silo'&&s.owner===me.id){s.build=0;s.cd=0;}S.fn.launchMissile(g,me.id,'rocket',m.r);__CT.x=(m.rx*2+me.cx)/3;__CT.y=(m.ry*2+me.cy)/3;__CT.z=window.__ZM*3.2;},st.m);ev('launch1',t);}
    if(st.m&&at(f,T.msl2)){await pg.evaluate(m=>{const S=__sijal,g=S.G,me=g.nations[g.human];for(const s of g.structs)if(s.type==='silo'&&s.owner===me.id)s.cd=0;me.gold=Math.max(me.gold,1e5);S.fn.launchMissile(g,me.id,'doom',m.n);__CT.x=(m.nx+me.cx)/2;__CT.y=(m.ny+me.cy)/2;__CT.z=window.__ZM*2.3;},st.m);ev('launch2',t);}
    if(st.m&&t>T.msl1&&t<T.mslEnd&&f%2===0){const fx=await pg.evaluate(()=>__sijal.R.fx.filter(f=>f.type==='boom'||f.type==='airburst').map(f=>f.type+':'+f.dur));for(const s of fx){if(s.startsWith('airburst'))ev('intercept',t);else if(+s.split(':')[1]>=3000)ev('doom',t);else ev('boom',t);}
      if(marks.launch2!=null&&t>marks.launch2+.6)await pg.evaluate(m=>{const S=__sijal;__CT.x=m.nx;__CT.y=m.ny;__CT.z=window.__ZM*3.2;},st.m);}
    if(t>T.msl1&&t<T.mslEnd)await pg.evaluate(()=>__sijal.run(1));
    // ── ad: wipe out a small realm for the crossed swords ──
    if(AD&&at(f,T.kill)){await pg.evaluate(()=>{const S=__sijal,g=S.G,me=g.nations[g.human],K=g.nations.length;
        let v=null;for(const n of g.nations)if(n&&n.alive&&n.id!==me.id&&g.nb[me.id*K+n.id]>0&&(!v||n.tiles<v.tiles))v=n;
        if(v){me.troops=Math.max(me.troops,3e6);v.troops=Math.min(v.troops,4000);S.fn.launchAttack(g,me.id,v.id,.8,-1,-1);__CT.x=v.cx;__CT.y=v.cy;__CT.z=window.__ZM*3.4;window.__v=v.id;}});}
    if(AD&&t>T.kill&&t<T.outro){const dead=await pg.evaluate(()=>{const S=__sijal,g=S.G;S.run(2);const v=g.nations[window.__v];if(v&&v.alive){__CT.x=v.cx;__CT.y=v.cy;}return !v||!v.alive;});if(dead)ev('kill',t);}
    // ── explainer: alliance offer accepted, then the realm card ──
    if(!AD&&at(f,T.dip)){st.p=await pg.evaluate(()=>{const S=__sijal,g=S.G,me=g.nations[g.human];const P=g.nations.filter(n=>n&&n.alive&&!n.human&&!n.minor&&!me.ally[n.id]).sort((a,b)=>((a.cx-me.cx)**2+(a.cy-me.cy)**2)-((b.cx-me.cx)**2+(b.cy-me.cy)**2))[0];
        P.att[me.id]=70;g.proposals.push({from:P.id,to:me.id,until:g.tick+250});g.ev.push({t:'proposal',a:P.id,b:me.id,tick:g.tick});__CT.x=P.cx;__CT.y=P.cy;__CT.z=window.__ZM*2.8;return P.id;});ev('ally',t);}
    if(!AD&&at(f,T.dip+.5))await pg.evaluate(id=>{const S=__sijal;S.act('acc:'+id);},st.p);
    if(!AD&&at(f,T.dipCard))await pg.evaluate(id=>{const S=__sijal;S.act('nat:'+id);},st.p);
    if(!AD&&at(f,T.dipCard+1.3))await pg.evaluate(()=>{const S=__sijal;S.act('emoOpen:'+S.UI.sel);});
    if(!AD&&at(f,T.dipCard+2))await pg.evaluate(()=>{const S=__sijal;S.act('emoS:22');S.act('closeCard');});
    // ── explainer: online rooms ──
    if(!AD&&at(f,T.online)){await pg.evaluate(()=>{const S=__sijal,L=S.LOBBY;S.UI.paused=true;for(const d of document.querySelectorAll('.ts'))d.remove();
        L.on=true;L.ok=true;L.list=[{code:'A1',name:'شلة الرياض',n:12,m:32,type:'continents',size:1,diff:2},{code:'B2',name:'حرب الشباب',n:24,m:32,type:'islands',size:2,diff:3},{code:'C3',name:'تحدي الليل',n:6,m:16,type:'pangaea',size:0,diff:1},{code:'D4',name:'أبطال جدة',n:9,m:12,type:'highlands',size:1,diff:2}];
        S.act('online');const ms=['24ms','38ms','19ms','52ms'];document.querySelectorAll('#rooms .ping').forEach((e,i)=>{e.textContent=ms[i];e.className='ping good';});
        const c=document.querySelector('#inCode');if(c)c.parentElement.parentElement.style.display='none';});ev('online',t);}
    if(at(f,T.outro))ev('outro',t);
    if(!AD&&t>=T.dip&&t<T.online)await pg.evaluate(()=>__sijal.run(1));
    // ── overlay ──
    const cap=CAPS.find(c=>t>=c[0]&&t<c[1]);
    await pg.evaluate(([t,cap,AD,outro,intro,mk,dip])=>{
      const S=__sijal;S.UI.threats=[];for(const d of document.querySelectorAll('.ts'))if(!/يبي يتحالف|تحالف بين|المس الشاشة/.test(d.textContent)||/المس الشاشة/.test(d.textContent))if(/المس الشاشة/.test(d.textContent))d.remove();
      const fade=(a,b,c,d)=>Math.max(0,Math.min(1,(t-a)/(b-a),(d-t)/(d-c)));
      const ci=document.querySelector('#prCap');if(cap){ci.querySelector('span').textContent=cap[2];const o=fade(cap[0],cap[0]+.22,cap[1]-.22,cap[1]);ci.style.opacity=o;const pop=Math.min(1,(t-cap[0])/.22);ci.style.transform=`translateY(${(1-o)*12}px) scale(${.92+.08*pop})`;}else ci.style.opacity=0;
      const pi=document.querySelector('#prIn'),pin=fade(0,.25,intro-.35,intro);pi.style.opacity=pin;const im=pi.querySelector('img');const k=Math.min(1,t/.45);im.style.transform=`scale(${1.5-.5*(1-(1-k)**3)})`;
      pi.querySelector('.q').style.opacity=Math.max(0,Math.min(1,(t-.6)/.25));
      const po=document.querySelector('#prOut'),out=Math.max(0,Math.min(1,(t-outro)/.45));po.style.opacity=out;po.querySelector('img').style.transform=`scale(${1.15-.15*Math.min(1,(t-outro)/.7)})`;
      po.querySelectorAll('.m,.s,.l').forEach((e,i)=>{e.style.opacity=Math.max(0,Math.min(1,(t-outro-.45-i*.3)/.3));});
      // white flash on the big moments
      let fl=0;for(const m of mk)if(m!=null&&t>=m&&t<m+.35)fl=Math.max(fl,.55*(1-(t-m)/.35));document.querySelector('#prFlash').style.opacity=fl;
      // camera: critically damped spring toward the target, zooming out while it travels far
      const C=window.__CT,cam=S.cam;if(C.x!=null){if(C.snap||!window.__VC){window.__VC={x:C.x,y:C.y,lz:Math.log(C.z),vx:0,vy:0,vz:0};C.snap=0;}
        const V=window.__VC,w=AD?3.4:2.4,dt=1/30,dist=Math.hypot(C.x-V.x,C.y-V.y),lz=Math.log(C.z)-Math.log(1+dist/45);
        V.vx+=(w*w*(C.x-V.x)-2*w*V.vx)*dt;V.vy+=(w*w*(C.y-V.y)-2*w*V.vy)*dt;V.vz+=(w*w*(lz-V.lz)-2*w*V.vz)*dt;V.x+=V.vx*dt;V.y+=V.vy*dt;V.lz+=V.vz*dt;
        const g=S.G,vw=innerWidth,vh=innerHeight,z=Math.max(Math.exp(V.lz),Math.max(vw/g.W,vh/g.H)*1.04),hx=vw/2/z,hy=vh/2/z,cl=(v,a,b)=>a>b?(a+b)/2:Math.max(a,Math.min(b,v));
        cam.tz=cam.z=z;cam.tx=cam.x=cl(V.x,hx,g.W-hx);cam.ty=cam.y=cl(V.y,hy,g.H-hy);}
      const keepTs=!AD&&t>=dip&&t<dip+3.4;if(!keepTs)for(const d of document.querySelectorAll('.ts'))d.remove();
      document.querySelector('#prWm').style.opacity=AD?Math.max(0,Math.min(1,(t-intro)/.4))*(t<outro?1:0)*.9:0;
      if(t>=outro){const n=document.querySelector('#net');if(n)n.style.visibility='hidden';}
    },[t,cap||null,AD,T.outro,AD?1.5:2.5,[marks.doom,marks.kill,marks.cityFall],T.dip||0]);
    await pg.clock.runFor(1000/FPS);
    await pg.screenshot({path:path.join(OUT,'f',String(f).padStart(5,'0')+'.jpg'),type:'jpeg',quality:90});
    if(f%90===0)process.stdout.write(`${KIND}/${MODE} ${t.toFixed(1)}s `);
  }
  marks.end=await pg.evaluate(()=>{const g=__sijal.G,me=g.nations[g.human];return{alive:me.alive,tiles:me.tiles,tanks:g.tanks.filter(t=>t.a===me.id).length};});
  marks.kind=KIND;marks.len=LEN;
  fs.writeFileSync(path.join(OUT,'marks.json'),JSON.stringify(marks));
  console.log('\nmarks',JSON.stringify(marks),errs.length?'ERR '+errs.join('|'):'no errors');
  await b.close();
})();
