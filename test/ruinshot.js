const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch(),pg=await b.newPage({viewport:{width:1100,height:700}}),errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await pg.waitForTimeout(600);await pg.evaluate(()=>{__sijal.act('setBack');__sijal.act('quick');__sijal.act('go');});await pg.waitForTimeout(2500);
  await pg.evaluate(()=>{const S=__sijal,g=S.G;let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%g.W,y=(i/g.W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]>2&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>200))sp=i;}S.tap(sp,0,0);S.run(200);
    const me=g.nations[g.human];const cs=g.structs.filter(s=>!s.dead&&s.type==='city'&&s.owner!==me.id).sort((a,b)=>((a.x-me.cx)**2+(a.y-me.cy)**2)-((b.x-me.cx)**2+(b.y-me.cy)**2));
    const t=cs[0];t.level=3;t.ruin=g.tick+400;g.ruins.push({x:cs[1].x+3,y:cs[1].y+3,until:g.tick+1500});S.cam.tx=S.cam.x=t.x;S.cam.ty=S.cam.y=t.y;S.cam.tz=S.cam.z=7;});
  await pg.waitForTimeout(1200);await pg.screenshot({path:process.argv[2]+'/ruin.png'});console.log(errs.join('|')||'no errors');await b.close();})();
