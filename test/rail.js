// factories: rails laid on completion, trains run to peaceful neighbours and pay gold; deterministic across two runs
const fs=require('fs'),vm=require('vm');const src=['core','map','game','ai'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
vm.runInThisContext('(function(){"use strict";'+src+`
function run(){const g=newGame({w:320,h:200,seed:11,type:'pangaea',bots:8,diff:1,demo:true,minors:0});startGame(g);let tr=0,gold=0;
for(let t=0;t<9000;t++){tick(g);for(const e of g.ev)if(e.t==='train'){tr++;gold+=e.amt;}g.ev.length=0;g.dirty.length=0;}
const f=g.structs.filter(s=>!s.dead&&s.type==='factory');return{fac:f.length,rails:g.rails.length,live:g.trains.length,tr,gold,h:g.nations.map(n=>n?Math.round(n.gold)+':'+n.tiles:0).join(',')};}
const a=run(),b=run();console.log(JSON.stringify({...a,h:undefined}));console.log('deterministic:',a.h===b.h&&a.tr===b.tr);
const g=newGame({w:320,h:200,seed:7,type:'pangaea',bots:6,diff:1,demo:true,minors:0});startGame(g);for(let t=0;t<300;t++){tick(g);g.ev.length=0;g.dirty.length=0;}
const A=g.nations[1];A.gold=1e6;A.era=3;const c=A.cap;let near=-1;for(let r=3;r<12&&near<0;r++)for(let d=0;d<8&&near<0;d++){const i=(c.y+DY8[d]*r)*g.W+c.x+DX8[d]*r;if(!canBuild(g,A,'city',i))near=r;}
console.log('nearest ring where a 2nd city is allowed:',near);
let fi=-1;for(let r=4;r<14&&fi<0;r++)for(let d=0;d<8&&fi<0;d++){const i=(c.y+DY8[d]*r)*g.W+c.x+DX8[d]*r;if(!canBuild(g,A,'factory',i))fi=i;}
const plan=railPlan(g,A.id,fi);build(g,A,'factory',fi);const f=g.structs[g.structAt[fi]-1];for(let t=0;t<200;t++){tick(g);g.ev.length=0;}
console.log('preview tracks',plan.length,'| rails after build',g.rails.filter(r=>r.f===f).length,'| factory built',!f.build);
let n=0,gold=0;for(let t=0;t<3000;t++){tick(g);for(const e of g.ev)if(e.t==='train'&&e.a===A.id){n++;gold+=e.amt;}g.ev.length=0;g.dirty.length=0;}
const cand=g.structs.filter(s=>!s.dead&&s.type==='city'&&s.owner&&s.owner!==A.id&&(s.x-f.x)**2+(s.y-f.y)**2<=4900).length;
console.log('foreign cities within 70:',cand,'| trains completed in 5 min:',n,'gold',gold,'| trade routes',g.rails.filter(r=>r.f===f&&r.trade).length);
`+'})()');
// capture: a factory taken in war keeps standing, changes owner, and lays tracks for the new owner
vm.runInThisContext('(function(){"use strict";'+['core','map','game','ai'].map(f=>require('fs').readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n')+`
const g=newGame({w:320,h:200,seed:7,type:'pangaea',bots:6,diff:1,demo:true,minors:0});startGame(g);for(let t=0;t<300;t++){tick(g);g.ev.length=0;g.dirty.length=0;}
const A=g.nations[1],B=g.nations[2];A.gold=1e6;A.era=3;let fi=-1;for(let i=0;i<g.N&&fi<0;i++)if(g.owner[i]===A.id&&!canBuild(g,A,'factory',i))fi=i;
build(g,A,'factory',fi);const f=g.structs[g.structAt[fi]-1];for(let t=0;t<100;t++)tick(g);
setOwner(g,fi,B.id);for(let t=0;t<30;t++){tick(g);g.ev.length=0;}
console.log('captured factory alive',!f.dead,'| owner now B',f.owner===B.id,'| B factories',B.cnt.factory,'A factories',A.cnt.factory,'| old owner rails left',g.rails.filter(r=>r.f===f&&r.a===A.id).length,'| new owner rails',g.rails.filter(r=>r.f===f&&r.a===B.id).length,'(planned for B:',railPlan(g,B.id,fi).length+')');
`+'})()');
