// a city left as a lone tile inside one realm must fall at the next encirclement check
const fs=require('fs'),vm=require('vm');const src=['core','map','game','ai'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
vm.runInThisContext('(function(){"use strict";'+src+`
const g=newGame({w:320,h:200,seed:5,type:'pangaea',bots:6,diff:1,demo:true,minors:0});startGame(g);
const A=g.nations[1];let c=null;for(const s of g.structs)if(s.type==='city'&&!s.owner&&g.M.coastD[s.i]>12){c=s;break;}
const W=g.W;for(let dy=-9;dy<=9;dy++)for(let dx=-9;dx<=9;dx++){const j=(c.y+dy)*W+c.x+dx;if(g.M.ter[j]>1&&j!==c.i&&!g.structAt[j])setOwner(g,j,1);}
console.log('neutral city before',c.owner);pocketPass(g);console.log('after',c.owner,'(expect 1)');
// enemy city
const B=g.nations[2],bc=B.cap;for(let i=0;i<g.N;i++)if(g.owner[i]===2&&i!==bc.i&&!g.structAt[i])setOwner(g,i,1);for(const s of g.structs)if(!s.dead&&s.owner===2&&s!==bc){setOwner(g,s.i,1);}
console.log('enemy capital owner before',bc.owner,'tiles',B.tiles);statsPass(g);pocketPass(g);console.log('after',bc.owner,'alive',B.alive,'(expect 1,false)');
`+'})()');
