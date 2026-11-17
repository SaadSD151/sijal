// real PeerJS: host lists a public room, a second browser sees and joins it, a third sees it vanish once the battle starts
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
(async()=>{const srv=http.createServer((q,r)=>{r.setHeader('content-type','text/html; charset=utf-8');r.end(fs.readFileSync(path.resolve(__dirname,'../dist/sijal.html')));}).listen(8767);
  const b=await chromium.launch(),ctx=await b.newContext(),errs=[];const mk=async()=>{const p=await ctx.newPage();await p.addInitScript(id=>{window.SIJAL_REG=id;},'sijal-rooms-test-'+Date.now());p.on('pageerror',e=>errs.push(e.message));await p.addInitScript(()=>{window.SIJAL_REG='sijal-rooms-test-'+(location.port);});await p.goto('http://localhost:8767/');await p.waitForTimeout(500);await p.evaluate(()=>__sijal.act('setBack'));return p;};
  const wait=async(p,fn,ms)=>{for(let i=0;i<ms/500;i++){if(await p.evaluate(fn))return true;await p.waitForTimeout(500);}return false;};
  const B=await mk();await B.evaluate(()=>{__sijal.UI.prof.name='Ali';__sijal.act('online');});
  const A=await mk();await A.evaluate(()=>{__sijal.UI.prof.name='Saad';__sijal.UI.prof.room='حرب الشباب';__sijal.UI.prof.pub=true;__sijal.UI.prof.size=0;__sijal.act('hostRoom');});
  const listed=await wait(B,()=>!!document.querySelector('#rooms [data-a^="joinR:"]'),30000);
  const pinged=await wait(B,()=>/[0-9]+ms/.test(document.querySelector('#rooms').textContent),25000);
  console.log('B sees room:',listed,'| ping shown:',pinged,'|',await B.evaluate(()=>document.querySelector('#rooms').textContent.slice(0,90)));
  if(listed){await B.evaluate(()=>document.querySelector('#rooms [data-a^="joinR:"]').click());
    console.log('A lobby has 2:',await wait(A,()=>__sijal.NET.players.length===2,20000));console.log('B lobby title / ping:',await wait(B,()=>/ms/.test((document.querySelector('#myPing')||{}).textContent||''),15000),await B.evaluate(()=>document.querySelector('#net h2').textContent+' | '+(document.querySelector('#myPing')||{}).textContent));
    const C=await mk();await C.evaluate(()=>__sijal.act('online'));console.log('C sees room before start:',await wait(C,()=>!!document.querySelector('#rooms [data-a^="joinR:"]'),30000));
    await A.evaluate(()=>__sijal.act('netStart'));
    console.log('C list empty after start:',await wait(C,()=>!document.querySelector('#rooms [data-a^="joinR:"]'),30000));}
  console.log(errs.join('|')||'no errors');await b.close();srv.close();})();
