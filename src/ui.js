// ── SIJAL · interface, input, audio, game loop ──
let G=null,acc=0,lastTs=0;
// public key for the suggestions inbox (Web3Forms); used when the game is not served from Netlify
// online leaderboard (Firebase Realtime Database + anonymous sign-in); empty = turned off
const LB_DB='https://sijal-fa367-default-rtdb.firebaseio.com',LB_KEY='AIzaSyABuacot7I8S6r-7bsTHbYgMWhQC7OHXi4';
const SUGGEST_KEY='137b52a0-fd63-4170-99f2-83a421aef9f4';
const $=s=>document.querySelector(s),BAR=['city','fort','port','coast','factory','camp','silo','shield','rocket','nuke','doom','ult'],rankOf=p=>p.wins<=0?0:Math.min(21,Math.ceil(p.wins/25)),SIZES=[[420,264],[540,340],[680,428],[840,528]],BOTS=[6,10,14,18,23];

// ── profile (per-device convenience only) ──
function loadProf(){
  let p={};try{p=JSON.parse(localStorage.getItem('sijal.v1')||'{}')||{};}catch(e){}
  UI.prof=Object.assign({xp:0,games:0,wins:0,ms:0,fb:{},lang:'ar',sound:true,music:true,ui:0,fac:'hawks',name:'',type:'continents',size:-1,bots:-1,diff:1,daily:{}},p);
  UI.lang=UI.prof.lang==='en'?'en':'ar';
}
function saveProf(){try{localStorage.setItem('sijal.v1',JSON.stringify(UI.prof));}catch(e){}}
function applyMode(){
  const p=UI.prof,f=window.SIJAL_MODE,a=$('#app');
  UI.mob=f?f==='mobile':p.ui===2||(p.ui===0&&(matchMedia('(pointer:coarse)').matches||innerWidth<760));
  a.classList.toggle('mob',UI.mob);a.dir=UI.lang==='ar'?'rtl':'ltr';a.lang=UI.lang;
}

// ── audio: everything is synthesised ──
const AU={ctx:null,out:null,fx:null,mus:null,dst:null,deg:4,step:0};
function applyVol(){const p=UI.prof;if(!AU.ctx)return;AU.fx.gain.value=p.sound?(p.volS==null?70:p.volS)/100*1.2:0;AU.mus.gain.value=p.music?(p.volM==null?70:p.volM)/100*1.3:0;}
function auInit(){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;try{if(AU.ctx&&AU.ctx.state==='closed')AU.ctx=null;
    if(!AU.ctx){const a=AU.ctx=new C();AU.out=a.createGain();AU.out.gain.value=.55;AU.out.connect(a.destination);AU.fx=a.createGain();AU.mus=a.createGain();AU.fx.connect(AU.out);AU.mus.connect(AU.out);applyVol();}
    if(AU.ctx.state!=='running'){AU.ctx.resume();clearTimeout(AU.fix);AU.fix=setTimeout(()=>{if(AU.ctx&&AU.ctx.state!=='running'){try{AU.ctx.close();}catch(e){}AU.ctx=null;}},600);}}catch(e){}}
function tone(f,d,type,v,slide,delay){
  const a=AU.ctx;if(!a)return;const t0=a.currentTime+(delay||0),o=a.createOscillator(),g=a.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t0);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f*slide),t0+d);
  g.gain.setValueAtTime(.0001,t0);g.gain.linearRampToValueAtTime(v||.15,t0+.012);g.gain.exponentialRampToValueAtTime(.0001,t0+d);o.connect(g);g.connect(AU.dst||AU.fx);o.start(t0);o.stop(t0+d+.05);
}
function noise(d,v,f0,f1){
  const a=AU.ctx;if(!a)return;const n=Math.floor(a.sampleRate*d),b=a.createBuffer(1,n,a.sampleRate),ch=b.getChannelData(0);for(let i=0;i<n;i++)ch[i]=Math.random()*2-1;
  const s=a.createBufferSource(),fl=a.createBiquadFilter(),g=a.createGain(),t0=a.currentTime;s.buffer=b;fl.type='lowpass';fl.frequency.setValueAtTime(f0,t0);fl.frequency.exponentialRampToValueAtTime(f1,t0+d);
  g.gain.setValueAtTime(v,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+d);s.connect(fl);fl.connect(g);g.connect(AU.dst||AU.fx);s.start(t0);
}
const SFX={
  siren:()=>{for(let i=0;i<3;i++){tone(480,.36,'sawtooth',.1,1.7,i*.42);tone(240,.36,'square',.05,1.7,i*.42);}},
  trade:()=>{tone(196,.22,'sine',.07);tone(246.9,.3,'sine',.06,1,.12);},
  click:()=>tone(620,.06,'triangle',.1),err:()=>tone(150,.16,'square',.07,.7),
  attack:()=>{tone(196,.28,'sawtooth',.09,1.5);tone(294,.32,'sawtooth',.06,1.25,.07);},
  build:()=>{tone(170,.12,'square',.09,.6);tone(520,.16,'triangle',.09,1,.08);},
  coin:()=>{tone(988,.08,'square',.05);tone(1319,.16,'square',.05,1,.07);},
  boat:()=>tone(330,.4,'sine',.1,.6),launch:()=>noise(1.3,.22,400,2600),
  boom:()=>noise(.8,.42,900,60),nuke:()=>{noise(2.6,.7,520,30);tone(58,2.2,'sine',.4,.5);},
  alert:()=>{tone(740,.14,'square',.07);tone(554,.22,'square',.07,1,.16);},
  city:()=>[523,659,784].forEach((f,i)=>tone(f,.24,'triangle',.11,1,i*.09)),
  era:()=>[392,523,659,784,1047].forEach((f,i)=>tone(f,.3,'triangle',.1,1,i*.08)),
  // one call per season: spring rises bright, summer blares, autumn falls warm, winter rings cold and low
  season0:()=>[523.25,659.25,783.99,1046.5].forEach((f,i)=>{tone(f,.5,'triangle',.08,1,i*.11);tone(f*2,.3,'sine',.02,1,i*.11);}),
  season1:()=>{[392,392,523.25].forEach((f,i)=>tone(f,i<2?.14:.7,'sawtooth',.07,1,i*.16));tone(196,.9,'sine',.12,1,.32);noise(.4,.08,3000,500);},
  season2:()=>[783.99,659.25,587.33,493.88,392].forEach((f,i)=>tone(f,.55,'triangle',.07,1,i*.15)),
  season3:()=>{[1318.5,1174.7,987.77,880].forEach((f,i)=>{tone(f,1.2,'sine',.05,1,i*.22);tone(f*1.5,.9,'sine',.015,1,i*.22);});tone(98,2.2,'sine',.1,.8);noise(1.6,.04,1200,4000);},ult:()=>{tone(220,.5,'sawtooth',.1,3);noise(.5,.15,3000,400);},
  lose1:()=>[330,262,196].forEach((f,i)=>tone(f,.3,'sawtooth',.07,1,i*.13)),win1:()=>[392,523,659].forEach((f,i)=>tone(f,.22,'square',.06,1,i*.08)),
  win:()=>[523,659,784,1047,1319].forEach((f,i)=>tone(f,.5,'triangle',.12,1,i*.14)),lose:()=>[392,330,262,196,147].forEach((f,i)=>tone(f,.6,'sawtooth',.07,1,i*.2))};
function sfx(n){if(UI.prof.sound&&AU.ctx&&SFX[n]){AU.dst=AU.fx;SFX[n]();}}
// under attack: slow heavy drums, a heartbeat, a low growling line and uneasy high strings
function defBeat(){
  const s=AU.step++%16,bar=(AU.step>>4)%8,bass=[73.42,73.42,69.3,73.42,77.78,73.42,69.3,61.74][bar];
  if(s===0||s===3||s===8||s===11){tone(66,.34,'sine',.34,.38);noise(.12,.16,420,60);}
  if(s===6||s===14){tone(52,.5,'sine',.3,.5);noise(.3,.12,900,90);}
  if(s%4===2)noise(.14,.07,7000,2500);
  if(s%4===0)tone(bass,.8,'sawtooth',.06);
  if(s===0){tone(bass/2,3.2,'sine',.11);tone(bass*4,3.3,'sawtooth',.016);tone(bass*4*1.06,3.3,'sawtooth',.016);}
  if(s%2===1&&bar%2===1)tone(bass*8*(s%4===1?1:1.06),.12,'triangle',.022);
  if(s===12)tone([233.08,220,207.65,220][bar%4],.9,'square',.03,.9);
}
// on the offensive: a fast gallop, bright snare and a rising heroic brass call
function atkBeat(){
  const s=AU.step++%16,bar=(AU.step>>4)%8,root=[110,110,130.81,146.83,110,110,164.81,146.83][bar];
  if(s%4===0){tone(84,.2,'sine',.3,.45);noise(.07,.12,600,90);}
  if(s%4===2||s===15){noise(.12,.14,8000,1800);tone(190,.08,'triangle',.06,.7);}
  if(s%4!==1)tone(root,.17,'sawtooth',.055);
  if(s%2===0)noise(.04,.035,9000,5000);
  if(s===0){tone(root*2,1.5,'sawtooth',.035);tone(root*3,1.5,'sawtooth',.026);tone(root/2,1.6,'sine',.08);}
  const mel=[0,-1,7,-1,12,-1,14,12,-1,7,-1,12,15,-1,14,-1][s];if(mel>=0&&bar%2===0)tone(root*2*Math.pow(2,mel/12),.26,'square',.036);
  if(bar%2===1&&(s===0||s===6||s===12))tone(root*4*[1,1.189,1.498][s/6|0],.5,'triangle',.05);
}
function musicTick(){
  if(!AU.ctx||!UI.prof.music||document.hidden||AU.ctx.state!=='running')return;AU.dst=AU.mus;AU.t2=!AU.t2;
  if(UI.war&&G&&!G.o.demo){UI.war==='def'?defBeat():atkBeat();AU.dst=AU.fx;return;}
  if(AU.t2){AU.dst=AU.fx;return;}
  const sc=[146.83,155.56,185,196,220,233.08,261.63,293.66,311.13,370,392];
  if(AU.step++%8===0)for(const f of[73.42,110])tone(f,3.8,'sine',.045);
  if(Math.random()<.6){AU.deg=clamp(AU.deg+((Math.random()*5)|0)-2,0,sc.length-1);tone(sc[AU.deg],1,'triangle',.055);tone(sc[AU.deg]*2,.5,'sine',.014);}
  AU.dst=AU.fx;
}

