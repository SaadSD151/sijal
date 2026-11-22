// Soundtrack for the ad and the explainer, built with the game's own synth and timed to the recorded marks:
//   node marketing/music2.js <marks.json> <out.wav>
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const marks=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),OUT=process.argv[3];
(async()=>{
  const b=await chromium.launch(),pg=await b.newPage();
  await pg.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await pg.waitForTimeout(1500);
  const b64=await pg.evaluate(async marks=>{
    const S=__sijal.snd,AU=S.AU,AD=marks.kind==='ad',LEN=marks.len,SR=44100,off=new OfflineAudioContext(2,SR*LEN,SR);
    let T=0;const ctx=new Proxy(off,{get(o,k){if(k==='currentTime')return T;const v=o[k];return typeof v==='function'?v.bind(o):v;}});
    const comp=off.createDynamicsCompressor();comp.threshold.value=-12;comp.ratio.value=5;comp.connect(off.destination);
    const mus=off.createGain();mus.gain.value=1.3;mus.connect(comp);const fx=off.createGain();fx.gain.value=1.15;fx.connect(comp);
    AU.ctx=ctx;AU.out=comp;AU.step=0;
    const at=(t,fn,dst)=>{if(t<0||t>=LEN)return;T=t;AU.dst=dst||fx;fn();};
    const hit=t=>at(t,()=>{S.tone(52,.9,'sine',.55,.4);S.noise(.5,.4,900,60);});
    const outro=marks.outro!=null?marks.outro:LEN-3;
    // intro: heavy hits and a rising call
    if(AD){hit(0);hit(.35);hit(.7);at(1.0,()=>S.SFX.era());}else{hit(0);hit(.5);hit(1);at(1.4,()=>S.SFX.era());}
    const bed=(a,z,fn,vol,step)=>{mus.gain.setValueAtTime(vol,a);for(let t=a;t<z;t+=step||.215)at(t,fn,mus);};
    const m=k=>marks[k]!=null?marks[k]:null,bomb=m('launch1')!=null?m('launch1'):outro-5;
    if(AD){bed(1.4,bomb,S.atkBeat,1.3,.19);bed(bomb,outro,S.defBeat,1.4,.19);}
    else{bed(2.4,bomb,S.atkBeat,1.2);bed(bomb,(m('ally')||bomb+4),S.defBeat,1.3);bed(m('ally')||bomb+4,outro,S.atkBeat,1.1);}
    // outro: big hit, victory, low pulse
    hit(outro);at(outro+.3,()=>S.SFX.win());for(let t=outro+1.3;t<LEN-.8;t+=.43)at(t,()=>S.tone(73,.3,'sine',.22,.5),mus);
    // effects on the captured moments
    if(m('spawn')!=null)at(m('spawn'),()=>S.SFX.city());
    if(m('build')!=null){at(m('build'),()=>S.SFX.build());at(m('build')+.4,()=>S.SFX.build());}
    if(m('attack')!=null)at(m('attack'),()=>S.SFX.attack());
    if(m('cityFall')!=null)at(m('cityFall'),()=>{S.SFX.city();S.SFX.win1();});
    if(m('launch1')!=null)at(m('launch1'),()=>S.SFX.launch());
    if(m('intercept')!=null)at(m('intercept'),()=>S.SFX.boom());
    if(m('launch2')!=null)at(m('launch2'),()=>S.SFX.launch());
    if(m('boom')!=null)at(m('boom'),()=>S.SFX.boom());
    if(m('doom')!=null)at(m('doom'),()=>S.SFX.nuke());
    if(m('kill')!=null)at(m('kill'),()=>{S.SFX.city();S.SFX.win1();});
    if(m('ally')!=null)at(m('ally'),()=>S.SFX.coin());
    if(m('online')!=null)at(m('online'),()=>S.SFX.alert());
    const buf=await off.startRendering();
    const n=buf.length,L=buf.getChannelData(0),R=buf.getChannelData(1),pcm=new DataView(new ArrayBuffer(44+n*4));
    const w=(o,s)=>{for(let i=0;i<s.length;i++)pcm.setUint8(o+i,s.charCodeAt(i));};
    w(0,'RIFF');pcm.setUint32(4,36+n*4,true);w(8,'WAVE');w(12,'fmt ');pcm.setUint32(16,16,true);pcm.setUint16(20,1,true);pcm.setUint16(22,2,true);pcm.setUint32(24,SR,true);pcm.setUint32(28,SR*4,true);pcm.setUint16(32,4,true);pcm.setUint16(34,16,true);
    w(36,'data');pcm.setUint32(40,n*4,true);
    for(let i=0;i<n;i++){const f=i>n-SR*.8?(n-i)/(SR*.8):1;pcm.setInt16(44+i*4,Math.max(-1,Math.min(1,L[i]*f))*32767,true);pcm.setInt16(46+i*4,Math.max(-1,Math.min(1,R[i]*f))*32767,true);}
    const u8=new Uint8Array(pcm.buffer);let s='';for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s);
  },marks);
  fs.writeFileSync(OUT,Buffer.from(b64,'base64'));await b.close();console.log('wrote',OUT);
})();
