const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch(),pg=await b.newPage(),errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await pg.waitForTimeout(600);await pg.mouse.click(5,5);
  const r=await pg.evaluate(async()=>{const S=__sijal;S.act('settings');const m=document.querySelector('#volM');m.value=20;m.dispatchEvent(new Event('input',{bubbles:true}));const s=document.querySelector('#volS');s.value=0;s.dispatchEvent(new Event('input',{bubbles:true}));
    const o={volM:S.UI.prof.volM,volS:S.UI.prof.volS,sound:S.UI.prof.sound,scr:S.UI.screen};S.act('setBack');o.back=S.UI.screen;
    for(const w of['def','atk',false]){S.UI.war=w;await new Promise(r=>setTimeout(r,1200));}return o;});
  console.log(JSON.stringify(r),errs.join('|')||'no errors');await b.close();})();
