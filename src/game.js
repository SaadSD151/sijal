// ── SIJAL · simulation (pure logic, no DOM) ──
const R_CITY=5,R_CAP=6,R_FORT=6,CITY_MIN=12,ALLY_T=1200,SHIELD_R=15,MAX_ATK=6,WIN_SHARE=.99,MON_TIME=1500;

function newGame(o){
  const M=genMap(o),N=M.N;
  const g={o,M,W:M.W,H:M.H,N,tick:0,rng:mulberry32((o.seed^0x9e3779b9)>>>0),owner:new Uint8Array(N),fall:new Int32Array(N),structAt:new Int16Array(N),
    nations:[null],structs:[],attacks:[],boats:[],missiles:[],pending:[],proposals:[],trades:[],fallList:[],dirty:[],ev:[],snaps:[],snapEvery:40,aid:0,
    season:0,sSpd:1,sCost:1,sGrow:1.3,sGold:1,nextEvent:1100,over:null,started:false,hegemon:0,coalition:0,human:0,
    q:new Int32Array(N),prev:new Int32Array(N),lab:new Int32Array(N),nb:null,diff:DIFF[o.diff==null?1:o.diff],ncity:[],ncDirty:true,used:M.used,grace:[3000,1800,900,300][o.diff==null?1:o.diff]};
  for(const c of M.cities)addStruct(g,'city',c.i,0,c.level,c.name);
  setupNations(g);
  return g;
}
function emit(g,t,d){d=d||{};d.t=t;d.tick=g.tick;g.ev.push(d);}

function addNation(g,p){
  const id=g.nations.length,n={id,nameIdx:p.nameIdx,color:p.color,human:!!p.human,fac:p.fac,pers:p.pers||'conq',alive:true,spawned:false,
    troops:8000,gold:150,tiles:0,val:0,maxT:20000,income:5,era:1,cap:null,
    att:new Float32Array(128),ally:new Uint8Array(128),allyAt:new Int32Array(128),allyUntil:new Int32Array(128),allyRen:new Uint8Array(128),allyWarn:new Uint8Array(128),truce:new Int32Array(128),lastHit:new Int32Array(128).fill(-9999),lastAtk:new Int32Array(128).fill(-9999),lastHitAny:-9999,
    blitz:0,wall:0,collapse:0,ultAt:500,mSpd:1,mAtk:1,mDef:1,cx:0,cy:0,x0:0,y0:0,x1:0,y1:0,coast:0,defS:[],defDirty:true,
    cnt:{city:0,fort:0,port:0,coast:0,silo:0,shield:0,mon:0},mon:null,
    ai:{nextBuild:40+id*3,nextDip:30+id*5,nextWar:250+g.rng()*250,nextNaval:300+g.rng()*300,nextMsl:0,focus:0,focusUntil:0,last:0,propAt:-999},
    st:{conq:0,lost:0,cities:0,kills:0,peak:0,nukes:0}};
  g.nations.push(n);if(n.human)g.human=id;return n;
}
function setupNations(g){
  const o=g.o,rng=g.rng,idx=shuffle([...NAT.ar.keys()],rng);
  if(o.players){o.players.forEach((p,i)=>{const n=addNation(g,{human:true,fac:FAC[p.fac]?p.fac:'hawks',color:PAL[i%PAL.length],nameIdx:-1});n.pname=String(p.name||'').slice(0,18)||'P'+(i+1);});g.human=(o.me|0)+1;}
  else if(!o.demo)addNation(g,{human:true,fac:o.faction||'hawks',color:FAC[o.faction||'hawks'].c,nameIdx:-1});
  const pc=o.demo||o.players?null:FAC[o.faction||'hawks'].c,pal=shuffle(PAL.filter((c,i)=>o.players?i>=o.players.length||o.players.length>=PAL.length:!pc||Math.abs(c[0]-pc[0])+Math.abs(c[1]-pc[1])+Math.abs(c[2]-pc[2])>90),rng);
  for(let b=0;b<o.bots;b++){
    const n=addNation(g,{fac:FKEYS[(rng()*FKEYS.length)|0],pers:PKEYS[(rng()*PKEYS.length)|0],color:b<pal.length?pal[b]:pal[b%pal.length].map(v=>clamp(v+((rng()*90)|0)-45,30,240)),nameIdx:idx[b%idx.length]}),i=pickSpawn(g);
    if(i<0){n.alive=false;continue;}spawn(g,n,i);
  }
  // minor tribes: weak villages scattered over the map, easy prey for whoever reaches them first
  const mc=o.minors==null?60:o.minors,tn=shuffle([...Array(600).keys()],rng);
  for(let b=0;b<mc&&g.nations.length<124;b++){const i=pickSpawn(g,8);if(i<0)break;
    const n=addNation(g,{fac:'merchants',pers:'sage',color:[135+((rng()*50)|0),125+((rng()*45)|0),105+((rng()*45)|0)],nameIdx:-2});n.minor=true;n.tribe=tn[b];n.ai.nextWar=60+rng()*120;n.troops=2500;spawn(g,n,i);n.cap.level=1;}
  for(const n of g.nations)if(n&&!n.human)for(const m of g.nations)if(m&&m!==n)n.att[m.id]=rng()*40-15+(PERS[n.pers].trust-.5)*20+(m.human?[30,10,-5,-20][o.diff==null?1:o.diff]:0);
}
function canSpawn(g,i){
  const M=g.M;if(i<0||M.ter[i]<2||M.ter[i]===6||g.owner[i]||g.structAt[i])return false;
  const x=i%g.W,y=(i/g.W)|0;
  for(const s of g.structs)if(!s.dead&&s.type==='city'){const d=(s.x-x)**2+(s.y-y)**2;if(d<(s.owner?196:49))return false;}
  return true;
}
function pickSpawn(g,md){
  const W=g.W,M=g.M,rng=g.rng;let minD=md||Math.sqrt(M.land/(g.o.bots+1)/3.14)*1.25;
  for(let t=0;t<4000;t++){if(t%300===299)minD*=.85;const i=(rng()*g.N)|0;if(!canSpawn(g,i))continue;const x=i%W,y=(i/W)|0;
    let ok=true;for(const n of g.nations)if(n&&n.cap&&hyp(n.cap.x-x,n.cap.y-y)<minD){ok=false;break;}if(!ok)continue;
    let c=0;for(let d=0;d<8;d++){const X=x+DX8[d]*3,Y=y+DY8[d]*3;if(X>=0&&Y>=0&&X<W&&Y<g.H&&M.ter[Y*W+X]>1)c++;}if(c>=6)return i;}
  return -1;
}
function spawn(g,n,i){
  const W=g.W,x=i%W,y=(i/W)|0;n.spawned=true;
  for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=g.H||dx*dx+dy*dy>14)continue;const j=Y*W+X;if(g.M.ter[j]>1&&!g.owner[j]&&!g.structAt[j])setOwner(g,j,n.id);}
  setOwner(g,i,n.id);n.cap=addStruct(g,'city',i,n.id,2,newCityName(g));n.cap.capital=true;n.cx=x;n.cy=y;
}
function startGame(g){g.started=true;structPass(g);statsPass(g);}
function newCityName(g){let nm,t=0;do{nm=(g.rng()*288)|0;}while(g.used.has(nm)&&t++<400);g.used.add(nm);return nm;}

