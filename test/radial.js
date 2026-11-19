// radial menu: phone tap and PC right click open it; centre attacks by land, ship by sea (grey when unreachable), red sword shows missiles
const {chromium,devices}=require('playwright'),path=require('path');const SH=process.argv[2];
(async()=>{const b=await chromium.launch();
  for(const [name,opts] of [['phone',{...devices['iPhone 13']}],['pc',{viewport:{width:1300,height:760}}]]){
    const ctx=await b.newContext(opts),p=await ctx.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await p.waitForTimeout(600);await p.evaluate(()=>{__sijal.UI.prof.type='continents';__sijal.act('setBack');__sijal.act('custom');__sijal.act('go');});await p.waitForTimeout(1800);
    const pre=await p.evaluate(()=>{const S=__sijal,g=S.G,W=g.W;let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%W,y=(i/W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]===2&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>200))sp=i;}S.tap(sp,0,0);S.run(300);
      const me=g.nations[g.human];me.troops=1e5;
      // a neutral tile next to my border (land) and a neutral coastal tile on another landmass (sea)
      let landT=-1,seaT=-1;const myLid=g.M.lid[me.cap.i];
      for(let i=0;i<g.N;i++){if(g.owner[i]||g.M.ter[i]<2)continue;const x=i%W,y=(i/W)|0;
        if(landT<0&&[i-1,i+1,i-W,i+W].some(j=>g.owner[j]===me.id))landT=i;
        if(seaT<0&&g.M.lid[i]!==myLid&&g.M.coastD[i]===1&&(x-me.cap.x)**2+(y-me.cap.y)**2<60*60)seaT=i;}
      const toScr=i=>{const r=document.querySelector('canvas').getBoundingClientRect();return{x:(i%W+.5-S.cam.x)*S.cam.z+r.width/2,y:(((i/W)|0)+.5-S.cam.y)*S.cam.z+r.height/2};};
      window.__T={landT,seaT};return{landT,seaT};});
    const open=async(i,right)=>p.evaluate(([i,right])=>{const S=__sijal,g=S.G;S.cam.tx=S.cam.x=i%g.W;S.cam.ty=S.cam.y=(i/g.W)|0;const r=document.querySelector('canvas').getBoundingClientRect();
      const cv=document.querySelector('canvas'),x=r.left+r.width/2,y=r.top+r.height/2,ev=(t,b)=>cv.dispatchEvent(new PointerEvent(t,{pointerId:7,clientX:x,clientY:y,button:b,pointerType:right?'mouse':'touch',isPrimary:true,bubbles:true}));
      ev('pointerdown',right?2:0);ev('pointerup',right?2:0);const e=document.querySelector('#radial');return{open:!!e&&!e.hidden,btns:[...document.querySelectorAll('#radial .rb')].map(b=>b.dataset.a+(b.classList.contains('off')?'(off)':''))};},[i,right]);
    const r1=await open(pre.landT,name==='pc');await p.waitForTimeout(250);await p.screenshot({path:SH+'/radial-'+name+'.png'});
    const a1=await p.evaluate(()=>{const S=__sijal,g=S.G,n0=g.attacks.length;S.act('radAtk');S.run(2);return{attacks:g.attacks.filter(k=>k.a===g.human).length,closed:document.querySelector('#radial').hidden};});
    let r2=null,a2=null;if(pre.seaT>=0){r2=await open(pre.seaT,name==='pc');a2=await p.evaluate(()=>{const S=__sijal,g=S.G;S.act('radSea');S.run(2);return{boats:g.boats.filter(b=>b.a===g.human).length};});}
    const fresh=await p.evaluate(()=>{const g=__sijal.G;for(let i=0;i<g.N;i++)if(!g.owner[i]&&g.M.ter[i]>=2&&g.M.ter[i]!==6)return i;return -1;});const r3=await open(fresh,name==='pc');const more=await p.evaluate(()=>{__sijal.act('radMore');return[...document.querySelectorAll('#radial .rb')].map(b=>b.dataset.a+(b.classList.contains('off')?'(off)':''));});
    await p.waitForTimeout(250);await p.screenshot({path:SH+'/radial2-'+name+'.png'});
    // tapping the map again closes it without acting
    const cl=await p.evaluate(()=>{const S=__sijal,g=S.G,cv=document.querySelector('canvas'),n=g.attacks.filter(k=>k.a===g.human).length,ev=t=>cv.dispatchEvent(new PointerEvent(t,{pointerId:9,clientX:30,clientY:300,pointerType:'touch',isPrimary:true,bubbles:true}));ev('pointerdown');ev('pointerup');S.run(1);return{closed:document.querySelector('#radial').hidden,noNewAttack:g.attacks.filter(k=>k.a===g.human).length<=n};});
    console.log(name,JSON.stringify(pre),'| land menu',JSON.stringify(r1),'| centre ->',JSON.stringify(a1),'| sea menu',JSON.stringify(r2&&r2.btns),'| ship ->',JSON.stringify(a2),'| more',JSON.stringify(more),'| outside tap',JSON.stringify(cl),errs.join('|')||'no errors');await ctx.close();}
  await b.close();})();
