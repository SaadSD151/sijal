// ── SIJAL · procedural world generation (pure data, no DOM) ──
function genMap(o){
  const W=o.w,H=o.h,N=W*H,rng=mulberry32(o.seed),fbm=makeNoise(o.seed*7+13),fb2=makeNoise(o.seed*31+7);
  const elev=new Float32Array(N),ter=new Uint8Array(N),val=new Float32Array(N),moist=new Float32Array(N),T=o.type||'continents',asp=W/H;
  const F={continents:2.4,pangaea:2.2,islands:4,inner:2.7,twin:2.5,shores:3.4,crescent:2.6,straits:2.5,lakes:3.6}[T]||2.5;
  for(let y=0,i=0;y<H;y++)for(let x=0;x<W;x++,i++){
    const u=x/H,v=y/H,nx=x/W,ny=y/H,wx=fb2(u*1.7+5.2,v*1.7+1.3,3)*.4,wy=fb2(u*1.7+9.1,v*1.7+7.7,3)*.4;
    let e=fbm((u+wx)*F,(v+wy)*F,6);
    const cx=(nx-.5)*2,cy=(ny-.5)*2,rc=hyp(cx,cy)/1.2,ed=Math.min(Math.min(nx,1-nx)*asp,Math.min(ny,1-ny));
    if(T==='pangaea')e=e*.75+(.55-rc)*.8;else if(T==='inner')e=e*.7+(rc-.45)*.75;else if(T==='twin')e=e*.8-bump(nx-.5,.008)*.8;
    else if(T==='shores')e=e*.95+(.5-rc)*.35;else if(T==='crescent')e=e*.6+(.26-Math.abs(hyp(cx+.35,cy*.9)-.78))*1.3;
    else if(T==='straits')e=e*.8-bump(ny-.34,.0032)*.8-bump(ny-.67,.0032)*.8;else if(T==='lakes')e=e*.9+(.6-rc)*.3;
    elev[i]=e-(1-smooth(0,.09,ed))*1.5;moist[i]=fb2(u*3+40,v*3+17,4);
  }
  const ratio={continents:.47,pangaea:.52,islands:.34,inner:.46,twin:.46,shores:.46,crescent:.4,straits:.5,lakes:.7}[T]||.45;
  const srt=Float32Array.from(elev).sort(),L0=Math.floor(N*(1-ratio)),sea=srt[L0],LN=N-L0;
  const hHill=srt[L0+Math.floor(LN*.74)]-sea,hMnt=srt[L0+Math.floor(LN*.9)]-sea,hmax=srt[N-1]-sea;
  for(let i=0;i<N;i++)elev[i]-=sea;
  // remove specks & ponds, mark open water
  const land=new Uint8Array(N),lab=new Uint8Array(N),q=new Int32Array(N),big=new Uint8Array(N);
  for(let i=0;i<N;i++)land[i]=elev[i]>=0?1:0;
  for(let s=0;s<N;s++){if(lab[s])continue;const k=land[s];let qh=0,qt=0;q[qt++]=s;lab[s]=1;
    while(qh<qt){const c=q[qh++],x=c%W;
      if(x>0&&!lab[c-1]&&land[c-1]===k){lab[c-1]=1;q[qt++]=c-1;}if(x<W-1&&!lab[c+1]&&land[c+1]===k){lab[c+1]=1;q[qt++]=c+1;}
      if(c>=W&&!lab[c-W]&&land[c-W]===k){lab[c-W]=1;q[qt++]=c-W;}if(c<N-W&&!lab[c+W]&&land[c+W]===k){lab[c+W]=1;q[qt++]=c+W;}}
    if(k&&qt<10)for(let j=0;j<qt;j++){land[q[j]]=0;elev[q[j]]=-.012;big[q[j]]=1;}
    else if(!k&&qt<40)for(let j=0;j<qt;j++){land[q[j]]=1;elev[q[j]]=.004;}
    else if(!k)for(let j=0;j<qt;j++)big[q[j]]=1;}
  let landN=0;
  for(let y=0,i=0;y<H;y++)for(let x=0;x<W;x++,i++){
    const e=elev[i];if(!land[i]){ter[i]=e>-.05?1:0;continue;}landN++;
    const u=x/H,v=y/H,temp=(y/H)*.9+.05+fb2(u*2+80,v*2+33,3)*.35-(e/hmax)*.2,m=moist[i];
    ter[i]=e>=hMnt?6:e>=hHill?5:temp<.26?7:(temp>.6&&m<.03)?4:m>.07?3:2;
  }
  // distance from land tiles to water
  const cd=new Uint8Array(N).fill(255);let qh=0,qt=0;
  for(let i=0;i<N;i++)if(!land[i]){cd[i]=0;q[qt++]=i;}
  while(qh<qt){const c=q[qh++],d=cd[c]+1,x=c%W;if(d>250)continue;
    if(x>0&&cd[c-1]>d){cd[c-1]=d;q[qt++]=c-1;}if(x<W-1&&cd[c+1]>d){cd[c+1]=d;q[qt++]=c+1;}if(c>=W&&cd[c-W]>d){cd[c-W]=d;q[qt++]=c-W;}if(c<N-W&&cd[c+W]>d){cd[c+W]=d;q[qt++]=c+W;}}
  const wd=new Uint8Array(N).fill(255);qh=0;qt=0;
  for(let i=0;i<N;i++)if(land[i]){wd[i]=0;q[qt++]=i;}
  while(qh<qt){const c=q[qh++],d=wd[c]+1,x=c%W;if(d>6)continue;
    if(x>0&&wd[c-1]>d){wd[c-1]=d;q[qt++]=c-1;}if(x<W-1&&wd[c+1]>d){wd[c+1]=d;q[qt++]=c+1;}if(c>=W&&wd[c-W]>d){wd[c-W]=d;q[qt++]=c-W;}if(c<N-W&&wd[c+W]>d){wd[c+W]=d;q[qt++]=c+W;}}
  // rivers: steepest descent from the highlands to the sea
  const riv=new Uint8Array(N),rivers=[],want=Math.round(landN/2000)+2;
  for(let t=0;t<want*10&&rivers.length<want;t++){
    let i=-1;for(let k=0;k<50;k++){const j=(rng()*N)|0;if(land[j]&&elev[j]>hHill*.85&&!riv[j]){i=j;break;}}if(i<0)continue;
    const path=[i],seen=new Set([i]);let ok=false;
    for(let s=0;s<500;s++){let best=-1,be=1e9;const x=i%W,y=(i/W)|0;
      for(let d=0;d<8;d++){const X=x+DX8[d],Y=y+DY8[d];if(X<0||Y<0||X>=W||Y>=H)continue;const n=Y*W+X;if(seen.has(n))continue;const e=elev[n]+rng()*.004;if(e<be){be=e;best=n;}}
      if(best<0||be>elev[i]+.02)break;i=best;path.push(i);seen.add(i);if(!land[i]||riv[i]){ok=true;break;}}
    if(ok&&path.length>=10){rivers.push(path);for(const p of path)riv[p]=1;}
  }
  for(let i=0;i<N;i++)if(riv[i]&&land[i]){const x=i%W;for(const n of[i,x>0?i-1:i,x<W-1?i+1:i,i>=W?i-W:i,i<N-W?i+W:i]){if(!land[n])continue;if(ter[n]===4)ter[n]=2;if(riv[n]<2)riv[n]=riv[n]||2;}}
  for(let i=0;i<N;i++)if(land[i])val[i]=T_VAL[ter[i]]+(riv[i]?.35:0);
  // neutral cities
  const cities=[],used=new Set(),nc=clamp(Math.round(landN/1100),6,90);
  for(let t=0;t<nc*120&&cities.length<nc;t++){
    const x=4+(rng()*(W-8))|0,y=4+(rng()*(H-8))|0,i=y*W+x,tt=ter[i];if(tt<2||tt===6)continue;
    if(rng()>(cd[i]<=2?.5:0)+(riv[i]?.4:0)+T_VAL[tt]*.5+.12)continue;
    if(cities.some(c=>(c.x-x)**2+(c.y-y)**2<169))continue;
    let nm;do{nm=(rng()*288)|0;}while(used.has(nm));used.add(nm);
    cities.push({x,y,i,level:1+(rng()<.35?1:0),name:nm});
  }
  return{W,H,N,seed:o.seed,type:T,ter,elev,val,moist,coastD:cd,wd,big,riv,rivers,land:landN,cities,used,hHill,hMnt,hmax};
}
