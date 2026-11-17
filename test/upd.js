// an open game must notice a newer version.json and offer a refresh
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
(async()=>{let ver='same';const html=fs.readFileSync(path.resolve(__dirname,'../dist/site/index.html'));const real=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../dist/site/version.json'))).build;
  const srv=http.createServer((q,r)=>{if(q.url.startsWith('/version.json')){r.setHeader('content-type','application/json');r.end(JSON.stringify({build:ver==='same'?real:'newer123'}));return;}r.setHeader('content-type','text/html; charset=utf-8');r.end(html);}).listen(8773);
  const b=await chromium.launch(),p=await b.newPage(),e=[];p.on('pageerror',x=>e.push(x.message));await p.goto('http://localhost:8773/');await p.waitForTimeout(800);await p.evaluate(()=>__sijal.act('setBack'));
  await p.evaluate(()=>{document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(800);const before=await p.evaluate(()=>!!document.querySelector('#upd'));
  ver='new';await p.evaluate(()=>{document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(800);
  const after=await p.evaluate(()=>document.querySelector('#upd')&&document.querySelector('#upd').textContent);await p.screenshot({path:process.argv[2]+'/upd.png'});
  console.log('notice with same version:',before,'| with newer version:',after,e.join('|')||'no errors');await b.close();srv.close();})();
