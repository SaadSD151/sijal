// army upgrades: bought through a command (works online), cost gold, need the right age, cap at 5;
// soldiers raise the army cap, tanks cut attack losses, planes speed attacks up; no tank camp any more
const fs=require('fs'),vm=require('vm'),path=require('path');const src=['core','map','game','ai'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
globalThis.ok=(c,m)=>{console.log((c?'ok  ':'FAIL ')+m);if(!c)process.exitCode=1;};
vm.runInThisContext('(function(){"use strict";'+src+`
ok(!ST.camp,'the tank camp is gone');
function arena(up){const g=newGame({w:200,h:120,seed:6,type:'flat',bots:0,diff:1,demo:true,minors:0});startGame(g);const W=g.W;for(let i=0;i<g.N;i++)if(g.M.ter[i]>=2)g.M.ter[i]=2;
  const A=addNation(g,{fac:'hawks',pers:'war',color:[200,60,60],nameIdx:0}),D=addNation(g,{fac:'hawks',pers:'war',color:[60,60,200],nameIdx:1});A.alive=D.alive=true;
  for(let y=40;y<80;y++)for(let x=40;x<140;x++)setOwner(g,y*W+x,x<80?A.id:D.id);A.up=Object.assign({sol:0,tank:0,air:0},up);economy(g);D.troops=20000;A.troops=40000;
  const k=launchAttack(g,A.id,D.id,1,-1,-1);for(let t=0;t<60;t++){tickAttacks(g);g.tick++;}return{gain:k.gain,left:k.troops,lost:40000-k.troops};}
const base=arena({}),tk=arena({tank:5}),air=arena({air:5});
ok(tk.lost/Math.max(1,tk.gain)<base.lost/Math.max(1,base.gain)*.8,'tanks: fewer troops lost per tile ('+(base.lost/base.gain).toFixed(1)+' -> '+(tk.lost/tk.gain).toFixed(1)+')');
ok(air.gain>base.gain*1.3,'planes: more ground in the same time ('+base.gain+' -> '+air.gain+')');
const g=newGame({w:200,h:120,seed:6,type:'flat',bots:0,diff:1,demo:true,minors:0});startGame(g);const A=addNation(g,{fac:'hawks',pers:'war',color:[200,60,60],nameIdx:0});A.alive=true;for(let i=0;i<3000;i++)if(g.M.ter[i]>=2)setOwner(g,i,A.id);
A.era=1;A.gold=100;ok(armyUp(g,A,'sol')==='gold','not enough gold');A.gold=1e6;ok(armyUp(g,A,'tank')==='era','tanks need a later age');
ok(armyUp(g,A,'sol')===0&&A.up.sol===1&&A.gold===1e6-600,'soldiers level 1 costs 600');
for(let i=0;i<4;i++)armyUp(g,A,'sol');ok(A.up.sol===2,'age gates soldiers level 3 at age 2');A.era=4;for(let i=0;i<5;i++)armyUp(g,A,'sol');ok(A.up.sol===5&&armyUp(g,A,'sol')==='lvmax','caps at level 5');
structPass(g);const m5=A.maxT;A.up.sol=0;structPass(g);ok(m5>A.maxT*1.7,'soldiers 5: army cap +75% ('+Math.round(A.maxT)+' -> '+Math.round(m5)+')');
})();`);
// the panel in the real game: buying sends a command and the level goes up
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch(),errs=[];const p=await b.newPage({viewport:{width:1280,height:760}});p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>localStorage.setItem('sijal.v1',JSON.stringify({seen:'9.9',sound:false,music:false,games:9})));
  await p.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await p.waitForTimeout(1500);
  await p.evaluate(()=>{const S=__sijal;Object.assign(S.UI.prof,{size:0,botsN:6,diff:1,type:'continents'});S.act('go');});await p.waitForTimeout(500);
  await p.evaluate(()=>{const S=__sijal,g=S.G;let me=g.nations[g.human];for(let i=g.W*20;i<g.N&&!(me&&me.cap);i+=37){if(g.M.ter[i]!==2||g.owner[i]||g.structAt[i])continue;S.tap(i,0,0);me=g.nations[g.human];}me.gold=5000;});
  const noCamp=await p.$('#bar [data-a="b:camp"]').then(e=>!e);ok(noCamp,'no tank camp in the build bar');
  await p.click('#bArmy');await p.waitForTimeout(300);await p.click('[data-a="armyUp:sol"]');await p.evaluate(()=>__sijal.run(2));await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{const me=__sijal.G.nations[__sijal.G.human];return{lv:me.up.sol,gold:Math.round(me.gold)};});ok(r.lv===1&&r.gold<5000,'buying in the panel works '+JSON.stringify(r));
  ok(!errs.length,'no page errors '+errs.join('|'));await b.close();})();
