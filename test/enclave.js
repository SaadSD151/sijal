// a big neutral area ringed by one realm joins it, filling over ~1.5 s; an area touching the map edge does not; deterministic
const fs=require('fs'),vm=require('vm');const src=['core','map','game','ai'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
vm.runInThisContext('(function(){"use strict";'+src+`
function run(){const g=newGame({w:320,h:200,seed:3,type:'flat',bots:0,diff:1,demo:true,minors:0});startGame(g);
  const A=addNation(g,{fac:'hawks',pers:'war',color:[200,60,60],nameIdx:0});const W=g.W;
  // ring of A around a 40x40 neutral block in the middle, plus a C-shape touching the left edge
  for(let y=60;y<=120;y++)for(let x=120;x<=200;x++){const i=y*W+x;const ring=x<124||x>196||y<64||y>116;if(ring)setOwner(g,i,A.id);}
  for(let y=20;y<=50;y++)for(let x=0;x<=40;x++){const i=y*W+x;if(x>36||y<24||y>46)setOwner(g,i,A.id);}
  const Z=addNation(g,{fac:'hawks',pers:'war',color:[60,60,200],nameIdx:1});for(let y=170;y<190;y++)for(let x=280;x<310;x++)setOwner(g,y*W+x,Z.id);Z.alive=true;A.alive=true;const inner=()=>{let n=0;for(let y=64;y<=116;y++)for(let x=124;x<=196;x++)if(g.owner[y*W+x]===A.id)n++;return n;},edgeN=()=>{let n=0;for(let y=24;y<=46;y++)for(let x=0;x<=36;x++)if(g.owner[y*W+x]===A.id)n++;return n;};
  const tot=53*73;g.__dbg=1;let firstT=-1,doneT=-1,ev=null;for(let t=0;t<60;t++){tick(g);for(const e of g.ev)if(e.t==='enclave')ev=e;g.ev.length=0;g.dirty.length=0;const n=inner();if(n>0&&firstT<0)firstT=t;if(n===tot&&doneT<0)doneT=t;}
  return{event:!!ev,size:ev&&ev.n,fillTicks:doneT-firstT,innerAll:inner()===tot,edgeTaken:edgeN(),h:Array.from(g.owner).reduce((a,v,i)=>(a*31+v*(i%97))|0,0)};}
const a=run(),b=run();console.log(JSON.stringify(a),'| deterministic',a.h===b.h);
`+'})()');
