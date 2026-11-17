const {chromium,devices}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();
  for(const [name,opts] of [['pc',{viewport:{width:1300,height:760}}],['phone',{...devices['iPhone 13']}]]){
    const ctx=await b.newContext(opts),pg=await ctx.newPage(),errs=[];pg.on('pageerror',e=>errs.push(e.message));
    await pg.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await pg.waitForTimeout(600);await pg.evaluate(()=>{__sijal.act('setBack');__sijal.UI.prof.amHide=true;__sijal.UI.prof.amPos={x:.05,y:.45};__sijal.act('quick');__sijal.act('go');});await pg.waitForTimeout(2500);
    const r=await pg.evaluate(()=>{const S=__sijal,g=S.G;let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%g.W,y=(i/g.W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]>2&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>200))sp=i;}S.tap(sp,0,0);
      const me=g.nations[g.human];me.gold=5000;me.troops=60000;const P=g.nations.find(n=>n&&n.alive&&!n.human&&!n.minor);const o={};
      // gift exactly 50%
      S.act('nat:'+P.id);S.act('giftOpen:'+P.id);S.act('amtP:50');const g0=me.gold,pg0=P.gold;S.act('amtSend');o.giftPaid=g0-me.gold;o.giftGot=P.gold-pg0;
      // ally, then send troops
      g.proposals.push({from:P.id,to:me.id,until:g.tick+250});S.act('acc:'+P.id);S.run(1);o.allied=!!me.ally[P.id];
      S.act('nat:'+P.id);S.UI.cardKey='';S.act('closeCard');S.act('nat:'+P.id);
      o.btns=[...document.querySelectorAll('#cB .ca span')].map(e=>e.textContent).join(',');
      const t0=me.troops,pt0=P.troops,a0=P.att[me.id];S.act('aidOpen:'+P.id);document.querySelector('#amtR').value=10000;document.querySelector('#amtR').dispatchEvent(new Event('input',{bubbles:true}));S.act('amtSend');
      o.aidSent=Math.round(t0-me.troops);o.aidGot=Math.round(P.troops-pt0);o.trust=Math.round(a0)+'->'+Math.round(P.att[me.id]);
      S.act('aidOpen:'+P.id);return o;});
    await pg.waitForTimeout(500);await pg.screenshot({path:process.argv[2]+'/card-'+name+'.png'});
    const pos=await pg.evaluate(()=>{const r=document.querySelector('#amode').getBoundingClientRect();return Math.round(r.left)+','+Math.round(r.top);});
    console.log(name,JSON.stringify(r),'amode at',pos,errs.join('|')||'no errors');await ctx.close();}
  await b.close();})();
