// leaderboard against a fake Firebase: play time counts, results upload, list sorts by wins or hours, own row highlighted
const {chromium,devices}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
(async()=>{const html=fs.readFileSync(path.resolve(__dirname,'../dist/site/index.html'),'utf8').replace("const LB_DB='',LB_KEY='';","const LB_DB='https://fake-db.test',LB_KEY='k';");
  const srv=http.createServer((q,r)=>{r.setHeader('content-type','text/html; charset=utf-8');r.end(html);}).listen(8781);
  const DB={a1:{n:'سعود',w:40,h:3.6e6*2,g:50},a2:{n:'Ali',w:5,h:3.6e6*30,g:9}};let uid=0;
  const b=await chromium.launch();const out=[];
  for(const [name,opts] of [['pc',{viewport:{width:1300,height:760}}],['phone',{...devices['iPhone 13']}]]){
    const ctx=await b.newContext(opts),p=await ctx.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
    await ctx.route('https://identitytoolkit.googleapis.com/**',rt=>rt.fulfill({contentType:'application/json',body:JSON.stringify({idToken:'tok',refreshToken:'rt',localId:'me'+(++uid),expiresIn:'3600'})}));
    await ctx.route('https://fake-db.test/**',rt=>{const u=new URL(rt.request().url());if(rt.request().method()==='PUT'){const id=u.pathname.split('/')[2].replace('.json','');const v=JSON.parse(rt.request().postData());v.t=Date.now();DB[id]=v;return rt.fulfill({contentType:'application/json',body:JSON.stringify(v)});}
      return rt.fulfill({contentType:'application/json',body:JSON.stringify(DB)});});
    await p.goto('http://localhost:8781/');await p.waitForTimeout(700);
    await p.evaluate(()=>{__sijal.act('setBack');__sijal.UI.prof.name='أنا';__sijal.act('quick');__sijal.act('go');});await p.waitForTimeout(1500);
    await p.evaluate(()=>{const S=__sijal,g=S.G,W=g.W;let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%W,y=(i/W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]>2&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>200))sp=i;}S.tap(sp,0,0);S.run(20);});
    await p.waitForTimeout(3000);const ms=await p.evaluate(()=>__sijal.UI.prof.ms);
    await p.evaluate(()=>{__sijal.UI.prof.wins=7;__sijal.act('menu');});await p.waitForTimeout(300);
    const menuBtn=await p.evaluate(()=>!!document.querySelector('[data-a="lb"]'));await p.evaluate(()=>__sijal.act('lb'));await p.waitForTimeout(900);
    const byW=await p.evaluate(()=>[...document.querySelectorAll('.lbt>div:not(.lh)')].map(d=>d.textContent));await p.screenshot({path:process.argv[2]+'/lb-'+name+'.png'});
    await p.evaluate(()=>__sijal.act('lbS:h'));await p.waitForTimeout(900);const byH=await p.evaluate(()=>[...document.querySelectorAll('.lbt>div:not(.lh)')].map(d=>d.querySelector('span:nth-child(2)').textContent));
    const meRow=await p.evaluate(()=>(document.querySelector('.lbt .me')||{}).textContent);
    await p.evaluate(()=>__sijal.act('account'));await p.waitForTimeout(300);const acc=await p.evaluate(()=>document.querySelector('#help .stats').textContent);
    console.log(name,'ms counted',Math.round(ms),'| lb button',menuBtn,'| by wins',JSON.stringify(byW.map(x=>x.slice(0,22))),'| by hours',JSON.stringify(byH),'| me row',meRow,'| account',acc,errs.join('|')||'no errors');await ctx.close();}
  await b.close();srv.close();})();
