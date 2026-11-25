const {chromium}=require('playwright'),path=require('path');(async()=>{const O=process.argv[2];const b=await chromium.launch();const c=await b.newContext({viewport:{width:360,height:640},deviceScaleFactor:3,isMobile:true,hasTouch:true});const p=await c.newPage();
await p.addInitScript(()=>localStorage.setItem('sijal.v1',JSON.stringify({seen:'9.9',sound:false,music:false,games:40,wins:12,xp:6200,name:'سعد'})));
await p.goto('file:///home/user/sijal/dist/sijal.html');await p.waitForTimeout(2500);await p.evaluate(()=>{for(const d of document.querySelectorAll('.ts'))d.remove();__sijal.act('menu');});await p.waitForTimeout(400);
await p.evaluate(()=>{for(const a of document.getAnimations())a.pause();});
for(let f=0;f<150;f++){await p.evaluate(ms=>{for(const a of document.getAnimations())a.currentTime=ms;},f*1000/30+400);await p.screenshot({path:path.join(O,'menu',String(f).padStart(5,'0')+'.jpg'),type:'jpeg',quality:90});}
await p.evaluate(()=>{const S=__sijal,L=S.LOBBY;L.on=true;L.ok=true;L.list=[{code:'A1',name:'شلة الرياض',n:12,m:32,type:'continents',size:1,diff:2},{code:'B2',name:'حرب الشباب',n:24,m:32,type:'islands',size:2,diff:3},{code:'C3',name:'تحدي الليل',n:6,m:16,type:'pangaea',size:0,diff:1},{code:'D4',name:'أبطال جدة',n:9,m:12,type:'highlands',size:1,diff:2},{code:'E5',name:'دوري الخميس',n:15,m:20,type:'continents',size:1,diff:2}];
  S.act('online');document.querySelectorAll('#rooms .ping').forEach((e,i)=>{e.textContent=['24ms','38ms','19ms','52ms','31ms'][i];e.className='ping good';});});await p.waitForTimeout(500);await p.screenshot({path:path.join(O,'online.jpg'),type:'jpeg',quality:92});
await p.evaluate(()=>__sijal.act('suggest'));await p.waitForTimeout(500);await p.screenshot({path:path.join(O,'suggest.jpg'),type:'jpeg',quality:92});
await b.close();})();
