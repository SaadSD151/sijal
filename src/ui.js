// ── SIJAL · interface, input, audio, game loop ──
let G=null,acc=0,lastTs=0;
// public key for the suggestions inbox (Web3Forms); used when the game is not served from Netlify
// online leaderboard (Firebase Realtime Database + anonymous sign-in); empty = turned off
const LB_DB='https://sijal-fa367-default-rtdb.firebaseio.com',LB_KEY='AIzaSyABuacot7I8S6r-7bsTHbYgMWhQC7OHXi4';
const SUGGEST_KEY='137b52a0-fd63-4170-99f2-83a421aef9f4';
const $=s=>document.querySelector(s),BAR=['city','fort','port','coast','factory','silo','shield','rocket','nuke','doom','ult'],rankOf=p=>p.wins<=0?0:Math.min(40,Math.ceil(p.wins/25)),rankShow=p=>{const r=rankOf(p);return p.rankPick!=null&&p.rankPick>=0&&p.rankPick<=r?p.rankPick:r;},rankCls=i=>i>=20?'rk-l':i>=18?'rk-p':i>=14?'rk-g':'',SIZES=[[420,264],[540,340],[680,428],[840,528]],BOTS=[6,10,14,18,23];

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
// the loading screen: a title, a bar and a percentage (the bar shows only when there is real progress to report)
function loading(on){const l=$('#load');l.hidden=!on;if(!l.querySelector('.lbar'))l.innerHTML='<div class="lbx"><span></span><div class="lbar"><i></i></div><b></b></div>';l.querySelector('span').textContent=t('loading');if(on)loadPct(null);}
function loadPct(p){const l=$('#load');if(!l||!l.querySelector('.lbar'))return;const has=p!=null;l.querySelector('.lbar').style.visibility=has?'visible':'hidden';l.querySelector('i').style.width=(has?Math.round(p*100):0)+'%';l.querySelector('b').textContent=has?Math.round(p*100)+'%':'';}
const mtabs=cur=>`<nav class="bnav">${[['menu','tMenu','🏠'],['pass','bp','🎖️'],['skins','tSkins','🎨']].map(([k,l,ic])=>`<button class="${cur===k?'on':''}" data-a="${k}"><i>${ic}</i><span>${t(l)}</span></button>`).join('')}</nav>`;
function renderMenu(){
  if(!document.getElementById('swdefs')){const d=document.createElement('div');d.id='swdefs';d.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML=`<svg width="0" height="0"><defs>
      <linearGradient id="swSteel" x1="0" x2="1"><stop offset="0" stop-color="#7d8893"/><stop offset=".45" stop-color="#eef3f7"/><stop offset=".55" stop-color="#c3ccd4"/><stop offset="1" stop-color="#5d6772"/></linearGradient>
      <linearGradient id="swGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset=".5" stop-color="#e3b95a"/><stop offset="1" stop-color="#8a5f17"/></linearGradient>
      <linearGradient id="swGrip" x1="0" x2="1"><stop offset="0" stop-color="#3a2212"/><stop offset=".5" stop-color="#7a4a26"/><stop offset="1" stop-color="#2c190c"/></linearGradient>
      <g id="swd"><path d="M20 2 L27 16 L26.2 110 L13.8 110 L13 16 Z" fill="url(#swSteel)" stroke="#3d4650" stroke-width=".8"/>
        <path d="M20 14 L20 106" stroke="#5f6a75" stroke-width="2.2" stroke-linecap="round" opacity=".55"/><path d="M21.6 18 L21.6 104" stroke="#fff" stroke-width=".8" opacity=".7"/>
        <rect x="2" y="108" width="36" height="8" rx="4" fill="url(#swGold)" stroke="#6b4710" stroke-width=".8"/><circle cx="3.5" cy="112" r="4" fill="url(#swGold)" stroke="#6b4710" stroke-width=".7"/><circle cx="36.5" cy="112" r="4" fill="url(#swGold)" stroke="#6b4710" stroke-width=".7"/>
        <path d="M17 108 L20 101 L23 108 Z" fill="url(#swGold)"/>
        <rect x="16" y="116" width="8" height="30" rx="2" fill="url(#swGrip)"/>${[0,1,2,3,4,5].map(k=>`<path d="M16 ${119+k*4.6} L24 ${121.5+k*4.6}" stroke="#1d0f06" stroke-width="1.1" opacity=".7"/>`).join('')}
        <circle cx="20" cy="151" r="6.5" fill="url(#swGold)" stroke="#6b4710" stroke-width=".8"/><circle cx="18.5" cy="149.5" r="1.8" fill="#fff6d6" opacity=".8"/></g></defs></svg>`;document.body.appendChild(d);}
  const p=UI.prof,rk=rankOf(p),LV=lvInfo(lifeXp(p)),f=p.fb||{},nm=p.name||f.user||t('defName'),d=new Date(),dk=d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();
  const left=Math.max(1,Math.ceil((new Date(d.getFullYear(),d.getMonth(),d.getDate()+1)-d)/36e5)),done=p.dailyDone===dk;
  const nx=PASS_AT,xp=p.xp|0,pct=Math.max(4,Math.min(100,Math.round(xp/nx*100)));
  const TT='<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M16.6 3c.4 2.2 1.8 3.7 4 3.9v3.1c-1.5 0-2.8-.4-4-1.2v6.3c0 3.4-2.6 5.9-5.8 5.9S5 18.4 5 15.1c0-3.4 2.9-6 6.4-5.6v3.2c-1.6-.4-3.2.7-3.2 2.4 0 1.4 1.1 2.5 2.6 2.5s2.6-1.1 2.6-2.8V3h3.2z"/></svg>';
  const tile=(a,ic,lb,sub,cls)=>`<button class="mtile${cls?' '+cls:''}" data-a="${a}"><i>${ic}</i><b>${lb}</b><small>${sub}</small></button>`;
  // a game-style home: who you are on top, one big battle card, three modes, a few quiet links, and the tabs at the bottom
  $('#menu').innerHTML=`<div class="topbar"><button class="pchip" data-a="account">${lvAv(p,'',UI.mob?54:62)}<span class="pi"><b>${hasBadge(p)?BADGE:''}${esc(nm)}</b><small><span class="rkt ${rankCls(rankShow(p))}">${t('ranks')[rankShow(p)]}</span> · ${t('lvS',LV.lv)}</small><em class="xpb"><u style="width:${Math.max(4,Math.round(LV.cur/LV.need*100))}%"></u></em></span></button>
    <div class="tbi">${UI.admin?`<button class="ibn adm" data-a="admin" aria-label="${UI.owner?t('owner'):t('admin')}">${UI.owner?'👑':'🛠️'}</button>`:''}<button class="ibn" data-a="how" aria-label="${t('how')}">❓</button><button class="ibn" data-a="news" aria-label="${t('news')}">🔔</button><button class="ibn" data-a="settings" aria-label="${t('settings')}">⚙️</button></div></div>
  <div class="logo"><div class="l1">${t('title')}</div><div class="l2">${t('sub')}</div></div>
  <div class="home">
    <button class="hero" data-a="quick"><span class="sx" aria-hidden="true"><svg class="a" viewBox="0 0 40 160"><use href="#swd"/></svg><svg class="b" viewBox="0 0 40 160"><use href="#swd"/></svg><em></em></span><span class="hb"><b>${t('quick')}</b><small>${t('h_quick')}</small></span><span class="play">▶ ${t('h_play')}</span></button>
    <div class="mtiles">${tile('online','🌐',t('online'),t('h_onl'))}${tile('daily','📅',t('daily'),(done?'✓ '+t('h_done'):t('h_left',left))+(dStreakNow(p)?' · 🔥'+dStreakNow(p):''),done?'dn':'')}${tile('custom','🛠️',t('custom'),t('h_cus'))}</div>
    <div class="lnk"><button data-a="board">🏆 ${t('lb')}</button><button data-a="suggest">💬 ${t('d_sug')}</button><button class="ls" data-a="supMenu">💜 ${t('d_sup')}</button><button data-a="social">📱 ${t('d_follow')}</button><button data-a="hist">📜 ${t('hiT')}</button></div>
  </div>
  <div class="mf"><span class="made">${t('made')}</span><span class="made beta">${t('beta')}</span></div>${mtabs('menu')}`;
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
function tribesN(){const v=UI.prof.tribes|0;return v>=30&&v<=240?v:240;}
function maxP(){const v=UI.prof.maxP|0;return v>=2&&v<=32?v:16;}
function renderSetup(){
  const p=UI.prof;if(p.size<0)p.size=UI.mob?0:1;if(!p.botsN||(!p.b2&&(p.botsN===10||p.botsN===14)))p.botsN=UI.mob?16:20;p.b2=1;
  const chips=(key,arr,cur)=>arr.map((s,i)=>`<button class="chip${i===cur?' on':''}" data-a="set:${key}:${i}">${s}${key==='size'||key==='diff'?xpTag(key,i):''}</button>`).join('');
  const host=UI.setupMode==='host'||(NET.on&&NET.host);
  $('#setup').innerHTML=`<h2>${t(host?'hostRoom':'custom')}</h2>
  <div class="opts">${host?`<label class="fld"><h3>${t('roomName')}</h3><input id="inRoom" maxlength="24" value="${esc(p.room||'')}" placeholder="${esc(t('roomOf',p.name||t('defName')))}" autocomplete="off"></label>`:''}<div><h3>${t('world')}</h3><div class="wts">${Object.keys(t('types')).map(k=>`<button class="wt${p.type===k?' on':''}" data-a="type:${k}"><img src="${worldThumb(k)}" alt=""><span>${t('types')[k]}</span></button>`).join('')}</div></div>
  <div><h3>${t('size')}</h3><div class="chips">${chips('size',t('sizes'),p.size)}</div></div>
  <div><h3>${t('foes')}</h3><div class="rng"><input type="range" id="inBots" min="6" max="80" step="1" value="${p.botsN}" aria-label="${t('foes')}"><b id="botsV">${p.botsN}</b></div></div>
  <div><h3>${t('tribes')}</h3><div class="rng"><input type="range" id="inTribes" min="30" max="240" step="5" value="${tribesN()}" aria-label="${t('tribes')}"><b id="tribesV">${tribesN()}</b></div></div>
  <div><h3>${t('diff')}</h3><div class="chips">${chips('diff',t('diffs'),p.diff)}</div></div>${host?'':`<div class="cheats"><h3>🧪 ${t('cheats')}</h3><div class="chips">${CHEATS.map(k=>`<button class="chip${(p.cheat||{})[k]?' on':''}" data-a="cheat:${k}">${t('ch_'+k)}</button>`).join('')}</div><p class="keys">${t('cheatNote')}</p></div>`}</div>
  ${host?`<div class="opts" style="grid-template-columns:minmax(0,1fr)"><div><h3>${t('maxP')}</h3><div class="rng"><input type="range" id="inMaxP" min="2" max="32" step="1" value="${maxP()}" aria-label="${t('maxP')}"><b id="maxPV">${maxP()}</b></div></div></div>`:''}
  ${host?`<div class="chips"><span class="rk">${t('roomType')}:</span><button class="chip${p.pub!==false?' on':''}" data-a="pub:1">${t('pubRoom')}</button><button class="chip${p.pub===false?' on':''}" data-a="pub:0">${t('privRoom')}</button></div>`:''}
  ${NET.on&&NET.host?`<div class="row"><button class="btn" data-a="lobbyBack">${t('lobby')} (${NET.players.length})</button><button class="btn big" data-a="netStart">${t('startNet')}</button></div>`:`${host?`<div class="row"><button class="btn" data-a="online">${t('back')}</button><button class="btn big" data-a="hostRoom">${t('hostRoom')}</button></div>`:`<div class="row"><button class="btn" data-a="menu">${t('back')}</button><button class="btn big" data-a="go">${t('start')}</button></div>`}`}`;
}
// how to play: the short version first, then every topic in detail with a picture from the game (pictures live next to the page on the website)
function renderHelp(){
  const web=/^https?:/.test(location.protocol);
  $('#help').innerHTML=`<h2>${t('how')}</h2><div class="hwq"><h3>⚡ ${t('hwQuick')}</h3><ol>${t('hwQ').map(x=>`<li>${x}</li>`).join('')}</ol></div>
  <h3 class="hwh">📖 ${t('hwFull')}</h3><div class="hwd">${t('hwD').map((d,i)=>`<details${i===0?' open':''}><summary><span>${d[0]}</span></summary><div>${d[1]&&web?`<img loading="lazy" src="howto/${d[1]}.jpg" alt="">`:''}${d[2].map(x=>`<p>${x}</p>`).join('')}</div></details>`).join('')}</div>
  <p class="keys">${t('keys')}</p><div class="row"><button class="btn big" data-a="helpBack">${t('back')}</button></div>`;
}
const dayKey=()=>{const d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();};
// the daily challenge: one world and one rule of the day for everyone, one attempt, a board of the fastest wins, and a streak
const DMODS=['nomsl','army','rich','hard'],dMod=k=>DMODS[((k%97)+Math.floor(k/100)%7)%4];
const dPrev=k=>{const D=new Date(Math.floor(k/10000),Math.floor(k/100)%100-1,k%100-1);return D.getFullYear()*10000+(D.getMonth()+1)*100+D.getDate();};
const dStreakNow=p=>{const k=dayKey();return p.dLast===k||p.dLast===dPrev(k)?p.dStreak|0:0;};
function dailyBoard(key){
  if(!cloudOn())return Promise.resolve(null);const base=LB_DB+'/daily/'+key+'.json';
  return fetch(base+'?orderBy=%22t%22&limitToFirst=20').then(r=>r.ok?r.json():fetch(base).then(r=>r.ok?r.json():null)).then(top=>
    fetch(base+'?shallow=true').then(r=>r.ok?r.json():null).then(all=>({top:top?Object.entries(top).map(([uid,v])=>Object.assign({uid},v)).filter(v=>v&&v.t>0).sort((a,b)=>a.t-b.t).slice(0,20):[],n:all?Object.keys(all).length:0}))).catch(()=>null);
}
function dailySubmit(key,tk){
  const p=UI.prof;if(!cloudOn())return Promise.resolve();
  return lbAuth().then(f=>fetch(LB_DB+'/daily/'+key+'/'+f.uid+'.json').then(r=>r.ok?r.json():null).then(old=>{if(old&&old.t<=tk)return;
    return fetch(LB_DB+'/daily/'+key+'/'+f.uid+'.json?auth='+f.tok,{method:'PUT',body:JSON.stringify({n:(p.name||t('defName')).slice(0,18),t:tk,s:dStreakNow(p)})});})).catch(()=>{});
}
function boardHTML(B,key){
  const me=(UI.prof.fb||{}).uid;if(!B)return`<p class="keys">${t('dOff')}</p>`;
  if(!B.top.length)return`<p class="dcount">${t('dNoOne')}</p>`;
  return`<p class="dcount">${t('dCount',B.n)}</p><ol class="dbrd">${B.top.slice(0,10).map((e,i)=>`<li class="${e.uid===me?'me':''}"><span class="rk">${['🥇','🥈','🥉'][i]||i+1}</span><b>${esc(e.n||t('defName'))}${e.uid===me?` <small>(${t('dYou')})</small>`:''}</b>${e.s>1?`<em>🔥${e.s}</em>`:''}<i dir="ltr">${clock(e.t)}</i></li>`).join('')}</ol>`;
}
function renderDaily(){
  const p=UI.prof,key=dayKey(),ty=Object.keys(TX.ar.types)[key%9],b=p.daily[key],mod=dMod(key),done=p.dailyDone===key,st=dStreakNow(p);
  $('#help').innerHTML=`<h2>📅 ${t('daily')}</h2>
  <div class="dmod"><small>${t('dRule')}</small><b>${t('dm_'+mod)}</b></div>
  <div class="dtop"><div class="wt on"><img src="${worldThumb(ty)}" alt=""><span>${t('dWorld')}: ${t('types')[ty]}</span></div>
    <div class="dme"><div>${st?t('dStreak',st):t('dStreak0')}</div><div>${b?'⏱️ '+t('best',clock(b)):t('dNone')}</div></div></div>
  <div class="dbox"><h3>${t('dBoardT')}</h3><div id="dBoard"><p class="keys">⏳</p></div></div>
  <div class="dbox dhow"><h3>${t('dHowT')}</h3><ul>${t('dHow').map(x=>`<li>${x}</li>`).join('')}</ul></div>
  ${done?`<p class="dlock">🔒 ${t('dDone')}</p>`:`<p class="dxp">${t('dOne')}</p>`}<div class="row"><button class="btn" data-a="menu">${t('back')}</button>${done?'':`<button class="btn big ok" data-a="dailyGo">${t('dGo')}</button>`}</div>`;
  dailyBoard(key).then(B=>{const e=$('#dBoard');if(e)e.innerHTML=boardHTML(B,key);});
}
// quick battle: more rivals on bigger maps and harder difficulties
const quickBots=p=>clamp([14,20,52,68][p.size<0?1:p.size]+[0,2,4,6][p.diff|0],6,80);
// bonus XP for a bigger map and a harder game, added together
const XP_SIZE=[0,.25,.5,1],XP_DIFF=[0,.25,.5,1],xpMul=p=>1+XP_SIZE[p.size<0?1:p.size]+XP_DIFF[p.diff|0],
  xpTag=(key,i)=>{const v=(key==='size'?XP_SIZE:XP_DIFF)[i];return v?`<small class="xpt">⭐ +${Math.round(v*100)}%</small>`:'';};
function renderQuick(){
  const p=UI.prof;if(p.size<0)p.size=UI.mob?0:1;
  const chips=(key,arr,cur)=>arr.map((x,i)=>`<button class="chip${i===cur?' on':''}" data-a="set:${key}:${i}">${x}${key==='size'||key==='diff'?xpTag(key,i):''}</button>`).join('');
  $('#help').innerHTML=`<h2>${t('quick')}</h2><div class="opts" style="grid-template-columns:minmax(0,1fr);width:min(520px,100%)"><div><h3>${t('size')}</h3><div class="chips">${chips('size',t('sizes'),p.size)}</div></div><div><h3>${t('diff')}</h3><div class="chips">${chips('diff',t('diffs'),p.diff)}</div></div><p class="keys">${t('foes')}: <b>${quickBots(p)}</b> · ⭐ ${t('xpBon')}: <b>×${xpMul(p)}</b></p></div>
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
  <div><h3>${t('smT')}</h3><div class="chips" style="justify-content:flex-start"><button class="chip${p.smooth?'':' on'}" data-a="smooth:0">${t('smOff')}</button><button class="chip${p.smooth?' on':''}" data-a="smooth:1">${t('smOn')}</button></div><div class="gfxd">${t('smD')}</div></div>
  <div><h3>${t('iface')}</h3><div class="chips" style="justify-content:flex-start">${t('ifs').map((x,i)=>`<button class="chip${p.ui===i?' on':''}" data-a="ifc:${i}">${x}</button>`).join('')}</div></div></div>
  <div class="row"><button class="btn big" data-a="setBack">${t('ok')}</button></div>`;
}
// ── play time and the online leaderboard ──
const hrs=ms=>(ms/3.6e6).toFixed(ms<3.6e7?1:0);
function lbAuth(){
  const f=UI.prof.fb||(UI.prof.fb={});if(f.tok&&f.exp>Date.now()+6e4)return Promise.resolve(f);
  const done=j=>{if(!j||!(j.idToken||j.id_token))throw 0;f.tok=j.idToken||j.id_token;f.rt=j.refreshToken||j.refresh_token||f.rt;f.uid=j.localId||j.user_id||f.uid;f.exp=Date.now()+(+(j.expiresIn||j.expires_in)||3600)*1000;saveProf();return f;};
  if(f.rt)return fetch('https://securetoken.googleapis.com/v1/token?key='+LB_KEY,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=refresh_token&refresh_token='+encodeURIComponent(f.rt)}).then(r=>r.json()).then(j=>{if(j&&j.error){if(f.user){UI.relog=1;f.tok='';saveProf();throw 0;}f.rt='';return lbAuth();}return done(j);});
  return fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key='+LB_KEY,{method:'POST',headers:{'Content-Type':'application/json'},body:'{"returnSecureToken":true}'}).then(r=>r.json()).then(done);
}
// progress lives in the cloud under the player's id: each device sends only what it added since the last sync (server-side increments),
// so playing on a phone and a PC never overwrites one with the other
const SK={wins:'w',games:'g',xp:'xp',ms:'ms',xps:'xs'};
const LVSTEP=l=>l<=20?200:l<=40?250:l<=60?300:350,lifeXp=p=>(p.xp|0)+(p.xps|0);
function lvInfo(xp){let l=1,need=LVSTEP(1);while(xp>=need&&l<5000){xp-=need;l++;need=LVSTEP(l);}return{lv:l,cur:xp,need};}
const lvAv=(p,ch,size)=>lvFrame(lvInfo(lifeXp(p)).lv,size||58,p.avatar|0);
const lvMini=(L,av,size)=>lvFrame(L,size||34,av|0);
function addStat(k,v){const p=UI.prof;p[k]=(p[k]||0)+v;const d=p.pend||(p.pend={});d[k]=(d[k]||0)+v;}
// never from automated test browsers or the local test mode, so tests cannot leave rows on the real leaderboard
const cloudOn=()=>!!(LB_DB&&LB_KEY&&/^https?:/.test(location.protocol)&&!navigator.webdriver&&!/[?&]bc=1/.test(location.search));
function cloudSync(){
  const p=UI.prof;if(!cloudOn())return Promise.resolve();if(UI.syncing)return UI.syncing;
  if(!p.cloudInit){p.cloudInit=1;p.pend={wins:p.wins|0,games:p.games|0,xp:p.xp|0,ms:Math.round(p.ms||0)};saveProf();}
  if(!p.histUp){p.histUp=1;p.histPend=(p.hist||[]).slice();saveProf();}
  if(p.xps==null){const n=p.passT==null?-1:p.passT,v=n>=0&&!p.supporter?PASS_AT+n*PASS_STEP:0;p.xps=0;if(v)addStat('xps',v);saveProf();}
  if(!p.games&&!(p.fb&&p.fb.user))return Promise.resolve();
  const sent=Object.assign({},p.pend||{}),hSent=(Array.isArray(p.histPend)?p.histPend:[]).slice();let uid;
  return UI.syncing=lbAuth().then(f=>{uid=f.uid;const body={n:(p.name||t('defName')).slice(0,18),t:{'.sv':'timestamp'}};if(p.fb&&p.fb.user)body.u=p.fb.user;body.av=p.avatar|0;if(p.dLast){body.dl=p.dLast;body.ds=p.dStreak|0;}if(p.dailyDone)body.dd=p.dailyDone;for(const k in SK){const v=Math.round(sent[k]||0);if(v)body[SK[k]]={'.sv':{increment:v}};}for(const e of hSent)body['hist/h'+e.d]=e;
    const flat=()=>fetch(LB_DB+'/lb/'+uid+'.json?auth='+f.tok,{method:'PUT',body:JSON.stringify({n:body.n,w:p.wins|0,h:Math.round(p.ms||0),g:p.games|0,b:hasBadge(p)?1:0,r:rankShow(p),av:p.avatar|0,lv:p.hideLv?0:lvInfo(lifeXp(p)).lv,t:{'.sv':'timestamp'}})});
    return fetch(LB_DB+'/users/'+uid+'.json?auth='+f.tok,{method:'PATCH',body:JSON.stringify(body)}).then(r=>{if(!r.ok){UI.noUsers=1;return null;}return fetch(LB_DB+'/users/'+uid+'.json?auth='+f.tok).then(r=>r.json());}).then(u=>{
      if(UI.noUsers&&!u)return flat();
      if(!u||(p.fb||{}).uid!==uid)return;histMerge(p,u.hist,hSent,uid,f.tok);if(u.av!=null&&p.avatar==null)p.avatar=u.av|0;if(u.dl>(p.dLast|0)){p.dLast=u.dl;p.dStreak=u.ds|0;}if(u.dd>(p.dailyDone|0))p.dailyDone=u.dd;const d=p.pend||{};for(const k in SK){d[k]=(d[k]||0)-(sent[k]||0);if(Math.abs(d[k])<1)d[k]=0;p[k]=(u[SK[k]]||0)+d[k];}
      fetch(LB_DB+'/grants/'+uid+'.json?auth='+f.tok).then(r=>r.ok?r.json():null).then(gr=>{if(gr&&(p.passT==null?-1:p.passT)<PASS.length){p.passT=PASS.length;p.supporter=1;saveProf();toast(t('supOn'),'prop',6000);fetch(LB_DB+'/users/'+uid+'.json?auth='+f.tok,{method:'PATCH',body:JSON.stringify({pt:PASS.length})}).catch(()=>{});}}).catch(()=>{});
      const cpt=u.pt!=null?u.pt|0:-1;if(cpt>(p.passT==null?-1:p.passT))p.passT=cpt;saveProf();
      if((p.passT==null?-1:p.passT)>cpt)fetch(LB_DB+'/users/'+uid+'.json?auth='+f.tok,{method:'PATCH',body:JSON.stringify({pt:p.passT})}).catch(()=>{});
      return fetch(LB_DB+'/lb/'+uid+'.json?auth='+f.tok,{method:'PUT',body:JSON.stringify({n:body.n,w:u.w|0,h:Math.round(u.ms||0),g:u.g|0,b:hasBadge(p)?1:0,r:rankShow(p),av:p.avatar|0,lv:p.hideLv?0:lvInfo(lifeXp(p)).lv,t:{'.sv':'timestamp'}})});});})
    .then(()=>{UI.lbPushed=Date.now();if(UI.screen==='menu')renderMenu();}).catch(()=>{}).then(()=>{UI.syncing=null;});
}
const lbPush=cloudSync;
// real accounts: a username and password (Firebase email/password under the hood) carry the same progress to every device
const accMail=u=>u.toLowerCase()+'@players.sijal.game';
function accErr(j){const m=(j&&j.error&&j.error.message)||'';return /EMAIL_EXISTS/.test(m)?'taken':/WEAK_PASSWORD/.test(m)?'weak':/TOO_MANY/.test(m)?'many':/OPERATION_NOT_ALLOWED|ADMIN_ONLY/.test(m)?'off':/INVALID|NOT_FOUND|PASSWORD/.test(m)?'bad':'net';}
const isMail=s=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
function accForm(login){const u=(($('#inUser')||{}).value||'').trim(),pw=($('#inPass')||{}).value||'',m=login&&isMail(u);if(!m&&!/^[A-Za-z0-9_]{3,16}$/.test(u))return null;if(pw.length<6)return'pw';return{u:m?'':u,mail:m?u.toLowerCase():'',pw};}
function accDone(code){UI.accMsg=code;loading(false);renderAccount();if(code==='made'&&!UI.prof.name)setTimeout(()=>{const i=$('#inName');if(i){i.focus();i.scrollIntoView({block:'center'});}},120);}
const AUTH='https://identitytoolkit.googleapis.com/v1/accounts:';
function accReq(kind,F){return fetch(AUTH+kind+'?key='+LB_KEY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:F.mail||accMail(F.u),password:F.pw,returnSecureToken:true})}).then(r=>r.json());}
const authPost=(kind,body,lang)=>fetch(AUTH+kind+'?key='+LB_KEY,{method:'POST',headers:Object.assign({'Content-Type':'application/json'},lang?{'X-Firebase-Locale':UI.lang}:{}),body:JSON.stringify(body)}).then(r=>r.json());
// entering an account: a guest's progress on this device moves into it, and the guest's own entries are removed so nobody shows up twice
function accEnter(j,F,okMsg){
  const p=UI.prof,old=p.fb||{};if(okMsg==='made')stat('signup');UI.relog=0;UI.accInfo=null;UI.gNew=null;
  if(j.localId===old.uid){old.user=F.u||old.user;old.tok=j.idToken;old.rt=j.refreshToken||old.rt;old.exp=Date.now()+(+j.expiresIn||3600)*1000;saveProf();return accDone(okMsg);}
  const guest=!old.user&&old.uid?{wins:p.wins|0,games:p.games|0,xp:p.xp|0,ms:Math.round(p.ms||0)}:null,gTok=old.tok,gUid=old.uid;
  const drop=guest&&gTok?Promise.all(['lb','users'].map(k=>fetch(LB_DB+'/'+k+'/'+gUid+'.json?auth='+gTok,{method:'DELETE'}).catch(()=>{}))):Promise.resolve();
  return drop.then(()=>fetch(LB_DB+'/users/'+j.localId+'.json?auth='+j.idToken)).then(r=>r.json()).then(u=>{
    p.fb={tok:j.idToken,rt:j.refreshToken,uid:j.localId,exp:Date.now()+(+j.expiresIn||3600)*1000,user:F.u||(u&&u.u)||(F.mail||'player').split('@')[0].replace(/[^A-Za-z0-9_]/g,'').slice(0,16)||'player'};p.cloudInit=1;setTimeout(adminCheck,500);
    const gpt=p.passT==null?-1:p.passT;p.passT=Math.max(guest?gpt:-1,u&&u.pt!=null?u.pt|0:-1);
    for(const k in SK)p[k]=(u&&u[SK[k]])||0;if(u&&u.n)p.name=u.n;p.pend=guest||{};if(guest)p.histPend=(p.hist||[]).slice();else{p.hist=[];p.histPend=[];}for(const k in SK)p[k]+=(p.pend[k]||0);saveProf();return cloudSync().then(()=>{accDone(okMsg);renderMenu();});});
}
function accRegister(){
  const F=accForm();if(!F)return accDone('user');if(F==='pw')return accDone('weak');if(!cloudOn())return accDone('net');loading(true);
  lbAuth().catch(()=>{}).then(()=>cloudSync()).then(()=>accReq('signUp',F)).then(j=>j.idToken?accEnter(j,F,'made'):accDone(accErr(j))).catch(()=>accDone('net'));
}
function accLogin(){
  const F=accForm(true);if(!F)return accDone('user');if(F==='pw')return accDone('bad');if(!cloudOn())return accDone('net');loading(true);
  accReq('signInWithPassword',F).then(j=>j.idToken?accEnter(j,F,'in'):accDone(F.mail?accErr(j):accErr(j)==='bad'?'badU':accErr(j))).catch(()=>accDone('net'));
}
// a real email on the account: Firebase sends a link, and once it is opened the email becomes the way to sign in and to reset the password
function accInfoLoad(){
  if(UI.accInfoBusy||!cloudOn())return;UI.accInfoBusy=1;
  lbAuth().then(f=>authPost('lookup',{idToken:f.tok})).then(j=>{const u=j&&j.users&&j.users[0];if(!u)throw 0;
    UI.accInfo={email:u.email||'',google:(u.providerUserInfo||[]).some(x=>x.providerId==='google.com'),pw:(u.providerUserInfo||[]).some(x=>x.providerId==='password')};
    if($('#help .accb'))renderAccount();}).catch(()=>{if(UI.relog&&$('#help .accb'))renderAccount();}).then(()=>{UI.accInfoBusy=0;});
}
const realMail=e=>!!e&&!/@players\.sijal\.game$/i.test(e);
function mailLink(){
  const em=(($('#inMail')||{}).value||'').trim().toLowerCase(),pw=($('#inPass2')||{}).value||'',f=UI.prof.fb||{},I=UI.accInfo||{};
  if(!isMail(em))return accDone('mlBad');if(pw.length<6)return accDone('bad');loading(true);
  // Firebase wants a fresh sign-in before the email changes
  authPost('signInWithPassword',{email:I.email||accMail(f.user),password:pw,returnSecureToken:true}).then(j=>{if(!j.idToken)return accDone(accErr(j));
    f.tok=j.idToken;f.rt=j.refreshToken||f.rt;f.exp=Date.now()+(+j.expiresIn||3600)*1000;saveProf();
    return cloudSync().then(()=>authPost('sendOobCode',{requestType:'VERIFY_AND_CHANGE_EMAIL',idToken:j.idToken,newEmail:em},1)).then(r=>{
      if(r&&r.email!=null||r&&!r.error){UI.mailTo=em;stat('mail');return accDone('mlSent');}const m=(r.error&&r.error.message)||'';accDone(/EMAIL_EXISTS/.test(m)?'mlTaken':/INVALID_EMAIL/.test(m)?'mlBad':/TOO_MANY/.test(m)?'many':'net');});})
  .catch(()=>accDone('net'));
}
function accForgot(){
  const v=(($('#inUser')||{}).value||'').trim();if(!isMail(v))return accDone('fgNeed');if(!cloudOn())return accDone('net');loading(true);
  // the same answer whether or not the email is linked, so nobody can probe which emails play here
  authPost('sendOobCode',{requestType:'PASSWORD_RESET',email:v.toLowerCase()},1).then(()=>accDone('fgSent')).catch(()=>accDone('net'));
}
// Google sign-in: Google's own button gives an ID token, and Firebase turns it into a Sijal account (or links it to the one you are in)
const GOOGLE_CID=location.hostname==='saadsd151.github.io'?'':'79742214940-mtg3fatfeo2064v40mrtrhocedru9t2o.apps.googleusercontent.com';
const inAppBrowser=()=>/FBAN|FBAV|Instagram|TikTok|musical_ly|Bytedance|Snapchat|Line\//i.test(navigator.userAgent);
// our own Google button (Google's colours and logo, our layout): a click asks Google for a token in a popup, and Firebase turns it into the account
const GLOGO='<svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>';
function gLoad(){if(window.google&&google.accounts&&google.accounts.oauth2)return Promise.resolve();if(UI.gsi)return UI.gsi;
  return UI.gsi=new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;s.onload=ok;s.onerror=()=>{UI.gsi=null;no();};document.head.appendChild(s);});}
