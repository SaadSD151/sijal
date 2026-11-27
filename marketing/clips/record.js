// Pass 1 of the TikTok clips: films one story from the real game, frame by frame, with no captions.
//   node marketing/clips/record.js <empire|revenge|naval> <outdir> [seed]
// The game's own clock is paused; every frame runs a set number of game ticks, so the pacing is chosen per scene.
// Writes <outdir>/f/00000.jpg… (1080x1920) and <outdir>/marks.json (scene name -> frame index).
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const STORY=process.argv[2]||'empire',OUT=path.resolve(process.argv[3]||'clip-'+STORY),FPS=30;
const SEEDS={empire:11,revenge:22,naval:33,swarm:44,betray:55,speed:66,dome:77,upgrades:88,comeback:99,mercy:111,six7:167,survive:122,tribes:133},SEED=+(process.argv[4]||SEEDS[STORY]);
const SETUP={empire:{type:'continents',fac:'hawks'},revenge:{type:'continents',fac:'bastion'},naval:{type:'islands',fac:'mariners'},swarm:{type:'continents',fac:'bastion'},betray:{type:'continents',fac:'merchants'},speed:{type:'continents',fac:'hawks'},dome:{type:'continents',fac:'scholars'},upgrades:{type:'pangaea',fac:'hawks'},comeback:{type:'continents',fac:'bastion'},mercy:{type:'continents',fac:'hawks'},six7:{type:'continents',fac:'hawks'},survive:{type:'continents',fac:'hawks'},tribes:{type:'continents',fac:'hawks'}}[STORY];

// helpers that live in the page
function lib(){
  const S=__sijal;
  window.KL={
    g:()=>S.G,me:()=>S.G.nations[S.G.human],
    mark(n){const M=window.__M||(window.__M={});if(M[n]==null)M[n]=window.__F;},
    major:n=>n&&n.alive&&!n.minor&&n.id!==S.G.human,
    d2:(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2,
    // keep expanding into free land: one modest push at a time, like a real player
    expand(r){const g=S.G,me=KL.me();if(!g.attacks.some(k=>k.a===me.id&&k.d===0&&!k.cancel))S.fn.launchAttack(g,me.id,0,r,-1,-1);},
    neighbor(min){const g=S.G,me=KL.me(),K=g.nations.length;let b=null,bv=0;for(const n of g.nations)if(KL.major(n)){const v=g.nb[me.id*K+n.id];if(v>bv){bv=v;b=n;}}return bv>=(min||1)?b:null;},
    contact(o){const g=S.G,me=KL.me(),W=g.W,O=g.owner;let sx=0,sy=0,c=0;for(let i=W;i<g.N-W;i++){if(O[i]!==me.id)continue;if(O[i+1]===o||O[i-1]===o||O[i+W]===o||O[i-W]===o){sx+=i%W;sy+=(i/W)|0;c++;}}return c?{x:sx/c,y:sy/c,c}:null;},
    cities(o){return S.G.structs.filter(s=>!s.dead&&s.type==='city'&&s.owner===o);},
    cam(x,y,z){const C=window.__CT;C.x=x;C.y=y;if(z)C.z=z;},
    zFor(tiles){return Math.max(2.2,Math.min(6,95/Math.sqrt(Math.max(tiles,120))));},
    atkOn(o){const g=S.G,me=KL.me();return g.attacks.some(k=>k.a===me.id&&k.d===o&&!k.cancel);},
    placeNear(n,type,x,y,minD){const g=S.G;let bi=-1,bd=1e18;for(let i=0;i<g.N;i++){if(g.owner[i]!==n.id||S.cb(g,n,type,i))continue;const d=(i%g.W-x)**2+(((i/g.W)|0)-y)**2;if(minD&&d<minD*minD)continue;if(d<bd){bd=d;bi=i;}}
      if(bi<0)return null;S.fn.build(g,n,type,bi);const s=g.structs[g.structAt[bi]-1];if(s)s.build=0;return s;},
    spawn(pref){const g=S.G;let best=-1,bs=-1e9;for(let k=0;k<8000;k++){const i=(Math.random()*g.N)|0,x=i%g.W,y=(i/g.W)|0;if(g.M.ter[i]!==2||g.owner[i]||g.M.coastD[i]<(pref.coast||4))continue;if(!g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>240))continue;
        const sc=-((x-g.W*(pref.x||.5))**2/g.W**2+(y-g.H*(pref.y||.5))**2/g.H**2);if(sc>bs){bs=sc;best=i;}}
      if(best>=0)S.tap(best,0,0);let me=KL.me();for(let k=0;k<20000&&!(me&&me.cap);k++){const i=(Math.random()*g.N)|0;if(g.M.ter[i]<2||g.M.ter[i]===6||g.owner[i]||g.structAt[i])continue;S.tap(i,0,0);me=KL.me();}
      for(const n of g.nations)if(n&&!n.human&&n.ai){n.ai.nextMsl=1e9;n.ultAt=1e9;}g.grace=1e9;return me;},
    // fast-forward off camera: grow like a player until a realm touches ours, then a little longer
    preroll(extra,r){const g=S.G;let met=-1;for(let s=0;s<6000;s++){S.run(1);if(s%5===0)KL.expand(r||.3);if(met<0&&KL.neighbor(6))met=s;if(met>=0&&s>met+extra)break;}}
  };
}

