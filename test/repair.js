// a city hit by a missile can be repaired for gold: price follows the time left and the level, the ruin ends at once, not enough gold is refused;
// the bot repairs its capital when it has spare gold; the building card shows the repair button and it works
const fs=require('fs'),vm=require('vm'),path=require('path');const src=['core','map','game','ai'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
globalThis.ok=(c,m)=>{console.log((c?'ok  ':'FAIL ')+m);if(!c)process.exitCode=1;};
vm.runInThisContext('(function(){"use strict";'+src+`
const g=newGame({w:200,h:140,seed:4,type:'flat',bots:0,diff:1,demo:true,minors:0});startGame(g);
const A=addNation(g,{fac:'hawks',pers:'war',color:[200,60,60],nameIdx:0});A.alive=true;const W=g.W;
for(let y=50;y<90;y++)for(let x=80;x<120;x++)setOwner(g,y*W+x,A.id);
A.gold=1e5;A.era=4;build(g,A,'city',70*W+100);const s=g.structs[g.structAt[70*W+100]-1];s.build=0;s.level=3;
hitCity(g,s,{lvl:1,ruin:400},0);
ok(s.ruin>g.tick&&s.level===2,'rocket leaves the city damaged ('+(s.ruin-g.tick)+' ticks)');
const c=repairCost(g,s);ok(c>=500&&c<=1500,'price for a 40 s repair of a level 2 city: '+c);
A.gold=c-1;ok(repairCity(g,A,s)==='gold'&&s.ruin>g.tick,'not enough gold is refused');
A.gold=c+10;ok(repairCity(g,A,s)===0&&!(s.ruin>g.tick)&&A.gold===10,'repair takes the gold and ends the damage');
ok(repairCity(g,A,s)==='no','an intact city cannot be repaired');
hitCity(g,s,{lvl:1,ruin:900},0);const big=repairCost(g,s);ok(big>c,'a nuke ruin costs more to fix ('+big+')');
for(let k=0;k<100;k++)tick(g);ok(repairCost(g,s)<big,'the price drops as the city rebuilds on its own');
// the bot fixes its own capital when it is rich
const B=addNation(g,{fac:'hawks',pers:'war',color:[60,60,200],nameIdx:1});B.alive=true;for(let y=10;y<40;y++)for(let x=10;x<40;x++)setOwner(g,y*W+x,B.id);
B.gold=1e5;B.era=4;build(g,B,'city',25*W+25);const bc=g.structs[g.structAt[25*W+25]-1];bc.build=0;bc.capital=true;B.cap=bc;hitCity(g,bc,{lvl:1,ruin:900},0);
let fixedAt=-1;for(let k=0;k<400;k++){g.over=null;tick(g);if(!(bc.ruin>g.tick)){fixedAt=k;break;}}ok(fixedAt>=0&&fixedAt<200,'a rich bot repairs its bombed capital (after '+fixedAt+' ticks of a 900-tick ruin)');
})();`);
// the building card
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch(),errs=[];const pg=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});pg.on('pageerror',e=>errs.push(e.message));
  await pg.addInitScript(()=>localStorage.setItem('sijal.v1',JSON.stringify({seen:'9.9',sound:false,music:false,games:9})));
  await pg.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await pg.waitForTimeout(1500);
  await pg.evaluate(()=>{const S=__sijal;Object.assign(S.UI.prof,{size:0,botsN:6,diff:1,type:'continents'});S.act('go');});await pg.waitForTimeout(500);
  const r=await pg.evaluate(()=>{const S=__sijal,g=S.G;let me=g.nations[g.human];for(let i=g.W*20;i<g.N&&!(me&&me.cap);i+=37){if(g.M.ter[i]!==2||g.owner[i]||g.structAt[i])continue;S.tap(i,0,0);me=g.nations[g.human];}S.UI.paused=true;
    const c=me.cap;c.ruin=g.tick+400;me.gold=5000;return {i:c.i};});
  await pg.evaluate(()=>{const S=__sijal,g=S.G;S.act('closeCard');});
  await pg.evaluate(()=>{const S=__sijal,g=S.G,me=g.nations[g.human];S.UI.bs=null;window.__open&&0;});
  // open the card the way a tap on your own building does
  await pg.evaluate(()=>{const S=__sijal,g=S.G,me=g.nations[g.human];S.act('bOpen:'+me.cap.i);});await pg.waitForTimeout(300);
  let txt=await pg.$eval('#card',e=>e.hidden?'':e.innerText).catch(()=>'');
  if(!/أصلحها/.test(txt)){await pg.evaluate(()=>{const S=__sijal,g=S.G,me=g.nations[g.human];S.tap(me.cap.i,0,0);});await pg.waitForTimeout(400);txt=await pg.$eval('#card',e=>e.hidden?'':e.innerText).catch(()=>'');}
  ok(/أصلحها الحين/.test(txt)&&/متضررة/.test(txt),'card shows the repair button: '+txt.replace(/\s+/g,' ').slice(0,90));
  await pg.screenshot({path:process.argv[2]||'/tmp/repair.png'});
  await pg.click('[data-a="fixB"]').catch(()=>{});await pg.evaluate(()=>__sijal.run(2));await pg.waitForTimeout(300);
  const after=await pg.evaluate(()=>{const g=__sijal.G,me=g.nations[g.human];return{ruin:me.cap.ruin>g.tick,gold:Math.round(me.gold)};});
  ok(!after.ruin&&after.gold<5000,'tapping repair fixes it and charges gold '+JSON.stringify(after));
  ok(!errs.length,'no page errors '+errs.join('|'));await b.close();})();
