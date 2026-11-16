const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch(),pg=await b.newPage({viewport:{width:1200,height:700}}),errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await pg.waitForTimeout(600);await pg.evaluate(()=>{__sijal.act('quick');__sijal.act('go');});await pg.waitForTimeout(2500);
  const r=await pg.evaluate(()=>{const S=__sijal,g=S.G;let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%g.W,y=(i/g.W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]===2&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>300))sp=i;}S.tap(sp,0,0);S.run(60);
    const me=g.nations[g.human];me.troops=2e5;const o=g.nations.find(n=>n&&n.alive&&!n.human&&!n.minor&&n.coast>3);const b0=g.boats.length;S.act('nat:'+o.id);const has=!!document.querySelector('[data-a="sea:'+o.id+'"]');S.act('sea:'+o.id);return{has,boats:g.boats.length-b0,cost:[MSLc('rocket'),MSLc('nuke'),MSLc('doom')]};function MSLc(k){return document.querySelector('#bb_'+k)?1:0;}});
  console.log(JSON.stringify(r),errs.join('|')||'no errors');await b.close();})();
