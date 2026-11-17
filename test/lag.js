// slow client (CPU throttled) must stay within ~2 s of the host; an old version must be refused
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
(async()=>{const srv=http.createServer((q,r)=>{r.setHeader('content-type','text/html; charset=utf-8');r.end(fs.readFileSync(path.resolve(__dirname,'../dist/sijal.html')));}).listen(8772);
  const b=await chromium.launch(),ctx=await b.newContext({viewport:{width:900,height:600}}),errs=[];
  const mk=async(fake)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.addInitScript(f=>{window.SIJAL_CODE='LAGGY';if(f)window.SIJAL_FAKE_VER=f;},fake||null);await p.goto('http://localhost:8772/?bc=1');await p.waitForTimeout(500);await p.evaluate(()=>__sijal.act('setBack'));return p;};
  const A=await mk(),B=await mk();
  await A.evaluate(()=>{__sijal.UI.prof.name='Host';__sijal.UI.prof.size=2;__sijal.UI.prof.botsN=20;__sijal.act('hostRoom');});await A.waitForTimeout(400);
  await B.evaluate(()=>{__sijal.UI.prof.name='Phone';__sijal.act('online');document.querySelector('#inCode').value='LAGGY';__sijal.act('join');});await B.waitForTimeout(700);
  // an outdated device tries to join
  const C=await mk('old-version');await C.evaluate(()=>{__sijal.act('online');document.querySelector('#inCode').value='LAGGY';__sijal.act('join');});await C.waitForTimeout(1200);
  const cMsg=await C.evaluate(()=>[...document.querySelectorAll('#gToasts .ts')].map(e=>e.textContent).join('|')+' | in room: '+__sijal.NET.on);
  console.log('players in room:',await A.evaluate(()=>__sijal.NET.players.map(p=>p.name).join(',')),'| old version sees:',cMsg);
  await A.evaluate(()=>__sijal.act('netStart'));await A.waitForTimeout(3000);
  await A.evaluate(()=>{__sijal.NET.goAt=performance.now()+300;});await A.waitForTimeout(2000);
  const cdp=await ctx.newCDPSession(B);await cdp.send('Emulation.setCPUThrottlingRate',{rate:25});
  await A.evaluate(()=>__sijal.act('sp:3'));
  for(let s=0;s<6;s++){await A.waitForTimeout(4000);const a=await A.evaluate(()=>({t:__sijal.G.tick,hint:document.querySelector('#hint')&&!document.querySelector('#hint').hidden?document.querySelector('#hint').textContent:''}));const bt=await B.evaluate(()=>__sijal.G.tick);
    console.log(`after ${(s+1)*4}s: host tick ${a.t}, phone tick ${bt}, behind by ${a.t-bt} ticks ${a.hint?'| host shows: '+a.hint:''}`);}
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await A.evaluate(()=>__sijal.act('sp:0'));await A.waitForTimeout(3000);
  const st=p=>p.evaluate(()=>{const g=__sijal.G;let v=7;for(let i=0;i<g.N;i+=3)v=(v*33+g.owner[i])%1000000007;return g.tick+':'+v;});
  console.log('after pause, host',await st(A),'phone',await st(B));console.log(errs.join('|')||'no errors');await b.close();srv.close();})();
