// battle pass: locked below 10k, tiers by experience, equip a pattern and a building style, both show up in a match
const {chromium,devices}=require('playwright'),path=require('path');const SH=process.argv[2];
(async()=>{const b=await chromium.launch(),c=await b.newContext({...devices['iPhone 13']}),p=await c.newPage(),e=[];p.on('pageerror',x=>e.push(x.message));
await p.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await p.evaluate(()=>localStorage.setItem('sijal.v1',JSON.stringify({xp:4000,seen:'9.9'})));await p.reload();await p.waitForTimeout(800);
const lock=await p.evaluate(()=>{__sijal.act('setBack');__sijal.act('pass');return{got:document.querySelectorAll('.bpc.got').length,head:document.querySelector('#help .keys:nth-of-type(2)').textContent};});
await p.evaluate(()=>{__sijal.UI.prof.xp=16500;__sijal.UI.prof.passT=7;__sijal.act('pass');});await p.waitForTimeout(200);
const open=await p.evaluate(()=>{const got=document.querySelectorAll('.bpc.got').length;__sijal.act('skin:pat:checker');__sijal.act('skin:bld:gold');__sijal.act('skin:bld:fire');__sijal.act('skin:bld:gold');return{got,eq:document.querySelectorAll('.bpc.eq').length,skin:JSON.stringify(__sijal.UI.prof.skin)};});
await p.screenshot({path:SH+'/pass.png'});
await p.evaluate(()=>{__sijal.act('menu');__sijal.act('quick');__sijal.act('goQ');});await p.waitForTimeout(1500);
const m=await p.evaluate(()=>{const S=__sijal,g=S.G,W=g.W;let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%W,y=(i/W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]>3&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>300))sp=i;}S.tap(sp,0,0);S.run(200);const me=g.nations[g.human];me.gold=1e5;
  let fi=-1;for(let i=0;i<g.N;i++)if(g.owner[i]===me.id&&!S.cb(g,me,'fort',i)){fi=i;break;}S.fn.build(g,me,'fort',fi);S.run(70);S.cam.tx=S.cam.x=me.cap.x;S.cam.ty=S.cam.y=me.cap.y;S.cam.tz=S.cam.z=5;return{pat:me.pat,bld:me.bld};});
await p.waitForTimeout(600);await p.screenshot({path:SH+'/pass-match.png'});
console.log('locked',JSON.stringify(lock),'| open',JSON.stringify(open),'| in match',JSON.stringify(m),e.join('|')||'no errors');await b.close();})();
