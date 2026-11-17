// Renders the promo soundtrack with the game's own synth, timed to the recorded marks:
// node marketing/music.js <marks.json> <out.wav>
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const marks=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),OUT=process.argv[3];
(async()=>{
  const b=await chromium.launch(),pg=await b.newPage();
  await pg.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await pg.waitForTimeout(1500);
  const b64=await pg.evaluate(async marks=>{
    const S=__sijal.snd,AU=S.AU,LEN=40,SR=44100,off=new OfflineAudioContext(2,SR*LEN,SR);
    let T=0;const ctx=new Proxy(off,{get(o,k){if(k==='currentTime')return T;const v=o[k];return typeof v==='function'?v.bind(o):v;}});
    const comp=off.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;comp.connect(off.destination);
    const mus=off.createGain();mus.gain.value=1.25;mus.connect(comp);const fx=off.createGain();fx.gain.value=1.1;fx.connect(comp);
    AU.ctx=ctx;AU.out=comp;AU.step=0;
    const at=(t,fn,dst)=>{T=t;AU.dst=dst||fx;fn();};
    // intro: three heavy hits and a rising call
    for(const t of[0,.45,.9]){at(t,()=>{S.tone(55,.9,'sine',.5,.4);S.noise(.5,.35,900,60);});}
    at(1.2,()=>S.SFX.era());at(2.6,()=>{S.tone(65,1.2,'sine',.45,.5);S.noise(.9,.3,1200,70);});
    // beds: attack theme, heavy theme through the bombs, attack again, outro
    const bed=(a,z,fn,vol)=>{mus.gain.setValueAtTime(vol,a);for(let t=a;t<z;t+=.215)at(t,fn,mus);};
    bed(3,14,S.atkBeat,1.25);bed(14,22,S.defBeat,1.35);bed(22,32,S.atkBeat,1.15);
    at(32,()=>{S.tone(55,1.4,'sine',.55,.4);S.noise(1,.4,1000,60);});at(32.4,()=>S.SFX.win());
    for(let t=33.6;t<38.8;t+=.43)at(t,()=>{S.tone(73,.3,'sine',.22,.5);},mus);
    at(39,()=>{S.tone(55,1,'sine',.55,.4);S.noise(.8,.35,900,60);});
    // effects at the moments captured in the video
    const m=k=>marks[k]!=null?marks[k]:null;
    if(m('spawn')!=null)at(m('spawn'),()=>S.SFX.city());
    if(m('cityFall')!=null)at(m('cityFall'),()=>{S.SFX.city();S.SFX.win1();});
    if(m('launch1')!=null)at(m('launch1'),()=>S.SFX.launch());
    if(m('launch2')!=null)at(m('launch2'),()=>S.SFX.launch());
    if(m('boom')!=null)at(m('boom'),()=>S.SFX.boom());
    if(m('doom')!=null)at(m('doom'),()=>S.SFX.nuke());
    if(m('ally')!=null)at(m('ally'),()=>S.SFX.city());
    if(m('aid')!=null)at(m('aid'),()=>S.SFX.coin());
    if(m('online')!=null)at(m('online'),()=>S.SFX.alert());
    // fade the last second
    const fin=off.createGain();
    const buf=await off.startRendering();
    const n=buf.length,L=buf.getChannelData(0),R=buf.getChannelData(1),pcm=new DataView(new ArrayBuffer(44+n*4));
    const w=(o,s)=>{for(let i=0;i<s.length;i++)pcm.setUint8(o+i,s.charCodeAt(i));};
    w(0,'RIFF');pcm.setUint32(4,36+n*4,true);w(8,'WAVE');w(12,'fmt ');pcm.setUint32(16,16,true);pcm.setUint16(20,1,true);pcm.setUint16(22,2,true);pcm.setUint32(24,SR,true);pcm.setUint32(28,SR*4,true);pcm.setUint16(32,4,true);pcm.setUint16(34,16,true);w(36,'data');pcm.setUint32(40,n*4,true);
    for(let i=0;i<n;i++){const f=i>n-SR?(n-i)/SR:1;pcm.setInt16(44+i*4,Math.max(-1,Math.min(1,L[i]*f))*32767,true);pcm.setInt16(46+i*4,Math.max(-1,Math.min(1,R[i]*f))*32767,true);}
    const u8=new Uint8Array(pcm.buffer);let s='';for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s);
  },marks);
  fs.writeFileSync(OUT,Buffer.from(b64,'base64'));await b.close();console.log('wrote',OUT);
})();
