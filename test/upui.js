const {chromium,devices}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();
  for(const [name,opts] of [['pc',{viewport:{width:1300,height:760}}],['phone',{...devices['iPhone 13']}]]){
    const ctx=await b.newContext(opts),p=await ctx.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await p.waitForTimeout(600);await p.evaluate(()=>{__sijal.act('setBack');__sijal.act('quick');__sijal.act('go');});await p.waitForTimeout(2500);
    const r=await p.evaluate(()=>{const S=__sijal,g=S.G,W=g.W;let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%W,y=(i/W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]>2&&g.M.ter[i]!==6&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>200))sp=i;}S.tap(sp,0,0);S.run(30);
      const me=g.nations[g.human];me.gold=5e4;me.era=4;let t=-1;for(let i=0;i<g.N;i++)if(g.owner[i]===me.id&&!S.cb(g,me,'shield',i)){t=i;break;}S.fn.build(g,me,'shield',t);const sh=g.structs[g.structAt[t]-1];sh.build=0;
      S.tap(sh.i,0,0);const o={opened:!!document.querySelector('#bBtn'),title:document.querySelector('#card .ch b').textContent,lv:document.querySelector('#bLv').textContent,now:document.querySelector('#bNow').textContent,next:document.querySelector('#bNext').textContent,btn:(document.querySelector('#bBtn .up')||{}).textContent};
      const g0=me.gold;S.act('upB');o.paid=g0-me.gold;S.run(30);S.cam.tx=sh.x;S.cam.ty=sh.y;S.cam.tz=5;S.cam.x=sh.x;S.cam.y=sh.y;S.cam.z=5;return o;});
    await p.waitForTimeout(600);const mid=await p.evaluate(()=>document.querySelector('#bBtn').textContent);await p.screenshot({path:process.argv[2]+'/up-'+name+'.png'});
    await p.evaluate(()=>__sijal.run(40));await p.waitForTimeout(600);const done=await p.evaluate(()=>document.querySelector('#bLv').textContent+' | '+document.querySelector('#bNext').textContent);
    console.log(name,JSON.stringify(r),'| during:',mid,'| after:',done,errs.join('|')||'no errors');await ctx.close();}
  await b.close();})();