// each story: scenes run in order; start() once, then frame(k) every frame until it returns true or max frames pass
const STORIES={
  empire:[
    {name:'spawn',max:34,tpf:0,start:()=>{const me=KL.spawn({x:.5,y:.5});KL.cam(me.cap.x,me.cap.y,6.5);window.__CT.snap=1;}},
    {name:'expand',max:150,tpf:4,start:()=>{},frame:k=>{const me=KL.me();if(k%3===0)KL.expand(.3);KL.cam(me.cx,me.cy,KL.zFor(me.tiles));return k>40&&!!KL.neighbor(6);}},
    {name:'met',max:30,tpf:1,start:()=>{const o=KL.neighbor(1);window.__o=o.id;const c=KL.contact(o.id);KL.cam(c.x,c.y,4.6);}},
    {name:'camp',max:36,tpf:1,start:()=>{const g=__sijal.G,me=KL.me(),o=g.nations[window.__o],c=KL.contact(o.id);me.era=4;me.gold=Math.max(me.gold,4e5);me.troops=Math.max(me.troops,o.troops*1.25,20000);o.troops=Math.max(o.troops,me.troops*.75);
        const camp=KL.placeNear(me,'camp',c.x,c.y,4);if(camp){camp.tkOwner=me.id;camp.tk=5;camp.tkAt=g.tick+1e6;for(let k=0;k<5;k++)g.tanks.push({id:++g.aid,a:me.id,c:camp,x:camp.x+.5+(k-2)*.9,y:camp.y+.5,vx:1,vy:0,k:0,path:null,pi:0,re:g.tick,fire:0,hp:100});KL.cam(camp.x,camp.y,6.5);}}},
    {name:'attack',max:170,tpf:1,start:()=>{const g=__sijal.G,me=KL.me(),o=window.__o,cs=KL.cities(o).sort((a,b)=>KL.d2(a,{x:me.cx,y:me.cy})-KL.d2(b,{x:me.cx,y:me.cy}));const c=g.nations[o].cap||cs[0];window.__tc=c?c.i:-1;
        if(c)__sijal.fn.launchAttack(g,me.id,o,.28,c.x,c.y,true);},
      frame:k=>{const g=__sijal.G,me=KL.me(),o=window.__o,si=g.structAt[window.__tc],s=si?g.structs[si-1]:null;if(!s)return true;
        if(s.owner!==me.id&&!KL.atkOn(o)){me.troops=Math.max(me.troops,g.nations[o].troops*1.3);__sijal.fn.launchAttack(g,me.id,o,.28,s.x,s.y,true);}
        const T=g.tanks.filter(t=>t.a===me.id);let x=s.x,y=s.y;if(T.length){let ax=0,ay=0;for(const t of T){ax+=t.x;ay+=t.y;}x=ax/T.length*.6+s.x*.4;y=ay/T.length*.6+s.y*.4;}KL.cam(x,y,5.6);
        if(s.owner===me.id){KL.mark('cityFall');window.__fall=window.__fall||k;return k>window.__fall+18;}return false;}},
    {name:'conquer',max:190,tpf:2,start:()=>{},frame:k=>{const g=__sijal.G,me=KL.me(),o=g.nations[window.__o];if(!o.alive){KL.mark('kill');return(window.__dead=window.__dead||k)&&k>window.__dead+14;}
        if(k%6===0&&!KL.atkOn(o.id)){me.troops=Math.max(me.troops,o.troops*1.6);__sijal.fn.launchAttack(g,me.id,o.id,.45,-1,-1);}KL.cam(o.cx,o.cy,Math.max(2.6,KL.zFor(o.tiles+me.tiles*.4)));return false;}},
    {name:'end',max:50,tpf:3,start:()=>{},frame:k=>{const me=KL.me();if(k%3===0)KL.expand(.25);KL.cam(me.cx,me.cy,KL.zFor(me.tiles*1.6));return false;}}
  ],
  revenge:[
    {name:'enemyAtk',max:70,tpf:2,start:()=>{const g=__sijal.G,me=KL.spawn({x:.45,y:.55});KL.preroll(160,.3);const o=KL.neighbor(6);window.__o=o.id;
        // my defences: a fort on the front, a silo at home; the enemy gets a shield dome by a city
        me.era=4;me.gold=1e6;const c=KL.contact(o.id);KL.placeNear(me,'silo',me.cap.x,me.cap.y,5);
        o.era=4;o.gold=1e6;o.troops=Math.max(o.troops,me.troops*2.4,50000);me.troops=Math.min(me.troops,o.troops*.35);
        const mc=KL.cities(me.id).concat([me.cap]).sort((a,b)=>KL.d2(a,c)-KL.d2(b,c))[0];__sijal.fn.launchAttack(g,o.id,me.id,.55,mc.x,mc.y,true);
        KL.cam(c.x,c.y,4.4);window.__CT.snap=1;window.__c=c;},
      frame:k=>{const c=window.__c;KL.cam(c.x,c.y,4.4);return false;}},
    {name:'defend',max:60,tpf:2,start:()=>{const g=__sijal.G,me=KL.me(),o=g.nations[window.__o];me.troops=Math.max(me.troops,o.troops*1.5);__sijal.fn.launchAttack(g,me.id,o.id,.4,-1,-1);},
      frame:k=>{const c=KL.contact(window.__o)||window.__c;KL.cam(c.x,c.y,4);return false;}},
    {name:'launch1',max:48,tpf:1,start:()=>{const g=__sijal.G,me=KL.me(),o=g.nations[window.__o];
        const cs=KL.cities(o.id).filter(s=>!s.capital).sort((a,b)=>KL.d2(a,me.cap)-KL.d2(b,me.cap)),r=cs[0]||o.cap;
        let put=false;for(let dy=-4;dy<=4&&!put;dy++)for(let dx=-4;dx<=4&&!put;dx++){const i=(r.y+dy)*g.W+r.x+dx+3;if(!__sijal.cb(g,o,'shield',i)){__sijal.fn.build(g,o,'shield',i);const sh=g.structs[g.structAt[i]-1];sh.build=0;sh.level=3;put=true;}}
        for(const s of g.structs)if(s.type==='silo'&&s.owner===me.id){s.build=0;s.cd=0;}__sijal.fn.launchMissile(g,me.id,'rocket',r.i);window.__r=r;KL.cam((r.x*2+me.cap.x)/3,(r.y*2+me.cap.y)/3,3.4);},
      frame:k=>{const r=window.__r,fx=__sijal.R.fx;if(fx.some(f=>f.type==='airburst'))KL.mark('intercept');if(fx.some(f=>f.type==='boom'))KL.mark('boom1');if(k>14)KL.cam(r.x,r.y,4.2);return false;}},
    {name:'launch2',max:120,tpf:1,slow:k=>window.__boomAt!=null&&k>=window.__boomAt-2&&k<window.__boomAt+40?.35:1,start:()=>{const g=__sijal.G,me=KL.me(),o=g.nations[window.__o];
        for(const s of g.structs)if(s.type==='silo'&&s.owner===me.id){s.build=0;s.cd=0;}me.gold=Math.max(me.gold,1e5);__sijal.fn.launchMissile(g,me.id,'doom',o.cap.i);window.__n={x:o.cap.x,y:o.cap.y};KL.cam((o.cap.x+me.cap.x)/2,(o.cap.y+me.cap.y)/2,2.8);},
      frame:k=>{const n=window.__n;if(window.__boomAt==null&&__sijal.R.fx.some(f=>f.type==='boom'&&f.dur>=3000)){window.__boomAt=k;KL.mark('doom');}if(k>18)KL.cam(n.x,n.y,window.__boomAt!=null?3.2:3.6);return window.__boomAt!=null&&k>window.__boomAt+60;}},
    {name:'end',max:60,tpf:3,start:()=>{},frame:k=>{const g=__sijal.G,me=KL.me(),o=g.nations[window.__o];if(o.alive&&k%6===0&&!KL.atkOn(o.id)){me.troops=Math.max(me.troops,o.troops*4);__sijal.fn.launchAttack(g,me.id,o.id,.7,-1,-1);}KL.cam(o.alive?o.cx:me.cx,o.alive?o.cy:me.cy,2.6);return false;}}
  ],
  naval:[
    {name:'sea',max:68,tpf:1,start:()=>{const g=__sijal.G,me=KL.spawn({x:.4,y:.5,coast:3});for(let s=0;s<520;s++){__sijal.run(1);if(s%5===0)KL.expand(.3);}
        // the target: the nearest real realm across the water that our boats can reach
        const K=g.nations.length;let best=null,bd=1e18;for(const n of g.nations){if(!KL.major(n)||g.nb[me.id*K+n.id]>0||!n.cap||n.tiles<Math.max(700,me.tiles*.45))continue;const d=KL.d2(n.cap,me.cap);if(d<bd){const ts=KL.coastOf(n);if(ts.length&&__sijal.fn.waterPath(g,me.id,ts[0])){bd=d;best=n;}}}
        me.troops=Math.max(me.troops,40000);window.__o=best.id;best.troops=Math.max(best.troops,30000);const ts=KL.coastOf(best);window.__ts=ts;const t0=ts[0],tx=t0%g.W,ty=(t0/g.W)|0;
        let mi=-1,md=1e18;for(let i=g.W;i<g.N-g.W;i++){if(g.owner[i]!==me.id)continue;const tr=g.M.ter;if(!(tr[i+1]<2||tr[i-1]<2||tr[i+g.W]<2||tr[i-g.W]<2))continue;const d=(i%g.W-tx)**2+(((i/g.W)|0)-ty)**2;if(d<md){md=d;mi=i;}}
        const mx=mi%g.W,my=(mi/g.W)|0,mid={x:(mx+tx)/2,y:(my+ty)/2};window.__mid=mid;window.__zs=Math.max(2.4,Math.min(5.2,330/(Math.sqrt(md)+30)));
        KL.cam(mid.x,mid.y,window.__zs);window.__CT.snap=1;}},
    {name:'port',max:36,tpf:1,start:()=>{const g=__sijal.G,me=KL.me(),t=window.__ts[0],tx=t%g.W,ty=(t/g.W)|0;me.gold=Math.max(me.gold,2e5);
        let bi=-1,bd=1e18;for(let i=0;i<g.N;i++){if(g.owner[i]!==me.id||__sijal.cb(g,me,'port',i))continue;const d=(i%g.W-tx)**2+(((i/g.W)|0)-ty)**2;if(d<bd){bd=d;bi=i;}}
        if(bi>=0){__sijal.fn.build(g,me,'port',bi);const s=g.structs[g.structAt[bi]-1];if(s)s.build=0;window.__port={x:bi%g.W,y:(bi/g.W)|0};KL.cam(window.__port.x,window.__port.y,5.2);}}},
    {name:'boats',max:190,tpf:2,start:()=>{const g=__sijal.G,me=KL.me();me.troops=Math.max(me.troops,90000);window.__nb=0;window.__bt=window.__ts.slice();},
      frame:k=>{const g=__sijal.G,me=KL.me();
        // a fleet: one boat every few frames, each to a different beach
        if(k%7===0&&window.__nb<5){for(let a=0;a<window.__bt.length;a++){const t=window.__bt[(window.__nb+a)%window.__bt.length],b=__sijal.fn.launchBoat(g,me.id,t,.1);if(b&&typeof b==='object'){window.__nb++;break;}}}
        const B=g.boats.filter(b=>b.a===me.id);if(!B.length&&k>30){KL.mark('land');return(window.__landK=window.__landK||k)&&k>window.__landK+12;}let x=0,y=0;for(const b of B){const c=b.path[Math.min(b.path.length-1,Math.floor(b.p))];x+=c%g.W;y+=(c/g.W)|0;}KL.cam(x/B.length,y/B.length,4.6);return false;}},
    {name:'assault',max:170,tpf:2,start:()=>{const g=__sijal.G,o=g.nations[window.__o],c=o.cap||KL.cities(o.id)[0]||{x:window.__mid.x,y:window.__mid.y,i:-1};window.__capS={x:c.x,y:c.y,i:c.i};},frame:k=>{const g=__sijal.G,me=KL.me(),o=g.nations[window.__o];const cap=o.cap||window.__capS;if(o.cap)window.__capS={x:o.cap.x,y:o.cap.y,i:o.cap.i};
        const si=g.structAt[window.__capS.i],s=si?g.structs[si-1]:null;const mine=!o.alive||(s&&s.owner===me.id);
        if(!mine&&k%5===0&&!KL.atkOn(o.id)){me.troops=Math.max(me.troops,o.troops*3,60000);__sijal.fn.launchAttack(g,me.id,o.id,.6,window.__capS.x,window.__capS.y,true);}
        const c=KL.contact(o.id);const x=c?c.x*.5+window.__capS.x*.5:window.__capS.x,y=c?c.y*.5+window.__capS.y*.5:window.__capS.y;KL.cam(x,y,4.2);
        if(mine){KL.mark('capital');window.__took=window.__took||k;return k>window.__took+20;}return false;}},
    {name:'end',max:50,tpf:3,start:()=>{},frame:k=>{const g=__sijal.G,me=KL.me(),o=g.nations[window.__o];if(o.alive&&k%6===0&&!KL.atkOn(o.id))__sijal.fn.launchAttack(g,me.id,o.id,.6,-1,-1);const m=window.__mid;KL.cam(m.x,m.y,Math.max(2.4,window.__zs*.75));return false;}}
  ],
  // ── 'they all came for me': three neighbours attack at once, I hold, then sweep them one by one ──
  swarm:[
    {name:'hook',max:66,tpf:2,start:()=>{const g=__sijal.G,me=KL.spawn({x:.5,y:.5});const K=g.nations.length;let foes=[];
        for(let s=0;s<6000;s++){__sijal.run(1);if(s%5===0)KL.expand(.3);foes=g.nations.filter(n=>KL.major(n)&&g.nb[me.id*K+n.id]>4);if(foes.length>=3&&s>200)break;}
        foes.sort((a,b)=>g.nb[me.id*K+b.id]-g.nb[me.id*K+a.id]);foes=foes.slice(0,3);window.__foes=foes.map(n=>n.id);
        for(const n of foes){n.troops=Math.max(n.troops,me.troops*.9,30000);__sijal.fn.launchAttack(g,n.id,me.id,.5,-1,-1);}
        me.troops=Math.max(me.troops,40000);KL.cam(me.cx,me.cy,KL.zFor(me.tiles*3));window.__CT.snap=1;KL.mark('atk');},
      frame:k=>{const me=KL.me();KL.cam(me.cx,me.cy,KL.zFor(me.tiles*3));return false;}},
    {name:'hold',max:54,tpf:2,start:()=>{const g=__sijal.G,me=KL.me();let sum=0;for(const id of window.__foes)sum+=g.nations[id].troops;me.troops=Math.max(me.troops,sum*1.5);
        for(const id of window.__foes)if(g.nations[id].alive)__sijal.fn.launchAttack(g,me.id,id,.18,-1,-1);KL.mark('turn');},
      frame:k=>{const me=KL.me();KL.cam(me.cx,me.cy,KL.zFor(me.tiles*3));return false;}},
    {name:'sweep',max:300,tpf:1,start:()=>{window.__fi=0;},
      frame:k=>{const g=__sijal.G,me=KL.me();const L=window.__foes.map(id=>g.nations[id]);let i=window.__fi;while(i<3&&!L[i].alive){KL.mark('k'+(i+1));i++;}window.__fi=i;
        if(i>=3){window.__done=window.__done||k;return k>window.__done+12;}const o=L[i];
        if(!KL.atkOn(o.id)){me.troops=Math.max(me.troops,o.troops*2.1);__sijal.fn.launchAttack(g,me.id,o.id,.6,-1,-1);}
        KL.cam(o.cx*.6+me.cx*.4,o.cy*.6+me.cy*.4,Math.max(2.2,KL.zFor(o.tiles+me.tiles*.6)));return false;}},
    {name:'end',max:45,tpf:2,start:()=>{},frame:k=>{const me=KL.me();if(k%4===0)KL.expand(.25);KL.cam(me.cx,me.cy,KL.zFor(me.tiles*1.8));return false;}}
  ],
  // ── 'he trusted me': an alliance, a gift, quiet preparations, then the knife ──
  betray:[
    {name:'ally',max:60,tpf:1,start:()=>{const g=__sijal.G,me=KL.spawn({x:.45,y:.5});KL.preroll(140,.3);const o=KL.neighbor(6);window.__o=o.id;
        o.troops=Math.max(o.troops,me.troops*1.1,25000);__sijal.fn.setAlly(g,me.id,o.id);const c=KL.contact(o.id);window.__c=c;KL.cam(c.x,c.y,4.4);window.__CT.snap=1;KL.mark('ally');},
      frame:k=>{const c=window.__c;KL.cam(c.x,c.y,4.4);return false;}},
    {name:'gift',max:42,tpf:1,start:()=>{const g=__sijal.G,me=KL.me();me.gold=Math.max(me.gold,3000);__sijal.fn.gift(g,me.id,window.__o,1500);KL.mark('gift');},
      frame:k=>{const c=window.__c;KL.cam(c.x,c.y,4.2);return false;}},
    {name:'prep',max:54,tpf:1,start:()=>{const g=__sijal.G,me=KL.me(),o=g.nations[window.__o],c=window.__c;me.era=4;me.gold=Math.max(me.gold,4e5);
        const camp=KL.placeNear(me,'camp',c.x,c.y,5);if(camp){camp.tkOwner=me.id;camp.tk=5;camp.tkAt=g.tick+1e6;for(let q=0;q<5;q++)g.tanks.push({id:++g.aid,a:me.id,c:camp,x:camp.x+.5+(q-2)*.9,y:camp.y+.5,vx:1,vy:0,k:0,path:null,pi:0,re:g.tick,fire:0,hp:100});window.__camp=camp;}
        KL.placeNear(me,'fort',c.x,c.y,3);KL.mark('prep');},
      frame:k=>{const cp=window.__camp||window.__c;KL.cam(cp.x,cp.y,6);return false;}},
    {name:'stab',max:170,tpf:1,start:()=>{const g=__sijal.G,me=KL.me(),o=g.nations[window.__o];__sijal.fn.breakAlly(g,me.id,o.id);me.truce[o.id]=0;o.truce[me.id]=0;
        me.troops=Math.max(me.troops,o.troops*2.4);__sijal.fn.launchAttack(g,me.id,o.id,.7,-1,-1);KL.mark('stab');},
      frame:k=>{const g=__sijal.G,me=KL.me(),o=g.nations[window.__o];if(!o.alive){KL.mark('kill');window.__dead=window.__dead||k;return k>window.__dead+16;}
        if(!KL.atkOn(o.id)){me.troops=Math.max(me.troops,o.troops*2);__sijal.fn.launchAttack(g,me.id,o.id,.6,-1,-1);}KL.cam(o.cx,o.cy,Math.max(2.4,KL.zFor(o.tiles*1.6)));return false;}},
    {name:'end',max:42,tpf:2,start:()=>{},frame:k=>{const me=KL.me();KL.cam(me.cx,me.cy,KL.zFor(me.tiles*1.6));return false;}}
  ],
  // ── 'how long to rule the map?': a whole game fast-forwarded, with a clock and the share of the map ──
  speed:[
    {name:'run',max:330,tpf:7,start:()=>{const me=KL.spawn({x:.5,y:.5});KL.cam(me.cap.x,me.cap.y,6);window.__CT.snap=1;window.__ser=[];},
      frame:k=>{const g=__sijal.G,me=KL.me(),K=g.nations.length;if(!me.alive)return true;
        if(!g.attacks.some(q=>q.a===me.id&&!q.cancel)){let free=false;for(let i=0;i<g.N&&!free;i+=7)if(g.M.ter[i]>=2&&!g.owner[i]){const x=i%g.W,y=(i/g.W)|0;if((x-me.cx)**2+(y-me.cy)**2<(Math.sqrt(me.tiles)*1.2+20)**2)free=true;}
          if(free&&k<120)KL.expand(.35);else{let t=null;for(const n of g.nations)if(n&&n.alive&&n.id!==me.id&&g.nb[me.id*K+n.id]>2&&(!t||n.troops<t.troops))t=n;
            if(t){me.troops=Math.max(me.troops,t.troops*2.6);__sijal.fn.launchAttack(g,me.id,t.id,.6,-1,-1);}else KL.expand(.35);}}
        for(const n of g.nations)if(n&&!n.alive&&!n.__seen){n.__seen=1;if(!n.minor)KL.mark('kill'+(window.__kc=(window.__kc||0)+1));}
        window.__ser[window.__F]=[g.tick/10,me.tiles/g.M.land];KL.cam(me.cx,me.cy,KL.zFor(me.tiles*1.15));return me.tiles/g.M.land>.55;}},
    {name:'end',max:50,tpf:2,start:()=>{KL.mark('done');},frame:k=>{const g=__sijal.G,me=KL.me();window.__ser[window.__F]=[g.tick/10,me.tiles/g.M.land];KL.cam(g.W/2,g.H/2,.1);return false;}}
  ],
  // ── 'can the dome stop it?': a rocket and a nuke are shot down, the doomsday bomb is not ──
  dome:[
    {name:'aim',max:40,tpf:1,start:()=>{const g=__sijal.G,me=KL.spawn({x:.4,y:.5});KL.preroll(180,.3);me.era=4;me.gold=1e7;
        const foes=g.structs.filter(s=>!s.dead&&s.type==='city'&&s.owner&&s.owner!==me.id&&!g.nations[s.owner].minor).sort((a,b)=>KL.d2(a,me.cap)-KL.d2(b,me.cap));
        const T=foes.find(s=>KL.d2(s,me.cap)>500&&KL.d2(s,me.cap)<3500)||foes[2]||foes[0];window.__T={x:T.x,y:T.y,i:T.i,o:T.owner};const O=g.nations[T.owner];O.era=4;O.gold=1e7;
        let put=null;for(let r=3;r<9&&!put;r++)for(let a=0;a<12&&!put;a++){const i=Math.round(T.y+Math.sin(a/12*6.28)*r)*g.W+Math.round(T.x+Math.cos(a/12*6.28)*r);if(!__sijal.cb(g,O,'shield',i)){__sijal.fn.build(g,O,'shield',i);put=g.structs[g.structAt[i]-1];}}
        put.build=0;put.level=5;window.__sh=put.i;KL.placeNear(me,'silo',me.cap.x,me.cap.y,4);KL.placeNear(me,'silo',me.cap.x,me.cap.y,6);
        for(const n of g.nations)if(n&&!n.human){n.ai.nextWar=1e9;}KL.cam(T.x,T.y-2,5.5);window.__CT.snap=1;}},
    {name:'rocket',max:false?150:75,tpf:1,slow:false?(k=>window.__bAt!=null&&k>=window.__bAt-3&&k<window.__bAt+45?.33:1):null,
      start:()=>{const g=__sijal.G,me=KL.me(),T=window.__T,si=g.structAt[window.__sh],sh=si?g.structs[si-1]:null;if(sh){sh.cd=0;if(false)sh.level=2;}
        for(const s of g.structs)if(s.type==='silo'&&s.owner===me.id){s.build=0;s.cd=0;}me.gold=1e7;__sijal.fn.launchMissile(g,me.id,'rocket',T.i);window.__bAt=null;KL.cam((T.x*2+me.cap.x)/3,(T.y*2+me.cap.y)/3-2,3.6);},
      frame:k=>{const T=window.__T,fx=__sijal.R.fx;if(k===0)window.__ab0=new Set(fx.filter(f=>f.type==='airburst'));if(fx.some(f=>f.type==='airburst'&&!window.__ab0.has(f)))KL.mark('stop0');if(window.__bAt==null&&fx.some(f=>f.type==='boom')){window.__bAt=k;KL.mark('hit0');}
        if(k>12)KL.cam(T.x,T.y-2,false&&window.__bAt!=null?3.4:5);const g=__sijal.G;return k>20&&!g.missiles.length&&(window.__bAt!=null?k>window.__bAt+(false?70:12):k>40);}},
    {name:'nuke',max:false?150:75,tpf:1,slow:false?(k=>window.__bAt!=null&&k>=window.__bAt-3&&k<window.__bAt+45?.33:1):null,
      start:()=>{const g=__sijal.G,me=KL.me(),T=window.__T,si=g.structAt[window.__sh],sh=si?g.structs[si-1]:null;if(sh){sh.cd=0;if(false)sh.level=2;}
        for(const s of g.structs)if(s.type==='silo'&&s.owner===me.id){s.build=0;s.cd=0;}me.gold=1e7;__sijal.fn.launchMissile(g,me.id,'nuke',T.i);window.__bAt=null;KL.cam((T.x*2+me.cap.x)/3,(T.y*2+me.cap.y)/3-2,3.6);},
      frame:k=>{const T=window.__T,fx=__sijal.R.fx;if(k===0)window.__ab0=new Set(fx.filter(f=>f.type==='airburst'));if(fx.some(f=>f.type==='airburst'&&!window.__ab0.has(f)))KL.mark('stop1');if(window.__bAt==null&&fx.some(f=>f.type==='boom')){window.__bAt=k;KL.mark('hit1');}
        if(k>12)KL.cam(T.x,T.y-2,false&&window.__bAt!=null?3.4:5);const g=__sijal.G;return k>20&&!g.missiles.length&&(window.__bAt!=null?k>window.__bAt+(false?70:12):k>40);}},
    {name:'doom',max:true?150:75,tpf:1,slow:true?(k=>window.__bAt!=null&&k>=window.__bAt-3&&k<window.__bAt+45?.33:1):null,
      start:()=>{const g=__sijal.G,me=KL.me(),T=window.__T,si=g.structAt[window.__sh],sh=si?g.structs[si-1]:null;if(sh){sh.cd=0;if(true)sh.level=2;}
        for(const s of g.structs)if(s.type==='silo'&&s.owner===me.id){s.build=0;s.cd=0;}me.gold=1e7;__sijal.fn.launchMissile(g,me.id,'doom',T.i);window.__bAt=null;KL.cam((T.x*2+me.cap.x)/3,(T.y*2+me.cap.y)/3-2,3.6);},
      frame:k=>{const T=window.__T,fx=__sijal.R.fx;if(k===0)window.__ab0=new Set(fx.filter(f=>f.type==='airburst'));if(fx.some(f=>f.type==='airburst'&&!window.__ab0.has(f)))KL.mark('stop2');if(window.__bAt==null&&fx.some(f=>f.type==='boom')){window.__bAt=k;KL.mark('hit2');}
        if(k>12)KL.cam(T.x,T.y-2,true&&window.__bAt!=null?3.4:5);const g=__sijal.G;return k>20&&!g.missiles.length&&(window.__bAt!=null?k>window.__bAt+(true?70:12):k>40);}},
    {name:'end',max:40,tpf:2,start:()=>{},frame:k=>{const T=window.__T;KL.cam(T.x,T.y-2,3);return false;}}
  ],
  // ── 'same army, one upgraded': the same attack twice, without and with maxed tanks and planes (UPG=1 for the upgraded run) ──
  upgrades:[
    {name:'go',max:420,tpf:1,start:()=>{const g=__sijal.G,me=KL.spawn({x:.45,y:.5});KL.preroll(520,.3);const K=g.nations.length;let o=null;for(const n of g.nations)if(KL.major(n)&&g.nb[me.id*K+n.id]>3&&(!o||n.tiles>o.tiles))o=n;window.__o=o.id;
        for(const n of g.nations)if(n&&!n.human){n.ai.nextWar=1e9;}o.troops=45000;me.troops=110000;me.era=4;if(window.__UPG)me.up={sol:0,tank:5,air:5,nav:0,def:0};
        __sijal.fn.launchAttack(g,me.id,o.id,.8,-1,-1);KL.cam(o.cx,o.cy,Math.max(2.6,KL.zFor(o.tiles*1.3)));window.__CT.snap=1;KL.mark('go');},
      frame:k=>{const g=__sijal.G,me=KL.me(),o=g.nations[window.__o];if(!o.alive){KL.mark('kill');window.__d=window.__d||k;return k>window.__d+20;}
        if(!KL.atkOn(o.id))__sijal.fn.launchAttack(g,me.id,o.id,.6,-1,-1);KL.cam(o.cx,o.cy,Math.max(2.6,KL.zFor(o.tiles*1.3)));return false;}}
  ],
  // ── 'I lost everything but the capital': squeezed to one city, then one bomb on his capital and his whole realm falls ──
  comeback:[
    {name:'lose',max:75,tpf:2,start:()=>{const g=__sijal.G,me=KL.spawn({x:.5,y:.5});KL.preroll(220,.3);const K=g.nations.length;
        let o=null;for(const n of g.nations)if(KL.major(n)&&g.nb[me.id*K+n.id]>3&&(!o||n.tiles>o.tiles))o=n;window.__o=o.id;
        // only his capital stands, so the bomb brings the whole realm down
        for(const s of g.structs)if(!s.dead&&s.owner===o.id&&s.type==='city'&&s!==o.cap){s.dead=true;g.structAt[s.i]=0;}
        const W=g.W;for(let i=0;i<g.N;i++)if(g.owner[i]===me.id&&((i%W-me.cap.x)**2+(((i/W)|0)-me.cap.y)**2)>64)__sijal.setOwnerX(i,o.id);
        for(const n of g.nations)if(n&&!n.human){n.ai.nextWar=1e9;}o.troops=70000;o.gold=0;o.ai.nextBuild=1e9;me.troops=2500;me.era=4;me.gold=1e7;__sijal.fn.launchAttack(g,o.id,me.id,.45,-1,-1);
        KL.cam(me.cap.x,me.cap.y,6);window.__CT.snap=1;KL.mark('lose');},
      frame:k=>{const me=KL.me();if(KL.me().troops<800)KL.me().troops=800;KL.cam(me.cap.x,me.cap.y,6-k*.02);return false;}},
    {name:'silo',max:36,tpf:1,start:()=>{const me=KL.me();const s=KL.placeNear(me,'silo',me.cap.x,me.cap.y,2);if(s)s.cd=0;KL.cam(me.cap.x,me.cap.y,6.5);KL.mark('silo');}},
    {name:'doom',max:170,tpf:1,slow:k=>window.__bAt!=null&&k>=window.__bAt-3&&k<window.__bAt+50?.33:1,
      start:()=>{const g=__sijal.G,me=KL.me(),o=g.nations[window.__o];for(const c of g.structs)if(!c.dead&&c.owner===o.id&&c.type==='city'&&c!==o.cap){c.dead=true;g.structAt[c.i]=0;}o.gold=0;o.ai.nextBuild=1e9;for(const q of g.attacks)if(q.a===o.id)q.cancel=true;o.ai.nextWar=1e9;for(const s of g.structs)if(s.type==='silo'&&s.owner===me.id){s.build=0;s.cd=0;}window.__oc={x:o.cap.x,y:o.cap.y};__sijal.fn.launchMissile(g,me.id,'doom',o.cap.i);window.__bAt=null;
        KL.cam((o.cap.x+me.cap.x)/2,(o.cap.y+me.cap.y)/2,Math.max(2.4,KL.zFor(o.tiles)));KL.mark('launch');},
      frame:k=>{const g=__sijal.G,o=g.nations[window.__o],c=window.__oc;if(window.__bAt==null&&o.cap)for(const q of g.structs)if(!q.dead&&q.owner===o.id&&q.type==='city'&&q!==o.cap){q.dead=true;g.structAt[q.i]=0;}if(window.__bAt==null&&__sijal.R.fx.some(f=>f.type==='boom')){window.__bAt=k;KL.mark('doom');}if(window.__bAt!=null&&k===window.__bAt+8)window.__dbg={alive:o.alive,cap:o.cap&&{dead:o.cap.dead,x:o.cap.x,y:o.cap.y},cities:g.structs.filter(s=>!s.dead&&s.type==='city'&&s.owner===o.id).length,tgt:window.__oc,ms:g.missiles.length};if(!o.alive)KL.mark('fall');
        if(k>16)KL.cam(c.x,c.y,window.__bAt!=null?2.8:3.6);return window.__bAt!=null&&!o.alive&&k>window.__bAt+75;}},
    {name:'retake',max:150,tpf:3,start:()=>{const me=KL.me();me.troops=Math.max(me.troops,60000);KL.mark('retake');},
      frame:k=>{const me=KL.me();if(k%2===0)KL.expand(.5);KL.cam(me.cx,me.cy,KL.zFor(me.tiles*1.6));return false;}}
  ]
  ,
  // ── 'he begged for peace': a war going his way… until he sends a peace request; I say no ──
  mercy:[
    {name:'war',max:240,tpf:2,start:()=>{const g=__sijal.G,me=KL.spawn({x:.5,y:.5});KL.preroll(160,.3);const K=g.nations.length;for(let s2=0;s2<3000&&me.tiles<3500;s2++){__sijal.run(1);if(s2%5===0)KL.expand(.35);me.troops=Math.max(me.troops,me.maxT*.5);}
        // a real realm next door, smaller than us (a losing side only asks a bigger one for peace); grow until there is one
        let o=null;for(let tr=0;tr<12&&!o;tr++){if(tr)for(let s2=0;s2<200;s2++){__sijal.run(1);if(s2%5===0){KL.expand(.35);
            // boxed in: swallow the weakest neighbour off camera to get room
            if(!g.attacks.some(q=>q.a===me.id&&q.d)){let w=null;for(const n of g.nations)if(n&&n.alive&&n.id!==me.id&&g.nb[me.id*K+n.id]>0&&(!w||n.troops<w.troops))w=n;if(w){me.troops=Math.max(me.troops,w.troops*3+20000);__sijal.fn.launchAttack(g,me.id,w.id,.5,-1,-1);}}}}
          for(const n of g.nations)if(KL.major(n)&&g.nb[me.id*K+n.id]>0&&n.tiles<me.tiles*.8&&n.tiles>500&&(!o||n.tiles>o.tiles))o=n;
          window.__dbg=(window.__dbg||[]).concat([[me.tiles,g.nations.filter(n=>KL.major(n)&&g.nb[me.id*K+n.id]>0).map(n=>n.tiles).join('/')]]);}
        o=o||KL.neighbor(1);window.__o=o.id;window.__al=[];window.__oc={x:o.cx,y:o.cy};
        for(const n of g.nations)if(n&&!n.human&&n!==o){n.ai.nextWar=1e9;n.ai.peaceAt=1e9;}g.peaceCd=0;o.ai.peaceAt=-1e9;
        o.troops=Math.max(o.troops,30000);me.troops=Math.max(me.troops,o.troops*2.2);__sijal.fn.launchAttack(g,me.id,o.id,.15,-1,-1);
        const c=KL.contact(o.id);window.__c=c;KL.cam(c.x*.6+o.cx*.4,c.y*.6+o.cy*.4,Math.max(3.6,KL.zFor(o.tiles*.7)));window.__CT.snap=1;},
      frame:k=>{const g=__sijal.G,me=KL.me(),o=g.nations[window.__o];if(g.proposals.some(p=>p.from===o.id&&p.to===me.id)){KL.mark('ask');window.__keepTs=1;return true;}
        window.__al.push(o.alive?o.tiles:-1);if(k%8===0&&!KL.atkOn(o.id))__sijal.fn.launchAttack(g,me.id,o.id,.12,-1,-1);me.troops=Math.max(me.troops,o.troops*2.2);
        const c=KL.contact(o.id)||window.__c;KL.cam(c.x*.6+o.cx*.4,c.y*.6+o.cy*.4,Math.max(3.6,KL.zFor(o.tiles*.7)));return false;}},
    {name:'ask',max:80,tpf:0,start:()=>{window.__keepTs=1;},frame:k=>{const o=__sijal.G.nations[window.__o],c=KL.contact(o.id)||window.__c;KL.cam(c.x*.6+o.cx*.4,c.y*.6+o.cy*.4,Math.max(3.6,KL.zFor(o.tiles*.7)));return false;}},
    {name:'no',max:20,tpf:0,start:()=>{window.__keepTs=1;const b=document.querySelector('.ts [data-a^="rej:"]');if(b)b.classList.add('pressed');},frame:k=>{if(k===10){__sijal.act('rej:'+window.__o);window.__keepTs=0;}return false;}},
    {name:'crush',max:130,tpf:7,start:()=>{window.__keepTs=0;},
      frame:k=>{const g=__sijal.G,me=KL.me(),o=g.nations[window.__o];if(k===0)window.__t0=o.tiles;if(!o.alive||o.tiles<window.__t0*.25){KL.mark('kill');window.__dead=window.__dead||k;return k>window.__dead+16;}
        me.troops=Math.max(me.troops,o.troops*4,150000);if(!KL.atkOn(o.id))__sijal.fn.launchAttack(g,me.id,o.id,.8,-1,-1);
        const oc=window.__oc;KL.cam(oc.x,oc.y,Math.max(2.6,KL.zFor(window.__t0*.9)));return false;}},
    {name:'end',max:42,tpf:2,start:()=>{},frame:k=>{const me=KL.me();KL.cam(me.cx,me.cy,KL.zFor(me.tiles*1.6));return false;}}
  ],
  // ── '67': a neighbour laughs at me, I wipe him out, and answer with the 67 emoji ──
  six7:[
    {name:'mock',max:80,tpf:1,start:()=>{const g=__sijal.G,me=KL.spawn({x:.5,y:.5});KL.preroll(200,.3);const K=g.nations.length;
        let o=null;for(const n of g.nations)if(KL.major(n)&&g.nb[me.id*K+n.id]>3&&n.tiles>1200&&(!o||n.tiles>o.tiles))o=n;o=o||KL.neighbor(1);window.__o=o.id;
        for(const n of g.nations)if(n&&!n.human){n.ai.nextWar=1e9;n.ai.peaceAt=1e9;}me.pass=true;
        o.emo=3;/* 😂 */o.emoT=g.tick+40;__sijal.UI.emoZ=2.2;o.troops=Math.max(o.troops,30000);
        KL.cam(o.cx,o.cy-2,5);window.__CT.snap=1;},
      frame:k=>{const g=__sijal.G,o=g.nations[window.__o];o.emoT=g.tick+40;KL.cam(o.lx!=null?o.lx:o.cx,(o.ly!=null?o.ly:o.cy)-2,5-k*.01);return false;}},
    {name:'attack',max:240,tpf:1,start:()=>{const g=__sijal.G,me=KL.me(),o=g.nations[window.__o];window.__t0=o.tiles;me.troops=Math.max(me.troops,o.troops*1.8,40000);__sijal.fn.launchAttack(g,me.id,o.id,.3,-1,-1);window.__oc={x:o.cx,y:o.cy};},
      frame:k=>{const g=__sijal.G,me=KL.me(),o=g.nations[window.__o];if(o.alive&&o.tiles>window.__t0*.5)o.emoT=g.tick+40;else o.emoT=0;
        if(!o.alive){KL.mark('kill');window.__dead=window.__dead||k;return k>window.__dead+10;}
        me.troops=Math.max(me.troops,o.troops*1.8);if(!KL.atkOn(o.id))__sijal.fn.launchAttack(g,me.id,o.id,.35,-1,-1);
        const oc=window.__oc;KL.cam(oc.x,oc.y,Math.max(2.8,KL.zFor(window.__t0*1.1)));return false;}},
    {name:'six7',max:100,tpf:0,start:()=>{const g=__sijal.G,me=KL.me();me.emo=37;/* 67 */me.emoT=g.tick+40;__sijal.UI.emoZ=2.1;me.emoAt=g.tick;window.__lb=null;KL.mark('67');},
      frame:k=>{const me=KL.me(),x=me.lx!=null?me.lx:me.cx,y=me.ly!=null?me.ly:me.cy,z=k<12?4:5.4;KL.cam(x,y-62/z,z);return false;}},
    {name:'end',max:30,tpf:0,start:()=>{},frame:k=>{const me=KL.me();KL.cam(me.lx!=null?me.lx:me.cx,(me.ly!=null?me.ly:me.cy)-2,5);return false;}}
  ],
  // ── 'I took every city… and he is still alive': cities fall one by one, then every last tile has to be taken ──
  survive:[
    {name:'look',max:60,tpf:1,start:()=>{const g=__sijal.G,me=KL.spawn({x:.5,y:.5});KL.preroll(200,.3);const K=g.nations.length;
        let o=null;for(const n of g.nations)if(KL.major(n)&&g.nb[me.id*K+n.id]>3&&n.tiles>1500&&(!o||n.tiles>o.tiles))o=n;o=o||KL.neighbor(1);window.__o=o.id;
        for(const n of g.nations)if(n&&!n.human){n.ai.nextWar=1e9;}o.ai.nextBuild=1e9;o.gold=0;
        // three cities to take, spread over his land
        for(let t=0;t<6&&KL.cities(o.id).length<3;t++){const cs=KL.cities(o.id);KL.placeNear(o,'city',o.cx+(t%2?6:-6),o.cy+(t>2?5:-5),5);}
        while(KL.cities(o.id).length>3){const cs=KL.cities(o.id).filter(s=>!s.capital);const s=cs[cs.length-1];s.dead=true;__sijal.G.structAt[s.i]=0;}
        o.troops=Math.max(o.troops,60000);me.troops=Math.max(me.troops,140000);window.__n0=KL.cities(o.id).length;
        KL.cam(o.cx,o.cy,Math.max(2.6,KL.zFor(o.tiles*1.5)));window.__CT.snap=1;},
      frame:k=>{const o=__sijal.G.nations[window.__o];KL.cam(o.cx,o.cy,Math.max(2.6,KL.zFor(o.tiles*1.5)));return false;}},
    {name:'cities',max:420,tpf:1,start:()=>{window.__left=[];},
      frame:k=>{const g=__sijal.G,me=KL.me(),o=g.nations[window.__o],cs=KL.cities(o.id);window.__left[window.__F]=cs.length;
        if(window.__last!=null&&cs.length<window.__last)KL.mark('c'+(window.__n0-cs.length));window.__last=cs.length;
        if(!cs.length){KL.mark('zero');window.__z=window.__z||k;return k>window.__z+10;}
        const t=cs.sort((a,b)=>KL.d2(a,{x:me.cx,y:me.cy})-KL.d2(b,{x:me.cx,y:me.cy}))[0];
        if(!KL.atkOn(o.id)){me.troops=Math.max(me.troops,o.troops*1.6);__sijal.fn.launchAttack(g,me.id,o.id,.3,t.x,t.y,true);}
        KL.cam(t.x,t.y,4.4);return false;}},
    {name:'alive',max:70,tpf:1,start:()=>{const g=__sijal.G;for(const q of g.attacks)if(q.a===KL.me().id)q.cancel=true;},
      frame:k=>{const o=__sijal.G.nations[window.__o];window.__left[window.__F]=0;KL.cam(o.cx,o.cy,Math.max(2.4,KL.zFor(o.tiles*1.8)));return false;}},
    {name:'hunt',max:360,tpf:1,start:()=>{},
      frame:k=>{const g=__sijal.G,me=KL.me(),o=g.nations[window.__o];window.__left[window.__F]=0;if(!o.alive){KL.mark('kill');window.__dead=window.__dead||k;return k>window.__dead+16;}
        if(o.tiles<60)KL.mark('last');
        if(!KL.atkOn(o.id)){me.troops=Math.max(me.troops,o.troops*2.5);__sijal.fn.launchAttack(g,me.id,o.id,.35,-1,-1);}
        KL.cam(o.cx,o.cy,Math.max(2.6,KL.zFor(o.tiles*1.5)));return false;}},
    {name:'end',max:40,tpf:2,start:()=>{},frame:k=>{const me=KL.me();KL.cam(me.cx,me.cy,KL.zFor(me.tiles*1.6));return false;}}
  ],
  // ── 'a map full of tribes': how many can I eat before the big realms do? A clock and a counter ──
  tribes:[
    {name:'map',max:80,tpf:0,start:()=>{const g=__sijal.G,me=KL.spawn({x:.5,y:.5});window.__nt=g.nations.filter(n=>n&&n.alive&&n.minor).length;KL.cam(g.W/2,g.H/2,.1);window.__CT.snap=1;window.__ser=[];window.__eat=0;window.__mine=new Set();},
      frame:k=>{const g=__sijal.G,me=KL.me();window.__ser[window.__F]=[0,0];if(k>40)KL.cam(me.cap.x,me.cap.y,3.2);else KL.cam(g.W/2,g.H/2,.1);return false;}},
    {name:'race',max:330,tpf:5,start:()=>{const g=__sijal.G;for(const n of g.nations)if(n&&!n.human&&!n.minor)n.ai.nextWar=1e9;KL.mark('go');},
      frame:k=>{const g=__sijal.G,me=KL.me(),K=g.nations.length;
        for(const id of [...window.__mine]){const n=g.nations[id];if(!n.alive){window.__mine.delete(id);window.__eat++;window.__lastEat=k;KL.mark('t'+window.__eat);}else if(!KL.atkOn(id))window.__mine.delete(id);}
        if(k>150&&k-(window.__lastEat||0)>40)return true;
        // always pressing two or three tribes at once, and the free land around
        let busy=window.__mine.size;const T=g.nations.filter(n=>n&&n.alive&&n.minor&&g.nb[me.id*K+n.id]>0&&!window.__mine.has(n.id)).sort((a,b)=>a.troops-b.troops);
        for(const n of T){if(busy>=3)break;if(me.troops>n.troops*1.6+3000){const r=__sijal.fn.launchAttack(g,me.id,n.id,Math.min(.5,(n.troops*1.8+2000)/me.troops),-1,-1);if(r&&typeof r==='object'){window.__mine.add(n.id);busy++;}}}
        me.troops=Math.max(me.troops,12000+me.tiles*6);if(k%3===0)KL.expand(.2);window.__ser[window.__F]=[g.tick/10,window.__eat];KL.cam(me.cx,me.cy,KL.zFor(me.tiles*1.5));return false;}},
    {name:'end',max:60,tpf:2,start:()=>{KL.mark('done');},frame:k=>{const g=__sijal.G,me=KL.me();window.__ser[window.__F]=[null,window.__eat];KL.cam(me.cx,me.cy,KL.zFor(me.tiles*2.6));return false;}}
  ]
};

