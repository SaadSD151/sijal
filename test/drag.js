// drag the collapsed attack-type picker with mouse (PC) and finger (phone); it must move, stay put after reload, and not toggle
const {chromium,devices}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();
  for(const [name,opts] of [['pc',{viewport:{width:1300,height:760}}],['phone',{...devices['iPhone 13']}]]){
    const ctx=await b.newContext(opts),pg=await ctx.newPage(),errs=[];pg.on('pageerror',e=>errs.push(e.message));
    await pg.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await pg.waitForTimeout(600);await pg.evaluate(()=>{__sijal.act('setBack');__sijal.act('quick');__sijal.act('go');});await pg.waitForTimeout(2500);
    await pg.evaluate(()=>{const S=__sijal,g=S.G;let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%g.W,y=(i/g.W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]>2&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>200))sp=i;}S.tap(sp,0,0);S.UI.prof.amHide=false;S.UI.prof.amPos=null;S.act('amT');});
    await pg.waitForTimeout(300);const r0=await pg.evaluate(()=>{const r=document.querySelector('#amode').getBoundingClientRect();return{x:r.left,y:r.top,hide:__sijal.UI.prof.amHide};});
    const h=await pg.$('#amode .amh'),bb=await h.boundingBox(),sx=bb.x+bb.width/2,sy=bb.y+bb.height/2;
    if(name==='pc'){await pg.mouse.move(sx,sy);await pg.mouse.down();await pg.mouse.move(sx-200,sy-250,{steps:8});await pg.mouse.up();}
    else{const c=await ctx.newCDPSession(pg);const tp=(type,x,y)=>c.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});await tp('touchStart',sx,sy);for(let k=1;k<=8;k++)await tp('touchMove',sx-k*15,sy-k*30);await tp('touchEnd');}
    await pg.waitForTimeout(500);const r1=await pg.evaluate(()=>{const r=document.querySelector('#amode').getBoundingClientRect();return{x:r.left,y:r.top,hide:__sijal.UI.prof.amHide,pos:__sijal.UI.prof.amPos};});
    console.log(name,'start',JSON.stringify(r0),'after drag',JSON.stringify(r1),errs.join('|')||'no errors');await ctx.close();}
  await b.close();})();
