// the crown in a match only toggles the nations ranking; it must not leave the match
const {chromium,devices}=require('playwright'),path=require('path');
(async()=>{const b=await chromium.launch();for(const [n,o] of [['pc',{viewport:{width:1300,height:760}}],['phone',{...devices['iPhone 13']}]]){const c=await b.newContext(o),p=await c.newPage(),e=[];p.on('pageerror',x=>e.push(x.message));
await p.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await p.waitForTimeout(600);await p.evaluate(()=>{__sijal.act('setBack');__sijal.act('quick');__sijal.act('go');});await p.waitForTimeout(1500);
await (n==='phone'?p.click('#bLb'):p.evaluate(()=>__sijal.act('lb')));await p.waitForTimeout(400);const r1=await p.evaluate(()=>({screen:__sijal.UI.screen,open:document.querySelector('#lb').classList.contains('open')}));
await (n==='phone'?p.click('#bLb'):p.evaluate(()=>__sijal.act('lb')));await p.waitForTimeout(300);const r2=await p.evaluate(()=>({screen:__sijal.UI.screen,open:document.querySelector('#lb').classList.contains('open')}));
console.log(n,JSON.stringify(r1),JSON.stringify(r2),e.join('|')||'no errors');await c.close();}await b.close();})();
