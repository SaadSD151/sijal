// conquered land keeps every building (except the wonder); a collapsing realm hands its buildings to the conqueror
const fs=require('fs'),vm=require('vm');const src=['core','map','game','ai'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
vm.runInThisContext('(function(){"use strict";'+src+`
const g=newGame({w:320,h:200,seed:7,type:'pangaea',bots:6,diff:1,demo:true,minors:0});startGame(g);for(let t=0;t<300;t++){tick(g);g.ev.length=0;g.dirty.length=0;}
const A=g.nations[1],B=g.nations[2];A.gold=1e6;A.era=4;const made={};
for(const ty of['fort','port','coast','factory','silo','shield']){let fi=-1;for(let i=0;i<g.N&&fi<0;i++)if(g.owner[i]===A.id&&!canBuild(g,A,ty,i))fi=i;if(fi<0){made[ty]='nospot';continue;}build(g,A,ty,fi);const s=g.structs[g.structAt[fi]-1];s.build=0;s.level=3;made[ty]=s;}
for(const ty in made){const s=made[ty];if(typeof s==='string')continue;setOwner(g,s.i,B.id);made[ty]=(!s.dead&&s.owner===B.id?'taken L'+s.level:'LOST');}
console.log(JSON.stringify(made),'| B silos',B.cnt.silo,'shields',B.cnt.shield,'| A silos',A.cnt.silo);
// collapse: give C a far-away silo, then wipe its cities
const C=g.nations[3];C.gold=1e6;C.era=4;let si=-1,cap=C.cap;for(let i=0;i<g.N;i++)if(g.owner[i]===C.id&&!canBuild(g,C,'silo',i)&&((i%g.W)-cap.x)**2+(((i/g.W)|0)-cap.y)**2>256){si=i;break;}
if(si<0)console.log('no far silo spot');else{build(g,C,'silo',si);const s=g.structs[g.structAt[si]-1];s.build=0;collapseNation(g,C,A.id,cap);console.log('collapse: far silo now',s.dead?'LOST':'owned by conqueror '+(s.owner===A.id),'| C alive',C.alive);}
`+'})()');
