// ── SIJAL · renderer: painted relief map, territory overlay, units, effects ──
const R={TS:4,land:null,snow:null,water:null,own:null,octx:null,oimg:null,o32:null,winter:0,autumn:0,glyph:{},url:{},shake:0,fx:[],flakes:[],full:true};
const cam={x:0,y:0,z:4,tx:0,ty:0,tz:4},view={w:0,h:0,dpr:1},FONT="'IBM Plex Sans Arabic','Tajawal',system-ui,sans-serif";
let cv,ctx;
function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
const w2s=(x,y)=>({x:(x-cam.x)*cam.z+view.w/2,y:(y-cam.y)*cam.z+view.h/2});
const s2w=(x,y)=>({x:(x-view.w/2)/cam.z+cam.x,y:(y-view.h/2)/cam.z+cam.y});
function resize(){
  const r=cv.getBoundingClientRect();view.w=Math.max(50,r.width);view.h=Math.max(50,r.height);view.dpr=Math.min(window.devicePixelRatio||1,2);
  cv.width=Math.round(view.w*view.dpr);cv.height=Math.round(view.h*view.dpr);
}
function fitZoom(g){return Math.min(view.w/g.W,view.h/g.H);}
function camStep(g){
  cam.tz=clamp(cam.tz,fitZoom(g)*.85,30);cam.tx=clamp(cam.tx,0,g.W);cam.ty=clamp(cam.ty,0,g.H);
  cam.x+=(cam.tx-cam.x)*.3;cam.y+=(cam.ty-cam.y)*.3;cam.z+=(cam.tz-cam.z)*.3;
}
function zoomAt(g,sx,sy,f,instant){
  const w=s2w(sx,sy);cam.tz=clamp(cam.tz*f,fitZoom(g)*.85,30);cam.tx=w.x-(sx-view.w/2)/cam.tz;cam.ty=w.y-(sy-view.h/2)/cam.tz;
  if(instant){cam.z=cam.tz;cam.x=cam.tx;cam.y=cam.ty;}
}
function lookAt(x,y,z,instant){cam.tx=x;cam.ty=y;if(z)cam.tz=z;if(instant){cam.x=x;cam.y=y;if(z)cam.z=z;}}

