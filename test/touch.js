// real touch tap in build mode on a phone-sized page: the ghost must stay after the finger lifts
const {chromium,devices}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch(),ctx=await b.newContext({...devices['iPhone 13']}),pg=await ctx.newPage(),errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await pg.waitForTimeout(700);await pg.evaluate(()=>{__sijal.act('setBack');__sijal.act('quick');__sijal.act('go');});await pg.waitForTimeout(2500);
  const pt=await pg.evaluate(()=>{const S=__sijal,g=S.G;let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%g.W,y=(i/g.W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]>2&&S.G.M.ter[i]!==6&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>200))sp=i;}S.tap(sp,0,0);const g0=g.nations[g.human];g0.troops=3e5;for(let r=0;r<6;r++){let tt=-1,bd=1e9;for(let i=0;i<g.N;i+=3){if(g.M.ter[i]<2||g.owner[i])continue;const d=(i%g.W-g0.cx)**2+(((i/g.W)|0)-g0.cy)**2;if(d<bd){bd=d;tt=i;}}S.UI.ratio=.5;if(tt>=0)S.tap(tt,0,0);S.run(60);}
    const me=g.nations[g.human];me.gold=9e4;S.act('home');S.cam.x=S.cam.tx;S.cam.y=S.cam.ty;S.cam.z=S.cam.tz;S.act('b:fort');
    let t=-1;for(let i=0;i<g.N;i++)if(g.owner[i]===me.id&&!S.cb(g,me,'fort',i)&&(i%g.W-me.cap.x)**2+(((i/g.W)|0)-me.cap.y)**2>20){t=i;break;}
    const r=document.querySelector('#cv').getBoundingClientRect();return{phase:S.UI.phase,scr:S.UI.screen,tiles:me.tiles,sp,x:r.left+(t%g.W+.5-S.cam.x)*S.cam.z+r.width/2,y:r.top+(((t/g.W)|0)+.5-S.cam.y)*S.cam.z+r.height/2,t};});
  await pg.touchscreen.tap(pt.x,pt.y);await pg.waitForTimeout(500);
  const st=await pg.evaluate(()=>({pend:__sijal.UI.pend,hover:__sijal.UI.hover,confirm:!!document.querySelector('.ts.cfm')}));
  await pg.screenshot({path:process.argv[2]+'/touch.png'});console.log(JSON.stringify(pt),JSON.stringify(st),errs.join('|')||'no errors');await b.close();})();
