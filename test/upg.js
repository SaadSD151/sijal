// upgrade rules: cost, era gate, 6 s to finish, shield interception odds by level, fort strength
const fs=require('fs'),vm=require('vm');const src=['core','map','game','ai'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
vm.runInThisContext('(function(){"use strict";'+src+`
const g=newGame({w:320,h:200,seed:7,type:'pangaea',bots:6,diff:1,demo:true,minors:0});startGame(g);for(let t=0;t<300;t++){tick(g);g.ev.length=0;g.dirty.length=0;}
const A=g.nations[1];A.gold=1e6;A.era=1;const c=A.cap;
console.log('city L'+c.level,'cost to next',upCost(c),'| era gate at L3->L4 with era 1:',(()=>{c.level=3;const r=canUp(g,A,c);c.level=2;return r;})());
let r=upgrade(g,A,c);const l0=c.level;for(let t=0;t<59;t++)tick(g);const mid=c.level;for(let t=0;t<12;t++)tick(g);console.log('upgrade',r||'ok','level',l0,'-> after 5.9s',mid,'-> after 7s',c.level);
A.era=4;for(let k=0;k<8;k++){const s=A.cap;if(!canUp(g,A,s)){upgrade(g,A,s);for(let t=0;t<70;t++)tick(g);}}console.log('capital level after more upgrades',A.cap.level,'| at max:',canUp(g,A,A.cap));
// shield odds: fire 400 doom missiles at a shielded tile for each level
blast=function(){};const B=g.nations.find(n=>n&&n.alive&&n.id!==A.id&&n.cap);const sh=addStruct(g,'shield',B.cap.i+2,B.id,1,-1);sh.build=0;
for(const lv of[1,3,5]){sh.level=lv;let stop=0,N=400;for(let k=0;k<N;k++){sh.cd=0;g.missiles=[{a:A.id,type:'doom',sx:0,sy:0,tx:sh.x,ty:sh.y,t:.999,dur:22}];const before=g.ev.length;tickMissiles(g);if(g.ev.slice(before).some(e=>e.t==='intercept'))stop++;g.ev.length=0;}
  console.log('shield L'+lv,'stops doom',Math.round(stop/N*100)+'% (table',Math.round(SH_P.doom[lv]*100)+'%)');}
// fort: per-tile defence multiplier against a 1M-troop attack, level 1 vs 5
const f=addStruct(g,'fort',B.cap.i+4,B.id,1,-1);f.build=0;B.defDirty=true;const k={a:A.id,d:B.id,troops:1e6,tx:-1,ty:-1,ox:0,oy:0};
for(const lv of[1,5]){f.level=lv;B.defDirty=true;console.log('fort L'+lv,'vs 1M troops: strength factor',(1+(4+lv)*fortF(k,lv)).toFixed(2),'| razed by 1M:',1e6>=700000*lv);}
for(let t=0;t<6000;t++){tick(g);g.ev.length=0;g.dirty.length=0;}const lv=g.structs.filter(s=>!s.dead&&s.level>1&&s.type!=='city').length;console.log('after 10 min, AI non-city buildings above level 1:',lv);
`+'})()');
