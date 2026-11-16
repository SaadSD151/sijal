const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch(),pg=await(await b.newContext({viewport:{width:1366,height:768}})).newPage(),errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await pg.waitForTimeout(700);await pg.evaluate(()=>__sijal.act('daily'));await pg.waitForTimeout(400);await pg.screenshot({path:process.argv[2]+'/daily.png'});
  await pg.evaluate(()=>__sijal.act('dailyGo'));await pg.waitForTimeout(1800);console.log(await pg.evaluate(()=>JSON.stringify({ph:__sijal.UI.phase,d:__sijal.G.o.daily,bots:__sijal.G.o.bots})),errs.join('|')||'no errors');await b.close();})();
