// ── SIJAL · renderer: painted relief map, territory overlay, units, effects ──
const R={TS:4,land:null,snow:null,water:null,own:null,octx:null,oimg:null,o32:null,winter:0,autumn:0,glyph:{},url:{},shake:0,fx:[],flakes:[],full:true};
const cam={x:0,y:0,z:4,tx:0,ty:0,tz:4},view={w:0,h:0,dpr:1},FONT="'IBM Plex Sans Arabic','Tajawal',system-ui,sans-serif";
let cv,ctx;
function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
const w2s=(x,y)=>({x:(x-cam.x)*cam.z+view.w/2,y:(y-cam.y)*cam.z+view.h/2});
const s2w=(x,y)=>({x:(x-view.w/2)/cam.z+cam.x,y:(y-view.h/2)/cam.z+cam.y});
function resize(){
  const r=cv.getBoundingClientRect();view.w=Math.max(50,r.width);view.h=Math.max(50,r.height);view.dpr=Math.min(window.devicePixelRatio||1,[1,1.5,2][R.q==null?2:R.q]);
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
  const L=v=>Math.round(v+(255-v)*.38);n.pP=((196<<24)|(L(b)<<16)|(L(g)<<8)|L(r))>>>0;
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
  const bd=(A>=0&&A!==P)||(B>=0&&B!==P)||(C>=0&&C!==P)||(D>=0&&D!==P),base=P?(bd?N[P].pB:N[P].pat&&patOn(N[P].pat,x,y)?N[P].pP:N[P].pF):g.fall[i]>g.tick?0xe0101418:0;
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
  d('shield',x=>{x.fillRect(8,46,48,8);x.beginPath();x.arc(18,56,4.5,0,7);x.arc(46,56,4.5,0,7);x.fill();x.fillRect(28,34,8,13);
    x.save();x.translate(30,36);x.rotate(-.62);x.fillRect(-4,-11,34,22);x.globalCompositeOperation='destination-out';for(let r=0;r<2;r++)for(let k=0;k<3;k++){x.beginPath();x.arc(31,-6+k*6,2.3,0,7);x.fill();}x.fillRect(-1,-1.2,28,2.4);x.restore();x.globalCompositeOperation='source-over';});
  d('mon',x=>{poly(x,[[32,5],[40,17],[43,53],[21,53],[24,17]]);x.fillRect(13,52,38,7);});
  d('nuke',x=>{for(let i=0;i<3;i++){const a=-Math.PI/2+i*2.094;x.beginPath();x.moveTo(32,32);x.arc(32,32,26,a-.52,a+.52);x.closePath();x.fill();}x.globalCompositeOperation='destination-out';x.beginPath();x.arc(32,32,9,0,7);x.fill();x.globalCompositeOperation='source-over';x.beginPath();x.arc(32,32,5,0,7);x.fill();});
  d('coast',x=>{x.beginPath();x.arc(26,40,14,0,7);x.fill();x.lineWidth=9;x.beginPath();x.moveTo(30,34);x.lineTo(55,13);x.stroke();x.fillRect(8,53,40,6);});
  d('ruin',x=>{x.fillRect(8,40,12,16);x.beginPath();x.moveTo(22,56);x.lineTo(22,24);x.lineTo(27,30);x.lineTo(31,18);x.lineTo(36,27);x.lineTo(36,56);x.fill();x.fillRect(40,46,15,10);x.beginPath();x.moveTo(40,46);x.lineTo(46,38);x.lineTo(50,44);x.lineTo(55,40);x.lineTo(55,46);x.fill();x.fillRect(4,56,56,4);});
  d('ally',x=>{x.lineWidth=7;x.beginPath();x.arc(23,32,14,0,7);x.stroke();x.beginPath();x.arc(41,32,14,0,7);x.stroke();});
  d('coin',x=>{x.beginPath();x.arc(32,32,24,0,7);x.fill();x.globalCompositeOperation='destination-out';x.lineWidth=4;x.beginPath();x.arc(32,32,16,0,7);x.stroke();x.fillRect(29,20,6,24);x.globalCompositeOperation='source-over';});
  d('eye',x=>{x.beginPath();x.moveTo(4,32);x.quadraticCurveTo(32,4,60,32);x.quadraticCurveTo(32,60,4,32);x.fill();x.globalCompositeOperation='destination-out';x.beginPath();x.arc(32,32,11,0,7);x.fill();x.globalCompositeOperation='source-over';x.beginPath();x.arc(32,32,6,0,7);x.fill();});
  d('ship',x=>{x.beginPath();x.moveTo(6,40);x.lineTo(58,40);x.lineTo(48,54);x.lineTo(16,54);x.closePath();x.fill();x.fillRect(30,8,4,32);x.beginPath();x.moveTo(34,10);x.lineTo(52,36);x.lineTo(34,36);x.closePath();x.fill();x.beginPath();x.moveTo(30,14);x.lineTo(14,36);x.lineTo(30,36);x.closePath();x.fill();});
  d('camp',x=>{x.fillRect(8,38,48,12);x.beginPath();x.arc(14,50,6,0,7);x.arc(32,50,6,0,7);x.arc(50,50,6,0,7);x.fill();x.fillRect(18,26,26,14);x.fillRect(40,29,20,5);x.beginPath();x.arc(31,26,8,Math.PI,0);x.fill();});
  d('factory',x=>{x.fillRect(6,34,52,22);x.beginPath();x.moveTo(6,34);x.lineTo(6,22);x.lineTo(20,30);x.lineTo(20,22);x.lineTo(34,30);x.lineTo(34,34);x.closePath();x.fill();x.fillRect(42,10,9,26);x.globalCompositeOperation='destination-out';x.fillRect(12,42,7,7);x.fillRect(26,42,7,7);x.globalCompositeOperation='source-over';});
  d('flag',x=>{x.fillRect(12,8,6,50);x.beginPath();x.moveTo(18,10);x.lineTo(54,20);x.lineTo(18,32);x.fill();});
  d('bolt',x=>poly(x,[[37,5],[15,36],[29,36],[25,59],[49,26],[35,26]]));
  d('sword',x=>{x.lineWidth=6;x.beginPath();x.moveTo(12,52);x.lineTo(48,10);x.moveTo(52,52);x.lineTo(16,10);x.stroke();x.lineWidth=5;x.beginPath();x.moveTo(10,38);x.lineTo(24,52);x.moveTo(54,38);x.lineTo(40,52);x.stroke();});
  d('crown',x=>poly(x,[[8,50],[6,18],[20,32],[32,10],[44,32],[58,18],[56,50]]));
  R.glyph=G;
}
function addFx(type,x,y,o){R.fx.push(Object.assign({type,x,y,t:0,dur:900},o));}
// missile bodies, drawn once pointing right: rocket (slim, red nose), nuke (olive with a radiation band), doom (black and gold with a glowing core)
function mslSprite(type){const C=R.msp||(R.msp={});if(C[type])return C[type];
  const S={rocket:[64,22],nuke:[76,30],doom:[100,44],intc:[40,14]}[type],k=mk(S[0],S[1]),x=k.getContext('2d'),W=S[0],H=S[1],m=H/2;
  const fins=(x0,x1,h,col,edge)=>{x.fillStyle=col;for(const sg of[-1,1]){x.beginPath();x.moveTo(x1,m+sg*h*.35);x.lineTo(x0,m+sg*h);x.lineTo(x0+(x1-x0)*.35,m+sg*h*.35);x.closePath();x.fill();if(edge){x.strokeStyle=edge;x.lineWidth=1.2;x.stroke();}}};
  const body=(x0,x1,h,g0,g1,g2)=>{const g=x.createLinearGradient(0,m-h,0,m+h);g.addColorStop(0,g0);g.addColorStop(.45,g1);g.addColorStop(1,g2);x.fillStyle=g;x.beginPath();x.roundRect(x0,m-h,x1-x0,h*2,h*.6);x.fill();};
  const nose=(x0,x1,h,c0,c1)=>{const g=x.createLinearGradient(0,m-h,0,m+h);g.addColorStop(0,c0);g.addColorStop(1,c1);x.fillStyle=g;x.beginPath();x.moveTo(x0,m-h);x.quadraticCurveTo(x0+(x1-x0)*.6,m-h*.9,x1,m);x.quadraticCurveTo(x0+(x1-x0)*.6,m+h*.9,x0,m+h);x.closePath();x.fill();};
  if(type==='rocket'){fins(6,20,9,'#3d434b');body(8,48,4,'#eef1f4','#b9c0c8','#6e7781');nose(47,62,4,'#59616b','#2a2f35');x.fillStyle='#2a2f35';x.fillRect(22,m-4,2,8);}
  else if(type==='nuke'){fins(6,24,13,'#2f3820','#c9b23a');body(9,56,7,'#9aa96a','#6c7a44','#3c4524');nose(55,74,7,'#59633a','#232813');
    x.fillStyle='#f3cf2c';x.fillRect(30,m-7,10,14);x.fillStyle='#111';for(let i=0;i<3;i++){const a=-Math.PI/2+i*2.094;x.beginPath();x.moveTo(35,m);x.arc(35,m,5,a-.5,a+.5);x.closePath();x.fill();}x.beginPath();x.arc(35,m,1.3,0,7);x.fill();}
  else if(type==='doom'){fins(4,30,20,'#141016','#e3b95a');fins(10,30,13,'#2a1f14');body(12,76,11,'#3a3036','#16121a','#050406');
    for(const bx of[24,58,68]){x.fillStyle='#e3b95a';x.fillRect(bx,m-11,2.5,22);}
    const cg=x.createRadialGradient(42,m,0,42,m,11);cg.addColorStop(0,'#fff3c8');cg.addColorStop(.35,'#ff5a1e');cg.addColorStop(1,'rgba(120,0,0,.2)');x.fillStyle=cg;x.beginPath();x.ellipse(42,m,10,7,0,0,7);x.fill();
    nose(75,98,11,'#2b2228','#000');x.fillStyle='#ff3b2a';x.beginPath();x.arc(96,m,2.2,0,7);x.fill();x.strokeStyle='#e3b95a';x.lineWidth=1.2;x.beginPath();x.roundRect(12,m-11,64,22,6);x.stroke();}
  else{fins(3,11,5,'#5a6b80');body(4,30,2.6,'#ffffff','#dfe9f5','#93a7bf');nose(29,39,2.6,'#8fd0ff','#2d7fd6');}
  return C[type]=k;}