function gMount(mode){
  const box=$('#gBtn');if(!box||!GOOGLE_CID)return;
  if(inAppBrowser()){box.innerHTML=`<p class="keys">${t('gg_app')}</p><button class="btn sm" data-a="copyLink">📋 ${t('gg_copy')}</button>`;return;}
  box.innerHTML=`<button type="button" class="gbtn" data-a="gGo:${mode}">${GLOGO}<span>${t(mode==='link'?'gg_btnLink':'gg_btn')}</span></button>`;gLoad().catch(()=>{});
}
function gGo(mode){
  const ask=()=>{try{const c=google.accounts.oauth2.initTokenClient({client_id:GOOGLE_CID,scope:'openid email profile',prompt:'select_account',callback:r=>{if(r&&r.access_token)gCred({at:r.access_token},mode);else if(r&&r.error)accDone('ggFail');}});c.requestAccessToken();}catch(e){accDone('ggFail');}};
  if(window.google&&google.accounts&&google.accounts.oauth2)return ask();gLoad().then(ask).catch(()=>accDone('net'));
}
function gCred(cred,mode){
  if(!cred)return;loading(true);
  const send=tok=>authPost('signInWithIdp',Object.assign({postBody:(cred&&cred.at?'access_token='+cred.at:'id_token='+cred)+'&providerId=google.com',requestUri:location.origin,returnSecureToken:true,returnIdpCredential:true},tok?{idToken:tok}:{}));
  if(mode==='link')return lbAuth().then(f=>send(f.tok)).then(j=>{if(!j.idToken){const m=(j.error&&j.error.message)||'';return accDone(/ALREADY_LINKED|EMAIL_EXISTS|CREDENTIAL_ALREADY/.test(m)?'ggUsed':'ggFail');}
    const f=UI.prof.fb;f.tok=j.idToken;f.rt=j.refreshToken||f.rt;f.exp=Date.now()+(+j.expiresIn||3600)*1000;saveProf();UI.accInfo=null;stat('glink');accDone('ggLinked');}).catch(()=>accDone('net'));
  send(null).then(j=>{if(!j.idToken)return accDone(j.needConfirmation?'ggNeedPw':'ggFail');
    return fetch(LB_DB+'/users/'+j.localId+'.json?auth='+j.idToken).then(r=>r.ok?r.json():null).then(u=>{
      if(u&&u.u)return accEnter(j,{u:u.u},'in');
      // a new player: pick a username once
      UI.gNew=j;UI.accMsg='';loading(false);renderAccount();});}).catch(()=>accDone('net'));
}
function gName(){
  const j=UI.gNew,u=(($('#inUser')||{}).value||'').trim();if(!j)return;if(!/^[A-Za-z0-9_]{3,16}$/.test(u))return accDone('user');loading(true);const k=encodeURIComponent(u.toLowerCase());
  fetch(LB_DB+'/names/'+k+'.json?auth='+j.idToken).then(r=>r.ok?r.json():null).then(v=>{if(v&&v!==j.localId)return accDone('taken');
    return fetch(LB_DB+'/names/'+k+'.json?auth='+j.idToken,{method:'PUT',body:JSON.stringify(j.localId)}).then(r=>{if(!r.ok)return accDone('taken');stat('gnew');return accEnter(j,{u},'made');});}).catch(()=>accDone('net'));
}
function accLogout(){const p=UI.prof;UI.accInfo=null;UI.relog=0;cloudSync().then(()=>{p.fb={};p.pend={};p.cloudInit=1;p.wins=p.games=p.xp=p.ms=0;p.hist=[];p.histPend=[];p.passT=-1;p.name='';saveProf();UI.accMsg='out';renderAccount();renderMenu();});}
function renderLB(){
  const s=UI.lbSort||'w',p=UI.prof,me=(p.fb||{}).uid;
  const head=`<h2 class="lbh">${t('lb')}</h2><div class="row chips"><button class="chip${s==='w'?' on':''}" data-a="lbS:w">${t('lbByW')}</button><button class="chip${s==='h'?' on':''}" data-a="lbS:h">${t('lbByH')}</button></div>`,back=`<div class="row"><button class="btn big" data-a="menu">${t('back')}</button></div>`;
  if(!cloudOn()){$('#help').innerHTML=head+`<p class="keys">${t('lbOff')}</p>`+back;return;}
  const rows=UI.lbRows;
  $('#help').innerHTML=head+(rows==null?`<p class="keys">${t('lbLoad')}</p>`:rows==='err'?`<p class="bad">${t('lbErr')}</p>`:
    `<div class="lbt"><div class="lh"><span>#</span><span>${t('lbName')}</span><span>${t('rank')}</span><span>${t('wins')}</span><span>${t('lbHrs')}</span></div>`+
    rows.map((r,i)=>{const rk=r.r!=null&&r.r<=rankOf({wins:r.w})?r.r:rankOf({wins:r.w}),L=r.lv|0;return`<div class="${r.id===me?'me':''}"><span>${i+1}</span><span>${L?`<i class="lvm">${lvMini(L,r.av)}</i>`:''}${r.b?BADGE:''}${esc(r.n||'')}</span><span class="rkt ${rankCls(rk)}">${t('ranks')[rk]||''}</span><span>${r.w|0}</span><span>${hrs(r.h||0)}</span></div>`;}).join('')+'</div>'+(rows.length?'':`<p class="keys">${t('lbNone')}</p>`))+
    `<p class="keys">${t('lbYou',p.wins,hrs(p.ms||0))}</p>`+back;
}
function openLB(){
  UI.lbRows=null;renderLB();show('help');if(!cloudOn())return;const s=UI.lbSort||'w',me=(UI.prof.fb||{}).uid;
  lbPush().then(()=>fetch(LB_DB+'/lb.json?orderBy=%22'+s+'%22&limitToLast=100')).then(r=>{if(!r.ok)throw 0;return r.json();}).then(j=>{
    const a=Object.entries(j||{}).map(([id,v])=>Object.assign({id},v)).filter(r=>r&&typeof r.n==='string'&&(r.g|0)>0&&(r.id===me||(r.n.trim()&&r.n!=='دولتي'&&r.n!=='My Realm')));a.sort((x,y)=>(y[s]||0)-(x[s]||0)||(y[s==='w'?'h':'w']||0)-(x[s==='w'?'h':'w']||0));
    if((UI.lbSort||'w')===s){UI.lbRows=a;if($('#help .lbh'))renderLB();}}).catch(()=>{UI.lbRows='err';if($('#help .lbh'))renderLB();});
}
function renderRanks(){
  const p=UI.prof,rk=rankOf(p),R=t('ranks');
  const sh=rankShow(p);
  $('#help').innerHTML=`<h2>${t('allRanks')}</h2><p class="keys">${t('rkPickNote')}</p><div class="rks">${R.map((n,i)=>`<div class="${i===sh?'cur':i<=rk?'done':''} ${rankCls(i)}"><b>${n}</b><span>${i===0?'0':((i-1)*25+1)+' – '+i*25}</span>${i<=rk?(i===sh?`<em>✓ ${t('rkOn')}</em>`:`<button class="btn sm ok" data-a="rkPick:${i}">${t('rkUse')}</button>`):'<em>🔒</em>'}</div>`).join('')}</div><div class="row"><button class="btn big" data-a="account">${t('back')}</button></div>`;
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
// a password box with an eye button that shows or hides what was typed
const pwIn=(id,ph,ac)=>`<span class="pwb"><input id="${id}" dir="ltr" type="password" maxlength="64" placeholder="${ph}" autocomplete="${ac}"><button type="button" class="eye" data-a="eye:${id}" aria-label="show password">👁️</button></span>`;
function accPanel(){
  const p=UI.prof,f=p.fb||{},m=UI.accMsg?`<p class="${/^(made|in|out|mlSent|fgSent|ggLinked)$/.test(UI.accMsg)?'good':'bad'}">${t('acm_'+UI.accMsg,`<b dir="ltr">${esc(UI.mailTo||'')}</b>`)}</p>`:'';
  if(!cloudOn())return`<p class="keys">${t('accNote')}</p>`;
  const userIn=(ph,ac)=>`<input id="inUser" dir="ltr" maxlength="${ac==='email'?80:16}" placeholder="${ph}" autocomplete="${ac}" autocapitalize="none" spellcheck="false">`;
  // a new Google player picks a username once
  if(UI.gNew)return`<div class="accb"><h3>${t('gg_pick')}</h3><p class="keys">${t('gg_pickD')}</p><div class="accf">${userIn(t('ac_user'),'username')}</div>${m}<div class="row"><button class="btn ok" data-a="gName">${t('gg_pickGo')}</button><button class="btn" data-a="gCancel">${t('back')}</button></div></div>`;
  if(f.user&&!UI.relog){
    const I=UI.accInfo;if(!I)setTimeout(accInfoLoad,0);
    const mail=!I?'':realMail(I.email)?`<p class="mlok">📧 ${t('ml_on',`<b dir="ltr">${esc(I.email)}</b>`)}</p>`:I.pw?`<div class="mlb"><h3>📧 ${t('ml_t')}</h3><p class="keys">${t('ml_d')}</p><div class="accf"><input id="inMail" type="email" dir="ltr" maxlength="80" placeholder="name@gmail.com" autocomplete="email" autocapitalize="none" spellcheck="false">${pwIn('inPass2',t('ml_pw'),'current-password')}</div><button class="btn sm ok" data-a="mailLink">${t('ml_go')}</button></div>`:'';
    const gg=GOOGLE_CID&&I?(I.google?`<p class="mlok">✅ ${t('gg_on')}</p>`:`<div class="mlb"><h3>${t('gg_link')}</h3><div id="gBtn"></div></div>`):'';if(GOOGLE_CID&&I&&!I.google)setTimeout(()=>gMount('link'),0);
    return`<div class="accb"><p>${t('ac_signed',`<b dir="ltr">${esc(f.user)}</b>`)}</p><p class="keys">${t('ac_signedNote')}</p>${m}${mail}${gg}<button class="btn sm" data-a="accOut">${t('ac_out')}</button></div>`;
  }
  if(GOOGLE_CID)setTimeout(()=>gMount('in'),0);
  return`<div class="accb"><h3>${t('ac_title')}</h3>${UI.relog?`<p class="bad">${t('ac_relog')}</p>`:''}<p class="keys">${t('ac_note')}</p><div class="accf">${userIn(t('ac_userIn'),'email')}${pwIn('inPass',t('ac_pass'),'current-password')}</div>${m}<div class="row"><button class="btn ok" data-a="accReg">${t('ac_reg')}</button><button class="btn" data-a="accIn">${t('ac_in')}</button></div><button class="lnkb" data-a="accForgot">🔑 ${t('fg_btn')}</button>${GOOGLE_CID?`<div class="gor"><span>${t('gg_or')}</span></div><div id="gBtn"></div>`:''}</div>`;
}
function lvCard(p){
  const L=lvInfo(lifeXp(p)),nx=LVSK.find(e=>e[0]>L.lv),nm=p.name||(p.fb||{}).user||t('defName');
  return`<div class="lvcard"><div class="lvbig">${lvAv(p,'',112)}</div><div class="lvi"><b>${t('lvL',L.lv)}</b><div class="lvbar"><u style="width:${Math.round(L.cur/L.need*100)}%"></u><span dir="ltr">${fmt(L.cur)} / ${fmt(L.need)}</span></div>
    <small>${nx?t('lvNext',nx[0],t('sk_'+nx[2])):L.lv<1000?t('lvLook'):t('lvMax')}</small></div></div>
  <div class="lvsk">${LVSK.map(([l,ty,id])=>`<div class="${L.lv>=l?'got':''}"><img src="${skinPreview(ty,id)}" alt=""><b>${t('sk_'+id)}</b><small>${L.lv>=l?'✓ '+t('bpGot'):'🔒 '+t('lvS',l)}</small></div>`).join('')}</div>
  <h3 class="avh">${t('avPick')}</h3><div class="avg">${AVATARS.map((a,i)=>`<button class="${(p.avatar|0)===i?'on':''}" data-a="avPick:${i}" aria-label="picture ${i+1}">${avPic(i,52)}</button>`).join('')}</div>
  <div class="lvset"><span>${t('lvShowT')}</span><div class="chips"><button class="chip${!p.hideLv?' on':''}" data-a="lvShow:1">${t('lvShow1')}</button><button class="chip${p.hideLv?' on':''}" data-a="lvShow:0">${t('lvShow0')}</button></div></div>`;
}
function renderAccount(){
  const p=UI.prof,rk=rankOf(p);
  $('#help').innerHTML=`<h2>${t('account')}</h2><div class="opts" style="grid-template-columns:minmax(0,1fr);width:min(420px,100%)">${!p.name?`<p class="nmask">✍️ ${t('nameAsk')}</p>`:''}<label class="fld${!p.name?' nmglow':''}"><h3>${t('accName')}</h3><input id="inName" maxlength="18" value="${esc(p.name)}" placeholder="${t('defName')}" autocomplete="off"></label><div class="row namer"><button class="btn sm" id="nameUndo" data-a="nameUndo" disabled>${t('nameUndo')}</button><button class="btn sm ok" id="nameSave" data-a="nameSave" disabled>${t('nameSave')}</button></div><p class="good" id="nameMsg"></p></div>
  ${lvCard(p)}
  <div class="stats" style="width:min(420px,100%);grid-template-columns:repeat(5,minmax(0,1fr))">${[[t('rank'),`<span class="rkt ${rankCls(rankShow(p))}">${t('ranks')[rankShow(p)]}</span>`],[t('x_xp'),p.xp],[t('accGames'),p.games],[t('wins'),p.wins],[t('lbHrs'),hrs(p.ms||0)]].map(x=>`<div><small>${x[0]}</small><b>${x[1]}</b></div>`).join('')}</div>
  <p class="keys">${rk<40?t('accNext',rk*25+1-p.wins,t('ranks')[rk+1]):''}</p>${accPanel()}<div class="row"><button class="btn" data-a="ranks">${t('allRanks')}</button><button class="btn big" data-a="menu">${t('back')}</button></div>`;
}
function renderNews(latest){
  // one update per day: everything released on the same date shows as a single entry, numbered by the day's first version
  const D=[];for(const e of LOG){const last=D[D.length-1];if(last&&last.d===e.d){last.v=e.v;last.ar=e.ar.concat(last.ar);last.en=(e.en||e.ar).concat(last.en);}else D.push({v:e.v,d:e.d,ar:e.ar.slice(),en:(e.en||e.ar).slice()});}
  const L=(latest?D.slice(0,1):D.slice(0,10));
  $('#help').innerHTML=`<h2>${t(latest?'newsNew':'news')}</h2><div class="nl">${L.map(e=>`<div><b>${t('ver')} ${e.v}</b><small dir="ltr">${e.d}</small><ul>${(e[UI.lang]||e.ar).map(x=>`<li>${x}</li>`).join('')}</ul></div>`).join('')}</div><div class="row"><button class="btn big" data-a="menu">${t('ok')}</button></div>`;
}
function renderFac(){
  const e=$('#fpick'),p=UI.prof;{const ap=$('#app');if(ap)ap.classList.toggle('spawning',UI.phase==='spawn');}if(!e)return;e.hidden=UI.phase!=='spawn';if(e.hidden)return;
  // a compact grid: an icon and a name per realm, and only the chosen one's main perk underneath
  const FI={hawks:'🦅',bastion:'🏰',merchants:'💰',mariners:'⚓',scholars:'📜',horde:'🐺'};
  e.innerHTML=`<h4>${t('faction')}</h4><div class="fgrid">${FKEYS.map(f=>`<button class="fc${p.fac===f?' on':''}" data-a="fac:${f}" style="--fc:${FAC[f].c}"><span>${FI[f]||'⚑'}</span><b>${t('f_'+f)}</b></button>`).join('')}</div><p class="fpk">✨ ${t('fp_'+p.fac)}</p>`;
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
  addStat('xp',-cost);addStat('xps',cost);p.passT=on?p.passT+1:0;saveProf();sfx('era');toast(on?t('bpGotTier',p.passT):t('bpOpened'),'prop',3500);cloudSync();
  // redraw without losing where the player had scrolled to
  const h=$('#help'),hs=h?h.scrollTop:0,ws=window.scrollY;renderPass();if(h)h.scrollTop=hs;window.scrollTo(0,ws);
}
const canBuy=p=>{const n=p.passT==null?-1:p.passT;return n<0?(p.xp|0)>=PASS_AT:n<PASS.length&&(p.xp|0)>=PASS_STEP;};
const owns=(p,t,k)=>{const L=lvInfo(lifeXp(p)).lv;for(const e of LVSK)if(e[1]===t&&e[2]===k)return L>=e[0];const n=passTier(p);for(let j=0;j<n;j++)if(PASS[j][0]===t&&PASS[j][1]===k)return true;return false;};
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
  <div class="bpg free">${PASS.map(([ty,id],j)=>{const got=j<n,eq=k[ty]===id;return`<div class="bpc${got?' got':''}${eq?' eq':''}${on&&j===n?(xp>=PASS_STEP?' can':' cant'):''}"><small>${j+1}</small><img src="${skinPreview(ty,id)}" alt=""><b>${t('sk_'+id)}</b><span>${t(ty==='pat'?'bpPat':'bpBld')}</span>${got?`<em class="ok">✓ ${t('bpGot')}</em>`:on&&j===n?`<button class="btn sm ok" data-a="bpBuy">${t('bpClaim')} · ${fmt(PASS_STEP)}</button>`:`<em>🔒 ${fmt(PASS_STEP)}</em>`}</div>`;}).join('')}</div>
  `;
}
// customization: equip what you have unlocked
function renderSkins(){
  const p=UI.prof,k=p.skin||{},n=passTier(p),LVN=lvInfo(lifeXp(p)).lv,sec=(ty,lab)=>{const L=PASS.slice(0,n).filter(e=>e[0]===ty).concat(LVSK.filter(e=>e[1]===ty&&LVN>=e[0]).map(e=>[e[1],e[2]]));return`<h3>${lab}</h3><div class="bpg free"><div class="bpc got${!k[ty]?' eq':''}"><div class="none">✕</div><b>${t('skNone')}</b><button class="btn sm${!k[ty]?'':' ok'}" data-a="skin:${ty}:">${!k[ty]?'✓ '+t('bpOn'):t('bpWear')}</button></div>${L.map(([,id])=>{const eq=k[ty]===id;return`<div class="bpc got${eq?' eq':''}"><img src="${skinPreview(ty,id)}" alt=""><b>${t('sk_'+id)}</b><button class="btn sm${eq?'':' ok'}" data-a="skin:${ty}:${eq?'':id}">${eq?'✓ '+t('bpOn'):t('bpWear')}</button></div>`;}).join('')}</div>`;};
  const bdg=hasPass(p)?`<h3>${t('bdgT')}</h3><div class="bdgrow"><span class="bdgshow">${BADGE}<b>${esc(p.name||t('defName'))}</b></span><div class="chips"><button class="chip${!p.hideBadge?' on':''}" data-a="badge:1">${t('bdgOn')}</button><button class="chip${p.hideBadge?' on':''}" data-a="badge:0">${t('bdgOff')}</button></div></div><p class="keys">${t('bdgNote')}</p>`:'';
  $('#help').innerHTML=`${mtabs('skins')}<h2>🎨 ${t('tSkins')}</h2>${bdg}${n||LVN>=25?`<p class="keys">${t('skNote')}</p>${sec('pat',t('bpPat'))}${sec('bld',t('bpBld'))}`:`<p class="keys">${t('skEmpty')}</p>`}`;
}
// ── admins: the root account plus anyone it (or another admin) grants; checked against the database, which enforces it ──
const ADMIN_ROOT='saadsd';
// supporting the developer: 10 riyals through PayPal (Apple Pay, cards or PayPal) unlocks the whole season once the owner confirms it
const PAY_LINK='https://www.paypal.com/ncp/payment/C7USHQMD77V8J',DONATE_LINK='https://www.paypal.com/ncp/payment/AT6PCFTSNDDR2',TIKTOK='https://www.tiktok.com/@sijal_2',INSTA='https://www.instagram.com/sijal_202';
// the game's social accounts, as big cards
function renderSocial(){
  const TT='<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path fill="currentColor" d="M16.6 3c.4 2.2 1.8 3.7 4 3.9v3.1c-1.5 0-2.8-.4-4-1.2v6.3c0 3.4-2.6 5.9-5.8 5.9S5 18.4 5 15.1c0-3.4 2.9-6 6.4-5.6v3.2c-1.6-.4-3.2.7-3.2 2.4 0 1.4 1.1 2.5 2.6 2.5s2.6-1.1 2.6-2.8V3h3.2z"/></svg>',
    IG='<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.3" fill="currentColor"/></svg>';
  $('#help').innerHTML=`<div class="socH"><h2>📱 ${t('d_follow')}</h2><p>${t('socD')}</p></div><div class="socs">
    <a class="soc tt" href="${TIKTOK}" target="_blank" rel="noopener">${TT}<span><b>${t('d_tt')}</b><small dir="ltr">@sijal_2</small></span></a>
    <a class="soc ig" href="${INSTA}" target="_blank" rel="noopener">${IG}<span><b>${t('d_ig')}</b><small dir="ltr">@sijal_202</small></span></a></div>
  <div class="row"><button class="btn" data-a="menu">${t('back')}</button></div>`;
}
const SUPPORT_SAR=3;// the Season Zero pass price, in US dollars (PayPal link)
// ── game statistics for the owner: anonymous counters per Saudi day and all-time, and who has the game open right now ──
const sDay=o=>new Date(Date.now()+3*36e5-(o||0)*864e5).toISOString().slice(0,10),sHour=()=>new Date(Date.now()+3*36e5).getUTCHours();
const SQ={q:{},ms:0};
function stat(k,n){if(cloudOn())SQ.q[k]=(SQ.q[k]||0)+(n==null?1:n);}
function statFlush(keep){if(!cloudOn())return;const q=SQ.q;if(SQ.ms>=1000){q.ms=(q.ms||0)+Math.floor(SQ.ms/1000);SQ.ms%=1000;}const ks=Object.keys(q);if(!ks.length)return;SQ.q={};const d=sDay(),b={};
  for(const k of ks){const v={'.sv':{increment:q[k]}};b['d/'+d+'/'+k]=v;b['t/'+k]=v;}
  fetch(LB_DB+'/stats.json',{method:'PATCH',body:JSON.stringify(b),keepalive:!!keep}).catch(()=>{});}
function statPing(){if(!cloudOn()||document.hidden)return;const g=G,s=UI.phase==='play'&&g&&!g.o.demo&&!g.over?(NET.on?'o':'g'):'m';
  fetch(LB_DB+'/stats/on/'+UI.prof.did+'.json',{method:'PUT',body:JSON.stringify({t:{'.sv':'timestamp'},s,m:UI.mob?1:0})}).catch(()=>{});}
function statBoot(){const p=UI.prof;if(!p.did){p.did=(Math.random().toString(36).slice(2)+'0000000000').slice(0,10);if(!p.seen)stat('new');}
  stat('visits');stat('h'+String(sHour()).padStart(2,'0'));const d=sDay();if(p.sDay!==d){p.sDay=d;stat('uniq');stat(UI.mob?'u_m':'u_p');}saveProf();
  setTimeout(statFlush,4000);setInterval(statFlush,30000);setTimeout(statPing,5000);setInterval(statPing,60000);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)statFlush(true);else statPing();});}
function adminCheck(){
  const p=UI.prof,f=p.fb||{};if(!cloudOn()||!f.user)return;const was=UI.admin;
  lbAuth().then(f=>{fetch(LB_DB+'/names/'+encodeURIComponent(f.user.toLowerCase())+'.json?auth='+f.tok,{method:'PUT',body:JSON.stringify(f.uid)}).catch(()=>{});
    UI.owner=!!(ADMIN_ROOT&&f.user.toLowerCase()===ADMIN_ROOT);if(UI.owner){if(!p.ownSet)fetch(LB_DB+'/owner.json?auth='+f.tok,{method:'PUT',body:JSON.stringify(f.uid)}).then(r=>{if(r.ok){p.ownSet=1;saveProf();}}).catch(()=>{});return true;}return fetch(LB_DB+'/admins/'+f.uid+'.json?auth='+f.tok).then(r=>r.ok?r.json():null).then(v=>!!v);})
  .then(a=>{UI.admin=!!a;if(UI.admin!==!!was)renderMenu();if(UI.owner&&UI.screen==='help'&&$('#help .bpg'))renderPass();}).catch(()=>{});
}
function admReq(path,o){return lbAuth().then(f=>fetch(LB_DB+path+(path.includes('?')?'&':'?')+'auth='+f.tok,o||{}).then(r=>{if(!r.ok)throw 0;return r.json();}));}
function openAdmin(){if(!UI.admin)return;UI.admLb=null;UI.admList=null;if(UI.owner)admStats();renderAdmin();show('help');
  admReq('/admins.json').then(j=>{UI.admList=j||{};renderAdmin();}).catch(()=>{UI.admList='err';renderAdmin();});
  fetch(LB_DB+'/lb.json').then(r=>r.json()).then(j=>{UI.admLb=Object.entries(j||{}).map(([id,v])=>Object.assign({id},v)).sort((a,b)=>(b.w|0)-(a.w|0));renderAdmin();}).catch(()=>{});}
function admStats(){UI.admSt=null;statFlush();
  Promise.all([admReq('/stats/d.json?orderBy=%22$key%22&limitToLast=14'),admReq('/stats/t.json'),admReq('/stats/on.json'),admReq('/names.json?shallow=true').catch(()=>null)]).then(([d,tt,on,nm])=>{
    const now=Date.now(),O={now:0,g:0,o:0,m:0,mob:0,day:0};const old={};
    for(const[id,v]of Object.entries(on||{})){const a=now-(v&&v.t||0);if(a<150000){O.now++;O[v.s]=(O[v.s]||0)+1;if(v.m)O.mob++;}if(a<864e5)O.day++;if(a>3*864e5)old[id]=null;}
    if(Object.keys(old).length)admReq('/stats/on.json',{method:'PATCH',body:JSON.stringify(old)}).catch(()=>{});
    UI.admSt={d:d||{},t:tt||{},on:O,acc:nm?Object.keys(nm).length:null,at:now};if(UI.screen==='help'&&$('#help .stp'))renderAdmin();}).catch(()=>{UI.admSt='err';if($('#help .stp'))renderAdmin();});}
function statsHtml(){const S=UI.admSt;
  if(S==null)return`<div class="hp stp"><h3>📊 ${t('stT')}</h3><p class="keys">${t('lbLoad')}</p></div>`;
  if(S==='err')return`<div class="hp stp"><h3>📊 ${t('stT')}</h3><p class="bad">${t('stRules')}</p><div class="row"><button class="btn sm" data-a="admSt">${t('stRef')}</button></div></div>`;
  const D=S.d[sDay()]||{},Y=S.d[sDay(1)]||{},T=S.t,n=v=>(v|0).toLocaleString('en'),hr=v=>((v|0)/3600).toFixed((v|0)<36000?1:0);
  const cmp=(a,b)=>{a|=0;b|=0;if(!b)return'';const p=Math.round((a-b)/b*100);return`<em class="${p>=0?'up':'dn'}">${p>=0?'▲':'▼'} ${Math.abs(p)}%</em>`;};
  const tile=(ic,l,v,sub)=>`<div class="stc2"><small>${ic} ${l}</small><b>${v}</b>${sub?`<span>${sub}</span>`:''}</div>`;
  const ty=o=>[['q','quick'],['c','custom'],['d','daily'],['o','online']].map(([k,l])=>`<span>${t(l)}: <b>${n(o['g_'+k])}</b></span>`).join('');
  const days=[];for(let i=13;i>=0;i--){const k=sDay(i);days.push([k,S.d[k]||{}]);}const mx=Math.max(1,...days.map(x=>x[1].uniq|0));
  const hrs=[];for(let h=0;h<24;h++)hrs.push(D['h'+String(h).padStart(2,'0')]|0);const hm=Math.max(1,...hrs);
  const mob=(D.u_m|0)+(D.u_p|0),O=S.on;
  // this week against the week before, and the averages that show how people play
  const sum=(a,b,k)=>{let v=0;for(let i=a;i<b;i++)v+=(S.d[sDay(i)]||{})[k]|0;return v;};
  const W={u:sum(0,7,'uniq'),g:sum(0,7,'games'),ms:sum(0,7,'ms'),nw:sum(0,7,'new'),w:sum(0,7,'wins'),l:sum(0,7,'loss'),gm:sum(0,7,'u_m'),gp:sum(0,7,'u_p'),go:sum(0,7,'g_o'),sg:sum(0,7,'signup')},PW={u:sum(7,14,'uniq'),g:sum(7,14,'games'),ms:sum(7,14,'ms')};
  const avgMin=W.g?W.ms/W.g/60:0,wr=W.w+W.l?W.w/(W.w+W.l):0,ret=W.u?Math.max(0,W.u-W.nw)/W.u:0,ppv=W.u?W.g/W.u:0;
  let pk=-1,pv=0;for(let h=0;h<24;h++){const v=sum(0,7,'h'+String(h).padStart(2,'0'));if(v>pv){pv=v;pk=h;}}
  const tips=statTips({W,PW,avgMin,wr,ret,ppv,pk,days:Object.keys(S.d).length});
  return`<div class="hp stp"><div class="sth"><h3>📊 ${t('stT')}</h3><button class="btn sm" data-a="admSt">↻ ${t('stRef')}</button></div>
  <div class="stnow"><i></i><b>${n(O.now)}</b> ${t('stNow')}<small>${t('stIn',n(O.g),n(O.o),n(O.m))} · ${t('stDay',n(O.day))}</small></div>
  <h4>${t('stToday')}</h4><div class="stg">
  ${tile('👀',t('stVis'),n(D.visits),cmp(D.visits,Y.visits))}${tile('👤',t('stUniq'),n(D.uniq),cmp(D.uniq,Y.uniq))}${tile('✨',t('stNew'),n(D.new),cmp(D.new,Y.new))}
  ${tile('⚔️',t('stGames'),n(D.games),cmp(D.games,Y.games))}${tile('🏆',t('stWL'),n(D.wins)+' / '+n(D.loss),'')}${tile('⏱️',t('stHrs'),hr(D.ms),cmp(D.ms,Y.ms))}
  ${tile('📝',t('stSign'),n(D.signup),'')}${tile('💜',t('stSup'),n(D.sup),'')}${tile('📱',t('stMob'),mob?Math.round((D.u_m|0)/mob*100)+'%':'—',mob?t('stPc',Math.round((D.u_p|0)/mob*100)):'')}
  </div><div class="stty">${ty(D)}</div>
  <h4>${t('stWeek')}</h4><div class="stg">
  ${tile('👤',t('stUniq'),n(W.u),cmp(W.u,PW.u))}${tile('⚔️',t('stGames'),n(W.g),cmp(W.g,PW.g))}${tile('⏱️',t('stHrs'),hr(W.ms),cmp(W.ms,PW.ms))}
  ${tile('🔁',t('stRet'),Math.round(ret*100)+'%',t('stRetS'))}${tile('🎮',t('stPpv'),ppv.toFixed(1),t('stPpvS'))}${tile('⌛',t('stAvg'),avgMin.toFixed(1),t('stAvgS'))}
  ${tile('🏆',t('stWr'),W.w+W.l?Math.round(wr*100)+'%':'—','')}${tile('🕘',t('stPeak'),pk<0?'—':pk+':00','')}${tile('🌐',t('stOnl'),W.g?Math.round(W.go/W.g*100)+'%':'—','')}
  </div>
  <div class="sttip"><h4>💡 ${t('stTips')}</h4>${tips.map(x=>`<div class="tip ${x[0]}"><b>${x[1]}</b><p>${x[2]}</p></div>`).join('')}</div>
  <h4>${t('st14')}</h4><div class="stb">${days.map(([k,v])=>`<div title="${k}"><span>${n(v.uniq)}</span><i style="height:${Math.round((v.uniq|0)/mx*100)}%"></i><small>${k.slice(8)}</small></div>`).join('')}</div>
  <p class="keys">${t('st14n')}</p>
  <h4>${t('stHours')}</h4><div class="stb sth2">${hrs.map((v,h)=>`<div title="${h}:00 · ${v}"><i style="height:${Math.round(v/hm*100)}%"></i><small>${h%3?'':h}</small></div>`).join('')}</div>
  <h4>${t('stAll')}</h4><div class="stg">
  ${tile('👀',t('stVis'),n(T.visits),'')}${tile('👥',t('stPlayers'),n(T.new),'')}${tile('⚔️',t('stGames'),n(T.games),'')}
  ${tile('⏱️',t('stHrs'),hr(T.ms),'')}${tile('🔐',t('stAcc'),S.acc==null?'—':n(S.acc),'')}${tile('🏅',t('stLb'),UI.admLb?n(UI.admLb.length):'—','')}
  ${tile('🏆',t('stWL'),n(T.wins)+' / '+n(T.loss),'')}${tile('📝',t('stSign'),n(T.signup),'')}${tile('💜',t('stSup'),n(T.sup),'')}
  </div><div class="stty">${ty(T)}</div><p class="keys">${t('stNote')}</p></div>`;}
// plain advice from the numbers: what to do when visits are low, players do not come back, or battles are too short
function statTips(a){const W=a.W,T=[],L=TX[UI.prof.lang]&&TX[UI.prof.lang].tips?TX[UI.prof.lang].tips:TX.ar.tips,f=(k,...v)=>{let s=L[k];v.forEach((x,i)=>s=s.split('{'+i+'}').join(x));return s;};
  const add=(lv,k,...v)=>T.push([lv,f(k+'T',...v),f(k+'D',...v)]);const post=a.pk<0?'9':String((a.pk+23)%24);
  if(a.days<2)add('info','new');
  const daily=W.u/7;
  if(daily<30)add('bad','low',Math.round(daily),post);
  else if(daily<150)add('mid','grow',Math.round(daily),post);
  if(a.PW.u>=20&&W.u<a.PW.u*.8)add('bad','drop',Math.round((1-W.u/a.PW.u)*100));
  if(a.PW.u>=20&&W.u>a.PW.u*1.3)add('good','up',Math.round((W.u/a.PW.u-1)*100));
  if(W.u>=15&&a.ret<.25)add('mid','ret',Math.round(a.ret*100));
  if(W.u>=15&&a.ppv<.6)add('mid','ppv');
  if(W.g>=15&&a.avgMin<4)add('mid','short',a.avgMin.toFixed(1));
  if(W.w+W.l>=15&&a.wr<.2)add('mid','hard',Math.round(a.wr*100));
  if(W.w+W.l>=15&&a.wr>.8)add('mid','easy',Math.round(a.wr*100));
  const mb=W.gm+W.gp;if(mb>=15&&W.gm/mb>.7)add('info','mob',Math.round(W.gm/mb*100));if(mb>=15&&W.gp/mb>.5)add('info','pc',Math.round(W.gp/mb*100));
  if(W.g>=30&&W.go/W.g<.05)add('info','onl');
  if(W.nw>=20&&W.sg/W.nw<.05)add('info','acc');
  if(a.pk>=0&&W.u>=15)add('info','peak',a.pk+':00',post+':00');
  if(!T.some(x=>x[0]==='bad'||x[0]==='mid'))add('good','fine');
  return T;}
function renderAdmin(){
  const L=UI.admList,B=UI.admLb,p=UI.prof;
  $('#help').innerHTML=`<h2>${UI.owner?'👑 '+t('owner'):'🛠️ '+t('admin')}</h2>${UI.owner?statsHtml():''}
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
// the instant pass: PayPal's own buttons inside the game; our server (worker/index.js) makes the order for this account and, once paid, unlocks the season
// PayPal's script is fetched ahead of time (soon after start, and when the season tab opens), so the buttons are there the moment the page opens
function ppPrep(){
  if(UI.ppReady)return UI.ppReady;const f=UI.prof.fb||{};if(!f.user||!cloudOn())return Promise.resolve(null);
  return UI.ppReady=fetch('/api/pay-config').then(r=>r.ok?r.json():null).then(c=>{if(!c||!c.clientId)return null;if(window.paypal)return c;
    return new Promise(ok=>{const sc=document.createElement('script');sc.src='https://www.paypal.com/sdk/js?client-id='+encodeURIComponent(c.clientId)+'&currency=USD&intent=capture&components=buttons&enable-funding=card';sc.onload=()=>ok(c);sc.onerror=()=>{UI.ppReady=null;ok(null);};document.head.appendChild(sc);});}).catch(()=>{UI.ppReady=null;return null;});
}
function ppMount(){
  const w=$('#ppWrap'),box=$('#ppBox'),f=UI.prof.fb||{};if(!w||!box||!f.user||!cloudOn())return;
  // shown at once with a loading line; hidden only if payments turn out to be off
  w.hidden=false;if(!window.paypal)box.innerHTML='<div class="ppsk y"></div><div class="ppsk d"></div>';
  const msg=(k,bad,code)=>{const m=$('#ppMsg');if(m){m.textContent=t(k)+(code?' ('+code+')':'');m.className='ppm'+(bad?' bad':' good');}if(code)stat('pperr_'+String(code).slice(0,5));};
  ppPrep().then(c=>{if(!c||!window.paypal){w.hidden=true;return;}
    const go=()=>{if(!window.paypal||!$('#ppBox'))return;$('#ppBox').innerHTML='';w.hidden=false;const alt=$('.ppalt');if(alt)alt.hidden=false;
      paypal.Buttons({style:{layout:'vertical',shape:'pill',label:'pay',height:44},
        createOrder:()=>lbAuth().then(f=>fetch('/api/order',{method:'POST',body:JSON.stringify({tok:f.tok})})).then(r=>r.json()).then(j=>{if(!j||!j.id)throw 0;stat('ppstart');return j.id;}),
        onApprove:d=>{msg('ppWait');return lbAuth().then(f=>fetch('/api/pass',{method:'POST',body:JSON.stringify({order:d.orderID,tok:f.tok})})).then(r=>r.json()).then(j=>{
          if(j&&j.ok){stat('ppdone');statFlush();msg('ppOk');cloudSync().then(()=>{if(UI.screen==='help'&&$('#ppWrap'))$('#help').innerHTML=`<h2>💜</h2><p class="best">${t('supOn')}</p><div class="row"><button class="btn big ok" data-a="pass">${t('ok')}</button></div>`;});}
          else msg(j&&j.why==='unpaid'?'ppUnpaid':'ppFail',1,j&&j.why||'x');}).catch(()=>msg('ppFail',1,'net'));},
        onCancel:()=>msg('ppCancel',1),onError:e=>msg('ppFail',1,UI.relog?'login':'sdk')}).render('#ppBox').catch(()=>{});};
    go();});
}
// the main menu's support: any amount, no account needed and nothing to unlock; the Season Zero pass has its own page
function renderDonate(){
  $('#help').innerHTML=`<div class="socH"><h2>💛 ${t('dnT')}</h2><p>${t('dnD')}</p></div>
  <div class="hp sups"><a class="btn big ok paybtn" href="${DONATE_LINK}" target="_blank" rel="noopener" data-a="donPay">💛 ${t('dnBtn')}</a><div class="payl"><span>Apple Pay</span><span>VISA</span><span>Mastercard</span><span>PayPal</span></div><p class="keys">${t('dnNote')}</p></div>
  <div class="row"><button class="btn" data-a="menu">${t('back')}</button></div>`;
}
function renderSupport(){
  const p=UI.prof,f=p.fb||{};
  $('#help').innerHTML=`<h2>💜 ${t('supT',SUPPORT_SAR)}</h2><p class="keys">${t('supD')}</p>
  ${!f.user?`<div class="hp"><p>${t('supNeedAcc')}</p><div class="row"><button class="btn ok" data-a="account">${t('account')}</button></div></div>`:`<div class="hp sups ppi" id="ppWrap" hidden><h3>⚡ ${t('ppT')}</h3><p class="keys">${t('ppD',SUPPORT_SAR)}</p><div id="ppBox"></div><p class="ppm" id="ppMsg"></p></div><div class="hp trust"><h3>🛡️ ${t('trT')}</h3><ul>${t('trL').map(x=>`<li>${x.replace('{0}',SUPPORT_SAR)}</li>`).join('')}</ul></div><div class="hp sups">
    <h3 class="ppalt" hidden>${t('ppAlt')}</h3><p><b>1.</b> ${t('supStep1',SUPPORT_SAR)}</p><a class="btn big ok paybtn" href="${PAY_LINK}" target="_blank" rel="noopener" data-a="supPay">💳 ${t('supPay')}</a><div class="payl"><span>Apple Pay</span><span>VISA</span><span>Mastercard</span><span>PayPal</span></div>
    <p><b>2.</b> ${t('supStep2')}</p><input id="supMail" type="email" maxlength="80" dir="ltr" autocapitalize="none" spellcheck="false" placeholder="name@gmail.com">
    <p><b>3.</b> ${t('supStep3')}</p><input id="supUser" maxlength="16" dir="ltr" autocapitalize="none" autocomplete="off" spellcheck="false" placeholder="${t('ac_user')}" value="${esc(f.user||'')}">
    <p><b>4.</b> ${t('supStep4')}</p><button class="btn big" data-a="supSend">${t('supSend')}</button></div>`}
  <div class="row"><button class="btn" data-a="${UI.supFrom==='menu'?'menu':'pass'}">${t('back')}</button></div>`;
}
function supSend(){
  const p=UI.prof,f=p.fb||{},em=(($('#supMail')||{}).value||'').trim().toLowerCase(),us=(($('#supUser')||{}).value||'').trim();if(!f.user)return;
  if(!isMail(em))return err('supMail');if(!/^[A-Za-z0-9_]{3,16}$/.test(us))return err('admUser');if(us.toLowerCase()!==f.user.toLowerCase())return err('supUserBad');if(!/^https?:/.test(location.protocol))return err('sgSite');
  if(Date.now()-(p.supAt||0)<6e4)return err('supWait');loading(true);
  fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({access_key:SUGGEST_KEY,subject:'Sijal support: '+f.user,from_name:p.name||f.user,username:f.user,amount:SUPPORT_SAR+' USD (PayPal)',paypal_email:em,message:'Support claim · username: '+f.user+' · paid with PayPal/card, payer email: '+em+' · amount: $'+SUPPORT_SAR})})
  .then(r=>r.json()).then(j=>{loading(false);if(!j||!j.success)throw 0;stat('sup');statFlush();p.supAt=Date.now();saveProf();$('#help').innerHTML=`<h2>💜</h2><p class="best">${t('supThanks')}</p><div class="row"><button class="btn big" data-a="${UI.supFrom==='menu'?'menu':'pass'}">${t('ok')}</button></div>`;}).catch(()=>{loading(false);err('sgFail');});
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
  UI.newSet=null;UI.newArmy=null;const p=UI.prof;UI.mType=o.quick?'q':'c';if(p.size<0)p.size=UI.mob?0:1;if(!p.botsN||(!p.b2&&(p.botsN===10||p.botsN===14)))p.botsN=UI.mob?16:20;p.b2=1;saveProf();
  // quick battle: a different world shape every time
  const TY=Object.keys(TX.ar.types);let qt=p.type;if(o.quick){do{qt=TY[(Math.random()*TY.length)|0];}while(TY.length>1&&qt===UI.lastQType);UI.lastQType=qt;}
  let opt={w:SIZES[p.size][0],h:SIZES[p.size][1],seed:(Math.random()*2**31)|0,type:qt,bots:o.quick?quickBots(p):clamp(p.botsN|0,6,80),xpm:xpMul(p),minors:o.quick?'auto':tribesN(),diff:p.diff,faction:p.fac};
  opt.skin=mySkin();const ch=p.cheat||{};if(!o.quick&&!o.daily&&!o.same&&!NET.on&&CHEATS.some(k=>ch[k]))opt.cheats=Object.assign({},ch);
  if(o.daily){const key=dayKey();opt={skin:mySkin(),w:540,h:340,seed:key,type:Object.keys(TX.ar.types)[key%9],bots:14,diff:2,faction:p.fac,daily:key,mod:dMod(key)};}
  if(o.same&&UI.lastOpt&&UI.lastOpt.daily){renderDaily();show('help');return;}
  if(o.same&&UI.lastOpt)opt=Object.assign({},UI.lastOpt,{seed:UI.lastOpt.daily?UI.lastOpt.seed:(Math.random()*2**31)|0});
  UI.lastOpt=opt;loading(true);
  // build the world step by step so the bar moves: the map (most of the wait), then the realms, then the drawing
  {const it=genMapSteps(opt);loadPct(0);
    const step=()=>{const t0=performance.now();let r;do{r=it.next();}while(!r.done&&performance.now()-t0<45);
      if(!r.done){loadPct(r.value*.8);return setTimeout(step,0);}
      loadPct(.85);setTimeout(()=>{G=newGame(Object.assign({},opt,{M:r.value}));loadPct(.93);setTimeout(()=>{prep(G);loadPct(1);UI.phase='spawn';UI.paused=false;UI.speed=1;buildHud();show(null);hint(t('spawn'),true);loading(false);if(opt.cheats)toast(t('cheatOn'),'prop',5000);},0);},0);};
    setTimeout(step,40);}
}
// battle history: the last 40 games, newest first; kept in the account (users/<uid>/hist), so every device shows the same log
function histMerge(p,cloud,sent,uid,tok){
  const gone=new Set(sent.map(e=>e.d));p.histPend=(p.histPend||[]).filter(e=>!gone.has(e.d));
  const all=new Map();for(const e of (p.hist||[]))all.set(e.d,e);const C=cloud&&typeof cloud==='object'?Object.values(cloud).filter(e=>e&&e.d):[];for(const e of C)all.set(e.d,e);
  p.hist=[...all.values()].sort((a,b)=>b.d-a.d).slice(0,40);
  // keep only the newest 40 in the cloud too
  if(C.length>40){const keep=new Set(p.hist.map(e=>e.d)),cut={};for(const e of C)if(!keep.has(e.d))cut['hist/h'+e.d]=null;fetch(LB_DB+'/users/'+uid+'.json?auth='+tok,{method:'PATCH',body:JSON.stringify(cut)}).catch(()=>{});}
  if(UI.screen==='help'&&$('.hlist'))renderHist();
}
function histAdd(g,res,xp){
  const p=UI.prof,me=g.nations[g.human];if(!me)return;const si=SIZES.findIndex(s=>s[0]===g.W&&s[1]===g.H);
  const e={d:Date.now(),r:res,xp:xp|0,m:g.o.daily?'d':NET.on?'o':UI.mType||'c',s:si,f:g.o.diff|0,t:Math.round(g.tick/TPS),c:me.st.cities|0,k:me.st.kills|0,ch:g.o.cheats?1:0,dv:UI.mob?'m':'p'};
  p.hist=[e].concat(Array.isArray(p.hist)?p.hist:[]).slice(0,40);p.histPend=(Array.isArray(p.histPend)?p.histPend:[]).concat([e]).slice(-40);saveProf();
}
function renderHist(){
  const H=Array.isArray(UI.prof.hist)?UI.prof.hist:[],w=H.filter(e=>e.r==='w').length,xs=H.reduce((a,e)=>a+(e.xp|0),0),L=UI.lang==='ar';
  const ago=d=>{const m=Math.max(0,Math.round((Date.now()-d)/6e4));return m<1?t('hiNow'):m<60?t('hiMin',m):m<1440?t('hiHr',Math.round(m/60)):t('hiDay',Math.round(m/1440));};
  const mm=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
  const row=e=>{const R={w:['🏆',t('hiW'),'w'],l:['💀',t('hiL'),'l'],q:['🏳️',t('hiQ'),'q']}[e.r]||['•','',''];
    const mode={q:t('hiMq'),c:t('hiMc'),d:t('hiMd'),o:t('hiMo')}[e.m]||'',sz=e.s>=0?(t('sizes')[e.s]||''):'',df=t('diffs')[e.f]||'';
    return `<div class="hrow ${R[2]}"><div class="hres"><span>${R[0]}</span><b>${R[1]}</b></div><div class="hmid"><b>${mode}${e.ch?' 🧪':''}${e.dv?`<span class="hdv">${e.dv==='m'?'📱 '+t('hiMob'):'💻 '+t('hiPc')}</span>`:''}</b><small>${[sz,df].filter(Boolean).join(' · ')}</small><small>⏱️ ${mm(e.t)} · 🏙️ ${e.c} · 💀 ${e.k} · ${ago(e.d)}</small></div><div class="hxp">+${fmt(e.xp)}<small>⭐ ${t('xpBon')}</small></div></div>`;};
  $('#help').innerHTML=`<div class="socH"><h2>📜 ${t('hiT')}</h2>${H.length?`<div class="hsum"><div><b>${H.length}</b><small>${t('hiG')}</small></div><div><b>${w}</b><small>${t('hiWs')}</small></div><div><b>${Math.round(w/H.length*100)}%</b><small>${t('hiRate')}</small></div><div><b>${fmt(xs)}</b><small>⭐ ${t('xpBon')}</small></div></div>`:''}</div>
  <div class="hlist">${H.length?H.map(row).join(''):`<p class="hempty">${t('hiNone')}</p>`}</div><div class="row"><button class="btn" data-a="menu">${t('back')}</button></div>`;
}
function quitXp(){
  const g=G;if(!g||g.o.demo||!g.started||g.over||g.xpDone||g.o.cheats)return;const me=g.nations[g.human];if(!me)return;g.xpDone=true;
  const xp=Math.round((me.st.cities*4+me.st.kills*15)*(g.o.daily?1.5:g.o.xpm||1));histAdd(g,'q',g.o.cheats?0:xp);if(xp<=0)return;addStat('xp',xp);addStat('games',1);saveProf();setTimeout(()=>{if(canBuy(UI.prof))toast(t('bpHint'),'prop',4000);},3800);return xp;
}
function toMenu(){const xp=quitXp();saveProf();lbPush();UI.war=false;UI.threats=[];if(NET.on)netClose();UI.phase='';startDemo();renderMenu();show('menu');if(xp)toast(t('quitXp',xp),'prop',3500);}
function showEnd(){
  const g=G,o=g.over,p=UI.prof;if(!o||g.o.demo||UI.screen==='end')return;const me=g.nations[g.human],w=g.nations[o.w];
  g.xpDone=true;stat(g.o.cheats?'cheat':o.win?'wins':'loss');const cheat=!!g.o.cheats;
  // a daily win keeps the streak going: +150, +20 for every day in a row, and +500 every seventh day
  let dBonus=0;if(g.o.daily&&o.win&&!cheat){const k=g.o.daily;if(p.dLast!==k){p.dStreak=p.dLast===dPrev(k)?(p.dStreak|0)+1:1;p.dLast=k;}dBonus=150+Math.min(200,20*((p.dStreak|0)-1))+((p.dStreak|0)%7===0?500:0);stat('dwin');}
  const xp=cheat?0:Math.round((10+(o.win?60:0)+me.st.cities*4+me.st.kills*15)*(g.o.daily?1.5:g.o.xpm||1))+dBonus;histAdd(g,o.win?'w':'l',xp);if(!cheat){addStat('xp',xp);addStat('games',1);if(o.win)addStat('wins',1);saveProf();setTimeout(()=>{if(canBuy(UI.prof))toast(t('bpHint'),'prop',4000);},1500);lbPush();}
  let best=cheat?`<p class="keys">🧪 ${t('cheatEnd')}</p>`:'';if(g.o.daily&&o.win){const b=p.daily[g.o.daily];if(!b||g.tick<b)p.daily={[g.o.daily]:g.tick};best=`<p class="best">${t('best',clock(p.daily[g.o.daily]))}</p><p class="dend">${t('dStreak',p.dStreak|0)}</p><p class="dend" id="dRank">⏳</p>`;
    if(!cheat){const k=g.o.daily,tk=g.tick;setTimeout(()=>dailySubmit(k,tk).then(()=>dailyBoard(k)).then(B=>{const e=$('#dRank');if(!e)return;const me=(p.fb||{}).uid,i=B?B.top.findIndex(x=>x.uid===me):-1;e.textContent=B?(i>=0?t('dRank',i+1,B.n):t('dCount',B.n)):'';}),300);}}
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
  <button id="bEra" class="era" data-a="era"></button><button id="bArmy" class="armyb" data-a="army">🎖️ ${t('ar_btn')}</button><div id="sS"></div>
  <div id="spd"><button data-a="sp:0" aria-label="pause">Ⅱ</button><button data-a="sp:1">1×</button><button data-a="sp:2">2×</button><button data-a="sp:3">3×</button></div>
  <button class="ib" id="bLb" data-a="lb" aria-label="${t('ranking')}"><img src="${R.url.crown}" alt=""></button></div>
  <div id="hint" hidden></div><div id="amode" class="pn"></div><div id="fpick" class="pn" hidden></div><div id="feed"></div><div id="lb" class="pn"><h4>${t('ranking')}</h4><div id="lbr"></div></div><div id="atk"></div>
  <div id="card" class="pn" hidden></div><div id="toasts"></div><div id="banner"></div><div id="tip" class="pn" hidden></div>
  <canvas id="mini" width="220" height="${Math.round(220*g.H/g.W)}"></canvas><button id="bHome" class="ib pn" data-a="home" aria-label="capital"><img src="${R.url.cap}" alt=""></button>
  <div id="bottom"><div id="ratio" class="pn"><span>${t('force')}</span><input type="range" id="rs" min="5" max="100" step="5" value="${Math.round(UI.ratio*100)}" aria-label="${t('force')}"><b id="rv"></b></div>
  <div id="bar" class="pn">${BAR.map((k,i)=>`<button class="bb" data-a="b:${k}" id="bb_${k}" title="${k==='ult'?t('fu_'+me.fac)+': '+t('fd_'+me.fac):t('s_'+k)+': '+t('d_'+k)}"><img src="${gl(k)}" alt=""><span class="nm">${k==='ult'?t('fu_'+me.fac):t('s_'+k)}</span><span class="ct"></span><kbd>${k==='ult'?'F':i+1}</kbd></button>`).join('')}</div></div>`;
  if(UI.mob){$('#hud').insertAdjacentHTML('beforeend',`<div id="dock"><button data-a="sh:build"><i>🏗️</i><span>${t('dk_build')}</span></button><button data-a="sh:arms"><i>🚀</i><span>${t('dk_arms')}</span></button>
      <button class="dka" data-a="sh:atk"><b id="dkP" dir="ltr"></b><span id="dkR"></span></button><button data-a="army"><i>🎖️</i><span>${t('ar_btn')}</span></button></div>
    <div id="sheet" hidden><button class="shbg" data-a="sh:x" aria-label="close" tabindex="-1"></button><div class="shp"><div class="shg"></div><div class="shh"><b id="shT"></b><button class="ib" data-a="sh:x" aria-label="close">✕</button></div><div id="shB"></div></div></div>`);
    // big speed controls: one pause button and one button that cycles ×1 → ×2 → ×3
    $('#spd').innerHTML=`<button data-a="sp:0" id="spP" aria-label="pause">Ⅱ</button><button data-a="spc" id="spC" dir="ltr">×1</button>`;}
  renderFac();renderAmode();
  $('#rs').addEventListener('input',e=>{UI.ratio=e.target.value/100;hudUpdate();});
  $('#mini').addEventListener('pointerdown',e=>{const r=e.target.getBoundingClientRect();lookAt((e.clientX-r.left)/r.width*g.W,(e.clientY-r.top)/r.height*g.H);});
}
function hudUpdate(){
  {const d=$('#dkR');if(d){d.textContent=((UI.prof.amode||'pt')==='all'?'🌐 ':'🎯 ')+t((UI.prof.amode||'pt')==='all'?'am_allS':'am_ptS');$('#dkP').textContent='⚔️ '+Math.round(UI.ratio*100)+'%';}document.querySelectorAll('.amseg button').forEach(b=>b.classList.toggle('on',b.dataset.a==='am:'+(UI.prof.amode||'pt')));const c=$('#spC');if(c){c.textContent='×'+UI.speed;c.classList.toggle('on',!UI.paused);}const pp=$('#spP');if(pp){pp.textContent=UI.paused?'▶':'Ⅱ';pp.classList.toggle('on',!!UI.paused);}}
  // the army panel is rebuilt only when an age or a level changes; gold only updates the numbers and buttons in place, so a tap is never lost to a redraw
  {const p=$('#armyP');if(p&&!p.hidden){const me=G&&G.nations[G.human];if(me){const k=me.era+'|'+JSON.stringify(me.up);if(k!==UI.armyK){if(!(performance.now()<(UI.armyHold||0))){UI.armyK=k;renderArmy();}}else armyGold(me,p);}}}
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
// ── army upgrades: soldiers, tanks and planes, five levels each, paid in gold and opened by age ──
// art for each army upgrade (the tank keeps the game's own tank icon)
const ART={sol:'<svg viewBox="0 0 64 64"><path fill="#4f6b3a" d="M12 30c0-12 9-20 20-20s20 8 20 20v3H12z"/><path fill="#3c5530" d="M8 33h48v4H8z"/><path fill="#e0b48a" d="M20 37h24v8c0 7-5 12-12 12s-12-5-12-12z"/><path fill="#2b3a22" d="M24 43h4v2h-4zm12 0h4v2h-4z"/><path fill="#6f8f52" d="M18 20c4-5 9-7 14-7v8c-6 0-10 2-14 5z" opacity=".55"/><path fill="#5b4a2e" d="M16 57h32l4 7H12z"/></svg>',air:'<svg viewBox="0 0 64 64"><path fill="#d6e6f5" d="M32 2c2.2 0 3.6 4.4 3.8 10l.4 12 20 12.5v5.2L36.4 35l.6 13.6 7.2 6v4.6L33.6 56l-1.6 4-1.6-4-10.6 3.2v-4.6l7.2-6 .6-13.6-19.8 6.7v-5.2l20-12.5.4-12C28.4 6.4 29.8 2 32 2z"/><path fill="#7c93ab" d="M30.4 14h3.2l.3 9h-3.8zM9.8 41.7 28 33.8v2.4L9.8 43.2zm44.4 0L36 33.8v2.4l18.2 7z"/><circle cx="32" cy="11" r="1.6" fill="#4ea4ff"/></svg>',nav:'<svg viewBox="0 0 64 64"><path fill="#9fb3c6" d="M6 38h52l-7 12H13z"/><path fill="#6f8599" d="M18 30h26v8H18z"/><path fill="#c9d6e2" d="M24 22h12v8H24z"/><path fill="#55697c" d="M29 12h2v10h-2z"/><path fill="#55697c" d="M36 26h14v2H36z"/><path fill="#3f81c6" d="M2 52c5 3 10 3 15 0s10-3 15 0 10 3 15 0 10-3 15 0v4H2z" opacity=".8"/></svg>',def:'<svg viewBox="0 0 64 64"><path fill="#7d93ab" d="M32 4 54 12v16c0 15-9 26-22 32C19 54 10 43 10 28V12z"/><path fill="#c8d6e4" d="M32 9 49 15v13c0 12-7 21-17 26-10-5-17-14-17-26V15z"/><path fill="#e3b95a" d="M29 20h6v9h9v6h-9v11h-6V35h-9v-6h9z"/></svg>'};
const ARMY=[
  {k:'sol',pct:15,cnt:lv=>'+'+lv*15+'%'},
  {k:'tank',pct:10,cnt:lv=>[0,10,25,45,70,100][lv]},
  {k:'air',pct:12,cnt:lv=>[0,4,10,18,28,40][lv]},
  {k:'nav',pct:15,cnt:lv=>[0,3,6,10,15,20][lv]},
  {k:'def',pct:10,cnt:lv=>'+'+lv*10+'%'}].map(a=>Object.assign(a,ARMY_UP[a.k]));
// the real numbers each level changes, now and after the next upgrade
function armyNums(me,k,lv){const f=(a)=>a,nx=lv+1;
  if(k==='sol'){const base=me.maxT/(1+.15*lv);return[[t('ar_maxA'),fmt(me.maxT),fmt(base*(1+.15*nx))],[t('ar_grow'),'+'+lv*15+'%','+'+nx*15+'%']];}
  if(k==='tank')return[[t('ar_loss'),Math.round(100/(1+.1*lv)),Math.round(100/(1+.1*nx))],[t('ar_pow'),'×'+(1+.1*lv).toFixed(1),'×'+(1+.1*nx).toFixed(1)]];
  if(k==='air')return[[t('ar_spd'),Math.round(100*(1+.12*lv))+'%',Math.round(100*(1+.12*nx))+'%']];
  if(k==='nav'){const sl=boatSlots(me);return[[t('ar_bspd'),Math.round(100*(1+.15*lv))+'%',Math.round(100*(1+.15*nx))+'%'],[t('ar_boats'),sl,sl+((nx===3||nx===5)?1:0)]];}
  return[[t('ar_dfn'),'×'+(1+.1*lv).toFixed(1),'×'+(1+.1*nx).toFixed(1)]];}
function openArmy(){const g=G,me=g.nations[g.human];if(!me||!me.alive)return;UI.bs=null;UI.sel=0;const c=$('#card');c.hidden=true;let p=$('#armyP');if(!p){p=document.createElement('div');p.id='armyP';$('#hud').appendChild(p);}
  p.hidden=false;renderArmy();{const me=G.nations[G.human];if(me)UI.armyK=me.era+'|'+JSON.stringify(me.up);}}
function armyGold(me,p){
  const gb=p.querySelector('.apg2 b');if(gb){const v=fmt(me.gold);if(gb.textContent!==v)gb.textContent=v;}const U=me.up||{};
  for(const A of ARMY){const b=p.querySelector(`[data-a="armyUp:${A.k}"]`);if(!b)continue;const lv=U[A.k]|0,poor=me.gold<A.cost[lv];if(b.disabled!==poor){b.disabled=poor;b.classList.toggle('ok',!poor);}}
}
function renderArmy(){const g=G,me=g.nations[g.human],p=$('#armyP');if(!p||p.hidden||!me)return;const U=me.up||(me.up={sol:0,tank:0,air:0,nav:0,def:0}),fx=UI.armyFx;UI.armyFx=null;
  p.innerHTML=`<div class="aph"><div><b>🎖️ ${t('ar_t')}</b><small>${t('ar_sub')}</small></div><div class="apg2"><span class="coin"></span><b>${fmt(me.gold)}</b></div><button class="ib" data-a="armyX" aria-label="close">✕</button></div>
  <div class="apg">${ARMY.map(A=>{const lv=U[A.k]|0,mx=lv>=5,need=mx?0:A.era[lv],lock=!mx&&me.era<need,cost=mx?0:A.cost[lv],poor=!mx&&!lock&&me.gold<cost,nums=armyNums(me,A.k,lv);
    return `<div class="apc ${A.k}${lock?' lk':''}${mx?' mx':''}${fx===A.k?' upd':''}${UI.newArmy&&UI.newArmy.has(A.k)&&!lock&&!mx?' nw':''}"><div class="api">${A.k==='tank'?`<img src="${R.url.camp}" alt="">`:ART[A.k]}<span class="lvb">${lv}/5</span></div>
      <div class="apt"><b>${t('ar_'+A.k)}</b><small>${t('ar_'+A.k+'D')}</small></div>
      <div class="apn"><em data-to="${A.cnt(lv)}">${A.cnt(lv)}</em><small>${t('ar_'+A.k+'U')}</small></div>
      <div class="apd">${[1,2,3,4,5].map(i=>`<i class="${i<=lv?'on':''}"></i>`).join('')}</div>
      <div class="apx">${nums.map(n=>`<div><span>${n[0]}</span><bdi class="ap2" dir="ltr"><b>${n[1]}</b>${mx?'':`<i>→</i><b class="nx">${n[2]}</b>`}</bdi></div>`).join('')}</div>
      ${mx?`<div class="apm">✨ ${t('upMax')}</div>`:lock?`<div class="apl">🔒 ${t('ar_lock',t('eras')[need-1])}</div>`:`<button class="btn sm ${poor?'':'ok'}" data-a="armyUp:${A.k}"${poor?' disabled':''}>⬆ ${t('ar_upTo',lv+1)} · ${fmt(cost)}</button>`}</div>`;}).join('')}</div>`;
  // the card just upgraded: its number counts up from the old value
  if(fx){const e=p.querySelector('.apc.upd .apn em');if(e){const to=e.dataset.to,m=/^(\+?)(\d+)(%?)$/.exec(to);if(m){const end=+m[2],st=performance.now();const step=()=>{const k=Math.min(1,(performance.now()-st)/650),v=Math.round(end*(.6+.4*k));e.textContent=m[1]+v+m[3];if(k<1)requestAnimationFrame(step);};step();}}}}
// ── ages: what the next age gives you, shown before you pay and again once you're in ──
function eraInfo(E){const it=[];for(const k in ST)if(ST[k].era===E)it.push({ic:k,n:t('s_'+k),d:t('d_'+k)});for(const k in MSL)if(MSL[k].era===E)it.push({ic:k,n:t('s_'+k),d:t('d_'+k)});
  {const ks=ARMY.filter(A=>A.era.includes(E)).map(A=>A.k);if(ks.length)it.push({ic:'army',k:'sol',n:t('era_armyT'),d:ks.map(k=>t('ar_'+k)).join('، ')});}
  if(E===3)it.push({ic:'up',n:t('era_up4'),d:t('era_upD')});if(E===4)it.push({ic:'up',n:t('era_up5'),d:t('era_upD')});
  return{bon:[t('era_atk',8*(E-1)),t('era_army',10*(E-1)),t('era_trade',25*(E-1))],it};}
function eraCard(E,mode){const g=G,me=g.nations[g.human];if(!me)return;closeCard();let p=$('#eraP');if(!p){p=document.createElement('div');p.id='eraP';$('#hud').appendChild(p);}p.hidden=false;
  const I=eraInfo(E),cost=mode==='next'?eraCost(me):0,poor=mode==='next'&&me.gold<cost,icon=x=>x.ic==='army'?(x.k==='tank'?`<img src="${R.url.camp}">`:ART[x.k]||'🎖️'):x.ic==='up'?'⬆️':`<img src="${R.url[x.ic]}">`;
  p.scrollTop=0;p.innerHTML=`<div class="eph">${mode==='got'?`<span class="epx">🎉</span><b>${t('era_got',t('eras')[E-1])}</b>`:`<b>${t('era_next',t('eras')[E-1])}</b>`}<button class="ib" data-a="eraX" aria-label="close">✕</button></div>
    <div class="epb">${I.bon.map(b=>`<span>${b}</span>`).join('')}</div><h5>${t(mode==='got'?'era_unl':'era_will')}</h5>
    <div class="epg">${I.it.map(x=>`<div class="epi"><i>${icon(x)}</i><div><b>${x.n}</b><small>${x.d}</small></div></div>`).join('')}</div>
    ${mode==='got'?`<button class="btn big ok" data-a="eraX">${t('era_ok')}</button>`:`<button class="btn big ${poor?'':'ok'}" data-a="eraGo"${poor?' disabled':''}>⬆ ${t('era_buy')} · ${fmt(cost)}</button>${poor?`<p class="bad">${t('era_need',fmt(cost-me.gold))}</p>`:''}`}`;}
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
    case'fort':return t('ef_fort',5+lv-1,fmt(60000*lv),FT_R(lv));
    case'port':return t('ef_port',2*lv,35*(lv-1));
    case'coast':return t('ef_coast',CO_R(lv),35*(lv-1));
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
  const rn=s.type==='city'&&s.ruin>g.tick,fc=rn?repairCost(g,s):0;
  const r=canUp(g,me,s),key=s.level+'|'+r+'|'+(s.upAt>g.tick?Math.ceil((s.upAt-g.tick)/TPS):0)+'|'+(rn?Math.ceil((s.ruin-g.tick)/TPS)+':'+(me.gold>=fc):'');if(key===UI.bKey)return;UI.bKey=key;
  $('#bNext').textContent=s.level<5?'⬆ '+effText(s,s.level+1):'';
  // a bombed city: how long until it is rebuilt, and a button to pay and fix it now
  if(rn){$('#bBtn').innerHTML=`<p class="warn">🏚️ ${t('ruinLeft',Math.ceil((s.ruin-g.tick)/TPS))}</p><button class="btn sm ok up" data-a="fixB">🛠️ ${t('fixNow')} · ${fmt(fc)}</button>${me.gold<fc?`<p class="bad">${t('e_gold')}</p>`:''}<p class="keys">${t('ruinWhy')}</p>`;return;}
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
// the phone's bottom sheet: build tiles, weapon tiles, or the attack controls (the same live elements, moved in)
// red marks: on each new building or weapon until it is tapped, on the dock button while it holds something new, on the army until it is opened
function newMarks(){const N=UI.newSet||new Set(),arms=['rocket','nuke','doom','ult'];for(const e of document.querySelectorAll('.bb'))e.classList.toggle('nw',N.has(e.id.slice(3)));
  const has=f=>[...N].some(f),set=(sel,on)=>{const b=document.querySelector(sel);if(b)b.classList.toggle('dot',!!on);};
  set('#dock [data-a="sh:build"]',has(k=>!arms.includes(k)));set('#dock [data-a="sh:arms"]',has(k=>arms.includes(k)));set('#dock [data-a="army"]',UI.newArmy&&UI.newArmy.size);
  const ab=$('#bArmy');if(ab)ab.classList.toggle('dot',!!(UI.newArmy&&UI.newArmy.size));}
function dockDots(){newMarks();}
function sheetOpen(kind){newMarks();const sh=$('#sheet');if(!sh)return;if(UI.sheet===kind&&!sh.hidden)return sheetClose();UI.sheet=kind;sh.hidden=false;sh.dataset.k=kind;
  $('#shT').textContent=t(kind==='build'?'dk_buildT':kind==='arms'?'dk_armsT':'dk_atkT');const B=$('#shB');B.innerHTML='';
  if(kind==='atk'){const r=$('#ratio'),m=UI.prof.amode||'pt';B.insertAdjacentHTML('beforeend',`<div class="amseg"><button data-a="am:pt" class="${m==='pt'?'on':''}"><i>🎯</i>${t('am_pt')}</button><button data-a="am:all" class="${m==='all'?'on':''}"><i>🌐</i>${t('am_all')}</button></div>`);B.appendChild(r);
    B.insertAdjacentHTML('beforeend',`<div class="rq">${[25,50,75,100].map(v=>`<button data-a="rq:${v}">${v}%</button>`).join('')}</div>`);}
  else{B.appendChild($('#bar'));}
  for(const d of document.querySelectorAll('#dock button'))d.classList.toggle('on',d.dataset.a==='sh:'+kind);}
function sheetClose(){const sh=$('#sheet');if(!sh||sh.hidden)return;
  // whatever was new in this panel has now been seen
  if(UI.newSet){const arms=['rocket','nuke','doom','ult'],k=UI.sheet;for(const x of [...UI.newSet])if(k==='arms'?arms.includes(x):k==='build'&&!arms.includes(x))UI.newSet.delete(x);}
  sh.hidden=true;UI.sheet=null;newMarks();const bt=$('#bottom');if(bt){bt.prepend($('#ratio'));bt.appendChild($('#bar'));}
  for(const d of document.querySelectorAll('#dock button'))d.classList.remove('on');}
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
    case'custom':UI.setupMode='solo';renderSetup();show('setup');break;case'hostSetup':UI.setupMode='host';renderSetup();show('setup');break;case'menu':renderMenu();show('menu');setTimeout(accHint,900);break;case'toMenu':toMenu();break;
    case'how':UI.helpBack=UI.screen;renderHelp();show('help');break;case'helpBack':show(UI.helpBack==='pause'?'pause':'menu');break;
    case'lang':p.lang=UI.lang=v||(UI.lang==='ar'?'en':'ar');applyMode();if(G&&!G.o.demo)buildHud();renderSettings();break;
    case'snd':p.sound=!p.sound;applyVol();UI.screen==='pause'?renderPause():renderMenu();break;case'mus':p.music=!p.music;applyVol();UI.screen==='pause'?renderPause():renderMenu();break;
    case'ifc':p.ui=v==null?(p.ui+1)%3:+v;applyMode();resize();renderSettings();break;
    case'fac':p.fac=v;renderFac();break;case'account':UI.accMsg='';UI.nameDraft=null;renderAccount();show('help');break;case'accReg':accRegister();break;case'accIn':accLogin();break;case'accOut':accLogout();break;case'board':openLB();break;case'lbS':UI.lbSort=v;openLB();break;case'suggest':renderSuggest();show('help');break;case'sgSend':sendSuggest();break;case'ranks':renderRanks();show('help');break;case'settings':UI.setBack=UI.screen;renderSettings();show('help');break;case'setBack':if(UI.setBack==='pause'){renderPause();show('pause');}else{renderMenu();show('menu');}break;case'news':renderNews();show('help');break;
    case'atk':{const n=g.nations[+v],ti=UI.cardTile>=0&&g.owner[UI.cardTile]===+v?UI.cardTile:n.cap?n.cap.i:-1;closeCard();if(ti>=0)send({k:'atk',i:ti,r:UI.ratio,m:UI.prof.amode||'pt'});break;}case'type':p.type=v;renderSetup();break;case'set':p[v]=+w;UI.screen==='help'?renderQuick():renderSetup();break;
    case'pause':if(UI.phase==='play'||UI.phase==='spawn'||UI.phase==='wait'){renderPause();show('pause');}break;case'resume':show(null);break;
    case'sp':if(NET.on&&!NET.host)return err('hostOnly');if(+v===0)UI.paused=!UI.paused;else{UI.speed=+v;UI.paused=false;}hudUpdate();break;
    case'b':{if(UI.newSet&&UI.newSet.delete(v))newMarks();const r=barAct(v);if(UI.sheet&&UI.sheet!=='atk')sheetClose();return r;}
    case'era':if(me&&me.era<4)eraCard(me.era+1,'next');break;case'eraGo':if(me&&me.era<4){if(me.gold<eraCost(me))return err('gold');send({k:'era'});{const p=$('#eraP');if(p)p.hidden=true;}}break;case'eraX':{const p=$('#eraP');if(p)p.hidden=true;}break;
    case'lb':$('#lb').classList.toggle('open');break;
    case'home':if(me&&me.cap)lookAt(me.cap.x,me.cap.y,Math.max(cam.tz,7));break;
    case'nat':if(+v!==g.human)openCard(+v);else if(me.cap)lookAt(me.cap.x,me.cap.y);if(UI.mob)$('#lb').classList.remove('open');break;
    case'nameSave':{const v=(UI.nameDraft!=null?UI.nameDraft:p.name)||'';p.name=v;UI.nameDraft=null;saveProf();cloudSync();renderAccount();const m=$('#nameMsg');if(m)m.textContent=t('nameSaved',v||t('defName'));break;}
    case'nameUndo':UI.nameDraft=null;renderAccount();break;
    case'cheat':{const c=p.cheat||(p.cheat={});c[v]=!c[v];saveProf();renderSetup();break;}
    case'radR':UI.ratio=+v/100;{const r=$('#rs');if(r)r.value=+v;}hudUpdate();if(UI.rad)radOpen(UI.rad.i,UI.rad.x,UI.rad.y,UI.rad.more);break;
    case'pass':renderPass();show('help');if((UI.prof.passT==null?-1:UI.prof.passT)<PASS.length)ppPrep();break;
    case'skins':renderSkins();show('help');break;
    case'bpBuy':passBuy();break;
    case'supOpen':UI.supFrom='pass';renderSupport();show('help');ppMount();break;
    case'social':renderSocial();show('help');break;
    case'avPick':p.avatar=+v;saveProf();lbPush();{const h=$('#help'),y=h?h.scrollTop:0;renderAccount();if(h)h.scrollTop=y;}break;
    case'rkPick':p.rankPick=+v;saveProf();lbPush();renderRanks();break;
    case'lvShow':p.hideLv=v==='0'?1:0;saveProf();lbPush();renderAccount();break;
    case'gGo':gGo(v);break;
    case'eye':{const i=$('#'+v),b=document.querySelector(`[data-a="eye:${v}"]`);if(i){const sh=i.type==='password';i.type=sh?'text':'password';if(b)b.textContent=sh?'🙈':'👁️';i.focus();}break;}
    case'acHintGo':case'acHintX':{UI.prof.accHint=1;saveProf();const d=$('#acchint');if(d)d.remove();if(a==='acHintGo'){stat('acchgo');act('account');}break;}
    case'mailLink':mailLink();break;case'accForgot':accForgot();break;case'gName':gName();break;case'gCancel':UI.gNew=null;UI.accMsg='';renderAccount();break;
    case'copyLink':{const l=location.origin+location.pathname;try{navigator.clipboard.writeText(l).then(()=>toast(t('gg_copied'),'prop',2500)).catch(()=>toast(l,'prop',5000));}catch(e){toast(l,'prop',5000);}break;}
    case'moveGo':{saveProf();const raw=localStorage.getItem('sijal.v1')||'',rc=(location.hash||'').slice(1).toUpperCase(),h=[];if(raw.length>2)h.push('mv='+b64u(raw));if(/^[A-Z0-9]{5}$/.test(rc))h.push('r='+rc);stat('moved');statFlush(true);location.href=NEW_SITE+(h.length?'#'+h.join('&'):'');break;}
    case'hist':renderHist();show('help');break;
    case'supMenu':UI.supFrom='menu';renderDonate();show('help');break;
    case'supPay':stat('payclick');break;case'donPay':stat('donclick');break;
    case'supSend':supSend();break;
    case'admGrant':admGrant();break;
    case'badge':p.hideBadge=v!=='1';saveProf();cloudSync();renderSkins();break;
    case'skin':{const s=p.skin||(p.skin={});if(w&&!owns(p,v,w))break;s[v]=w||'';saveProf();renderSkins();break;}
    case'kick':netKick(+v);if(UI.screen==='pause')renderPause();break;
    case'adm':{if(!UI.admin||!g||g.o.mp||g.o.demo)break;const me2=g.nations[g.human],C=g.o.cheats||(g.o.cheats={});
      if(v==='gold')me2.gold+=1e5;else if(v==='troops')me2.troops+=1e5;else if(v==='era')me2.era=4;else if(v==='build'||v==='msl')C[v]=!C[v];
      else if(v==='win'&&!g.over){g.over={w:me2.id,win:true,why:'dom'};g.ev.push({t:'over',win:true,w:me2.id});show(null);}
      if(v!=='win'){renderPause();toast('🛠️ '+t('admDone'),'prop',1500);}break;}
    case'admin':openAdmin();break;case'admSt':admStats();renderAdmin();break;
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
    case'smooth':UI.prof.smooth=v==='1'?1:0;saveProf();renderSettings();break;
    case'gfx':UI.prof.gfx=+v;saveProf();applyGfx();renderSettings();break;
    case'fixB':if(UI.bs){send({k:'fix',i:UI.bs.i});UI.bKey='';}break;
    case'army':sheetClose();openArmy();break;case'sh':if(v==='x')sheetClose();else sheetOpen(v);break;case'rq':UI.ratio=+v/100;{const r=$('#rs');if(r)r.value=+v;}hudUpdate();break;case'spc':if(NET.on&&!NET.host)return err('hostOnly');UI.speed=UI.speed>=3?1:UI.speed+1;UI.paused=false;hudUpdate();break;case'armyX':{const p=$('#armyP');if(p)p.hidden=true;UI.newArmy=null;newMarks();}break;case'armyUp':send({k:'army',t:v});break;
    case'upB':if(UI.bs){send({k:'up',i:UI.bs.i});UI.bKey='';}break;
    case'reload':location.replace(location.pathname+'?v='+(UI.updBuild||Date.now())+location.hash);break;case'updX':{const d=$('#upd');if(d)d.remove();UI.updSkip=UI.updBuild;break;}
    case'giftOpen':amtOpen('gift',+v);break;case'aidOpen':amtOpen('aid',+v);break;case'amtP':if(UI.cardAmt)amtSet(UI.cardAmt.max*(+v)/100);break;case'amtX':UI.cardAmt=null;$('#cAmt').innerHTML='';break;
    case'amtSend':{const A=UI.cardAmt;if(!A)break;send(A.kind==='gift'?{k:'gift',d:A.id,amt:A.v}:{k:'aid',d:A.id,amt:A.v});UI.cardAmt=null;$('#cAmt').innerHTML='';break;}
    case'am':p.amode=v;saveProf();renderAmode();hudUpdate();break;case'amT':if(UI.amDrag){UI.amDrag=false;break;}p.amHide=!p.amHide;renderAmode();break;
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
    if(e.t==='boom'){const dm=e.type==='doom',nk=dm||e.type==='nuke';addFx('boom',e.x,e.y,{r:e.r*(nk?1.6:1.25),dur:dm?4200:nk?3000:900,nuke:nk,kind:e.type});if(!demo){sfx(nk?'nuke':'boom');if(nk)R.shake=dm?30:16;}continue;}
    if(e.t==='intercept'){const now=performance.now();const L=(R.iv||[]).filter(v=>v.until>now);R.iv=L;const v=L.find(v=>v.tx===e.x&&v.ty===e.y);if(v){addFx('airburst',e.x,e.y,{mx:v.mx,my:v.my,dur:700});L.splice(L.indexOf(v),1);}else addFx('ring',e.x,e.y,{r:3,col:'#9fe0ff'});if(!demo&&e.a===me)feed(t('m_inter'),'good');continue;}
    if(e.t==='meteorWarn'){addFx('ring',e.x,e.y,{r:7,col:'#ff9a5a',dur:1600});if(!demo){feed(t('m_meteor'),'warn');sfx('alert');}continue;}
    if(demo)continue;
    const cn=e.s&&e.s.type==='city'?esc(cityName(e.s.name,UI.lang)):'';
    switch(e.t){
      case'war':if(e.d===me&&A.minor){feed(t('m_warYou',nmh(A)),'bad');}else if(e.d===me){feed(t('m_warYou',nmh(A)),'bad');banner(t('m_warYou',natName(A)),'bad');sfx('siren');(UI.threats||(UI.threats=[])).push({id:e.a,until:performance.now()+14000});}break;
      case'shot':addFx('shot',e.x,e.y,{tx:e.tx,ty:e.ty,dur:900});break;
      case'sunk':addFx('boom',e.x,e.y,{r:2.5,dur:700});if(e.a===me){feed(t('m_sunk'),'good');sfx('boom');}else if(e.d===me){feed(t('m_sunkYou'),'bad');sfx('boom');}break;
      case'cityFall':addFx('ring',e.s.x,e.s.y,{r:7+e.s.level,col:A?A.css:'#fff',dur:1300});
        if(e.a===me){feed(t('m_cityYou',cn),'good');banner(cn);sfx('city');}else if(e.d===me){feed(t('m_cityLost',cn),'bad');if(!e.cap)banner(t('m_cityLost',cn),'bad');sfx('lose1');}break;
      case'cityJoin':if(e.a===me){feed(t('m_join',cn),'good');sfx('city');addFx('ring',e.s.x,e.s.y,{r:5,col:'#ffe9a8'});}break;
      case'capMoved':if(e.d===me){feed(t('m_capYou',cn),'bad');banner(t('m_capYou',cn),'bad');}else feed(t('m_capMoved',nmh(D),cn));break;
      case'collapse':feed(t('m_collapse',nmh(D),nmh(A)),e.a===me?'good':'');if(e.a===me)sfx('win1');break;
      case'allyWarn':if(e.a===me||e.b===me){const P=N[e.a===me?e.b:e.a],no=!P.human&&!P.allyRen[me];const d=no?toast(t('m_allyNo',nmh(P)),'bad',6000):toast(`<span>${t('m_allyWarn',nmh(P))}</span><button class="btn sm ok" data-a="renew:${P.id}:1">${t('renewY')}</button><button class="btn sm warn" data-a="renew:${P.id}:0">${t('renewN')}</button>`,'prop',0);if(d)d.dataset.ally=P.id;sfx('alert');}break;
      case'allyRenew':if(e.a===me||e.b===me){const P=N[e.a===me?e.b:e.a];feed(t('m_allyRenew',nmh(P)),'good');UI.cardKey='';}break;
      case'allyEnd':if(e.a===me||e.b===me){const P=N[e.a===me?e.b:e.a];for(const d of document.querySelectorAll('.ts[data-ally="'+P.id+'"]'))d.remove();feed(t('m_allyEnd',nmh(P)),'warn');UI.cardKey='';}break;
      case'ally':if(e.a===me||e.b===me){feed(t('m_ally',nmh(N[e.a]),nmh(N[e.b])),'good');sfx('city');sayLine(N[e.a===me?e.b:e.a],'ally');UI.cardKey='';}break;
      case'betray':if(e.a===me||e.b===me){feed(t('m_betray',nmh(N[e.a]),nmh(N[e.b])),'bad');if(e.b===me)sfx('alert');UI.cardKey='';}break;
      case'armyUp':if(e.a===me){UI.armyFx=e.k;sfx('era');renderArmy();const M=N[me];UI.armyK=M.era+'|'+JSON.stringify(M.up);UI.armyHold=performance.now()+900;}break;
      case'repair':if(e.a===me){addFx('ring',e.s.x,e.s.y,{r:5,col:'#7ee08a',dur:800});feed(t('m_fixed',cn),'good');}break;
      case'cityHit':addFx('ring',e.s.x,e.s.y,{r:4,col:'#b9b0a6',dur:900});if(e.d===me)feed(t('m_cityRuinYou',cn),'bad');else if(e.a===me)feed(t('m_cityRuin',cn),'good');break;
      case'cityGone':addFx('ring',e.s.x,e.s.y,{r:8,col:'#ff9a5a',dur:1500});if(e.d===me){feed(t('m_cityGoneYou',cn),'bad');banner(t('m_cityGoneYou',cn),'bad');}else if(e.a===me)feed(t('m_cityGone',cn),'good');break;
      case'aid':if(e.a===me){feed(t('m_aidSent',fmt(e.amt),nmh(N[e.b])),'good');sayLine(N[e.b],'thanks');}else if(e.b===me)feed(t('m_aidGot',nmh(A),fmt(e.amt)),'good');break;
      case'upDone':if(e.a===me){feed(t('m_upDone',e.s.type==='city'?esc(cityName(e.s.name,UI.lang)):t('s_'+e.s.type),e.s.level),'good');sfx('era');addFx('ring',e.s.x,e.s.y,{r:5,col:'#ffe9a8',dur:900});UI.bKey='';}break;
      case'train':if(e.a===me){addFx('text',e.x,e.y,{s:'+'+e.amt,dur:1400,col:'#ffe9a8'});sfx('trade');}break;
      case'trade':if(e.a===me){addFx('text',e.x,e.y,{s:'+'+e.amt,dur:1400,col:'#ffe9a8'});sfx('trade');}break;
      case'dead':if(e.a===me&&e.tr>0){addFx('sword',e.x,e.y,{s:'+'+fmt(e.tr),dur:2600});sfx('city');}if(e.d===me&&g.o.mp){banner(t('mpDead'),'bad');feed(t('mpDead'),'bad');sfx('lose');}break;
      case'proposal':{if(e.b!==me)break;const d=toast(`<span>${t('m_prop',nmh(A))}</span><button class="btn sm ok" data-a="acc:${A.id}">${t('yes')}</button><button class="btn sm warn" data-a="rej:${A.id}">${t('no')}</button><button class="btn sm" data-a="find:${A.id}">${t('b_focus')}</button>`,'prop',0);if(d)d.dataset.from=A.id;sfx('coin');break;}
      case'emo':if(e.to===me&&e.a!==me)feed(t('m_emo',nmh(A),EMO[e.e-1]));break;
      case'emb':if(e.d===me&&e.a!==me)feed(t(e.v?'m_embOn':'m_embOff',nmh(A)),e.v?'bad':'good');else if(!e.d&&e.a!==me&&e.v&&g.nations[me]&&g.nb&&g.nb[me*g.nations.length+e.a]>0)feed(t('m_embAll',nmh(A)),'bad');break;
      case'peaceProp':{if(e.b!==me)break;const d=toast(`<span>${t('m_peaceProp',nmh(A))}</span><button class="btn sm ok" data-a="acc:${A.id}">${t('yes')}</button><button class="btn sm warn" data-a="rej:${A.id}">${t('no')}</button>`,'prop',0);if(d)d.dataset.from=A.id;sfx('coin');break;}
      case'peace':if(e.a===me||e.b===me){feed(t('m_peace',nmh(N[e.a===me?e.b:e.a])),'good');sfx('city');UI.cardKey='';}break;
      case'peaceRej':if(e.b===me){const L=TX[UI.lang]['pr_'+e.why];feed(L?t('m_peaceRejX',nmh(A),L[(Math.random()*L.length)|0]):t('m_peaceNo',nmh(A)),'bad');}break;
      case'reject':if(e.b===me){const L=TX[UI.lang]['ar_'+(e.why||'trust')];feed(L?t('m_rejX',nmh(A),L[(Math.random()*L.length)|0]):t('m_rej',nmh(A)),'bad');}break;
      case'say':if(e.to==null||e.to===me)sayLine(A,e.key);break;
      case'era':if(e.a===me){banner(t('eras')[e.era-1]);feed(t('m_era',t('eras')[e.era-1]),'good');sfx('era');{const N=UI.newSet||(UI.newSet=new Set());for(const k in ST)if(ST[k].era===e.era)N.add(k);for(const k in MSL)if(MSL[k].era===e.era)N.add(k);UI.newArmy=new Set(ARMY.filter(A=>A.era.includes(e.era)).map(A=>A.k));}newMarks();}break;
      case'season':banner(t('seas')[e.s],'sea');if(UI.mob)feed(`<b>${t('seas')[e.s]}</b>: ${t('seaGood')[e.s]}<br><span class="bad">${t('seaBad')[e.s]}</span>`);else{feed(t('seaTip')[e.s]);toast(`<span><b>${t('seas')[e.s]}</b> · ${t('seaGood')[e.s]}<br><span class="bad">${t('seaBad')[e.s]}</span></span>`,'prop',7000);}sfx('season'+e.s);break;
      case'rebel':feed(t('m_rebel',nmh(D)),e.d===me?'bad':'');addFx('ring',e.x,e.y,{r:9,col:'#ff7a4a',dur:1500});break;
      case'plague':feed(t('m_plague',nmh(D)),e.d===me?'bad':'');break;
      case'caravan':feed(t('m_caravan'),'good');sfx('coin');break;
      case'launch':{const nm=t('s_'+e.type);if(e.a===me)sfx('launch');else if(e.d===me){
        // say where it lands (the nearest city of mine) and how long is left, and sound the siren
        let city=null,cd=1e9;for(const c of g.structs)if(!c.dead&&c.type==='city'&&c.owner===me){const d=(c.x-e.x)**2+(c.y-e.y)**2;if(d<cd){cd=d;city=c;}}
        const M=g.missiles.find(q=>q.tx===e.x&&q.ty===e.y&&q.a===e.a),secs=M?Math.ceil(M.dur*(1-M.t)/TPS):0,where=city&&cd<=225?t('incCity',cityName(city.name,UI.lang)):t('incLand');
        const ic=e.type==='rocket'?'🚀':e.type==='nuke'?'☢️':'💀',msg=t('m_inc2',ic,nm,where,secs);feed(msg,'bad');banner(msg,'bad');sfx('siren');setTimeout(()=>sfx('siren'),1400);
        if(UI.mob&&navigator.vibrate)try{navigator.vibrate([200,100,200,100,400]);}catch(_){}
        if(city&&cd<=225)(UI.threats||(UI.threats=[]));}else if(e.type!=='rocket')feed(t('m_launch',nmh(A),nm),'warn');break;}
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
  $('#app').addEventListener('input',e=>{if(e.target.id==='inTribes'){UI.prof.tribes=clamp(+e.target.value|0,30,240);$('#tribesV').textContent=UI.prof.tribes;saveProf();return;}if(e.target.id==='inMaxP'){let v=clamp(+e.target.value|0,2,32);if(NET.on&&NET.host)v=Math.max(v,NET.players.length);UI.prof.maxP=v;e.target.value=v;$('#maxPV').textContent=v;saveProf();if(NET.on&&NET.host){regSend();if(UI.screen==='net')renderLobby();}}});
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
  requestAnimationFrame(frame);const dt=Math.min(100,(ts-lastTs)||16);lastTs=ts;const g=G;if(UI.rad&&(UI.screen||UI.phase!=='play'||!g||g.o.demo))radClose();if(g&&!g.o.demo&&g.started&&UI.statG!==g){UI.statG=g;stat('games');stat('g_'+(NET.on?'o':g.o.daily?'d':UI.mType||'c'));}if(g&&!g.o.demo&&g.started&&!g.over&&UI.phase==='play'&&!document.hidden){const p=UI.prof;addStat('ms',dt);SQ.ms+=dt;if(g.o.daily&&p.dailyDone!==g.o.daily){p.dailyDone=g.o.daily;saveProf();}if(p.ms-(UI.msSaved||0)>3e4){UI.msSaved=p.ms;saveProf();if(Date.now()-(UI.lbPushed||0)>3e5){UI.lbPushed=Date.now();lbPush();}}}if(!g||!R.land)return;
  if(g.o.demo){cam.tx=g.W/2+Math.sin(ts/21000)*g.W*.16;cam.ty=g.H/2+Math.cos(ts/27000)*g.H*.12;cam.tz=fitZoom(g)*1.5;if(g.over||g.tick>7000){startDemo();return;}}
  else if(!UI.screen){const K=UI.keys,s=dt*.55/cam.z;if(K.a||K.arrowleft)cam.tx-=s;if(K.d||K.arrowright)cam.tx+=s;if(K.w||K.arrowup)cam.ty-=s;if(K.s||K.arrowdown)cam.ty+=s;}
  if(g.started&&!g.over&&!g.o.mp&&(g.o.demo||(!UI.paused&&!UI.screen))){acc+=dt*(g.o.demo?2:UI.speed);let n=0;while(acc>=100&&n<10){tick(g);acc-=100;n++;}if(n===10)acc=0;}
  handleEvents();draw(g,dt,ts);
  if(ts-UI.lastHud>250){UI.lastHud=ts;hudUpdate();const m=$('#mini');if(m&&!UI.mob&&!g.o.demo&&!UI.screen)drawMini(g,m);}
  if(UI.screen==='end')repStep(dt);
}
// the game moved to its own domain: the old address offers a one-tap move that carries this device's progress along
const NEW_SITE='https://sijalwar.com/',OLD_HOST='saadsd151.github.io';
const b64u=s=>btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''),unb64u=s=>decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/'))));
function moveIn(){
  const m=/(?:^#|&)mv=([A-Za-z0-9_-]+)/.exec(location.hash||'');if(!m)return;const r=/(?:^#|&)r=([A-Z0-9]{5})/.exec(location.hash);
  try{const raw=unb64u(m[1]),imp=JSON.parse(raw);let cur={};try{cur=JSON.parse(localStorage.getItem('sijal.v1')||'{}')||{};}catch(e){}
    // never overwrite an account or more progress already on this site
    if(imp&&typeof imp==='object'&&!(cur.fb&&cur.fb.user)&&(cur.games|0)<=(imp.games|0)){localStorage.setItem('sijal.v1',raw);UI.movedIn=1;}}catch(e){}
  history.replaceState(null,'',location.pathname+location.search+(r?'#'+r[1]:''));
}
function moveNotice(){
  if(location.hostname!==OLD_HOST||$('#moved'))return;const d=document.createElement('div');d.id='moved';
  d.innerHTML=`<div class="mvc"><div class="mvi">🎉</div><h2>${t('mvT')}</h2><p>${t('mvD')}</p><div class="mvl" dir="ltr">sijalwar.com</div><button class="btn big ok" data-a="moveGo">${t('mvGo')} <span id="mvN">5</span></button><p class="mvs">${t('mvKeep')}</p></div>`;
  $('#app').appendChild(d);
  // no staying behind: the move happens by itself after a short countdown
  let n=5;const tm=setInterval(()=>{n--;const e=$('#mvN');if(e)e.textContent=n>0?n:'';if(n<=0){clearInterval(tm);act('moveGo');}},1000);
}
// new players without an account get one friendly card pointing at the player card in the top corner
function accHint(){
  const p=UI.prof;if((p.fb||{}).user||p.accHint||UI.screen!=='menu'||!cloudOn()||$('#acchint')||$('#moved'))return;
  const chip=document.querySelector('#menu .pchip');if(!chip)return;const r=chip.getBoundingClientRect(),d=document.createElement('div');d.id='acchint';
  d.innerHTML=`<i class="ar"></i><b>💾 ${t('ahT')}</b><p>${t('ahD')}</p><div class="row"><button class="btn sm ok" data-a="acHintGo">${t('ahGo')}</button><button class="btn sm" data-a="acHintX">${t('ahLater')}</button></div>`;
  $('#app').appendChild(d);const w=Math.min(320,innerWidth-24),x=Math.min(Math.max(12,r.left+r.width/2-w/2),innerWidth-w-12);d.style.cssText=`left:${x}px;top:${r.bottom+14}px;width:${w}px`;
  d.querySelector('.ar').style.left=(r.left+r.width/2-x-9)+'px';stat('acchint');
}
function boot(){
  moveIn();
  cv=$('#cv');ctx=cv.getContext('2d');loadProf();applyMode();makeGlyphs();
  // offline play on the website: keep a copy of the game on the device
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('sw.js').catch(()=>{});
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
  statBoot();
  if(UI.prof.seen!==LOG[0].v){renderNews(true);show('help');UI.prof.seen=LOG[0].v;saveProf();}
  {const h=(location.hash||'').slice(1).toUpperCase();if(/^[A-Z0-9]{5}$/.test(h)){UI.joinCode=h;renderNet();show('net');}}
  // players without the full season get PayPal ready in the background a few seconds after start
  setTimeout(()=>{if((UI.prof.passT==null?-1:UI.prof.passT)<PASS.length)ppPrep();},5000);
  setTimeout(accHint,4000);
  moveNotice();if(UI.movedIn)setTimeout(()=>toast(t('mvDone'),'prop',4500),1200);
  window.__sijal={get G(){return G;},cb:canBuild,NET,LOBBY,snd:{AU,SFX,atkBeat,defBeat,tone,noise},fn:{launchMissile,build,launchAttack,setAlly,breakAlly,gift,seaIsShorter,launchBoat,waterPath,useUlt},UI,R,cam,act,tap:onMapTap,setOwnerX:(i,o)=>setOwner(G,i,o),stat:{flush:statFlush,ping:statPing},acc:{gCred,accInfoLoad},run:n=>{for(let i=0;i<n;i++)tick(G);}};
}
boot();
