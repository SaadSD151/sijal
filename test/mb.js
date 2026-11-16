const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch(),pg=await(await b.newContext({viewport:{width:400,height:820},hasTouch:true,isMobile:true})).newPage(),errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await pg.waitForTimeout(600);await pg.evaluate(()=>{__sijal.act('quick');__sijal.act('go');});await pg.waitForTimeout(2500);
  const r=await pg.evaluate(()=>{const S=__sijal,g=S.G;let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%g.W,y=(i/g.W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]===3&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>300))sp=i;}S.tap(sp,0,0);S.run(30);
    const me=g.nations[g.human];me.gold=9e4;me.era=4;const o={};
    // far inland tile → message before any confirm button
    let far=-1,near=-1;for(let i=0;i<g.N;i++)if(g.owner[i]===me.id&&!g.structAt[i]){if(g.M.coastD[i]>=3&&far<0)far=i;}
    S.act('b:port');S.tap(far,0,0);o.farConfirm=!!document.querySelector('.ts.cfm');o.farMsg=[...document.querySelectorAll('.ts')].map(e=>e.textContent).join('|');
    // a fort anywhere on own land → confirm appears with ghost
    S.act('b:port');S.act('b:fort');let t=-1;for(let i=0;i<g.N;i++)if(g.owner[i]===me.id&&!__sijal.cb(g,me,'fort',i)){t=i;break;}S.tap(t,0,0);o.fortConfirm=!!document.querySelector('.ts.cfm');o.pend=S.UI.pend===t;return o;});
  await pg.waitForTimeout(400);await pg.screenshot({path:process.argv[2]+'/mb.png'});
  const n=await pg.evaluate(()=>{const g=__sijal.G,a=g.structs.length;__sijal.act('cfm');return g.structs.length-a;});
  console.log(JSON.stringify(r),'built',n,errs.join('|')||'no errors');await b.close();})();
