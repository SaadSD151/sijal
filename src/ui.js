// ── SIJAL · interface, input, audio, game loop ──
let G=null,acc=0,lastTs=0;
// public key for the suggestions inbox (Web3Forms); used when the game is not served from Netlify
const SUGGEST_KEY='137b52a0-fd63-4170-99f2-83a421aef9f4';
const $=s=>document.querySelector(s),BAR=['city','fort','port','coast','silo','shield','rocket','nuke','doom','ult'],rankOf=p=>p.wins<=0?0:Math.min(21,Math.ceil(p.wins/25)),SIZES=[[320,200],[420,264],[540,340],[680,428]],BOTS=[6,10,14,18,23];

// ── profile (per-device convenience only) ──
function loadProf(){
  let p={};try{p=JSON.parse(localStorage.getItem('sijal.v1')||'{}')||{};}catch(e){}
  UI.prof=Object.assign({xp:0,games:0,wins:0,lang:'ar',sound:true,music:true,ui:0,fac:'hawks',name:'',type:'continents',size:-1,bots:-1,diff:1,daily:{}},p);
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
function show(name){
  UI.screen=name;for(const s of document.querySelectorAll('.screen'))s.hidden=s.id!==name;
  $('#hud').hidden=!(G&&!G.o.demo&&(!name||name==='pause'));
}
function loading(on){const l=$('#load');l.hidden=!on;l.firstChild.textContent=t('loading');}
function renderMenu(){
  const p=UI.prof,rk=rankOf(p);
  $('#menu').innerHTML=`<div class="logo"><div class="l1">${t('title')}</div><div class="l2">${t('sub')}</div><div class="l3">${t('tag')}</div></div>
  <div class="mb"><button class="btn big" data-a="quick">${t('quick')}</button><button class="btn" data-a="custom">${t('custom')}</button><button class="btn" data-a="online">${t('online')}</button><button class="btn" data-a="daily">${t('daily')}</button><button class="btn" data-a="how">${t('how')}</button><button class="btn" data-a="suggest">${t('suggest')}</button><button class="btn" data-a="settings">${t('settings')}</button><button class="btn acc" data-a="account">${t('account')}</button><button class="btn news" data-a="news">${t('news')}</button></div>
  <div class="mf"><span class="rk">${t('rank')}: <b>${t('ranks')[rk]}</b> · ${p.wins} ${t('wins')}</span><span class="made">${t('made')}</span></div>`;
}
// small preview of each world shape, generated once from a fixed seed
const THUMB={};
function worldThumb(k){
  if(THUMB[k])return THUMB[k];const M=genMap({w:200,h:125,seed:4242,type:k}),c=mk(200,125),x=c.getContext('2d'),im=x.createImageData(200,125),d=new Uint32Array(im.data.buffer);
  const C=[0xff6e3a10,0xff9c6f2a,0xff54a07c,0xff427646,0xff88c6de,0xff648c94,0xff72787e,0xffeee8e2];
  for(let i=0;i<M.N;i++)d[i]=C[M.ter[i]];x.putImageData(im,0,0);return THUMB[k]=c.toDataURL();
}
function renderSetup(){
  const p=UI.prof;if(p.size<0)p.size=UI.mob?0:1;if(!p.botsN)p.botsN=UI.mob?10:14;
  const chips=(key,arr,cur)=>arr.map((s,i)=>`<button class="chip${i===cur?' on':''}" data-a="set:${key}:${i}">${s}</button>`).join('');
  const host=UI.setupMode==='host'||(NET.on&&NET.host);
  $('#setup').innerHTML=`<h2>${t(host?'hostRoom':'custom')}</h2>
  <div class="opts">${host?`<label class="fld"><h3>${t('roomName')}</h3><input id="inRoom" maxlength="24" value="${esc(p.room||'')}" placeholder="${esc(t('roomOf',p.name||t('defName')))}" autocomplete="off"></label>`:''}<div><h3>${t('world')}</h3><div class="wts">${Object.keys(t('types')).map(k=>`<button class="wt${p.type===k?' on':''}" data-a="type:${k}"><img src="${worldThumb(k)}" alt=""><span>${t('types')[k]}</span></button>`).join('')}</div></div>
  <div><h3>${t('size')}</h3><div class="chips">${chips('size',t('sizes'),p.size)}</div></div>
  <div><h3>${t('foes')}</h3><div class="rng"><input type="range" id="inBots" min="6" max="30" step="1" value="${p.botsN}" aria-label="${t('foes')}"><b id="botsV">${p.botsN}</b></div></div>
  <div><h3>${t('diff')}</h3><div class="chips">${chips('diff',t('diffs'),p.diff)}</div></div></div>
  ${host?`<div class="chips"><span class="rk">${t('roomType')}:</span><button class="chip${p.pub!==false?' on':''}" data-a="pub:1">${t('pubRoom')}</button><button class="chip${p.pub===false?' on':''}" data-a="pub:0">${t('privRoom')}</button></div>`:''}
  ${NET.on&&NET.host?`<div class="row"><button class="btn" data-a="lobbyBack">${t('lobby')} (${NET.players.length})</button><button class="btn big" data-a="netStart">${t('startNet')}</button></div>`:`${host?`<div class="row"><button class="btn" data-a="online">${t('back')}</button><button class="btn big" data-a="hostRoom">${t('hostRoom')}</button></div>`:`<div class="row"><button class="btn" data-a="menu">${t('back')}</button><button class="btn big" data-a="go">${t('start')}</button></div>`}`}`;
}
function renderHelp(){
  $('#help').innerHTML=`<h2>${t('how')}</h2><div class="hl">${t('help').map(h=>`<div><b>${h[0]}</b><p>${h[1]}</p></div>`).join('')}</div><p class="keys">${t('keys')}</p><div class="row"><button class="btn big" data-a="helpBack">${t('back')}</button></div>`;
}
const dayKey=()=>{const d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();};
function renderDaily(){
  const key=dayKey(),ty=Object.keys(TX.ar.types)[key%9],b=UI.prof.daily[key];
  $('#help').innerHTML=`<h2>${t('daily')}</h2><div class="wt on" style="width:min(300px,100%)"><img src="${worldThumb(ty)}" alt=""><span>${t('dWorld')}: ${t('types')[ty]}</span></div>
  <div class="hl" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">${t('dInfo').map(h=>`<div><b>${h[0]}</b><p>${h[1]}</p></div>`).join('')}</div>
  <p class="best">${b?t('best',clock(b)):t('dNone')}</p><div class="row"><button class="btn" data-a="menu">${t('back')}</button><button class="btn big" data-a="dailyGo">${t('dGo')}</button></div>`;
}
// quick battle: more rivals on bigger maps and harder difficulties
const quickBots=p=>clamp([8,12,16,22][p.size<0?1:p.size]+[0,2,4,6][p.diff|0],6,30);
function renderQuick(){
  const p=UI.prof;if(p.size<0)p.size=UI.mob?0:1;
  const chips=(key,arr,cur)=>arr.map((x,i)=>`<button class="chip${i===cur?' on':''}" data-a="set:${key}:${i}">${x}</button>`).join('');
  $('#help').innerHTML=`<h2>${t('quick')}</h2><div class="opts" style="grid-template-columns:minmax(0,1fr);width:min(520px,100%)"><div><h3>${t('size')}</h3><div class="chips">${chips('size',t('sizes'),p.size)}</div></div><div><h3>${t('diff')}</h3><div class="chips">${chips('diff',t('diffs'),p.diff)}</div></div><p class="keys">${t('foes')}: <b>${quickBots(p)}</b></p></div>
  <div class="row"><button class="btn" data-a="menu">${t('back')}</button><button class="btn big" data-a="goQ">${t('start')}</button></div>`;
}
function renderSettings(){
  const p=UI.prof,vm=p.volM==null?70:p.volM,vs=p.volS==null?70:p.volS;
  $('#help').innerHTML=`<h2>${t('settings')}</h2><div class="opts" style="grid-template-columns:minmax(0,1fr);width:min(460px,100%)">
  <div><h3>${t('volM')}</h3><div class="rng"><input type="range" id="volM" min="0" max="100" step="5" value="${vm}" aria-label="${t('volM')}"><b id="volMv">${vm}</b></div></div>
  <div><h3>${t('volS')}</h3><div class="rng"><input type="range" id="volS" min="0" max="100" step="5" value="${vs}" aria-label="${t('volS')}"><b id="volSv">${vs}</b></div></div>
  <div><h3>${t('langName')}</h3><div class="chips" style="justify-content:flex-start"><button class="chip${UI.lang==='ar'?' on':''}" data-a="lang:ar">العربية</button><button class="chip${UI.lang==='en'?' on':''}" data-a="lang:en">English</button></div></div>
  <div><h3>${t('iface')}</h3><div class="chips" style="justify-content:flex-start">${t('ifs').map((x,i)=>`<button class="chip${p.ui===i?' on':''}" data-a="ifc:${i}">${x}</button>`).join('')}</div></div></div>
  <div class="row"><button class="btn big" data-a="setBack">${t('ok')}</button></div>`;
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
function renderAmode(){
  const e=$('#amode'),p=UI.prof,m=p.amode||'pt';if(!e)return;
  e.innerHTML=`<button class="amh" data-a="amT" aria-expanded="${!p.amHide}">${t('amode')} ${p.amHide?'▸':'▾'}</button>`+(p.amHide?'':`<button class="chip${m==='pt'?' on':''}" data-a="am:pt">${t('am_pt')}</button><button class="chip${m==='all'?' on':''}" data-a="am:all">${t('am_all')}</button>`);
}
function renderAccount(){
  const p=UI.prof,rk=rankOf(p);
  $('#help').innerHTML=`<h2>${t('account')}</h2><div class="opts" style="grid-template-columns:minmax(0,1fr);width:min(420px,100%)"><label class="fld"><h3>${t('accName')}</h3><input id="inName" maxlength="18" value="${esc(p.name)}" placeholder="${t('defName')}" autocomplete="off"></label></div>
  <div class="stats" style="width:min(420px,100%);grid-template-columns:repeat(4,minmax(0,1fr))">${[[t('rank'),t('ranks')[rk]],[t('x_xp'),p.xp],[t('accGames'),p.games],[t('wins'),p.wins]].map(x=>`<div><small>${x[0]}</small><b>${x[1]}</b></div>`).join('')}</div>
  <p class="keys">${rk<21?t('accNext',rk*25+1-p.wins,t('ranks')[rk+1]):''}</p><p class="keys">${t('accNote')}</p><div class="row"><button class="btn" data-a="ranks">${t('allRanks')}</button><button class="btn big" data-a="menu">${t('back')}</button></div>`;
}
function renderNews(latest){
  const L=(latest?LOG.slice(0,1):LOG.slice(0,10));
  $('#help').innerHTML=`<h2>${t(latest?'newsNew':'news')}</h2><div class="nl">${L.map(e=>`<div><b>${t('ver')} ${e.v}</b><small>${e.d}</small><ul>${(e[UI.lang]||e.ar).map(x=>`<li>${x}</li>`).join('')}</ul></div>`).join('')}</div><div class="row"><button class="btn big" data-a="menu">${t('ok')}</button></div>`;
}
function renderFac(){
  const e=$('#fpick'),p=UI.prof;if(!e)return;e.hidden=UI.phase!=='spawn';if(e.hidden)return;
  e.innerHTML=`<h4>${t('faction')}</h4><div class="chips">${FKEYS.map(f=>`<button class="chip${p.fac===f?' on':''}" data-a="fac:${f}"><i style="background:rgb(${FAC[f].c})"></i>${t('f_'+f)}</button>`).join('')}</div><small>${t('fp_'+p.fac)} · ${t('fu_'+p.fac)}: ${t('fd_'+p.fac)}</small>`;
}
function renderPause(){
  const p=UI.prof;$('#pause').innerHTML=`<h2>${t('paused')}</h2><div class="mb"><button class="btn big" data-a="resume">${t('resume')}</button><button class="btn" data-a="settings">${t('settings')}</button><button class="btn" data-a="how">${t('how')}</button>
  <button class="btn" data-a="toMenu">${t('quit')}</button></div>`;
}

// ── match lifecycle ──
function prep(g){
  for(const n of g.nations)if(n){n.me=n.id===g.human;natPix(n);}buildTerrain(g);acc=0;UI.rows=new Map();UI.chips=new Map();UI.anx=new Map();UI.hintI=0;UI.hintShown=false;UI.sel=0;UI.mode=null;
  lookAt(g.W/2,g.H/2,fitZoom(g)*(g.o.demo?1.5:1),true);
}
function startDemo(){G=newGame({w:200,h:128,seed:(Math.random()*2**31)|0,type:'continents',bots:9,diff:1,demo:true});prep(G);startGame(G);}
function startMatch(o){
  const p=UI.prof;if(p.size<0)p.size=UI.mob?0:1;if(!p.botsN)p.botsN=UI.mob?10:14;saveProf();
  let opt={w:SIZES[p.size][0],h:SIZES[p.size][1],seed:(Math.random()*2**31)|0,type:p.type,bots:o.quick?quickBots(p):clamp(p.botsN|0,6,30),diff:p.diff,faction:p.fac};
  if(o.daily){const d=new Date(),key=d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();opt={w:420,h:264,seed:key,type:Object.keys(TX.ar.types)[key%9],bots:14,diff:2,faction:p.fac,daily:key};}
  if(o.same&&UI.lastOpt)opt=Object.assign({},UI.lastOpt,{seed:UI.lastOpt.daily?UI.lastOpt.seed:(Math.random()*2**31)|0});
  UI.lastOpt=opt;loading(true);
  setTimeout(()=>{G=newGame(opt);prep(G);UI.phase='spawn';UI.paused=false;UI.speed=1;buildHud();show(null);hint(t('spawn'),true);loading(false);},40);
}
function toMenu(){UI.war=false;UI.threats=[];if(NET.on)netClose();UI.phase='';startDemo();renderMenu();show('menu');}
function showEnd(){
  const g=G,o=g.over,p=UI.prof;if(!o||g.o.demo||UI.screen==='end')return;const me=g.nations[g.human],w=g.nations[o.w];
  const xp=10+(o.win?60:0)+me.st.cities*4+me.st.kills*15;p.xp+=xp;p.games++;if(o.win)p.wins++;
  let best='';if(g.o.daily&&o.win){const b=p.daily[g.o.daily];if(!b||g.tick<b)p.daily={[g.o.daily]:g.tick};best=`<p class="best">${t('best',clock(p.daily[g.o.daily]))}</p>`;}
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
  if(be.dataset.k!==ek){be.dataset.k=ek;be.innerHTML=`<span>${t('eras')[me.era-1]}</span>`+(me.era<4?`<b>▲ ${eraCost(me)}</b>`:'');be.classList.toggle('rdy',me.era<4&&me.gold>=eraCost(me));be.title=me.era<4?t('advance',t('eras')[me.era]):'';}
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
function toast(html,cls,ms){const box=$('#toasts');if(!box||(box.lastChild&&box.lastChild.dataset.k===html))return null;const d=document.createElement('div');d.dataset.k=html;d.className='ts pn '+(cls||'');d.innerHTML=html;box.appendChild(d);while(box.children.length>3)box.firstChild.remove();if(ms!==0)setTimeout(()=>d.remove(),ms||2200);return d;}
function err(code){sfx('err');toast(t('e_'+code),'bad');}
function sayLine(n,key){if(!n)return;const L=t('say_'+key);feed(`${nmh(n)} <span class="q">«${L[(Math.random()*L.length)|0]}»</span>`,'say');}

// nation card
function openCard(id,tile){UI.cardTile=tile==null?-1:tile;
  const g=G,n=g.nations[id];if(!n||!n.alive||id===g.human||UI.phase!=='play')return;UI.sel=id;UI.cardKey='';UI.cardGift=Math.max(50,Math.round(g.nations[g.human].gold*.25/10)*10);
  const c=$('#card');c.hidden=false;
  c.innerHTML=`<div class="ch"><i style="background:${n.css}"></i><div><b>${esc(natName(n))}</b><small>${leader(n)} · ${t('f_'+n.fac)} · ${t('p_'+n.pers)}</small></div><button class="ib" data-a="closeCard" aria-label="close">✕</button></div>
  <div class="cs"><div><small>${t('troops')}</small><b id="cT"></b></div><div><small>${t('land')}</small><b id="cL"></b></div><div><small>${t('cities')}</small><b id="cC"></b></div><div><small>${t('mood')}</small><b id="cM"></b></div></div><div id="cS"></div><div class="cb" id="cB"></div>`;
  cardRefresh();
}
function closeCard(){const c=$('#card');if(c)c.hidden=true;UI.sel=0;}
function cardRefresh(){
  const g=G,id=UI.sel,c=$('#card');if(!id||!c||c.hidden)return;const n=g.nations[id],me=g.nations[g.human];if(!n.alive||!me.alive)return closeCard();
  $('#cT').textContent=fmt(n.troops);$('#cL').textContent=(n.tiles/g.M.land*100).toFixed(1)+'%';$('#cC').textContent=n.cnt.city;
  const a=n.att[me.id],mi=a<-40?0:a<-10?1:a<10?2:a<40?3:4,M=$('#cM');M.textContent=t('moods')[mi];M.className='m'+mi;
  const ally=me.ally[id],war=g.tick-me.lastHit[id]<300||g.tick-n.lastHit[me.id]<300,key=ally+'|'+war,S=$('#cS');
  S.textContent=t(ally?'st_ally':war?'st_war':'st_peace')+(ally?' · '+t('allyLeft',clock(Math.max(0,me.allyUntil[id]-g.tick))):'');S.className=ally?'good':war?'bad':'';
  if(key===UI.cardKey)return;UI.cardKey=key;let any=false;for(const m of g.nations)if(m&&m.alive&&me.ally[m.id]&&m.id!==id)any=true;
  $('#cB').innerHTML=(ally?'':`<button class="btn sm go" data-a="atk:${id}">${t(canAnnex(g,me.id,id)?'b_annexS':'b_atk')}</button><button class="btn sm" data-a="sea:${id}">${t('b_sea')}</button>`)+(ally?`<button class="btn sm" data-a="break:${id}">${t('b_break')}</button>`:`<button class="btn sm" data-a="ally:${id}">${t('b_ally')}</button>`)+`<button class="btn sm" data-a="gift:${id}">${t('b_gift',UI.cardGift)}</button>`+(!ally&&any?`<button class="btn sm" data-a="arms:${id}">${t('b_arms')}</button>`:'')+`<button class="btn sm" data-a="find:${id}">${t('b_find')}</button>`;
}

// ── player actions ──
function setMode(m){UI.mode=m;UI.pend=-1;if(UI.mob)UI.hover=-1;for(const d of document.querySelectorAll('.ts.cfm'))d.remove();if(m)hint(m[0]==='b'?t('pick',t('s_'+m.slice(2))):t('aim'),true);else hint(null);hudUpdate();}
function barAct(k){
  const g=G,me=g.nations[g.human];if(UI.phase!=='play'||!me.alive)return;let r=0,m=null;
  if(k==='ult'){const u=FAC[me.fac].ult;if(g.tick<me.ultAt)r='cd';else if(me.gold<ULT[u].cost)r='gold';else if(ULT[u].tg)m='u:'+u;else send({k:'ult'});}
  else if(MSL[k]){if(me.era<MSL[k].era)r='era';else if(!me.cnt.silo)r='nosilo';else if(me.gold<mslCost(me,k))r='gold';else m='m:'+k;}
  else{r=canBuild(g,me,k,-1);if(!r)m='b:'+k;}
  if(r)return err(r);if(m)setMode(UI.mode===m?null:m);else sfx('click');
}
function placeAt(i){const m=UI.mode;if(!m||i<0)return;const k=m.slice(2);send(m[0]==='b'?{k:'build',s:k,i,R:UI.mob?6:4}:m[0]==='m'?{k:'msl',s:k,i}:{k:'ult',i});setMode(null);}
function onMapTap(i,x,y){
  const g=G;if(!g||g.o.demo||UI.screen)return;const me=g.nations[g.human];
  if(UI.phase==='spawn')return send({k:'spawn',i,fac:UI.prof.fac});
  if(UI.phase!=='play'||!me.alive)return;
  const m=UI.mode;
  if(m){if(UI.mob){if(m[0]==='b'){const k=m.slice(2);if(k==='port'||k==='coast')i=snapPort(g,me,i,6,k);const r=canBuild(g,me,k,i);if(r)return err(r);}UI.pend=UI.hover=i;for(const d of document.querySelectorAll('.ts.cfm'))d.remove();toast(`<span>${m[0]==='b'?t('s_'+m.slice(2)):t('aim')}</span><button class="btn sm ok" data-a="cfm">${t('confirm')}</button><button class="btn sm" data-a="cfx">${t('cancel')}</button>`,'prop cfm',0);return;}
    placeAt(i);return;}
  if(g.M.ter[i]<2)return closeCard();
  const o=g.owner[i];if(o===me.id)return closeCard();if(o&&me.ally[o])return openCard(o);
  if(o&&UI.mob&&!g.nations[o].minor)return openCard(o,i);
  send({k:'atk',i,r:UI.ratio,m:UI.prof.amode||'pt'});
}
function act(a){
  const g=G,p=UI.prof,[k,v,w]=a.split(':'),me=g&&g.human?g.nations[g.human]:null;auInit();
  switch(k){
    case'quick':renderQuick();show('help');break;case'go':startMatch({});break;case'goQ':startMatch({quick:true});break;case'cfm':placeAt(UI.pend);break;case'cfx':setMode(null);break;case'again':if(NET.on)return toMenu();startMatch({same:true});break;
    case'online':renderNet();show('net');break;case'joinR':netJoin(v);break;case'rematch':netRematch();break;case'lobbyBack':renderLobby();show('net');break;case'pub':p.pub=v==='1';if(NET.on&&NET.host){NET.pub=p.pub;if(NET.pub)regSend();else regUnreg();}renderSetup();break;case'hostRoom':netHost();break;case'join':netJoin(($('#inCode')||{}).value);break;case'netStart':hostStart();break;case'leave':netClose();renderMenu();show('menu');break;case'daily':renderDaily();show('help');break;case'dailyGo':startMatch({daily:true});break;
    case'custom':UI.setupMode='solo';renderSetup();show('setup');break;case'hostSetup':UI.setupMode='host';renderSetup();show('setup');break;case'menu':renderMenu();show('menu');break;case'toMenu':toMenu();break;
    case'how':UI.helpBack=UI.screen;renderHelp();show('help');break;case'helpBack':show(UI.helpBack==='pause'?'pause':'menu');break;
    case'lang':p.lang=UI.lang=v||(UI.lang==='ar'?'en':'ar');applyMode();if(G&&!G.o.demo)buildHud();renderSettings();break;
    case'snd':p.sound=!p.sound;applyVol();UI.screen==='pause'?renderPause():renderMenu();break;case'mus':p.music=!p.music;applyVol();UI.screen==='pause'?renderPause():renderMenu();break;
    case'ifc':p.ui=v==null?(p.ui+1)%3:+v;applyMode();resize();renderSettings();break;
    case'fac':p.fac=v;renderFac();break;case'account':renderAccount();show('help');break;case'suggest':renderSuggest();show('help');break;case'sgSend':sendSuggest();break;case'ranks':renderRanks();show('help');break;case'settings':UI.setBack=UI.screen;renderSettings();show('help');break;case'setBack':if(UI.setBack==='pause'){renderPause();show('pause');}else{renderMenu();show('menu');}break;case'news':renderNews();show('help');break;
    case'atk':{const n=g.nations[+v],ti=UI.cardTile>=0&&g.owner[UI.cardTile]===+v?UI.cardTile:n.cap?n.cap.i:-1;closeCard();if(ti>=0)send({k:'atk',i:ti,r:UI.ratio,m:UI.prof.amode||'pt'});break;}case'type':p.type=v;renderSetup();break;case'set':p[v]=+w;UI.screen==='help'?renderQuick():renderSetup();break;
    case'pause':if(UI.phase==='play'||UI.phase==='spawn'||UI.phase==='wait'){renderPause();show('pause');}break;case'resume':show(null);break;
    case'sp':if(NET.on&&!NET.host)return err('hostOnly');if(+v===0)UI.paused=!UI.paused;else{UI.speed=+v;UI.paused=false;}hudUpdate();break;
    case'b':return barAct(v);
    case'era':if(me&&me.era<4){if(me.gold<eraCost(me))return err('gold');send({k:'era'});}break;
    case'lb':$('#lb').classList.toggle('open');break;
    case'home':if(me&&me.cap)lookAt(me.cap.x,me.cap.y,Math.max(cam.tz,5));break;
    case'nat':if(+v!==g.human)openCard(+v);else if(me.cap)lookAt(me.cap.x,me.cap.y);if(UI.mob)$('#lb').classList.remove('open');break;
    case'closeCard':closeCard();break;
    case'am':p.amode=v;renderAmode();break;case'amT':p.amHide=!p.amHide;renderAmode();break;
    case'renew':{send({k:'renew',d:+v,y:+w});for(const d of document.querySelectorAll('.ts[data-ally="'+(+v)+'"]'))d.remove();if(+w)feed(t('m_renewSent',nmh(g.nations[+v])),'good');break;}
    case'sea':{const ti=UI.cardTile;closeCard();send({k:'sea',d:+v,i:ti,r:UI.ratio});break;}
    case'goatk':{const q=g.attacks.find(q=>q.id===+v),D=q&&q.d?g.nations[q.d]:null;if(D)lookAt(D.cx,D.cy,Math.max(cam.tz,4));else if(q)lookAt(q.ox,q.oy,Math.max(cam.tz,4));break;}
    case'annex':{const n=g.nations[+v];if(n&&n.cap)send({k:'atk',i:n.cap.i,r:UI.ratio});break;}
    case'ally':send({k:'ally',d:+v});break;case'break':send({k:'break',d:+v});break;
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
      case'trade':if(e.a===me){addFx('text',e.x,e.y,{s:'+'+e.amt,dur:1400,col:'#ffe9a8'});sfx('trade');}break;
      case'dead':if(e.d===me&&g.o.mp){banner(t('mpDead'),'bad');feed(t('mpDead'),'bad');sfx('lose');}break;
      case'proposal':{if(e.b!==me)break;const d=toast(`<span>${t('m_prop',nmh(A))}</span><button class="btn sm" data-a="acc:${A.id}">${t('yes')}</button><button class="btn sm" data-a="rej:${A.id}">${t('no')}</button><button class="btn sm" data-a="find:${A.id}">${t('b_focus')}</button>`,'prop',0);if(d)d.dataset.from=A.id;sfx('coin');break;}
      case'reject':if(e.b===me){feed(t('m_rej',nmh(A)));sayLine(A,'reject');}break;
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
    clearTimeout(lp);if(!P.delete(e.pointerId))return;const q=xy(e);
    if(P.size===0){
      if(down&&!drag&&e.type==='pointerup'&&G&&!G.o.demo){const i=tileAt(q.x,q.y);
        if(down.b===2){const o=i>=0?G.owner[i]:0;if(o&&o!==G.human)openCard(o);else setMode(null);}else if(i>=0)onMapTap(i,q.x,q.y);}
      else if(UI.aim&&e.type==='pointerup'&&G&&!G.o.demo){const i=tileAt(q.x,q.y);if(i>=0)onMapTap(i,q.x,q.y);}
      UI.aim=null;down=null;drag=false;
    }else{down=null;drag=true;pd=0;}
  };
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('pointerleave',e=>{if(e.pointerType!=='mouse')return;UI.hover=-1;const tp=$('#tip');if(tp)tp.hidden=true;});
  cv.addEventListener('wheel',e=>{e.preventDefault();if(G&&!G.o.demo){const q=xy(e);zoomAt(G,q.x,q.y,Math.exp(-e.deltaY*.0016));}},{passive:false});
  cv.addEventListener('contextmenu',e=>e.preventDefault());
  $('#app').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&!b.disabled)act(b.dataset.a);});
  $('#app').addEventListener('input',e=>{if(e.target.id==='inName'){UI.prof.name=e.target.value.trim().slice(0,18);saveProf();}else if(e.target.id==='inRoom'){UI.prof.room=e.target.value.trim().slice(0,24);saveProf();if(NET.on&&NET.host)regSend();}else if(e.target.id==='volM'||e.target.id==='volS'){const k=e.target.id;UI.prof[k]=+e.target.value;UI.prof[k==='volM'?'music':'sound']=+e.target.value>0;$('#'+k+'v').textContent=e.target.value;applyVol();if(k==='volS')sfx('coin');saveProf();}else if(e.target.id==='inBots'){UI.prof.botsN=+e.target.value;$('#botsV').textContent=e.target.value;saveProf();}});
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
  requestAnimationFrame(frame);const dt=Math.min(100,(ts-lastTs)||16);lastTs=ts;const g=G;if(!g||!R.land)return;
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
  resize();addEventListener('resize',()=>{applyMode();resize();});
  if(window.ResizeObserver)new ResizeObserver(resize).observe(cv);
  bindInput();renderMenu();show('menu');startDemo();requestAnimationFrame(frame);setInterval(musicTick,215);for(const ev of['touchend','pointerup','click','keydown'])document.addEventListener(ev,auInit,{passive:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&AU.ctx)auInit();});setInterval(netTick,50);addEventListener('pagehide',()=>{if(NET.on)netClose();});
  if(UI.prof.seen!==LOG[0].v){renderNews(true);show('help');UI.prof.seen=LOG[0].v;saveProf();}
  {const h=(location.hash||'').slice(1).toUpperCase();if(/^[A-Z0-9]{5}$/.test(h)){UI.joinCode=h;renderNet();show('net');}}
  window.__sijal={get G(){return G;},cb:canBuild,NET,LOBBY,UI,R,cam,act,tap:onMapTap,run:n=>{for(let i=0;i<n;i++)tick(G);}};
}
boot();