// ── screens ──
function show(name){if(name)radClose();
  UI.screen=name;for(const s of document.querySelectorAll('.screen'))s.hidden=s.id!==name;
  $('#hud').hidden=!(G&&!G.o.demo&&(!name||name==='pause'));
}
function loading(on){const l=$('#load');l.hidden=!on;l.firstChild.textContent=t('loading');}
const mtabs=cur=>`<div class="mtabs">${[['menu','tMenu'],['pass','bp'],['skins','tSkins']].map(([k,l])=>`<button class="${cur===k?'on':''}" data-a="${k}">${k==='pass'?'🎖️ ':k==='skins'?'🎨 ':'🏠 '}${t(l)}</button>`).join('')}</div><div class="mtsp"></div>`;
function renderMenu(){
  const p=UI.prof,rk=rankOf(p);
  $('#menu').innerHTML=`${mtabs('menu')}<div class="logo"><div class="l1">${t('title')}</div><div class="l2">${t('sub')}</div><div class="l3">${t('tag')}</div></div>
  <div class="mb"><button class="btn big" data-a="quick">${t('quick')}</button><div class="m2"><button class="btn" data-a="custom">${t('custom')}</button><button class="btn" data-a="online">${t('online')}</button></div><div class="m2"><button class="btn" data-a="daily">${t('daily')}</button><button class="btn" data-a="board">${t('lb')}</button></div><button class="btn supb" data-a="supMenu">💜 ${t('supMenu')}</button>${UI.admin?`<button class="btn admb" data-a="admin">${UI.owner?'👑 '+t('owner'):'🛠️ '+t('admin')}</button>`:''}<div class="m3"><button class="btn" data-a="how">${t('how')}</button><button class="btn" data-a="settings">${t('settings')}</button><button class="btn" data-a="suggest">${t('suggest')}</button></div><div class="m2 m4"><button class="btn acc" data-a="account">${t('account')}</button><button class="btn news" data-a="news">${t('news')}</button></div></div>
  <div class="mf"><span class="rk">${hasBadge(p)?BADGE:''}${t('rank')}: <b>${t('ranks')[rk]}</b> · ${p.wins} ${t('wins')}</span><span class="made">${t('made')}</span><span class="made beta">${t('beta')}</span></div>`;
}
// small preview of each world shape, generated once from a fixed seed
const THUMB={};
function worldThumb(k){
  if(THUMB[k])return THUMB[k];const M=genMap({w:200,h:125,seed:4242,type:k}),c=mk(200,125),x=c.getContext('2d'),im=x.createImageData(200,125),d=new Uint32Array(im.data.buffer);
  const C=[0xff6e3a10,0xff9c6f2a,0xff54a07c,0xff427646,0xff88c6de,0xff648c94,0xff72787e,0xffeee8e2];
  for(let i=0;i<M.N;i++)d[i]=C[M.ter[i]];x.putImageData(im,0,0);return THUMB[k]=c.toDataURL();
}
// a small scene drawn at each graphics level: coarser and plainer on Low, glow and shadows on Medium, sharpest with railway sleepers on High
const GFXP={};
function gfxPreview(lv){
  if(GFXP[lv])return GFXP[lv];const W=240,H=130,sc=[.4,.7,1][lv],w=Math.round(W*sc),h=Math.round(H*sc),M=genMap({w:96,h:52,seed:777,type:'pangaea'});
  const src=mk(96,52),sx=src.getContext('2d'),im=sx.createImageData(96,52),d=new Uint32Array(im.data.buffer),C=[0xff6e3a10,0xff9c6f2a,0xff54a07c,0xff427646,0xff88c6de,0xff648c94,0xff72787e,0xffeee8e2];
  for(let i=0;i<M.N;i++)d[i]=C[M.ter[i]];sx.putImageData(im,0,0);
  const lo=mk(w,h),x=lo.getContext('2d');x.imageSmoothingEnabled=lv>0;x.drawImage(src,0,0,w,h);x.scale(sc,sc);
  // a stretch of railway, a city and a fort with its range
  x.strokeStyle='rgba(30,22,18,.6)';x.lineWidth=4;x.beginPath();x.moveTo(30,100);x.lineTo(120,70);x.lineTo(200,84);x.stroke();x.strokeStyle='#8a7a66';x.lineWidth=2.2;x.stroke();
  if(lv===2){x.strokeStyle='rgba(30,22,18,.75)';x.lineWidth=1.2;for(let t=0;t<1;t+=.08){const px=30+90*t,py=100-30*t;x.beginPath();x.moveTo(px-2,py-5);x.lineTo(px+2,py+5);x.stroke();}for(let t=0;t<1;t+=.1){const px=120+80*t,py=70+14*t;x.beginPath();x.moveTo(px-1,py-5);x.lineTo(px+1,py+5);x.stroke();}}
  x.fillStyle='rgba(255,233,168,.12)';x.strokeStyle='rgba(255,233,168,.6)';x.lineWidth=1.5;x.beginPath();x.arc(170,52,30,0,7);x.fill();x.stroke();
  for(const [px,py,r,k,cap] of[[120,70,15,'cap',1],[170,52,11,'fort',0]]){x.save();if(lv>0){x.shadowColor=cap?'rgba(255,210,120,.9)':'rgba(0,0,0,.6)';x.shadowBlur=cap?16:8;}
    x.fillStyle='#e0a03a';x.beginPath();x.arc(px,py,r,0,7);x.fill();x.restore();x.lineWidth=2;x.strokeStyle=cap?'#ffe9a8':'rgba(6,12,20,.9)';x.beginPath();x.arc(px,py,r,0,7);x.stroke();const q=r*1.5;x.drawImage(R.glyph[k],px-q/2,py-q/2,q,q);}
  const out=mk(W,H),o=out.getContext('2d');o.imageSmoothingEnabled=false;o.drawImage(lo,0,0,W,H);return GFXP[lv]=out.toDataURL();
}
function tribesN(){const v=UI.prof.tribes|0;return v>=30&&v<=120?v:60;}
function maxP(){const v=UI.prof.maxP|0;return v>=2&&v<=32?v:16;}
function renderSetup(){
  const p=UI.prof;if(p.size<0)p.size=UI.mob?0:1;if(!p.botsN)p.botsN=UI.mob?10:14;
  const chips=(key,arr,cur)=>arr.map((s,i)=>`<button class="chip${i===cur?' on':''}" data-a="set:${key}:${i}">${s}</button>`).join('');
  const host=UI.setupMode==='host'||(NET.on&&NET.host);
  $('#setup').innerHTML=`<h2>${t(host?'hostRoom':'custom')}</h2>
  <div class="opts">${host?`<label class="fld"><h3>${t('roomName')}</h3><input id="inRoom" maxlength="24" value="${esc(p.room||'')}" placeholder="${esc(t('roomOf',p.name||t('defName')))}" autocomplete="off"></label>`:''}<div><h3>${t('world')}</h3><div class="wts">${Object.keys(t('types')).map(k=>`<button class="wt${p.type===k?' on':''}" data-a="type:${k}"><img src="${worldThumb(k)}" alt=""><span>${t('types')[k]}</span></button>`).join('')}</div></div>
  <div><h3>${t('size')}</h3><div class="chips">${chips('size',t('sizes'),p.size)}</div></div>
  <div><h3>${t('foes')}</h3><div class="rng"><input type="range" id="inBots" min="6" max="30" step="1" value="${p.botsN}" aria-label="${t('foes')}"><b id="botsV">${p.botsN}</b></div></div>
  <div><h3>${t('tribes')}</h3><div class="rng"><input type="range" id="inTribes" min="30" max="120" step="5" value="${tribesN()}" aria-label="${t('tribes')}"><b id="tribesV">${tribesN()}</b></div></div>
  <div><h3>${t('diff')}</h3><div class="chips">${chips('diff',t('diffs'),p.diff)}</div></div>${host?'':`<div class="cheats"><h3>🧪 ${t('cheats')}</h3><div class="chips">${CHEATS.map(k=>`<button class="chip${(p.cheat||{})[k]?' on':''}" data-a="cheat:${k}">${t('ch_'+k)}</button>`).join('')}</div><p class="keys">${t('cheatNote')}</p></div>`}</div>
  ${host?`<div class="opts" style="grid-template-columns:minmax(0,1fr)"><div><h3>${t('maxP')}</h3><div class="rng"><input type="range" id="inMaxP" min="2" max="32" step="1" value="${maxP()}" aria-label="${t('maxP')}"><b id="maxPV">${maxP()}</b></div></div></div>`:''}
  ${host?`<div class="chips"><span class="rk">${t('roomType')}:</span><button class="chip${p.pub!==false?' on':''}" data-a="pub:1">${t('pubRoom')}</button><button class="chip${p.pub===false?' on':''}" data-a="pub:0">${t('privRoom')}</button></div>`:''}
  ${NET.on&&NET.host?`<div class="row"><button class="btn" data-a="lobbyBack">${t('lobby')} (${NET.players.length})</button><button class="btn big" data-a="netStart">${t('startNet')}</button></div>`:`${host?`<div class="row"><button class="btn" data-a="online">${t('back')}</button><button class="btn big" data-a="hostRoom">${t('hostRoom')}</button></div>`:`<div class="row"><button class="btn" data-a="menu">${t('back')}</button><button class="btn big" data-a="go">${t('start')}</button></div>`}`}`;
}
function renderHelp(){
  $('#help').innerHTML=`<h2>${t('how')}</h2><div class="hl">${t('help').map(h=>`<div><b>${h[0]}</b><p>${h[1]}</p></div>`).join('')}</div><p class="keys">${t('keys')}</p><div class="row"><button class="btn big" data-a="helpBack">${t('back')}</button></div>`;
}
const dayKey=()=>{const d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();};
function renderDaily(){
  const key=dayKey(),ty=Object.keys(TX.ar.types)[key%9],b=UI.prof.daily[key];
  $('#help').innerHTML=`<h2>${t('daily')}</h2><div class="wt on" style="width:min(300px,100%)"><img src="${worldThumb(ty)}" alt=""><span>${t('dWorld')}: ${t('types')[ty]}</span></div><p class="dxp">⭐ ${t('dXp')}</p>
  <div class="hl" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">${t('dInfo').map(h=>`<div><b>${h[0]}</b><p>${h[1]}</p></div>`).join('')}</div>
  <p class="best">${b?t('best',clock(b)):t('dNone')}</p>${UI.prof.dailyDone===key?`<p class="dlock">🔒 ${t('dDone')}</p>`:''}<div class="row"><button class="btn" data-a="menu">${t('back')}</button>${UI.prof.dailyDone===key?'':`<button class="btn big" data-a="dailyGo">${t('dGo')}</button>`}</div>`;
}
// quick battle: more rivals on bigger maps and harder difficulties
const quickBots=p=>clamp([8,12,16,22][p.size<0?1:p.size]+[0,2,4,6][p.diff|0],6,30);
function renderQuick(){
  const p=UI.prof;if(p.size<0)p.size=UI.mob?0:1;
  const chips=(key,arr,cur)=>arr.map((x,i)=>`<button class="chip${i===cur?' on':''}" data-a="set:${key}:${i}">${x}</button>`).join('');
  $('#help').innerHTML=`<h2>${t('quick')}</h2><div class="opts" style="grid-template-columns:minmax(0,1fr);width:min(520px,100%)"><div><h3>${t('size')}</h3><div class="chips">${chips('size',t('sizes'),p.size)}</div></div><div><h3>${t('diff')}</h3><div class="chips">${chips('diff',t('diffs'),p.diff)}</div></div><p class="keys">${t('foes')}: <b>${quickBots(p)}</b></p></div>
  <div class="row"><button class="btn" data-a="menu">${t('back')}</button><button class="btn big" data-a="goQ">${t('start')}</button></div>`;
}
function gfxLv(){const v=UI.prof.gfx;return v==null?(UI.mob?1:2):v;}
function applyGfx(){R.q=gfxLv();try{resize();}catch(e){}}
function renderSettings(){
  const p=UI.prof,vm=p.volM==null?70:p.volM,vs=p.volS==null?70:p.volS;
  $('#help').innerHTML=`<h2>${t('settings')}</h2><div class="opts" style="grid-template-columns:minmax(0,1fr);width:min(460px,100%)">
  <div><h3>${t('volM')}</h3><div class="rng"><input type="range" id="volM" min="0" max="100" step="5" value="${vm}" aria-label="${t('volM')}"><b id="volMv">${vm}</b></div></div>
  <div><h3>${t('volS')}</h3><div class="rng"><input type="range" id="volS" min="0" max="100" step="5" value="${vs}" aria-label="${t('volS')}"><b id="volSv">${vs}</b></div></div>
  <div><h3>${t('langName')}</h3><div class="chips" style="justify-content:flex-start"><button class="chip${UI.lang==='ar'?' on':''}" data-a="lang:ar">العربية</button><button class="chip${UI.lang==='en'?' on':''}" data-a="lang:en">English</button></div></div>
  <div><h3>${t('gfx')}</h3><div class="chips" style="justify-content:flex-start">${t('gfxs').map((x,i)=>`<button class="chip${gfxLv()===i?' on':''}" data-a="gfx:${i}">${x}</button>`).join('')}</div><div class="gfxp">${[0,1,2].map(i=>`<button class="${gfxLv()===i?'on':''}" data-a="gfx:${i}"><img src="${gfxPreview(i)}" alt="${t('gfxs')[i]}"><span>${t('gfxs')[i]}</span></button>`).join('')}</div><div class="gfxd">${t('gfxD')[gfxLv()]}</div></div>
  <div><h3>${t('iface')}</h3><div class="chips" style="justify-content:flex-start">${t('ifs').map((x,i)=>`<button class="chip${p.ui===i?' on':''}" data-a="ifc:${i}">${x}</button>`).join('')}</div></div></div>
  <div class="row"><button class="btn big" data-a="setBack">${t('ok')}</button></div>`;
}
// ── play time and the online leaderboard ──
const hrs=ms=>(ms/3.6e6).toFixed(ms<3.6e7?1:0);
function lbAuth(){
  const f=UI.prof.fb||(UI.prof.fb={});if(f.tok&&f.exp>Date.now()+6e4)return Promise.resolve(f);
  const done=j=>{if(!j||!(j.idToken||j.id_token))throw 0;f.tok=j.idToken||j.id_token;f.rt=j.refreshToken||j.refresh_token||f.rt;f.uid=j.localId||j.user_id||f.uid;f.exp=Date.now()+(+(j.expiresIn||j.expires_in)||3600)*1000;saveProf();return f;};
  if(f.rt)return fetch('https://securetoken.googleapis.com/v1/token?key='+LB_KEY,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=refresh_token&refresh_token='+encodeURIComponent(f.rt)}).then(r=>r.json()).then(done).catch(()=>{f.rt='';return lbAuth();});
  return fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key='+LB_KEY,{method:'POST',headers:{'Content-Type':'application/json'},body:'{"returnSecureToken":true}'}).then(r=>r.json()).then(done);
}
// progress lives in the cloud under the player's id: each device sends only what it added since the last sync (server-side increments),
// so playing on a phone and a PC never overwrites one with the other
const SK={wins:'w',games:'g',xp:'xp',ms:'ms'};
function addStat(k,v){const p=UI.prof;p[k]=(p[k]||0)+v;const d=p.pend||(p.pend={});d[k]=(d[k]||0)+v;}
// never from automated test browsers or the local test mode, so tests cannot leave rows on the real leaderboard
const cloudOn=()=>!!(LB_DB&&LB_KEY&&/^https?:/.test(location.protocol)&&!navigator.webdriver&&!/[?&]bc=1/.test(location.search));
function cloudSync(){
  const p=UI.prof;if(!cloudOn())return Promise.resolve();if(UI.syncing)return UI.syncing;
  if(!p.cloudInit){p.cloudInit=1;p.pend={wins:p.wins|0,games:p.games|0,xp:p.xp|0,ms:Math.round(p.ms||0)};saveProf();}
  if(!p.games&&!(p.fb&&p.fb.user))return Promise.resolve();
  const sent=Object.assign({},p.pend||{});let uid;
  return UI.syncing=lbAuth().then(f=>{uid=f.uid;const body={n:(p.name||t('defName')).slice(0,18),t:{'.sv':'timestamp'}};for(const k in SK){const v=Math.round(sent[k]||0);if(v)body[SK[k]]={'.sv':{increment:v}};}
    const flat=()=>fetch(LB_DB+'/lb/'+uid+'.json?auth='+f.tok,{method:'PUT',body:JSON.stringify({n:body.n,w:p.wins|0,h:Math.round(p.ms||0),g:p.games|0,b:hasBadge(p)?1:0,t:{'.sv':'timestamp'}})});
    return fetch(LB_DB+'/users/'+uid+'.json?auth='+f.tok,{method:'PATCH',body:JSON.stringify(body)}).then(r=>{if(!r.ok){UI.noUsers=1;return null;}return fetch(LB_DB+'/users/'+uid+'.json?auth='+f.tok).then(r=>r.json());}).then(u=>{
      if(UI.noUsers&&!u)return flat();
      if(!u||(p.fb||{}).uid!==uid)return;const d=p.pend||{};for(const k in SK){d[k]=(d[k]||0)-(sent[k]||0);if(Math.abs(d[k])<1)d[k]=0;p[k]=(u[SK[k]]||0)+d[k];}
      fetch(LB_DB+'/grants/'+uid+'.json?auth='+f.tok).then(r=>r.ok?r.json():null).then(gr=>{if(gr&&(p.passT==null?-1:p.passT)<PASS.length){p.passT=PASS.length;p.supporter=1;saveProf();toast(t('supOn'),'prop',6000);fetch(LB_DB+'/users/'+uid+'.json?auth='+f.tok,{method:'PATCH',body:JSON.stringify({pt:PASS.length})}).catch(()=>{});}}).catch(()=>{});
      const cpt=u.pt!=null?u.pt|0:-1;if(cpt>(p.passT==null?-1:p.passT))p.passT=cpt;saveProf();
      if((p.passT==null?-1:p.passT)>cpt)fetch(LB_DB+'/users/'+uid+'.json?auth='+f.tok,{method:'PATCH',body:JSON.stringify({pt:p.passT})}).catch(()=>{});
      return fetch(LB_DB+'/lb/'+uid+'.json?auth='+f.tok,{method:'PUT',body:JSON.stringify({n:body.n,w:u.w|0,h:Math.round(u.ms||0),g:u.g|0,b:hasBadge(p)?1:0,t:{'.sv':'timestamp'}})});});})
    .then(()=>{UI.lbPushed=Date.now();if(UI.screen==='menu')renderMenu();}).catch(()=>{}).then(()=>{UI.syncing=null;});
}
const lbPush=cloudSync;
// real accounts: a username and password (Firebase email/password under the hood) carry the same progress to every device
const accMail=u=>u.toLowerCase()+'@players.sijal.game';
function accErr(j){const m=(j&&j.error&&j.error.message)||'';return /EMAIL_EXISTS/.test(m)?'taken':/WEAK_PASSWORD/.test(m)?'weak':/TOO_MANY/.test(m)?'many':/OPERATION_NOT_ALLOWED|ADMIN_ONLY/.test(m)?'off':/INVALID|NOT_FOUND|PASSWORD/.test(m)?'bad':'net';}
function accForm(){const u=($('#inUser')||{}).value||'',pw=($('#inPass')||{}).value||'';if(!/^[A-Za-z0-9_]{3,16}$/.test(u.trim()))return null;if(pw.length<6)return'pw';return{u:u.trim(),pw};}
function accDone(code){UI.accMsg=code;loading(false);renderAccount();}
const AUTH='https://identitytoolkit.googleapis.com/v1/accounts:';
function accReq(kind,F){return fetch(AUTH+kind+'?key='+LB_KEY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:accMail(F.u),password:F.pw,returnSecureToken:true})}).then(r=>r.json());}
// entering an account: a guest's progress on this device moves into it, and the guest's own entries are removed so nobody shows up twice
function accEnter(j,F,okMsg){
  const p=UI.prof,old=p.fb||{};if(j.localId===old.uid){old.user=F.u;saveProf();return accDone(okMsg);}
  const guest=!old.user&&old.uid?{wins:p.wins|0,games:p.games|0,xp:p.xp|0,ms:Math.round(p.ms||0)}:null,gTok=old.tok,gUid=old.uid;
  const drop=guest&&gTok?Promise.all(['lb','users'].map(k=>fetch(LB_DB+'/'+k+'/'+gUid+'.json?auth='+gTok,{method:'DELETE'}).catch(()=>{}))):Promise.resolve();
  return drop.then(()=>fetch(LB_DB+'/users/'+j.localId+'.json?auth='+j.idToken)).then(r=>r.json()).then(u=>{
    p.fb={tok:j.idToken,rt:j.refreshToken,uid:j.localId,exp:Date.now()+(+j.expiresIn||3600)*1000,user:F.u};p.cloudInit=1;setTimeout(adminCheck,500);
    const gpt=p.passT==null?-1:p.passT;p.passT=Math.max(guest?gpt:-1,u&&u.pt!=null?u.pt|0:-1);
    for(const k in SK)p[k]=(u&&u[SK[k]])||0;if(u&&u.n)p.name=u.n;p.pend=guest||{};for(const k in SK)p[k]+=(p.pend[k]||0);saveProf();return cloudSync().then(()=>{accDone(okMsg);renderMenu();});});
}
function accRegister(){
  const F=accForm();if(!F)return accDone('user');if(F==='pw')return accDone('weak');if(!cloudOn())return accDone('net');loading(true);
  lbAuth().catch(()=>{}).then(()=>cloudSync()).then(()=>accReq('signUp',F)).then(j=>j.idToken?accEnter(j,F,'made'):accDone(accErr(j))).catch(()=>accDone('net'));
}
function accLogin(){
  const F=accForm();if(!F)return accDone('user');if(F==='pw')return accDone('bad');if(!cloudOn())return accDone('net');loading(true);
  accReq('signInWithPassword',F).then(j=>j.idToken?accEnter(j,F,'in'):accDone(accErr(j))).catch(()=>accDone('net'));
}
function accLogout(){const p=UI.prof;cloudSync().then(()=>{p.fb={};p.pend={};p.cloudInit=1;p.wins=p.games=p.xp=p.ms=0;p.passT=-1;p.name='';saveProf();UI.accMsg='out';renderAccount();renderMenu();});}
function renderLB(){
  const s=UI.lbSort||'w',p=UI.prof,me=(p.fb||{}).uid;
  const head=`<h2 class="lbh">${t('lb')}</h2><div class="row chips"><button class="chip${s==='w'?' on':''}" data-a="lbS:w">${t('lbByW')}</button><button class="chip${s==='h'?' on':''}" data-a="lbS:h">${t('lbByH')}</button></div>`,back=`<div class="row"><button class="btn big" data-a="menu">${t('back')}</button></div>`;
  if(!cloudOn()){$('#help').innerHTML=head+`<p class="keys">${t('lbOff')}</p>`+back;return;}
  const rows=UI.lbRows;
  $('#help').innerHTML=head+(rows==null?`<p class="keys">${t('lbLoad')}</p>`:rows==='err'?`<p class="bad">${t('lbErr')}</p>`:
    `<div class="lbt"><div class="lh"><span>#</span><span>${t('lbName')}</span><span>${t('rank')}</span><span>${t('wins')}</span><span>${t('lbHrs')}</span></div>`+
    rows.map((r,i)=>`<div class="${r.id===me?'me':''}"><span>${i+1}</span><span>${r.b?BADGE:''}${esc(r.n||'')}</span><span>${t('ranks')[rankOf({wins:r.w})]}</span><span>${r.w|0}</span><span>${hrs(r.h||0)}</span></div>`).join('')+'</div>'+(rows.length?'':`<p class="keys">${t('lbNone')}</p>`))+
    `<p class="keys">${t('lbYou',p.wins,hrs(p.ms||0))}</p>`+back;
}
function openLB(){
  UI.lbRows=null;renderLB();show('help');if(!cloudOn())return;const s=UI.lbSort||'w';
  lbPush().then(()=>fetch(LB_DB+'/lb.json?orderBy=%22'+s+'%22&limitToLast=100')).then(r=>{if(!r.ok)throw 0;return r.json();}).then(j=>{
    const a=Object.entries(j||{}).map(([id,v])=>Object.assign({id},v)).filter(r=>r&&typeof r.n==='string'&&(r.g|0)>0);a.sort((x,y)=>(y[s]||0)-(x[s]||0)||(y[s==='w'?'h':'w']||0)-(x[s==='w'?'h':'w']||0));
    if((UI.lbSort||'w')===s){UI.lbRows=a;if($('#help .lbh'))renderLB();}}).catch(()=>{UI.lbRows='err';if($('#help .lbh'))renderLB();});
}
function renderRanks(){
  const p=UI.prof,rk=rankOf(p),R=t('ranks');
  $('#help').innerHTML=`<h2>${t('allRanks')}</h2><div class="rks">${R.map((n,i)=>`<div class="${i===rk?'cur':i<rk?'done':''}"><b>${n}</b><span>${i===0?'0':i===21?'501+':((i-1)*25+1)+' – '+i*25}</span></div>`).join('')}</div><p class="keys">${t('ranksNote')}</p><div class="row"><button class="btn big" data-a="account">${t('back')}</button></div>`;
}
function renderSuggest(done){
  $('#help').innerHTML=`<h2>${t('suggest')}</h2>`+(done?`<p class="best">${t('sgDone')}</p><div class="row"><button class="btn big" data-a="menu">${t('ok')}</button></div>`:
  `<p class="keys">${t('sgNote')}</p><div class="opts" style="grid-template-columns:minmax(0,1fr);width:min(560px,100%)"><label class="fld"><h3>${t('sgText')}</h3><textarea id="sgMsg" maxlength="1000" rows="6" placeholder="${t('sgPh')}"></textarea></label></div>
  <div class="row"><button class="btn" data-a="menu">${t('back')}</button><button class="btn big" data-a="sgSend">${t('sgSend')}</button></div>`);
}
function sendSuggest(){
  const el=$('#sgMsg'),msg=(el&&el.value||'').trim(),p=UI.prof;if(msg.length<3)return err('sgShort');if(!/^https?:/.test(location.protocol))return err('sgSite');
  if(!/netlify\.app$/.test(location.hostname)){if(!SUGGEST_KEY)return err('sgOff');loading(true);
    return fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({access_key:SUGGEST_KEY,subject:'Sijal suggestion',from_name:p.name||t('defName'),rank:t('ranks')[rankOf(p)]+' ('+p.wins+')',message:msg})}).then(r=>r.json()).then(j=>{loading(false);if(j&&j.success)renderSuggest(true);else err('sgFail');}).catch(()=>{loading(false);err('sgFail');});}
  const body=new URLSearchParams({'form-name':'suggestions',name:p.name||t('defName'),rank:t('ranks')[rankOf(p)]+' ('+p.wins+')',message:msg,'bot-field':''}).toString();loading(true);
  fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body}).then(r=>{loading(false);if(r.ok)renderSuggest(true);else err('sgFail');}).catch(()=>{loading(false);err('sgFail');});
}
// the attack-type picker can be dragged anywhere while it is collapsed; its spot is remembered
function placeAmode(){
  const e=$('#amode'),h=$('#hud'),P=UI.prof.amPos;if(!e||!h)return;if(!P){e.removeAttribute('style');return;}if(!h.clientWidth||!e.offsetWidth)return setTimeout(placeAmode,60);
  const W=h.clientWidth,H=h.clientHeight,w=e.offsetWidth,ht=e.offsetHeight;
  Object.assign(e.style,{left:clamp(P.x*W,8,Math.max(8,W-w-8))+'px',top:clamp(P.y*H,8,Math.max(8,H-ht-8))+'px',right:'auto',bottom:'auto',transform:'none'});
}
function bindAmode(e){
  if(e.dataset.bound)return;e.dataset.bound=1;let st=null;
  const move=ev=>{if(!st||ev.pointerId!==st.id)return;const dx=ev.clientX-st.x,dy=ev.clientY-st.y;if(!st.moved&&Math.hypot(dx,dy)<6)return;st.moved=true;
    const h=$('#hud');UI.prof.amPos={x:(st.ox+dx)/h.clientWidth,y:(st.oy+dy)/h.clientHeight};placeAmode();ev.preventDefault();};
  const end=ev=>{if(!st||ev.pointerId!==st.id)return;if(st.moved){UI.amDrag=true;setTimeout(()=>{UI.amDrag=false;},350);saveProf();}st=null;
    removeEventListener('pointermove',move);removeEventListener('pointerup',end);removeEventListener('pointercancel',end);};
  e.addEventListener('pointerdown',ev=>{if(!UI.prof.amHide)return;const r=e.getBoundingClientRect(),h=$('#hud').getBoundingClientRect();st={x:ev.clientX,y:ev.clientY,ox:r.left-h.left,oy:r.top-h.top,moved:false,id:ev.pointerId};
    addEventListener('pointermove',move,{passive:false});addEventListener('pointerup',end);addEventListener('pointercancel',end);});
}
function renderAmode(){
  const e=$('#amode'),p=UI.prof,m=p.amode||'pt';if(!e)return;bindAmode(e);e.classList.toggle('mini',!!p.amHide);
  e.innerHTML=`<button class="amh" data-a="amT" aria-expanded="${!p.amHide}">${t('amode')} ${p.amHide?'▸':'▾'}</button>`+(p.amHide?'':`<button class="chip${m==='pt'?' on':''}" data-a="am:pt">${t('am_pt')}</button><button class="chip${m==='all'?' on':''}" data-a="am:all">${t('am_all')}</button>`);
  placeAmode();
}
function accPanel(){
  const p=UI.prof,f=p.fb||{},m=UI.accMsg?`<p class="${/made|in|out/.test(UI.accMsg)?'good':'bad'}">${t('acm_'+UI.accMsg)}</p>`:'';
  if(!cloudOn())return`<p class="keys">${t('accNote')}</p>`;
  if(f.user)return`<div class="accb"><p>${t('ac_signed',`<b dir="ltr">${esc(f.user)}</b>`)}</p><p class="keys">${t('ac_signedNote')}</p>${m}<button class="btn sm" data-a="accOut">${t('ac_out')}</button></div>`;
  return`<div class="accb"><h3>${t('ac_title')}</h3><p class="keys">${t('ac_note')}</p><div class="accf"><input id="inUser" dir="ltr" maxlength="16" placeholder="${t('ac_user')}" autocomplete="username" autocapitalize="none" spellcheck="false"><input id="inPass" dir="ltr" type="password" maxlength="64" placeholder="${t('ac_pass')}" autocomplete="current-password"></div>${m}<div class="row"><button class="btn ok" data-a="accReg">${t('ac_reg')}</button><button class="btn" data-a="accIn">${t('ac_in')}</button></div></div>`;
}
function renderAccount(){
  const p=UI.prof,rk=rankOf(p);
  $('#help').innerHTML=`<h2>${t('account')}</h2><div class="opts" style="grid-template-columns:minmax(0,1fr);width:min(420px,100%)"><label class="fld"><h3>${t('accName')}</h3><input id="inName" maxlength="18" value="${esc(p.name)}" placeholder="${t('defName')}" autocomplete="off"></label><div class="row namer"><button class="btn sm" id="nameUndo" data-a="nameUndo" disabled>${t('nameUndo')}</button><button class="btn sm ok" id="nameSave" data-a="nameSave" disabled>${t('nameSave')}</button></div><p class="good" id="nameMsg"></p></div>
  <div class="stats" style="width:min(420px,100%);grid-template-columns:repeat(5,minmax(0,1fr))">${[[t('rank'),t('ranks')[rk]],[t('x_xp'),p.xp],[t('accGames'),p.games],[t('wins'),p.wins],[t('lbHrs'),hrs(p.ms||0)]].map(x=>`<div><small>${x[0]}</small><b>${x[1]}</b></div>`).join('')}</div>
  <p class="keys">${rk<21?t('accNext',rk*25+1-p.wins,t('ranks')[rk+1]):''}</p>${accPanel()}<div class="row"><button class="btn" data-a="ranks">${t('allRanks')}</button><button class="btn big" data-a="menu">${t('back')}</button></div>`;
}
function renderNews(latest){
  const L=(latest?LOG.slice(0,1):LOG.slice(0,10));
  $('#help').innerHTML=`<h2>${t(latest?'newsNew':'news')}</h2><div class="nl">${L.map(e=>`<div><b>${t('ver')} ${e.v}</b><small dir="ltr">${e.d}</small><ul>${(e[UI.lang]||e.ar).map(x=>`<li>${x}</li>`).join('')}</ul></div>`).join('')}</div><div class="row"><button class="btn big" data-a="menu">${t('ok')}</button></div>`;
}
function renderFac(){
  const e=$('#fpick'),p=UI.prof;if(!e)return;e.hidden=UI.phase!=='spawn';if(e.hidden)return;
  e.innerHTML=`<h4>${t('faction')}</h4><div class="chips">${FKEYS.map(f=>`<button class="chip${p.fac===f?' on':''}" data-a="fac:${f}"><i style="background:rgb(${FAC[f].c})"></i>${t('f_'+f)}</button>`).join('')}</div><small>${t('fp_'+p.fac)} · ${t('fu_'+p.fac)}: ${t('fd_'+p.fac)}</small>`;
}
function renderPause(){
  const p=UI.prof;$('#pause').innerHTML=`<h2>${t('paused')}</h2><div class="mb"><button class="btn big" data-a="resume">${t('resume')}</button><button class="btn" data-a="settings">${t('settings')}</button><button class="btn" data-a="how">${t('how')}</button>
  <button class="btn" data-a="toMenu">${t('quit')}</button></div>${NET.on&&NET.host&&NET.started?hostPanel():''}${UI.admin&&G&&!G.o.mp&&!G.o.demo?adminGame():''}`;
}
function hostPanel(){const g=G;return`<div class="hp"><h3>👥 ${t('inGame')}</h3>${NET.players.map((pl,i)=>{const n=g&&g.nations[i+1];return`<div class="hpr"><i style="background:${n?n.css:'#888'}"></i><b>${pl.badge?BADGE:''}${esc(pl.name)}</b><small>${i===0?t('hostTag'):pl.kicked?t('wasKicked'):!pl.in?t('left'):n&&!n.alive?t('out'):''}</small>${i>0&&pl.in?`<button class="btn sm warn" data-a="kick:${i}">${t('kick')}</button>`:''}</div>`;}).join('')}</div>`;}
function adminGame(){const C=(G.o.cheats||{});return`<div class="hp adm"><h3>🛠️ ${t('admGame')}</h3><div class="chips"><button class="chip" data-a="adm:gold">+100K 💰</button><button class="chip" data-a="adm:troops">+100K ⚔️</button><button class="chip" data-a="adm:era">🏛️ ${t('admEra')}</button><button class="chip${C.build?' on':''}" data-a="adm:build">🏗️ ${t('ch_build')}</button><button class="chip${C.msl?' on':''}" data-a="adm:msl">🚀 ${t('admMsl')}</button><button class="chip" data-a="adm:win">👑 ${t('admWin')}</button></div><p class="keys">${t('admNote')}</p></div>`;}

