// rockets ruin cities, atom bombs erase small ones, doomsday erases everything; capitals move or the realm collapses
const fs=require('fs'),vm=require('vm');const src=['core','map','game','ai'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
vm.runInThisContext('(function(){"use strict";'+src+`
const g=newGame({w:320,h:200,seed:5,type:'continents',bots:8,diff:1,demo:true,minors:0});startGame(g);for(let t=0;t<2500;t++){tick(g);g.ev.length=0;g.dirty.length=0;}
const A=g.nations.filter(n=>n&&n.alive).sort((a,b)=>b.tiles-a.tiles)[0];A.era=4;A.gold=1e6;
const hitAt=(type,s)=>{if(!A.alive||!A.cap)return 'shooter dead';const sil=addStruct(g,'silo',A.cap.i+1,A.id,1,-1);A.cnt.silo=1;sil.build=0;sil.cd=0;const r=launchMissile(g,A.id,type,s.i);for(let t=0;t<90;t++){const lv=s.level;tick(g);if(s.level!==lv)console.log('  t',g.tick,type,'level',lv,'->',s.level,'ruin',s.ruin>g.tick,'owner',s.owner);}return r;};
const B=g.nations.find(n=>n&&n.alive&&n!==A&&n.cnt.city>=2);const bc=g.structs.find(s=>!s.dead&&s.type==='city'&&s.owner===B.id&&!s.capital)||B.cap;
const lv0=bc.level;let r=hitAt('rocket',bc);console.log('rocket',r,'level',lv0,'->',bc.level,'ruined',bc.ruin>g.tick,'dead',bc.dead);
const C=g.nations.find(n=>n&&n.alive&&n!==A&&n!==B);const cc=C.cap;cc.level=1;r=hitAt('nuke',cc);console.log('nuke on L1 capital',r,'dead',cc.dead,'capital now',C.cap&&!C.cap.dead?'moved':'none','alive',C.alive);
const D=g.nations.find(n=>n&&n.alive&&n!==A&&n!==B&&n!==C&&n.cap);const before=g.structs.filter(s=>!s.dead&&s.owner===D.id).length;D.cap.level=5;r=hitAt('doom',D.cap);
console.log('doom',r,'buildings',before,'->',g.structs.filter(s=>!s.dead&&s.owner===D.id).length,'capital dead',D.cap?D.cap.dead:'n/a','ruins',g.ruins.length);
for(let t=0;t<3000;t++){tick(g);g.ev.length=0;g.dirty.length=0;}let bad=0;const cnt=new Int32Array(g.nations.length);for(let i=0;i<g.N;i++)cnt[g.owner[i]]++;for(const n of g.nations)if(n&&n.tiles!==cnt[n.id])bad++;
console.log('after 5 more min: tile mismatches',bad,'ruined cities recovered',bc.dead||bc.ruin<=g.tick,'ruins left',g.ruins.length);
`+'})()');