// ── structures ──
function addStruct(g,type,i,owner,level,name){
  const s={type,i,x:i%g.W,y:(i/g.W)|0,owner,level:level||1,cd:0,grow:0,dead:false,capital:false,name:name==null?-1:name,born:g.tick};
  g.structs.push(s);g.structAt[i]=g.structs.length;touchStruct(g,s,owner,1);return s;
}
function touchStruct(g,s,o,d){if(o){const n=g.nations[o];n.cnt[s.type]+=d;n.defDirty=true;}else g.ncDirty=true;}
function killStruct(g,s){
  if(s.dead)return;s.dead=true;g.structAt[s.i]=0;touchStruct(g,s,s.owner,-1);emit(g,'razed',{s,a:s.owner});
  if(s.type==='mon'){const n=g.nations[s.owner];if(n)n.mon=null;emit(g,'monLost',{a:s.owner});}
}
function defOf(g,n){
  if(n.defDirty){n.defDirty=false;const a=n.defS=[];
    for(const s of g.structs)if(!s.dead&&!s.build&&s.owner===n.id){if(s.type==='city')a.push(s.x,s.y,s.capital?R_CAP*R_CAP:R_CITY*R_CITY,s.capital?2.2:1.5);else if(s.type==='fort')a.push(s.x,s.y,R_FORT*R_FORT,9);}}
  return n.defS;
}
function neutCities(g){if(g.ncDirty){g.ncDirty=false;g.ncity=g.structs.filter(s=>!s.dead&&s.type==='city'&&!s.owner);}return g.ncity;}
function nearestCity(g,owner,x,y){let b=null,bd=1e9;for(const s of g.structs)if(!s.dead&&s.type==='city'&&s.owner===owner){const d=(s.x-x)**2+(s.y-y)**2;if(d<bd){bd=d;b=s;}}return b;}
function portOk(g,i){const W=g.W,b=g.M.big,x=i%W;return(x>0&&b[i-1])||(x<W-1&&b[i+1])||(i>=W&&b[i-W])||(i<g.N-W&&b[i+W])?true:false;}
function buildCost(g,n,type){const s=ST[type];let c=s.cost*(1+s.inc*n.cnt[type]);if(type==='fort'&&FAC[n.fac].fort)c*=FAC[n.fac].fort;return Math.round(c/10)*10;}
function canBuild(g,n,type,i){
  const s=ST[type];if(n.era<s.era)return'era';if(n.gold<buildCost(g,n,type))return'gold';if(type==='mon'&&n.mon)return'busy';
  if(i==null||i<0)return 0;
  if(g.owner[i]!==n.id)return'own';if(g.structAt[i]||g.fall[i]>g.tick)return'busy';
  const x=i%g.W,y=(i/g.W)|0;
  for(const t of g.structs)if(!t.dead){const d=(t.x-x)**2+(t.y-y)**2;if(d<9)return'near';if(type==='city'&&t.type==='city'&&d<CITY_MIN*CITY_MIN)return'cnear';}
  if((type==='port'||type==='coast')&&!portOk(g,i))return'coast';
  return 0;
}
function build(g,n,type,i){
  const r=canBuild(g,n,type,i);if(r)return r;n.gold-=buildCost(g,n,type);
  const s=addStruct(g,type,i,n.id,1,type==='city'?newCityName(g):-1);s.build=g.tick+100;
  if(type==='mon'){n.mon=s;s.cd=g.tick+MON_TIME;emit(g,'monBuilt',{a:n.id,s});for(const m of g.nations)if(m&&m.alive&&m.id!==n.id&&!m.human)m.att[n.id]=-100;}
  emit(g,'built',{a:n.id,s});return 0;
}
function eraCost(n){return Math.round(ERA_COST[n.era]*(FAC[n.fac].era||1));}
function eraUp(g,n){if(n.era>=4||n.gold<eraCost(n))return false;n.gold-=eraCost(n);n.era++;emit(g,'era',{a:n.id,era:n.era});return true;}

// ── territory ──
function setOwner(g,i,o){
  const old=g.owner[i];if(old===o)return;
  g.owner[i]=o;const v=g.M.val[i];
  if(old){const O=g.nations[old];O.tiles--;O.val-=v;}
  if(o){const P=g.nations[o];P.tiles++;P.val+=v;}
  g.dirty.push(i);
  const si=g.structAt[i];if(si)captured(g,g.structs[si-1],old,o);
  if(old){const O=g.nations[old];if(O.alive&&O.tiles<=0)killNation(g,O,o);}
}
function captured(g,s,old,o){
  if(g.annexing&&s.type==='city'){touchStruct(g,s,old,-1);s.owner=o;touchStruct(g,s,o,1);s.capital=false;s.grow=0;return;}
  if(s.type!=='city'){
    if(o&&(s.type==='fort'||s.type==='port')){touchStruct(g,s,old,-1);s.owner=o;touchStruct(g,s,o,1);}else killStruct(g,s);
    return;
  }
  touchStruct(g,s,old,-1);s.owner=o;touchStruct(g,s,o,1);s.grow=0;
  const P=g.nations[o];if(P)P.st.cities++;
  if(!old){emit(g,'cityJoin',{a:o,s});if(P)P.gold+=60*s.level;flipAround(g,s,o,4);return;}
  const O=g.nations[old];if(s.level>1)s.level--;
  emit(g,'cityFall',{a:o,d:old,s,cap:s.capital});
  surrender(g,s,O,o);
  if(s.capital){
    s.capital=false;let best=null;
    for(const c of g.structs)if(!c.dead&&c.type==='city'&&c.owner===old&&(!best||c.level>best.level))best=c;
    if(best){best.capital=true;O.cap=best;O.defDirty=true;O.troops*=.75;O.collapse=g.tick+250;emit(g,'capMoved',{d:old,s:best});}
    else{O.cap=null;collapseNation(g,O,o,s);}
  }
}
// a fallen city drags its province with it
function surrender(g,s,O,o){
  const R=6+s.level,W=g.W,H=g.H,oth=[];for(const c of g.structs)if(!c.dead&&c.type==='city'&&c.owner===O.id)oth.push(c);
  for(let y=Math.max(0,s.y-R);y<=Math.min(H-1,s.y+R);y++)for(let x=Math.max(0,s.x-R);x<=Math.min(W-1,s.x+R);x++){
    const d=(x-s.x)**2+(y-s.y)**2;if(d>R*R)continue;const i=y*W+x;if(g.owner[i]!==O.id)continue;
    const si=g.structAt[i];if(si&&g.structs[si-1].type==='city')continue;
    let near=false;for(const c of oth)if((x-c.x)**2+(y-c.y)**2<d){near=true;break;}
    if(!near)setOwner(g,i,o);
  }
}
function flipAround(g,s,o,R){
  const W=g.W;for(let y=Math.max(0,s.y-R);y<=Math.min(g.H-1,s.y+R);y++)for(let x=Math.max(0,s.x-R);x<=Math.min(W-1,s.x+R);x++){
    const i=y*W+x;if((x-s.x)**2+(y-s.y)**2<=R*R&&g.M.ter[i]>1&&!g.owner[i]&&!g.structAt[i]&&g.fall[i]<=g.tick)setOwner(g,i,o);}
}
// a realm with no city left falls apart: the conqueror takes the heartland, the rest turns lawless
function collapseNation(g,O,o,s){
  if(!O.alive)return;emit(g,'collapse',{d:O.id,a:o});
  const own=g.owner,W=g.W;for(let i=0;i<g.N;i++)if(own[i]===O.id){const dx=i%W-s.x,dy=((i/W)|0)-s.y;setOwner(g,i,dx*dx+dy*dy<=225?o:0);}
  if(O.alive)killNation(g,O,o);
}
function killNation(g,O,by){
  if(!O.alive)return;O.alive=false;O.troops=0;
  const B=g.nations[by];if(B){B.gold+=O.gold*.5;B.st.kills++;}O.gold=0;
  for(const s of g.structs)if(!s.dead&&s.owner===O.id)killStruct(g,s);
  for(const n of g.nations)if(n){n.ally[O.id]=0;O.ally[n.id]=0;}
  emit(g,'dead',{d:O.id,a:by});
}