// ── match lifecycle ──
function prep(g){
  for(const n of g.nations)if(n){n.me=n.id===g.human;natPix(n);}buildTerrain(g);acc=0;UI.rows=new Map();UI.chips=new Map();UI.anx=new Map();UI.hintI=0;UI.hintShown=false;UI.sel=0;UI.mode=null;
  lookAt(g.W/2,g.H/2,fitZoom(g)*(g.o.demo?1.5:1),true);
}
function startDemo(){G=newGame({w:200,h:128,seed:(Math.random()*2**31)|0,type:'continents',bots:9,diff:1,demo:true});prep(G);startGame(G);}
// ── battle pass ──
// experience is spent on the season: 10,000 opens it, then each tier takes 1,000, claimed automatically as soon as you have it
const passTier=p=>UI.owner?PASS.length:p.passT>0?Math.min(PASS.length,p.passT):0;
// buying is the player's choice: open the season for 10,000, then claim each tier in order for 1,000
function passBuy(){
  const p=UI.prof;if(p.passT==null)p.passT=-1;const on=p.passT>=0,cost=on?PASS_STEP:PASS_AT;
  if(on&&p.passT>=PASS.length)return;if((p.xp|0)<cost){sfx('err');toast(t('bpNeed',fmt(cost-(p.xp|0))),'bad',2600);return;}
  addStat('xp',-cost);p.passT=on?p.passT+1:0;saveProf();sfx('era');toast(on?t('bpGotTier',p.passT):t('bpOpened'),'prop',3500);cloudSync();
  // redraw without losing where the player had scrolled to
  const h=$('#help'),g0=$('#help .bpg'),hs=h?h.scrollTop:0,gs=g0?g0.scrollTop:0;renderPass();const g1=$('#help .bpg');if(h)h.scrollTop=hs;if(g1)g1.scrollTop=gs;
}
const canBuy=p=>{const n=p.passT==null?-1:p.passT;return n<0?(p.xp|0)>=PASS_AT:n<PASS.length&&(p.xp|0)>=PASS_STEP;};
const owns=(p,t,k)=>{const n=passTier(p);for(let j=0;j<n;j++)if(PASS[j][0]===t&&PASS[j][1]===k)return true;return false;};
const hasPass=p=>UI.owner||(p.passT==null?-1:p.passT)>=0,hasBadge=p=>hasPass(p)&&!p.hideBadge;
const BADGE='<span class="lgb" title="Season 0" aria-label="Season 0"></span>';
function mySkin(){const p=UI.prof,k=p.skin||{};return{pat:k.pat&&owns(p,'pat',k.pat)?k.pat:'',bld:k.bld&&owns(p,'bld',k.bld)?k.bld:'',badge:hasBadge(p)?1:0,pass:hasPass(p)?1:0};}
const SKP={};
function skinPreview(t,k){
  const key=t+k;if(SKP[key])return SKP[key];const c=mk(96,64),x=c.getContext('2d'),col=FAC[UI.prof.fac||'hawks'].c,css=`rgb(${col[0]},${col[1]},${col[2]})`;
  x.fillStyle='#2f5d3a';x.fillRect(0,0,96,64);
  if(t==='pat'){for(let y=0;y<32;y++)for(let X=0;X<48;X++){x.fillStyle=patOn(k,X,y)?`rgba(${Math.round(col[0]+(255-col[0])*.38)},${Math.round(col[1]+(255-col[1])*.38)},${Math.round(col[2]+(255-col[2])*.38)},.9)`:`rgba(${col[0]},${col[1]},${col[2]},.55)`;x.fillRect(X*2,y*2,2,2);}}
  else{x.fillStyle=`rgba(${col[0]},${col[1]},${col[2]},.55)`;x.fillRect(0,0,96,64);const S=BSTY[k];bShape(x,S.sh,48,32,20);if(S.gl){x.save();x.shadowColor=S.gl;x.shadowBlur=16;x.fillStyle=S.f;x.fill();x.restore();}else{x.fillStyle=S.f;x.fill();}x.lineWidth=3;x.strokeStyle=S.s;x.stroke();x.lineWidth=2;x.strokeStyle=css;bShape(x,S.sh,48,32,23);x.stroke();x.drawImage(R.glyph.city,48-15,32-15,30,30);}
  return SKP[key]=c.toDataURL();
}
function renderPass(){
  const p=UI.prof,n=passTier(p),k=p.skin||{},on=hasPass(p),xp=p.xp|0,pc=!on?clamp(xp/PASS_AT*100,0,100):n>=PASS.length?100:clamp(xp/PASS_STEP*100,0,100);
  const head=on?(n>=PASS.length?t('bpDone'):xp>=PASS_STEP?t('bpReady',n+1):t('bpNext',fmt(PASS_STEP-xp),n+1)):xp>=PASS_AT?t('bpCanOpen'):t('bpLock',fmt(PASS_AT-xp));
  const openBtn=on?'':`<button class="btn big bpbuy${xp>=PASS_AT?'':' low'}" data-a="bpBuy">🎖️ ${t('bpOpen')} · ${fmt(PASS_AT)}</button>`;
  $('#help').innerHTML=`${mtabs('pass')}<h2>🎖️ ${t('bp')}</h2><p class="keys">${t('bpNote')}</p><div class="bpbar"><div style="width:${pc}%"></div><span dir="ltr">${on?(n>=PASS.length?t('bpTier',n,PASS.length):fmt(PASS_STEP)+' / '+fmt(xp)):fmt(PASS_AT)+' / '+fmt(xp)}</span></div><p class="keys">${head}</p>${openBtn}${n<PASS.length&&!UI.owner?`<div class="sup"><b>💜 ${t('supT',SUPPORT_SAR)}</b><span>${t('supD')}</span><span>${t('supWho')}</span><button class="btn ok" data-a="supOpen">${t('supBtn',SUPPORT_SAR)}</button></div>`:''}
  <div class="bpg">${PASS.map(([ty,id],j)=>{const got=j<n,eq=k[ty]===id;return`<div class="bpc${got?' got':''}${eq?' eq':''}${on&&j===n?(xp>=PASS_STEP?' can':' cant'):''}"><small>${j+1}</small><img src="${skinPreview(ty,id)}" alt=""><b>${t('sk_'+id)}</b><span>${t(ty==='pat'?'bpPat':'bpBld')}</span>${got?`<em class="ok">✓ ${t('bpGot')}</em>`:on&&j===n?`<button class="btn sm ok" data-a="bpBuy">${t('bpClaim')} · ${fmt(PASS_STEP)}</button>`:`<em>🔒 ${fmt(PASS_STEP)}</em>`}</div>`;}).join('')}</div>
  <div class="row"><button class="btn" data-a="skins">🎨 ${t('tSkins')}</button><button class="btn big" data-a="menu">${t('back')}</button></div>`;
}
// customization: equip what you have unlocked
function renderSkins(){
  const p=UI.prof,k=p.skin||{},n=passTier(p),sec=(ty,lab)=>{const L=PASS.slice(0,n).filter(e=>e[0]===ty);return`<h3>${lab}</h3><div class="bpg free"><div class="bpc got${!k[ty]?' eq':''}"><div class="none">✕</div><b>${t('skNone')}</b><button class="btn sm${!k[ty]?'':' ok'}" data-a="skin:${ty}:">${!k[ty]?'✓ '+t('bpOn'):t('bpWear')}</button></div>${L.map(([,id])=>{const eq=k[ty]===id;return`<div class="bpc got${eq?' eq':''}"><img src="${skinPreview(ty,id)}" alt=""><b>${t('sk_'+id)}</b><button class="btn sm${eq?'':' ok'}" data-a="skin:${ty}:${eq?'':id}">${eq?'✓ '+t('bpOn'):t('bpWear')}</button></div>`;}).join('')}</div>`;};
  const bdg=hasPass(p)?`<h3>${t('bdgT')}</h3><div class="bdgrow"><span class="bdgshow">${BADGE}<b>${esc(p.name||t('defName'))}</b></span><div class="chips"><button class="chip${!p.hideBadge?' on':''}" data-a="badge:1">${t('bdgOn')}</button><button class="chip${p.hideBadge?' on':''}" data-a="badge:0">${t('bdgOff')}</button></div></div><p class="keys">${t('bdgNote')}</p>`:'';
  $('#help').innerHTML=`${mtabs('skins')}<h2>🎨 ${t('tSkins')}</h2>${bdg}${n?`<p class="keys">${t('skNote')}</p>${sec('pat',t('bpPat'))}${sec('bld',t('bpBld'))}`:`<p class="keys">${t('skEmpty')}</p>`}<div class="row"><button class="btn big" data-a="menu">${t('back')}</button></div>`;
}
// ── admins: the root account plus anyone it (or another admin) grants; checked against the database, which enforces it ──
const ADMIN_ROOT='saadsd';
// supporting the developer: 10 riyals by STC Pay unlocks the whole season once the owner confirms it
const STC_PAY='0538053242',SUPPORT_SAR=10;
function adminCheck(){
  const p=UI.prof,f=p.fb||{};if(!cloudOn()||!f.user)return;const was=UI.admin;
  lbAuth().then(f=>{fetch(LB_DB+'/names/'+encodeURIComponent(f.user.toLowerCase())+'.json?auth='+f.tok,{method:'PUT',body:JSON.stringify(f.uid)}).catch(()=>{});
    UI.owner=!!(ADMIN_ROOT&&f.user.toLowerCase()===ADMIN_ROOT);if(UI.owner)return true;return fetch(LB_DB+'/admins/'+f.uid+'.json?auth='+f.tok).then(r=>r.ok?r.json():null).then(v=>!!v);})
  .then(a=>{UI.admin=!!a;if(UI.admin!==!!was)renderMenu();if(UI.owner&&UI.screen==='help'&&$('#help .bpg'))renderPass();}).catch(()=>{});
}
function admReq(path,o){return lbAuth().then(f=>fetch(LB_DB+path+(path.includes('?')?'&':'?')+'auth='+f.tok,o||{}).then(r=>{if(!r.ok)throw 0;return r.json();}));}
function openAdmin(){if(!UI.admin)return;UI.admLb=null;UI.admList=null;renderAdmin();show('help');
  admReq('/admins.json').then(j=>{UI.admList=j||{};renderAdmin();}).catch(()=>{UI.admList='err';renderAdmin();});
  fetch(LB_DB+'/lb.json').then(r=>r.json()).then(j=>{UI.admLb=Object.entries(j||{}).map(([id,v])=>Object.assign({id},v)).sort((a,b)=>(b.w|0)-(a.w|0));renderAdmin();}).catch(()=>{});}
