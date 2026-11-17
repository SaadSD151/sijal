// across-the-bay landing: a spot on the same landmass but far around by land must get a ship; a nearby spot a land attack
const fs=require('fs'),vm=require('vm');const src=['core','map','game','ai'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
vm.runInThisContext('(function(){"use strict";'+src+`
let found=0;
for(let seed=1;seed<40&&found<4;seed++){
  const g=newGame({w:320,h:200,seed,type:'crescent',bots:4,diff:1,demo:true,minors:0});startGame(g);const A=g.nations[1];if(!A||!A.alive)continue;
  for(let t=0;t<200;t++){tick(g);g.ev.length=0;g.dirty.length=0;}
  const W=g.W,lidA=g.M.lid[A.cap.i];
  // look for a tile on our landmass, across water from us: straight gap short, land route long
  for(let k=0;k<4000;k++){const i=(Math.random()*g.N)|0;if(g.M.ter[i]<2||g.M.lid[i]!==lidA||g.owner[i]===A.id)continue;
    const far=seaIsShorter(g,A.id,g.owner[i],i);if(far){found++;console.log('seed',seed,'tile',i,'owner',g.owner[i],'-> sea is shorter: ship. shore near tap:',shoreNear(g,i,g.owner[i],10)>=0);break;}}
}
// a tile right next to our border must stay a land attack
const g=newGame({w:320,h:200,seed:3,type:'continents',bots:4,diff:1,demo:true,minors:0});startGame(g);const A=g.nations[1];let nb=-1;for(let i=0;i<g.N;i++)if(g.owner[i]===0&&g.M.ter[i]>1&&adjOwn(g,i,A.id)){nb=i;break;}
console.log('tile next to our border -> sea shorter?',seaIsShorter(g,A.id,0,nb),'(expect false)');
`+'})()');
