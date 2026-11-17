// ── SIJAL · online play: host-run lockstep over WebRTC (PeerJS broker), every client simulates the same world ──
const NET={on:false,host:false,started:false,conns:[],players:[],q:[],code:'',peer:null,up:null,sums:{},last:0,acc:0,goAt:0,warned:false};
const BCMODE=/[?&]bc=1/.test(location.search);
// every player action goes through here: applied at once offline, or sent to the host online
function send(c){const g=G;if(!g)return;if(!NET.on)return applyCmd(g.human,c);if(NET.host)NET.q.push([g.human,c]);else if(NET.up)NET.up.send({t:'c',c});}
function applyCmd(pid,c){
  const g=G,n=g.nations[pid],mine=pid===g.human,W=g.W;if(!n||!c)return;let r=0;
  if(c.k==='spawn'){
    if(g.started||n.spawned||!(c.i>=0&&c.i<g.N)||!canSpawn(g,c.i)){if(mine)err('spawn');return;}
    if(FAC[c.fac])n.fac=c.fac;if(!g.o.mp){n.color=FAC[n.fac].c;natPix(n);R.full=true;}
    spawn(g,n,c.i);
    if(mine){const tx=c.i%W,ty=(c.i/W)|0;sfx('city');lookAt(tx,ty,Math.max(fitZoom(g)*2.4,UI.mob?5:6));for(let k=0;k<3;k++)addFx('ring',tx,ty,{r:6+k*3,dur:900+k*500,col:'#ffe9a8'});if(g.o.mp){UI.phase='wait';buildHud();hint(t('mpWait'),true);}}
    if(!g.o.mp){startGame(g);UI.phase='play';buildHud();UI.hintT=performance.now();hint(null);}
    return;
  }
  if(c.k==='go'){
    if(g.started)return;for(const m of g.nations)if(m&&m.human&&!m.spawned){const i=pickSpawn(g,12);if(i>=0)spawn(g,m,i);else m.alive=false;}
    startGame(g);UI.phase='play';UI.hintT=performance.now();hint(null);const me=g.nations[g.human];if(me&&me.cap)lookAt(me.cap.x,me.cap.y,Math.max(fitZoom(g)*2.4,UI.mob?5:6));return;
  }
  if(c.k==='drop'){if(n.human){n.human=false;feed(t('mpLeft',nmh(n)),'warn');}return;}
  if(!g.started||!n.alive)return;
  const D=c.d!=null?g.nations[c.d]:null;if(c.d!=null&&(!D||!D.alive||c.d===pid))return;
  switch(c.k){
    case'atk':{const i=c.i;if(!(i>=0&&i<g.N)||g.M.ter[i]<2)return;const tx=i%W,ty=(i/W)|0,o=g.owner[i],ratio=clamp(+c.r||.4,.05,1);if(o===pid)return;
      if(o&&canAnnex(g,pid,o)){const T=g.nations[o],nm=nmh(T),pn=natName(T);annex(g,pid,o);if(mine){feed(t('m_annex',nm),'good');sfx('city');banner(t('m_annex',pn));}return;}
      // the tapped spot is on a landmass we do not stand on: go by sea, landing on that landmass
      const lid=g.M.lid[i];let onIt=false;for(let j=0;j<g.N;j++)if(g.owner[j]===pid&&g.M.lid[j]===lid){onIt=true;break;}
      if(!onIt){let cc=g.M.coastD[i]===1&&portOk(g,i)?i:nearCoast(g,i,25);if(cc<0)cc=seaLanding(g,pid,o,lid);r=cc>=0?launchBoat(g,pid,cc,ratio):'nopath';
        if(mine){if(typeof r==='object'){sfx('boat');addFx('text',cc%W,(cc/W)|0,{s:fmt(r.troops),dur:1100,col:'#ffe9a8'});}else err(r);}return;}
      const before=n.troops;let boat=false;r=c.m==='all'?launchAttack(g,pid,o,ratio,-1,-1):launchAttack(g,pid,o,ratio,tx,ty,true);
      if(r==='noborder'){const cc=g.M.coastD[i]===1&&portOk(g,i)?i:nearCoast(g,i,8);r=cc>=0?launchBoat(g,pid,cc,ratio):'nopath';if(r==='nopath'){const sl=seaLanding(g,pid,o);if(sl>=0)r=launchBoat(g,pid,sl,ratio);}boat=typeof r==='object';}
      if(!mine)return;if(typeof r==='object')sfx(boat?'boat':'attack');if(r==='clash'){feed(t('m_clash'),'good');sfx('attack');}
      if(typeof r==='object'||r==='clash')addFx('text',tx,ty,{s:fmt(before-n.troops),dur:1100,col:'#ffe9a8'});else err(r);return;}
    case'sea':{if(!D)return;const ratio=clamp(+c.r||.4,.05,1);let cc=c.i>=0&&c.i<g.N&&g.owner[c.i]===c.d?(g.M.coastD[c.i]===1&&portOk(g,c.i)?c.i:nearCoast(g,c.i,8)):-1;
      r=cc>=0?launchBoat(g,pid,cc,ratio):'nopath';if(r==='nopath'){cc=seaLanding(g,pid,c.d);if(cc>=0)r=launchBoat(g,pid,cc,ratio);}
      if(mine){if(typeof r==='object'){sfx('boat');addFx('text',cc%W,(cc/W)|0,{s:fmt(r.troops),dur:1100,col:'#ffe9a8'});}else err(r);}return;}
    case'build':if(!ST[c.s])return;r=build(g,n,c.s,c.s==='port'||c.s==='coast'?snapPort(g,n,c.i,clamp(c.R|0,0,8),c.s):c.i);if(mine){if(r)err(r);else sfx('build');}return;
    case'msl':if(!MSL[c.s])return;r=launchMissile(g,pid,c.s,c.i);if(mine&&r)err(r);return;
    case'ult':r=useUlt(g,n,c.i);if(mine&&r)err(r);return;
    case'era':if(n.era<4&&!eraUp(g,n)&&mine)err('gold');return;
    case'ally':if(D)propose(g,pid,c.d);return;
    case'break':if(D)breakAlly(g,pid,c.d);return;
    case'gift':if(!D)return;r=gift(g,pid,c.d,+c.amt||0);if(mine){if(!r)err('gold');UI.cardGift=Math.max(50,Math.round(n.gold*.25/10)*10);UI.cardKey='';}return;
    case'renew':if(D&&n.ally[c.d])n.allyRen[c.d]=c.y?1:0;return;
    case'aid':if(D){r=sendAid(g,pid,c.d,+c.amt||0);if(mine&&r)err(r);}return;
    case'arms':if(D){const ok=callArms(g,pid,c.d);if(mine)feed(t(ok?'m_arms':'m_noAllies'));}return;
    case'cancel':{const q=g.attacks.find(q=>q.id===c.id&&q.a===pid);if(q)q.cancel=true;return;}
    case'acc':case'rej':{const j=g.proposals.findIndex(q=>q.from===c.d&&q.to===pid);if(j>=0){g.proposals.splice(j,1);if(c.k==='acc'&&D)setAlly(g,c.d,pid);}return;}
  }
}
// ── transport: PeerJS data channels, or BroadcastChannel between tabs when testing (?bc=1) ──
function loadPeer(cb,fail){if(BCMODE||window.Peer)return cb();const s=document.createElement('script');s.src='https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';s.onload=cb;s.onerror=()=>fail('net');document.head.appendChild(s);}
function wrap(c){const k={c,ok:false,send:d=>{try{c.send(d);}catch(e){}}};c.on('open',()=>{k.ok=true;k.onOpen&&k.onOpen();});c.on('data',d=>k.onData&&k.onData(d));c.on('close',()=>{k.ok=false;k.onClose&&k.onClose();});c.on('error',()=>{});return k;}
function hostOpen(code,onConn,ready,fail){
  if(BCMODE){const ch=NET.peer=new BroadcastChannel('sijal-'+code),map={};ch.onmessage=e=>{const m=e.data;if(m.to!=='host')return;let k=map[m.from];
      if(m.hello){k=map[m.from]={ok:true,send:d=>ch.postMessage({to:m.from,d})};onConn(k);}else if(m.bye){if(k){k.ok=false;k.onClose&&k.onClose();}}else if(k&&k.onData)k.onData(m.d);};return ready();}
  try{const p=NET.peer=new Peer('sijal-'+code);p.on('open',ready);p.on('connection',c=>onConn(wrap(c)));p.on('error',e=>fail(e.type==='unavailable-id'?'retry':'net'));}catch(e){fail('net');}
}
function clientOpen(code,onOpen,fail){
  if(BCMODE){const ch=NET.peer=new BroadcastChannel('sijal-'+code),id='c'+Math.random().toString(36).slice(2),k={ok:true,send:d=>ch.postMessage({to:'host',from:id,d})};
    ch.onmessage=e=>{if(e.data.to===id&&k.onData)k.onData(e.data.d);};ch.postMessage({to:'host',from:id,hello:1});k.bye=()=>ch.postMessage({to:'host',from:id,bye:1});return setTimeout(()=>onOpen(k),80);}
  try{const p=NET.peer=new Peer();p.on('open',()=>{const k=wrap(p.connect('sijal-'+code,{reliable:true,serialization:'json'}));k.onOpen=()=>onOpen(k);});
    p.on('error',e=>fail(e.type==='peer-unavailable'?'room':'net'));}catch(e){fail('net');}
}
function netClose(){
  regUnreg();try{if(NET.up&&NET.up.bye)NET.up.bye();if(NET.peer)(NET.peer.destroy||NET.peer.close).call(NET.peer);}catch(e){}
  Object.assign(NET,{on:false,host:false,started:false,conns:[],players:[],q:[],code:'',peer:null,up:null,sums:{},warned:false});
}
function netFail(code){const was=NET.started;netClose();loading(false);if(was)toMenu();else{renderNet();show('net');}err(code);}
// ── lobby ──
const myName=()=>(UI.prof.name||t('defName')).slice(0,18),roomName=()=>(UI.prof.room||t('roomOf',myName())).slice(0,24);
function netHost(tries){
  if(!BCMODE&&!window.RTCPeerConnection)return err('net');loading(true);
  loadPeer(()=>{const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let code='';for(let i=0;i<5;i++)code+=A[(Math.random()*A.length)|0];if(BCMODE&&window.SIJAL_CODE)code=window.SIJAL_CODE;
    hostOpen(code,k=>{const pl={name:'?',fac:'hawks',conn:k,in:false};
        k.onData=d=>{if(!d)return;
          if(d.t==='ping')return k.send({t:'pong',ts:d.ts});
          if(d.t==='hi'&&d.v!==BUILD_ID)return k.send({t:'ver'});
          if(d.t==='ack'){k.ack=d.k;return;}
          if(d.t==='hi'){if(NET.started||pl.in||NET.players.length>=16)return k.send({t:'full'});pl.name=String(d.name||'').slice(0,18)||'?';pl.fac=FAC[d.fac]?d.fac:'hawks';pl.in=true;NET.players.push(pl);NET.conns.push(k);lobbyOut();regSend();}
          else if(d.t==='c'&&NET.started&&k.pid)NET.q.push([k.pid,d.c]);
          else if(d.t==='sum'&&NET.sums[d.k]!=null&&NET.sums[d.k]!==d.v&&!k.bad){k.bad=true;k.send({t:'desync'});toast(t('mpDesync'),'bad',5000);}};
        k.onClose=()=>{if(!pl.in)return;pl.in=false;if(NET.started){if(k.pid)NET.q.push([k.pid,{k:'drop'}]);}else{NET.players=NET.players.filter(x=>x!==pl);NET.conns=NET.conns.filter(x=>x!==k);lobbyOut();regSend();}};},
      ()=>{loading(false);Object.assign(NET,{on:true,host:true,started:false,pub:UI.prof.pub!==false,code,players:[{name:myName(),fac:UI.prof.fac,conn:null,in:true}],conns:[],q:[]});renderLobby();show('net');regStart();regSend();},
      e=>{if(e==='retry'&&(tries|0)<4){try{NET.peer.destroy();}catch(_){}return netHost((tries|0)+1);}netFail('net');});},netFail);
}
function lobbyOut(){const list=NET.players.map(p=>({name:p.name,fac:p.fac}));NET.players.forEach((p,i)=>{if(p.conn)p.conn.send({t:'lobby',players:list,you:i,code:NET.code,room:roomName()});});if(UI.screen==='net')renderLobby();}
function netJoin(code){
  code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length<4)return err('room');if(!BCMODE&&!window.RTCPeerConnection)return err('net');loading(true);
  const to=setTimeout(()=>{if(!NET.on)netFail('room');},15000);
  loadPeer(()=>clientOpen(code,k=>{clearTimeout(to);loading(false);Object.assign(NET,{on:true,host:false,started:false,up:k,code,players:[]});
      k.onData=d=>{if(!d)return;
        if(d.t==='lobby'){NET.started=false;NET.room=d.room;NET.players=d.players;NET.you=d.you;renderLobby();show('net');}
        else if(d.t==='start')netStart(d.opt,d.me);
        else if(d.t==='f')applyFrame(d);
        else if(d.t==='full')netFail('full');
        else if(d.t==='ver')netFail('ver');
        else if(d.t==='pong'){NET.ping=Math.round(performance.now()-d.ts);const e=$('#myPing');if(e)e.outerHTML=pingTag(NET.ping,'myPing');}
        else if(d.t==='desync'&&!NET.warned){NET.warned=true;toast(t('mpDesync'),'bad',6000);}};
      k.onClose=()=>{if(NET.on)netFail('host');};
      k.send({t:'hi',name:myName(),fac:UI.prof.fac,v:window.SIJAL_FAKE_VER||BUILD_ID});},e=>{clearTimeout(to);netFail(e);}),e=>{clearTimeout(to);netFail(e);});
}
function hostStart(){
  if(!NET.host||NET.started)return;const p=UI.prof;if(p.size<0)p.size=UI.mob?0:1;if(!p.botsN)p.botsN=UI.mob?10:14;
  const opt={w:SIZES[p.size][0],h:SIZES[p.size][1],seed:(Math.random()*2**31)|0,type:p.type,bots:clamp(p.botsN|0,6,30),diff:p.diff,mp:true,players:NET.players.map(x=>({name:x.name,fac:x.fac}))};
  regUnreg();NET.waitAt=0;NET.waitShown=0;NET.players.forEach((x,i)=>{if(x.conn){x.conn.pid=i+1;x.conn.ack=0;x.conn.send({t:'start',opt,me:i});}});netStart(opt,0);
}
function netStart(opt,me){
  NET.started=true;NET.q=[];NET.sums={};loading(true);
  setTimeout(()=>{G=newGame(Object.assign({},opt,{me}));prep(G);UI.phase='spawn';UI.paused=false;UI.speed=1;buildHud();show(null);hint(t('mpSpawn'),true);loading(false);
    NET.last=performance.now();NET.acc=0;NET.goAt=NET.last+60000;if(NET.pend){const P=NET.pend;NET.pend=null;P.forEach(applyFrame);}},40);
}
function applyFrame(f){
  const g=G;if(!g||!g.o.mp){(NET.pend||(NET.pend=[])).push(f);return;}
  for(const pc of f.c)applyCmd(pc[0],pc[1]);
  if(f.r&&!g.over){tick(g);if(!NET.host&&NET.up&&g.tick%5===0)NET.up.send({t:'ack',k:g.tick});if(g.tick%100===0){let v=7;for(const n of g.nations)if(n)v=(v*31+n.tiles*7+Math.floor(n.troops))%1000000007;for(let i=0;i<g.N;i+=13)v=(v*33+g.owner[i])%1000000007;if(NET.host){NET.sums[g.tick]=v;delete NET.sums[g.tick-1000];}else if(NET.up)NET.up.send({t:'sum',k:g.tick,v});}}
}
function frameOut(r){const f={t:'f',c:NET.q,r};NET.q=[];for(const c of NET.conns)if(c.ok)c.send(f);applyFrame(f);}
function netTick(){
  const g=G;if(!NET.on||!NET.host||!NET.started||!g||!g.o.mp||g.over)return;const now=performance.now(),dt=Math.min(400,now-NET.last);NET.last=now;
  if(!g.started){let all=true;for(const n of g.nations)if(n&&n.human&&!n.spawned)all=false;if((all||now>NET.goAt)&&!NET.q.some(c=>c[1].k==='go'))NET.q.push([g.human,{k:'go'}]);if(NET.q.length)frameOut(0);return;}
  if(UI.paused){if(NET.q.length)frameOut(0);return;}
  // never run more than ~2 s ahead of the slowest player; after 8 s of waiting, carry on without them
  let slow=null,lag=0;for(const p of NET.players){const c=p.conn;if(!p.in||!c||!c.ok||!c.pid)continue;const l=g.tick-(c.ack||0);if(l>lag){lag=l;slow=p;}}
  if(slow&&lag>20){if(!NET.waitAt)NET.waitAt=now;if(now-NET.waitAt<8000){NET.acc=0;if(NET.q.length)frameOut(0);if(!NET.waitShown){NET.waitShown=1;hint(t('mpSlow',slow.name),true);}return;}}
  else{NET.waitAt=0;if(NET.waitShown){NET.waitShown=0;hint(null);}}
  NET.acc+=dt*UI.speed;let k=0;while(NET.acc>=100&&k<6){frameOut(1);NET.acc-=100;k++;}if(k===6)NET.acc=0;
}
// host only: after a match, bring everyone back to the room and reopen the battle settings
function netRematch(){
  if(!NET.on||!NET.host)return;NET.started=false;NET.q=[];NET.players=NET.players.filter(p=>p.in);NET.conns=NET.conns.filter(k=>k.ok);
  G.over=G.over||{w:0,why:'dead'};UI.phase='';lobbyOut();regSend();renderSetup();show('setup');
}
// ── public room list: one browser holds the room book on a fixed PeerJS id; if it leaves, the next one takes over ──
const REG=window.SIJAL_REG||'sijal-rooms-v1',LOBBY={on:false,peer:null,hold:null,up:null,book:{},list:[],ok:false};
function regStart(){if(BCMODE||LOBBY.on)return;LOBBY.on=true;loadPeer(()=>{try{LOBBY.peer=new Peer();LOBBY.peer.on('open',regLink);LOBBY.peer.on('error',e=>{if(e.type==='peer-unavailable')regClaim();});}catch(e){LOBBY.on=false;}},()=>{LOBBY.on=false;});}
function regLink(){
  if(!LOBBY.peer||LOBBY.hold)return;const k=wrap(LOBBY.peer.connect(REG,{reliable:true,serialization:'json'}));
  // a holder that vanished without closing can leave the id taken for a while: give up after 6 s and try to take over
  const to=setTimeout(()=>{if(!k.ok){try{k.c.close();}catch(e){}regClaim();}},6000);
  k.onOpen=()=>{clearTimeout(to);LOBBY.up=k;LOBBY.ok=true;regSend();k.send({t:'list'});};k.onData=d=>{if(d&&d.t==='rooms'){LOBBY.list=d.rooms||[];regDraw();}};
  k.onClose=()=>{if(LOBBY.up===k){LOBBY.up=null;LOBBY.ok=false;setTimeout(()=>{if(!LOBBY.hold)regLink();},400+Math.random()*1600);}};
}
function regClaim(){
  if(LOBBY.hold)return;let h;try{h=new Peer(REG);}catch(e){return;}
  h.on('open',()=>{LOBBY.hold=h;LOBBY.ok=true;regSend();regDraw();});
  h.on('connection',c=>{const k=wrap(c);k.onData=d=>{if(!d)return;if(d.t==='reg'&&d.room&&typeof d.room.code==='string')LOBBY.book[d.room.code.slice(0,8)]=Object.assign({},d.room,{at:Date.now()});else if(d.t==='unreg')delete LOBBY.book[d.code];else if(d.t==='list')k.send({t:'rooms',rooms:regRooms()});};});
  h.on('error',e=>{if(e.type==='unavailable-id'){try{h.destroy();}catch(_){}setTimeout(regLink,800+Math.random()*1500);}});
}
function regRooms(){const now=Date.now(),out=[];for(const c in LOBBY.book){const r=LOBBY.book[c];if(now-r.at>25000)delete LOBBY.book[c];else out.push(r);}return out.slice(0,40);}
function myRoom(){return NET.on&&NET.host&&!NET.started&&NET.pub?{code:NET.code,name:roomName(),n:NET.players.length,type:UI.prof.type,size:UI.prof.size<0?1:UI.prof.size,diff:UI.prof.diff|0}:null;}
function regSend(){const r=myRoom();if(LOBBY.hold){if(r)LOBBY.book[r.code]=Object.assign({},r,{at:Date.now()});}else if(LOBBY.up&&r)LOBBY.up.send({t:'reg',room:r});}
function regUnreg(){if(!NET.code)return;if(LOBBY.hold)delete LOBBY.book[NET.code];else if(LOBBY.up)LOBBY.up.send({t:'unreg',code:NET.code});}
function regTick(){if(NET.on&&!NET.host&&NET.up&&!NET.started)NET.up.send({t:'ping',ts:performance.now()});if(!LOBBY.on)return;pingRooms();regSend();if(LOBBY.hold){LOBBY.list=regRooms();regDraw();}else if(LOBBY.up)LOBBY.up.send({t:'list'});}
// connection speed to each listed room: a short PeerJS link per room, one ping, then close
const PING={};
function pingTag(ms,id){const c=ms==null?'':ms<80?'good':ms<200?'warn':'bad';return `<span class="ping ${c}"${id?` id="${id}"`:''} title="ping">${ms==null?'…':ms+'ms'}</span>`;}
function pingRooms(){
  if(!LOBBY.peer||NET.on||UI.screen!=='net')return;
  for(const r of LOBBY.list.slice(0,12)){const p=PING[r.code]||(PING[r.code]={ms:null,at:0});if(performance.now()-p.at<9000)continue;p.at=performance.now();
    try{const k=wrap(LOBBY.peer.connect('sijal-'+r.code,{reliable:true,serialization:'json'}));let done=false;
      k.onOpen=()=>k.send({t:'ping',ts:performance.now()});k.onData=d=>{if(d&&d.t==='pong'&&!done){done=true;p.ms=Math.round(performance.now()-d.ts);regDraw();try{k.c.close();}catch(e){}}};
      setTimeout(()=>{if(!done){try{k.c&&k.c.close();}catch(e){}}},6000);}catch(e){}}
}
function regDraw(){
  const e=$('#rooms');if(!e||NET.on)return;const L=LOBBY.list.filter(r=>r.code!==NET.code);
  e.innerHTML=!LOBBY.ok?`<p class="keys">${t('roomsWait')}</p>`:!L.length?`<p class="keys">${t('roomsNone')}</p>`:L.map(r=>`<div class="room"><div><b>${esc(r.name)}</b><small>${esc(t('types')[r.type]||'')} · ${esc(t('sizes')[r.size]||'')} · ${esc(t('diffs')[r.diff]||'')}</small></div><span>${r.n|0}/16</span><button class="btn sm ok" data-a="joinR:${esc(r.code)}">${t('join')}</button>${pingTag(PING[r.code]?PING[r.code].ms:null)}</div>`).join('');
}
function renderNet(){
  $('#net').innerHTML=`<h2>${t('online')}</h2><p class="keys">${t('netNote')}</p>
  <div class="opts" style="grid-template-columns:minmax(0,1fr);width:min(420px,100%)"><label class="fld"><h3>${t('code')}</h3><input id="inCode" maxlength="5" value="${esc(UI.joinCode||'')}" placeholder="ABCDE" autocomplete="off" style="text-transform:uppercase;letter-spacing:.3em;text-align:center" dir="ltr"></label></div>
  <div class="row"><button class="btn" data-a="menu">${t('back')}</button><button class="btn" data-a="hostSetup">${t('hostRoom')}</button><button class="btn big" data-a="join">${t('join')}</button></div>
  <h3>${t('rooms')}</h3><div id="rooms" class="rooms"></div>`;
  regStart();regDraw();
}
function renderLobby(){
  const web=/^https?:/.test(location.protocol),link=web?location.href.split('#')[0]+'#'+NET.code:'';
  $('#net').innerHTML=`<h2>${esc(NET.host?roomName():NET.room||t('lobby'))}</h2>${NET.host?'':`<p class="keys">${t('pingHost')}: ${pingTag(NET.ping,'myPing')}</p>`}<div class="code" dir="ltr">${NET.code}</div>${link?`<p class="keys" style="user-select:text;-webkit-user-select:text" dir="ltr">${esc(link)}</p>`:''}
  <p class="keys">${t(NET.host?'lobbyHost':'lobbyWait')}</p>${NET.host?`<p class="keys"><b>${t(NET.pub?'roomPub':'roomPriv')}</b></p>`:''}<h3>${t('players',NET.players.length)}</h3>
  <div class="pls">${NET.players.map((p,i)=>`<div class="pl"><i style="background:rgb(${PAL[i%PAL.length]})"></i><b>${esc(p.name)}</b><small>${i===0?t('hostTag'):''}</small></div>`).join('')}</div>
  <div class="row"><button class="btn" data-a="leave">${t('leave')}</button>${NET.host?`<button class="btn big" data-a="netStart">${t('startNet')}</button>`:''}</div>`;
}
setInterval(regTick,4000);
// ── newer version on the site? tell open games so players refresh ──
function checkUpdate(){
  if(UI.updShown||!/^https?:/.test(location.protocol)||document.hidden)return;
  fetch('version.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(!j||!j.build||j.build===BUILD_ID||UI.updShown)return;UI.updShown=true;
    const d=document.createElement('div');d.id='upd';d.className='pn';d.innerHTML=`<span>${t(NET.on&&NET.started?'updMp':'updNew')}</span><button class="btn sm ok" data-a="reload">${t('updGo')}</button><button class="btn sm" data-a="updX">${t('updLater')}</button>`;$('#app').appendChild(d);sfx('coin');}).catch(()=>{});
}
setInterval(checkUpdate,120000);setTimeout(checkUpdate,15000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkUpdate();});
