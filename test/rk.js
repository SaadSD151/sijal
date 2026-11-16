const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch(),pg=await b.newPage({viewport:{width:1200,height:760}}),errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await pg.waitForTimeout(600);
  await pg.evaluate(()=>{__sijal.UI.prof.wins=30;__sijal.act('account');__sijal.act('ranks');});await pg.waitForTimeout(300);await pg.screenshot({path:process.argv[2]+'/ranks.png'});
  console.log(await pg.evaluate(()=>document.querySelectorAll('.rks>div').length+' ranks, current: '+document.querySelector('.rks .cur').textContent),errs.join('|')||'no errors');await b.close();})();
