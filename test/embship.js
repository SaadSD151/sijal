// stopping trade does not make ships and trains vanish: those heading out turn round and sail home empty, then leave; no gold for the empty trip
const fs=require('fs'),vm=require('vm');const src=['core','map','game','ai'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
globalThis.ok=(c,m)=>{console.log((c?'ok  ':'FAIL ')+m);if(!c)process.exitCode=1;};
vm.runInThisContext('(function(){"use strict";'+src+`
const g=newGame({w:120,h:80,seed:6,type:'flat',bots:0,diff:1,demo:true,minors:0});startGame(g);
const A=addNation(g,{fac:'hawks',pers:'war',color:[200,60,60],nameIdx:0}),B=addNation(g,{fac:'hawks',pers:'war',color:[60,60,200],nameIdx:1});A.alive=B.alive=true;
const from={x:10,y:10,owner:A.id,dead:false},to={x:60,y:10,owner:B.id,dead:false},path=[];for(let x=10;x<=60;x++)path.push(10*g.W+x);
const out={a:A.id,lv:1,from,to,path,p:12,dir:1,spd:.45},home={a:A.id,lv:1,from,to,path,p:30,dir:-1,spd:.45};g.trades.push(out,home);
const tr={a:A.id,lv:1,from,to,toOwner:B.id,path,p:8,dir:1,spd:.5};g.trains.push(tr);
setEmb(g,A.id,B.id,1);
ok(g.trades.length===2&&g.trains.length===1,'nothing vanishes when trade stops');
ok(out.dir===-1&&out.empty&&tr.dir===-1&&tr.empty,'outbound ship and train turn round');
ok(home.dir===-1&&!home.empty,'a ship already coming home keeps its cargo');
const g0=A.gold;let paid=0;for(let t=0;t<200;t++){const b=A.gold;tickTrades(g);tickTrains(g);if(A.gold>b)paid+=A.gold-b;g.tick++;}
ok(!g.trades.length&&!g.trains.length,'they reach port and leave');
ok(paid>0&&paid<400,'only the ship that had traded brings gold ('+Math.round(paid)+')');
})();`);
