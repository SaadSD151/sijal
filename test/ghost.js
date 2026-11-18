// a touch whose lift was never reported must not turn the next single finger into a pinch
const {chromium,devices}=require('playwright'),path=require('path');
(async()=>{const b=await chromium.launch(),c=await b.newContext({...devices['iPhone 13']}),p=await c.newPage(),e=[];p.on('pageerror',x=>e.push(x.message));
await p.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await p.waitForTimeout(600);await p.evaluate(()=>{__sijal.act('setBack');__sijal.act('quick');__sijal.act('go');});await p.waitForTimeout(2000);
const r=await p.evaluate(async()=>{const S=__sijal,g=S.G,W=g.W;let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%W,y=(i/W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]>2&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>200))sp=i;}S.tap(sp,0,0);S.run(30);
  const cv=document.querySelector('canvas'),ev=(t,id,x,y,prim)=>cv.dispatchEvent(new PointerEvent(t,{pointerId:id,clientX:x,clientY:y,pointerType:'touch',isPrimary:prim,bubbles:true}));
  ev('pointerdown',1,200,400,true); // finger lands, its lift is lost
  const z0=S.cam.z;ev('pointerdown',2,150,300,true);ev('pointermove',2,100,250,true);ev('pointermove',2,60,200,true);ev('pointerup',2,60,200,true);
  const zoomChanged=Math.abs(S.cam.z-z0)>1e-6;
  // now a plain tap in build mode must place
  const me=g.nations[g.human];me.gold=1e5;S.UI.mode='b:fort';let tgt=-1;for(let i=0;i<g.N;i++)if(g.owner[i]===me.id&&!S.cb(g,me,'fort',i)){tgt=i;break;}
  const n0=g.structs.length;const rect=cv.getBoundingClientRect(),sx=(tgt%W+.5-S.cam.x)*S.cam.z+rect.width/2+rect.left,sy=(((tgt/W)|0)+.5-S.cam.y)*S.cam.z+rect.height/2+rect.top;
  ev('pointerdown',3,sx,sy,true);ev('pointerup',3,sx,sy,true);
  return{zoomChanged,placedOrPending:g.structs.length>n0||S.UI.pend>=0||!S.UI.mode};});
console.log(JSON.stringify(r),e.join('|')||'no errors');
// real two-finger pinch still zooms
const z=await p.evaluate(()=>{const S=__sijal,cv=document.querySelector('canvas'),ev=(t,id,x,y,prim)=>cv.dispatchEvent(new PointerEvent(t,{pointerId:id,clientX:x,clientY:y,pointerType:'touch',isPrimary:prim,bubbles:true}));S.UI.mode=null;
  const z0=S.cam.z;ev('pointerdown',10,180,400,true);ev('pointerdown',11,220,400,false);ev('pointermove',11,300,400,false);ev('pointermove',10,100,400,true);ev('pointerup',11,300,400,false);ev('pointerup',10,100,400,true);return S.cam.z/z0;});
console.log('pinch zoom factor',z.toFixed(2));await b.close();})();
