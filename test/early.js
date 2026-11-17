// early-game pace: AI realm size and attacks in the first two minutes
const fs=require('fs'),vm=require('vm');const src=['core','map','game','ai'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
vm.runInThisContext('(function(){"use strict";'+src+`
const g=newGame({w:${+process.env.W||320},h:${+process.env.H||200},seed:${+process.argv[2]||5},type:'continents',bots:${+process.argv[3]||10},diff:1,demo:true});startGame(g);
let wars=0;for(let t=1;t<=1200;t++){tick(g);g.dirty.length=0;for(const e of g.ev)if(e.t==='war')wars++;g.ev.length=0;if(t%150===0){
  const B=g.nations.filter(n=>n&&n.alive&&!n.minor),avg=B.reduce((s,n)=>s+n.tiles,0)/B.length,rat=B.reduce((s,n)=>s+n.troops/n.maxT,0)/B.length;let na=0,nn=0;for(const k of g.attacks)if(!g.nations[k.a].minor){na++;if(!k.d)nn++;}
  let neu=g.M.land;for(const n of g.nations)if(n&&n.alive)neu-=n.tiles;
  console.log((t/10)+'s avgTiles',avg.toFixed(0),'ratio',rat.toFixed(2),'attacks',na,'(neutral',nn+')','wars so far',wars,'neutral%',(neu/g.M.land*100).toFixed(0));}}
`+'})()');
