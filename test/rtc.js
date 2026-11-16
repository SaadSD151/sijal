// real transport check: two pages connect through the public PeerJS broker over WebRTC
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
(async()=>{const srv=http.createServer((q,r)=>{r.setHeader('content-type','text/html; charset=utf-8');r.end(fs.readFileSync(path.resolve(__dirname,'../dist/sijal.html')));}).listen(8766);
  const b=await chromium.launch(),ctx=await b.newContext(),errs=[];const mk=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('C '+m.text().slice(0,120));});await p.goto('http://localhost:8766/');await p.waitForTimeout(600);return p;};
  const A=await mk(),B=await mk();await A.evaluate(()=>{__sijal.UI.prof.size=0;__sijal.act('hostRoom');});
  let code='';for(let i=0;i<20&&!code;i++){await A.waitForTimeout(700);code=await A.evaluate(()=>__sijal.NET.code);}
  console.log('code',code||'(none)');if(code){await B.evaluate(c=>{__sijal.act('online');document.querySelector('#inCode').value=c;__sijal.act('join');},code);
    let n=0;for(let i=0;i<25&&n<2;i++){await A.waitForTimeout(700);n=await A.evaluate(()=>__sijal.NET.players.length);}console.log('players in lobby',n);
    if(n===2){await A.evaluate(()=>{__sijal.act('netStart');});await A.waitForTimeout(3000);await A.evaluate(()=>{__sijal.NET.goAt=performance.now()+500;});await A.waitForTimeout(6000);
      const st=p=>p.evaluate(()=>{const g=__sijal.G;let v=7;for(const n of g.nations)if(n)v=(v*31+n.tiles*7+Math.floor(n.troops))%1000000007;return g.tick+':'+v+':'+g.started;});const a=await st(A);await A.evaluate(()=>__sijal.act('sp:0'));await A.waitForTimeout(700);console.log('A',await st(A),'B',await st(B));}}
  console.log(errs.slice(0,4).join('\n')||'no errors');await b.close();srv.close();})();
