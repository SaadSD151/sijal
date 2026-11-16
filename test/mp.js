// two browser pages play one online match over the test transport; their worlds must stay identical
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
(async()=>{
  const srv=http.createServer((q,r)=>{r.setHeader('content-type','text/html; charset=utf-8');r.end(fs.readFileSync(path.resolve(__dirname,'../dist/sijal.html')));}).listen(8765);
  const b=await chromium.launch(),ctx=await b.newContext({viewport:{width:1100,height:700}}),errs=[];
  const mk=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message+(e.stack||'').split('\n')[1]));await p.addInitScript(()=>{window.SIJAL_CODE='TEST1';});await p.goto('http://localhost:8765/?bc=1');await p.waitForTimeout(600);return p;};
  const A=await mk(),B=await mk(),C=await mk();
  await A.evaluate(()=>{__sijal.UI.prof.name='Host';__sijal.UI.prof.size=0;__sijal.UI.prof.botsN=8;__sijal.act('hostRoom');});await A.waitForTimeout(500);
  for(const[p,n]of[[B,'Ali'],[C,'Sara']]){await p.evaluate(n=>{__sijal.UI.prof.name=n;__sijal.act('online');document.querySelector('#inCode').value='TEST1';__sijal.act('join');},n);await p.waitForTimeout(500);}
  console.log('lobby',await A.evaluate(()=>__sijal.NET.players.map(p=>p.name).join(',')),'|',await C.evaluate(()=>__sijal.NET.players.map(p=>p.name).join(',')+' screen '+__sijal.UI.screen));
  await A.screenshot({path:process.argv[2]+'/mp-lobby.png'});
  await A.evaluate(()=>__sijal.act('netStart'));await A.waitForTimeout(2500);
  const spawnAt=async(p,k)=>p.evaluate(k=>{const g=__sijal.G;let c=0;for(let i=0;i<g.N;i++){const x=i%g.W,y=(i/g.W)|0;if(g.M.ter[i]===2&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>260)&&c++===k*60){__sijal.tap(i,0,0);return i;}}return -1;},k);
  console.log('spawn',await spawnAt(A,1),await spawnAt(B,3));   // C never picks: the host must auto-place it
  await A.evaluate(()=>{__sijal.NET.goAt=performance.now()+1500;});await A.waitForTimeout(3000);
  const play=p=>p.evaluate(()=>{const g=__sijal.G,me=g.nations[g.human];if(!me.alive||!g.started)return;let t=-1,bd=1e9;for(let i=0;i<g.N;i+=13){if(g.M.ter[i]<2||g.owner[i]===me.id)continue;const d=(i%g.W-me.cx)**2+(((i/g.W)|0)-me.cy)**2;if(d<bd){bd=d;t=i;}}__sijal.UI.ratio=.4;if(t>=0)__sijal.tap(t,0,0);if(me.gold>400)__sijal.act('era');});
  await A.evaluate(()=>__sijal.act('sp:3'));
  for(let r=0;r<22;r++){await play(A);await play(B);if(r<12)await play(C);await A.waitForTimeout(1500);if(r===12)await C.close();}
  await A.evaluate(()=>__sijal.act('sp:0'));await A.waitForTimeout(800);
  const st=p=>p.evaluate(()=>{const g=__sijal.G;let v=7,o=0;for(const n of g.nations)if(n)v=(v*31+n.tiles*7+Math.floor(n.troops))%1000000007;for(let i=0;i<g.N;i+=3)o=(o*33+g.owner[i])%1000000007;return JSON.stringify({tick:g.tick,v,o,me:g.human,name:natName2(),humans:g.nations.filter(n=>n&&n.human).length,phase:__sijal.UI.phase});function natName2(){return g.nations[g.human].pname;}});
  console.log('A',await st(A));console.log('B',await st(B));await B.screenshot({path:process.argv[2]+'/mp-play.png'});
  console.log(errs.length?errs.join('\n'):'no errors');await b.close();srv.close();})();
