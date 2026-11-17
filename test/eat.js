// how fast do big realms eat tribes and small realms? node test/eat.js seed
const fs=require('fs'),vm=require('vm');const src=['core','map','game','ai'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
vm.runInThisContext('(function(){"use strict";'+src+`
const g=newGame({w:420,h:264,seed:${+process.argv[2]||5},type:'continents',bots:14,diff:1,demo:true});startGame(g);const K=g.nations.length;
for(let t=1;t<=12000;t++){tick(g);g.dirty.length=0;g.ev.length=0;if(t%1200===0){
  const al=g.nations.filter(n=>n&&n.alive),mi=al.filter(n=>n.minor),big=al.filter(n=>!n.minor).sort((a,b)=>b.tiles-a.tiles);
  let nbMin=0,nbBusy=0;for(const n of big){let has=false;for(const m of mi)if(g.nb[n.id*K+m.id]>1)has=true;if(has){nbMin++;let a=0;for(const k of g.attacks)if(k.a===n.id)a++;if(a>=3)nbBusy++;}}
  const small=big.filter(n=>n.tiles<big[0].tiles*.1);
  console.log((t/600)+'m tribes',mi.length,'realms',big.length,'small realms',small.length,'| realms touching a tribe',nbMin,'of which busy(3+ atk)',nbBusy,'| avg ratio',(big.reduce((s,n)=>s+n.troops/n.maxT,0)/big.length).toFixed(2));}}
`+'})()');
