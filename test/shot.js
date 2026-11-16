// drives the built game in headless Chromium: node test/shot.js <outdir> [pc|mob]
const {chromium}=require('playwright');const path=require('path');
(async()=>{
  const out=process.argv[2],mob=process.argv[3]==='mob';
  const b=await chromium.launch();
  const ctx=await b.newContext(mob?{viewport:{width:400,height:820},deviceScaleFactor:1,hasTouch:true,isMobile:true}:{viewport:{width:1366,height:768},deviceScaleFactor:1});
  const pg=await ctx.newPage();const errs=[];
  pg.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,4).join('\n')));pg.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text());});
  await pg.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await pg.waitForTimeout(1500);
  const tag=mob?'m':'d';await pg.screenshot({path:`${out}/${tag}1-menu.png`});
  await pg.evaluate(()=>__sijal.act('custom'));await pg.waitForTimeout(300);await pg.screenshot({path:`${out}/${tag}2-setup.png`});
  await pg.evaluate(()=>__sijal.act('go'));await pg.waitForTimeout(1500);await pg.screenshot({path:`${out}/${tag}3-spawn.png`});
  // spawn on a valid tile near the map centre, then play a scripted opening
  const info=await pg.evaluate(()=>{const g=__sijal.G;let best=-1,bd=1e9;for(let i=0;i<g.N;i++){if(g.M.ter[i]<2||g.M.ter[i]===6||g.owner[i])continue;const x=i%g.W,y=(i/g.W)|0;let ok=true;for(const s of g.structs)if(s.type==='city'){const d=(s.x-x)**2+(s.y-y)**2;if(d<(s.owner?196:49))ok=false;}if(!ok)continue;const d=(x-g.W/2)**2+(y-g.H/2)**2;if(d<bd){bd=d;best=i;}}
    __sijal.tap(best,0,0);return{best,phase:__sijal.UI.phase,started:g.started,mob:__sijal.UI.mob};});
  console.log('spawn',JSON.stringify(info));
  await pg.evaluate(()=>{const g=__sijal.G,me=g.nations[g.human];for(let r=0;r<40;r++){__sijal.run(25);if(r%2===0){
      // attack neutral land toward the nearest neutral city
      let t=-1,bd=1e9;for(const s of g.structs)if(!s.dead&&s.type==='city'&&s.owner!==me.id){const d=(s.x-me.cx)**2+(s.y-me.cy)**2;if(d<bd){bd=d;t=s.i;}}
      __sijal.UI.ratio=.5;if(t>=0)__sijal.tap(t,0,0);}}});
  await pg.waitForTimeout(900);await pg.screenshot({path:`${out}/${tag}4-play.png`});
  const st=await pg.evaluate(()=>{const g=__sijal.G,me=g.nations[g.human];return{tick:g.tick,tiles:me.tiles,troops:Math.round(me.troops),gold:Math.round(me.gold),cities:me.cnt.city,alive:me.alive,atk:g.attacks.filter(k=>k.a===me.id).length,over:g.over};});
  console.log('state',JSON.stringify(st));
  // zoom in on the capital, open a nation card, enter build mode
  await pg.evaluate(()=>{const g=__sijal.G,me=g.nations[g.human];__sijal.act('home');const o=g.nations.find(n=>n&&n.alive&&!n.human);__sijal.act('nat:'+o.id);__sijal.act('b:city');});
  await pg.waitForTimeout(900);await pg.screenshot({path:`${out}/${tag}5-card.png`});
  await pg.evaluate(()=>{__sijal.act('closeCard');const g=__sijal.G;g.tick+=0;for(let i=0;i<60;i++)__sijal.run(50);});
  await pg.waitForTimeout(900);await pg.screenshot({path:`${out}/${tag}6-late.png`});
  const st2=await pg.evaluate(()=>{const g=__sijal.G,me=g.nations[g.human];return{tick:g.tick,season:g.season,tiles:me.tiles,alive:me.alive,over:g.over,era:me.era,phase:__sijal.UI.phase,screen:__sijal.UI.screen};});
  console.log('state2',JSON.stringify(st2));
  await pg.evaluate(()=>{const g=__sijal.G;if(!g.over){g.over={win:true,w:g.human,why:'dom'};g.ev.push({t:'over',win:true});}});
  await pg.waitForTimeout(2600);await pg.screenshot({path:`${out}/${tag}7-end.png`});
  await pg.evaluate(()=>{__sijal.act('toMenu');__sijal.act('how');});await pg.waitForTimeout(500);await pg.screenshot({path:`${out}/${tag}8-help.png`});
  console.log(errs.length?errs.join('\n'):'no errors');await b.close();
})();
