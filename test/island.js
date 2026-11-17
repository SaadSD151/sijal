// tapping an empty island across the sea must launch a boat to it
const fs=require('fs'),vm=require('vm');const src=['core','map','game','ai'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
vm.runInThisContext('(function(){"use strict";'+src+`
const g=newGame({w:320,h:200,seed:21,type:'islands',bots:6,diff:1,demo:true,minors:0});startGame(g);for(let t=0;t<400;t++){tick(g);g.ev.length=0;g.dirty.length=0;}
const A=g.nations.find(n=>n&&n.alive&&n.coast>3);A.troops=2e5;const lidA=g.M.lid[A.cap.i];let ti=-1;
for(let i=0;i<g.N;i++)if(g.M.ter[i]>1&&!g.owner[i]&&g.M.lid[i]!==lidA&&g.M.coastD[i]>2){ti=i;break;}
console.log('target on other landmass',ti>=0,'own coast',A.coast);
const lid=g.M.lid[ti];let cc=nearCoast(g,ti,25);if(cc<0)cc=seaLanding(g,A.id,0,lid);console.log('landing tile on target island',cc>=0&&g.M.lid[cc]===lid);
const r=launchBoat(g,A.id,cc,.3);console.log('boat launched',typeof r==='object'?'yes':r);for(let t=0;t<600;t++){tick(g);g.ev.length=0;g.dirty.length=0;}
let own=0;for(let i=0;i<g.N;i++)if(g.owner[i]===A.id&&g.M.lid[i]===lid)own++;console.log('tiles held on the island after 60s',own);
`+'})()');