function renderAdmin(){
  const L=UI.admList,B=UI.admLb,p=UI.prof;
  $('#help').innerHTML=`<h2>${UI.owner?'👑 '+t('owner'):'🛠️ '+t('admin')}</h2>
  <div class="hp"><h3>${t('admAdmins')}</h3>${UI.owner?`<div class="row"><input id="admUser" dir="ltr" placeholder="${t('ac_user')}" autocomplete="off" autocapitalize="none"><button class="btn sm ok" data-a="admGive">${t('admGive')}</button></div>`:''}
  ${L==null?`<p class="keys">${t('lbLoad')}</p>`:L==='err'?`<p class="bad">${t('admRules')}</p>`:Object.entries(L).map(([uid,n])=>`<div class="hpr"><b dir="ltr">${esc(typeof n==='string'?n:uid.slice(0,8))}</b>${uid===(p.fb||{}).uid?`<small>${t('you')}</small>`:UI.owner?`<button class="btn sm warn" data-a="admDel:${esc(uid)}">${t('admRemove')}</button>`:''}</div>`).join('')||`<p class="keys">${t('admNone')}</p>`}</div>
  ${UI.owner?`<div class="hp"><h3>💜 ${t('supAdm')}</h3><div class="row"><input id="grUser" dir="ltr" placeholder="${t('ac_user')}" autocomplete="off" autocapitalize="none"><button class="btn sm ok" data-a="admGrant">${t('supGrant')}</button></div><p class="keys">${t('supAdmNote')}</p></div>`:''}
  <div class="hp"><h3>${t('admMsgT')}</h3><div class="row"><input id="admMsgIn" maxlength="140" placeholder="${t('admMsgPh')}"><button class="btn sm ok" data-a="admMsg">${t('admSend')}</button></div></div>
  <div class="hp"><h3>${t('admMeT')}</h3><div class="row"><label>${t('x_xp')} <input id="admXp" type="number" min="0" value="${p.xp|0}" style="width:7em"></label><label>${t('bpTierL')} <input id="admPt" type="number" min="-1" max="${PASS.length}" value="${p.passT==null?-1:p.passT}" style="width:4em"></label><button class="btn sm ok" data-a="admMe">${t('admSave')}</button></div></div>
  <div class="hp"><h3>${t('lb')}</h3>${B==null?`<p class="keys">${t('lbLoad')}</p>`:B.map(r=>`<div class="hpr"><b>${r.b?BADGE:''}${esc(r.n||'?')}</b><small>${r.w|0} ${t('wins')} · ${r.g|0}</small><button class="btn sm warn" data-a="lbDel:${esc(r.id)}">${t('admDelRow')}</button></div>`).join('')}</div>
  <div class="row"><button class="btn big" data-a="menu">${t('back')}</button></div>`;
}
function admGive(){const u=(($('#admUser')||{}).value||'').trim().toLowerCase();if(!/^[a-z0-9_]{3,16}$/.test(u))return err('admUser');
  admReq('/names/'+u+'.json').then(uid=>{if(!uid)throw 1;return admReq('/admins/'+uid+'.json',{method:'PUT',body:JSON.stringify(u)});}).then(()=>{toast('🛠️ '+t('admGiven',u),'prop',2500);openAdmin();}).catch(e=>err(e===1?'admNoUser':'admFail'));}
function admGrant(){const u=(($('#grUser')||{}).value||'').trim().toLowerCase();if(!/^[a-z0-9_]{3,16}$/.test(u))return err('admUser');
  admReq('/names/'+u+'.json').then(uid=>{if(!uid)throw 1;return admReq('/grants/'+uid+'.json',{method:'PUT',body:JSON.stringify({by:'owner',ts:{'.sv':'timestamp'}})});}).then(()=>{toast('💜 '+t('supGranted',u),'prop',3000);$('#grUser').value='';}).catch(e=>err(e===1?'admNoUser':'admFail'));}
function renderSupport(){
  const p=UI.prof,f=p.fb||{};
  $('#help').innerHTML=`<h2>💜 ${t('supT',SUPPORT_SAR)}</h2><p class="keys">${t('supD')}</p>
  ${!f.user?`<div class="hp"><p>${t('supNeedAcc')}</p><div class="row"><button class="btn ok" data-a="account">${t('account')}</button></div></div>`:!STC_PAY?`<div class="hp"><p>${t('supSoon')}</p></div>`:`<div class="hp trust"><h3>🛡️ ${t('trT')}</h3><ul>${t('trL').map(x=>`<li>${x.replace('{0}',SUPPORT_SAR)}</li>`).join('')}</ul></div><div class="hp sups">
    <p><b>1.</b> ${t('supStep1',SUPPORT_SAR)}</p><div class="stc" dir="ltr"><b>${esc(STC_PAY)}</b><button class="btn sm" data-a="supCopy">${t('supCopy')}</button></div>
    <p><b>2.</b> ${t('supStep2')}</p><input id="supPhone" maxlength="10" inputmode="numeric" dir="ltr" placeholder="05XXXXXXXX">
    <p><b>3.</b> ${t('supStep3')}</p><input id="supUser" maxlength="16" dir="ltr" autocapitalize="none" autocomplete="off" spellcheck="false" placeholder="${t('ac_user')}">
    <p><b>4.</b> ${t('supStep4')}</p><button class="btn big ok" data-a="supSend">${t('supSend')}</button></div>`}
  <div class="row"><button class="btn" data-a="${UI.supFrom==='menu'?'menu':'pass'}">${t('back')}</button></div>`;
}
function supSend(){
  const p=UI.prof,f=p.fb||{},ph=(($('#supPhone')||{}).value||'').replace(/\D/g,''),us=(($('#supUser')||{}).value||'').trim();if(!f.user)return;
  if(!/^05\d{8}$/.test(ph))return err('supPhone');if(!/^[A-Za-z0-9_]{3,16}$/.test(us))return err('admUser');if(us.toLowerCase()!==f.user.toLowerCase())return err('supUserBad');const ref=ph;if(!/^https?:/.test(location.protocol))return err('sgSite');
  if(Date.now()-(p.supAt||0)<6e4)return err('supWait');loading(true);
  fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({access_key:SUGGEST_KEY,subject:'Sijal support: '+f.user,from_name:p.name||f.user,username:f.user,amount:SUPPORT_SAR+' SAR (STC Pay)',phone:ph,message:'Support claim · username: '+f.user+' · paid from phone: '+ph+' · amount: '+SUPPORT_SAR+' SAR'})})
  .then(r=>r.json()).then(j=>{loading(false);if(!j||!j.success)throw 0;p.supAt=Date.now();saveProf();$('#help').innerHTML=`<h2>💜</h2><p class="best">${t('supThanks')}</p><div class="row"><button class="btn big" data-a="${UI.supFrom==='menu'?'menu':'pass'}">${t('ok')}</button></div>`;}).catch(()=>{loading(false);err('sgFail');});
}
function admDel(uid){admReq('/admins/'+uid+'.json',{method:'DELETE'}).then(()=>openAdmin()).catch(()=>err('admFail'));}
function admLbDel(uid){if(!confirm(t('admSure')))return;admReq('/lb/'+uid+'.json',{method:'DELETE'}).then(()=>openAdmin()).catch(()=>err('admFail'));}
function admMe(){const p=UI.prof,x=Math.max(0,+(($('#admXp')||{}).value)|0),pt=clamp(+(($('#admPt')||{}).value)|0,-1,PASS.length);addStat('xp',x-(p.xp|0));p.passT=pt;saveProf();
  lbAuth().then(f=>fetch(LB_DB+'/users/'+f.uid+'.json?auth='+f.tok,{method:'PATCH',body:JSON.stringify({pt})})).catch(()=>{});cloudSync();toast('🛠️ '+t('admDone'),'prop',1500);renderAdmin();}
function admMsg(){const m=(($('#admMsgIn')||{}).value||'').trim().slice(0,140);if(!m)return;admReq('/msg.json',{method:'PUT',body:JSON.stringify({m,ts:{'.sv':'timestamp'}})}).then(()=>toast('🛠️ '+t('admSent'),'prop',2000)).catch(()=>err('admFail'));}
// an announcement from the admins shows once to everyone opening the game
function newsCheck(){if(!cloudOn())return;fetch(LB_DB+'/msg.json').then(r=>r.ok?r.json():null).then(j=>{if(!j||!j.m||!j.ts||UI.prof.msgSeen===j.ts)return;UI.prof.msgSeen=j.ts;saveProf();toast('📣 '+esc(j.m),'prop',9000);}).catch(()=>{});}
const CHEATS=['gold','troops','build','era','msl'];
function startMatch(o){
  const p=UI.prof;if(p.size<0)p.size=UI.mob?0:1;if(!p.botsN)p.botsN=UI.mob?10:14;saveProf();
  let opt={w:SIZES[p.size][0],h:SIZES[p.size][1],seed:(Math.random()*2**31)|0,type:p.type,bots:o.quick?quickBots(p):clamp(p.botsN|0,6,30),minors:o.quick?60:tribesN(),diff:p.diff,faction:p.fac};
  opt.skin=mySkin();const ch=p.cheat||{};if(!o.quick&&!o.daily&&!o.same&&!NET.on&&CHEATS.some(k=>ch[k]))opt.cheats=Object.assign({},ch);
  if(o.daily){const d=new Date(),key=d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();opt={skin:mySkin(),w:540,h:340,seed:key,type:Object.keys(TX.ar.types)[key%9],bots:14,diff:2,faction:p.fac,daily:key};}
  if(o.same&&UI.lastOpt&&UI.lastOpt.daily){renderDaily();show('help');return;}
  if(o.same&&UI.lastOpt)opt=Object.assign({},UI.lastOpt,{seed:UI.lastOpt.daily?UI.lastOpt.seed:(Math.random()*2**31)|0});
  UI.lastOpt=opt;loading(true);
  setTimeout(()=>{G=newGame(opt);prep(G);UI.phase='spawn';UI.paused=false;UI.speed=1;buildHud();show(null);hint(t('spawn'),true);loading(false);if(opt.cheats)toast(t('cheatOn'),'prop',5000);},40);
}
function quitXp(){
  const g=G;if(!g||g.o.demo||!g.started||g.over||g.xpDone||g.o.cheats)return;const me=g.nations[g.human];if(!me)return;g.xpDone=true;
  const xp=Math.round((me.st.cities*4+me.st.kills*15)*(g.o.daily?1.5:1));if(xp<=0)return;addStat('xp',xp);addStat('games',1);saveProf();setTimeout(()=>{if(canBuy(UI.prof))toast(t('bpHint'),'prop',4000);},3800);return xp;
}
function toMenu(){const xp=quitXp();saveProf();lbPush();UI.war=false;UI.threats=[];if(NET.on)netClose();UI.phase='';startDemo();renderMenu();show('menu');if(xp)toast(t('quitXp',xp),'prop',3500);}
function showEnd(){
  const g=G,o=g.over,p=UI.prof;if(!o||g.o.demo||UI.screen==='end')return;const me=g.nations[g.human],w=g.nations[o.w];
  g.xpDone=true;const cheat=!!g.o.cheats,xp=cheat?0:Math.round((10+(o.win?60:0)+me.st.cities*4+me.st.kills*15)*(g.o.daily?1.5:1))+(g.o.daily&&o.win?50:0);if(!cheat){addStat('xp',xp);addStat('games',1);if(o.win)addStat('wins',1);saveProf();setTimeout(()=>{if(canBuy(UI.prof))toast(t('bpHint'),'prop',4000);},1500);lbPush();}
  let best=cheat?`<p class="keys">🧪 ${t('cheatEnd')}</p>`:'';if(g.o.daily&&o.win){const b=p.daily[g.o.daily];if(!b||g.tick<b)p.daily={[g.o.daily]:g.tick};best=`<p class="best">${t('best',clock(p.daily[g.o.daily]))}</p>`;}
  saveProf();
  const why=o.why==='dead'?t('w_dead'):t('w_'+o.why,esc(natName(w))),st=[[t('x_time'),clock(g.tick)],[t('x_peak'),(me.st.peak/g.M.land*100).toFixed(0)+'%'],[t('x_cities'),me.st.cities],[t('x_kills'),me.st.kills],[t('x_xp'),'+'+xp]];
  $('#end').innerHTML=`<div class="endbox pn ${o.win?'won':'lost'}"><h1>${t(o.win?'win':'lose')}</h1><p>${why}</p>${best}<div class="stats">${st.map(s=>`<div><small>${s[0]}</small><b>${s[1]}</b></div>`).join('')}</div>
  <h3>${t('replay')}</h3><canvas id="rep" width="${g.W*2}" height="${g.H*2}"></canvas><div class="rbar"><u id="repP"></u></div>
  ${NET.on?(NET.host?`<div class="row"><button class="btn" data-a="toMenu">${t('leave')}</button><button class="btn big" data-a="rematch">${t('rematch')}</button></div>`:`<p class="keys">${t('rematchWait')}</p><div class="row"><button class="btn" data-a="toMenu">${t('leave')}</button></div>`):`<div class="row"><button class="btn" data-a="toMenu">${t('menu')}</button><button class="btn big" data-a="again">${t('again')}</button></div>`}</div>`;
  const dv=g.N>250000?4:g.N>120000?3:2,w2=(g.W/dv)|0,h2=(g.H/dv)|0,c2=mk(w2,h2),x2=c2.getContext('2d'),im=x2.createImageData(w2,h2);UI.rep={c:$('#rep'),c2,x2,im,d:new Uint32Array(im.data.buffer),f:0};
  show('end');
}
function repStep(dt){
  const g=G,r=UI.rep;if(!r||!g.snaps.length)return;const sn=g.snaps,i=Math.min(sn.length-1,Math.floor(r.f)),s=sn[i];
  for(let j=0;j<s.length;j++){const o=s[j];r.d[j]=o?(g.nations[o].pF|0xff000000)>>>0:0;}
  r.x2.putImageData(r.im,0,0);const x=r.c.getContext('2d'),W=r.c.width,H=r.c.height;
  x.imageSmoothingEnabled=true;x.drawImage(R.land,0,0,W,H);x.imageSmoothingEnabled=false;x.globalAlpha=.78;x.drawImage(r.c2,0,0,W,H);x.globalAlpha=1;x.imageSmoothingEnabled=true;x.drawImage(R.water,0,0,W,H);
  $('#repP').style.width=(i/(sn.length-1||1)*100)+'%';r.f+=dt/70;if(r.f>sn.length+18)r.f=0;
}