// a flickering exhaust flame behind a missile
function mslFlame(c,len,w,ts,col){const f=.75+.25*Math.sin(ts/37)+.1*Math.sin(ts/13);const g=c.createLinearGradient(0,0,-len*f,0);g.addColorStop(0,'rgba(255,255,230,.95)');g.addColorStop(.3,col);g.addColorStop(1,'rgba(255,60,0,0)');
  c.globalCompositeOperation='lighter';c.fillStyle=g;c.beginPath();c.moveTo(0,-w);c.quadraticCurveTo(-len*f*.5,-w*1.1,-len*f,0);c.quadraticCurveTo(-len*f*.5,w*1.1,0,w);c.closePath();c.fill();c.globalCompositeOperation='source-over';}
// smoke that stays in the air: world-space puffs that grow, drift with a light wind and fade.
// High: long-lived and many; Medium: half as many and shorter; Low: none (a short line is drawn instead)
const SMOKE_CAP=[0,320,900],SMOKE_LIFE=[0,.5,1];
function puff(x,y,r,life,dark,delay){const q=R.q==null?2:R.q;if(!q)return;const L=R.smoke||(R.smoke=[]);if(L.length>=SMOKE_CAP[q])L.shift();
  L.push({x,y,r,life:life*SMOKE_LIFE[q],dark,born:performance.now()+(delay||0),w:Math.random()*6.28});}
function drawSmoke(c,z,cw,ch){const L=R.smoke;if(!L||!L.length)return;const now=performance.now(),hi=R.q===2;let j=0;
  for(let i=0;i<L.length;i++){const P=L[i],a=(now-P.born)/P.life;if(a>=1)continue;L[j++]=P;if(a<0)continue;
    const wx=P.x+a*a*1.6+Math.sin(P.w+a*3)*.25,wy=P.y-a*.8,q=w2s(wx,wy),r=P.r*z*(1+a*2.6);if(q.x<-r||q.y<-r||q.x>cw+r||q.y>ch+r)continue;
    const al=Math.pow(1-a,1.5)*Math.min(1,a*10+.3)*(P.dark?.7:.55),sh=P.dark?38+a*70:120+a*80;
    if(hi){c.fillStyle=`rgba(25,25,30,${al*.3})`;c.beginPath();c.arc(q.x,q.y+r*.14,r*1.1,0,7);c.fill();}
    c.fillStyle=`rgba(${sh|0},${sh|0},${(sh*1.04)|0},${al})`;c.beginPath();c.arc(q.x,q.y,r,0,7);c.fill();}
  L.length=j;}
const mslW=(m,t)=>({x:lerp(m.sx,m.tx,t)+.5,y:lerp(m.sy,m.ty,t)+.5-Math.sin(Math.PI*t)*Math.hypot(m.tx-m.sx,m.ty-m.sy)*.28});
const mslPos=(m,t)=>w2s(lerp(m.sx,m.tx,t)+.5,lerp(m.sy,m.ty,t)+.5-Math.sin(Math.PI*t)*Math.hypot(m.tx-m.sx,m.ty-m.sy)*.28);
// troop count of each front I am in: drawn behind the front line, along it, sized by its length (from the attack's own frontier tiles)
function frontSpots(g,me,ts){
  R.front=R.front||{};if(ts-(R.frontT||0)<400)return;R.frontT=ts;const W=g.W,H=g.H,own=g.owner,out={};
  for(const k of g.attacks){if((k.a!==me&&k.d!==me)||!k.d)continue;const PL=R.front[k.id]||[],T=k.heap.v,F=[];
    for(let m=0;m<T.length;m++){const i=T[m];if(own[i]!==k.d)continue;const x=i%W,y=(i/W)|0;let ax=0,ay=0,hit=false;
      if(x>0&&own[i-1]===k.a){ax-=1;hit=true;}if(x<W-1&&own[i+1]===k.a){ax+=1;hit=true;}if(y>0&&own[i-W]===k.a){ay-=1;hit=true;}if(y<H-1&&own[i+W]===k.a){ay+=1;hit=true;}
      if(hit)F.push(x,y,ax,ay);}
    const n=F.length/4;if(n<2){if(PL.length)out[k.id]=PL;continue;}
    // an attack can press on several separate stretches (two sides of a realm): group the front into stretches,
    // and give each real stretch its own number, its share of the troops by how long it is
    const cell=new Map(),comp=new Int32Array(n).fill(-1),key=(x,y)=>((x>>2)<<16)|(y>>2);
    for(let m=0;m<n;m++){const kk=key(F[m*4],F[m*4+1]);let a=cell.get(kk);if(!a)cell.set(kk,a=[]);a.push(m);}
    const sizes=[];let nc=0;for(let m=0;m<n;m++){if(comp[m]>=0)continue;const st=[m];comp[m]=nc;let sz=0;
      while(st.length){const v=st.pop();sz++;const x=F[v*4],y=F[v*4+1];for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const a=cell.get(key(x+dx*4,y+dy*4));if(!a)continue;
        for(const w of a)if(comp[w]<0&&(F[w*4]-x)**2+(F[w*4+1]-y)**2<=16){comp[w]=nc;st.push(w);}}}sizes.push(sz);nc++;}
    const parts=sizes.map(sz=>({F:[],n:sz}));for(let m=0;m<n;m++)parts[comp[m]].F.push(F[m*4],F[m*4+1],F[m*4+2],F[m*4+3]);
    parts.sort((a,b)=>b.n-a.n);
    const near=(F,x,y)=>{let d=1e18;for(let m=0;m<F.length;m+=4)d=Math.min(d,(F[m]-x)**2+(F[m+1]-y)**2);return d;};
    // a stretch gets a label once it is a real share of the front; one already labelled keeps it a little longer, so labels do not blink
    const keep=parts.filter((q,j)=>j===0||(q.n>=3&&(q.n>=n*.15||(q.n>=n*.07&&PL.some(P=>near(q.F,P.x,P.y)<100))))).slice(0,3),tot=keep.reduce((s2,q)=>s2+q.n,0),used=new Set(),res=[];
    for(const q of keep){
      const stats=(cx,cy,r2)=>{const F=q.F;let c=0,sx=0,sy=0,sxx=0,syy=0,sxy=0,bx=0,by=0,dmin=1e18;for(let m=0;m<F.length;m+=4){const x=F[m],y=F[m+1];if(r2&&(x-cx)**2+(y-cy)**2>r2)continue;c++;sx+=x;sy+=y;sxx+=x*x;syy+=y*y;sxy+=x*y;bx+=F[m+2];by+=F[m+3];}
        if(c<2)return null;const mx=sx/c,my=sy/c;for(let m=0;m<F.length;m+=4){const d=(F[m]-mx)**2+(F[m+1]-my)**2;if(d<dmin)dmin=d;}return{mx,my,cxx:sxx/c-mx*mx,cyy:syy/c-my*my,cxy:sxy/c-mx*my,bx,by,dmin};};
      let S=stats();if(!S)continue;
      // the previous label nearest this stretch carries on, so it glides with the line instead of popping
      let P=null,pd=144;for(const Q of PL){if(used.has(Q))continue;const d=near(q.F,Q.x,Q.y);if(d<pd){pd=d;P=Q;}}if(P)used.add(P);
      // a ring-shaped front (pushing out on every side) has its middle far from the line: use the stretch that is actually advancing
      if(S.dmin>36){const ax=P?P.x:k.fx!=null?k.fx:S.mx,ay=P?P.y:k.fx!=null?k.fy:S.my;const S2=stats(ax,ay,22*22);if(S2)S=S2;}
      const th=.5*Math.atan2(2*S.cxy,S.cxx-S.cyy),ev=(S.cxx+S.cyy)/2+Math.sqrt(((S.cxx-S.cyy)/2)**2+S.cxy*S.cxy),len=Math.max(4,Math.sqrt(ev)*3.4);
      let ang=th;if(ang>Math.PI/2)ang-=Math.PI;if(ang<-Math.PI/2)ang+=Math.PI;ang=clamp(ang,-.52,.52);
      const bl=Math.hypot(S.bx,S.by)||1,back=2.5+Math.min(10,len*.12),x=S.mx+S.bx/bl*back,y=S.my+S.by/bl*back,sz=clamp(Math.sqrt(len)*1.35,3,14),share=q.n/tot;
      res.push(P&&P.sx!=null?{x,y,ang,sz,share,sx:P.sx,sy:P.sy,sa:P.sa,ss:P.ss,sh:P.sh}:{x,y,ang,sz,share,sx:x,sy:y,sa:ang,ss:sz,sh:share});}
    // two labels that would sit almost on top of each other read as one: fold the smaller into the bigger
    const fin=[];for(const F of res){const o=fin.find(G=>(G.x-F.x)**2+(G.y-F.y)**2<100);if(o)o.share+=F.share;else fin.push(F);}
    out[k.id]=fin.length?fin:PL;}
  R.front=out;
}
// a sword drawn in place: pivot at the hand, blade pointing up at angle 0
function drawSword(c,x,y,L,ang){
  c.save();c.translate(x,y);c.rotate(ang);c.shadowColor='rgba(0,0,0,.55)';c.shadowBlur=R.q?8:0;c.shadowOffsetY=2;
  const bw=L*.075,bl=L*.72,g0=c.createLinearGradient(-bw,0,bw,0);g0.addColorStop(0,'#8b96a3');g0.addColorStop(.45,'#f4f8fb');g0.addColorStop(.55,'#d5dde5');g0.addColorStop(1,'#6e7884');
  c.fillStyle=g0;c.beginPath();c.moveTo(-bw,-L*.06);c.lineTo(-bw*.92,-bl);c.lineTo(0,-bl-L*.12);c.lineTo(bw*.92,-bl);c.lineTo(bw,-L*.06);c.closePath();c.fill();
  c.shadowBlur=0;c.shadowOffsetY=0;c.strokeStyle='rgba(60,70,82,.85)';c.lineWidth=1;c.stroke();
  c.strokeStyle='rgba(120,132,146,.9)';c.lineWidth=Math.max(1,bw*.35);c.beginPath();c.moveTo(0,-L*.1);c.lineTo(0,-bl*.88);c.stroke();
  const gw=L*.27,gh=L*.055,g1=c.createLinearGradient(0,-gh,0,gh);g1.addColorStop(0,'#ffe9a0');g1.addColorStop(.5,'#d4a437');g1.addColorStop(1,'#8a6416');
  c.fillStyle=g1;c.beginPath();c.moveTo(-gw,-gh*.5);c.quadraticCurveTo(-gw*1.1,-gh*1.6,-gw*.75,-gh*1.1);c.lineTo(gw*.75,-gh*1.1);c.quadraticCurveTo(gw*1.1,-gh*1.6,gw,-gh*.5);c.lineTo(gw*.7,gh);c.lineTo(-gw*.7,gh);c.closePath();c.fill();c.strokeStyle='rgba(80,55,10,.9)';c.stroke();
  const hl=L*.2,hw=bw*.85,g2=c.createLinearGradient(-hw,0,hw,0);g2.addColorStop(0,'#3a2414');g2.addColorStop(.5,'#7a4a26');g2.addColorStop(1,'#2a180c');c.fillStyle=g2;c.fillRect(-hw,gh,hw*2,hl);
  c.strokeStyle='rgba(20,10,4,.7)';c.lineWidth=1;for(let k=1;k<5;k++){const yy=gh+hl*k/5;c.beginPath();c.moveTo(-hw,yy-1.5);c.lineTo(hw,yy+1.5);c.stroke();}
  const pr=L*.055;c.fillStyle=g1;c.beginPath();c.arc(0,gh+hl+pr*.8,pr,0,7);c.fill();c.strokeStyle='rgba(80,55,10,.9)';c.stroke();
  c.restore();
}
// Season Zero crest: a violet-and-gold shield with a star, slowly shimmering
function drawBadge(c,x,y,s,ts){
  const g=R.badge||(R.badge=(()=>{const k=mk(64,72),b=k.getContext('2d');b.translate(32,36);
    const sh=()=>{b.beginPath();b.moveTo(0,-32);b.lineTo(26,-22);b.lineTo(24,8);b.quadraticCurveTo(18,26,0,34);b.quadraticCurveTo(-18,26,-24,8);b.lineTo(-26,-22);b.closePath();};
    const gr=b.createLinearGradient(0,-32,0,34);gr.addColorStop(0,'#c084ff');gr.addColorStop(.55,'#6d28d9');gr.addColorStop(1,'#2e1065');sh();b.fillStyle=gr;b.fill();
    const rim=b.createLinearGradient(-26,-32,26,34);rim.addColorStop(0,'#fff4c2');rim.addColorStop(.5,'#f1c24c');rim.addColorStop(1,'#a8741a');b.lineWidth=5;b.strokeStyle=rim;b.stroke();
    b.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?6:15;b.lineTo(Math.cos(a)*r,Math.sin(a)*r);}b.closePath();b.fillStyle=rim;b.fill();return k;})());
  const pulse=.55+.45*Math.sin(ts/420);c.save();if(R.q){c.shadowColor=`rgba(200,140,255,${.55+.4*pulse})`;c.shadowBlur=s*.9;}c.drawImage(g,x-s/2,y-s*.56,s,s*1.12);c.restore();
  if(R.q){const sx=x-s*.3+((ts/9)%(s*1.6))-s*.2;c.save();c.globalAlpha=.35*pulse;c.fillStyle='#fff';c.beginPath();c.arc(sx,y-s*.15,s*.09,0,7);c.fill();c.restore();}
}
function drawEmo(c,e,x,y,q,ts){
  if(e!=='67'){c.font=`${q}px sans-serif`;c.fillText(e,x,y);return;}
  const b=Math.sin(ts/140)*q*.28;c.font=`900 ${q*.95}px ${FONT}`;c.lineWidth=Math.max(3,q*.16);c.strokeStyle='rgba(6,12,20,.9)';c.save();c.direction='ltr';txt(c,'67',x,y,'#ffd166');c.restore();
  c.font=`${q*.78}px sans-serif`;c.save();c.translate(x-q*1.05,y-b);c.scale(-1,1);c.fillText('🫴',0,0);c.restore();c.fillText('🫴',x+q*1.05,y+b);
}
// burning ground after a blast: embers on Low, flickering flames on Medium, layered flames with smoke on High
function fireSprite(){if(R.flame)return R.flame;const k=mk(32,48),x=k.getContext('2d'),gr=x.createRadialGradient(16,34,1,16,30,22);
  gr.addColorStop(0,'rgba(255,250,210,1)');gr.addColorStop(.25,'rgba(255,200,70,.95)');gr.addColorStop(.55,'rgba(255,110,20,.75)');gr.addColorStop(1,'rgba(160,20,0,0)');
  x.fillStyle=gr;x.beginPath();x.moveTo(16,2);x.bezierCurveTo(26,18,30,30,26,40);x.quadraticCurveTo(16,48,6,40);x.bezierCurveTo(2,30,6,18,16,2);x.fill();return R.flame=k;}
