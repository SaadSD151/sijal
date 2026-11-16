const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch(),pg=await(await b.newContext({viewport:{width:1366,height:768}})).newPage(),errs=[];pg.on('pageerror',e=>errs.push(e.message+(e.stack||'').split('\n')[1]));
  await pg.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await pg.waitForTimeout(700);await pg.evaluate(()=>(__sijal.act('quick'),__sijal.act('go')));await pg.waitForTimeout(1500);
  const r=await pg.evaluate(()=>{const S=__sijal,g=S.G;let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%g.W,y=(i/g.W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]>6&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>300))sp=i;}S.tap(sp,0,0);
    const me=g.nations[g.human];let found=0;
    for(let r=0;r<200&&!found;r++){me.troops=3e6;S.UI.ratio=.2;let t=-1,bd=1e9;for(let i=0;i<g.N;i+=11){if(g.M.ter[i]<2||g.owner[i])continue;const d=(i%g.W-me.cx)**2+(((i/g.W)|0)-me.cy)**2;if(d<bd){bd=d;t=i;}}if(t>=0)S.tap(t,0,0);S.run(30);
      for(const n of g.nations)if(n&&n.alive&&n.id!==me.id&&canAnnexT(n.id))found=n.id;}
    function canAnnexT(d){const K=g.nations.length,nb=g.nb;if(nb[d*K+me.id]<1)return false;for(let x=0;x<K;x++)if(x!==me.id&&x!==d&&nb[d*K+x]>0)return false;return true;}
    return{found,tick:g.tick,tiles:me.tiles};});
  await pg.waitForTimeout(700);const chips=await pg.evaluate(()=>document.querySelectorAll('.anx').length);await pg.screenshot({path:process.argv[2]+'/anx.png'});
  const r2=await pg.evaluate((id)=>{const g=__sijal.G,me=g.nations[g.human],n=g.nations[id];if(!n)return null;const t0=me.tiles,nt=n.tiles,tr=me.troops;__sijal.act('annex:'+id);return{gain:me.tiles-t0,nt,alive:n.alive,lost:tr-me.troops,cities:me.cnt.city};},r.found);
  console.log(JSON.stringify({r,chips,r2}),errs.join('|')||'no errors');await b.close();})();