// ── HUD ──
function buildHud(){
  UI.rows=new Map();UI.chips=new Map();UI.anx=new Map();
  const g=G,me=g.nations[g.human],gl=k=>R.url[k==='ult'?'bolt':k];
  $('#hud').innerHTML=`<div id="top" class="pn"><button class="ib" data-a="pause" aria-label="menu">☰</button>
  <div class="stat" id="sT" title="${t('troops')}"><img src="${R.url.sword}" alt=""><div><b>0</b><small></small><i class="mt"><u></u></i></div></div>
  <div class="stat" id="sG"><span class="coin"></span><div><b>0</b><small></small></div></div>
  <button id="bEra" class="era" data-a="era"></button><div id="sS"></div>
  <div id="spd"><button data-a="sp:0" aria-label="pause">Ⅱ</button><button data-a="sp:1">1×</button><button data-a="sp:2">2×</button><button data-a="sp:3">3×</button></div>
  <button class="ib" id="bLb" data-a="lb" aria-label="${t('ranking')}"><img src="${R.url.crown}" alt=""></button></div>
  <div id="hint" hidden></div><div id="amode" class="pn"></div><div id="fpick" class="pn" hidden></div><div id="feed"></div><div id="lb" class="pn"><h4>${t('ranking')}</h4><div id="lbr"></div></div><div id="atk"></div>
  <div id="card" class="pn" hidden></div><div id="toasts"></div><div id="banner"></div><div id="tip" class="pn" hidden></div>
  <canvas id="mini" width="220" height="${Math.round(220*g.H/g.W)}"></canvas><button id="bHome" class="ib pn" data-a="home" aria-label="capital"><img src="${R.url.cap}" alt=""></button>
  <div id="bottom"><div id="ratio" class="pn"><span>${t('force')}</span><input type="range" id="rs" min="5" max="100" step="5" value="${Math.round(UI.ratio*100)}" aria-label="${t('force')}"><b id="rv"></b></div>
  <div id="bar" class="pn">${BAR.map((k,i)=>`<button class="bb" data-a="b:${k}" id="bb_${k}" title="${k==='ult'?t('fu_'+me.fac)+': '+t('fd_'+me.fac):t('s_'+k)+': '+t('d_'+k)}"><img src="${gl(k)}" alt=""><span class="nm">${k==='ult'?t('fu_'+me.fac):t('s_'+k)}</span><span class="ct"></span><kbd>${k==='ult'?'F':i+1}</kbd></button>`).join('')}</div></div>`;
  renderFac();renderAmode();
  $('#rs').addEventListener('input',e=>{UI.ratio=e.target.value/100;hudUpdate();});
  $('#mini').addEventListener('pointerdown',e=>{const r=e.target.getBoundingClientRect();lookAt((e.clientX-r.left)/r.width*g.W,(e.clientY-r.top)/r.height*g.H);});
}
function hudUpdate(){
  const g=G;if(!g||g.o.demo||!$('#sT'))return;const me=g.nations[g.human],now=g.tick,T=$('#sT'),Gd=$('#sG');
  T.querySelector('b').textContent=fmt(me.troops);T.querySelector('small').textContent='/ '+fmt(me.maxT);T.querySelector('u').style.width=clamp(me.troops/me.maxT*100,0,100)+'%';
  Gd.querySelector('b').textContent=fmt(me.gold);Gd.querySelector('small').textContent='+'+me.income.toFixed(0);
  const be=$('#bEra'),ek=me.era+'|'+(me.era<4&&me.gold>=eraCost(me));
  if(be.dataset.k!==ek){be.dataset.k=ek;be.innerHTML=me.era<4?`<span>${t('eraNow')}: ${t('eras')[me.era-1]}</span><b>▲ ${t('eras')[me.era]} · ${eraCost(me)}</b>`:`<span>${t('eras')[me.era-1]}</span>`;be.classList.toggle('rdy',me.era<4&&me.gold>=eraCost(me));be.title=me.era<4?t('advance',t('eras')[me.era]):'';}
  const sk=g.season+'|'+Math.floor(now/SEASON_LEN/4),S=$('#sS');
  if(S.dataset.k!==sk){S.dataset.k=sk;S.innerHTML=`<i class="sz s${g.season}"></i><div><b>${t('seas')[g.season]}</b><small></small></div>`;S.title=t('seaTip')[g.season];}
  S.firstChild.style.setProperty('--p',(now%SEASON_LEN)/SEASON_LEN);S.querySelector('small').textContent=t('year',Math.floor(now/SEASON_LEN/4)+1)+' · '+clock(now);
  UI.war=!me.alive||!g.started||g.over?false:g.attacks.some(k=>k.d===me.id&&!g.nations[k.a].minor)?'def':g.attacks.some(k=>k.a===me.id&&k.d>0&&!g.nations[k.d].minor)?'atk':false;
  for(const b of document.querySelectorAll('#spd button'))b.classList.toggle('on',+b.dataset.a.slice(3)===(UI.paused?0:UI.speed));
  $('#rv').textContent=Math.round(UI.ratio*100)+'% · '+fmt(me.troops*UI.ratio);
  for(const k of BAR){
    const b=$('#bb_'+k);let lock=false,cost=0,txt;
    if(k==='ult'){cost=ULT[FAC[me.fac].ult].cost;const cd=Math.ceil((me.ultAt-now)/TPS);txt=cd>0?cd+'s':cost;lock=cd>0;}
    else if(MSL[k]){lock=me.era<MSL[k].era;cost=mslCost(me,k);txt=lock?['','II','III','IV'][MSL[k].era-1]:cost;}
    else{lock=me.era<ST[k].era;cost=buildCost(g,me,k);txt=lock?['','II','III','IV'][ST[k].era-1]:k==='mon'&&me.mon?Math.max(0,Math.ceil((me.mon.cd-now)/TPS))+'s':cost;}
    b.querySelector('.ct').textContent=txt;b.classList.toggle('lock',lock);b.classList.toggle('poor',!lock&&me.gold<cost);b.classList.toggle('on',!!UI.mode&&UI.mode.slice(2)===(k==='ult'?FAC[me.fac].ult:k));
  }
  if(UI.phase!=='play')return;
  // ranking: rows are created once and reordered in place
  const box=$('#lbr'),arr=g.nations.filter(n=>n&&n.spawned&&!n.minor).sort((a,b)=>(b.alive-a.alive)||(b.tiles-a.tiles));
  arr.forEach((n,i)=>{
    let r=UI.rows.get(n.id);
    if(!r){r=document.createElement('button');r.className='lr';r.dataset.a='nat:'+n.id;r.innerHTML=`<i style="background:${n.css}"></i><span class="n"></span><span class="s"></span><span class="p"></span>`;r.querySelector('.n').textContent=natName(n);box.appendChild(r);UI.rows.set(n.id,r);}
    const al=me.ally[n.id],war=n.id!==me.id&&(now-me.lastHit[n.id]<300||now-n.lastHit[me.id]<300);
    r.style.order=i;r.classList.toggle('dead',!n.alive);r.classList.toggle('me',n.id===me.id);r.classList.toggle('al',!!al);r.classList.toggle('wr',war&&!al);
    r.querySelector('.p').textContent=n.alive?(n.tiles/g.M.land*100).toFixed(1)+'%':'—';r.querySelector('.s').textContent=al?'✦':war?'✕':g.hegemon===n.id?'♛':'';
  });
  // active offensives
  const ab=$('#atk'),seen=new Set();
  for(const k of g.attacks){
    if(k.a!==me.id||k.cancel)continue;seen.add(k.id);let c=UI.chips.get(k.id);
    if(!c){const d=k.d?g.nations[k.d]:null;c=document.createElement('div');c.className='ac pn';c.dataset.a='goatk:'+k.id;c.style.cursor='pointer';c.innerHTML=`<i style="background:${d?d.css:'#8a8d92'}"></i><span class="n"></span><b></b><button data-a="cancel:${k.id}" title="${t('retreat')}" aria-label="${t('retreat')}">✕</button>`;c.querySelector('.n').textContent=d?natName(d):t('neutral');ab.appendChild(c);UI.chips.set(k.id,c);}
    c.querySelector('b').textContent=fmt(k.troops);
  }
  for(const[id,c]of UI.chips)if(!seen.has(id)){c.remove();UI.chips.delete(id);}
  // one-click annexation of fully encircled realms
  for(const n of g.nations){if(!n||n.id===me.id)continue;const ok=n.alive&&me.alive&&canAnnex(g,me.id,n.id);let c=UI.anx.get(n.id);
    if(ok&&!c){c=document.createElement('button');c.className='ac pn anx';c.dataset.a='annex:'+n.id;c.innerHTML=`<i style="background:${n.css}"></i><span class="n"></span>`;c.querySelector('.n').textContent=t('b_annex',natName(n));ab.appendChild(c);UI.anx.set(n.id,c);}
    else if(!ok&&c){c.remove();UI.anx.delete(n.id);}}
  for(const d of document.querySelectorAll('.ts[data-from]'))if(!g.proposals.some(p=>p.from===+d.dataset.from&&p.to===g.human))d.remove();
  cardRefresh();hintStep();
}
function hint(s,sticky){const h=$('#hint');if(!h)return;UI.hintSticky=!!(s&&sticky);h.hidden=!s;if(s)h.textContent=s;}
const HINTS=[['h_expand',()=>true],['h_city',(g,me)=>me.st.conq>40],['h_build',(g,me)=>g.tick>500&&me.gold>=buildCost(g,me,'city')],['h_era',(g,me)=>me.era<4&&me.gold>=eraCost(me)],['h_dip',g=>g.tick>1300]];
function hintStep(){
  const g=G,me=g.nations[g.human],now=performance.now();if(UI.prof.games>=3||UI.hintSticky||UI.hintI>=HINTS.length)return;
  if(UI.hintShown){if(now-UI.hintT>9000){hint(null);UI.hintShown=false;UI.hintI++;UI.hintT=now;}return;}
  if(now-UI.hintT>2500&&HINTS[UI.hintI][1](g,me)){hint(t(HINTS[UI.hintI][0]));UI.hintShown=true;UI.hintT=now;}
}
function feed(html,cls){const f=$('#feed');if(!f)return;const d=document.createElement('div');d.className='fd '+(cls||'');d.innerHTML=html;f.appendChild(d);while(f.children.length>(UI.mob?3:5))f.firstChild.remove();setTimeout(()=>d.remove(),9000);}
function banner(s,cls){const b=$('#banner');if(!b)return;b.className='';void b.offsetWidth;b.textContent=s;b.className='show '+(cls||'');}
function toast(html,cls,ms){let box=$('#toasts');if(!box||UI.screen){box=$('#gToasts');if(!box){box=document.createElement('div');box.id='gToasts';$('#app').appendChild(box);}}if((box.lastChild&&box.lastChild.dataset.k===html))return null;const d=document.createElement('div');d.dataset.k=html;d.className='ts pn '+(cls||'');d.innerHTML=html;box.appendChild(d);while(box.children.length>3)box.firstChild.remove();if(ms!==0)setTimeout(()=>d.remove(),ms||2200);return d;}
function err(code){sfx('err');toast(t('e_'+code),'bad');}
function sayLine(n,key){if(!n)return;const L=t('say_'+key);feed(`${nmh(n)} <span class="q">«${L[(Math.random()*L.length)|0]}»</span>`,'say');}

