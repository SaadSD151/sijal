// headless balance/sanity run: node test/sim.js [seed] [bots] [ticks] [type]
const fs=require('fs'),vm=require('vm');
const src=['core','map','game','ai'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
const [seed,bots,ticks,type]=[+process.argv[2]||7,+process.argv[3]||14,+process.argv[4]||9000,process.argv[5]||'continents'];
const drv=`
const t0=Date.now();const g=newGame({w:+process.env.W||272,h:+process.env.H||170,seed:${seed},type:'${type}',bots:${bots},diff:1,demo:true});
const tg=Date.now()-t0;startGame(g);
const tc={};for(let i=0;i<g.N;i++)tc[g.M.ter[i]]=(tc[g.M.ter[i]]||0)+1;
console.log('gen ms',tg,'land',g.M.land,'cities',g.M.cities.length,'rivers',g.M.rivers.length,'ter',JSON.stringify(tc),'nations',g.nations.filter(n=>n&&n.alive).length);
const evc={};let t1=Date.now(),maxMs=0;
for(let t=0;t<${ticks}&&!g.over;t++){const a=Date.now();tick(g);const d=Date.now()-a;if(d>maxMs)maxMs=d;g.dirty.length=0;
  for(const e of g.ev)evc[e.t]=(evc[e.t]||0)+1;g.ev.length=0;
  if(g.tick%600===0){const al=g.nations.filter(n=>n&&n.alive).sort((a,b)=>b.tiles-a.tiles);let neu=g.M.land;for(const n of al)neu-=n.tiles;
    for(const n of al)if(!isFinite(n.troops)||!isFinite(n.gold)||n.tiles<0)throw new Error('bad nation state '+n.id);
    console.log('t='+(g.tick/600)+'m alive',al.length,'neutral%',(neu/g.M.land*100).toFixed(0),'top3',al.slice(0,3).map(n=>(n.tiles/g.M.land*100).toFixed(0)+'%/'+fmt(n.troops)+'/'+fmt(n.maxT)+'/g'+fmt(n.gold)+'/e'+n.era+'/c'+n.cnt.city).join(' | '),'atk',g.attacks.length,'boats',g.boats.length,'structs',g.structs.filter(s=>!s.dead).length);}
}
console.log('END tick',g.tick,'over',JSON.stringify(g.over),'ms/tick avg',((Date.now()-t1)/g.tick).toFixed(3),'max',maxMs,'snaps',g.snaps.length);
console.log('events',JSON.stringify(evc));
// consistency: tile counts match
const cnt=new Int32Array(g.nations.length);for(let i=0;i<g.N;i++)cnt[g.owner[i]]++;
for(const n of g.nations)if(n&&n.tiles!==cnt[n.id])console.log('MISMATCH',n.id,n.tiles,cnt[n.id]);
`;
vm.runInThisContext('(function(){"use strict";'+src+drv+'})()');
