// Records the Sijal promo from the real game: node marketing/promo.js <vertical|horizontal> <outdir>
// A fake clock drives the game frame by frame, so every frame is captured at an even 30 fps.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const MODE=process.argv[2]||'vertical',OUT=path.resolve(process.argv[3]||'promo-out'),FPS=30,LEN=40;
const V=MODE==='vertical';
const LOGO='data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'sijal-logo.png')).toString('base64');
const CAPS=[ // [start, end, text] seconds
  [3.7,9,'تبدأ بعاصمة صغيرة… وتكبر لين تحكم العالم'],
  [9,14,'خذ المدينة… ويطيح إقليمها كله معها'],
  [14,22,'ابنِ وطوّر… لين القنبلة الذرّية وقنبلة الفناء'],
  [22,27,'تحالف، أهدِ ذهب، وأرسل جنود لحليفك'],
  [27,32,'وتحدَّ أخوياك أونلاين… لين ١٦ لاعب']];

(async()=>{
  fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(path.join(OUT,'f'),{recursive:true});
  const b=await chromium.launch();
  const ctx=await b.newContext(V?{viewport:{width:360,height:640},deviceScaleFactor:3,isMobile:true,hasTouch:true}:{viewport:{width:1280,height:720},deviceScaleFactor:1.5});
  const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  // install() alone keeps flowing in real time; pausing makes runFor() the only way time moves
  await pg.clock.install({time:new Date('2026-11-17T20:00:00')});await pg.clock.pauseAt(new Date('2026-11-17T20:00:01'));
  await pg.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));
  await pg.waitForTimeout(2500);await pg.clock.runFor(500);
  // overlay for captions, intro and outro, driven frame by frame (CSS animations would not follow the fake clock)
  await pg.evaluate(([logo,V])=>{
    const S=__sijal;S.act('setBack');S.UI.prof.sound=false;S.UI.prof.music=false;S.UI.prof.games=9;
    const st=document.createElement('style');st.textContent=`
      #pr{position:fixed;inset:0;pointer-events:none;z-index:50;font-family:'IBM Plex Sans Arabic',sans-serif}
      #prCap{position:absolute;left:6%;right:6%;top:${V?'17%':'auto'};bottom:${V?'auto':'24%'};text-align:center;opacity:0}
      #prCap span{display:inline-block;background:rgba(7,18,30,.82);border:2px solid #e3b95a;border-radius:14px;padding:${V?'10px 16px':'12px 26px'};color:#fff;font-weight:700;font-size:${V?'25px':'34px'};line-height:1.5;box-shadow:0 10px 30px rgba(0,0,0,.5)}
      #prIn,#prOut{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${V?'18px':'16px'};text-align:center;opacity:0}
      #prIn{background:radial-gradient(ellipse at center,rgba(5,12,22,.15),rgba(5,12,22,.82))}
      #prOut{background:radial-gradient(ellipse at 50% 40%,#1b3a5c,#050d18 75%)}
      #pr img{width:${V?'78%':'44%'};filter:drop-shadow(0 10px 30px rgba(0,0,0,.6))}
      #pr .q{color:#fff;font-weight:700;font-size:${V?'30px':'40px'};text-shadow:0 3px 12px #000;padding:0 6%}
      #pr .m{color:#f1e6cc;font-weight:600;font-size:${V?'21px':'26px'}}
      #pr .s{color:#9db0c2;font-size:${V?'17px':'20px'}}
      #pr .l{color:#1c1405;background:linear-gradient(#f4d584,#c9972f);border-radius:999px;padding:${V?'10px 22px':'12px 30px'};font-weight:700;font-size:${V?'21px':'26px'};direction:ltr}
      #banner,#hint,#tip,#amode,#atk,#toasts .ts:not(.prop){display:none!important}${V?' #feed,#lb{display:none!important}':''}`;
    document.head.appendChild(st);
    const d=document.createElement('div');d.id='pr';d.innerHTML=`<div id="prCap"><span></span></div>
      <div id="prIn"><img src="${logo}" alt=""><div class="q">تبي لعبة حرب… سعودية مية بالمية؟</div></div>
      <div id="prOut"><img src="${logo}" alt=""><div class="m">صُنعت في المملكة العربية السعودية</div><div class="s">مجانية · جوال وكمبيوتر · بدون تحميل</div><div class="l">saadsd151.github.io/sijal</div><div class="m">العب الحين</div></div>`;
    document.body.appendChild(d);
    for(const e of document.querySelectorAll('#menu > *'))e.style.visibility='hidden';
  },[LOGO,V]);
  const marks={};const ev=(k,t)=>{if(marks[k]==null)marks[k]=t;};
  const sm=(a,b,x)=>{x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x);};
  let state={};
  for(let f=0;f<FPS*LEN;f++){
    const t=f/FPS;
    // ── choreography ──
    if(f===Math.round(3.0*FPS)){await pg.evaluate(()=>{const S=__sijal;S.UI.prof.size=1;S.UI.prof.diff=1;S.act('quick');S.act('goQ');});}
    if(f===Math.round(3.4*FPS)){state=await pg.evaluate(()=>{const S=__sijal,g=S.G;S.UI.speed=3;g.grace=1e9;
        let best=-1,bs=-1;for(let k=0;k<4000;k++){const i=(Math.random()*g.N)|0,x=i%g.W,y=(i/g.W)|0;if(g.M.ter[i]!==2||g.owner[i]||g.M.coastD[i]<3||g.M.coastD[i]>9)continue;if(!g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>200))continue;
          let c=0;for(const s of g.structs)if(!s.dead&&s.type==='city'&&(s.x-x)**2+(s.y-y)**2<1600)c++;const sc=c+(Math.abs(x-g.W/2)<g.W*.3?3:0);if(sc>bs){bs=sc;best=i;}}
        S.tap(best,0,0);for(const n of g.nations)if(n&&!n.human){n.ai.nextMsl=1e9;n.ultAt=1e9;}return{spawn:best};});ev('spawn',t);}
    if(t>=3.6&&t<9&&f%9===0){await pg.evaluate(()=>{const S=__sijal,g=S.G,me=g.nations[g.human];if(!me||!me.alive)return;me.troops=Math.max(me.troops,60000);S.UI.prof.amode='all';
        let tt=-1,bd=1e9;for(let i=0;i<g.N;i+=3){if(g.M.ter[i]<2||g.owner[i])continue;const d=(i%g.W-me.cx)**2+(((i/g.W)|0)-me.cy)**2;if(d<bd){bd=d;tt=i;}}S.UI.ratio=.5;if(tt>=0)S.tap(tt,0,0);S.act('closeCard');
        S.cam.tx=me.cx;S.cam.ty=me.cy;S.cam.tz=Math.max(1.8,Math.min(3.2,70/Math.sqrt(Math.max(me.tiles,300))*2.2));});}
    if(f===Math.round(9*FPS)){state.city=await pg.evaluate(()=>{const S=__sijal,g=S.G,me=g.nations[g.human];S.UI.prof.amode='pt';
        const cs=g.structs.filter(s=>!s.dead&&s.type==='city'&&s.owner!==me.id&&s.owner&&!g.nations[s.owner].ally[me.id]).sort((a,b)=>((a.x-me.cx)**2+(a.y-me.cy)**2)-((b.x-me.cx)**2+(b.y-me.cy)**2));
        const K=g.nations.length,c=cs.find(s=>!g.nations[s.owner].minor&&g.nb[me.id*K+s.owner]>3)||cs.find(s=>!g.nations[s.owner].minor)||cs[0];if(!c)return -1;me.troops=Math.max(me.troops,3e5);
        // aim at an enemy tile on the way to the city, so the spearhead drives there
        S.fn.launchAttack(g,me.id,c.owner,.6,c.x,c.y,true);S.cam.tx=c.x;S.cam.ty=c.y;S.cam.tz=3;return c.i;});}
    if(t>9&&t<14&&f%10===0){const r=await pg.evaluate(ci=>{const S=__sijal,g=S.G,me=g.nations[g.human];const si=g.structAt[ci];const s=si?g.structs[si-1]:null;
        if(s&&s.owner!==me.id&&!g.attacks.some(k=>k.a===me.id&&k.d===s.owner&&!k.cancel)){me.troops=Math.max(me.troops,3e5);S.fn.launchAttack(g,me.id,s.owner,.6,s.x,s.y,true);}
        if(s){S.cam.tx=s.x;S.cam.ty=s.y;}return s&&s.owner===me.id;},state.city);if(r)ev('cityFall',t);}
    if(f===Math.round(14*FPS)){state.w=await pg.evaluate(()=>{const S=__sijal,g=S.G,me=g.nations[g.human];me.era=4;me.gold=2e5;
        const own=[];for(let i=0;i<g.N;i+=2)if(g.owner[i]===me.id)own.push(i);const near=i=>(i%g.W-me.cap.x)**2+(((i/g.W)|0)-me.cap.y)**2;own.sort((a,b)=>near(a)-near(b));
        const put=ty=>{for(const i of own){if(near(i)<40)continue;if(!S.cb(g,me,ty,i)){S.fn.build(g,me,ty,i);return true;}}return false;};
        put('fort');put('silo');put('shield');put('coast');put('port');
        S.cam.tx=me.cap.x;S.cam.ty=me.cap.y;S.cam.tz=4;return 1;});}
    if(f===Math.round(15.6*FPS)){state.tg=await pg.evaluate(()=>{const S=__sijal,g=S.G,me=g.nations[g.human];for(const s of g.structs)if(s.owner===me.id&&s.build)s.build=1;
        const foes=g.structs.filter(s=>!s.dead&&s.type==='city'&&s.owner&&s.owner!==me.id&&!g.nations[s.owner].minor).sort((a,b)=>((a.x-me.cx)**2+(a.y-me.cy)**2)-((b.x-me.cx)**2+(b.y-me.cy)**2));
        const r=foes[0],n=foes.find(s=>s.capital&&((s.x-me.cx)**2+(s.y-me.cy)**2)>400)||foes[Math.min(2,foes.length-1)];return{r:r&&r.i,rx:r&&r.x,ry:r&&r.y,n:n&&n.i,nx:n&&n.x,ny:n&&n.y};});}
    if(f===Math.round(16*FPS)&&state.tg&&state.tg.r!=null){await pg.evaluate(tg=>{const S=__sijal,g=S.G,me=g.nations[g.human];for(const s of g.structs)if(s.type==='silo'&&s.owner===me.id){s.build=0;s.cd=0;}
        S.fn.launchMissile(g,me.id,'rocket',tg.r);S.cam.tx=(tg.rx+me.cx)/2;S.cam.ty=(tg.ry+me.cy)/2;S.cam.tz=3;},state.tg);ev('launch1',t);}
    if(f===Math.round(18*FPS)&&state.tg&&state.tg.n!=null){await pg.evaluate(tg=>{const S=__sijal,g=S.G,me=g.nations[g.human];for(const s of g.structs)if(s.type==='silo'&&s.owner===me.id)s.cd=0;
        me.gold=Math.max(me.gold,1e5);S.fn.launchMissile(g,me.id,'doom',tg.n);S.cam.tx=(tg.nx+me.cx)/2;S.cam.ty=(tg.ny+me.cy)/2;S.cam.tz=2.4;},state.tg);ev('launch2',t);}
    if(t>16&&t<22&&f%3===0){const bm=await pg.evaluate(()=>__sijal.R.fx.filter(f=>f.type==='boom').map(f=>f.dur));for(const d of bm){if(d>=3000)ev('doom',t);else ev('boom',t);}
      if(state.tg&&marks.launch2!=null&&t>marks.launch2+.4)await pg.evaluate(tg=>{const S=__sijal;S.cam.tx=tg.nx;S.cam.ty=tg.ny;S.cam.tz=3.2;},state.tg);}
    if(f===Math.round(22*FPS)){state.p=await pg.evaluate(()=>{const S=__sijal,g=S.G,me=g.nations[g.human];const P=g.nations.filter(n=>n&&n.alive&&!n.human&&!n.minor).sort((a,b)=>((a.cx-me.cx)**2+(a.cy-me.cy)**2)-((b.cx-me.cx)**2+(b.cy-me.cy)**2))[0];
        P.att[me.id]=70;g.proposals.push({from:P.id,to:me.id,until:g.tick+250});S.act('acc:'+P.id);S.cam.tx=P.cx;S.cam.ty=P.cy;S.cam.tz=3;return P.id;});ev('ally',t);}
    if(f===Math.round(22.6*FPS))await pg.evaluate(id=>{__sijal.act('nat:'+id);},state.p);
    if(f===Math.round(23.8*FPS))await pg.evaluate(id=>{const S=__sijal;S.G.nations[S.G.human].troops=6e5;S.act('aidOpen:'+id);S.act('amtP:25');},state.p);
    if(f===Math.round(25.2*FPS)){await pg.evaluate(()=>__sijal.act('amtSend'));ev('aid',t);}
    if(f===Math.round(25.8*FPS))await pg.evaluate(id=>{const S=__sijal,g=S.G;S.act('closeCard');g.nations[id].allyRen[g.human]=1;g.ev.push({t:'allyWarn',a:id,b:g.human,tick:g.tick});},state.p);
    if(f===Math.round(27*FPS)){await pg.evaluate(()=>{const S=__sijal,L=S.LOBBY;S.UI.paused=true;for(const d of document.querySelectorAll('.ts'))d.remove();
        L.on=true;L.ok=true;L.list=[{code:'A1',name:'شلة الرياض',n:9,type:'continents',size:1,diff:2},{code:'B2',name:'حرب الشباب',n:14,type:'islands',size:2,diff:3},{code:'C3',name:'تحدي الليل',n:6,type:'pangaea',size:0,diff:1},{code:'D4',name:'أبطال جدة',n:11,type:'crescent',size:1,diff:2}];
        S.act('online');const ms=['24ms','38ms','19ms','52ms'];document.querySelectorAll('#rooms .ping').forEach((e,i)=>{e.textContent=ms[i];e.className='ping good';});
        const c=document.querySelector('#inCode');if(c)c.parentElement.parentElement.style.display='none';});ev('online',t);}
    if(f===Math.round(32*FPS))ev('outro',t);
    if((t>=3.6&&t<9)||(t>=9&&t<12.5&&marks.cityFall==null))await pg.evaluate(()=>__sijal.run(2));
    // ── overlay ──
    const cap=CAPS.find(c=>t>=c[0]&&t<c[1]);
    await pg.evaluate(([t,cap,V])=>{
      __sijal.UI.threats=[];
      const fade=(a,b,c,d)=>Math.max(0,Math.min(1,(t-a)/(b-a),(d-t)/(d-c)));
      const ci=document.querySelector('#prCap');if(cap){ci.querySelector('span').textContent=cap[2];const o=fade(cap[0],cap[0]+.25,cap[1]-.25,cap[1]);ci.style.opacity=o;ci.style.transform=`translateY(${(1-o)*14}px)`;}else ci.style.opacity=0;
      const pi=document.querySelector('#prIn'),pin=fade(0,.35,2.75,3.05);pi.style.opacity=pin;const im=pi.querySelector('img');const k=Math.min(1,t/.6);im.style.transform=`scale(${1.35-.35*(1-(1-k)**3)})`;
      pi.querySelector('.q').style.opacity=Math.max(0,Math.min(1,(t-.9)/.3));
      const po=document.querySelector('#prOut'),out=Math.max(0,Math.min(1,(t-32)/.6));po.style.opacity=out;po.querySelector('img').style.transform=`scale(${1.12-.12*Math.min(1,(t-32)/.8)})`;
      const ls=po.querySelectorAll('.m,.s,.l');ls.forEach((e,i)=>{e.style.opacity=Math.max(0,Math.min(1,(t-32.6-i*.35)/.35));});
      if(t>=32){document.querySelector('#net').style.visibility='hidden';}
    },[t,cap||null,V]);
    await pg.clock.runFor(1000/FPS);
    await pg.screenshot({path:path.join(OUT,'f',String(f).padStart(5,'0')+'.jpg'),type:'jpeg',quality:88});
    if(f%150===0)process.stdout.write(`${MODE} ${t.toFixed(1)}s `);
  }
  marks.end=await pg.evaluate(()=>{const g=__sijal.G,me=g.nations[g.human];return{alive:me.alive,over:!!g.over,tiles:me.tiles,silo:me.cnt.silo,structs:g.structs.filter(s=>!s.dead&&s.owner===me.id).length};});
  fs.writeFileSync(path.join(OUT,'marks.json'),JSON.stringify(marks));
  console.log('\nmarks',JSON.stringify(marks),errs.length?'ERR '+errs.join('|'):'no errors');
  await b.close();
})();