(async()=>{
  fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(path.join(OUT,'f'),{recursive:true});
  const b=await chromium.launch();
  // ORIENT=h records a 1920x1080 version for the computer trailer
  const ctx=await b.newContext(process.env.ORIENT==='h'?{viewport:{width:640,height:360},deviceScaleFactor:3}:{viewport:{width:360,height:640},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.clock.install({time:new Date('2026-11-23T20:00:00')});await pg.clock.pauseAt(new Date('2026-11-23T20:00:01'));
  await pg.addInitScript(([seed,fac,process_UPG])=>{let a=seed;Math.random=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
    window.__UPG=!!+(process_UPG);try{localStorage.setItem('sijal.v1',JSON.stringify({seen:'9.9',sound:false,music:false,games:9,gfx:2,fac,skin:{pat:'',bld:'gold'},passT:20}));}catch(e){}},[SEED,SETUP.fac,process.env.UPG||'0']);
  await pg.goto('file://'+path.resolve(__dirname,'../../dist/sijal.html'));
  await pg.waitForTimeout(2500);await pg.clock.runFor(500);
  await pg.evaluate(lib);
  await pg.evaluate(()=>{KL.coastOf=n=>{const g=__sijal.G,W=g.W,r=[];for(let i=W;i<g.N-W;i++){if(g.owner[i]!==n.id)continue;const t=g.M.ter;if(t[i+1]<2||t[i-1]<2||t[i+W]<2||t[i-W]<2)r.push(i);}r.sort((a,b)=>((a%W-n.cap.x)**2+(((a/W)|0)-n.cap.y)**2)-((b%W-n.cap.x)**2+(((b/W)|0)-n.cap.y)**2));
      const out=[];for(const i of r){if(out.every(j=>(i%W-j%W)**2+(((i/W)|0)-((j/W)|0))**2>36))out.push(i);if(out.length>=6)break;}return out;};});
  await pg.evaluate(()=>{const st=document.createElement('style');st.textContent='#hud,#amode,#feed,#hint,#fpick,.anx,#threat,#mini,#lb,#menu,#help,#net,#end,#radial,body:not(.keepts) .ts{display:none!important}.ts .pressed{transform:scale(.9);filter:brightness(1.3)}body.keepts #hud{display:block!important;pointer-events:none}body.keepts #hud>*:not(#toasts){display:none!important}body.keepts #toasts{top:58%!important;bottom:auto!important;transform:translateX(-50%) scale(1.08)!important;transform-origin:50% 0;width:80vw!important;max-width:80vw!important}';document.head.appendChild(st);window.__CT={};window.__ZM=1;});
  await pg.evaluate(t=>{const S=__sijal;Object.assign(S.UI.prof,{size:1,botsN:10,diff:1,type:t});S.act('go');},SETUP.type);
  await pg.clock.runFor(400);await pg.evaluate(()=>{__sijal.R.q=2;});
  const marks={};let f=0;
  for(const sc of STORIES[STORY]){
    await pg.evaluate(([fn,nm])=>{window.__SC=nm;eval('('+fn+')')();__sijal.UI.paused=true;},[sc.start.toString(),sc.name]);marks[sc.name]=f;
    for(let k=0;k<sc.max;k++){
      const r=await pg.evaluate(([fn,k,tpf,F])=>{const S=__sijal;window.__F=F;S.UI.paused=true;if(tpf)S.run(tpf);const done=fn?eval('('+fn+')')(k):false;
        // camera: critically damped spring toward the target, zooming out a little while it travels far, never past the map edge
        const C=window.__CT,cam=S.cam,g=S.G;if(C.x!=null){if(C.snap||!window.__VC){window.__VC={x:C.x,y:C.y,lz:Math.log(C.z),vx:0,vy:0,vz:0};C.snap=0;}
          const V=window.__VC,w=2.6,dt=1/30,dist=Math.hypot(C.x-V.x,C.y-V.y),lz=Math.log(C.z)-Math.log(1+dist/50);
          V.vx+=(w*w*(C.x-V.x)-2*w*V.vx)*dt;V.vy+=(w*w*(C.y-V.y)-2*w*V.vy)*dt;V.vz+=(w*w*(lz-V.lz)-2*w*V.vz)*dt;V.x+=V.vx*dt;V.y+=V.vy*dt;V.lz+=V.vz*dt;
          const vw=innerWidth,vh=innerHeight,z=Math.max(Math.exp(V.lz),Math.max(vw/g.W,vh/g.H)*1.04),hx=vw/2/z,hy=vh/2/z,cl=(v,a,b)=>a>b?(a+b)/2:Math.max(a,Math.min(b,v));
          cam.tz=cam.z=z;cam.tx=cam.x=cl(V.x,hx,g.W-hx);cam.ty=cam.y=cl(V.y,hy,g.H-hy);}
        if(!window.__keepTs)for(const d of document.querySelectorAll('.ts'))d.remove();else for(const d of document.querySelectorAll('.ts:not(.prop)'))d.remove();document.body.classList.toggle('keepts',!!window.__keepTs);return !!done;},[sc.frame?sc.frame.toString():null,k,sc.tpf,f]);
      const slow=sc.slow?await pg.evaluate(([fn,k])=>eval('('+fn+')')(k),[sc.slow.toString(),k]):1;
      await pg.clock.runFor(1000/FPS*slow);
      await pg.screenshot({path:path.join(OUT,'f',String(f).padStart(5,'0')+'.jpg'),type:'jpeg',quality:92});f++;
      if(r)break;
    }
    process.stdout.write(sc.name+'@'+marks[sc.name]+' ');
  }
  marks.total=f;
  // extra moments the editor and the music need
  const extra=await pg.evaluate(()=>({dbg:window.__dbg,ser:window.__ser||null,left:window.__left||null,al:window.__al?window.__al.filter((v,i)=>i%20===0):null,nt:window.__nt,eat:window.__eat,M:window.__M||{},boomAt:window.__boomAt,fall:window.__fall,dead:window.__dead,landK:window.__landK,took:window.__took,state:(()=>{const g=__sijal.G,me=g.nations[g.human];return{alive:me.alive,tiles:me.tiles};})()}));
  marks.extra=extra;
  fs.writeFileSync(path.join(OUT,'marks.json'),JSON.stringify(marks));
  console.log('\n'+STORY,JSON.stringify(marks),errs.length?'ERR '+errs.join('|'):'no errors');
  await b.close();
})();
