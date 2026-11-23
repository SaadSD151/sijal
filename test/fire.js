// fire after a blast: ragged edge (not a circle), spreads slowly over grass, fast in forest but never the whole forest,
// never in desert or snow; in winter it does not spread and burns out faster; deterministic
const fs=require('fs'),vm=require('vm');const src=['core','map','game','ai'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
vm.runInThisContext('(function(){"use strict";'+src+`
function run(ter,season,seed){const g=newGame({w:200,h:140,seed:seed||5,type:'flat',bots:0,diff:1,demo:true,minors:0});startGame(g);
  const W=g.W,cx=100,cy=70;for(let i=0;i<g.N;i++)if(g.M.ter[i]>=2)g.M.ter[i]=ter;
  g.season=season||0;g.tick=season===3?SEASON_LEN*3+1:1;
  blast(g,cx,cy,10,0,{fall:320,kill:1,lvl:2});
  const burning=()=>{let n=0;for(let i=0;i<g.N;i++)if(g.fall[i]>g.tick)n++;return n;};
  const start=burning(),inRad=(()=>{let n=0;for(let y=cy-10;y<=cy+10;y++)for(let x=cx-10;x<=cx+10;x++)if((x-cx)**2+(y-cy)**2<=100)n++;return n;})();
  let maxB=start,far=0,out=-1;
  for(let t=0;t<900;t++){const s0=g.season;tick(g);if(season!=null)g.season=season;const b=burning();maxB=Math.max(maxB,b);
    for(let i=0;i<g.N;i++)if(g.fall[i]>g.tick){const d=Math.hypot(i%W-cx,((i/W)|0)-cy);if(d>far)far=d;}
    if(b===0&&out<0)out=t;}
  return {start,inRad,maxB,far:+far.toFixed(1),out,sum:Array.from(g.fall).reduce((a,v)=>a+v,0)};}
const ok=(c,m)=>{console.log((c?'ok  ':'FAIL ')+m);if(!c)process.exitCode=1;};
const grass=run(2,0),forest=run(3,0),desert=run(4,0),snow=run(7,0),winter=run(2,3);
console.log('grass',JSON.stringify(grass));console.log('forest',JSON.stringify(forest));console.log('desert',JSON.stringify(desert));console.log('snow',JSON.stringify(snow));console.log('winter grass',JSON.stringify(winter));
ok(grass.start<grass.inRad*.95,'edge is ragged, not a full circle ('+grass.start+' of '+grass.inRad+')');
ok(grass.far>10.5&&grass.far<18,'grass: spreads a little past the blast ('+grass.far+')');
ok(forest.maxB>grass.maxB*1.3&&forest.far>grass.far,'forest: spreads much more than grass');
ok(forest.far<35,'forest: never takes the whole forest ('+forest.far+')');
ok(desert.far<=10.01&&desert.maxB===desert.start,'desert: no spread');
ok(snow.far<=10.01&&snow.out<desert.out,'snow: no spread and burns out sooner ('+snow.out+' vs '+desert.out+')');
ok(winter.far<=10.01&&winter.out<desert.out,'winter: no spread and burns out sooner ('+winter.out+')');
ok(grass.out>0&&grass.out<400,'fire is gone in under 40 s after a nuke ('+grass.out+' ticks)');
const a=run(3,0,9),b=run(3,0,9);ok(a.sum===b.sum,'deterministic');
})();`);
