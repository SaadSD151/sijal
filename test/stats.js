// owner statistics against a fake Firebase: visits, unique devices, new players, battles and play time are counted, and the owner panel shows them
const {chromium,devices}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
(async()=>{const html=fs.readFileSync(path.resolve(__dirname,'../dist/site/index.html'),'utf8').replace(/const LB_DB='[^']*',LB_KEY='[^']*';/,"const LB_DB='https://fake-db.test',LB_KEY='k';");
  const srv=http.createServer((q,r)=>{r.setHeader('content-type','text/html; charset=utf-8');r.end(html);}).listen(8783);
  const DB={};let n=0;
  const get=p=>p.reduce((o,k)=>o&&o[k],DB),set=(p,v)=>{let o=DB;for(const k of p.slice(0,-1))o=o[k]||(o[k]={});if(v===null)delete o[p[p.length-1]];else o[p[p.length-1]]=v;};
  const sv=(old,v)=>v&&typeof v==='object'&&v['.sv']?(v['.sv']==='timestamp'?Date.now():(old||0)+v['.sv'].increment):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,sv(0,x)])):v;
  const route=async ctx=>{
    await ctx.route('https://identitytoolkit.googleapis.com/**',rt=>{const uid='anon'+(++n);rt.fulfill({contentType:'application/json',body:JSON.stringify({idToken:'t'+uid,refreshToken:'r'+uid,localId:uid,expiresIn:'3600'})});});
    await ctx.route('https://fake-db.test/**',rt=>{const u=new URL(rt.request().url()),m=rt.request().method(),p=decodeURIComponent(u.pathname).replace(/\.json$/,'').split('/').filter(Boolean);
      const b=rt.request().postData()?JSON.parse(rt.request().postData()):null;
      if(m==='PATCH'){for(const k in b){const q=p.concat(k.split('/'));set(q,sv(get(q),b[k]));}}
      else if(m==='PUT')set(p,sv(0,b));else if(m==='DELETE')set(p,null);
      let r=get(p);if(r&&u.searchParams.get('shallow'))r=Object.fromEntries(Object.keys(r).map(k=>[k,true]));
      if(r&&u.searchParams.get('limitToLast')){const ks=Object.keys(r).sort().slice(-u.searchParams.get('limitToLast'));r=Object.fromEntries(ks.map(k=>[k,r[k]]));}
      rt.fulfill({contentType:'application/json',body:JSON.stringify(r===undefined?null:r)});});};
  const b=await chromium.launch(),errs=[];
  const dev=async(opts)=>{const c=await b.newContext(opts);await route(c);await c.addInitScript(()=>Object.defineProperty(navigator,'webdriver',{get:()=>false}));const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8783/');await p.waitForTimeout(5000);return p;};
  const ok=(c,m)=>{console.log((c?'ok  ':'FAIL ')+m);if(!c)process.exitCode=1;};
  const ph=await dev(devices['iPhone 13']);
  const day=Object.keys((DB.stats||{}).d||{})[0],D=()=>DB.stats.d[day];
  ok(day&&D().visits===1&&D().uniq===1&&D().new===1&&D().u_m===1,'first visit counted: '+JSON.stringify(day&&D()));
  // a quick battle: start, spawn, play a few seconds, back to the menu
  await ph.evaluate(()=>__sijal.act('goQ'));await ph.waitForTimeout(800);
  await ph.evaluate(()=>{const S=__sijal,g=S.G;for(let k=0;k<20000&&!(g.nations[g.human]&&g.nations[g.human].cap);k++){const i=(Math.random()*g.N)|0;if(g.M.ter[i]<2||g.M.ter[i]===6||g.owner[i]||g.structAt[i])continue;S.tap(i,0,0);}});
  await ph.waitForTimeout(4000);
  const on1=await ph.evaluate(()=>{__sijal.stat.ping();return 1;});await ph.waitForTimeout(500);
  ok(Object.values(DB.stats.on||{}).some(v=>v.s==='g'&&v.m===1),'presence shows a phone in battle');
  await ph.evaluate(()=>__sijal.stat.flush());await ph.waitForTimeout(500);
  ok(D().games===1&&D().g_q===1&&D().ms>=2,'battle and play time counted: '+JSON.stringify(D()));
  // reload: a visit but not a new unique device
  await ph.reload();await ph.waitForTimeout(5000);
  ok(D().visits===2&&D().uniq===1&&D().new===1,'second visit, same device: '+JSON.stringify({v:D().visits,u:D().uniq,n:D().new}));
  const pc=await dev({viewport:{width:1280,height:800}});
  ok(D().uniq===2&&D().u_p===1&&D().new===2&&DB.stats.t.visits===3,'a PC is a second unique device');
  // owner panel
  for(let i=1;i<14;i++){const k=new Date(Date.now()+3*36e5-i*864e5).toISOString().slice(0,10);DB.stats.d[k]={uniq:i<7?12:20,new:i<7?10:15,visits:30,games:8,ms:8*150,wins:1,loss:7,u_m:11,u_p:1,h21:9,g_q:8};}
  DB.names={saadsd:'x',ali:'y',noor:'z'};DB.lb={a:{n:'A',w:3,g:5}};
  await pc.evaluate(()=>{const U=__sijal.UI;U.owner=true;U.admin=true;__sijal.act('admin');});await pc.waitForTimeout(1500);
  const txt=await pc.$eval('#help .stp',e=>e.innerText).catch(()=>'');
  ok(/فاتحين اللعبة الحين/.test(txt)&&/الزيارات/.test(txt)&&/الحسابات/.test(txt),'owner panel shows stats');
  const tiles=await pc.$$eval('#help .stp .stc2',es=>es.map(e=>e.innerText.replace(/\s+/g,' ')));console.log(tiles.slice(0,9).join(' | '));
  ok(tiles.some(x=>/الحسابات 3/.test(x)),'accounts count from names');
  const tips=await pc.$$eval('#help .sttip .tip b',es=>es.map(e=>e.textContent));console.log('tips:',tips.join(' | '));
  ok(tips.some(x=>/الزيارات قليلة/.test(x))&&tips.some(x=>/نزلت/.test(x))&&tips.some(x=>/يخسرون/.test(x))&&tips.some(x=>/قصيرة/.test(x)),'suggestions match the numbers');
  await pc.evaluate(()=>document.querySelector('#help .sttip').scrollIntoView());
  await pc.screenshot({path:path.join(process.argv[2]||'/tmp','stats-pc.png'),fullPage:false});
  await ph.evaluate(()=>{const U=__sijal.UI;U.owner=true;U.admin=true;__sijal.act('admin');});await ph.waitForTimeout(1500);
  await ph.screenshot({path:path.join(process.argv[2]||'/tmp','stats-phone.png')});
  ok(!errs.length,'no page errors '+errs.join('|'));
  await b.close();srv.close();
})();
