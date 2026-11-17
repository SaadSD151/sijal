// serves dist/site like GitHub Pages: online must work with the bundled peer.js, and an old browser must get a clear message
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
(async()=>{const root=path.resolve(__dirname,'../dist/site');let peerHits=0;
  const srv=http.createServer((q,r)=>{let f=q.url.split('?')[0];if(f==='/')f='/index.html';if(f==='/peer.js')peerHits++;const p=path.join(root,f);if(!fs.existsSync(p)){r.statusCode=404;return r.end();}
    r.setHeader('content-type',f.endsWith('.js')?'text/javascript':f.endsWith('.json')?'application/json':'text/html; charset=utf-8');r.end(fs.readFileSync(p));}).listen(8774);
  const b=await chromium.launch(),ctx=await b.newContext(),errs=[];
  const mk=async(old)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.addInitScript(o=>{window.SIJAL_REG='sijal-rooms-test-'+Date.now();if(o){delete window.RTCPeerConnection;delete window.webkitRTCPeerConnection;}},old||false);
    await p.goto('http://localhost:8774/');await p.waitForTimeout(600);await p.evaluate(()=>__sijal.act('setBack'));return p;};
  const wait=async(p,fn,ms)=>{for(let i=0;i<ms/500;i++){if(await p.evaluate(fn))return true;await p.waitForTimeout(500);}return false;};
  const A=await mk(),B=await mk();await A.evaluate(()=>{__sijal.UI.prof.size=0;__sijal.act('hostRoom');});
  let code='';for(let i=0;i<30&&!code;i++){await A.waitForTimeout(500);code=await A.evaluate(()=>__sijal.NET.code);}
  await B.evaluate(()=>__sijal.act('online'));const diagOk=await wait(B,()=>/✔/.test((document.querySelector('#diag')||{}).textContent||''),20000);
  await B.evaluate(c=>{document.querySelector('#inCode').value=c;__sijal.act('join');},code);
  const joined=await wait(A,()=>__sijal.NET.players.length===2,20000);
  console.log('room code',code,'| device check on B:',diagOk,await B.evaluate(()=>document.querySelector('#diag')?document.querySelector('#diag').textContent:''),'| B joined:',joined,'| peer.js served from site:',peerHits,'times');
  const C=await mk(true);await C.evaluate(()=>__sijal.act('online'));await C.waitForTimeout(800);
  const cDiag=await C.evaluate(()=>document.querySelector('#diag').textContent);await C.evaluate(c=>{document.querySelector('#inCode').value=c;__sijal.act('join');},code);await C.waitForTimeout(800);
  console.log('old browser check:',cDiag,'| on join:',await C.evaluate(()=>[...document.querySelectorAll('#gToasts .ts')].map(e=>e.textContent).join('|')));
  console.log(errs.join('|')||'no errors');await b.close();srv.close();})();