// nation card
// your own realm: emoji, trade with everyone on/off, and automatic upgrades within the limits you set
function openSelf(){
  const g=G,me=g.nations[g.human];if(!me||!me.alive||UI.phase!=='play')return;UI.bs=null;UI.sel=me.id;UI.cardKey='';UI.cardAmt=null;
  const c=$('#card');c.hidden=false;
  c.innerHTML=`<div class="ch"><i style="background:${me.css}"></i><div><b>${esc(natName(me))}</b><small>${t('selfSub')}</small></div><button class="ib" data-a="closeCard" aria-label="close">✕</button></div>
  <div class="cs ci"><div title="${t('troops')}"><img src="${R.url.sword}" alt=""><b id="cT"></b></div><div title="${t('land')}"><img src="${R.url.flag}" alt=""><b id="cL"></b></div><div title="${t('cities')}"><img src="${R.url.city}" alt=""><b id="cC"></b></div><div title="${t('gold')}"><img src="${R.url.coin}" alt=""><b id="cG"></b></div></div><div id="cS"></div><div class="cg" id="cB"></div><div id="cAmt"></div>`;
  cardRefresh();
}
function selfRefresh(){
  const g=G,me=g.nations[g.human],au=auCfg();$('#cT').textContent=fmt(me.troops);$('#cL').textContent=(me.tiles/g.M.land*100).toFixed(1)+'%';$('#cC').textContent=me.cnt.city;$('#cG').textContent=fmt(me.gold);
  const key='self|'+me.embAll+'|'+au.on;if(key===UI.cardKey)return;UI.cardKey=key;const S=$('#cS');S.textContent=t(me.embAll?'tradeOff':'tradeOn');S.className=me.embAll?'bad':'good';
  const B=(a,ic,lb,tt,cls)=>`<button class="ca${cls?' '+cls:''}" data-a="${a}" title="${tt}"><img src="${R.url[ic]}" alt=""><span>${lb}</span></button>`;
  $('#cB').innerHTML=B('emoOpen:0','crown',t('c_emo'),t('b_emoSelf'))+(me.embAll?B('embAll:0','ship',t('c_tradeOn'),t('b_tradeOn'),'ok'):B('embAll:1','ship',t('c_tradeOff'),t('b_tradeOff'),'warn'))+B('auOpen','city',t('c_auto'),t('b_auto'),au.on?'ok':'');
}
function auCfg(){const p=UI.prof;const a=p.au||(p.au={on:false,keep:1000,max:5000,ask:true});if(!(a.rate>=1&&a.rate<=8))a.rate=4;return a;}
function auOpen(){
  const a=auCfg(),e=$('#cAmt');UI.cardAmt=null;const L=[0,500,1000,2000,5000,10000,20000,50000],M=[500,1000,2000,5000,10000,20000,50000,1e9];
  const sel=(id,arr,v,lab,hint)=>`<div class="aug"><label class="aul"><span>${lab}</span><select id="${id}">${arr.map(x=>`<option value="${x}"${x===v?' selected':''}>${x>=1e9?t('auNoMax'):fmt(x)}</option>`).join('')}</select></label><small>${hint}</small></div>`;
  e.innerHTML=`<div class="auf"><h3>${t('auTitle')}</h3><p class="keys">${t('b_auto')}</p><div class="chips"><button class="chip${a.on?' on':''}" data-a="auSet:on:1">${t('auOn')}</button><button class="chip${!a.on?' on':''}" data-a="auSet:on:0">${t('auOff')}</button></div>
  ${sel('auKeep',L,a.keep,t('auKeep'),t('auKeepH',fmt(a.keep)))}${sel('auMax',M,a.max,t('auMax'),a.max>=1e9?t('auMaxH0'):t('auMaxH',fmt(a.max)))}<div class="aug"><label class="aul"><span>${t('auRate')}</span><select id="auRate">${[1,2,4,8].map((x,j)=>`<option value="${x}"${x===a.rate?' selected':''}>${t('auPers')[j]}</option>`).join('')}</select></label><small>${t('auRateH')}</small></div>
  <div class="chips"><button class="chip${a.ask?' on':''}" data-a="auSet:ask:1">${t('auAsk')}</button><button class="chip${!a.ask?' on':''}" data-a="auSet:ask:0">${t('auNoAsk')}</button></div><p class="keys">${t('auNote')}</p></div>`;
}
// the cheapest upgrade that keeps the reserve and stays under the cap
function auPick(){
  const g=G,me=g.nations[g.human],a=auCfg();let best=null,bc=1e18;
  for(const s of g.structs)if(!s.dead&&s.owner===me.id&&!canUp(g,me,s)){const c=upCost(s);if(c<=a.max&&me.gold-c>=a.keep&&(c<bc||(c===bc&&s.type==='city'&&best.type!=='city'))){bc=c;best=s;}}
  return best;
}
function auTick(){
  const g=G,a=auCfg();if(!a.on||!g||g.o.demo||!g.started||g.over||UI.phase!=='play')return;const me=g.nations[g.human];if(!me||!me.alive)return;
  const now=performance.now();if(now<(UI.auNext||0)||(UI.auToast&&UI.auToast.isConnected))return;
  // at most a.rate upgrades in any two minutes of game time
  const L=(UI.auLog||(UI.auLog=[])).filter(x=>x<=g.tick&&g.tick-x<1200);UI.auLog=L;if(L.length>=a.rate){UI.auNext=now+2000;return;}const s=auPick();if(!s){UI.auNext=now+3000;return;}
  const nm=s.type==='city'?cityName(s.name,UI.lang):t('s_'+s.type);
  if(!a.ask){send({k:'up',i:s.i});UI.auLog.push(g.tick);UI.auNext=now+2500;feed(t('auDone',esc(nm),s.level+1),'good');return;}
  UI.auPend=s.i;UI.auToast=toast(`<span>⬆ ${t('auQ',esc(nm),s.level+1,fmt(upCost(s)))}</span><button class="btn sm ok" data-a="auY">✓</button><button class="btn sm" data-a="auN">✕</button>`,'au',9000);UI.auNext=now+9500;
}
function openCard(id,tile){if(G&&id===G.human)return openSelf();UI.cardTile=tile==null?-1:tile;
  const g=G,n=g.nations[id];if(!n||!n.alive||id===g.human||UI.phase!=='play')return;UI.sel=id;UI.cardKey='';UI.cardGift=Math.max(50,Math.round(g.nations[g.human].gold*.25/10)*10);
  const c=$('#card');c.hidden=false;
  c.innerHTML=`<div class="ch"><i style="background:${n.css}"></i><div><b>${esc(natName(n))}</b><small>${leader(n)} · ${t('f_'+n.fac)} · ${t('p_'+n.pers)}</small></div><button class="ib" data-a="closeCard" aria-label="close">✕</button></div>
  <div class="cs ci"><div title="${t('troops')}"><img src="${R.url.sword}" alt="${t('troops')}"><b id="cT"></b></div><div title="${t('land')}"><img src="${R.url.flag}" alt="${t('land')}"><b id="cL"></b></div><div title="${t('cities')}"><img src="${R.url.city}" alt="${t('cities')}"><b id="cC"></b></div><div title="${t('mood')}"><i id="cMd"></i><b id="cM"></b></div></div><div id="cS"></div><div class="cg" id="cB"></div><div id="cAmt"></div>`;UI.cardAmt=null;
  cardRefresh();
}
// amount picker under the realm card: gold to gift or troops to send
function amtOpen(kind,id){
  const g=G,me=g.nations[g.human],max=Math.floor(kind==='gift'?me.gold:me.troops-100);if(max<(kind==='gift'?10:100))return err(kind==='gift'?'gold':'few');
  UI.cardAmt={kind,id,max,v:Math.max(1,Math.round(max*.25))};const e=$('#cAmt');
  e.innerHTML=`<div class="amt"><img src="${R.url[kind==='gift'?'coin':'sword']}" alt=""><input type="range" id="amtR" min="1" max="${max}" step="1" value="${UI.cardAmt.v}" aria-label="${t(kind==='gift'?'c_gift':'c_aid')}"><b id="amtV">${fmt(UI.cardAmt.v)}</b></div>
  <div class="amq">${[10,25,50,100].map(p=>`<button class="chip" data-a="amtP:${p}">${p}%</button>`).join('')}</div>
  <div class="row"><button class="btn sm" data-a="amtX">${t('cancel')}</button><button class="btn sm ok" data-a="amtSend">${t('c_send')} <span id="amtS">${fmt(UI.cardAmt.v)}</span></button></div>`;
}
function amtSet(v){const A=UI.cardAmt;if(!A)return;A.v=clamp(Math.round(v),1,A.max);const r=$('#amtR');if(r)r.value=A.v;$('#amtV').textContent=fmt(A.v);$('#amtS').textContent=fmt(A.v);}
// building card: tap your own building to see its level and upgrade it
function structNear(g,i,o){const W=g.W,x0=i%W,y0=(i/W)|0;let b=null,bd=9;for(let y=y0-1;y<=y0+1;y++)for(let x=x0-1;x<=x0+1;x++){if(x<0||y<0||x>=W||y>=g.H)continue;const si=g.structAt[y*W+x];if(!si)continue;const s=g.structs[si-1];const d=(x-x0)**2+(y-y0)**2;if(!s.dead&&s.owner===o&&d<bd){bd=d;b=s;}}return b;}
function effText(s,lv){
  switch(s.type){
    case'city':return t('ef_city',fmt(4000*lv*(s.capital?1.5:1)),1+lv);
    case'fort':return t('ef_fort',5+lv-1,fmt(60000*lv),R_FORT+lv-1);
    case'port':return t('ef_port',2*lv,35*(lv-1));
    case'coast':return t('ef_coast',COAST_R+2*(lv-1),35*(lv-1));
    case'silo':return t('ef_silo',15*(lv-1));
    case'factory':return t('ef_factory',3*lv,35*(lv-1));
    case'camp':return t('ef_camp',TANK_N,Math.round(22*(1+.15*(lv-1))));
    case'shield':return t('ef_shield',Math.round(SH_P.rocket[lv]*100),Math.round(SH_P.nuke[lv]*100),Math.round(SH_P.doom[lv]*100),SH_R(lv));
  }return'';
}
function openBuild(s){
  const g=G,me=g.nations[g.human];if(!s||s.dead||s.owner!==me.id||UI.phase!=='play')return;UI.sel=0;UI.bs=s;UI.bKey='';const c=$('#card');c.hidden=false;
  const nm=s.type==='city'?cityName(s.name,UI.lang)+' · '+t('s_city'):t('s_'+s.type);
  c.innerHTML=`<div class="ch"><img class="bi" src="${R.url[s.capital?'cap':s.type]}" alt=""><div><b>${esc(nm)}</b><small id="bLv"></small></div><button class="ib" data-a="closeCard" aria-label="close">✕</button></div>
  <div class="lvd" id="bDots"></div><div class="bef" id="bNow"></div><div class="bef nx" id="bNext"></div><div id="bBtn"></div>`;
  buildRefresh();
}
function buildRefresh(){
  const g=G,s=UI.bs,c=$('#card');if(!s||!c||c.hidden)return;const me=g.nations[g.human];if(s.dead||s.owner!==me.id)return closeCard();
  $('#bLv').textContent=t('lvl',s.level);$('#bDots').innerHTML=[1,2,3,4,5].map(k=>`<i class="${k<=s.level?'on':''}"></i>`).join('');
  $('#bNow').textContent=effText(s,s.level);
  const r=canUp(g,me,s),key=s.level+'|'+r+'|'+(s.upAt>g.tick?Math.ceil((s.upAt-g.tick)/TPS):0);if(key===UI.bKey)return;UI.bKey=key;
  $('#bNext').textContent=s.level<5?'⬆ '+effText(s,s.level+1):'';
  $('#bBtn').innerHTML=s.level>=5?`<p class="good">${t('upMax')}</p>`:s.upAt>g.tick?`<p class="warn">${t('upBusy',Math.ceil((s.upAt-g.tick)/TPS))}</p>`:
    `<button class="btn sm ok up" data-a="upB"${r&&r!=='gold'?' disabled':''}>${t('upTo',s.level+1)} · ${fmt(upCost(s))}</button>${r==='era'?`<p class="bad">${t('upNeed',t('eras')[upEra(s)-1])}</p>`:r==='gold'?`<p class="bad">${t('e_gold')}</p>`:''}`;
}
function closeCard(){if(UI.rad&&!UI.rad.keep)radClose();UI.bs=null;const c=$('#card');if(c)c.hidden=true;UI.sel=0;}
function cardRefresh(){if(UI.bs)return buildRefresh();if(G&&UI.sel===G.human&&!$('#card').hidden)return selfRefresh();
  const g=G,id=UI.sel,c=$('#card');if(!id||!c||c.hidden)return;const n=g.nations[id],me=g.nations[g.human];if(!n.alive||!me.alive)return closeCard();
  $('#cT').textContent=fmt(n.troops);$('#cL').textContent=(n.tiles/g.M.land*100).toFixed(1)+'%';$('#cC').textContent=n.cnt.city;
  const a=n.att[me.id],mi=a<-40?0:a<-10?1:a<10?2:a<40?3:4,M=$('#cM');M.textContent=t('moods')[mi];M.className='m'+mi;$('#cMd').className='md m'+mi;
  const ally=me.ally[id],tr=!ally&&g.tick<me.truce[id],war=!tr&&!ally&&atWar(g,me.id,id),key=ally+'|'+war+'|'+tr+'|'+me.emb[id],S=$('#cS');
  S.textContent=t(ally?'st_ally':tr?'st_truce':war?'st_war':'st_peace')+(ally?' · '+t('allyLeft',clock(Math.max(0,me.allyUntil[id]-g.tick))):tr?' · '+clock(me.truce[id]-g.tick):'');S.className=ally||tr?'good':war?'bad':'';
  if(key===UI.cardKey)return;UI.cardKey=key;let any=false;for(const m of g.nations)if(m&&m.alive&&me.ally[m.id]&&m.id!==id)any=true;
  const B=(a,ic,lb,tt,cls)=>`<button class="ca${cls?' '+cls:''}" data-a="${a}" title="${tt}"><img src="${R.url[ic]}" alt=""><span>${lb}</span></button>`;
  $('#cB').innerHTML=(war&&!n.minor?B('peace:'+id,'flag',t('c_peace'),t('b_peace'),'ok'):'')+(ally||tr?'':B('atk:'+id,'sword',t(canAnnex(g,me.id,id)?'c_annex':'c_atk'),t(canAnnex(g,me.id,id)?'b_annexS':'b_atk'),'go')+B('sea:'+id,'ship',t('c_sea'),t('b_sea'),'sea'))
    +(ally?B('break:'+id,'ally',t('c_break'),t('b_break'),'warn')+B('aidOpen:'+id,'sword',t('c_aid'),t('b_aid'),'ok'):B('ally:'+id,'ally',t('c_ally'),t('b_ally')))
    +B('giftOpen:'+id,'coin',t('c_gift'),t('b_giftPick'))+(!ally&&any?B('arms:'+id,'crown',t('c_arms'),t('b_arms')):'')+B('emoOpen:'+id,'crown',t('c_emo'),t('b_emoTo'))+(n.minor?'':B('emb:'+id+':'+(me.emb[id]?0:1),'ship',t(me.emb[id]?'c_tradeOn':'c_tradeOff'),t(me.emb[id]?'b_tradeOn1':'b_tradeOff1'),me.emb[id]?'ok':''))+B('find:'+id,'eye',t('c_find'),t('b_find'));
}

