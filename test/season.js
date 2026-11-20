// tabs on top of the menu, season zero 20 tiers, customize equips skins, daily: one attempt and less experience
const {chromium,devices}=require('playwright'),path=require('path');const SH=process.argv[2];
(async()=>{const b=await chromium.launch(),c=await b.newContext({...devices['iPhone 13']}),p=await c.newPage(),e=[];p.on('pageerror',x=>e.push(x.message));
await p.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await p.evaluate(()=>localStorage.setItem('sijal.v1',JSON.stringify({xp:40000,passT:20,seen:'9.9'})));await p.reload();await p.waitForTimeout(800);
await p.evaluate(()=>__sijal.act('setBack'));await p.waitForTimeout(200);await p.screenshot({path:SH+'/s-menu.png'});
const r1=await p.evaluate(()=>({tabs:[...document.querySelectorAll('#menu .mtabs button')].map(b=>b.textContent)}));
await p.evaluate(()=>__sijal.act('pass'));const r2=await p.evaluate(()=>({tiers:document.querySelectorAll('.bpc').length,got:document.querySelectorAll('.bpc.got').length,title:document.querySelector('#help h2').textContent,equipBtns:document.querySelectorAll('#help [data-a^="skin:"]').length}));
await p.screenshot({path:SH+'/s-pass.png'});
await p.evaluate(()=>{__sijal.act('skins');__sijal.act('skin:pat:zigzag');__sijal.act('skin:bld:silver');});await p.screenshot({path:SH+'/s-skins.png'});
const r3=await p.evaluate(()=>({skin:JSON.stringify(__sijal.UI.prof.skin),eq:document.querySelectorAll('.bpc.eq').length}));
// daily: start, earn, then locked; play-again blocked
await p.evaluate(()=>{__sijal.act('menu');__sijal.act('daily');});const before=await p.evaluate(()=>!!document.querySelector('[data-a="dailyGo"]'));
const xp=await p.evaluate(async()=>{const S=__sijal;S.act('dailyGo');await new Promise(r=>setTimeout(r,1500));const g=S.G,W=g.W;let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%W,y=(i/W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]>3&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>300))sp=i;}S.tap(sp,0,0);S.run(3);await new Promise(r=>setTimeout(r,300));
  const me=g.nations[g.human];me.st.cities=5;me.st.kills=2;const x0=S.UI.prof.xp;g.over={w:me.id,win:true,why:'dom'};g.ev.push({t:'over',win:true,w:me.id});await new Promise(r=>setTimeout(r,2300));return S.UI.prof.xp-x0;});
await p.evaluate(()=>__sijal.act('again'));await p.waitForTimeout(400);const again=await p.evaluate(()=>({screen:__sijal.UI.screen,daily:!!(__sijal.G&&__sijal.G.o.daily&&!__sijal.G.started)}));
await p.evaluate(()=>{__sijal.act('menu');__sijal.act('daily');__sijal.act('dailyGo');});await p.waitForTimeout(400);const after=await p.evaluate(()=>({btn:!!document.querySelector('[data-a="dailyGo"]'),lock:(document.querySelector('.dlock')||{}).textContent,screen:__sijal.UI.screen}));
await p.screenshot({path:SH+'/s-daily.png'});
console.log(JSON.stringify(r1),JSON.stringify(r2),JSON.stringify(r3),'| daily button before',before,'| daily win xp',xp,'| again',JSON.stringify(again),'| after',JSON.stringify(after),e.join('|')||'no errors');await b.close();})();
