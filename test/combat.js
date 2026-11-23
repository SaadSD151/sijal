// bots are not hostile just for being neighbours, only after a real attack; a much bigger attack moves faster;
// a point counter-attack does not cancel an all-borders attack, an all-borders counter-attack does
const fs=require('fs'),vm=require('vm');const src=['core','map','game','ai'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
globalThis.ok=(c,m)=>{console.log((c?'ok  ':'FAIL ')+m);if(!c)process.exitCode=1;};
vm.runInThisContext('(function(){"use strict";'+src+`
function setup(){const g=newGame({w:200,h:120,seed:6,type:'flat',bots:0,diff:1,demo:true,minors:0});startGame(g);const W=g.W;
  for(let i=0;i<g.N;i++)if(g.M.ter[i]>=2)g.M.ter[i]=2;
  const A=addNation(g,{fac:'hawks',pers:'war',color:[200,60,60],nameIdx:0}),D=addNation(g,{fac:'hawks',pers:'war',color:[60,60,200],nameIdx:1});A.alive=D.alive=true;
  for(let y=20;y<100;y++)for(let x=20;x<180;x++)setOwner(g,y*W+x,x<100?A.id:D.id);g.ncDirty=true;return{g,A,D,W};}
// 1. neighbours only grow wary
{const {g,A,D}=setup();for(let k=0;k<400;k++){g.tick+=10;aiDip(g,A);aiDip(g,D);}
  ok(A.att[D.id]>=-30&&D.att[A.id]>=-30,'neighbours without attacks stay above hostile ('+A.att[D.id].toFixed(0)+', '+D.att[A.id].toFixed(0)+')');
  A.troops=50000;launchAttack(g,A.id,D.id,.3,-1,-1);ok(A.att[D.id]<=-45&&D.att[A.id]<-40,'after an attack both see each other as hostile ('+A.att[D.id]+', '+D.att[A.id].toFixed(0)+')');}
// 2. speed follows the odds
function gainAt(mult){const {g,A,D}=setup();D.troops=40000;A.troops=D.troops*mult*2;const k=launchAttack(g,A.id,D.id,.5,-1,-1);for(let t=0;t<50;t++){g.over=null;tickAttacks(g);g.tick++;}return k.gain;}
const even=gainAt(1),big=gainAt(4);ok(big>even*1.6,'4x the army takes ground faster ('+even+' vs '+big+' tiles in 5 s)');
// 3. counter-attacks
{const {g,A,D,W}=setup();A.troops=200000;D.troops=200000;const k=launchAttack(g,A.id,D.id,.5,-1,-1);const t0=k.troops;
  const p=launchAttack(g,D.id,A.id,.3,90,60,true);ok(k.troops===t0&&p&&typeof p==='object','a point counter-attack leaves the all-borders attack standing ('+k.troops+')');
  for(let t=0;t<30;t++){tickAttacks(g);g.tick++;}let back=0;for(let y=55;y<66;y++)for(let x=85;x<100;x++)if(g.owner[y*W+x]===D.id)back++;
  ok(back>0,'the point counter-attack takes ground back where it lands ('+back+' tiles)');
  const before=k.troops;launchAttack(g,D.id,A.id,.5,-1,-1);ok(k.troops<before,'an all-borders counter-attack meets the attack head on ('+before+' -> '+k.troops+')');}
{const {g,A,D}=setup();A.troops=200000;D.troops=200000;const k=launchAttack(g,A.id,D.id,.3,95,60,true);const t0=k.troops;launchAttack(g,D.id,A.id,.3,105,60,true);ok(k.troops<t0,'a point counter-attack still meets a point attack right next to it');}
})();`);