// ── player actions ──
function setMode(m){radClose();UI.mode=m;UI.pend=-1;if(UI.mob)UI.hover=-1;for(const d of document.querySelectorAll('.ts.cfm'))d.remove();if(m)hint(m[0]==='b'?t('pick',t('s_'+m.slice(2))):m[0]==='s'?t('pickSea',natName(G.nations[+m.slice(2)])):t('aim'),true);else hint(null);hudUpdate();}
function barAct(k){
  const g=G,me=g.nations[g.human];if(UI.phase!=='play'||!me.alive)return;let r=0,m=null;
  if(k==='ult'){const u=FAC[me.fac].ult;if(g.tick<me.ultAt)r='cd';else if(me.gold<ULT[u].cost)r='gold';else if(ULT[u].tg)m='u:'+u;else send({k:'ult'});}
  else if(MSL[k]){if(me.era<MSL[k].era)r='era';else if(!me.cnt.silo)r='nosilo';else if(me.gold<mslCost(me,k))r='gold';else m='m:'+k;}
  else{r=canBuild(g,me,k,-1);if(!r)m='b:'+k;}
  if(r)return err(r);if(m)setMode(UI.mode===m?null:m);else sfx('click');
}
function placeAt(i){const m=UI.mode;if(!m||i<0)return;const k=m.slice(2);send(m[0]==='b'?{k:'build',s:k,i,R:UI.mob?6:4}:m[0]==='m'?{k:'msl',s:k,i}:m[0]==='s'?{k:'sea',d:+k,i,at:1,r:UI.ratio}:{k:'ult',i});setMode(null);}
function onMapTap(i,x,y){
  const g=G;if(!g||g.o.demo||UI.screen)return;const me=g.nations[g.human];
  if(UI.phase==='spawn')return send({k:'spawn',i,fac:UI.prof.fac});
  if(UI.phase!=='play'||!me.alive)return;
  const m=UI.mode;
  if(m){if(UI.mob){if(m[0]==='b'){const k=m.slice(2);if(k==='port'||k==='coast')i=snapPort(g,me,i,6,k);const r=canBuild(g,me,k,i);if(r)return err(r);}UI.pend=UI.hover=i;for(const d of document.querySelectorAll('.ts.cfm'))d.remove();toast(`<span>${m[0]==='b'?t('s_'+m.slice(2)):m[0]==='s'?t('c_sea'):t('aim')}</span><button class="btn sm ok" data-a="cfm">${t('confirm')}</button><button class="btn sm" data-a="cfx">${t('cancel')}</button>`,'prop cfm',0);return;}
    placeAt(i);return;}
  if(g.M.ter[i]<2)return closeCard();
  const o=g.owner[i];if(o===me.id){const st=structNear(g,i,me.id);if(st)return openBuild(st);const cd=$('#card');return cd&&!cd.hidden?closeCard():openSelf();}if(o&&me.ally[o])return openCard(o);
  if(UI.mob)return radOpen(i,x,y);
  send({k:'atk',i,r:UI.ratio,m:UI.prof.amode||'pt'});
}
// ── radial menu (right click on PC, tap on phone): centre = attack by land, ship = by sea, i = realm card, handshake = alliance or peace, red sword = missiles ──
function seaReach(g,me,i){const o=g.owner[i],cc=shoreNear(g,i,o,10);if(cc<0)return false;let coast=false;for(let j=0;j<g.N&&!coast;j++)if(g.owner[j]===me.id&&g.M.coastD[j]===1)coast=true;return coast&&!!waterPath(g,me.id,cc);}
function radOpen(i,x,y,more){
  const g=G,me=g.nations[g.human];if(!g||!me||!me.alive||i<0||g.M.ter[i]<2)return;const o=g.owner[i];if(o===me.id)return;const n=o?g.nations[o]:null;
  if(!more)closeCard();const cv=document.querySelector('#cv')||document.querySelector('canvas'),rc=cv.getBoundingClientRect();
  const RD=UI.rad&&UI.rad.i===i?UI.rad:{i,x,y,sea:seaReach(g,me,i)};RD.more=!!more;UI.rad=RD;
  const war=n&&!n.minor&&atWar(g,me.id,o),diplo=n&&!n.minor&&!me.ally[o],B=(a,ic,pos,cls,tt,off,lb)=>`<button class="rb ${pos} ${cls||''}${off?' off':''}" data-a="${off?'radX':a}" title="${tt}" aria-label="${tt}"><img src="${ic}" alt=""><i>${lb||''}</i></button>`,U=k=>RR().url[k];
  // what you are hitting and with how much; quick strength buttons under the circle
  let h=`<div class="rr${more?' more':''}"></div>`;
  if(!more){
    h+=B('radAtk',U('sword'),'c','go',t('rLand'),0,t('rl_land'))+B('radInfo',U('eye'),'t','',t('rInfo'),!n,t('rl_info'))+B('radSea',U('ship'),'r',RD.sea?'sea':'',t('rSea'),!RD.sea,t('rl_sea'))+B('radDip',U('ally'),'b',war?'ok':'',t(war?'c_peace':'c_ally'),!diplo,t(war?'c_peace':'c_ally'))+B('radMore',U('sword'),'l','red',t('rMore'),0,t('rl_more'));
  }else{
    h+=B('radBack',U('back')||U('sword'),'c','',t('back'),0,t('back'));
    ['rocket','nuke','doom'].forEach((k,j)=>{const ok=me.era>=MSL[k].era&&me.cnt.silo&&me.gold>=mslCost(me,k);h+=B('radMsl:'+k,U(k)||U('nuke'),'m'+j,ok?'red':'',t('s_'+k)+' · '+fmt(mslCost(me,k)),!ok,t('s_'+k));});
    h+=B('radAll',U('flag'),'m3','go',t('am_all'),0,t('rl_all'));
  }
  let e=$('#radial');if(!e){e=document.createElement('div');e.id='radial';e.addEventListener('contextmenu',ev=>ev.preventDefault());$('#app').appendChild(e);}
  // on a phone the circle opens above the finger so the hand does not hide it
  const up=0;if(!RD.placed){RD.px=clamp(rc.left+x,95,innerWidth-95);RD.py=clamp(rc.top+y-up,110,innerHeight-110);RD.placed=1;try{if(UI.mob&&navigator.vibrate)navigator.vibrate(8);}catch(_){}}
  RD.at=performance.now();e.innerHTML=h;e.hidden=false;e.style.left=RD.px+'px';e.style.top=RD.py+'px';sfx('click');
}
function RR(){return R;}
function radClose(){UI.rad=null;const e=$('#radial');if(e){e.hidden=true;e.innerHTML='';}}
function act(a){
  const g=G,p=UI.prof,[k,v,w]=a.split(':'),me=g&&g.human?g.nations[g.human]:null;auInit();
  // the tap that opened the circle (or switched its page) must not also press the button that appeared under the finger
  if(k.startsWith('rad')&&UI.rad&&performance.now()-(UI.rad.at||0)<400)return;
  switch(k){
    case'quick':renderQuick();show('help');break;case'go':startMatch({});break;case'goQ':startMatch({quick:true});break;case'cfm':placeAt(UI.pend);break;case'cfx':setMode(null);break;case'again':if(NET.on)return toMenu();startMatch({same:true});break;
    case'online':renderNet();show('net');break;case'joinR':netJoin(v);break;case'rematch':netRematch();break;case'lobbyBack':renderLobby();show('net');break;case'pub':p.pub=v==='1';if(NET.on&&NET.host){NET.pub=p.pub;if(NET.pub)regSend();else regUnreg();}renderSetup();break;case'hostRoom':netHost();break;case'join':netJoin(($('#inCode')||{}).value);break;case'netStart':hostStart();break;case'leave':netClose();renderMenu();show('menu');break;case'daily':renderDaily();show('help');break;case'dailyGo':if(p.dailyDone===dayKey()){renderDaily();break;}startMatch({daily:true});break;
    case'custom':UI.setupMode='solo';renderSetup();show('setup');break;case'hostSetup':UI.setupMode='host';renderSetup();show('setup');break;case'menu':renderMenu();show('menu');break;case'toMenu':toMenu();break;
    case'how':UI.helpBack=UI.screen;renderHelp();show('help');break;case'helpBack':show(UI.helpBack==='pause'?'pause':'menu');break;
    case'lang':p.lang=UI.lang=v||(UI.lang==='ar'?'en':'ar');applyMode();if(G&&!G.o.demo)buildHud();renderSettings();break;
    case'snd':p.sound=!p.sound;applyVol();UI.screen==='pause'?renderPause():renderMenu();break;case'mus':p.music=!p.music;applyVol();UI.screen==='pause'?renderPause():renderMenu();break;
    case'ifc':p.ui=v==null?(p.ui+1)%3:+v;applyMode();resize();renderSettings();break;
    case'fac':p.fac=v;renderFac();break;case'account':UI.accMsg='';UI.nameDraft=null;renderAccount();show('help');break;case'accReg':accRegister();break;case'accIn':accLogin();break;case'accOut':accLogout();break;case'board':openLB();break;case'lbS':UI.lbSort=v;openLB();break;case'suggest':renderSuggest();show('help');break;case'sgSend':sendSuggest();break;case'ranks':renderRanks();show('help');break;case'settings':UI.setBack=UI.screen;renderSettings();show('help');break;case'setBack':if(UI.setBack==='pause'){renderPause();show('pause');}else{renderMenu();show('menu');}break;case'news':renderNews();show('help');break;
    case'atk':{const n=g.nations[+v],ti=UI.cardTile>=0&&g.owner[UI.cardTile]===+v?UI.cardTile:n.cap?n.cap.i:-1;closeCard();if(ti>=0)send({k:'atk',i:ti,r:UI.ratio,m:UI.prof.amode||'pt'});break;}case'type':p.type=v;renderSetup();break;case'set':p[v]=+w;UI.screen==='help'?renderQuick():renderSetup();break;
    case'pause':if(UI.phase==='play'||UI.phase==='spawn'||UI.phase==='wait'){renderPause();show('pause');}break;case'resume':show(null);break;
    case'sp':if(NET.on&&!NET.host)return err('hostOnly');if(+v===0)UI.paused=!UI.paused;else{UI.speed=+v;UI.paused=false;}hudUpdate();break;
    case'b':return barAct(v);
    case'era':if(me&&me.era<4){if(me.gold<eraCost(me))return err('gold');send({k:'era'});}break;
    case'lb':$('#lb').classList.toggle('open');break;
    case'home':if(me&&me.cap)lookAt(me.cap.x,me.cap.y,Math.max(cam.tz,5));break;
    case'nat':if(+v!==g.human)openCard(+v);else if(me.cap)lookAt(me.cap.x,me.cap.y);if(UI.mob)$('#lb').classList.remove('open');break;
    case'nameSave':{const v=(UI.nameDraft!=null?UI.nameDraft:p.name)||'';p.name=v;UI.nameDraft=null;saveProf();cloudSync();renderAccount();const m=$('#nameMsg');if(m)m.textContent=t('nameSaved',v||t('defName'));break;}
    case'nameUndo':UI.nameDraft=null;renderAccount();break;
    case'cheat':{const c=p.cheat||(p.cheat={});c[v]=!c[v];saveProf();renderSetup();break;}
    case'radR':UI.ratio=+v/100;{const r=$('#rs');if(r)r.value=+v;}hudUpdate();if(UI.rad)radOpen(UI.rad.i,UI.rad.x,UI.rad.y,UI.rad.more);break;
    case'pass':renderPass();show('help');break;
    case'skins':renderSkins();show('help');break;
    case'bpBuy':passBuy();break;
    case'supOpen':UI.supFrom='pass';renderSupport();show('help');break;
    case'supMenu':UI.supFrom='menu';renderSupport();show('help');break;
    case'supCopy':try{navigator.clipboard.writeText(STC_PAY);toast(t('supCopied'),'prop',1500);}catch(e){}break;
    case'supSend':supSend();break;
    case'admGrant':admGrant();break;
    case'badge':p.hideBadge=v!=='1';saveProf();cloudSync();renderSkins();break;
    case'skin':{const s=p.skin||(p.skin={});if(w&&!owns(p,v,w))break;s[v]=w||'';saveProf();renderSkins();break;}
    case'kick':netKick(+v);if(UI.screen==='pause')renderPause();break;
    case'adm':{if(!UI.admin||!g||g.o.mp||g.o.demo)break;const me2=g.nations[g.human],C=g.o.cheats||(g.o.cheats={});
      if(v==='gold')me2.gold+=1e5;else if(v==='troops')me2.troops+=1e5;else if(v==='era')me2.era=4;else if(v==='build'||v==='msl')C[v]=!C[v];
      else if(v==='win'&&!g.over){g.over={w:me2.id,win:true,why:'dom'};g.ev.push({t:'over',win:true,w:me2.id});show(null);}
      if(v!=='win'){renderPause();toast('🛠️ '+t('admDone'),'prop',1500);}break;}
    case'admin':openAdmin();break;
    case'admGive':admGive();break;case'admDel':admDel(v);break;case'lbDel':admLbDel(v);break;case'admMe':admMe();break;case'admMsg':admMsg();break;
    case'closeCard':closeCard();break;
    case'radX':break;
    case'radAtk':if(UI.rad){send({k:'atk',i:UI.rad.i,r:UI.ratio,m:UI.prof.amode||'pt'});}radClose();break;
    case'radSea':if(UI.rad)send({k:'sea',i:UI.rad.i,at:1,r:UI.ratio});radClose();break;
    case'radInfo':{const o=UI.rad&&g.owner[UI.rad.i],i=UI.rad&&UI.rad.i;radClose();if(o)openCard(o,i);break;}
    case'radDip':{const o=UI.rad&&g.owner[UI.rad.i];radClose();if(o)send(atWar(g,g.human,o)?{k:'peace',d:o}:{k:'ally',d:o});break;}
    case'radMore':if(UI.rad)radOpen(UI.rad.i,UI.rad.x,UI.rad.y,true);break;
    case'radBack':if(UI.rad)radOpen(UI.rad.i,UI.rad.x,UI.rad.y,false);break;
    case'radAll':if(UI.rad)send({k:'atk',i:UI.rad.i,r:UI.ratio,m:'all'});radClose();break;
    case'radMsl':if(UI.rad)send({k:'msl',s:v,i:UI.rad.i});radClose();break;
    case'emoOpen':{if($('#cAmt .emg')&&UI.emoTo===+v){$('#cAmt').innerHTML='';break;}UI.emoTo=+v;UI.cardAmt=null;$('#cAmt').innerHTML=`<div class="emg">${EMO.map((e,i)=>[e,i]).sort((x,y)=>(y[0]==='67')-(x[0]==='67')).map(([e,i])=>`<button data-a="emoS:${i+1}"${e==='67'?` class="e67${hasPass(UI.prof)?'':' lock'}"`:''}>${e==='67'?`<span>🫴</span><b>67</b><span class="r">🫴</span>${hasPass(UI.prof)?'':'<i>🔒</i>'}`:e}</button>`).join('')}</div>`;break;}
    case'emoS':if(EMO[+v-1]==='67'&&!hasPass(p)){sfx('err');toast(t('e67'),'bad',2600);break;}send(UI.emoTo?{k:'emo',e:+v,d:UI.emoTo}:{k:'emo',e:+v});$('#cAmt').innerHTML='';break;
    case'embAll':send({k:'emb',v:+v});UI.cardKey='';break;
    case'emb':send({k:'emb',d:+v,v:+w});UI.cardKey='';break;
    case'auOpen':if($('#cAmt .auf'))$('#cAmt').innerHTML='';else auOpen();break;
    case'auSet':{const a=auCfg();a[v]=w==='1';saveProf();auOpen();UI.cardKey='';UI.auNext=0;break;}
    case'auY':if(UI.auPend>=0){send({k:'up',i:UI.auPend});(UI.auLog||(UI.auLog=[])).push(G.tick);}UI.auPend=-1;if(UI.auToast)UI.auToast.remove();UI.auNext=performance.now()+2000;break;
    case'auN':UI.auPend=-1;if(UI.auToast)UI.auToast.remove();UI.auNext=performance.now()+60000;break;
    case'gfx':UI.prof.gfx=+v;saveProf();applyGfx();renderSettings();break;
    case'upB':if(UI.bs){send({k:'up',i:UI.bs.i});UI.bKey='';}break;
    case'reload':location.replace(location.pathname+'?v='+(UI.updBuild||Date.now())+location.hash);break;case'updX':{const d=$('#upd');if(d)d.remove();break;}
    case'giftOpen':amtOpen('gift',+v);break;case'aidOpen':amtOpen('aid',+v);break;case'amtP':if(UI.cardAmt)amtSet(UI.cardAmt.max*(+v)/100);break;case'amtX':UI.cardAmt=null;$('#cAmt').innerHTML='';break;
    case'amtSend':{const A=UI.cardAmt;if(!A)break;send(A.kind==='gift'?{k:'gift',d:A.id,amt:A.v}:{k:'aid',d:A.id,amt:A.v});UI.cardAmt=null;$('#cAmt').innerHTML='';break;}
    case'am':p.amode=v;renderAmode();break;case'amT':if(UI.amDrag){UI.amDrag=false;break;}p.amHide=!p.amHide;renderAmode();break;
    case'renew':{send({k:'renew',d:+v,y:+w});for(const d of document.querySelectorAll('.ts[data-ally="'+(+v)+'"]'))d.remove();if(+w)feed(t('m_renewSent',nmh(g.nations[+v])),'good');break;}
    case'sea':closeCard();setMode('s:'+v);break;
    case'goatk':{const q=g.attacks.find(q=>q.id===+v),D=q&&q.d?g.nations[q.d]:null;if(D)lookAt(D.cx,D.cy,Math.max(cam.tz,4));else if(q)lookAt(q.ox,q.oy,Math.max(cam.tz,4));break;}
    case'annex':{const n=g.nations[+v];if(n&&n.cap)send({k:'atk',i:n.cap.i,r:UI.ratio});break;}
    case'ally':send({k:'ally',d:+v});break;case'break':send({k:'break',d:+v});break;case'peace':send({k:'peace',d:+v});break;
    case'gift':if(me.gold<10)return err('gold');send({k:'gift',d:+v,amt:UI.cardGift});break;
    case'arms':send({k:'arms',d:+v});break;
    case'find':{const n=g.nations[+v];if(n.cap)lookAt(n.cap.x,n.cap.y,Math.max(cam.tz,5));if(UI.mob)closeCard();break;}
    case'cancel':send({k:'cancel',id:+v});break;
    case'acc':case'rej':send({k,d:+v});for(const d of document.querySelectorAll('.ts[data-from="'+(+v)+'"]'))d.remove();break;
  }
  sfx('click');saveProf();
}
function handleEvents(){
  const g=G,ev=g.ev;if(!ev.length)return;const me=g.human,demo=g.o.demo,N=g.nations;
  for(const e of ev){
    const A=e.a?N[e.a]:null,D=e.d?N[e.d]:null;
    if(e.t==='boom'){const dm=e.type==='doom',nk=dm||e.type==='nuke';addFx('boom',e.x,e.y,{r:e.r*(nk?1.6:1.25),dur:dm?3200:nk?2000:900,nuke:nk});if(!demo){sfx(nk?'nuke':'boom');if(nk)R.shake=dm?30:16;}continue;}
    if(e.t==='intercept'){addFx('ring',e.x,e.y,{r:3,col:'#9fe0ff'});if(!demo&&e.a===me)feed(t('m_inter'),'good');continue;}
    if(e.t==='meteorWarn'){addFx('ring',e.x,e.y,{r:7,col:'#ff9a5a',dur:1600});if(!demo){feed(t('m_meteor'),'warn');sfx('alert');}continue;}
    if(demo)continue;
    const cn=e.s&&e.s.type==='city'?esc(cityName(e.s.name,UI.lang)):'';
    switch(e.t){
      case'war':if(e.d===me&&A.minor){feed(t('m_warYou',nmh(A)),'bad');}else if(e.d===me){feed(t('m_warYou',nmh(A)),'bad');banner(t('m_warYou',natName(A)),'bad');sfx('siren');(UI.threats||(UI.threats=[])).push({id:e.a,until:performance.now()+14000});}break;
      case'shot':addFx('shot',e.x,e.y,{tx:e.tx,ty:e.ty,dur:420});break;
      case'sunk':addFx('boom',e.x,e.y,{r:2.5,dur:700});if(e.a===me){feed(t('m_sunk'),'good');sfx('boom');}else if(e.d===me){feed(t('m_sunkYou'),'bad');sfx('boom');}break;
      case'cityFall':addFx('ring',e.s.x,e.s.y,{r:7+e.s.level,col:A?A.css:'#fff',dur:1300});
        if(e.a===me){feed(t('m_cityYou',cn),'good');banner(cn);sfx('city');}else if(e.d===me){feed(t('m_cityLost',cn),'bad');if(!e.cap)banner(t('m_cityLost',cn),'bad');sfx('lose1');}break;
      case'cityJoin':if(e.a===me){feed(t('m_join',cn),'good');sfx('city');addFx('ring',e.s.x,e.s.y,{r:5,col:'#ffe9a8'});}break;
      case'capMoved':if(e.d===me){feed(t('m_capYou',cn),'bad');banner(t('m_capYou',cn),'bad');}else feed(t('m_capMoved',nmh(D),cn));break;
      case'collapse':feed(t('m_collapse',nmh(D),nmh(A)),e.a===me?'good':'');if(e.a===me)sfx('win1');break;
      case'allyWarn':if(e.a===me||e.b===me){const P=N[e.a===me?e.b:e.a],no=!P.human&&!P.allyRen[me];const d=no?toast(t('m_allyNo',nmh(P)),'bad',6000):toast(`<span>${t('m_allyWarn',nmh(P))}</span><button class="btn sm ok" data-a="renew:${P.id}:1">${t('renewY')}</button><button class="btn sm" data-a="renew:${P.id}:0">${t('renewN')}</button>`,'prop',0);if(d)d.dataset.ally=P.id;sfx('alert');}break;
      case'allyRenew':if(e.a===me||e.b===me){const P=N[e.a===me?e.b:e.a];feed(t('m_allyRenew',nmh(P)),'good');UI.cardKey='';}break;
      case'allyEnd':if(e.a===me||e.b===me){const P=N[e.a===me?e.b:e.a];for(const d of document.querySelectorAll('.ts[data-ally="'+P.id+'"]'))d.remove();feed(t('m_allyEnd',nmh(P)),'warn');UI.cardKey='';}break;
      case'ally':if(e.a===me||e.b===me){feed(t('m_ally',nmh(N[e.a]),nmh(N[e.b])),'good');sfx('city');sayLine(N[e.a===me?e.b:e.a],'ally');UI.cardKey='';}break;
      case'betray':if(e.a===me||e.b===me){feed(t('m_betray',nmh(N[e.a]),nmh(N[e.b])),'bad');if(e.b===me)sfx('alert');UI.cardKey='';}break;
      case'cityHit':addFx('ring',e.s.x,e.s.y,{r:4,col:'#b9b0a6',dur:900});if(e.d===me)feed(t('m_cityRuinYou',cn),'bad');else if(e.a===me)feed(t('m_cityRuin',cn),'good');break;
      case'cityGone':addFx('ring',e.s.x,e.s.y,{r:8,col:'#ff9a5a',dur:1500});if(e.d===me){feed(t('m_cityGoneYou',cn),'bad');banner(t('m_cityGoneYou',cn),'bad');}else if(e.a===me)feed(t('m_cityGone',cn),'good');break;
      case'aid':if(e.a===me){feed(t('m_aidSent',fmt(e.amt),nmh(N[e.b])),'good');sayLine(N[e.b],'thanks');}else if(e.b===me)feed(t('m_aidGot',nmh(A),fmt(e.amt)),'good');break;
      case'upDone':if(e.a===me){feed(t('m_upDone',e.s.type==='city'?esc(cityName(e.s.name,UI.lang)):t('s_'+e.s.type),e.s.level),'good');sfx('era');addFx('ring',e.s.x,e.s.y,{r:5,col:'#ffe9a8',dur:900});UI.bKey='';}break;
      case'train':if(e.a===me){addFx('text',e.x,e.y,{s:'+'+e.amt,dur:1400,col:'#ffe9a8'});sfx('trade');}break;
      case'trade':if(e.a===me){addFx('text',e.x,e.y,{s:'+'+e.amt,dur:1400,col:'#ffe9a8'});sfx('trade');}break;
      case'dead':if(e.a===me&&e.tr>0){addFx('sword',e.x,e.y,{s:'+'+fmt(e.tr),dur:2600});sfx('city');}if(e.d===me&&g.o.mp){banner(t('mpDead'),'bad');feed(t('mpDead'),'bad');sfx('lose');}break;
      case'proposal':{if(e.b!==me)break;const d=toast(`<span>${t('m_prop',nmh(A))}</span><button class="btn sm" data-a="acc:${A.id}">${t('yes')}</button><button class="btn sm" data-a="rej:${A.id}">${t('no')}</button><button class="btn sm" data-a="find:${A.id}">${t('b_focus')}</button>`,'prop',0);if(d)d.dataset.from=A.id;sfx('coin');break;}
      case'emo':if(e.to===me&&e.a!==me)feed(t('m_emo',nmh(A),EMO[e.e-1]));break;
      case'emb':if(e.d===me&&e.a!==me)feed(t(e.v?'m_embOn':'m_embOff',nmh(A)),e.v?'bad':'good');else if(!e.d&&e.a!==me&&e.v&&g.nations[me]&&g.nb&&g.nb[me*g.nations.length+e.a]>0)feed(t('m_embAll',nmh(A)),'bad');break;
      case'peaceProp':{if(e.b!==me)break;const d=toast(`<span>${t('m_peaceProp',nmh(A))}</span><button class="btn sm" data-a="acc:${A.id}">${t('yes')}</button><button class="btn sm" data-a="rej:${A.id}">${t('no')}</button>`,'prop',0);if(d)d.dataset.from=A.id;sfx('coin');break;}
      case'peace':if(e.a===me||e.b===me){feed(t('m_peace',nmh(N[e.a===me?e.b:e.a])),'good');sfx('city');UI.cardKey='';}break;
      case'peaceRej':if(e.b===me){const L=TX[UI.lang]['pr_'+e.why];feed(L?t('m_peaceRejX',nmh(A),L[(Math.random()*L.length)|0]):t('m_peaceNo',nmh(A)),'bad');}break;
      case'reject':if(e.b===me){const L=TX[UI.lang]['ar_'+(e.why||'trust')];feed(L?t('m_rejX',nmh(A),L[(Math.random()*L.length)|0]):t('m_rej',nmh(A)),'bad');}break;
      case'say':if(e.to==null||e.to===me)sayLine(A,e.key);break;
      case'era':if(e.a===me){banner(t('eras')[e.era-1]);feed(t('m_era',t('eras')[e.era-1]),'good');sfx('era');}break;
      case'season':banner(t('seas')[e.s],'sea');if(UI.mob)feed(`<b>${t('seas')[e.s]}</b>: ${t('seaGood')[e.s]}<br><span class="bad">${t('seaBad')[e.s]}</span>`);else{feed(t('seaTip')[e.s]);toast(`<span><b>${t('seas')[e.s]}</b> · ${t('seaGood')[e.s]}<br><span class="bad">${t('seaBad')[e.s]}</span></span>`,'prop',7000);}sfx('season'+e.s);break;
      case'rebel':feed(t('m_rebel',nmh(D)),e.d===me?'bad':'');addFx('ring',e.x,e.y,{r:9,col:'#ff7a4a',dur:1500});break;
      case'plague':feed(t('m_plague',nmh(D)),e.d===me?'bad':'');break;
      case'caravan':feed(t('m_caravan'),'good');sfx('coin');break;
      case'launch':{const nm=t('s_'+e.type);if(e.a===me)sfx('launch');else if(e.d===me){feed(t('m_incoming',nm),'bad');banner(t('m_incoming',nm),'bad');sfx('alert');}else if(e.type!=='rocket')feed(t('m_launch',nmh(A),nm),'warn');break;}
      case'monBuilt':if(e.a===me){banner(t('m_monYou'));feed(t('m_monYou'),'warn');}else{banner(t('m_mon',natName(A)),'bad');feed(t('m_mon',nmh(A)),'bad');sfx('alert');}break;
      case'monLost':feed(t('m_monLost',nmh(A)));break;
      case'coalition':if(e.d===me){banner(t('m_coalYou'),'bad');feed(t('m_coalYou'),'bad');sfx('alert');}else feed(t('m_coal',nmh(D)),'warn');break;
      case'enclave':if(e.a===me){feed(t(e.d?'m_pocket':'m_enclave'),'good');addFx('ring',e.x,e.y,{r:Math.max(6,Math.sqrt(e.n)*.7),col:'#a6f0be',dur:1600});sfx('city');}break;
      case'pocket':if(e.a===me){feed(t('m_pocket'),'good');addFx('ring',e.x,e.y,{r:6,col:'#a6f0be'});}break;
      case'landed':if(e.a===me)feed(t('m_landed'),'good');break;
      case'landFail':if(e.a===me)feed(t('m_landFail'),'bad');break;
      case'gift':if(e.a===me){feed(t('m_gift',nmh(N[e.b])),'good');sayLine(N[e.b],'thanks');}break;
      case'cityUp':if(e.a===me&&e.s.level>=3)feed(t('m_cityUp',cn,e.s.level));break;
      case'ult':if(e.a===me)sfx('ult');if(e.x>=0)addFx('ring',e.x,e.y,{r:9,col:A.css});break;
      case'built':if(e.a===me)addFx('ring',e.s.x,e.s.y,{r:4,col:'#ffe9a8',dur:700});break;
      case'over':UI.phase='over';closeCard();setMode(null);setTimeout(showEnd,1500);sfx(e.win?'win':'lose');banner(t(e.win?'win':'lose'),e.win?'':'bad');break;
    }
  }
  ev.length=0;
}

