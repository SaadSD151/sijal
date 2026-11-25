// embargo stops ships and trains, emoji cooldown, conquering a realm hands over its army, AI shows emojis
const fs=require('fs'),vm=require('vm');const src=['core','map','game','ai'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
vm.runInThisContext('(function(){"use strict";'+src+`
const g=newGame({w:320,h:200,seed:11,type:'pangaea',bots:8,diff:1,demo:true,minors:0});startGame(g);let emos=0;
for(let t=0;t<3000;t++){tick(g);for(const e of g.ev)if(e.t==='emo')emos++;g.ev.length=0;g.dirty.length=0;}
const A=g.nations.find(n=>n&&n.alive&&!n.minor);console.log('AI emojis in 5 min:',emos,'| live trade ships',g.trades.length,'trains',g.trains.length);
setEmb(g,A.id,0,1);const bad=[...g.trades,...g.trains].filter(b=>b.a===A.id||(b.to&&b.to.owner===A.id)).length;
let launched=0;for(let t=0;t<1500;t++){tick(g);g.ev.length=0;g.dirty.length=0;for(const b of [...g.trades,...g.trains])if(b.a===A.id||(b.to&&b.to.owner===A.id))launched++;}
console.log('after stop-all: routes of A left',bad,'| A routes seen in 2.5 min',launched);setEmb(g,A.id,0,0);
console.log('emoji:',setEmo(g,A.id,5,0),'again at once:',setEmo(g,A.id,6,0),'| bad index:',setEmo(g,A.id,999,0));
const B=g.nations.find(n=>n&&n.alive&&!n.minor&&n!==A);B.troops=50000;const before=A.troops;let ev=null;
const tiles=[];for(let i=0;i<g.N;i++)if(g.owner[i]===B.id)tiles.push(i);for(const i of tiles)setOwner(g,i,A.id);for(const e of g.ev)if(e.t==='dead')ev=e;
console.log('conquest gain',A.troops-before,'| event',JSON.stringify(ev&&{tr:ev.tr,x:ev.x>0}));
`+'})()');
