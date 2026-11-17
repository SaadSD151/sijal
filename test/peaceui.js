const {chromium,devices}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();
  for(const [name,opts] of [['pc',{viewport:{width:1300,height:760}}],['phone',{...devices['iPhone 13']}]]){
    const ctx=await b.newContext(opts),p=await ctx.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await p.waitForTimeout(600);await p.evaluate(()=>{__sijal.act('setBack');__sijal.act('quick');__sijal.act('go');});await p.waitForTimeout(2500);
    const o=await p.evaluate(()=>{const S=__sijal,g=S.G,W=g.W;let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%W,y=(i/W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]>2&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>200))sp=i;}S.tap(sp,0,0);S.run(300);
      const me=g.nations[g.human];const B=g.nations.find(n=>n&&n.alive&&!n.minor&&n.id!==me.id&&!me.ally[n.id]);B.lastHit[me.id]=g.tick;B.att[me.id]=-100;me.troops=B.troops;
      S.act('nat:'+B.id);S.run(1);const btn=document.querySelector('[data-a="peace:'+B.id+'"]');const st1=document.querySelector('#cS').textContent;
      S.act('peace:'+B.id);window.__B=B.id;return{btn:!!btn,st1,score:G0()};function G0(){return 0}});
    await p.waitForTimeout(500);o.feed1=await p.evaluate(()=>document.body.innerText.includes('رفض السلام'));
    Object.assign(o,await p.evaluate(()=>{const S=__sijal,g=S.G,me=g.nations[g.human],B=g.nations[window.__B];me.troops=B.troops*4;B.pg[me.id]=60;B.lastHit[me.id]=g.tick;me.pAsk[B.id]=-9999;S.act('peace:'+B.id);return{}}));
    await p.waitForTimeout(700);Object.assign(o,await p.evaluate(()=>({st2:document.querySelector('#cS').textContent,atkHidden:!document.querySelector('[data-a="atk:'+window.__B+'"]'),feed2:document.body.innerText.includes('صار بينك'),txt:[...document.querySelectorAll('#feed *, .feed *')].slice(-4).map(e=>e.textContent).join(' | ').slice(0,300),heg:__sijal.G.hegemon===__sijal.G.human,pers:__sijal.G.nations[window.__B].pers})));
    await p.waitForTimeout(400);await p.screenshot({path:process.argv[2]+'/peace-'+name+'.png'});console.log(name,JSON.stringify(o),errs.join('|')||'no errors');await ctx.close();}
  await b.close();})();
