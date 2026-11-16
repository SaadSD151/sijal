const {chromium}=require('playwright');const path=require('path');
(async()=>{const out=process.argv[2],b=await chromium.launch(),pg=await(await b.newContext({viewport:{width:820,height:380},hasTouch:true,isMobile:true})).newPage(),errs=[];
  pg.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await pg.goto('file://'+path.resolve(__dirname,'../dist/sijal-mobile.html'));await pg.waitForTimeout(900);await pg.screenshot({path:`${out}/l1-menu.png`});
  await pg.evaluate(()=>(__sijal.act('quick'),__sijal.act('go')));await pg.waitForTimeout(1300);
  await pg.evaluate(()=>{const S=__sijal,g=S.G;let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%g.W,y=(i/g.W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]>3&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>250))sp=i;}S.tap(sp,0,0);
    const me=g.nations[g.human];for(let r=0;r<10;r++){let t=-1,bd=1e9;for(let i=0;i<g.N;i+=5){if(g.M.ter[i]<2||g.owner[i])continue;const d=(i%g.W-me.cx)**2+(((i/g.W)|0)-me.cy)**2;if(d<bd){bd=d;t=i;}}if(t>=0)S.tap(t,0,0);S.run(60);}
    const o=g.nations.find(n=>n&&n.alive&&!n.human);S.act('nat:'+o.id);});
  await pg.waitForTimeout(800);await pg.screenshot({path:`${out}/l2-play.png`});console.log(errs.length?errs.join('\n'):'no errors');await b.close();})();
