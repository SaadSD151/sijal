// peace: refused without trust or strength, accepted after gifts or with a much bigger army; stops attacks; losing AIs ask for peace
const fs=require('fs'),vm=require('vm');const src=['core','map','game','ai'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
vm.runInThisContext('(function(){"use strict";'+src+`
const g=newGame({w:320,h:200,seed:7,type:'pangaea',bots:6,diff:1,demo:true,minors:0});startGame(g);for(let t=0;t<600;t++){tick(g);g.ev.length=0;g.dirty.length=0;}
const K=g.nations.length;console.log('nb',!!g.nb,g.nations.filter(n=>n&&n.alive&&!n.minor).length);let A=null,B=null;for(const a of g.nations)if(a&&!a.minor)for(const b of g.nations)if(b&&!b.minor&&b!==a&&!A&&!a.ally[b.id]){A=a;B=b;}
A.troops=B.troops;B.att[A.id]=-100;A.lastHit[B.id]=g.tick;launchAttack(g,A.id,B.id,.3,-1,-1);
console.log('at war',atWar(g,A.id,B.id),'| score equal armies, no trust',peaceScore(g,B,A).toFixed(0),'->',proposePeace(g,A.id,B.id));
console.log('ask again at once ->',proposePeace(g,A.id,B.id));
A.gold=1e5;console.log('B income',B.income.toFixed(0));gift(g,A.id,B.id,300);g.tick+=200;console.log('after small gift 300: score',peaceScore(g,B,A).toFixed(0),'->',proposePeace(g,A.id,B.id));gift(g,A.id,B.id,3000);gift(g,A.id,B.id,3000);g.tick+=200;A.lastHit[B.id]=g.tick;launchAttack(g,B.id,A.id,.2,-1,-1);console.log('after two gifts score',peaceScore(g,B,A).toFixed(0),'->',proposePeace(g,A.id,B.id));
const atk=g.attacks.filter(k=>(k.a===A.id&&k.d===B.id)||(k.a===B.id&&k.d===A.id)).length;console.log('attacks between them now',atk,'| truce s',(A.truce[B.id]-g.tick)/10,'| attack during peace ->',launchAttack(g,A.id,B.id,.3,-1,-1),'| atWar',atWar(g,A.id,B.id));
// strength route
const g2=newGame({w:320,h:200,seed:9,type:'pangaea',bots:6,diff:1,demo:true,minors:0});startGame(g2);for(let t=0;t<600;t++){tick(g2);g2.ev.length=0;}
let C=null,D=null;for(const a of g2.nations)if(a&&!a.minor)for(const b of g2.nations)if(b&&!b.minor&&b!==a&&!C&&!a.ally[b.id]){C=a;D=b;}
D.att[C.id]=-100;C.lastHit[D.id]=g2.tick;C.troops=D.troops*3.2;console.log('3x army, no gifts: score',peaceScore(g2,D,C).toFixed(0),'->',proposePeace(g2,C.id,D.id));
// a human that is crushing an AI gets asked for peace
const g3=newGame({w:320,h:200,seed:5,type:'pangaea',bots:6,diff:1,demo:true,minors:0});startGame(g3);for(let t=0;t<600;t++){tick(g3);g3.ev.length=0;}
let H=null,E=null;for(const a of g3.nations)if(a&&!a.minor)for(const b of g3.nations)if(b&&!b.minor&&b!==a&&!H&&!a.ally[b.id]&&a.tiles>b.tiles){H=a;E=b;}
H.human=true;let asked=0;for(let t=0;t<3000&&!asked;t++){H.troops=Math.max(H.troops,E.troops*3);H.lastHit[E.id]=g3.tick;tick(g3);for(const e of g3.ev)if(e.t==='peaceProp'&&e.b===H.id)asked=t;g3.ev.length=0;}
console.log('losing AI asked the human for peace after',asked/10,'s','| pending proposal',g3.proposals.some(p=>p.k==='peace'&&p.to===H.id));
`+'})()');