// annexation: a realm whose every land border is yours, and whose army is smaller, can be absorbed without a fight
function canAnnex(g,a,d){
  const A=g.nations[a],D=g.nations[d],K=g.nations.length,nb=g.nb;if(!A||!D||a===d||!D.minor||!A.alive||!D.alive||A.ally[d]||!nb||nb.length!==K*K||nb[d*K+a]<1||A.troops<=D.troops)return false;
  for(let x=0;x<K;x++)if(x!==a&&x!==d&&nb[d*K+x]>0)return false;
  return true;
}
function annex(g,a,d){
  if(!canAnnex(g,a,d))return false;const D=g.nations[d],own=g.owner;D.cap=null;g.annexing=true;
  for(let i=0;i<g.N;i++)if(own[i]===d)setOwner(g,i,a);
  g.annexing=false;if(D.alive)killNation(g,D,a);emit(g,'annex',{a,d});return true;
}
// ── attacks: fronts spread tile by tile from a priority queue ──
function adjOwn(g,i,a){const W=g.W,own=g.owner,x=i%W;return(x>0&&own[i-1]===a)||(x<W-1&&own[i+1]===a)||(i>=W&&own[i-W]===a)||(i<g.N-W&&own[i+W]===a);}
// a fort is at full strength against attacks of up to 70K troops, then fades, and is useless (and razed) at 700K
function fortF(k){return clamp(1-(k.troops-70000)/630000,0,1);}
function tileDelay(g,k,n,par){
  let dl=T_DELAY[g.M.ter[n]];if(k.d)dl*=1.35;
  if(k.d){const ds=defOf(g,g.nations[k.d]),W=g.W,x=n%W,y=(n/W)|0;for(let j=0;j<ds.length;j+=4)if(ds[j+3]===9){const dx=x-ds[j],dy=y-ds[j+1];if(dx*dx+dy*dy<=ds[j+2]){dl*=1+3*fortF(k);break;}}}
  if(k.tx>=0&&par>=0){const W=g.W;dl*=1+(k.d?.75:.4)*(hyp(n%W-k.tx,((n/W)|0)-k.ty)-hyp(par%W-k.tx,((par/W)|0)-k.ty));}
  return dl*(.55+g.rng()*.9)*g.sSpd*g.nations[k.a].mSpd;
}
function tileCost(g,k,i,A,D){
  const t=g.M.ter[i],W=g.W,x=i%W,y=(i/W)|0;
  if(!D){let c=T_COST[t];const si=g.structAt[i];
    if(si&&g.structs[si-1].type==='city')c=600*g.structs[si-1].level+400;
    else for(const s of neutCities(g)){const dx=x-s.x,dy=y-s.y;if(dx*dx+dy*dy<=10){c*=3;break;}}
    return c*g.sCost/A.mAtk;}
  const dens=D.troops/Math.max(D.tiles,25),ds=defOf(g,D);let z=1;
  for(let j=0;j<ds.length;j+=4){const dx=x-ds[j],dy=y-ds[j+1];if(dx*dx+dy*dy>ds[j+2])continue;const m=ds[j+3]===9?1+5*fortF(k):ds[j+3];if(m>z)z=m;}
  return(T_COST[t]+dens*T_DEF[t]*z*D.mDef+garrison(g,i,D)*D.mDef)*g.sCost/A.mAtk;
}
// a city is held by a share of its nation's whole army: sieges need real force
function garrison(g,i,D){const si=g.structAt[i];if(!si||!D)return 0;const s=g.structs[si-1];return s.type==='city'?D.troops*(.07+.02*s.level)*(s.capital?2:1):0;}
function seedAttack(g,k){
  const own=g.owner,ter=g.M.ter,W=g.W,N=g.N,now=g.tick,seeds=[];let dmin=1e9,ob=-1;
  for(let i=0;i<N;i++){if(own[i]!==k.d||ter[i]<2||!adjOwn(g,i,k.a))continue;seeds.push(i);
    if(k.tx>=0){const d=hyp(i%W-k.tx,((i/W)|0)-k.ty);if(d<dmin){dmin=d;ob=i;}}}
  if(!seeds.length)return 0;
  if(ob<0)ob=seeds[(g.rng()*seeds.length)|0];k.ox=ob%W;k.oy=(ob/W)|0;
  if(k.focus){const f=seeds.filter(s=>(s%W-k.ox)**2+(((s/W)|0)-k.oy)**2<=49);seeds.length=0;for(const s of f)seeds.push(s);}
  const kk=k.d?1.1:.2;
  for(const s of seeds){let p=now+tileDelay(g,k,s,-1);if(k.tx>=0)p+=kk*(hyp(s%W-k.tx,((s/W)|0)-k.ty)-dmin);k.heap.push(p,s);}
  return seeds.length;
}
function inCor(k,x,y){const dx=k.tx-k.ox,dy=k.ty-k.oy,L=dx*dx+dy*dy;let t=L?((x-k.ox)*dx+(y-k.oy)*dy)/L:0;t=t<0?0:t>1?1:t;const ex=k.ox+dx*t-x,ey=k.oy+dy*t-y;return ex*ex+ey*ey<=64||(x-k.tx)**2+(y-k.ty)**2<=100;}
function pushNb(g,k,i){
  const W=g.W,own=g.owner,ter=g.M.ter,x=i%W,h=k.heap,now=g.tick,f=k.focus;let n;
  if(x>0&&own[n=i-1]===k.d&&ter[n]>1&&(!f||inCor(k,n%W,(n/W)|0)))h.push(now+tileDelay(g,k,n,i),n);
  if(x<W-1&&own[n=i+1]===k.d&&ter[n]>1&&(!f||inCor(k,n%W,(n/W)|0)))h.push(now+tileDelay(g,k,n,i),n);
  if(i>=W&&own[n=i-W]===k.d&&ter[n]>1&&(!f||inCor(k,n%W,(n/W)|0)))h.push(now+tileDelay(g,k,n,i),n);
  if(i<g.N-W&&own[n=i+W]===k.d&&ter[n]>1&&(!f||inCor(k,n%W,(n/W)|0)))h.push(now+tileDelay(g,k,n,i),n);
}
function warMark(g,A,D){const now=g.tick;if(now-D.lastHit[A.id]>300)emit(g,'war',{a:A.id,d:D.id});D.lastHit[A.id]=now;A.lastAtk[D.id]=now;D.att[A.id]=Math.max(-100,D.att[A.id]-35);}
function launchAttack(g,a,d,ratio,tx,ty,focus){focus=!!focus;
  const A=g.nations[a];if(!A||!A.alive||a===d)return'no';
  const D=d?g.nations[d]:null,now=g.tick;
  if(D){if(!D.alive)return'no';if(A.ally[d])return'ally';if(now<A.truce[d])return'truce';}
  const com=Math.floor(A.troops*ratio);if(com<100)return'few';
  if(tx==null)tx=ty=-1;
  let cnt=0,same=null;for(const k of g.attacks)if(k.a===a&&!k.cancel){cnt++;if(k.d===d&&!k.naval&&!!k.focus===focus&&(tx<0||k.tx<0||hyp(k.tx-tx,k.ty-ty)<10))same=k;}
  let k=same;
  if(!k){if(cnt>=MAX_ATK)return'max';k={id:++g.aid,a,d,troops:0,heap:new Heap(),tx,ty,ox:0,oy:0,born:now,gain:0,reseed:now,focus:focus&&tx>=0};if(!seedAttack(g,k))return'noborder';}
  A.troops-=com;let tr=com;
  if(D)for(const e of g.attacks)if(e.a===d&&e.d===a&&e.troops>0){const c=Math.min(e.troops,tr);e.troops-=c;tr-=c;if(tr<=0)break;}
  if(D)warMark(g,A,D);
  if(tr<=0)return'clash';
  k.troops+=tr;if(same){if(tx>=0){k.tx=tx;k.ty=ty;}}else g.attacks.push(k);
  return k;
}
function tickAttacks(g){
  const own=g.owner,now=g.tick;
  for(let ai=g.attacks.length-1;ai>=0;ai--){
    const k=g.attacks[ai],A=g.nations[k.a],D=k.d?g.nations[k.d]:null,h=k.heap;
    let done=!A.alive||(D&&(!D.alive||A.ally[k.d]))||k.troops<=0||k.cancel;
    if(!done){
      let pops=0;
      while(h.size&&h.peek()<=now&&pops++<700){
        const i=h.pop();if(own[i]!==k.d)continue;
        if(g.fall[i]>now){h.push(g.fall[i]+1,i);continue;}
        if(!adjOwn(g,i,k.a))continue;
        const c=tileCost(g,k,i,A,D);if(k.troops<c){done=true;break;}
        k.troops-=c;k.gain++;A.st.conq++;
        if(D){D.troops-=Math.min(D.troops,D.troops/Math.max(D.tiles,25)+garrison(g,i,D)*.5);D.st.lost++;D.lastHitAny=now;D.lastHit[k.a]=now;A.lastAtk[k.d]=now;}
        if(k.troops>=700000&&g.structAt[i]&&g.structs[g.structAt[i]-1].type==='fort')killStruct(g,g.structs[g.structAt[i]-1]);
        setOwner(g,i,k.a);
        if(D&&!D.alive){done=true;break;}
        pushNb(g,k,i);
      }
      if(!done&&!h.size){if(k.focus)done=true;else if(now-k.reseed>10){k.reseed=now;if(!seedAttack(g,k))done=true;}}
    }
    if(done){if(A.alive&&k.troops>0)A.troops+=k.troops;emit(g,'atkEnd',{a:k.a,d:k.d,gain:k.gain,id:k.id});g.attacks[ai]=g.attacks[g.attacks.length-1];g.attacks.pop();}
  }
}

