// Pass 1 of the TikTok clips: films one story from the real game, frame by frame, with no captions.
//   node marketing/clips/record.js <empire|revenge|naval> <outdir> [seed]
// The game's own clock is paused; every frame runs a set number of game ticks, so the pacing is chosen per scene.
// Writes <outdir>/f/00000.jpg… (1080x1920) and <outdir>/marks.json (scene name -> frame index).
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const STORY=process.argv[2]||'empire',OUT=path.resolve(process.argv[3]||'clip-'+STORY),FPS=30;
const SEEDS={empire:11,revenge:22,naval:33},SEED=+(process.argv[4]||SEEDS[STORY]);
const SETUP={empire:{type:'continents',fac:'hawks'},revenge:{type:'continents',fac:'bastion'},naval:{type:'islands',fac:'mariners'}}[STORY];

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
  ]
};

(async()=>{
  fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(path.join(OUT,'f'),{recursive:true});
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:360,height:640},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.clock.install({time:new Date('2026-11-23T20:00:00')});await pg.clock.pauseAt(new Date('2026-11-23T20:00:01'));
  await pg.addInitScript(([seed,fac])=>{let a=seed;Math.random=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
    try{localStorage.setItem('sijal.v1',JSON.stringify({seen:'9.9',sound:false,music:false,games:9,gfx:2,fac,skin:{pat:'',bld:'gold'},passT:20}));}catch(e){}},[SEED,SETUP.fac]);
  await pg.goto('file://'+path.resolve(__dirname,'../../dist/sijal.html'));
  await pg.waitForTimeout(2500);await pg.clock.runFor(500);
  await pg.evaluate(lib);
  await pg.evaluate(()=>{KL.coastOf=n=>{const g=__sijal.G,W=g.W,r=[];for(let i=W;i<g.N-W;i++){if(g.owner[i]!==n.id)continue;const t=g.M.ter;if(t[i+1]<2||t[i-1]<2||t[i+W]<2||t[i-W]<2)r.push(i);}r.sort((a,b)=>((a%W-n.cap.x)**2+(((a/W)|0)-n.cap.y)**2)-((b%W-n.cap.x)**2+(((b/W)|0)-n.cap.y)**2));
      const out=[];for(const i of r){if(out.every(j=>(i%W-j%W)**2+(((i/W)|0)-((j/W)|0))**2>36))out.push(i);if(out.length>=6)break;}return out;};});
  await pg.evaluate(()=>{const st=document.createElement('style');st.textContent='#hud,#amode,#feed,#hint,#fpick,.anx,#threat,#mini,#lb,#menu,#help,#net,#end,.ts,#radial{display:none!important}';document.head.appendChild(st);window.__CT={};window.__ZM=1;});
  await pg.evaluate(t=>{const S=__sijal;Object.assign(S.UI.prof,{size:1,botsN:10,diff:1,type:t});S.act('go');},SETUP.type);
  await pg.clock.runFor(400);await pg.evaluate(()=>{__sijal.R.q=2;});
  const marks={};let f=0;
  for(const sc of STORIES[STORY]){
    await pg.evaluate(fn=>{eval('('+fn+')')();__sijal.UI.paused=true;},sc.start.toString());marks[sc.name]=f;
    for(let k=0;k<sc.max;k++){
      const r=await pg.evaluate(([fn,k,tpf,F])=>{const S=__sijal;window.__F=F;S.UI.paused=true;if(tpf)S.run(tpf);const done=fn?eval('('+fn+')')(k):false;
        // camera: critically damped spring toward the target, zooming out a little while it travels far, never past the map edge
        const C=window.__CT,cam=S.cam,g=S.G;if(C.x!=null){if(C.snap||!window.__VC){window.__VC={x:C.x,y:C.y,lz:Math.log(C.z),vx:0,vy:0,vz:0};C.snap=0;}
          const V=window.__VC,w=2.6,dt=1/30,dist=Math.hypot(C.x-V.x,C.y-V.y),lz=Math.log(C.z)-Math.log(1+dist/50);
          V.vx+=(w*w*(C.x-V.x)-2*w*V.vx)*dt;V.vy+=(w*w*(C.y-V.y)-2*w*V.vy)*dt;V.vz+=(w*w*(lz-V.lz)-2*w*V.vz)*dt;V.x+=V.vx*dt;V.y+=V.vy*dt;V.lz+=V.vz*dt;
          const vw=innerWidth,vh=innerHeight,z=Math.max(Math.exp(V.lz),Math.max(vw/g.W,vh/g.H)*1.04),hx=vw/2/z,hy=vh/2/z,cl=(v,a,b)=>a>b?(a+b)/2:Math.max(a,Math.min(b,v));
          cam.tz=cam.z=z;cam.tx=cam.x=cl(V.x,hx,g.W-hx);cam.ty=cam.y=cl(V.y,hy,g.H-hy);}
        for(const d of document.querySelectorAll('.ts'))d.remove();return !!done;},[sc.frame?sc.frame.toString():null,k,sc.tpf,f]);
      const slow=sc.slow?await pg.evaluate(([fn,k])=>eval('('+fn+')')(k),[sc.slow.toString(),k]):1;
      await pg.clock.runFor(1000/FPS*slow);
      await pg.screenshot({path:path.join(OUT,'f',String(f).padStart(5,'0')+'.jpg'),type:'jpeg',quality:92});f++;
      if(r)break;
    }
    process.stdout.write(sc.name+'@'+marks[sc.name]+' ');
  }
  marks.total=f;
  // extra moments the editor and the music need
  const extra=await pg.evaluate(()=>({M:window.__M||{},boomAt:window.__boomAt,fall:window.__fall,dead:window.__dead,landK:window.__landK,took:window.__took,state:(()=>{const g=__sijal.G,me=g.nations[g.human];return{alive:me.alive,tiles:me.tiles};})()}));
  marks.extra=extra;
  fs.writeFileSync(path.join(OUT,'marks.json'),JSON.stringify(marks));
  console.log('\n'+STORY,JSON.stringify(marks),errs.length?'ERR '+errs.join('|'):'no errors');
  await b.close();
})();