// ── input ──
function tileAt(x,y){const g=G,w=s2w(x,y),tx=Math.floor(w.x),ty=Math.floor(w.y);return tx<0||ty<0||tx>=g.W||ty>=g.H?-1:ty*g.W+tx;}
function hoverAt(x,y){
  const g=G,tip=$('#tip');if(!g||g.o.demo)return;const i=tileAt(x,y);UI.hover=i;if(!tip||UI.mob)return;
  if(i<0||g.M.ter[i]<2||UI.screen){tip.hidden=true;return;}
  const o=g.owner[i],si=g.structAt[i],s=si?g.structs[si-1]:null,n=o?g.nations[o]:null;
  tip.innerHTML=`<b style="color:${n?n.css:'#c9ced4'}">${n?esc(natName(n)):t('neutral')}</b> · ${t('terr')[g.M.ter[i]]}`+(s?`<br>${s.type==='city'?esc(cityName(s.name,UI.lang))+' · '+s.level:t('s_'+s.type)}`:'');
  tip.hidden=false;tip.style.left=Math.min(x+16,view.w-190)+'px';tip.style.top=Math.min(y+18,view.h-60)+'px';
}
function bindInput(){
  const P=new Map(),xy=e=>{const r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};let down=null,drag=false,pd=0,pc=null,lp=0;
  cv.addEventListener('pointerdown',e=>{
    // a first finger means no other finger is on the glass: forget any touch whose lift the browser never reported (otherwise one finger pinches)
    if(e.isPrimary&&P.size){P.clear();down=null;drag=false;pd=0;}
    if(UI.rad&&e.isPrimary){radClose();UI.radEat=e.pointerId;return;}
    auInit();try{cv.setPointerCapture(e.pointerId);}catch(_){}const p=xy(e);P.set(e.pointerId,p);
    if(P.size===1){down={x:p.x,y:p.y,b:e.button,touch:e.pointerType!=='mouse'};drag=false;clearTimeout(lp);
      if(down.touch)lp=setTimeout(()=>{if(down&&!drag&&G&&!G.o.demo){const i=tileAt(down.x,down.y),o=i>=0?G.owner[i]:0;if(o&&o!==G.human){openCard(o);down=null;}}},520);}
    else if(P.size===2){const[a,b]=[...P.values()];pd=Math.hypot(a.x-b.x,a.y-b.y);pc={x:(a.x+b.x)/2,y:(a.y+b.y)/2};drag=true;clearTimeout(lp);}
  });
  cv.addEventListener('pointermove',e=>{
    const p=P.get(e.pointerId),q=xy(e);if(!G)return;
    if(!p){if(e.pointerType==='mouse')hoverAt(q.x,q.y);return;}
    if(P.size===1){
      if(!drag&&down&&Math.hypot(q.x-down.x,q.y-down.y)>(down.touch?10:5)){drag=true;clearTimeout(lp);}
      if(drag&&!G.o.demo){if(down&&!down.touch&&down.b===0){}else if(false){const A=UI.aim||(UI.aim={pts:[[down.x,down.y]]}),l=A.pts[A.pts.length-1];if(Math.hypot(q.x-l[0],q.y-l[1])>6)A.pts.push([q.x,q.y]);A.x=q.x;A.y=q.y;}else{cam.tx-=(q.x-p.x)/cam.z;cam.ty-=(q.y-p.y)/cam.z;cam.x=cam.tx;cam.y=cam.ty;}}
      p.x=q.x;p.y=q.y;
    }else if(P.size===2){
      p.x=q.x;p.y=q.y;const[a,b]=[...P.values()],d=Math.hypot(a.x-b.x,a.y-b.y),c={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
      if(pd>0&&!G.o.demo){zoomAt(G,c.x,c.y,d/pd,true);cam.tx-=(c.x-pc.x)/cam.z;cam.ty-=(c.y-pc.y)/cam.z;cam.x=cam.tx;cam.y=cam.ty;}pd=d;pc=c;
    }
    if(e.pointerType==='mouse')hoverAt(q.x,q.y);
  });
  const up=e=>{
    if(UI.radEat===e.pointerId){UI.radEat=null;return;}
    clearTimeout(lp);if(!P.delete(e.pointerId))return;const q=xy(e);
    if(P.size===0){
      if(down&&!drag&&e.type==='pointerup'&&G&&!G.o.demo){const i=tileAt(q.x,q.y);
        if(down.b===2){const o=i>=0?G.owner[i]:0;if(UI.mode)setMode(null);else if(i>=0&&o!==G.human&&G.M.ter[i]>=2&&UI.phase==='play')radOpen(i,q.x,q.y);else radClose();}else if(i>=0)onMapTap(i,q.x,q.y);}
      else if(UI.aim&&e.type==='pointerup'&&G&&!G.o.demo){const i=tileAt(q.x,q.y);if(i>=0)onMapTap(i,q.x,q.y);}
      UI.aim=null;down=null;drag=false;
    }else{down=null;drag=true;pd=0;}
  };
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);cv.addEventListener('lostpointercapture',e=>{if(P.has(e.pointerId))up({pointerId:e.pointerId,type:'pointercancel',clientX:e.clientX,clientY:e.clientY});});
  addEventListener('pointerup',e=>{if(P.has(e.pointerId))up(e);});addEventListener('pointercancel',e=>{if(P.has(e.pointerId))up(e);});
  const reset=()=>{P.clear();down=null;drag=false;pd=0;clearTimeout(lp);};addEventListener('blur',reset);document.addEventListener('visibilitychange',reset);
  cv.addEventListener('pointerleave',e=>{if(e.pointerType!=='mouse')return;UI.hover=-1;const tp=$('#tip');if(tp)tp.hidden=true;});
  cv.addEventListener('wheel',e=>{e.preventDefault();if(G&&!G.o.demo){const q=xy(e);zoomAt(G,q.x,q.y,Math.exp(-e.deltaY*.0016));}},{passive:false});
  cv.addEventListener('contextmenu',e=>e.preventDefault());
  // no browser menu over the map, the radial menu or the HUD during a match
  document.addEventListener('contextmenu',e=>{if(G&&!G.o.demo&&!UI.screen&&!(e.target.closest&&e.target.closest('input,textarea,select')))e.preventDefault();});
  $('#app').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&!b.disabled)act(b.dataset.a);});
  $('#app').addEventListener('input',e=>{if(e.target.id==='inTribes'){UI.prof.tribes=clamp(+e.target.value|0,30,120);$('#tribesV').textContent=UI.prof.tribes;saveProf();return;}if(e.target.id==='inMaxP'){let v=clamp(+e.target.value|0,2,32);if(NET.on&&NET.host)v=Math.max(v,NET.players.length);UI.prof.maxP=v;e.target.value=v;$('#maxPV').textContent=v;saveProf();if(NET.on&&NET.host){regSend();if(UI.screen==='net')renderLobby();}}});
  $('#app').addEventListener('change',e=>{if(e.target.id==='auKeep'||e.target.id==='auMax'||e.target.id==='auRate'){const a=auCfg();a[{auKeep:'keep',auMax:'max',auRate:'rate'}[e.target.id]]=+e.target.value;saveProf();UI.auNext=0;auOpen();}});
  $('#app').addEventListener('input',e=>{if(e.target.id==='inName'){UI.nameDraft=e.target.value.trim().slice(0,18);const ch=UI.nameDraft!==(UI.prof.name||'');const b=$('#nameSave'),u=$('#nameUndo');if(b)b.disabled=!ch;if(u)u.disabled=!ch;const m=$('#nameMsg');if(m)m.textContent='';}else if(e.target.id==='amtR'){amtSet(+e.target.value);}else if(e.target.id==='inRoom'){UI.prof.room=e.target.value.trim().slice(0,24);saveProf();if(NET.on&&NET.host)regSend();}else if(e.target.id==='volM'||e.target.id==='volS'){const k=e.target.id;UI.prof[k]=+e.target.value;UI.prof[k==='volM'?'music':'sound']=+e.target.value>0;$('#'+k+'v').textContent=e.target.value;applyVol();if(k==='volS')sfx('coin');saveProf();}else if(e.target.id==='inBots'){UI.prof.botsN=+e.target.value;$('#botsV').textContent=e.target.value;saveProf();}});
  addEventListener('keydown',e=>{
    if(e.target.tagName==='TEXTAREA'||(e.target.tagName==='INPUT'&&e.target.type!=='range'))return;const k=e.key.toLowerCase();UI.keys[k]=true;
    if(!G||G.o.demo)return;
    if(k==='escape'){if(UI.mode)setMode(null);else if(UI.screen==='pause')act('resume');else if(!UI.screen)act('pause');return;}
    if(UI.screen||UI.phase!=='play')return;
    if(k===' '){e.preventDefault();act('sp:0');}else if(k>='1'&&k<='9')barAct(BAR[+k-1]);else if(k==='f')barAct('ult');
    else if(k==='q'||k==='e'){UI.ratio=clamp(Math.round((UI.ratio+(k==='e'?.1:-.1))*20)/20,.05,1);$('#rs').value=UI.ratio*100;hudUpdate();}
    else if(k==='c')act('home');else if(k==='+'||k==='=')zoomAt(G,view.w/2,view.h/2,1.3);else if(k==='-')zoomAt(G,view.w/2,view.h/2,.77);
  });
  addEventListener('keyup',e=>{UI.keys[e.key.toLowerCase()]=false;});
  addEventListener('blur',()=>{UI.keys={};});
}

// ── main loop ──
function frame(ts){
  requestAnimationFrame(frame);const dt=Math.min(100,(ts-lastTs)||16);lastTs=ts;const g=G;if(UI.rad&&(UI.screen||UI.phase!=='play'||!g||g.o.demo))radClose();if(g&&!g.o.demo&&g.started&&!g.over&&UI.phase==='play'&&!document.hidden){const p=UI.prof;addStat('ms',dt);if(g.o.daily&&p.dailyDone!==g.o.daily){p.dailyDone=g.o.daily;saveProf();}if(p.ms-(UI.msSaved||0)>3e4){UI.msSaved=p.ms;saveProf();if(Date.now()-(UI.lbPushed||0)>3e5){UI.lbPushed=Date.now();lbPush();}}}if(!g||!R.land)return;
  if(g.o.demo){cam.tx=g.W/2+Math.sin(ts/21000)*g.W*.16;cam.ty=g.H/2+Math.cos(ts/27000)*g.H*.12;cam.tz=fitZoom(g)*1.5;if(g.over||g.tick>7000){startDemo();return;}}
  else if(!UI.screen){const K=UI.keys,s=dt*.55/cam.z;if(K.a||K.arrowleft)cam.tx-=s;if(K.d||K.arrowright)cam.tx+=s;if(K.w||K.arrowup)cam.ty-=s;if(K.s||K.arrowdown)cam.ty+=s;}
  if(g.started&&!g.over&&!g.o.mp&&(g.o.demo||(!UI.paused&&!UI.screen))){acc+=dt*(g.o.demo?2:UI.speed);let n=0;while(acc>=100&&n<10){tick(g);acc-=100;n++;}if(n===10)acc=0;}
  handleEvents();draw(g,dt,ts);
  if(ts-UI.lastHud>250){UI.lastHud=ts;hudUpdate();const m=$('#mini');if(m&&!UI.mob&&!g.o.demo&&!UI.screen)drawMini(g,m);}
  if(UI.screen==='end')repStep(dt);
}
function boot(){
  cv=$('#cv');ctx=cv.getContext('2d');loadProf();applyMode();makeGlyphs();
  {const c=mk(64,64),x=c.getContext('2d');x.translate(32,32);x.rotate(.8);x.drawImage(R.glyph.silo,-32,-32);R.glyph.rocket=c;R.url.rocket=c.toDataURL();}
  {const c=mk(64,64),x=c.getContext('2d');x.drawImage(R.glyph.nuke,8,8,48,48);x.strokeStyle='#fff';x.lineWidth=4;x.beginPath();x.arc(32,32,29,0,7);x.stroke();R.glyph.doom=c;R.url.doom=c.toDataURL();}
  resize();addEventListener('resize',()=>{applyMode();resize();placeAmode();});
  if(window.ResizeObserver)new ResizeObserver(resize).observe(cv);
  // iPhone Safari ignores user-scalable=no: block its page pinch and double-tap zoom so the game never gets stuck zoomed in
  for(const ev of['gesturestart','gesturechange','gestureend'])document.addEventListener(ev,e=>e.preventDefault(),{passive:false});
  {let lastT=0;document.addEventListener('touchend',e=>{const n=Date.now();if(n-lastT<320&&!(e.target.closest&&e.target.closest('button,input,textarea,select,a')))e.preventDefault();lastT=n;},{passive:false});}
  document.addEventListener('touchmove',e=>{if(e.touches&&e.touches.length>1&&!(e.target.closest&&e.target.closest('#cv')))e.preventDefault();},{passive:false});
  bindInput();renderMenu();show('menu');startDemo();setTimeout(lbPush,2500);setTimeout(adminCheck,3500);setTimeout(newsCheck,4500);requestAnimationFrame(frame);setInterval(musicTick,215);for(const ev of['pointerdown','touchstart','mousedown','touchend','pointerup','click','keydown'])document.addEventListener(ev,auInit,{passive:true,capture:true});
  // try to start the music straight away; browsers only allow sound after the first touch, so if it is blocked, say so once
  try{const C=window.AudioContext||window.webkitAudioContext;if(C&&!AU.ctx){const a=AU.ctx=new C();AU.out=a.createGain();AU.out.gain.value=.55;AU.out.connect(a.destination);AU.fx=a.createGain();AU.mus=a.createGain();AU.fx.connect(AU.out);AU.mus.connect(AU.out);applyVol();a.resume().catch(()=>{});
    setTimeout(()=>{if(AU.ctx&&AU.ctx.state!=='running'&&UI.prof.music!==false){const d=toast(t('tapSound'),'prop',0);if(d){const off=()=>{d.remove();for(const ev of['pointerdown','touchstart','keydown'])document.removeEventListener(ev,off,true);};for(const ev of['pointerdown','touchstart','keydown'])document.addEventListener(ev,off,true);}}},900);}}catch(e){}document.addEventListener('visibilitychange',()=>{if(!document.hidden&&AU.ctx)auInit();});setInterval(netTick,50);setInterval(auTick,1000);applyGfx();addEventListener('pagehide',()=>{if(NET.on)netClose();});
  if(UI.prof.seen!==LOG[0].v){renderNews(true);show('help');UI.prof.seen=LOG[0].v;saveProf();}
  {const h=(location.hash||'').slice(1).toUpperCase();if(/^[A-Z0-9]{5}$/.test(h)){UI.joinCode=h;renderNet();show('net');}}
  window.__sijal={get G(){return G;},cb:canBuild,NET,LOBBY,snd:{AU,SFX,atkBeat,defBeat,tone,noise},fn:{launchMissile,build,launchAttack,setAlly,seaIsShorter},UI,R,cam,act,tap:onMapTap,run:n=>{for(let i=0;i<n;i++)tick(G);}};
}
boot();