// ── naval landings ──
function boatSlots(n){return 2+n.cnt.port+(FAC[n.fac].slots||0);}
function waterPath(g,a,ti){
  const W=g.W,H=g.H,ter=g.M.ter,prev=g.prev,q=g.q;prev.fill(-1);let qh=0,qt=0;const tx=ti%W,ty=(ti/W)|0;
  for(let d=0;d<8;d++){const x=tx+DX8[d],y=ty+DY8[d];if(x<0||y<0||x>=W||y>=H)continue;const j=y*W+x;if(ter[j]<2&&prev[j]<0){prev[j]=j;q[qt++]=j;}}
  while(qh<qt){const c=q[qh++];
    if(adjOwn(g,c,a)){const p=[c];let k=c;while(prev[k]!==k){k=prev[k];p.push(k);}return p;}
    const cx=c%W,cy=(c/W)|0;
    for(let d=0;d<8;d++){const x=cx+DX8[d],y=cy+DY8[d];if(x<0||y<0||x>=W||y>=H)continue;const j=y*W+x;if(ter[j]<2&&prev[j]<0){prev[j]=c;q[qt++]=j;}}}
  return null;
}
// nearest coastal tile (same owner as i) around i
function nearCoast(g,i,R){
  const W=g.W,o=g.owner[i],x0=i%W,y0=(i/W)|0;let b=-1,bd=1e9;
  for(let y=Math.max(0,y0-R);y<=Math.min(g.H-1,y0+R);y++)for(let x=Math.max(0,x0-R);x<=Math.min(W-1,x0+R);x++){
    const j=y*W+x;if(g.M.coastD[j]!==1||g.owner[j]!==o||!portOk(g,j))continue;const d=(x-x0)**2+(y-y0)**2;if(d<bd){bd=d;b=j;}}
  return b;
}
function launchBoat(g,a,ti,ratio){
  const A=g.nations[a],o=g.owner[ti];if(!A.alive||o===a||g.M.ter[ti]<2)return'no';
  if(o){if(A.ally[o])return'ally';if(g.tick<A.truce[o])return'truce';}
  let c=0;for(const b of g.boats)if(b.a===a)c++;if(c>=boatSlots(A))return'maxb';
  const tr=Math.floor(A.troops*ratio);if(tr<200)return'few';
  const path=waterPath(g,a,ti);if(!path)return'nopath';
  A.troops-=tr;const b={a,troops:tr,path,p:0,ti,spd:.5*(FAC[A.fac].boat||1)};g.boats.push(b);emit(g,'boat',{a,d:o});return b;
}
function landing(g,b){
  const i=b.ti,o=g.owner[i],A=g.nations[b.a],D=o?g.nations[o]:null,now=g.tick;
  if(o===b.a||(D&&(A.ally[o]||now<A.truce[o]))||g.fall[i]>now){A.troops+=b.troops;return;}
  const k={id:++g.aid,a:b.a,d:o,troops:b.troops,heap:new Heap(),tx:-1,ty:-1,ox:i%g.W,oy:(i/g.W)|0,born:now,gain:1,reseed:now,naval:true};
  const c=tileCost(g,k,i,A,D);if(D)warMark(g,A,D);
  if(k.troops<c){emit(g,'landFail',{a:b.a,d:o,x:k.ox,y:k.oy});return;}
  k.troops-=c;if(D){D.troops-=Math.min(D.troops,D.troops/Math.max(D.tiles,25));D.lastHitAny=now;}
  setOwner(g,i,b.a);pushNb(g,k,i);g.attacks.push(k);emit(g,'landed',{a:b.a,d:o,x:k.ox,y:k.oy});
}
function tickBoats(g){
  // coastal batteries shell hostile ships in range once a second
  if(g.tick%10===0){const W=g.W;for(const s of g.structs){if(s.dead||s.build||s.type!=='coast')continue;const O=g.nations[s.owner];let best=null,bd=170,bc=0;
    for(const b of g.boats){if(b.a===s.owner||O.ally[b.a]||b.sunk)continue;const c=b.path[Math.min(b.path.length-1,Math.floor(b.p))],d=(c%W-s.x)**2+(((c/W)|0)-s.y)**2;if(d<bd){bd=d;best=b;bc=c;}}
    if(best){best.troops-=Math.max(800,best.troops*.15);emit(g,'shot',{x:s.x,y:s.y,tx:bc%W,ty:(bc/W)|0});if(best.troops<300){best.sunk=true;emit(g,'sunk',{a:s.owner,d:best.a,x:bc%W,y:(bc/W)|0});}}}}
  for(let j=g.boats.length-1;j>=0;j--){const b=g.boats[j];let rm=!g.nations[b.a].alive||b.sunk;
    if(!rm){b.p+=b.spd;if(b.p>=b.path.length-1){landing(g,b);rm=true;}}
    if(rm){g.boats[j]=g.boats[g.boats.length-1];g.boats.pop();}}
}

