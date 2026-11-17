const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
(async()=>{const srv=http.createServer((q,r)=>{r.setHeader('content-type','text/html; charset=utf-8');r.end(fs.readFileSync(path.resolve(__dirname,'../dist/sijal.html')));}).listen(8768);
  const b=await chromium.launch(),ctx=await b.newContext(),errs=[];const mk=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.addInitScript(()=>{window.SIJAL_CODE='REMAT';});await p.goto('http://localhost:8768/?bc=1');await p.waitForTimeout(500);await p.evaluate(()=>__sijal.act('setBack'));return p;};
  const A=await mk(),B=await mk();await A.evaluate(()=>{__sijal.UI.prof.size=0;__sijal.act('hostRoom');});await A.waitForTimeout(400);
  await B.evaluate(()=>{__sijal.act('online');document.querySelector('#inCode').value='REMAT';__sijal.act('join');});await B.waitForTimeout(600);
  await A.evaluate(()=>__sijal.act('netStart'));await A.waitForTimeout(2500);const s1=await B.evaluate(()=>__sijal.G.o.seed);
  // match ends: host gets the end screen with a rematch button
  await A.evaluate(()=>{const g=__sijal.G;g.over={win:true,w:1,why:'dom'};g.ev.push({t:'over',win:true});});await A.waitForTimeout(2500);
  const hasBtn=await A.evaluate(()=>!!document.querySelector('[data-a="rematch"]'));await A.evaluate(()=>__sijal.act('rematch'));await A.waitForTimeout(700);
  const st=await Promise.all([A.evaluate(()=>__sijal.UI.screen+'/'+__sijal.NET.players.length+'/'+!!document.querySelector('#setup [data-a="netStart"]')),B.evaluate(()=>__sijal.UI.screen+'/'+__sijal.NET.started)]);
  await A.evaluate(()=>{__sijal.UI.prof.type='islands';__sijal.act('netStart');});await A.waitForTimeout(2500);
  const s2=await Promise.all([A.evaluate(()=>__sijal.G.o.seed+'/'+__sijal.G.o.type),B.evaluate(()=>__sijal.G.o.seed+'/'+__sijal.G.o.type+'/'+__sijal.UI.phase)]);
  console.log('rematch button',hasBtn,'| after rematch host/client',st.join(' , '),'| new match',s2.join(' , '),'first seed',s1);console.log(errs.join('|')||'no errors');await b.close();srv.close();})();