function natPix(n){
  const[r,g,b]=n.color,k=n.me?0:.5,m=n.me?.7:0,q=v=>clamp(Math.round(v*(1-k)*(1-m)+255*m),0,255);
  n.pF=((138<<24)|(b<<16)|(g<<8)|r)>>>0;n.pB=((255<<24)|(q(b)<<16)|(q(g)<<8)|q(r))>>>0;n.css=`rgb(${r},${g},${b})`;
}
// pre-render the world once: land (opaque), winter variant, and a water layer drawn over the territory for smooth coasts
function buildTerrain(g){
  const M=g.M,W=M.W,H=M.H,N=M.N,TS=R.TS=W*H>150000?2:W*H>70000?3:4,PW=W*TS,PH=H*TS,el=M.elev,ter=M.ter;
  const BC=[[216,200,152],[216,200,152],[124,160,84],[70,118,66],[222,198,136],[148,142,100],[128,122,116],[226,232,236]];
  const cr=new Float32Array(N),cg=new Float32Array(N),cb=new Float32Array(N),sh=new Float32Array(N),fo=new Float32Array(N),sn=new Float32Array(N),e0=k=>el[k]<-.01?-.01:el[k];
  for(let i=0;i<N;i++){
    const t=ter[i],c=BC[t],m=M.moist[i],x=i%W,y=(i/W)|0;let r=c[0],gg=c[1],b=c[2];
    if(t===2){r-=m*54;gg+=m*16;b-=m*30;}else if(t===3){r-=m*20;gg-=m*24;}else if(t===4){r+=m*20;gg+=m*14;}
    cr[i]=r;cg[i]=gg;cb[i]=b;fo[i]=t===3?1:0;sn[i]=t===7?.1:t===4?.3:t<2?.5:.8;
    sh[i]=((x<W-1?e0(i+1):e0(i))-(x>0?e0(i-1):e0(i))+(y<H-1?e0(i+W):e0(i))-(y>0?e0(i-W):e0(i)))*(t>=5?1.7:1);
  }
  const li=new ImageData(PW,PH),wi=new ImageData(PW,PH),si=new ImageData(PW,PH),L=li.data,Wd=wi.data,S=si.data,nz=makeNoise(M.seed+99),cap=M.hMnt*1.3;
  for(let py=0,p=0;py<PH;py++){
    const fy=(py+.5)/TS-.5,y0=clamp(Math.floor(fy),0,H-1),y1=Math.min(y0+1,H-1),ty=clamp(fy-y0,0,1);
    for(let px=0;px<PW;px++,p+=4){
      const fx=(px+.5)/TS-.5,x0=clamp(Math.floor(fx),0,W-1),x1=Math.min(x0+1,W-1),tx=clamp(fx-x0,0,1);
      const a=y0*W+x0,b=y0*W+x1,c=y1*W+x0,d=y1*W+x1,wa=(1-tx)*(1-ty),wb=tx*(1-ty),wc=(1-tx)*ty,wd=tx*ty;
      const e=el[a]*wa+el[b]*wb+el[c]*wc+el[d]*wd,n=nz(px*.05,py*.05,3);
      let r=cr[a]*wa+cr[b]*wb+cr[c]*wc+cr[d]*wd,gg=cg[a]*wa+cg[b]*wb+cg[c]*wc+cg[d]*wd,bl=cb[a]*wa+cb[b]*wb+cb[c]*wc+cb[d]*wd;
      let s=1+clamp((sh[a]*wa+sh[b]*wb+sh[c]*wc+sh[d]*wd)*9,-.38,.42)+n*.17;
      const fr=fo[a]*wa+fo[b]*wb+fo[c]*wc+fo[d]*wd;
      if(fr>.3&&(((px*73856093)^(py*19349663))>>>0)%7<2)s-=.17*fr;
      if(e>=0&&e<.012){const k=(1-e/.012)*.8;r=lerp(r,224,k);gg=lerp(gg,208,k);bl=lerp(bl,162,k);}
      if(e>cap){const k=clamp((e-cap)/(M.hmax-cap+1e-6)*2.4,0,1);r=lerp(r,240,k);gg=lerp(gg,244,k);bl=lerp(bl,248,k);}
      L[p]=r*s;L[p+1]=gg*s;L[p+2]=bl*s;L[p+3]=255;
      const k=sn[a]*wa+sn[b]*wb+sn[c]*wc+sn[d]*wd,ss=s*.5+.52;S[p]=lerp(r,234,k)*ss;S[p+1]=lerp(gg,240,k)*ss;S[p+2]=lerp(bl,247,k)*ss;S[p+3]=255;
      if(e<.004){
        const dp=Math.sqrt(clamp(-e/.24,0,1)),wv=1+n*.13;let wr=lerp(78,9,dp),wg=lerp(172,40,dp),wb2=lerp(190,88,dp);
        if(e>-.006){wr=lerp(wr,238,.5);wg=lerp(wg,246,.5);wb2=lerp(wb2,246,.5);}
        Wd[p]=wr*wv;Wd[p+1]=wg*wv;Wd[p+2]=wb2*wv;Wd[p+3]=clamp((.004-e)/.008,0,1)*255;
      }
    }
  }
  R.land=mk(PW,PH);R.snow=mk(PW,PH);R.water=mk(PW,PH);
  R.land.getContext('2d').putImageData(li,0,0);R.snow.getContext('2d').putImageData(si,0,0);R.water.getContext('2d').putImageData(wi,0,0);
  for(const cnv of[R.land,R.snow]){
    const c=cnv.getContext('2d');c.lineCap=c.lineJoin='round';
    for(const pth of M.rivers)for(let pass=0;pass<2;pass++){
      c.strokeStyle=pass?(cnv===R.snow?'#c4e2f0':'#5eb2dc'):'rgba(18,54,84,.32)';c.lineWidth=TS*(pass?.4:.72);c.beginPath();
      const P=pth.map(t=>[(t%W+.5)*TS,(((t/W)|0)+.5)*TS]);c.moveTo(P[0][0],P[0][1]);
      for(let j=1;j<P.length-1;j++)c.quadraticCurveTo(P[j][0],P[j][1],(P[j][0]+P[j+1][0])/2,(P[j][1]+P[j+1][1])/2);
      c.lineTo(P[P.length-1][0],P[P.length-1][1]);c.stroke();
    }
  }
  R.own=mk(W*2,H*2);R.octx=R.own.getContext('2d');R.oimg=R.octx.createImageData(W*2,H*2);R.o32=new Uint32Array(R.oimg.data.buffer);R.full=true;R.fx.length=0;R.winter=0;
}
// territory overlay at 2x: corners are rounded (EPX) so borders flow instead of stair-stepping
function tileWrite(g,i){
  const W=g.W,W2=W*2,o32=R.o32,ter=g.M.ter,own=g.owner,N=g.nations,x=i%W,y=(i/W)|0,p=y*2*W2+x*2;
  if(ter[i]<2){o32[p]=o32[p+1]=o32[p+W2]=o32[p+W2+1]=0;return;}
  const P=own[i],A=y>0&&ter[i-W]>1?own[i-W]:-1,B=x<W-1&&ter[i+1]>1?own[i+1]:-1,C=x>0&&ter[i-1]>1?own[i-1]:-1,D=y<g.H-1&&ter[i+W]>1?own[i+W]:-1;
  const bd=(A>=0&&A!==P)||(B>=0&&B!==P)||(C>=0&&C!==P)||(D>=0&&D!==P),base=P?(bd?N[P].pB:N[P].pF):g.fall[i]>g.tick?0x8830c858:0;
  let p1=base,p2=base,p3=base,p4=base;
  if(bd){
    if(C===A&&C>=0&&C!==P&&C!==D&&A!==B)p1=A?N[A].pB:0;
    if(A===B&&A>=0&&A!==P&&A!==C&&B!==D)p2=B?N[B].pB:0;
    if(D===C&&D>=0&&D!==P&&D!==B&&C!==A)p3=C?N[C].pB:0;
    if(B===D&&B>=0&&B!==P&&B!==A&&D!==C)p4=D?N[D].pB:0;
  }
  o32[p]=p1;o32[p+1]=p2;o32[p+W2]=p3;o32[p+W2+1]=p4;
}
function refreshOwn(g){
  const d=g.dirty,W=g.W,H=g.H,N=g.N;if(!d.length&&!R.full)return;
  if(R.full||d.length>N/4){for(let i=0;i<N;i++)tileWrite(g,i);R.full=false;R.octx.putImageData(R.oimg,0,0);}
  else{
    let x0=W,y0=H,x1=0,y1=0;
    for(const i of d){const x=i%W,y=(i/W)|0;tileWrite(g,i);if(x>0)tileWrite(g,i-1);if(x<W-1)tileWrite(g,i+1);if(i>=W)tileWrite(g,i-W);if(i<N-W)tileWrite(g,i+W);
      if(x-1<x0)x0=x-1;if(x+1>x1)x1=x+1;if(y-1<y0)y0=y-1;if(y+1>y1)y1=y+1;}
    x0=Math.max(0,x0);y0=Math.max(0,y0);x1=Math.min(W-1,x1);y1=Math.min(H-1,y1);R.octx.putImageData(R.oimg,0,0,x0*2,y0*2,(x1-x0+1)*2,(y1-y0+1)*2);
  }
  d.length=0;
}
function makeGlyphs(){
  const G={},d=(k,f)=>{const c=mk(64,64),x=c.getContext('2d');x.fillStyle=x.strokeStyle='#fff';x.lineWidth=5;x.lineCap=x.lineJoin='round';f(x);G[k]=c;R.url[k]=c.toDataURL();};
  const poly=(x,p)=>{x.beginPath();p.forEach((q,i)=>i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]));x.closePath();x.fill();};
  d('city',x=>{x.fillRect(11,30,13,24);x.fillRect(27,14,12,40);x.fillRect(42,26,11,28);x.clearRect(31,20,4,6);x.clearRect(31,31,4,6);x.clearRect(15,36,4,5);x.clearRect(45,32,4,5);});
  d('cap',x=>{const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?11:25;p.push([32+Math.cos(a)*r,33+Math.sin(a)*r]);}poly(x,p);});
  d('fort',x=>{x.fillRect(13,25,38,29);x.fillRect(13,13,9,14);x.fillRect(27.5,13,9,14);x.fillRect(42,13,9,14);x.clearRect(27,38,10,16);});
  d('port',x=>{x.beginPath();x.arc(32,15,5.5,0,7);x.stroke();x.beginPath();x.moveTo(32,21);x.lineTo(32,54);x.moveTo(21,30);x.lineTo(43,30);x.stroke();x.beginPath();x.arc(32,36,17,.12*Math.PI,.88*Math.PI);x.stroke();});
  d('silo',x=>{x.beginPath();x.moveTo(32,6);x.quadraticCurveTo(45,22,41,44);x.lineTo(23,44);x.quadraticCurveTo(19,22,32,6);x.fill();poly(x,[[23,36],[12,54],[25,48]]);poly(x,[[41,36],[52,54],[39,48]]);x.fillRect(28,47,8,10);});
  d('shield',x=>{x.beginPath();x.arc(32,46,19,Math.PI,0);x.closePath();x.fill();x.beginPath();x.arc(32,46,28,1.14*Math.PI,1.86*Math.PI);x.stroke();x.fillRect(12,48,40,6);});
  d('mon',x=>{poly(x,[[32,5],[40,17],[43,53],[21,53],[24,17]]);x.fillRect(13,52,38,7);});
  d('nuke',x=>{for(let i=0;i<3;i++){const a=-Math.PI/2+i*2.094;x.beginPath();x.moveTo(32,32);x.arc(32,32,26,a-.52,a+.52);x.closePath();x.fill();}x.globalCompositeOperation='destination-out';x.beginPath();x.arc(32,32,9,0,7);x.fill();x.globalCompositeOperation='source-over';x.beginPath();x.arc(32,32,5,0,7);x.fill();});
  d('coast',x=>{x.beginPath();x.arc(26,40,14,0,7);x.fill();x.lineWidth=9;x.beginPath();x.moveTo(30,34);x.lineTo(55,13);x.stroke();x.fillRect(8,53,40,6);});
  d('ruin',x=>{x.fillRect(8,40,12,16);x.beginPath();x.moveTo(22,56);x.lineTo(22,24);x.lineTo(27,30);x.lineTo(31,18);x.lineTo(36,27);x.lineTo(36,56);x.fill();x.fillRect(40,46,15,10);x.beginPath();x.moveTo(40,46);x.lineTo(46,38);x.lineTo(50,44);x.lineTo(55,40);x.lineTo(55,46);x.fill();x.fillRect(4,56,56,4);});
  d('ally',x=>{x.lineWidth=7;x.beginPath();x.arc(23,32,14,0,7);x.stroke();x.beginPath();x.arc(41,32,14,0,7);x.stroke();});
  d('coin',x=>{x.beginPath();x.arc(32,32,24,0,7);x.fill();x.globalCompositeOperation='destination-out';x.lineWidth=4;x.beginPath();x.arc(32,32,16,0,7);x.stroke();x.fillRect(29,20,6,24);x.globalCompositeOperation='source-over';});
  d('eye',x=>{x.beginPath();x.moveTo(4,32);x.quadraticCurveTo(32,4,60,32);x.quadraticCurveTo(32,60,4,32);x.fill();x.globalCompositeOperation='destination-out';x.beginPath();x.arc(32,32,11,0,7);x.fill();x.globalCompositeOperation='source-over';x.beginPath();x.arc(32,32,6,0,7);x.fill();});
  d('ship',x=>{x.beginPath();x.moveTo(6,40);x.lineTo(58,40);x.lineTo(48,54);x.lineTo(16,54);x.closePath();x.fill();x.fillRect(30,8,4,32);x.beginPath();x.moveTo(34,10);x.lineTo(52,36);x.lineTo(34,36);x.closePath();x.fill();x.beginPath();x.moveTo(30,14);x.lineTo(14,36);x.lineTo(30,36);x.closePath();x.fill();});
  d('flag',x=>{x.fillRect(12,8,6,50);x.beginPath();x.moveTo(18,10);x.lineTo(54,20);x.lineTo(18,32);x.fill();});
  d('bolt',x=>poly(x,[[37,5],[15,36],[29,36],[25,59],[49,26],[35,26]]));
  d('sword',x=>{x.lineWidth=6;x.beginPath();x.moveTo(12,52);x.lineTo(48,10);x.moveTo(52,52);x.lineTo(16,10);x.stroke();x.lineWidth=5;x.beginPath();x.moveTo(10,38);x.lineTo(24,52);x.moveTo(54,38);x.lineTo(40,52);x.stroke();});
  d('crown',x=>poly(x,[[8,50],[6,18],[20,32],[32,10],[44,32],[58,18],[56,50]]));
  R.glyph=G;
}
function addFx(type,x,y,o){R.fx.push(Object.assign({type,x,y,t:0,dur:900},o));}
const mslPos=(m,t)=>w2s(lerp(m.sx,m.tx,t)+.5,lerp(m.sy,m.ty,t)+.5-Math.sin(Math.PI*t)*Math.hypot(m.tx-m.sx,m.ty-m.sy)*.28);
function txt(c,s,x,y,fill){c.strokeText(s,x,y);c.fillStyle=fill;c.fillText(s,x,y);}