// ── trade ships: each port sends a ship to a foreign port and back; the round trip pays gold ──
function portPath(g,a,b,open){
  const W=g.W,H=g.H,ter=g.M.ter,wd=g.M.wd,prev=g.prev,q=g.q,goal=[];prev.fill(-1);let qh=0,qt=0;
  // with `open`, ships must stay 4+ tiles off any shore except while leaving or entering harbour
  const ok=(j,x,y)=>ter[j]<2&&(!open||wd[j]>=4||(x-a.x)**2+(y-a.y)**2<=64||(x-b.x)**2+(y-b.y)**2<=64);
  for(let d=0;d<8;d++){const x=b.x+DX8[d],y=b.y+DY8[d];if(x>=0&&y>=0&&x<W&&y<H&&ter[y*W+x]<2)goal.push(y*W+x);}
  for(let d=0;d<8;d++){const x=a.x+DX8[d],y=a.y+DY8[d];if(x<0||y<0||x>=W||y>=H)continue;const j=y*W+x;if(ter[j]<2&&prev[j]<0){prev[j]=j;q[qt++]=j;}}
  while(qh<qt){const c=q[qh++];
    if(goal.indexOf(c)>=0){const p=[c];let k=c;while(prev[k]!==k){k=prev[k];p.push(k);}return p.reverse();}
    const cx=c%W,cy=(c/W)|0;
    for(let d=0;d<8;d++){const x=cx+DX8[d],y=cy+DY8[d];if(x<0||y<0||x>=W||y>=H)continue;const j=y*W+x;if(prev[j]<0&&ok(j,x,y)){prev[j]=c;q[qt++]=j;}}}
  return null;
}
function launchTrade(g,s){
  const A=g.nations[s.owner],now=g.tick,c=[];
  for(const p of g.structs)if(!p.dead&&!p.build&&p.type==='port'&&p.owner&&p.owner!==s.owner&&now-A.lastHit[p.owner]>300&&now-g.nations[p.owner].lastHit[s.owner]>300)c.push(p);
  if(!c.length)return;const d=c[(g.rng()*c.length)|0],rt=s.rt||(s.rt={});let path=rt[d.i];
  if(path===undefined)path=rt[d.i]=portPath(g,s,d,true)||portPath(g,s,d,false);if(!path||path.length<4)return;
  g.trades.push({a:s.owner,from:s,to:d,path,p:0,dir:1,spd:.45*(FAC[A.fac].boat||1)});
}
function tickTrades(g){
  for(let j=g.trades.length-1;j>=0;j--){const b=g.trades[j],A=g.nations[b.a];let rm=!A.alive||b.from.dead||b.from.owner!==b.a;
    if(!rm){b.p+=b.spd*b.dir;
      if(b.dir>0&&b.p>=b.path.length-1){b.p=b.path.length-1;b.dir=-1;if(b.to.dead||!b.to.owner)rm=true;else g.nations[b.to.owner].gold+=b.path.length*.6;}
      else if(b.dir<0&&b.p<=0){const amt=Math.round((60+b.path.length*2.2)*(1+.25*(A.era-1))*(FAC[A.fac].port||1));A.gold+=amt;emit(g,'trade',{a:b.a,amt,x:b.from.x,y:b.from.y});rm=true;}}
    if(rm){g.trades[j]=g.trades[g.trades.length-1];g.trades.pop();}}
}
// nearest enemy shore reachable by sea from our own coast (used when the tapped spot has no usable beach)
function seaLanding(g,a,o){
  const W=g.W,H=g.H,N=g.N,ter=g.M.ter,own=g.owner,prev=g.prev,q=g.q,now=g.tick;prev.fill(-1);let qh=0,qt=0;
  for(let i=0;i<N;i++)if(ter[i]<2&&adjOwn(g,i,a)){prev[i]=i;q[qt++]=i;}
  while(qh<qt){const c=q[qh++],cx=c%W,cy=(c/W)|0;
    for(let d=0;d<4;d++){const x=cx+DX8[d],y=cy+DY8[d];if(x<0||y<0||x>=W||y>=H)continue;const j=y*W+x;if(ter[j]>1&&own[j]===o&&g.fall[j]<=now)return j;}
    for(let d=0;d<8;d++){const x=cx+DX8[d],y=cy+DY8[d];if(x<0||y<0||x>=W||y>=H)continue;const j=y*W+x;if(ter[j]<2&&prev[j]<0){prev[j]=c;q[qt++]=j;}}}
  return -1;
}
// a port may be placed a little inland: it snaps to the nearest free shore tile
function snapPort(g,n,i,R,ty){ty=ty||'port';
  if(!canBuild(g,n,ty,i))return i;const W=g.W,x0=i%W,y0=(i/W)|0;let b=i,bd=1e9;
  for(let y=Math.max(0,y0-R);y<=Math.min(g.H-1,y0+R);y++)for(let x=Math.max(0,x0-R);x<=Math.min(W-1,x0+R);x++){const d=(x-x0)**2+(y-y0)**2;if(d<bd&&d<=R*R&&!canBuild(g,n,ty,y*W+x)){bd=d;b=y*W+x;}}
  return b;
}
// ── missiles, blasts, ultimates ──
function mslCost(n,type){return Math.round(MSL[type].cost*(FAC[n.fac].msl||1));}
function launchMissile(g,a,type,ti){
  const A=g.nations[a],m=MSL[type],now=g.tick;if(A.era<m.era)return'era';const cost=mslCost(A,type);if(A.gold<cost)return'gold';
  if(ti==null||ti<0||g.M.ter[ti]<2)return'no';const o=g.owner[ti];if(o&&A.ally[o])return'ally';
  const tx=ti%g.W,ty=(ti/g.W)|0;let silo=null,bd=1e9;
  for(const s of g.structs)if(!s.dead&&s.owner===a&&s.type==='silo'&&!s.build&&s.cd<=now){const d=hyp(s.x-tx,s.y-ty);if(d<bd){bd=d;silo=s;}}
  if(!silo)return A.cnt.silo?'cd':'nosilo';
  A.gold-=cost;silo.cd=now+m.cd;if(type==='nuke')A.st.nukes++;
  g.missiles.push({a,type,sx:silo.x,sy:silo.y,tx,ty,t:0,dur:clamp(bd*.55,22,80)});emit(g,'launch',{a,type,x:tx,y:ty,d:o});return 0;
}
function tickMissiles(g){
  for(let j=g.missiles.length-1;j>=0;j--){const m=g.missiles[j];m.t+=1/m.dur;if(m.t<1)continue;g.missiles.splice(j,1);
    let hit=true;
    for(const s of g.structs)if(!s.dead&&!s.build&&s.type==='shield'&&s.owner!==m.a&&!g.nations[s.owner].ally[m.a]&&s.cd<=g.tick&&(s.x-m.tx)**2+(s.y-m.ty)**2<=SHIELD_R*SHIELD_R){
      s.cd=g.tick+60;if(g.rng()<(m.type==='doom'?.35:m.type==='nuke'?.5:.8)){hit=false;emit(g,'intercept',{x:m.tx,y:m.ty,a:s.owner});break;}}
    if(hit){const nk=m.type==='nuke',dm=m.type==='doom';blast(g,m.tx,m.ty,MSL[m.type].r,m.a,{fall:dm?900:nk?600:100,kill:dm?4:nk?3:1.6,lvl:dm?3:nk?2:1});emit(g,'boom',{x:m.tx,y:m.ty,r:MSL[m.type].r,type:m.type,a:m.a});}}
}
function blast(g,cx,cy,R,by,o){
  const W=g.W,H=g.H,now=g.tick,hits=new Map();
  for(let y=Math.max(0,Math.floor(cy-R));y<=Math.min(H-1,Math.ceil(cy+R));y++)for(let x=Math.max(0,Math.floor(cx-R));x<=Math.min(W-1,Math.ceil(cx+R));x++){
    const d=hyp(x-cx,y-cy);if(d>R)continue;const i=y*W+x;if(g.M.ter[i]<2||(o.coast&&g.M.coastD[i]>o.coast))continue;
    const si=g.structAt[i];
    if(si&&g.structs[si-1].type==='city'){const s=g.structs[si-1];if(d<=R*.8&&s.level>1)s.level=Math.max(1,s.level-o.lvl);continue;}
    const ow=g.owner[i];if(ow&&g.rng()<1.2-d/R*.6){hits.set(ow,(hits.get(ow)||0)+1);setOwner(g,i,0);}
    if(o.fall&&d<=R*.92){if(g.fall[i]<=now)g.fallList.push(i);g.fall[i]=Math.floor(now+o.fall*(.6+.4*g.rng()));g.dirty.push(i);}
  }
  for(const[ow,c]of hits){const O=g.nations[ow];if(!O.alive)continue;
    O.troops=Math.max(0,O.troops-Math.min(O.troops*.7,c*(O.troops/Math.max(O.tiles+c,25))*o.kill));O.lastHitAny=now;
    if(by&&by!==ow){O.lastHit[by]=now;O.att[by]=Math.max(-100,O.att[by]-50);if(O.ally[by])breakAlly(g,by,ow);}}
}
function useUlt(g,n,ti){
  const u=FAC[n.fac].ult,U=ULT[u],now=g.tick,W=g.W;if(now<n.ultAt)return'cd';if(n.gold<U.cost)return'gold';
  let x=-1,y=-1;
  if(U.tg){
    if(ti==null||ti<0)return'target';x=ti%W;y=(ti/W)|0;
    if(u==='bribe'){
      const R=9,list=[];let ok=false;
      for(let Y=Math.max(0,y-R);Y<=Math.min(g.H-1,y+R);Y++)for(let X=Math.max(0,x-R);X<=Math.min(W-1,x+R);X++){
        if((X-x)**2+(Y-y)**2>R*R)continue;const i=Y*W+X,o=g.owner[i];if(o===n.id){ok=true;continue;}
        if(o&&!n.ally[o]&&!(g.structAt[i]&&g.structs[g.structAt[i]-1].type==='city'))list.push(i);}
      if(!ok)return'far';if(!list.length)return'no';
      for(const i of list){const o=g.owner[i];if(!o)continue;const O=g.nations[o];if(now-O.lastHit[n.id]>50)warMark(g,n,O);setOwner(g,i,n.id);}
    }else g.pending.push({type:u,x,y,at:now+(u==='beam'?12:18),by:n.id});
  }else if(u==='blitz')n.blitz=now+220;else if(u==='wall')n.wall=now+250;else n.troops+=n.maxT*.35;
  n.gold-=U.cost;n.ultAt=now+U.cd;emit(g,'ult',{a:n.id,u,x,y});return 0;
}
function tickPending(g){
  const now=g.tick;for(let j=g.pending.length-1;j>=0;j--){const p=g.pending[j];if(now<p.at)continue;g.pending.splice(j,1);
    if(p.type==='meteor')blast(g,p.x,p.y,6,0,{fall:150,kill:1.5,lvl:1});
    else if(p.type==='tsunami')blast(g,p.x,p.y,10,p.by,{coast:4,kill:2,lvl:1});
    else blast(g,p.x,p.y,5,p.by,{fall:60,kill:2.5,lvl:1});
    emit(g,'boom',{x:p.x,y:p.y,r:p.type==='tsunami'?10:6,type:p.type,a:p.by||0});}
}