function glowSprite(){if(R.fglow)return R.fglow;const k=mk(64,64),x=k.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,170,60,.9)');gr.addColorStop(.4,'rgba(255,90,20,.45)');gr.addColorStop(1,'rgba(120,10,0,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);return R.fglow=k;}
function drawFire(c,g,z,cw,ch,ts){
  const W=g.W,now=g.tick,q=R.q==null?2:R.q,fl=g.fallList,hz=z/2,ox=cw/2-cam.x*z,oy=ch/2-cam.y*z,sp=fireSprite(),gl=glowSprite();
  let drawn=0;const cap=q===2?4000:q===1?2500:1500;
  for(let j=0;j<fl.length&&drawn<cap;j++){const i=fl[j],rem=g.fall[i]-now;if(rem<=0)continue;const x=i%W,y=(i/W)|0,sx=x*z+ox+hz,sy=y*z+oy+hz;
    if(sx<-z*3||sy<-z*4||sx>cw+z*3||sy>ch+z*3)continue;const h=((x*73856093)^(y*19349663))>>>0,inten=Math.min(1,rem/60),ph=(h%997)/997;
    if(q===0){if(h%3)continue;c.fillStyle=`rgba(255,${90+(h%60)},20,${.35*inten})`;c.fillRect(sx-z*.35,sy-z*.35,z*.7,z*.7);drawn++;continue;}
    const fl1=.65+.35*Math.sin(ts/(90+(h%60))+ph*6.28),hi=q===2;c.globalCompositeOperation='lighter';
    // soft light pooled on the ground, not a square on every tile
    if(h%2===0){const s=z*(hi?2.8:2.3)*(.85+.15*fl1);c.globalAlpha=(hi?.26:.22)*inten;c.drawImage(gl,sx-s/2,sy-s/2,s,s);}
    // flames: spaced out and of different heights, so the fire looks alive
    if(h%3===0||(hi&&h%4===1)){const big=h%5===0?1.35:1,s=z*(1.25+.7*fl1)*big;c.globalAlpha=(hi?.85:.78)*inten*(.7+.3*fl1);c.drawImage(sp,sx-s/2+Math.sin(ts/(150+(h%80))+ph*9)*z*.15,sy-s*1.2,s,s*1.5);
      if(hi&&h%6===0){const f2=.6+.4*Math.sin(ts/65+ph*4),s2=z*(.7+.45*f2);c.globalAlpha=.6*inten*f2;c.drawImage(sp,sx-s2/2+z*.3,sy-s2*1.25,s2,s2*1.5);}}
    // glowing embers in the gaps
    else if(h%5===1){const e=.5+.5*Math.sin(ts/(220+(h%120))+ph*7);c.globalAlpha=.7*inten*e;c.fillStyle=h%2?'#ff5a1e':'#ffb347';const r=z*.14;c.fillRect(sx-r+(ph-.5)*z*.6,sy-r+((h>>4)%7/7-.5)*z*.6,r*2,r*2);}
    // sparks drifting up
    if(h%(hi?6:9)===0){const t=((ts/1200+ph)%1);c.globalAlpha=.85*inten*(1-t);c.fillStyle='#ffe08a';const r=Math.max(1,z*.1);c.fillRect(sx+Math.sin(t*6+ph*7)*z*.4,sy-z*(.8+t*2.6),r,r);}
    c.globalCompositeOperation='source-over';
    // smoke: darker puffs rising and spreading
    if(h%(hi?6:11)===0){const t=((ts/(hi?2400:2800)+ph)%1);c.globalAlpha=(hi?.26:.18)*inten*(1-t)*Math.min(1,t*4);c.fillStyle=hi?'#2f2a26':'#3a3530';c.beginPath();c.arc(sx+Math.sin(t*4+ph*6)*z*.6,sy-z*(1.2+t*4),z*(.45+t*1.2),0,7);c.fill();}
    c.globalAlpha=1;drawn++;}
}
// top-down main battle tank, drawn once per realm (4 tread frames): hull in the realm colour with shading and camouflage, rubber tracks with
// road wheels, a turret with hatch and periscope, and a long gun with fume extractor and muzzle brake
function tankSprite(n,od){
  const C=R.tk||(R.tk={}),fr=Math.floor(od*6)&3,key=n.id+':'+fr;if(C[key])return C[key];
  const W=96,H=68,k=mk(W,H),x=k.getContext('2d'),[r,gc,b]=n.color,sh=(f)=>`rgb(${Math.round(r*f)},${Math.round(gc*f)},${Math.round(b*f)})`;
  x.translate(W*.42,H/2);
  // tracks
  for(const sy of[-1,1]){const ty=sy*21-7;x.fillStyle='#1d1f22';x.fillRect(-38,ty,72,14);x.fillStyle='#2c2f33';x.fillRect(-38,ty+2,72,10);
    x.fillStyle='#121315';for(let t=-38+((fr*3)%6);t<34;t+=6)x.fillRect(t,ty,2.4,14);
    x.fillStyle='#3a3e44';for(let w=-30;w<=28;w+=11.5){x.beginPath();x.arc(w,ty+7,4.2,0,7);x.fill();}}
  // hull
  const hg=x.createLinearGradient(0,-17,0,17);hg.addColorStop(0,sh(1.15));hg.addColorStop(.5,sh(.95));hg.addColorStop(1,sh(.7));
  x.fillStyle=hg;x.beginPath();x.moveTo(-36,-16);x.lineTo(30,-16);x.lineTo(38,-9);x.lineTo(38,9);x.lineTo(30,16);x.lineTo(-36,16);x.closePath();x.fill();
  x.strokeStyle='rgba(0,0,0,.55)';x.lineWidth=1.5;x.stroke();
  // camouflage blotches
  x.save();x.clip();x.fillStyle=sh(.62);for(const[cx,cy,rr]of[[-22,-8,6],[8,9,7],[22,-10,5],[-8,12,5]]){x.beginPath();x.ellipse(cx,cy,rr*1.4,rr,0.4,0,7);x.fill();}x.restore();
  // engine deck grilles and front glacis line
  x.fillStyle='rgba(0,0,0,.35)';for(let gy=-9;gy<=7;gy+=4)x.fillRect(-33,gy,10,2);x.strokeStyle='rgba(255,255,255,.18)';x.beginPath();x.moveTo(30,-15);x.lineTo(30,15);x.stroke();
  // gun: barrel, fume extractor, muzzle brake
  x.fillStyle='#24272b';x.fillRect(8,-2.6,46,5.2);x.fillStyle='#30343a';x.fillRect(26,-3.6,8,7.2);x.fillStyle='#1a1c1f';x.fillRect(52,-4,6,8);
  x.fillStyle='rgba(255,255,255,.14)';x.fillRect(8,-2.6,46,1.4);
  // turret
  const tg=x.createRadialGradient(-2,-5,2,0,0,17);tg.addColorStop(0,sh(1.25));tg.addColorStop(1,sh(.72));x.fillStyle=tg;
  x.beginPath();x.moveTo(-14,-12);x.lineTo(8,-12);x.lineTo(16,-6);x.lineTo(16,6);x.lineTo(8,12);x.lineTo(-14,12);x.lineTo(-18,6);x.lineTo(-18,-6);x.closePath();x.fill();x.strokeStyle='rgba(0,0,0,.6)';x.lineWidth=1.4;x.stroke();
  // commander hatch, periscope, antenna
  x.fillStyle=sh(.55);x.beginPath();x.arc(-6,-4,4.2,0,7);x.fill();x.strokeStyle='rgba(0,0,0,.5)';x.stroke();x.fillStyle='#bfe3ff';x.fillRect(3,4,4,2.4);
  x.strokeStyle='#15171a';x.lineWidth=1;x.beginPath();x.moveTo(-12,8);x.lineTo(-22,15);x.stroke();
  // realm marker on the turret roof
  x.fillStyle='rgba(255,233,168,.9)';x.beginPath();x.arc(-8,6,2,0,7);x.fill();
  return C[key]=k;
}
function bShape(c,sh,x,y,r){c.beginPath();if(sh==='c'){c.arc(x,y,r,0,7);return;}const k=sh==='hex'?6:8,o=sh==='hex'?Math.PI/6:Math.PI/8;for(let j=0;j<k;j++){const a=o+j*2*Math.PI/k,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;j?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();}
// every building type has its own outline, so a rival's missile silo or port is readable from far away
const TSH={fort:'shield',port:'hexp',coast:'dia',factory:'sq',silo:'arrow',shield:'dome',mon:'star'};
function tShape(c,type,x,y,r){
  const sh=TSH[type];if(!sh){c.beginPath();c.arc(x,y,r,0,7);return;}c.beginPath();
  if(sh==='shield'){const w=r*1.05;c.moveTo(x-w,y-r*.95);c.lineTo(x+w,y-r*.95);c.lineTo(x+w,y+r*.05);c.quadraticCurveTo(x+w*.85,y+r*.8,x,y+r*1.15);c.quadraticCurveTo(x-w*.85,y+r*.8,x-w,y+r*.05);c.closePath();}
  else if(sh==='hexp'){for(let j=0;j<6;j++){const a=-Math.PI/2+j*Math.PI/3,px=x+Math.cos(a)*r*1.12,py=y+Math.sin(a)*r*1.12;j?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();}
  else if(sh==='dia'){const k=r*1.3;c.moveTo(x,y-k);c.lineTo(x+k,y);c.lineTo(x,y+k);c.lineTo(x-k,y);c.closePath();}
  else if(sh==='sq'){const k=r*.98,q=r*.3;c.moveTo(x-k+q,y-k);c.arcTo(x+k,y-k,x+k,y+k,q);c.arcTo(x+k,y+k,x-k,y+k,q);c.arcTo(x-k,y+k,x-k,y-k,q);c.arcTo(x-k,y-k,x+k,y-k,q);c.closePath();}
  else if(sh==='arrow'){c.moveTo(x,y-r*1.4);c.lineTo(x+r*1.05,y+r*.15);c.lineTo(x+r*.95,y+r*1.05);c.lineTo(x,y+r*.6);c.lineTo(x-r*.95,y+r*1.05);c.lineTo(x-r*1.05,y+r*.15);c.closePath();}
  else if(sh==='dome'){c.moveTo(x-r*1.2,y+r*.75);c.lineTo(x-r*1.2,y+r*.2);c.arc(x,y+r*.2,r*1.2,Math.PI,0);c.lineTo(x+r*1.2,y+r*.75);c.closePath();}
  else if(sh==='star'){for(let j=0;j<10;j++){const a=-Math.PI/2+j*Math.PI/5,rr=j%2?r*.62:r*1.3;j?c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr):c.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();}
}
// where the icon sits inside each outline
const TGY={silo:.12,shield:.12,fort:-.05};
// text widths are measured once per string and size: measuring every label every frame was a large share of a zoom
const TW=new Map();function textW(c,s,f){const k=f+'|'+s;let w=TW.get(k);if(w==null){if(TW.size>4000)TW.clear();w=c.measureText(s).width;TW.set(k,w);}return w;}
function txt(c,s,x,y,fill){c.strokeText(s,x,y);c.fillStyle=fill;c.fillText(s,x,y);}

function draw(g,dt,ts){
  const c=ctx,dpr=view.dpr,cw=view.w,ch=view.h,me=g.human;
  refreshOwn(g);camStep(g);const z=cam.z;
  R.winter+=((g.season===3?1:0)-R.winter)*.025;R.autumn+=((g.season===2?1:0)-R.autumn)*.025;
  let shx=0,shy=0;if(R.q===0)R.shake=0;if(R.shake>.3){shx=(Math.random()-.5)*R.shake;shy=(Math.random()-.5)*R.shake;R.shake*=.9;}
  c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#092440';c.fillRect(0,0,cw,ch);
  c.setTransform(dpr*z,0,0,dpr*z,dpr*(cw/2-cam.x*z+shx),dpr*(ch/2-cam.y*z+shy));
  // map smoothing is a setting, off by default: crisp tiles unless the player turns it on
  c.imageSmoothingEnabled=!!(UI.prof&&UI.prof.smooth);c.drawImage(R.land,0,0,g.W,g.H);
  if(R.winter>.01){c.globalAlpha=R.winter;c.drawImage(R.snow,0,0,g.W,g.H);c.globalAlpha=1;}
  if(R.autumn>.01){c.fillStyle=`rgba(214,120,30,${R.autumn*.09})`;c.fillRect(0,0,g.W,g.H);}
  c.drawImage(R.own,0,0,g.W,g.H);c.drawImage(R.water,0,0,g.W,g.H);c.imageSmoothingEnabled=true;
  c.setTransform(dpr,0,0,dpr,0,0);c.lineCap=c.lineJoin='round';c.textAlign='center';c.textBaseline='middle';
  if(g.fallList.length)drawFire(c,g,z,cw,ch,ts);
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
  // railways and trains
  if(g.rails.length){const tw=Math.max(.9,z*.2);
    for(const r of g.rails){const P=r.path;if(P.length<2)continue;c.beginPath();for(let k=0;k<P.length;k++){const p=w2s(P[k]%g.W+.5,((P[k]/g.W)|0)+.5);k?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y);}
      c.strokeStyle='rgba(30,22,18,.38)';c.lineWidth=tw+1.2;c.stroke();c.strokeStyle='rgba(138,122,102,.5)';c.lineWidth=tw;c.stroke();
      if(z>=4&&R.q===2){c.strokeStyle='rgba(30,22,18,.4)';c.lineWidth=.8;for(let k=1;k<P.length-1;k+=2){const a=w2s(P[k-1]%g.W+.5,((P[k-1]/g.W)|0)+.5),b=w2s(P[k+1]%g.W+.5,((P[k+1]/g.W)|0)+.5),m=w2s(P[k]%g.W+.5,((P[k]/g.W)|0)+.5),an=Math.atan2(b.y-a.y,b.x-a.x)+Math.PI/2,l=tw*1.1;c.beginPath();c.moveTo(m.x-Math.cos(an)*l,m.y-Math.sin(an)*l);c.lineTo(m.x+Math.cos(an)*l,m.y+Math.sin(an)*l);c.stroke();}}}
    for(const tr of g.trains){const W=g.W,P=tr.path,i0=Math.floor(tr.p),n=g.nations[tr.a],s=clamp(z*.7,3,7);
      for(let w=0;w<3;w++){const pp=Math.max(0,Math.min(P.length-1,tr.p-w*tr.dir*1.1)),k0=Math.floor(pp),k1=Math.min(k0+1,P.length-1),f=pp-k0,p=w2s(lerp(P[k0]%W,P[k1]%W,f)+.5,lerp((P[k0]/W)|0,(P[k1]/W)|0,f)+.5);
        if(p.x<-20||p.y<-20||p.x>cw+20||p.y>ch+20)continue;c.fillStyle=w?n.css:'#2a2522';c.strokeStyle='rgba(6,12,20,.9)';c.lineWidth=1;c.beginPath();c.rect(p.x-s*.7,p.y-s*.5,s*1.4,s);c.fill();c.stroke();if(!w){c.fillStyle='#ffe9a8';c.beginPath();c.arc(p.x,p.y,s*.22,0,7);c.fill();}}}}
  // where my ships will land (and where enemy ships are headed into my land)
  if(me)for(const b of g.boats){if(b.a!==me&&g.owner[b.ti]!==me)continue;const W=g.W,q=w2s(b.ti%W+.5,((b.ti/W)|0)+.5);if(q.x<-30||q.y<-30||q.x>cw+30||q.y>ch+30)continue;
    const r=Math.max(9,z*2.4)+Math.sin(ts/220)*2;c.strokeStyle=b.a===me?'rgba(255,233,168,.95)':'rgba(255,90,70,.95)';c.lineWidth=2.5;c.setLineDash([5,4]);c.lineDashOffset=-ts/60;c.beginPath();c.arc(q.x,q.y,r,0,7);c.stroke();c.setLineDash([]);
    c.beginPath();c.arc(q.x,q.y,r*.35,0,7);c.stroke();}
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
  // protected area of my forts, shield domes and coastal guns (and every dome while aiming a missile): filled only over the owner's land, outlined along its edge
  {const aimM=UI.mode&&UI.mode[0]==='m',RC=R.rng||(R.rng={});for(const s of g.structs){if(s.dead||s.build||(s.type!=='fort'&&s.type!=='shield'&&s.type!=='coast'))continue;const mine=s.owner===me;if(!mine&&!(aimM&&s.type==='shield'))continue;
    const rr=s.type==='fort'?FT_R(s.level):s.type==='coast'?CO_R(s.level):SH_R(s.level),p0=w2s(s.x-rr,s.y-rr),D=2*rr+1;if(p0.x>cw||p0.y>ch||p0.x+D*z<0||p0.y+D*z<0||rr*z<6)continue;
    const sel=!!(UI.bs===s||(UI.mode&&UI.mode[0]==='b')||aimM),key=s.i+':'+s.type+(sel?'s':''),col=!mine?[255,90,70]:s.type==='shield'?[120,190,255]:s.type==='coast'?[90,220,200]:[255,233,168];let E=RC[key];
    if(!E||E.rr!==rr||E.o!==s.owner||ts-E.t>700){const cv2=E&&E.cv.width===D?E.cv:mk(D,D),x2=cv2.getContext('2d'),im=x2.createImageData(D,D),d=im.data,W=g.W,H=g.H,own=g.owner,o=s.owner,ter=g.M.ter,sea=s.type==='coast',inR=(X,Y)=>X>=0&&Y>=0&&X<W&&Y<H&&(X-s.x)**2+(Y-s.y)**2<=rr*rr&&(sea?ter[Y*W+X]<2:own[Y*W+X]===o);
      for(let y=0;y<D;y++)for(let x=0;x<D;x++){const X=s.x-rr+x,Y=s.y-rr+y;if(!inR(X,Y))continue;const edge=!inR(X-1,Y)||!inR(X+1,Y)||!inR(X,Y-1)||!inR(X,Y+1),k=(y*D+x)*4;d[k]=col[0];d[k+1]=col[1];d[k+2]=col[2];d[k+3]=edge&&sel?205:(s.type==='shield'?44:sea?48:34);}
      x2.putImageData(im,0,0);E=RC[key]={cv:cv2,rr,o:s.owner,t:ts};}
    const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.drawImage(E.cv,p0.x,p0.y,D*z,D*z);c.imageSmoothingEnabled=sm;}}
  // structures
  for(const s of g.structs){
    if(s.dead)continue;const city=s.type==='city';
    const p=w2s(s.x+.5,s.y+.5);if(p.x<-40||p.y<-40||p.x>cw+40||p.y>ch+40)continue;
    const n=g.nations[s.owner],r=Math.max(2.5,z*(city?2.5+(s.capital?.7:0)+s.level*.15:2.6));if(s.build>g.tick)c.globalAlpha=.55;
    const rn=city&&s.ruin>g.tick,BS=!rn&&n&&n.bld?BSTY[n.bld]:null;SP.push(p.x,p.y,r);
    // far away a building is a few pixels wide: a plain dot in its owner's colour is all the eye can see, and it is many times cheaper
    if(r<4&&!s.capital){c.fillStyle=rn?'#5f5650':BS?BS.f:n?n.css:'#8a8d92';const d=r*1.7;c.fillRect(p.x-d/2,p.y-d/2,d,d);c.globalAlpha=1;continue;}
    // cities keep the skin's outline; every other building wears the outline of its type, in the skin's colours
    const shp=(rr)=>city?bShape(c,BS?BS.sh:'c',p.x,p.y,rr):tShape(c,s.type,p.x,p.y,rr);
    if(BS){shp(r);if(BS.gl&&R.q&&r>=6){c.save();c.shadowColor=BS.gl;c.shadowBlur=r*.9;c.fillStyle=BS.f;c.fill();c.restore();}else{c.fillStyle=BS.f;c.fill();}c.lineWidth=Math.max(1.6,r*.16);c.strokeStyle=BS.s;c.stroke();c.lineWidth=Math.max(1.2,r*.1);c.strokeStyle=n.css;shp(r+c.lineWidth*1.4);c.stroke();}
    else{shp(r);c.fillStyle=rn?'#5f5650':n?n.css:'#8a8d92';c.fill();c.lineWidth=s.capital?2.2:1.4;c.strokeStyle=s.capital?'#ffe9a8':'rgba(6,12,20,.9)';c.lineJoin='round';c.stroke();}
    if(r>5.5){const q=r*(city?1.5:1.35);c.drawImage(R.glyph[rn?'ruin':s.capital?'cap':s.type],p.x-q/2,p.y-q/2+(TGY[s.type]||0)*r,q,q);}
    if(rn){c.strokeStyle=n?n.css:'#888';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,r+2,0,7);c.stroke();for(let k=0;k<3;k++){const ph=(ts/1400+k/3)%1;c.fillStyle=`rgba(70,66,62,${.55*(1-ph)})`;c.beginPath();c.arc(p.x+Math.sin(k*2.1+ph*3)*r*.4,p.y-r-ph*r*2.4,r*(.35+ph*.55),0,7);c.fill();}}
    if(!city&&s.level>1&&z>=2.6){c.beginPath();c.arc(p.x+r*.8,p.y-r*.8,6,0,7);c.fillStyle='#0b1826';c.fill();c.font=`700 10px ${FONT}`;c.fillStyle='#f6dc9a';c.fillText(s.level,p.x+r*.8,p.y-r*.75);}
    if(s.upAt>g.tick){c.strokeStyle='#f6dc9a';c.lineWidth=2.5;c.beginPath();c.arc(p.x,p.y,r+4,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-(s.upAt-g.tick)/60));c.stroke();}
    if(city&&z>=4.2){
      c.font=`600 ${Math.round(clamp(z*1.9,10,13))}px ${FONT}`;c.lineWidth=3;c.strokeStyle='rgba(6,12,20,.8)';txt(c,cityName(s.name,UI.lang),p.x,p.y+r+9,'#f6ecd2');
      c.beginPath();c.arc(p.x+r*.8,p.y-r*.8,6,0,7);c.fillStyle='#0b1826';c.fill();c.font=`700 10px ${FONT}`;c.fillStyle='#f6dc9a';c.fillText(s.level,p.x+r*.8,p.y-r*.75);
    }
    if(s.type==='mon'){const left=Math.max(0,Math.ceil((s.cd-g.tick)/TPS));c.font=`700 13px ${FONT}`;c.lineWidth=3;c.strokeStyle='rgba(6,12,20,.9)';txt(c,left+'s',p.x,p.y-r-9,'#ffe9a8');
      c.strokeStyle='rgba(255,233,168,.7)';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,r+5+Math.sin(ts/200)*2,0,7);c.stroke();}
    if(s.type==='silo'&&s.cd>g.tick&&s.owner===me){c.strokeStyle='#f2b441';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,r+3,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-(s.cd-g.tick)/50));c.stroke();}
    if(s.build>g.tick){c.globalAlpha=1;c.strokeStyle='#ffe9a8';c.lineWidth=2.5;c.beginPath();c.arc(p.x,p.y,r+3.5,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-(s.build-g.tick)/(s.bt||60)));c.stroke();if(s.owner===me){c.font=`700 11px ${FONT}`;c.lineWidth=3;c.strokeStyle='rgba(6,12,20,.9)';txt(c,Math.ceil((s.build-g.tick)/TPS)+'s',p.x,p.y-r-10,'#ffe9a8');}}
  }
  // nation labels: your realm first, then the largest; each one avoids building icons and every label already placed
  const LB=[],LO=g.nations.filter(n=>n&&n.alive&&n.tiles).sort((a,b)=>(b.id===me)-(a.id===me)||b.tiles-a.tiles),fmax=clamp(Math.min(cw,ch)*.085,22,56);
  for(const n of LO){
    const nm=natName(n);let fs=Math.min(Math.sqrt(n.tiles)*z*.22,clamp((n.x1-n.x0+1)*z/(nm.length*.62+1),11,fmax));if(fs<9&&n.id!==me)continue;
    // the label glides to the middle of the realm instead of jumping
    if(n.lx==null||Math.abs(n.lx-n.cx)>80||Math.abs(n.ly-n.cy)>80){n.lx=n.cx;n.ly=n.cy;}else{n.lx+=(n.cx-n.lx)*.06;n.ly+=(n.cy-n.ly)*.06;}
    const p=w2s(n.lx+.5,n.ly+.5);if(p.x<-300||p.y<-100||p.x>cw+300||p.y>ch+100)continue;
    let f=Math.round(Math.max(fs,11)/2)*2,y=0,hw=0,ok=false;
    for(let tries=0;tries<3&&!ok;tries++){
      c.font=`700 ${f}px ${FONT}`;hw=textW(c,nm,f)/2+6;const st=Math.min(f,30)*1.1;
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
    if(n.badge){const q=Math.max(16,f*1.25);c.font=`700 ${f}px ${FONT}`;drawBadge(c,p.x+c.measureText(nm).width/2+q*.62,y,q,ts);c.font=`700 ${f}px ${FONT}`;c.lineWidth=Math.max(2.5,f*.2);c.strokeStyle='rgba(6,12,20,.78)';}
    c.font=`600 ${Math.round(f*.72)}px ${FONT}`;txt(c,fmt(n.troops),p.x,y+f*.98,rel);
    if(g.hegemon===n.id||n.mon){const q=f*1.1;c.drawImage(R.glyph.crown,p.x-q/2,y-f*1.5,q,q*.9);}
    if(H&&n.id!==me&&H.ally[n.id]){const q=Math.max(14,f*.95);c.font=`${q}px sans-serif`;c.fillText('🤝',p.x-hw-q*.75,y);c.font=`700 ${f}px ${FONT}`;}
    if(n.emo&&g.tick<n.emoT){const age=1-(n.emoT-g.tick)/60,ez=UI.emoZ||1,q=Math.max(18,f*1.5)*ez*(age<.08?.5+age*6.25:1);c.globalAlpha=age>.85?(1-age)/.15:1;drawEmo(c,EMO[n.emo-1],p.x,y-f*(g.hegemon===n.id||n.mon?2.6:1.5)-q*.4*(ez-1),q,ts);c.globalAlpha=1;c.font=`700 ${f}px ${FONT}`;}
  }
  R.lb=LB;
  // missiles and pending strikes
  // troops pushing on each front that involves me, drawn over the cities so the number is always readable
  if(me){frontSpots(g,me,ts);for(const k of g.attacks){if((k.a!==me&&k.d!==me)||!k.d||k.troops<1)continue;const FL=R.front[k.id];if(!FL||!FL.length)continue;for(const F of FL){if(F.sx==null)continue;
    F.sh=F.share;F.sx+=(F.x-F.sx)*.1;F.sy+=(F.y-F.sy)*.1;let da=F.ang-F.sa;if(da>Math.PI/2)da-=Math.PI;if(da<-Math.PI/2)da+=Math.PI;F.sa=clamp(F.sa+da*.1,-.52,.52);F.ss+=(F.sz-F.ss)*.1;
    const q=w2s(F.sx+.5,F.sy+.5);if(q.x<-80||q.y<-40||q.x>cw+80||q.y>ch+40)continue;const fs=Math.round(clamp(F.ss*z,12,46)/2)*2;
    c.save();c.translate(q.x,q.y);c.rotate(F.sa);c.font=`800 ${fs}px ${FONT}`;c.direction='ltr';c.lineWidth=Math.max(3,fs*.2);c.strokeStyle='rgba(6,12,20,.85)';c.globalAlpha=.95;txt(c,fmt(k.troops*F.sh),0,0,k.a===me?'#bfe4ff':'#ffc2b8');c.restore();}}}
  drawSmoke(c,z,cw,ch);
  for(const m of g.missiles){
    {const dm=m.type==='doom',nk=m.type==='nuke',q=R.q==null?2:R.q,zs=Math.min(1.8,Math.max(.7,z/3)),r0=(dm?4:nk?3:2.2)*zs,span=.42,N=40;
      if(q){const P=mslW(m,m.t),step=q===2?.45:.9;if(!m._lp)m._lp={x:mslW(m,0).x,y:mslW(m,0).y};let dx=P.x-m._lp.x,dy=P.y-m._lp.y,d=Math.hypot(dx,dy);
        while(d>=step){m._lp.x+=dx/d*step;m._lp.y+=dy/d*step;puff(m._lp.x,m._lp.y,(dm?.85:nk?.65:.45)*Math.min(1,.35+m.t*12),dm?5000:nk?4000:3000,dm,-Math.min(1500,d/step*30));dx=P.x-m._lp.x;dy=P.y-m._lp.y;d=Math.hypot(dx,dy);}}
      else{c.strokeStyle='rgba(200,200,205,.6)';c.lineWidth=2;c.beginPath();for(let k=0;k<=12;k++){const t0=Math.max(0,m.t-k*.02),a=mslPos(m,t0);k?c.lineTo(a.x,a.y):c.moveTo(a.x,a.y);}c.stroke();}
      c.globalCompositeOperation='lighter';for(let k=1;k<=(q?9:4);k++){const t0=m.t-span*k/N;if(t0<0)break;const a=mslPos(m,t0),f=1-k/10;c.fillStyle=`rgba(255,${120+k*12},${30+k*6},${.75*f})`;c.beginPath();c.arc(a.x,a.y,r0*(1.3+k*.3),0,7);c.fill();}c.globalCompositeOperation='source-over';}
    // the dome's interceptor follows the game clock, so it always meets the missile where the game says it does
    if(m.ic&&!m._ic){m._ic=1;const I=m.ic,M=mslW(m,I.at),sx=I.s%g.W,sy=(I.s/g.W)|0;
      if(I.ok)(R.iv||(R.iv=[])).push({tx:m.tx,ty:m.ty,mx:M.x,my:M.y,until:performance.now()+60000});addFx('intc',sx,sy,{mx:M.x,my:M.y,m,dur:1e9});addFx('flash',sx,sy,{dur:300});}
    const h=mslPos(m,m.t),tp=w2s(m.tx+.5,m.ty+.5);
    // launch: a flash and a cloud of smoke rolling out at the silo, and the missile grows out of it instead of popping in
    if(!m._seen){m._seen=1;const q=R.q==null?2:R.q;addFx('flash',m.sx,m.sy,{dur:450});addFx('ring',m.sx,m.sy,{r:2.2,dur:700,col:'rgba(255,200,140,.9)'});
      const n=q===2?14:q===1?6:0;for(let i=0;i<n;i++){const a=i/n*6.28;puff(m.sx+.5+Math.cos(a)*.9,m.sy+.5+Math.sin(a)*.5,.7+Math.random()*.5,2500+Math.random()*1500,false);}}
    const grow=Math.min(1,.25+m.t/.05*.75);
    {const b=mslPos(m,Math.max(0,m.t-.01)),ang=Math.atan2(h.y-b.y,h.x-b.x),sp=mslSprite(m.type),base=Math.max(16,Math.min(44,12+z*2)),L=base*(m.type==='doom'?2:m.type==='nuke'?1.35:1),Hh=L*sp.height/sp.width,ts=performance.now();
      c.save();c.translate(h.x,h.y);c.rotate(ang);c.scale(grow,grow);
      if(m.type==='doom'){const pu=.6+.4*Math.sin(ts/160),ag=c.createRadialGradient(-L*.2,0,0,-L*.2,0,L*.9);ag.addColorStop(0,`rgba(255,40,20,${.38*pu})`);ag.addColorStop(1,'rgba(120,0,0,0)');c.globalCompositeOperation='lighter';c.fillStyle=ag;c.beginPath();c.arc(-L*.2,0,L*.9,0,7);c.fill();c.globalCompositeOperation='source-over';}
      {const ng=c.createRadialGradient(-L*.6,0,0,-L*.6,0,L*.85);ng.addColorStop(0,'rgba(255,235,170,.95)');ng.addColorStop(.35,'rgba(255,150,40,.6)');ng.addColorStop(1,'rgba(255,70,10,0)');c.globalCompositeOperation='lighter';c.fillStyle=ng;c.beginPath();c.arc(-L*.6,0,L*.85,0,7);c.fill();c.globalCompositeOperation='source-over';}
      mslFlame(c,L*(m.type==='doom'?1.5:1.35),Hh*(m.type==='doom'?.42:.5),ts,m.type==='doom'?'rgba(255,90,30,.95)':'rgba(255,170,50,.95)');
      c.translate(-L*.08,0);c.drawImage(sp,-L*.5,-Hh/2,L,Hh);c.restore();}
    c.strokeStyle='rgba(255,84,64,.85)';c.setLineDash([6,5]);c.lineWidth=1.6;c.beginPath();c.arc(tp.x,tp.y,MSL[m.type].r*z,0,7);c.stroke();c.setLineDash([]);
  }
  for(const p of g.pending){
    const q=w2s(p.x+.5,p.y+.5),k=clamp(1-(p.at-g.tick)/50,0,1),rr=(p.type==='tsunami'?10:6)*z;
    c.strokeStyle=p.type==='tsunami'?'rgba(120,220,255,.9)':'rgba(255,120,60,.9)';c.setLineDash([5,5]);c.lineWidth=2;c.beginPath();c.arc(q.x,q.y,rr,0,7);c.stroke();c.setLineDash([]);
    if(p.type==='meteor'){const d=(1-k)*260;c.strokeStyle='rgba(255,190,110,.9)';c.lineWidth=5;c.beginPath();c.moveTo(q.x+d,q.y-d*1.6);c.lineTo(q.x+d+26,q.y-d*1.6-42);c.stroke();c.fillStyle='#fff3d0';c.beginPath();c.arc(q.x+d,q.y-d*1.6,5,0,7);c.fill();}
    if(p.type==='beam'){c.strokeStyle=`rgba(190,150,255,${.3+k*.6})`;c.lineWidth=2+k*7;c.beginPath();c.moveTo(q.x,0);c.lineTo(q.x,q.y);c.stroke();}
  }
  // tanks: a detailed top-down sprite per realm; tracks roll as they drive, dust behind on the move, muzzle flash in battle; a dot when far away
  if(g.tanks.length){const s=Math.max(3.6,Math.min(z*1.7,15));for(const T of g.tanks){const p=w2s(T.x,T.y);if(p.x<-24||p.y<-24||p.x>cw+24||p.y>ch+24)continue;const n=g.nations[T.a];
    if(s<6){c.fillStyle='#2b3138';c.strokeStyle=n.css;c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,s*.8,0,7);c.fill();c.stroke();continue;}
    const mv=T.lx!=null&&(T.lx!==T.x||T.ly!==T.y);if(mv)T.od=(T.od||0)+hyp(T.x-T.lx,T.y-T.ly);T.lx=T.x;T.ly=T.y;
    const dir=Math.atan2(T.vy,T.vx);
    if(mv&&R.q===2&&T.k&&Math.random()<.25)addFx('dust',T.x-.5-T.vx*1.2,T.y-.5-T.vy*1.2,{dur:700});
    c.save();c.translate(p.x,p.y);c.rotate(dir);
    if(R.q){c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(s*.12,s*.16,s*1.2,s*.82,0,0,7);c.fill();}
    c.drawImage(tankSprite(n,(T.od||0)),-s*1.2,-s*.85,s*2.4,s*1.7);
    if(T.k&&g.tick-T.fire<2&&Math.random()<.35){c.globalCompositeOperation='lighter';const gr=c.createRadialGradient(s*1.65,0,0,s*1.65,0,s*.55);gr.addColorStop(0,'rgba(255,240,180,.95)');gr.addColorStop(1,'rgba(255,120,20,0)');c.fillStyle=gr;c.beginPath();c.arc(s*1.65,0,s*.55,0,7);c.fill();c.globalCompositeOperation='source-over';}
    c.restore();
    if(T.hp<100){c.fillStyle='rgba(0,0,0,.6)';c.fillRect(p.x-s,p.y-s*1.3,s*2,Math.max(2,s*.2));c.fillStyle=T.hp>50?'#6ee7a0':T.hp>25?'#ffd166':'#ff6b5a';c.fillRect(p.x-s,p.y-s*1.3,s*2*T.hp/100,Math.max(2,s*.2));}
    if(T.k&&g.tick-T.fire<3&&R.q!==0&&Math.random()<.04)addFx('ring',T.x-.5+T.vx*3,T.y-.5+T.vy*3,{r:1.4,dur:450,col:'rgba(255,170,80,.9)'});}}
  // effects
  for(let i=R.fx.length-1;i>=0;i--){
    const f=R.fx[i];f.t+=dt/f.dur;
    if(f.m){const I=f.m.ic;f.t=Math.min(1,Math.max(f.t,(f.m.t-I.l)/(I.at-I.l)));if(f.t>=1&&!I.ok)addFx('airburst',0,0,{mx:f.mx+.9,my:f.my-.7,dur:450});}
    if(f.t>=1){R.fx.splice(i,1);continue;}const p=w2s(f.x+.5,f.y+.5),e=1-(1-f.t)*(1-f.t);
    if(f.type==='boom'){const q=R.q==null?2:R.q,k=f.kind||(f.nuke?'nuke':'rocket'),big=k==='doom',nk=k==='nuke'||big,fa=1-f.t;
      // smoke left behind by the blast, once
      if(!f.sm){f.sm=1;const n=q===2?(big?34:nk?22:9):q===1?(big?14:nk?9:4):0,R0=f.r/(big?1.6:nk?1.6:1.25);
        for(let i=0;i<n;i++){const a=Math.random()*6.28,d=Math.random()*R0*.6;puff(f.x+.5+Math.cos(a)*d,f.y+.5+Math.sin(a)*d*.6-(nk?Math.random()*R0*.8:0),(big?2.6:nk?1.8:.9)*(.6+Math.random()*.6),(big?8000:nk?6000:3000)*(.7+Math.random()*.5),true,nk?f.dur*.45:120);}}
      // flash and fireball
      const fb=Math.min(1,f.t/(nk?.35:.6)),rr=Math.max(4,f.r*z*(nk?.55:1)*(.25+.95*(1-(1-fb)*(1-fb)))),gr=c.createRadialGradient(p.x,p.y,0,p.x,p.y,rr);
      const fbA=nk?Math.max(0,1-f.t/.6):fa;gr.addColorStop(0,`rgba(255,250,220,${.95*fbA})`);gr.addColorStop(.45,`rgba(255,${nk?140:170},50,${.75*fbA})`);gr.addColorStop(1,'rgba(120,30,10,0)');
      c.fillStyle=gr;c.beginPath();c.arc(p.x,p.y,rr,0,7);c.fill();
      // shock ring
      if(q){const sr=f.r*z*(.3+f.t*(big?2.2:1.3));c.strokeStyle=`rgba(255,240,215,${(big?.7:.55)*fa})`;c.lineWidth=big?4:2.5;c.beginPath();c.ellipse(p.x,p.y,sr,sr*.55,0,0,7);c.stroke();}
      // rocket: sparks thrown out
      if(!nk&&q){c.globalCompositeOperation='lighter';for(let i=0;i<(q===2?12:6);i++){const a=i*2.4+f.x,d=rr*(.4+f.t*1.6);c.fillStyle=`rgba(255,${180+(i%3)*25},80,${fa})`;c.fillRect(p.x+Math.cos(a)*d,p.y+Math.sin(a)*d*.7-f.t*rr*.5,2.5,2.5);}c.globalCompositeOperation='source-over';}
      // nuke and doom: a mushroom cloud rising — a stem and a rolling cap
      if(nk){const u=Math.min(1,f.t/.55),H=f.r*z*(big?1.5:1.05)*(1-(1-u)*(1-u)),cw2=f.r*z*(big?.75:.5)*(.5+.5*u),stem=cw2*.32,al=Math.min(1,(1-f.t)*2.2),cy=p.y-H;
        const sg=c.createLinearGradient(0,cy,0,p.y);sg.addColorStop(0,`rgba(255,170,80,${.8*al})`);sg.addColorStop(1,`rgba(120,60,40,${.6*al})`);c.fillStyle=sg;
        c.beginPath();c.moveTo(p.x-stem*.6,p.y);c.quadraticCurveTo(p.x-stem*.4,(p.y+cy)/2,p.x-stem,cy+cw2*.2);c.lineTo(p.x+stem,cy+cw2*.2);c.quadraticCurveTo(p.x+stem*.4,(p.y+cy)/2,p.x+stem*.6,p.y);c.closePath();c.fill();
        const n=q===2?9:q===1?5:3;for(let i=0;i<n;i++){const a=i/n*Math.PI*2+f.t*2,rx=Math.cos(a)*cw2*.7,ry=Math.sin(a)*cw2*.22,r2=cw2*(q?.45:.7);
          const cg=c.createRadialGradient(p.x+rx,cy+ry-r2*.2,0,p.x+rx,cy+ry,r2);const hot=Math.max(0,1-f.t*1.8);
          cg.addColorStop(0,`rgba(255,${200-80*(1-hot)},${120-90*(1-hot)},${al})`);cg.addColorStop(.6,`rgba(${big?150:190},${big?60:90},${big?40:50},${.85*al})`);cg.addColorStop(1,`rgba(60,40,40,0)`);
          c.fillStyle=cg;c.beginPath();c.arc(p.x+rx,cy+ry,r2,0,7);c.fill();}
        if(big&&q){c.strokeStyle=`rgba(255,220,180,${.45*al})`;c.lineWidth=3;c.beginPath();c.ellipse(p.x,cy+cw2*.9,cw2*1.3,cw2*.3,0,0,7);c.stroke();}}
    }else if(f.type==='ring'){c.strokeStyle=f.col||'#ffe9a8';c.globalAlpha=1-f.t;c.lineWidth=3;c.beginPath();c.arc(p.x,p.y,(f.r||8)*z*e+4,0,7);c.stroke();c.globalAlpha=1;}
    else if(f.type==='shot'){
      // coastal gun: muzzle flash, a shell on an arc, then a splash of water and fire where it lands
      const q=w2s(f.tx+.5,f.ty+.5),fly=.55;
      if(f.t<.18){const a=1-f.t/.18;c.globalCompositeOperation='lighter';const gr=c.createRadialGradient(p.x,p.y,0,p.x,p.y,10*Math.min(2,z/3)+6);gr.addColorStop(0,`rgba(255,240,190,${a})`);gr.addColorStop(1,'rgba(255,120,20,0)');c.fillStyle=gr;c.beginPath();c.arc(p.x,p.y,10*Math.min(2,z/3)+6,0,7);c.fill();c.globalCompositeOperation='source-over';}
      if(f.t<fly){const u=f.t/fly,hx=lerp(p.x,q.x,u),hy=lerp(p.y,q.y,u)-Math.sin(Math.PI*u)*Math.hypot(q.x-p.x,q.y-p.y)*.25;
        c.strokeStyle='rgba(255,210,140,.8)';c.lineWidth=2.4;c.beginPath();for(let k=0;k<=8;k++){const v=Math.max(0,u-k*.03),x=lerp(p.x,q.x,v),y=lerp(p.y,q.y,v)-Math.sin(Math.PI*v)*Math.hypot(q.x-p.x,q.y-p.y)*.25;k?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
        c.fillStyle='#fff3c4';c.beginPath();c.arc(hx,hy,3.6,0,7);c.fill();}
      else{const u=(f.t-fly)/(1-fly),r=(6+u*16)*Math.min(1.8,Math.max(.8,z/3));c.fillStyle=`rgba(230,245,255,${.7*(1-u)})`;for(let k=0;k<5;k++){const a=k*1.256+u;c.beginPath();c.arc(q.x+Math.cos(a)*r*.6,q.y-Math.abs(Math.sin(a))*r*1.2*(1-u),2.2*(1-u)+.8,0,7);c.fill();}
        c.strokeStyle=`rgba(255,255,255,${.8*(1-u)})`;c.lineWidth=1.6;c.beginPath();c.arc(q.x,q.y,r,0,7);c.stroke();c.globalCompositeOperation='lighter';c.fillStyle=`rgba(255,150,50,${.75*(1-u)})`;c.beginPath();c.arc(q.x,q.y,r*.35,0,7);c.fill();c.globalCompositeOperation='source-over';}}
    else if(f.type==='intc'){
      // interceptor from the dome: rises steeply, then curves onto the meeting point; a white smoke trail behind it
      const q=w2s(f.mx,f.my),cx=p.x,cy=p.y-Math.max(60,Math.abs(q.y-p.y)*1.1),pt=u=>({x:(1-u)*(1-u)*p.x+2*(1-u)*u*cx+u*u*q.x,y:(1-u)*(1-u)*p.y+2*(1-u)*u*cy+u*u*q.y}),u=Math.min(1,f.t*1.02);
      if(f.t<.35){const k=f.t/.35;c.fillStyle=`rgba(230,236,244,${.5*(1-k)})`;for(let j=0;j<5;j++){const a=j*1.26;c.beginPath();c.arc(p.x+Math.cos(a)*(6+k*14),p.y+Math.abs(Math.sin(a))*4-k*4,5+k*7,0,7);c.fill();}}
      for(let k=34;k>=1;k--){const v=u-k*.022;if(v<0)continue;const P=pt(v),fk=1-k/34;c.fillStyle=`rgba(238,242,248,${.55*Math.pow(fk,1.3)})`;c.beginPath();c.arc(P.x,P.y,1.4+k*.2,0,7);c.fill();}
      const H=pt(u),B=pt(Math.max(0,u-.02)),ang=Math.atan2(H.y-B.y,H.x-B.x),sp=mslSprite('intc'),L=Math.max(16,Math.min(34,10+z*1.8));
      c.save();c.translate(H.x,H.y);c.rotate(ang);mslFlame(c,L*1,L*.14,performance.now(),'rgba(255,175,60,.95)');c.drawImage(sp,-L*.55,-L*sp.height/sp.width/2,L,L*sp.height/sp.width);c.restore();}
    else if(f.type==='flash'){c.globalAlpha=1-f.t;c.fillStyle='rgba(160,215,255,.9)';c.beginPath();c.arc(p.x,p.y,6+f.t*16,0,7);c.fill();c.globalAlpha=1;}
    else if(f.type==='airburst'){const q=w2s(f.mx,f.my),r=10+f.t*42,gr=c.createRadialGradient(q.x,q.y,0,q.x,q.y,r);gr.addColorStop(0,`rgba(255,255,240,${1-f.t})`);gr.addColorStop(.4,`rgba(150,215,255,${.8*(1-f.t)})`);gr.addColorStop(1,'rgba(80,140,255,0)');
      c.globalCompositeOperation='lighter';c.fillStyle=gr;c.beginPath();c.arc(q.x,q.y,r,0,7);c.fill();c.globalCompositeOperation='source-over';c.strokeStyle=`rgba(200,235,255,${.8*(1-f.t)})`;c.lineWidth=2;c.beginPath();c.arc(q.x,q.y,r*1.15,0,7);c.stroke();}
    else if(f.type==='sword'){
      // a drawn steel sword slashes down with a light trail, rests, then fades with the troops taken
      const T=f.t,sw=Math.min(1,T/.22),ease=1-(1-sw)**3,a=T>.78?(1-T)/.22:1,L=clamp(z*8,54,80),cx=p.x,cy=p.y-24;
      c.globalAlpha=a;
      // two swords swing in from either side and lock in a cross
      const A2=-2.1+ease*(2.1-.62),wob=T>.22&&T<.78?Math.sin((T-.22)*18)*.02:0;
      if(T<.4){const k=T<.22?1:1-(T-.22)/.18;c.lineCap='round';for(const m of[1,-1]){c.strokeStyle=`rgba(255,248,225,${.5*k})`;c.lineWidth=L*.14;c.beginPath();if(m>0)c.arc(cx,cy,L*.78,-2.1-Math.PI/2,A2-Math.PI/2,false);else c.arc(cx,cy,L*.78,2.1-Math.PI/2,-A2-Math.PI/2,true);c.stroke();}}
      drawSword(c,cx,cy,L,A2+wob);drawSword(c,cx,cy,L,-A2-wob);
      if(T>.2&&T<.34){const k=1-(T-.2)/.14;c.fillStyle=`rgba(255,240,190,${.9*k})`;c.beginPath();c.arc(cx,cy-L*.46,L*.1*(1+(1-k)*1.5),0,7);c.fill();}
      if(T>.18){const k=Math.min(1,(T-.18)/.1);c.font=`800 ${Math.round(20+4*k)}px ${FONT}`;c.lineWidth=4.5;c.strokeStyle='rgba(6,12,20,.92)';c.direction='ltr';txt(c,f.s,cx,cy+L*.62+(1-k)*8,'#ffe08a');c.direction='inherit';}
      c.globalAlpha=1;}
    else if(f.type==='dust'){c.globalAlpha=.3*(1-f.t);c.fillStyle='#8a7a62';c.beginPath();c.arc(p.x,p.y,(2+f.t*7)*Math.min(1.6,z/4),0,7);c.fill();c.globalAlpha=1;}
    else if(f.type==='text'){c.globalAlpha=1-f.t*f.t;c.font=`700 ${f.size||15}px ${FONT}`;c.lineWidth=3.5;c.strokeStyle='rgba(6,12,20,.9)';if(/^[+\-\d]/.test(f.s))c.direction='ltr';txt(c,f.s,p.x,p.y-10-e*34,f.col||'#fff');c.direction='inherit';c.globalAlpha=1;}
  }
  // placement preview: range circle plus a ghost of the building where it will actually stand
  if(UI.mode&&(UI.pend>=0||UI.hover>=0)&&me){
    const m=UI.mode,k=m.slice(2),H=g.nations[me];let i=UI.pend>=0?UI.pend:UI.hover,rad=0,ok=true;
    if(m[0]==='b'){if(k==='port'||k==='coast')i=snapPort(g,H,i,UI.mob?6:4,k);rad={city:R_CITY,fort:R_FORT,shield:SHIELD_R,coast:COAST_R}[k]||2;
      if(k==='factory'){if(!UI.railPrev||UI.railPrev.i!==i||g.tick-UI.railPrev.t>50){const tp=[];for(const s of trainTargets(g,me,i%g.W,(i/g.W)|0)){const p=landPath(g,i,s.i,110);if(p)tp.push(p);}UI.railPrev={i,t:g.tick,paths:railPlan(g,me,i),trade:tp};}
        const dr=(L,col)=>{c.strokeStyle=col;for(const P of L){c.beginPath();P.forEach((t,k)=>{const q=w2s(t%g.W+.5,((t/g.W)|0)+.5);k?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y);});c.stroke();}};
        c.lineWidth=2.5;c.setLineDash([3,6]);dr(UI.railPrev.trade,'rgba(120,230,160,.9)');c.setLineDash([7,6]);dr(UI.railPrev.paths,'rgba(255,233,168,.95)');c.setLineDash([]);}ok=!canBuild(g,H,k,i);}else if(m[0]==='m')rad=MSL[k].r;else if(m[0]==='s'){const sh=shoreNear(g,i,+k,10);ok=sh>=0;if(sh>=0)i=sh;rad=2.5;}else rad={bribe:9,tsunami:10,beam:5}[FAC[H.fac].ult]||0;
    const p=w2s(i%g.W+.5,((i/g.W)|0)+.5);
    c.strokeStyle=ok?'rgba(120,240,160,.95)':'rgba(255,100,90,.95)';c.fillStyle=ok?'rgba(120,240,160,.14)':'rgba(255,100,90,.14)';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,rad*z,0,7);c.fill();c.stroke();
    if(m[0]==='b'){const r=Math.max(2.5,z*(k==='city'?2.65:2.6)),q=r*1.5;c.globalAlpha=.6+.3*Math.sin(ts/160);tShape(c,k,p.x,p.y,r);c.fillStyle=ok?H.css:'#a33';c.fill();c.lineWidth=2;c.strokeStyle='#fff';c.stroke();c.drawImage(R.glyph[k],p.x-q/2,p.y-q/2,q,q);c.globalAlpha=1;}
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
