// factory placement shows planned tracks; after building, rails and trains are drawn
const {chromium,devices}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();
  for(const [name,opts] of [['pc',{viewport:{width:1300,height:760}}],['phone',{...devices['iPhone 13']}]]){
    const ctx=await b.newContext(opts),p=await ctx.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await p.waitForTimeout(600);await p.evaluate(()=>{__sijal.act('setBack');__sijal.act('quick');__sijal.act('go');});await p.waitForTimeout(2500);
    const r=await p.evaluate(()=>{const S=__sijal,g=S.G,W=g.W;let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%W,y=(i/W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]>2&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>200))sp=i;}S.tap(sp,0,0);S.run(400);
      const me=g.nations[g.human];me.gold=5e4;me.era=3;const c=me.cap;let ci=-1;for(let r=8;r<16&&ci<0;r++)for(const[dx,dy]of[[1,0],[0,1],[-1,0],[0,-1]]){const i=(c.y+dy*r)*W+c.x+dx*r;if(ci<0&&!S.cb(g,me,'city',i))ci=i;}
      if(ci>=0){S.fn.build(g,me,'city',ci);g.structs[g.structAt[ci]-1].build=0;}
      let fi=-1,bd=1e9;for(let i=0;i<g.N;i++)if(g.owner[i]===me.id&&!S.cb(g,me,'factory',i)){const d=Math.abs(((i%W)-c.x)**2+(((i/W)|0)-c.y)**2-30);if(d<bd){bd=d;fi=i;}}
      S.UI.mode='b:factory';S.UI.hover=fi;S.cam.tx=S.cam.x=c.x;S.cam.ty=S.cam.y=c.y;S.cam.tz=S.cam.z=5;window.__fi=fi;return{fi,ci,bar:!!document.querySelector('[data-b="factory"],[data-k="factory"]')};});
    await p.waitForTimeout(500);await p.screenshot({path:process.argv[2]+'/rail-prev-'+name+'.png'});
    const o=await p.evaluate(()=>{const S=__sijal,g=S.G,me=g.nations[g.human];S.UI.mode=null;S.UI.hover=-1;S.fn.build(g,me,'factory',window.__fi);const f=g.structs[g.structAt[window.__fi]-1];if(!f)return{err:'nobuild',fi:window.__fi,cb:S.cb(g,me,'factory',window.__fi)};S.run(160);
      for(const n of g.nations)if(n&&n.alive)n.gold=0;f.tcd=0;S.run(300);return{rails:g.rails.filter(r=>r.f===f).length,trains:g.trains.length,txt:document.body.innerText.includes('مصنع')};});
    await p.waitForTimeout(500);await p.screenshot({path:process.argv[2]+'/rail-'+name+'.png'});
    console.log(name,JSON.stringify(r),JSON.stringify(o),errs.join('|')||'no errors');await ctx.close();}
  await b.close();})();