// ── diplomacy ──
function setAlly(g,a,b){
  const A=g.nations[a],B=g.nations[b];A.ally[b]=B.ally[a]=1;A.allyAt[b]=B.allyAt[a]=g.tick;A.allyUntil[b]=B.allyUntil[a]=g.tick+ALLY_T;A.allyRen[b]=B.allyRen[a]=A.allyWarn[b]=B.allyWarn[a]=0;A.att[b]=Math.max(A.att[b],30);B.att[a]=Math.max(B.att[a],30);
  for(const k of g.attacks)if((k.a===a&&k.d===b)||(k.a===b&&k.d===a))k.cancel=true;emit(g,'ally',{a,b});
}
function breakAlly(g,a,b){
  const A=g.nations[a],B=g.nations[b];if(!A.ally[b])return;A.ally[b]=B.ally[a]=0;A.truce[b]=B.truce[a]=g.tick+150;
  B.att[a]=Math.min(B.att[a],-40);for(const n of g.nations)if(n&&n.id!==a&&n.id!==b)n.att[a]=Math.max(-100,n.att[a]-10);emit(g,'betray',{a,b});
}
// alliances last two minutes; 20 seconds before the end each side says whether it wants to carry on
function aiRenew(g,A,B){return A.att[B.id]>0&&g.hegemon!==B.id&&g.rng()<.85?1:0;}
function allyPass(g){
  const now=g.tick,ns=g.nations;
  for(const A of ns){if(!A||!A.alive)continue;for(const B of ns){if(!B||B.id<=A.id||!B.alive||!A.ally[B.id])continue;const a=A.id,b=B.id,u=A.allyUntil[b];
    if(!A.allyWarn[b]&&u-now<=200){A.allyWarn[b]=B.allyWarn[a]=1;if(!A.human)A.allyRen[b]=aiRenew(g,A,B);if(!B.human)B.allyRen[a]=aiRenew(g,B,A);emit(g,'allyWarn',{a,b});}
    if(now>=u){if(A.allyRen[b]&&B.allyRen[a]){A.allyUntil[b]=B.allyUntil[a]=u+ALLY_T;A.allyWarn[b]=B.allyWarn[a]=A.allyRen[b]=B.allyRen[a]=0;emit(g,'allyRenew',{a,b});}
      else{const by=A.allyRen[b]?b:a;A.ally[b]=B.ally[a]=0;A.truce[b]=B.truce[a]=now+150;emit(g,'allyEnd',{a,b,by});}}}}
}
function propose(g,a,b){
  const A=g.nations[a],B=g.nations[b];if(!A.alive||!B.alive||A.ally[b])return'no';
  if(B.human){if(g.proposals.some(p=>p.from===a&&p.to===b))return'wait';g.proposals.push({from:a,to:b,until:g.tick+250});emit(g,'proposal',{a,b});return'wait';}
  if(aiAccepts(g,B,A)){setAlly(g,a,b);return'yes';}emit(g,'reject',{a:b,b:a});return'rejected';
}
function gift(g,a,b,amt){
  const A=g.nations[a],B=g.nations[b];amt=Math.floor(Math.min(amt,A.gold));if(amt<10)return false;A.gold-=amt;B.gold+=amt;
  B.att[a]=Math.min(100,B.att[a]+Math.min(40,amt/(B.income*2+20)*10));emit(g,'gift',{a,b,amt});return true;
}
function callArms(g,a,target){
  let any=false;for(const m of g.nations)if(m&&m.alive&&!m.human&&m.ally[a]&&!m.ally[target]&&m.id!==target){
    m.ai.focus=target;m.ai.focusUntil=g.tick+900;m.ai.nextWar=Math.min(m.ai.nextWar,g.tick+20);m.att[target]=Math.max(-100,m.att[target]-30);any=true;emit(g,'say',{a:m.id,key:'arms',to:a});}
  return any;
}

