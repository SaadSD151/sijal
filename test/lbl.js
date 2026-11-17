// count overlapping nation labels on a crowded zoomed-in phone view
const {chromium,devices}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch(),pg=await(await b.newContext({...devices['iPhone 13']})).newPage(),errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await pg.waitForTimeout(600);await pg.evaluate(()=>{__sijal.act('setBack');__sijal.act('quick');__sijal.act('go');});await pg.waitForTimeout(2500);
  await pg.evaluate(()=>{const S=__sijal,g=S.G;let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%g.W,y=(i/g.W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]>2&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>200))sp=i;}S.tap(sp,0,0);
    const me=g.nations[g.human];for(let r=0;r<30;r++){me.troops=Math.max(me.troops,4e5);let t=-1,bd=1e9;for(let i=0;i<g.N;i+=5){if(g.M.ter[i]<2||g.owner[i]===me.id||(g.owner[i]&&g.nations[g.owner[i]].ally[me.id]))continue;const d=(i%g.W-me.cx)**2+(((i/g.W)|0)-me.cy)**2;if(d<bd){bd=d;t=i;}}S.UI.ratio=.3;if(t>=0)S.tap(t,0,0);S.act('closeCard');S.run(60);}S.act('closeCard');
    // zoom so our label and the biggest neighbour are both on screen
    const K=g.nations.length,nb=g.nations.filter(n=>n&&n.alive&&n.id!==me.id&&!n.minor).sort((a,b)=>g.nb[me.id*K+b.id]-g.nb[me.id*K+a.id])[0];
    S.cam.tx=S.cam.x=(me.cx+nb.cx)/2;S.cam.ty=S.cam.y=(me.cy+nb.cy)/2;S.cam.tz=S.cam.z=Math.min(390/(Math.abs(me.cx-nb.cx)+20),6);});
  await pg.waitForTimeout(3500);await pg.screenshot({path:process.argv[2]+'/lbl.png'});
  const ov=await pg.evaluate(()=>{const L=__sijal.R.lb||[],me=__sijal.G.human;let o=0;for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const a=L[i],b=L[j];if(Math.abs(a.x-b.x)<a.hw+b.hw&&a.t<b.b&&a.b>b.t)o++;}return{labels:L.length,overlaps:o,mineShown:L.some(l=>l.id===me)};});console.log(JSON.stringify(ov));
  console.log(errs.join('|')||'no errors');await b.close();})();
