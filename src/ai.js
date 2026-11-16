// ── SIJAL · AI leaders: expansion, war, building, diplomacy ──
function say(g,n,key,to){emit(g,'say',{a:n.id,key,to});}
function commonEnemy(g,a,b){const now=g.tick;for(const e of g.nations)if(e&&e.alive&&e!==a&&e!==b&&now-a.lastHit[e.id]<600&&(now-b.lastHit[e.id]<600||now-b.lastAtk[e.id]<600))return true;return false;}
function aiAccepts(g,B,A){
  const P=PERS[B.pers];let allies=0;for(const n of g.nations)if(n&&n.alive&&B.ally[n.id])allies++;
  if(B.minor||allies>=2||g.hegemon===A.id||A.mon)return false;
  let s=B.att[A.id]+P.trust*30-15;if(g.tick-B.lastHit[A.id]<600)s-=40;if(A.troops>B.troops*1.3)s+=10;if(commonEnemy(g,B,A))s+=15;
  return s>20;
}
function aiThink(g,n){
  if(n.minor){
    // tribes: creep into free land, raid each other, and only rarely dare to raid a real realm
    const K=g.nations.length,now=g.tick,rng=g.rng,ai=n.ai;let has=false;for(const k of g.attacks)if(k.a===n.id)has=true;
    if(has||n.troops/n.maxT<.5)return;
    if(n.tiles<260&&g.nb[n.id*K]>0){launchAttack(g,n.id,0,.25,-1,-1);return;}
    if(now<ai.nextWar)return;ai.nextWar=now+250+rng()*450;let best=null,bs=0;
    for(const m of g.nations){if(!m||!m.alive||m===n||g.nb[n.id*K+m.id]<3)continue;
      if(!m.minor&&(rng()>.05||(m.human&&now<g.grace)))continue;
      const s=n.troops/(m.troops+1)*(m.minor?1:3)+rng()*.4;if(s>1.1&&s>bs){bs=s;best=m;}}
    if(best){const c=nearestCity(g,best.id,n.cx,n.cy);launchAttack(g,n.id,best.id,.45,c?c.x:-1,c?c.y:-1);}
    return;
  }
  const ai=n.ai,P=PERS[n.pers],now=g.tick,K=g.nations.length,id=n.id,rng=g.rng,U=FAC[n.fac].ult,ratio=n.troops/n.maxT;
  let myAtk=0,neut=null,inc=0,worst=0,wt=0;
  for(const k of g.attacks){if(k.a===id){myAtk++;if(!k.d&&!k.naval)neut=k;}else if(k.d===id){inc+=k.troops;if(k.troops>wt){wt=k.troops;worst=k.a;}}}
  if(n.era<4&&n.gold>=eraCost(n)*(n.cnt.city<2?1.6:1))eraUp(g,n);
  if(now>=ai.nextBuild){ai.nextBuild=now+25+rng()*30;aiBuild(g,n,worst);}
  if(now>=ai.nextDip){ai.nextDip=now+50;aiDip(g,n);}
  if(inc>n.troops*.45){
    if(neut)neut.cancel=true;
    if(U==='wall'||U==='levy')useUlt(g,n);
    if(worst&&ratio>.15&&rng()<.5){const c=nearestCity(g,worst,n.cx,n.cy);launchAttack(g,id,worst,.5,c?c.x:-1,c?c.y:-1);}
    return;
  }
  const nbN=g.nb[id*K];
  if(nbN>0&&!neut&&ratio>.3&&myAtk<MAX_ATK){
    const c=nearestCity(g,0,n.cx,n.cy),far=c?hyp(c.x-n.cx,c.y-n.cy):99;
    launchAttack(g,id,0,.3+.2*P.agg,far<50?c.x:-1,far<50?c.y:-1);
  }
  if(myAtk<3&&now>=ai.nextWar&&ratio>(nbN>0?.66:.5)){
    let best=null,bs=P.thr;const nd=n.troops/Math.max(n.tiles,1);
    for(const m of g.nations){
      if(!m||!m.alive||m.id===id||n.ally[m.id]||now<n.truce[m.id]||g.nb[id*K+m.id]<3||(m.human&&now<g.grace))continue;
      const md=m.troops/Math.max(m.tiles,1);
      const s=clamp(nd/(md+1),0,2.5)*.6*(.5+P.agg)-n.att[m.id]/50+(now-m.lastHitAny<100?.35:0)+(g.hegemon===m.id?.9:0)
        +(ai.focus===m.id&&now<ai.focusUntil?1.5:0)+(m.human?g.diff.hate:0)+(m.mon?2:0)+(now<m.collapse?.6:0);
      if(s>bs){bs=s;best=m;}
    }
    if(best){
      const c=nearestCity(g,best.id,n.cx,n.cy);if(U==='blitz')useUlt(g,n);
      const r=launchAttack(g,id,best.id,.35+.3*P.agg,c?c.x:-1,c?c.y:-1);
      ai.nextWar=now+110+rng()*220;ai.last=best.id;if(typeof r==='object'&&best.human&&now-(ai.saidWar||-999)>600){ai.saidWar=now;say(g,n,'war',best.id);}
    }else ai.nextWar=now+30;
  }
  if(now>=ai.nextNaval&&ratio>.5&&n.coast>3&&(nbN===0||rng()<.2)){ai.nextNaval=now+120+rng()*240;aiNaval(g,n);}
  if(n.era>=3&&n.cnt.silo&&now>=ai.nextMsl){ai.nextMsl=now+150+rng()*200;aiMissile(g,n);}
  if(ULT[U].tg)aiUlt(g,n);
}
function aiBuild(g,n,threat){
  const K=g.nations.length;let hostile=threat,type=null,enemySilo=false;
  if(!hostile){let w=-30;for(const m of g.nations)if(m&&m.alive&&m.id!==n.id&&!n.ally[m.id]&&g.nb[n.id*K+m.id]>2&&n.att[m.id]<w){w=n.att[m.id];hostile=m.id;}}
  for(const m of g.nations)if(m&&m.alive&&m.id!==n.id&&!n.ally[m.id]&&m.cnt.silo)enemySilo=true;
  const wantCity=n.cnt.city<1+Math.floor(n.tiles/600),G=n.gold;
  if(wantCity&&G>=buildCost(g,n,'city'))type='city';
  else if(hostile&&n.cnt.fort<1+Math.floor(n.tiles/700)&&G>=buildCost(g,n,'fort')*(wantCity?2.5:1.2))type='fort';
  else if(n.era>=2&&n.coast>8&&n.cnt.port<Math.min(3,1+Math.floor(n.tiles/1500))&&G>=buildCost(g,n,'port')*1.5)type='port';
  else if(n.era>=3&&n.cnt.silo<(n.tiles>2500?2:1)&&G>=buildCost(g,n,'silo')*1.2)type='silo';
  else if(n.era>=3&&enemySilo&&n.cnt.shield<1+(n.mon?1:0)&&G>=buildCost(g,n,'shield')*1.4)type='shield';
  if(!type)return;const i=aiSite(g,n,type,hostile);if(i>=0)build(g,n,type,i);
}
function aiSite(g,n,type,hostile){
  const W=g.W,H=g.H,rng=g.rng,own=g.owner,w=n.x1-n.x0+1,h=n.y1-n.y0+1;let best=-1,bs=-1e9;
  if(w<=0||h<=0||!n.cap)return -1;
  for(let t=0;t<80;t++){
    const x=n.x0+((rng()*w)|0),y=n.y0+((rng()*h)|0),i=y*W+x;if(own[i]!==n.id||canBuild(g,n,type,i))continue;
    let inner=0,enemy=0;
    for(let d=0;d<8;d++){const X=x+DX8[d]*4,Y=y+DY8[d]*4;if(X<0||Y<0||X>=W||Y>=H)continue;const o=own[Y*W+X];if(o===n.id)inner++;else if(o&&!n.ally[o]&&(!hostile||o===hostile))enemy++;}
    let cityD=1e9,sameD=1e9;
    for(const s of g.structs)if(!s.dead&&s.owner===n.id){const d=hyp(s.x-x,s.y-y);if(s.type==='city'&&d<cityD)cityD=d;if(s.type===type&&d<sameD)sameD=d;}
    let s=rng()*2;
    if(type==='city')s+=inner*1.5+g.M.val[i]*6+Math.min(24,cityD)*.5;
    else if(type==='fort'){if(!enemy||sameD<8)continue;s+=enemy*2+inner*.5-cityD*.25;}
    else if(type==='port')s+=inner-cityD*.2+Math.min(sameD,30)*.2;
    else s+=inner*2-hyp(n.cap.x-x,n.cap.y-y)*.25;
    if(s>bs){bs=s;best=i;}
  }
  return best;
}
function aiDip(g,n){
  const P=PERS[n.pers],now=g.tick,K=g.nations.length,id=n.id,rng=g.rng,ai=n.ai;let allies=0,foes=0;
  for(const m of g.nations){
    if(!m||!m.alive||m.id===id)continue;let a=n.att[m.id];
    if(n.ally[m.id]){allies++;a=Math.min(70,a+2);}
    else if(g.nb[id*K+m.id]>2){foes++;a-=1+3*P.agg;}
    else a+=a<0?1:-.3;
    if(g.hegemon===m.id)a-=6;
    n.att[m.id]=clamp(a,-100,100);
  }
  for(const m of g.nations){
    if(!m||!m.alive||!n.ally[m.id])continue;const age=now-n.allyAt[m.id];let br=false;
    if(g.coalition===m.id||m.mon)br=true;
    else if(age>900&&foes===0&&g.nb[id*K]===0&&rng()<.15+.4*P.tre)br=true;
    else if(age>1200&&g.nb[id*K+m.id]>2&&m.troops<n.troops*.6&&rng()<.02+.06*P.tre)br=true;
    else if(!m.human&&age>2400&&rng()<.2)br=true;
    if(br){breakAlly(g,id,m.id);if(m.human)say(g,n,'betray',m.id);return;}
  }
  if(allies<(P.trust>.6?2:1)&&rng()<.35&&now-ai.propAt>300){
    let best=null,bs=18;
    for(const m of g.nations){
      if(!m||!m.alive||m.id===id||n.ally[m.id]||g.hegemon===m.id||m.mon||now-n.lastHit[m.id]<600)continue;
      if(m.minor)continue;
      if(m.human&&(now<(g.propCd||0)||!(g.nb[id*K+m.id]>0||(n.cap&&m.cap&&hyp(n.cap.x-m.cap.x,n.cap.y-m.cap.y)<45))))continue;
      const s=n.att[m.id]+P.trust*20+(commonEnemy(g,n,m)?20:0);if(s>bs){bs=s;best=m;}
    }
    if(best){ai.propAt=best.human?now+1500:now;if(best.human)g.propCd=now+900;propose(g,id,best.id);}
  }
}
function aiNaval(g,n){
  const M=g.M,W=g.W,rng=g.rng,K=g.nations.length,nd=n.troops/Math.max(n.tiles,1),foc=g.tick<n.ai.focusUntil?n.ai.focus:0;let best=-1,bd=1e9;
  for(let t=0;t<140;t++){
    const i=(rng()*g.N)|0;if(M.coastD[i]!==1||!portOk(g,i))continue;const o=g.owner[i];if(o===n.id)continue;
    if(o){const m=g.nations[o];if(n.ally[o]||g.tick<n.truce[o])continue;
      if(o!==foc){if(g.nb[n.id*K+o]>0)continue;if(m.troops/Math.max(m.tiles,1)>nd*.7&&g.hegemon!==o&&!m.mon)continue;}}
    else if(g.nb[n.id*K]>0&&rng()<.7)continue;
    const d=hyp(i%W-n.cx,((i/W)|0)-n.cy)*(o&&o!==foc?1.5:1);if(d<bd){bd=d;best=i;}
  }
  if(best>=0)launchBoat(g,n.id,best,.3+rng()*.2);
}
function aiMissile(g,n){
  const now=g.tick;let tgt=null,ts=0;
  for(const m of g.nations){if(!m||!m.alive||m.id===n.id||n.ally[m.id])continue;
    let s=0;if(now-n.lastHit[m.id]<600||now-n.lastAtk[m.id]<600)s=1;if(g.hegemon===m.id)s+=1;if(m.mon)s+=3;if(s>ts){ts=s;tgt=m;}}
  if(!tgt)return;const nuke=n.era>=4&&n.gold>=mslCost(n,'nuke')*1.15;if(!nuke&&n.gold<mslCost(n,'rocket')*1.8)return;
  const W8={mon:10,silo:6,shield:5,city:2,fort:3,port:2};let best=null,bs=-1;
  for(const s of g.structs)if(!s.dead&&s.owner===tgt.id){const v=W8[s.type]+(s.type==='city'?s.level:0)+g.rng();if(v>bs){bs=v;best=s;}}
  if(best)launchMissile(g,n.id,nuke?'nuke':'rocket',best.i);
}
function aiUlt(g,n){
  const U=FAC[n.fac].ult,now=g.tick,e=n.ai.last,m=e&&g.nations[e];
  if(now<n.ultAt||n.gold<ULT[U].cost*1.5||!m||!m.alive||n.ally[e]||now-n.lastAtk[e]>300)return;
  if(U==='bribe'){const k=g.attacks.find(k=>k.a===n.id&&k.d===e);if(k)useUlt(g,n,k.oy*g.W+k.ox);return;}
  let best=null;for(const s of g.structs)if(!s.dead&&s.owner===e&&(U==='beam'||g.M.coastD[s.i]<=4)&&(!best||s.level>best.level))best=s;
  if(best)useUlt(g,n,best.i);
}