// ── economy, seasons, world ──
function economy(g){
  const now=g.tick;for(const n of g.nations){if(!n||!n.alive)continue;const f=FAC[n.fac];
    n.mSpd=(f.spd||1)*(now<n.blitz?.5:1);n.mAtk=(1+.08*(n.era-1))*(now<n.blitz?1.25:1);n.mDef=(f.def||1)*(now<n.wall?2.5:1)*(now<n.collapse?.55:1);
    const x=clamp(n.troops/n.maxT,.04,2);let gr=x<1?n.maxT*.0048*x*(1-x):-(n.troops-n.maxT)*.02;
    if(gr>0)gr*=(f.grow||1)*g.sGrow*(n.human?1:g.diff.grow)*(n.minor?.45:1)*(1-clamp((n.tiles/g.M.land-.2)*1.6,0,.6));
    n.troops+=gr;n.gold+=n.income/TPS;}
}
function structPass(g){
  const ns=g.nations;let ports=0;for(const n of ns)if(n){n._pop=0;n._inc=0;}
  for(const s of g.structs)if(!s.dead&&s.type==='port')ports++;
  for(const s of g.structs){if(s.dead||!s.owner)continue;const n=ns[s.owner];if(s.build){if(s.build>g.tick)continue;s.build=0;n.defDirty=true;}
    if(s.type==='city'){n._pop+=4000*s.level*(s.capital?1.5:1);n._inc+=1+s.level;
      if(s.level<5&&g.tick-n.lastHitAny>150&&++s.grow>=40+35*s.level){s.grow=0;s.level++;emit(g,'cityUp',{a:n.id,s});}}
    else if(s.type==='port'){n._inc+=2*(FAC[n.fac].port||1);if(g.tick>=(s.tcd||0)){s.tcd=g.tick+250+((g.rng()*120)|0);launchTrade(g,s);}}}
  for(const n of ns)if(n&&n.alive){const f=FAC[n.fac];
    n.maxT=6000+n.val*120*(1+.12*(n.era-1))+n._pop;if(n.minor)n.maxT*=.5;
    n.income=(3+n.val*.003+n._inc)*(f.gold||1)*g.sGold*(1+.1*(n.era-1))*(n.human?1:g.diff.gold);
    if(n.tiles>n.st.peak)n.st.peak=n.tiles;}
}
function seasonTick(g){const s=Math.floor(g.tick/SEASON_LEN)%4;if(s!==g.season){g.season=s;const S=SEAS[s];g.sSpd=S.spd;g.sCost=S.cost;g.sGrow=S.grow;g.sGold=S.gold;emit(g,'season',{s});}}
// centroids, bounding boxes, border lengths between every pair (index 0 = neutral)
function statsPass(g){
  const K=g.nations.length,W=g.W,H=g.H,own=g.owner,ter=g.M.ter,cd=g.M.coastD,ns=g.nations;
  const nb=g.nb&&g.nb.length===K*K?g.nb.fill(0):(g.nb=new Int32Array(K*K)),sx=new Float64Array(K),sy=new Float64Array(K),ct=new Int32Array(K);
  for(const n of ns)if(n){n.x0=W;n.y0=H;n.x1=0;n.y1=0;n.coast=0;}
  for(let y=0,i=0;y<H;y++)for(let x=0;x<W;x++,i++){
    if(ter[i]<2)continue;const o=own[i];
    if(o){const n=ns[o];sx[o]+=x;sy[o]+=y;ct[o]++;if(x<n.x0)n.x0=x;if(x>n.x1)n.x1=x;if(y<n.y0)n.y0=y;if(y>n.y1)n.y1=y;if(cd[i]===1)n.coast++;}
    if(x<W-1&&ter[i+1]>1){const p=own[i+1];if(p!==o){nb[o*K+p]++;nb[p*K+o]++;}}
    if(y<H-1&&ter[i+W]>1){const p=own[i+W];if(p!==o){nb[o*K+p]++;nb[p*K+o]++;}}
  }
  for(const n of ns)if(n&&n.alive&&ct[n.id]){const x=Math.round(sx[n.id]/ct[n.id]),y=Math.round(sy[n.id]/ct[n.id]);
    if(own[y*W+x]===n.id){n.cx=x;n.cy=y;}else{let f=false;for(let r=2;r<=60&&!f;r+=2)for(let d=0;d<8&&!f;d++){const X=x+DX8[d]*r,Y=y+DY8[d]*r;if(X>=0&&Y>=0&&X<W&&Y<H&&own[Y*W+X]===n.id){n.cx=X;n.cy=Y;f=true;}}if(!f&&n.cap){n.cx=n.cap.x;n.cy=n.cap.y;}}}
}
// encirclement: small landlocked enemy pockets and tiny neutral gaps fall to whoever surrounds them
function pocketPass(g){
  const W=g.W,N=g.N,own=g.owner,ter=g.M.ter,lab=g.lab,q=g.q,now=g.tick;lab.fill(0);
  for(let s=0;s<N;s++){
    if(lab[s]||ter[s]<2)continue;const o=own[s];let qh=0,qt=0,nbo=-1,water=false,bad=false,hasS=false;q[qt++]=s;lab[s]=1;
    while(qh<qt){const c=q[qh++],x=c%W;if(g.fall[c]>now)bad=true;if(g.structAt[c])hasS=true;
      for(let d=0;d<4;d++){let j;if(d===0){if(x===0)continue;j=c-1;}else if(d===1){if(x===W-1)continue;j=c+1;}else if(d===2){if(c<W)continue;j=c-W;}else{if(c>=N-W)continue;j=c+W;}
        if(ter[j]<2){water=true;continue;}const p=own[j];
        if(p===o){if(!lab[j]){lab[j]=1;q[qt++]=j;}}else if(nbo===-1)nbo=p;else if(nbo!==p)nbo=-2;}}
    if(bad||nbo<=0||qt>300||(hasS&&qt>25))continue;const K=g.nations[nbo];if(!K.alive)continue;
    if(o===0){if(qt>45)continue;}
    else{const O=g.nations[o];if((water&&!hasS)||O.ally[nbo]||now<K.truce[o])continue;O.troops*=Math.max(.3,1-qt/Math.max(O.tiles,1));emit(g,'pocket',{a:nbo,d:o,n:qt,x:s%W,y:(s/W)|0});}
    const list=Array.from(q.subarray(0,qt));for(const i of list)setOwner(g,i,nbo);
  }
}
function worldEvent(g){
  const r=g.rng(),now=g.tick,W=g.W;g.nextEvent=now+500+g.rng()*500;
  const al=g.nations.filter(n=>n&&n.alive);if(al.length<2)return;
  if(r<.34){for(let t=0;t<60;t++){const i=(g.rng()*g.N)|0;if(g.M.ter[i]>1&&!g.structAt[i]){g.pending.push({type:'meteor',x:i%W,y:(i/W)|0,at:now+50});emit(g,'meteorWarn',{x:i%W,y:(i/W)|0});break;}}}
  else if(r<.62){const top=al.reduce((a,b)=>b.tiles>a.tiles?b:a);if(top.tiles<500)return;
    for(let t=0;t<90;t++){const x=top.x0+((g.rng()*(top.x1-top.x0+1))|0),y=top.y0+((g.rng()*(top.y1-top.y0+1))|0);if(g.owner[y*W+x]!==top.id)continue;
      let near=false;for(const s of g.structs)if(!s.dead&&s.type==='city'&&s.owner===top.id&&(s.x-x)**2+(s.y-y)**2<81){near=true;break;}if(near)continue;
      const R=6+g.rng()*5;let c=0;
      for(let Y=Math.max(0,Math.floor(y-R));Y<=Math.min(g.H-1,y+R);Y++)for(let X=Math.max(0,Math.floor(x-R));X<=Math.min(W-1,x+R);X++){
        const d=hyp(X-x,Y-y),i=Y*W+X;if(d<=R&&g.owner[i]===top.id&&!g.structAt[i]&&g.rng()<1.15-d/R*.5){setOwner(g,i,0);c++;}}
      top.troops*=Math.max(.5,1-c/(top.tiles+c));emit(g,'rebel',{d:top.id,x,y});break;}}
  else if(r<.8){const top=al.reduce((a,b)=>b.troops>a.troops?b:a);top.troops*=.75;emit(g,'plague',{d:top.id});}
  else{for(const n of al)n.gold+=70*n.cnt.city*n.era;emit(g,'caravan',{});}
}
function checkOver(g){
  let alive=0,last=null,top=null;for(const n of g.nations)if(n&&n.alive){alive++;last=n;if(!top||n.tiles>top.tiles)top=n;}
  if(!top)return;let w=null,why='';
  const share=top.tiles/g.M.land;let h=share>.3?top.id:0;
  for(const n of g.nations)if(n&&n.alive&&n.mon){h=n.id;if(g.tick>=n.mon.cd){w=n;why='mon';}}
  g.hegemon=h;const c=h&&(share>.4||g.nations[h].mon)?h:0;if(c&&g.coalition!==c)emit(g,'coalition',{d:c});g.coalition=c;
  if(!w){if(alive===1){w=last;why='last';}else if(share>=(g.o.mp?.99:WIN_SHARE)){w=top;why='dom';}}
  const hu=g.nations[g.human];
  if(w)g.over={win:w.id===g.human,w:w.id,why};else if(hu&&!hu.alive&&!g.o.mp)g.over={win:false,w:0,why:'dead'};
  if(g.over)emit(g,'over',g.over);
}
function snapshot(g){
  const W=g.W,dv=g.N>250000?4:g.N>120000?3:2,w=(W/dv)|0,h=(g.H/dv)|0,s=new Uint8Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)s[y*w+x]=g.owner[y*dv*W+x*dv];
  g.snaps.push(s);if(g.snaps.length>360){g.snaps=g.snaps.filter((_,i)=>i%2===0);g.snapEvery*=2;}
}
function tick(g){
  if(g.over||!g.started)return;const now=++g.tick;
  seasonTick(g);economy(g);tickAttacks(g);tickBoats(g);tickTrades(g);tickMissiles(g);tickPending(g);
  if(now%10===0){
    structPass(g);allyPass(g);const fl=g.fallList;for(let j=fl.length-1;j>=0;j--)if(g.fall[fl[j]]<=now){g.dirty.push(fl[j]);fl[j]=fl[fl.length-1];fl.pop();}
    for(let j=g.proposals.length-1;j>=0;j--)if(now>g.proposals[j].until||!g.nations[g.proposals[j].from].alive)g.proposals.splice(j,1);
    if(now>=g.nextEvent)worldEvent(g);
    checkOver(g);if(g.over)return;
  }
  if(now%20===5){statsPass(g);pocketPass(g);}
  for(const n of g.nations)if(n&&n.alive&&!n.human&&(now+n.id)%10===0)aiThink(g,n);
  if(now%g.snapEvery===0)snapshot(g);
  if(g.ev.length>4000)g.ev.splice(0,2000);
}
