// real accounts against a fake Firebase: guest progress is kept when making an account, a second device signs in and merges its guest wins, both devices add up
const {chromium,devices}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
(async()=>{const html=fs.readFileSync(path.resolve(__dirname,'../dist/site/index.html'),'utf8').replace(/const LB_DB='[^']*',LB_KEY='[^']*';/,"const LB_DB='https://fake-db.test',LB_KEY='k';");
  const srv=http.createServer((q,r)=>{r.setHeader('content-type','text/html; charset=utf-8');r.end(html);}).listen(8782);
  const DB={lb:{},users:{}},ACC={},TOK={};let n=0;const tok=uid=>{const t='t'+(++n);TOK[t]=uid;return t;};
  const sv=(old,v)=>v&&typeof v==='object'&&v['.sv']?(v['.sv']==='timestamp'?Date.now():(old||0)+v['.sv'].increment):v;
  const route=async ctx=>{
    await ctx.route('https://identitytoolkit.googleapis.com/**',rt=>{const u=rt.request().url(),b=JSON.parse(rt.request().postData()||'{}');let j;
      if(u.includes('signUp')&&b.email){if(ACC[b.email])j={error:{message:'EMAIL_EXISTS'}};else{const uid='acc'+(++n);ACC[b.email]={pw:b.password,uid};j={idToken:tok(uid),refreshToken:'r'+uid,localId:uid,expiresIn:'3600'};}}
      else if(u.includes('signUp')){const uid='anon'+(++n);j={idToken:tok(uid),refreshToken:'r'+uid,localId:uid,expiresIn:'3600'};}
      else if(u.includes('accounts:update')){const uid=TOK[b.idToken];if(ACC[b.email])j={error:{message:'EMAIL_EXISTS'}};else{ACC[b.email]={pw:b.password,uid};j={idToken:tok(uid),refreshToken:'r'+uid,localId:uid,expiresIn:'3600'};}}
      else if(u.includes('signInWithPassword')){const a=ACC[b.email];j=a&&a.pw===b.password?{idToken:tok(a.uid),refreshToken:'r'+a.uid,localId:a.uid,expiresIn:'3600'}:{error:{message:'INVALID_LOGIN_CREDENTIALS'}};}
      rt.fulfill({status:j.error?400:200,contentType:'application/json',body:JSON.stringify(j)});});
    await ctx.route('https://fake-db.test/**',rt=>{const u=new URL(rt.request().url()),m=rt.request().method(),[,col,f]=u.pathname.split('/'),id=f&&f.replace('.json',''),auth=TOK[u.searchParams.get('auth')];
      if(col==='lb.json')return rt.fulfill({contentType:'application/json',body:JSON.stringify(DB.lb)});
      if(m!=='GET'&&auth!==id)return rt.fulfill({status:401,body:'{"error":"Permission denied"}'});
      const b=rt.request().postData()?JSON.parse(rt.request().postData()):null;
      if(m==='PATCH'){const o=DB[col][id]||(DB[col][id]={});for(const k in b)o[k]=sv(o[k],b[k]);}else if(m==='PUT'){const o={};for(const k in b)o[k]=sv(0,b[k]);DB[col][id]=o;}else if(m==='DELETE')delete DB[col][id];
      rt.fulfill({contentType:'application/json',body:JSON.stringify(DB[col][id]||null)});});};
  const b=await chromium.launch(),errs=[];
  const dev=async(opts,prof)=>{const c=await b.newContext(opts);await route(c);await c.addInitScript(()=>Object.defineProperty(navigator,'webdriver',{get:()=>false}));const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8782/');
    await p.evaluate(x=>localStorage.setItem('sijal.v1',JSON.stringify(Object.assign({seen:'2.8'},x))),prof);await p.reload();await p.waitForTimeout(3500);return p;};
  const S=p=>p.evaluate(()=>{const q=__sijal.UI.prof;return{w:q.wins,g:q.games,user:(q.fb||{}).user||'',name:q.name};});
  const act=async(p,a,u,pw)=>{await p.evaluate(()=>__sijal.act('account'));await p.waitForTimeout(200);if(u!=null){await p.fill('#inUser',u);await p.fill('#inPass',pw);}await p.evaluate(a=>__sijal.act(a),a);await p.waitForTimeout(1500);return p.evaluate(()=>(document.querySelector('#help .accb .good,#help .accb .bad')||{}).textContent||'');};
  const win=async p=>{await p.evaluate(()=>{const q=__sijal.UI.prof;q.wins++;q.games++;const d=q.pend||(q.pend={});d.wins=(d.wins||0)+1;d.games=(d.games||0)+1;});};
  const phone=await dev(devices['iPhone 13'],{name:'سعد',wins:16,games:30,xp:900});
  console.log('phone guest synced to cloud:',JSON.stringify(Object.values(DB.users)));
  console.log('phone: short pw ->',await act(phone,'accReg','saad','123'));
  console.log('phone: create ->',await act(phone,'accReg','saad','secret1'),JSON.stringify(await S(phone)));
  const pc=await dev({viewport:{width:1300,height:760}},{name:'pc guest',wins:2,games:3});
  console.log('pc: wrong pw ->',await act(pc,'accIn','saad','nope123'));
  console.log('pc: sign in ->',await act(pc,'accIn','saad','secret1'),JSON.stringify(await S(pc)));
  console.log('second device making same name ->',await act(await dev({viewport:{width:900,height:700}},{}),'accReg','saad','other12'));
  await win(phone);await win(pc);await phone.evaluate(()=>__sijal.act('board'));await phone.waitForTimeout(1500);await pc.evaluate(()=>__sijal.act('board'));await pc.waitForTimeout(1500);await phone.evaluate(()=>__sijal.act('board'));await phone.waitForTimeout(1500);
  console.log('after a win on each: phone',JSON.stringify(await S(phone)),'pc',JSON.stringify(await S(pc)));
  console.log('leaderboard rows:',JSON.stringify(Object.values(DB.lb).map(r=>r.n+':'+r.w)));
  console.log('pc sign out ->',await act(pc,'accOut'),JSON.stringify(await S(pc)),'| cloud still',JSON.stringify(Object.values(DB.users).map(u=>u.w)));
  await pc.evaluate(()=>__sijal.act('account'));await pc.waitForTimeout(300);await pc.screenshot({path:process.argv[2]+'/acct-pc.png'});
  await phone.evaluate(()=>__sijal.act('account'));await phone.waitForTimeout(300);await phone.screenshot({path:process.argv[2]+'/acct-phone.png'});
  console.log(errs.join('|')||'no errors');await b.close();srv.close();})();
