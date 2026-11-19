// own realm card, emoji, trade toggle, auto-upgrade with limits and rate, graphics setting, host player slider, range circles, front troops, conquest sword
const {chromium,devices}=require('playwright'),path=require('path');const SH=process.argv[2];
(async()=>{const b=await chromium.launch();
  for(const [name,opts] of [['phone',{...devices['iPhone 13']}],['pc',{viewport:{width:1300,height:760}}]]){
    const ctx=await b.newContext(opts),p=await ctx.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await p.waitForTimeout(600);await p.evaluate(()=>{__sijal.act('setBack');__sijal.act('quick');__sijal.act('go');});await p.waitForTimeout(1500);
    const o=await p.evaluate(()=>{const S=__sijal,g=S.G,W=g.W;let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%W,y=(i/W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]>2&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>200))sp=i;}S.tap(sp,0,0);S.run(400);
      const me=g.nations[g.human];me.gold=2e4;me.era=4;
      // tap own land away from buildings -> own card; near a building -> building card
      let far=-1;for(let i=0;i<g.N&&far<0;i++)if(g.owner[i]===me.id&&g.structs.every(s=>(s.x-i%W)**2+(s.y-((i/W)|0))**2>9))far=i;
      S.tap(far,0,0);const selfCard=document.querySelector('#card .ch small').textContent;S.act('closeCard');S.tap(me.cap.i,0,0);const capCard=!!document.querySelector('#bBtn');S.act('closeCard');
      S.tap(far,0,0);S.act('emoOpen:0');const grid=document.querySelectorAll('.emg button').length;S.act('emoS:21');S.run(2);
      S.act('embAll:1');S.run(1);const emb=me.embAll;S.act('embAll:0');S.run(1);
      // forts and shield for circles
      for(const ty of['fort','shield']){let t=-1;for(let i=0;i<g.N;i++)if(g.owner[i]===me.id&&!S.cb(g,me,ty,i)){t=i;break;}S.fn.build(g,me,ty,t);g.structs[g.structAt[t]-1].build=0;}
      S.cam.tx=S.cam.x=me.cap.x;S.cam.ty=S.cam.y=me.cap.y;S.cam.tz=S.cam.z=3.2;
      return{selfCard,capCard,grid,emoShown:me.emo===21,emb};});
    await p.waitForTimeout(500);await p.screenshot({path:SH+'/self-'+name+'.png'});
    // auto upgrade: reserve 15000, cap 5000, 2 per two minutes, ask first
    const au=await p.evaluate(async()=>{const S=__sijal,g=S.G,me=g.nations[g.human];S.act('auOpen');const keep=document.querySelector('#auKeep'),mx=document.querySelector('#auMax'),rt=document.querySelector('#auRate');
      keep.value='10000';keep.dispatchEvent(new Event('change',{bubbles:true}));mx.value='5000';mx.dispatchEvent(new Event('change',{bubbles:true}));rt.value='2';rt.dispatchEvent(new Event('change',{bubbles:true}));S.act('auSet:on:1');
      return{cfg:JSON.stringify(S.UI.prof.au)};});
    await p.waitForTimeout(1600);const q1=await p.evaluate(()=>(document.querySelector('.ts.au')||{}).textContent||'none');await p.screenshot({path:SH+'/au-'+name+'.png'});
    const r2=await p.evaluate(async()=>{const S=__sijal,g=S.G,me=g.nations[g.human];const g0=me.gold;S.act('auY');S.run(2);const spent=g0-me.gold;S.UI.auNext=0;return{spent,keepOk:me.gold>=10000};});
    await p.waitForTimeout(1300);const q2=await p.evaluate(()=>(document.querySelector('.ts.au')||{}).textContent||'none');
    const r3=await p.evaluate(()=>{const S=__sijal;S.act('auY');S.run(2);S.UI.auNext=0;return 0;});await p.waitForTimeout(1300);const q3=await p.evaluate(()=>(document.querySelector('.ts.au')||{}).textContent||'none (rate limit)');
    await p.evaluate(()=>{const S=__sijal;S.act('auSet:on:0');S.act('closeCard');});
    // attack front label + conquest sword
    await p.evaluate(()=>{const S=__sijal,g=S.G,me=g.nations[g.human];me.troops=2e5;const K=g.nations.length;let d=null;for(const n of g.nations)if(n&&n.alive&&n.id!==me.id&&g.nb[me.id*K+n.id]>0)d=n;if(d){S.fn.launchAttack(g,me.id,d.id,.5,-1,-1);S.run(40);const k=g.attacks.find(k=>k.a===me.id);if(k&&k.fx!=null){S.cam.tx=S.cam.x=k.fx;S.cam.ty=S.cam.y=k.fy;}}
      const B=g.nations.find(n=>n&&n.alive&&n.minor)||d;if(B){B.troops=30000;const ts=[];for(let i=0;i<g.N;i++)if(g.owner[i]===B.id)ts.push(i);g.ev.length=0;for(const i of ts){g.owner[i]===B.id&&(()=>{})();}window.__vic=B.id;}});
    await p.waitForTimeout(400);await p.screenshot({path:SH+'/front-'+name+'.png'});
    // settings: graphics chips; host setup: player slider
    const st=await p.evaluate(()=>{const S=__sijal;S.act('gfx:0');const lo={q:S.R.q,dpr:document.querySelector('canvas').width/document.querySelector('canvas').getBoundingClientRect().width};S.act('gfx:2');return{lo,hi:S.R.q,chips:document.querySelectorAll('[data-a^="gfx:"]').length};});
    console.log(name,JSON.stringify(o),'| au',JSON.stringify(au),'| ask1:',q1,'|',JSON.stringify(r2),'| ask2:',q2,'| ask3:',q3,'| gfx',JSON.stringify(st),errs.join('|')||'no errors');await ctx.close();}
  // host setup slider
  const c=await b.newContext({...devices['iPhone 13']}),p=await c.newPage();await p.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await p.waitForTimeout(600);
  const hs=await p.evaluate(()=>{const S=__sijal;S.act('setBack');S.act('hostSetup');const r=document.querySelector('#inMaxP');r.value='32';r.dispatchEvent(new Event('input',{bubbles:true}));return{min:r.min,max:r.max,v:document.querySelector('#maxPV').textContent,saved:S.UI.prof.maxP};});
  await p.screenshot({path:SH+'/host-phone.png',fullPage:true});console.log('host slider',JSON.stringify(hs));await b.close();})();