function draw(g,dt,ts){
  const c=ctx,dpr=view.dpr,cw=view.w,ch=view.h,me=g.human;
  refreshOwn(g);camStep(g);const z=cam.z;
  R.winter+=((g.season===3?1:0)-R.winter)*.025;R.autumn+=((g.season===2?1:0)-R.autumn)*.025;
  let shx=0,shy=0;if(R.shake>.3){shx=(Math.random()-.5)*R.shake;shy=(Math.random()-.5)*R.shake;R.shake*=.9;}
  c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#092440';c.fillRect(0,0,cw,ch);
  c.setTransform(dpr*z,0,0,dpr*z,dpr*(cw/2-cam.x*z+shx),dpr*(ch/2-cam.y*z+shy));
  c.imageSmoothingEnabled=true;c.drawImage(R.land,0,0,g.W,g.H);
  if(R.winter>.01){c.globalAlpha=R.winter;c.drawImage(R.snow,0,0,g.W,g.H);c.globalAlpha=1;}
  if(R.autumn>.01){c.fillStyle=`rgba(214,120,30,${R.autumn*.09})`;c.fillRect(0,0,g.W,g.H);}
  c.drawImage(R.own,0,0,g.W,g.H);c.drawImage(R.water,0,0,g.W,g.H);
  c.setTransform(dpr,0,0,dpr,0,0);c.lineCap=c.lineJoin='round';c.textAlign='center';c.textBaseline='middle';
  // offensives that involve the player: where they start and where they are headed
  if(me)for(const k of g.attacks){
    const mine=k.a===me;if((!mine&&k.d!==me)||k.tx<0||Math.hypot(k.tx-k.ox,k.ty-k.oy)<4)continue;
    const a=w2s(k.ox+.5,k.oy+.5),b=w2s(k.tx+.5,k.ty+.5),mx=(a.x+b.x)/2-(b.y-a.y)*.18,my=(a.y+b.y)/2+(b.x-a.x)*.18,an=Math.atan2(b.y-my,b.x-mx);
    c.strokeStyle=mine?'rgba(255,240,200,.85)':'rgba(255,90,70,.85)';c.lineWidth=3;c.setLineDash([9,7]);c.lineDashOffset=-ts/40;
    c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo(mx,my,b.x,b.y);c.stroke();c.setLineDash([]);
    c.fillStyle=c.strokeStyle;c.beginPath();c.moveTo(b.x,b.y);c.lineTo(b.x-Math.cos(an-.45)*13,b.y-Math.sin(an-.45)*13);c.lineTo(b.x-Math.cos(an+.45)*13,b.y-Math.sin(an+.45)*13);c.closePath();c.fill();
  }
  // rubble left where a city was wiped out
  for(const rb of g.ruins){const p=w2s(rb.x+.5,rb.y+.5);if(p.x<-30||p.y<-30||p.x>cw+30||p.y>ch+30)continue;const q=clamp(z*2.6,14,26);c.globalAlpha=.85;c.fillStyle='rgba(40,34,30,.55)';c.beginPath();c.arc(p.x,p.y,q*.62,0,7);c.fill();c.filter='brightness(.55)';c.drawImage(R.glyph.ruin,p.x-q/2,p.y-q/2,q,q);c.filter='none';c.globalAlpha=1;}
  // trade ships: small, white-sailed, shuttling between ports
  for(const b of g.trades){
    const W=g.W,i0=Math.floor(b.p),i1=Math.min(i0+1,b.path.length-1),f=b.p-i0,a=b.path[i0],d=b.path[i1],p=w2s(lerp(a%W,d%W,f)+.5,lerp((a/W)|0,(d/W)|0,f)+.5);
    if(p.x<-20||p.y<-20||p.x>cw+20||p.y>ch+20)continue;const s=clamp(z*1.5,8,14),n=g.nations[b.a];
    c.fillStyle=n.css;c.strokeStyle='rgba(6,12,20,.9)';c.lineWidth=1;c.beginPath();c.moveTo(p.x-s,p.y+s*.2);c.lineTo(p.x+s,p.y+s*.2);c.lineTo(p.x+s*.6,p.y+s*.8);c.lineTo(p.x-s*.6,p.y+s*.8);c.closePath();c.fill();c.stroke();
    c.fillStyle='#fff8e6';c.beginPath();c.moveTo(p.x,p.y-s*1.1);c.lineTo(p.x+s*.8,p.y);c.lineTo(p.x,p.y);c.closePath();c.fill();
  }
  // ships
  for(const b of g.boats){
    const W=g.W,i0=Math.floor(b.p),i1=Math.min(i0+1,b.path.length-1),f=b.p-i0,a=b.path[i0],d=b.path[i1],ax=a%W,ay=(a/W)|0,bx=d%W,by=(d/W)|0;
    const p=w2s(lerp(ax,bx,f)+.5,lerp(ay,by,f)+.5),n=g.nations[b.a],s=clamp(z*1.9,10,18),an=Math.atan2(by-ay,bx-ax);
    c.save();c.translate(p.x,p.y);c.rotate(an);c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=1.5;c.beginPath();c.moveTo(-s*.6,0);c.lineTo(-s*2.2,0);c.stroke();
    c.fillStyle=n.css;c.strokeStyle='rgba(6,12,20,.9)';c.lineWidth=1.3;c.beginPath();c.moveTo(s,0);c.lineTo(-s*.75,-s*.6);c.lineTo(-s*.45,0);c.lineTo(-s*.75,s*.6);c.closePath();c.fill();c.stroke();c.restore();
    if(z>=3.5){c.font=`700 11px ${FONT}`;c.lineWidth=3;c.strokeStyle='rgba(6,12,20,.85)';txt(c,fmt(b.troops),p.x,p.y-s-7,'#fff');}
  }
  const SP=[];
  // structures
  for(const s of g.structs){
    if(s.dead)continue;const city=s.type==='city';
    const p=w2s(s.x+.5,s.y+.5);if(p.x<-40||p.y<-40||p.x>cw+40||p.y>ch+40)continue;
    const n=g.nations[s.owner],r=city?clamp(z*1.45,4.5,10)+(s.capital?2.5:0)+s.level*.5:clamp(z*1.45,4.5,10)+1;if(s.build>g.tick)c.globalAlpha=.55;
    const rn=city&&s.ruin>g.tick;SP.push(p.x,p.y,r);c.beginPath();c.arc(p.x,p.y,r,0,7);c.fillStyle=rn?'#5f5650':n?n.css:'#8a8d92';c.fill();c.lineWidth=s.capital?2.2:1.4;c.strokeStyle=s.capital?'#ffe9a8':'rgba(6,12,20,.9)';c.stroke();
    if(r>5.5){const q=r*1.45;c.drawImage(R.glyph[rn?'ruin':s.capital?'cap':s.type],p.x-q/2,p.y-q/2,q,q);}
    if(rn){c.strokeStyle=n?n.css:'#888';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,r+2,0,7);c.stroke();for(let k=0;k<3;k++){const ph=(ts/1400+k/3)%1;c.fillStyle=`rgba(70,66,62,${.55*(1-ph)})`;c.beginPath();c.arc(p.x+Math.sin(k*2.1+ph*3)*r*.4,p.y-r-ph*r*2.4,r*(.35+ph*.55),0,7);c.fill();}}
    if(city&&z>=4.2){
      c.font=`600 ${clamp(z*1.9,10,13)}px ${FONT}`;c.lineWidth=3;c.strokeStyle='rgba(6,12,20,.8)';txt(c,cityName(s.name,UI.lang),p.x,p.y+r+9,'#f6ecd2');
      c.beginPath();c.arc(p.x+r*.8,p.y-r*.8,6,0,7);c.fillStyle='#0b1826';c.fill();c.font=`700 9px ${FONT}`;c.fillStyle='#f6dc9a';c.fillText(s.level,p.x+r*.8,p.y-r*.75);
    }
    if(s.type==='mon'){const left=Math.max(0,Math.ceil((s.cd-g.tick)/TPS));c.font=`700 13px ${FONT}`;c.lineWidth=3;c.strokeStyle='rgba(6,12,20,.9)';txt(c,left+'s',p.x,p.y-r-9,'#ffe9a8');
      c.strokeStyle='rgba(255,233,168,.7)';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,r+5+Math.sin(ts/200)*2,0,7);c.stroke();}
    if(s.type==='silo'&&s.cd>g.tick&&s.owner===me){c.strokeStyle='#f2b441';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,r+3,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-(s.cd-g.tick)/50));c.stroke();}
    if(s.build>g.tick){c.globalAlpha=1;c.strokeStyle='#ffe9a8';c.lineWidth=2.5;c.beginPath();c.arc(p.x,p.y,r+3.5,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-(s.build-g.tick)/100));c.stroke();if(s.owner===me){c.font=`700 11px ${FONT}`;c.lineWidth=3;c.strokeStyle='rgba(6,12,20,.9)';txt(c,Math.ceil((s.build-g.tick)/TPS)+'s',p.x,p.y-r-10,'#ffe9a8');}}
  }
  // nation labels: your realm first, then the largest; each one avoids building icons and every label already placed
  const LB=[],LO=g.nations.filter(n=>n&&n.alive&&n.tiles).sort((a,b)=>(b.id===me)-(a.id===me)||b.tiles-a.tiles),fmax=clamp(Math.min(cw,ch)*.085,22,56);
  for(const n of LO){
    const nm=natName(n);let fs=Math.min(Math.sqrt(n.tiles)*z*.22,clamp((n.x1-n.x0+1)*z/(nm.length*.62+1),11,fmax));if(fs<9&&n.id!==me)continue;
    // the label glides to the middle of the realm instead of jumping
    if(n.lx==null||Math.abs(n.lx-n.cx)>80||Math.abs(n.ly-n.cy)>80){n.lx=n.cx;n.ly=n.cy;}else{n.lx+=(n.cx-n.lx)*.06;n.ly+=(n.cy-n.ly)*.06;}
    const p=w2s(n.lx+.5,n.ly+.5);if(p.x<-300||p.y<-100||p.x>cw+300||p.y>ch+100)continue;
    let f=Math.max(fs,11),y=0,hw=0,ok=false;
    for(let tries=0;tries<3&&!ok;tries++){
      c.font=`700 ${f}px ${FONT}`;hw=c.measureText(nm).width/2+6;const st=Math.min(f,30)*1.1;
      for(const k of[0,-1.4,1.4,-2.8,2.8]){
        const yy=p.y-f*.6+k*st,top=yy-f*.75,bot=yy+f*1.65;
        let hit=false;for(const L of LB)if(Math.abs(L.x-p.x)<L.hw+hw&&top<L.b&&bot>L.t){hit=true;break;}
        if(hit)continue;
        let ic=false;for(let j=0;j<SP.length&&!ic;j+=3){const r=SP[j+2];ic=Math.abs(SP[j]-p.x)<hw+r&&SP[j+1]+r+18>top&&SP[j+1]-r<bot;}
        if(!ic||k===0&&tries===2){y=yy;ok=true;break;}
        if(!ok&&y===0)y=yy;
      }
      if(!ok){let free=true;for(const L of LB)if(Math.abs(L.x-p.x)<L.hw+hw&&y-f*.75<L.b&&y+f*1.65>L.t){free=false;break;}if(free&&y!==0)ok=true;else{f*=.72;y=0;if(f<10&&n.id!==me)break;}}
    }
    if(!ok){if(n.id!==me)continue;c.font=`700 ${f}px ${FONT}`;y=p.y-f*.6;}
    LB.push({x:p.x,hw,t:y-f*.75,b:y+f*1.65,id:n.id});
    const H=me?g.nations[me]:null,rel=H&&n.id!==me?(H.ally[n.id]?'#a6f0be':(g.tick-H.lastHit[n.id]<300||g.tick-n.lastHit[me]<300)?'#ffb3a8':'#f4e3b0'):'#f4e3b0';
    c.lineWidth=Math.max(2.5,f*.2);c.strokeStyle='rgba(6,12,20,.78)';txt(c,nm,p.x,y,'#fff');
    c.font=`600 ${f*.72}px ${FONT}`;txt(c,fmt(n.troops),p.x,y+f*.98,rel);
    if(g.hegemon===n.id||n.mon){const q=f*1.1;c.drawImage(R.glyph.crown,p.x-q/2,y-f*1.5,q,q*.9);}
  }
  R.lb=LB;
  // missiles and pending strikes
  for(const m of g.missiles){
    for(let k=0;k<11;k++){const t0=m.t-k*.016,t1=t0-.016;if(t1<0)break;const a=mslPos(m,t0),b=mslPos(m,t1);
      c.strokeStyle=`rgba(255,${205-k*13},${130-k*11},${.92-k*.08})`;c.lineWidth=(m.type==='nuke'?4.2:2.6)*(1-k*.07);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
    const h=mslPos(m,m.t),tp=w2s(m.tx+.5,m.ty+.5);c.fillStyle='#fff';c.beginPath();c.arc(h.x,h.y,m.type==='nuke'?4:2.8,0,7);c.fill();
    c.strokeStyle='rgba(255,84,64,.85)';c.setLineDash([6,5]);c.lineWidth=1.6;c.beginPath();c.arc(tp.x,tp.y,MSL[m.type].r*z,0,7);c.stroke();c.setLineDash([]);
  }
  for(const p of g.pending){
    const q=w2s(p.x+.5,p.y+.5),k=clamp(1-(p.at-g.tick)/50,0,1),rr=(p.type==='tsunami'?10:6)*z;
    c.strokeStyle=p.type==='tsunami'?'rgba(120,220,255,.9)':'rgba(255,120,60,.9)';c.setLineDash([5,5]);c.lineWidth=2;c.beginPath();c.arc(q.x,q.y,rr,0,7);c.stroke();c.setLineDash([]);
    if(p.type==='meteor'){const d=(1-k)*260;c.strokeStyle='rgba(255,190,110,.9)';c.lineWidth=5;c.beginPath();c.moveTo(q.x+d,q.y-d*1.6);c.lineTo(q.x+d+26,q.y-d*1.6-42);c.stroke();c.fillStyle='#fff3d0';c.beginPath();c.arc(q.x+d,q.y-d*1.6,5,0,7);c.fill();}
    if(p.type==='beam'){c.strokeStyle=`rgba(190,150,255,${.3+k*.6})`;c.lineWidth=2+k*7;c.beginPath();c.moveTo(q.x,0);c.lineTo(q.x,q.y);c.stroke();}
  }
  // effects
  for(let i=R.fx.length-1;i>=0;i--){
    const f=R.fx[i];f.t+=dt/f.dur;if(f.t>=1){R.fx.splice(i,1);continue;}const p=w2s(f.x+.5,f.y+.5),e=1-(1-f.t)*(1-f.t);
    if(f.type==='boom'){
      const rr=Math.max(4,f.r*z*(.25+.95*e)),gr=c.createRadialGradient(p.x,p.y,0,p.x,p.y,rr);
      gr.addColorStop(0,`rgba(255,250,220,${.95*(1-f.t)})`);gr.addColorStop(.45,`rgba(255,${f.nuke?150:170},60,${.7*(1-f.t)})`);gr.addColorStop(1,'rgba(120,30,10,0)');
      c.fillStyle=gr;c.beginPath();c.arc(p.x,p.y,rr,0,7);c.fill();c.strokeStyle=`rgba(255,235,200,${.8*(1-f.t)})`;c.lineWidth=2.5;c.beginPath();c.arc(p.x,p.y,rr*1.08,0,7);c.stroke();
    }else if(f.type==='ring'){c.strokeStyle=f.col||'#ffe9a8';c.globalAlpha=1-f.t;c.lineWidth=3;c.beginPath();c.arc(p.x,p.y,(f.r||8)*z*e+4,0,7);c.stroke();c.globalAlpha=1;}
    else if(f.type==='shot'){const q=w2s(f.tx+.5,f.ty+.5);c.strokeStyle=`rgba(255,190,90,${1-f.t})`;c.lineWidth=2.5;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();c.fillStyle=`rgba(255,240,200,${1-f.t})`;c.beginPath();c.arc(q.x,q.y,4+f.t*8,0,7);c.fill();}
    else if(f.type==='text'){c.globalAlpha=1-f.t*f.t;c.font=`700 ${f.size||15}px ${FONT}`;c.lineWidth=3.5;c.strokeStyle='rgba(6,12,20,.9)';txt(c,f.s,p.x,p.y-10-e*34,f.col||'#fff');c.globalAlpha=1;}
  }
  // placement preview: range circle plus a ghost of the building where it will actually stand
  if(UI.mode&&(UI.pend>=0||UI.hover>=0)&&me){
    const m=UI.mode,k=m.slice(2),H=g.nations[me];let i=UI.pend>=0?UI.pend:UI.hover,rad=0,ok=true;
    if(m[0]==='b'){if(k==='port'||k==='coast')i=snapPort(g,H,i,UI.mob?6:4,k);rad={city:R_CITY,fort:R_FORT,shield:SHIELD_R,coast:13}[k]||1.5;ok=!canBuild(g,H,k,i);}else if(m[0]==='m')rad=MSL[k].r;else if(m[0]==='s'){const sh=shoreNear(g,i,+k,10);ok=sh>=0;if(sh>=0)i=sh;rad=2.5;}else rad={bribe:9,tsunami:10,beam:5}[FAC[H.fac].ult]||0;
    const p=w2s(i%g.W+.5,((i/g.W)|0)+.5);
    c.strokeStyle=ok?'rgba(120,240,160,.95)':'rgba(255,100,90,.95)';c.fillStyle=ok?'rgba(120,240,160,.14)':'rgba(255,100,90,.14)';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,rad*z,0,7);c.fill();c.stroke();
    if(m[0]==='b'){const r=clamp(z*1.45,8,12)+2,q=r*1.45;c.globalAlpha=.6+.3*Math.sin(ts/160);c.beginPath();c.arc(p.x,p.y,r,0,7);c.fillStyle=ok?H.css:'#a33';c.fill();c.lineWidth=2;c.strokeStyle='#fff';c.stroke();c.drawImage(R.glyph[k],p.x-q/2,p.y-q/2,q,q);c.globalAlpha=1;}
    else{c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.moveTo(p.x-9,p.y);c.lineTo(p.x+9,p.y);c.moveTo(p.x,p.y-9);c.lineTo(p.x,p.y+9);c.stroke();}
  }
  // who is attacking you: a ring on their capital, or an arrow at the screen edge pointing to it
  if(UI.threats&&UI.threats.length&&me){const nw=performance.now();UI.threats=UI.threats.filter(q=>q.until>nw&&g.nations[q.id].alive&&g.nations[q.id].cap);
    for(const q of UI.threats){const n=g.nations[q.id],p=w2s(n.cap.x+.5,n.cap.y+.5),m=70,pul=.6+.4*Math.sin(ts/120);c.strokeStyle=c.fillStyle=`rgba(255,70,50,${pul})`;
      if(p.x>m&&p.y>m+40&&p.x<cw-m&&p.y<ch-m-60){c.lineWidth=4;c.beginPath();c.arc(p.x,p.y,24+pul*9,0,7);c.stroke();continue;}
      const cx=cw/2,cy=ch/2,an=Math.atan2(p.y-cy,p.x-cx),kk=Math.min((cx-m)/Math.abs(Math.cos(an)||1e-6),(cy-m-70)/Math.abs(Math.sin(an)||1e-6)),ax=cx+Math.cos(an)*kk,ay=cy+Math.sin(an)*kk;
      c.save();c.translate(ax,ay);c.rotate(an);c.beginPath();c.moveTo(30,0);c.lineTo(-16,-20);c.lineTo(-5,0);c.lineTo(-16,20);c.closePath();c.fill();c.restore();
      c.font=`700 14px ${FONT}`;c.lineWidth=3.5;c.strokeStyle='rgba(6,12,20,.9)';txt(c,natName(n),ax-Math.cos(an)*44,ay-Math.sin(an)*44,'#ffd0c8');}}
  // aiming arrow while the left button is held and dragged
  if(UI.aim){const P=UI.aim.pts.concat([[UI.aim.x,UI.aim.y]]),n=P.length,e=P[n-1],q=P[Math.max(0,n-4)],an=Math.atan2(e[1]-q[1],e[0]-q[0]);
    c.strokeStyle=c.fillStyle='rgba(255,233,168,.95)';c.lineWidth=4;c.setLineDash([10,7]);c.lineDashOffset=-ts/30;c.beginPath();c.moveTo(P[0][0],P[0][1]);
    for(let j=1;j<n-1;j++)c.quadraticCurveTo(P[j][0],P[j][1],(P[j][0]+P[j+1][0])/2,(P[j][1]+P[j+1][1])/2);c.lineTo(e[0],e[1]);c.stroke();c.setLineDash([]);
    c.beginPath();c.moveTo(e[0]+Math.cos(an)*6,e[1]+Math.sin(an)*6);c.lineTo(e[0]-Math.cos(an-.5)*16,e[1]-Math.sin(an-.5)*16);c.lineTo(e[0]-Math.cos(an+.5)*16,e[1]-Math.sin(an+.5)*16);c.closePath();c.fill();
    c.beginPath();c.arc(P[0][0],P[0][1],5,0,7);c.fill();}
  // winter snowfall
  if(R.winter>.05){
    const F=R.flakes;while(F.length<70)F.push({x:Math.random(),y:Math.random(),s:.4+Math.random()*.9});c.fillStyle=`rgba(255,255,255,${.55*R.winter})`;
    for(const f of F){f.y+=dt*.00009*f.s;f.x+=dt*.00002;if(f.y>1){f.y=0;f.x=Math.random();}c.beginPath();c.arc((f.x%1)*cw,f.y*ch,f.s*1.7,0,7);c.fill();}
  }
}
function drawMini(g,m){
  const c=m.getContext('2d'),w=m.width,h=m.height;c.imageSmoothingEnabled=true;c.drawImage(R.land,0,0,w,h);if(R.winter>.3){c.globalAlpha=R.winter;c.drawImage(R.snow,0,0,w,h);c.globalAlpha=1;}
  c.drawImage(R.own,0,0,w,h);c.drawImage(R.water,0,0,w,h);
  const a=s2w(0,0),b=s2w(view.w,view.h),sx=w/g.W,sy=h/g.H;c.strokeStyle='#fff';c.lineWidth=1.5;c.strokeRect(a.x*sx,a.y*sy,(b.x-a.x)*sx,(b.y-a.y)*sy);
}
