// Soundtrack for one TikTok clip, timed to compose.js marks. Each story has its own music:
//   empire: epic Hijaz strings and taiko that grow with the realm
//   revenge: siren and tension, dead silence before the bomb, then a cocky beat
//   naval: waves and a ship horn, then a fast drum march
//   node marketing/clips/music.js <marks.json> <out.wav>
const {chromium}=require('playwright'),fs=require('fs');
const marks=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),OUT=process.argv[3];
(async()=>{
  const b=await chromium.launch(),pg=await b.newPage();
  const b64=await pg.evaluate(async M=>{
    const SR=44100,LEN=M.len,ac=new OfflineAudioContext(2,Math.ceil(SR*LEN),SR);
    const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;comp.attack.value=.004;comp.release.value=.2;comp.connect(ac.destination);
    const bus=ac.createGain();bus.gain.value=.9;bus.connect(comp);
    const verb=ac.createConvolver();{const n=SR*2.2,ir=ac.createBuffer(2,n,SR);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);}verb.buffer=ir;}
    const wet=ac.createGain();wet.gain.value=.22;verb.connect(wet);wet.connect(bus);
    // music level, ducked to nothing just before the bomb in the revenge clip
    const mus=ac.createGain();mus.connect(bus);mus.connect(verb);
    const fx=ac.createGain();fx.gain.value=1;fx.connect(bus);fx.connect(verb);
    const ok=t=>t>=0&&t<LEN;
    const env=(g,t,a,v,d)=>{g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+d);};
    const osc=(t,f,d,type,v,o={})=>{if(!ok(t))return;const s=ac.createOscillator(),g=ac.createGain();s.type=type;s.frequency.setValueAtTime(f,t);if(o.to)s.frequency.exponentialRampToValueAtTime(o.to,t+(o.tt||d));if(o.det)s.detune.value=o.det;
      let n=s;if(o.lp){const l=ac.createBiquadFilter();l.type='lowpass';l.frequency.setValueAtTime(o.lp,t);if(o.lpTo)l.frequency.exponentialRampToValueAtTime(o.lpTo,t+d);s.connect(l);n=l;}
      env(g,t,o.a||.008,v,d);n.connect(g);g.connect(o.dst||mus);s.start(t);s.stop(t+d+.05);};
    const noiseBuf=(()=>{const n=SR*3,bf=ac.createBuffer(1,n,SR),d=bf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;return bf;})();
    const nz=(t,d,v,type,f,o={})=>{if(!ok(t))return;const s=ac.createBufferSource(),fl=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noiseBuf;fl.type=type;fl.frequency.setValueAtTime(f,t);if(o.to)fl.frequency.exponentialRampToValueAtTime(o.to,t+d);if(o.q)fl.Q.value=o.q;
      env(g,t,o.a||.004,v,d);s.connect(fl);fl.connect(g);g.connect(o.dst||mus);s.start(t,Math.random()*1.5);s.stop(t+d+.05);};
    // instruments
    const kick=(t,v=1)=>{osc(t,150,.4,'sine',.9*v,{to:42,tt:.25});nz(t,.03,.3*v,'highpass',2000);};
    const taiko=(t,v=1)=>{osc(t,95,.7,'sine',.85*v,{to:48,tt:.5});nz(t,.35,.35*v,'lowpass',500,{to:80});};
    const doum=(t,v=1)=>osc(t,105,.28,'sine',.6*v,{to:68,tt:.2});
    const tak=(t,v=1)=>{nz(t,.07,.32*v,'bandpass',2600,{q:1.2});osc(t,420,.05,'triangle',.12*v);};
    const snare=(t,v=1)=>{nz(t,.16,.38*v,'bandpass',1800,{q:.7});osc(t,200,.08,'triangle',.18*v,{to:150});};
    const hat=(t,v=1)=>nz(t,.035,.12*v,'highpass',8000);
    const clap=(t,v=1)=>{for(const k of[0,.012,.025])nz(t+k,.09,.25*v,'bandpass',1400,{q:.9});};
    const sub=(t,f,d,v=.5)=>osc(t,f,d,'sine',v,{a:.01});
    const pad=(t,fs,d,v=.06)=>{for(const f of fs)for(const det of[-9,0,9])osc(t,f,d,'sawtooth',v/3,{a:Math.min(.6,d/3),lp:1400,det});};
    const pluck=(t,f,v=.18)=>{osc(t,f,.55,'triangle',v,{lp:2600,lpTo:500});osc(t,f*2,.25,'sawtooth',v*.25,{lp:1800,lpTo:400});};
    const brass=(t,fs,d,v=.12)=>{for(const f of fs)for(const det of[-6,6])osc(t,f,d,'sawtooth',v/2,{a:.03,lp:900,lpTo:2600,det});};
    const riser=(t,d,v=.25)=>{nz(t,d,v,'bandpass',300,{to:7000,q:2,a:d*.9,dst:fx});osc(t,110,d,'sawtooth',v*.25,{to:880,a:d*.9,lp:2000,dst:fx});};
    const impact=(t,v=1)=>{osc(t,70,1.4,'sine',1*v,{to:28,tt:1.2,dst:fx});nz(t,1.2,.6*v,'lowpass',3000,{to:60,dst:fx});nz(t,.5,.3*v,'highpass',3000,{dst:fx});};
    const boom=(t)=>{osc(t,58,4.2,'sine',1.2,{to:22,tt:3.8,dst:fx});nz(t,3.8,.9,'lowpass',2500,{to:40,dst:fx});nz(t,.4,.5,'highpass',2500,{dst:fx});osc(t,40,3,'sine',.6,{a:.2,dst:fx});};
    const chime=(t)=>{for(const[f,k]of[[1174.7,0],[1568,.07],[2349.3,.14]])osc(t+k,f,.7,'sine',.11,{dst:fx});};
    const whoosh=(t,d=.6)=>{nz(t,d,.35,'bandpass',6000,{to:300,q:1.5,a:.05,dst:fx});osc(t,900,d,'sawtooth',.06,{to:80,lp:1500,dst:fx});};
    const tape=(t,d)=>{osc(t,520,d,'sawtooth',.1,{to:2400,lp:2600,dst:fx});nz(t,d,.25,'bandpass',1500,{to:6000,q:3,dst:fx});};
    const siren=(t,d)=>{for(let k=0;k<d;k+=.8){osc(t+k,540,.4,'sawtooth',.07,{to:820,lp:2500,dst:fx});osc(t+k+.4,820,.4,'sawtooth',.07,{to:540,lp:2500,dst:fx});}};
    const heart=(t,v=1)=>{osc(t,62,.18,'sine',.7*v,{to:40});osc(t+.2,58,.2,'sine',.5*v,{to:38});};
    const horn=(t)=>{for(const f of[98,146.8])osc(t,f,1.6,'sawtooth',.12,{a:.08,lp:700,dst:fx});};
    const waves=(t,d,v=.12)=>{for(let k=0;k<d;k+=2.4)nz(t+k,2.6,v,'lowpass',900,{to:300,a:1.1});};
    const H=[146.83,155.56,185,196,220,233.08,261.63,293.66,311.13,369.99,392,440];// D Hijaz
    const m=k=>M[k]!=null&&isFinite(M[k])?M[k]:null,end=M.outro;
    const outroHits=()=>{impact(end,.9);brass(end+.05,[146.83,220,293.66],1.6,.16);pad(end,[73.42,146.83,220],2.6,.08);taiko(end+.9,.7);taiko(end+1.5,.9);chime(end+.3);};

    if(M.story==='empire'){
      const beat=.6,h=M.hook,s0=M.main;
      // hook: drone, two big drums and a Hijaz motif over the finished empire
      pad(0,[73.42,110],h,.07);sub(0,36.7,h,.35);taiko(0);taiko(.6,.8);[7,8,9,8].forEach((d,i)=>pluck(.15+i*.22,H[d]));
      tape(h-.62,.6);
      const sect=(a,z,lvl)=>{for(let t=a;t<z;t+=beat){const i=Math.round((t-a)/beat);doum(t,lvl>0?1:.7);if(lvl>0)tak(t+beat*.5,.8);if(lvl>1){tak(t+beat*.75,.6);hat(t+beat*.25);hat(t+beat*.75);}if(lvl>2&&i%2===0)taiko(t,.7);if(i%4===0)sub(t,i%8?55:73.42,beat*4,.3);}};
      const met=m('met'),camp=m('camp'),atk=m('attack'),con=m('conquer'),kill=m('kill'),endS=m('end');
      // the realm grows quietly, then the drums take over at the border
      pad(s0,[146.83,220],met-s0,.05);sect(s0,met,0);
      const mel=[7,8,9,10,9,8,9,7,8,6,7,8];for(let t=s0+.3,i=0;t<met;t+=beat,i++)pluck(t,H[mel[i%mel.length]],.15);
      riser(met,camp-met);taiko(camp,1);brass(camp,[146.83,220],.9,.14);
      sect(camp,atk,1);sect(atk,kill,2);for(let t=atk;t<kill;t+=beat*2)brass(t,[[146.83,185],[155.56,196],[146.83,220],[130.81,196]][Math.round((t-atk)/(beat*2))%4],beat*1.6,.11);
      if(m('cityFall'))chime(m('cityFall'));
      if(kill){impact(kill);nz(kill,1.6,.18,'highpass',6000,{dst:fx});}
      sect(kill+.4,end,3);pad(endS,[146.83,185,220,293.66],end-endS+.5,.07);
      outroHits();
    }else if(M.story==='revenge'){
      const d=m('defend'),l1=m('launch1'),l2=m('launch2'),doom=m('doom'),endS=m('end');
      // hook: siren, alarm drums and a racing heart
      siren(0,2.1);taiko(0,1);taiko(.45,.8);for(let t=0;t<d;t+=.55)heart(t,.8);sub(0,38.9,d,.3);pad(0,[155.56,164.81],d,.05);
      for(let t=.2;t<d;t+=.275)hat(t,.6);
      // defence: a march on the drums
      for(let t=d;t<l2;t+=.3){const i=Math.round((t-d)/.3);if(i%4===0)kill2(t);if(i%4===2)snare(t);hat(t+.15);}
      function kill2(t){kick(t);}
      brass(d,[146.83,220],.8,.14);
      whoosh(l1,.9);if(m('intercept'))impact(m('intercept'),.4);
      // the doomsday bomb: a rising tone, then nothing at all, then the blast
      riser(l2,Math.max(.5,doom-l2-.35),.3);mus.gain.setValueAtTime(1,Math.max(0,doom-.45));mus.gain.linearRampToValueAtTime(.0001,doom-.3);
      osc(l2,1200,.25,'sine',.05,{dst:fx});
      boom(doom);mus.gain.setValueAtTime(.0001,doom+1.6);mus.gain.linearRampToValueAtTime(1,doom+2.2);
      // the cocky ending
      for(let t=endS;t<end;t+=.25){const i=Math.round((t-endS)/.25);if(i%8===0||i%8===3)kick(t);if(i%8===4)clap(t);hat(t,.7);if(i%8===0)sub(t,46.25,1.8,.45);}
      outroHits();
    }else if(M.story==='swarm'){
      // three alarms and a racing heart, a held breath, then a war march that hits harder with each realm that falls
      const hold=m('hold'),sw=m('sweep'),endS=m('end');siren(0,hold||2.2);for(let t=0;t<(hold||2.2);t+=.5)heart(t,.9);taiko(0);taiko(.5,.8);taiko(1,.9);sub(0,36.7,hold||2.2,.35);
      if(hold){impact(hold,.7);brass(hold,[146.83,220],1,.15);for(let t=hold;t<sw;t+=.3){const i=Math.round((t-hold)/.3);if(i%4===0)kick(t);if(i%4===2)snare(t);hat(t+.15,.7);}}
      if(sw){riser(sw-.6,.6,.2);for(let t=sw;t<end;t+=.25){const i=Math.round((t-sw)/.25);if(i%4===0)taiko(t,.8);if(i%4===2)snare(t);hat(t,.6);if(i%8===0)sub(t,i%16?55:73.42,2,.35);if(i%4===0)brass(t,[[146.83,220],[155.56,233.08],[146.83,220],[130.81,196]][(i/4)%4],.9,.1);}}
      for(const k of['k1','k2','k3'])if(m(k)){impact(m(k),.7);chime(m(k)+.05);}
      if(endS)pad(endS,[146.83,185,220,293.66],end-endS+.4,.07);
      outroHits();
    }else if(M.story==='betray'){
      // a warm, trusting tune; then silence, a knife's whisper and the drums of war
      const gf=m('gift'),pr=m('prep'),st=m('stab'),kl=m('kill'),endS=m('end');
      pad(0,[146.83,220,293.66],st,.06);const mel=[9,10,9,7,8,9,7,6];for(let t=.2,i=0;t<(pr||4);t+=.55,i++)pluck(t,H[mel[i%8]],.14);
      if(gf){chime(gf);chime(gf+.25);}
      if(pr){for(let t=pr;t<st;t+=.55)heart(t,.6);sub(pr,36.7,st-pr,.3);}
      if(st){mus.gain.setValueAtTime(1,Math.max(0,st-.5));mus.gain.linearRampToValueAtTime(.0001,st-.05);whoosh(st-.4,.4);impact(st,1);mus.gain.setValueAtTime(1,st+.02);
        for(let t=st;t<end;t+=.25){const i=Math.round((t-st)/.25);if(i%4===0)taiko(t);if(i%4===2)snare(t);hat(t,.7);if(i%8===0)sub(t,46.25,2,.45);if(i%4===0)brass(t,[155.56,233.08],.8,.12);}}
      if(kl){impact(kl,.8);chime(kl+.1);}
      if(endS)pad(endS,[155.56,233.08,311.13],end-endS+.4,.07);
      outroHits();
    }else if(M.story==='speed'){
      // a ticking clock over a driving beat from the first frame to the last
      for(let t=0;t<end;t+=.5)osc(t,1800,.03,'square',.05,{lp:4000,dst:fx});taiko(0);taiko(.4,.8);
      for(let t=1.2;t<end;t+=.25){const i=Math.round((t-1.2)/.25);if(i%4===0)kick(t);if(i%4===2)clap(t,.8);hat(t,.6);if(i%8===0)sub(t,[55,61.74,65.41,73.42][(i/8)%4],2,.35);if(i%2===0)pluck(t,H[[7,9,10,9,8,7,6,7][(i/2)%8]],.1);}
      for(const k of Object.keys(M))if(/^kill\d+$/.test(k))chime(M[k]);
      if(m('done'))impact(m('done'),.8);
      outroHits();
    }else{
      const p=m('port'),bt=m('boats'),ld=m('land'),as=m('assault'),cap=m('capital'),endS=m('end');
      // hook: the sea and a ship horn
      waves(0,(p||2)+.5,.14);horn(.25);pad(0,[73.42,110],p||2,.05);for(const t of[1.1,1.6])osc(t,1900,.12,'sine',.04,{to:2600,dst:fx});
      if(p){for(const k of[0,.25,.5])osc(p+k,1400,.1,'square',.05,{lp:3000,dst:fx});taiko(p);}
      // the landing: a fast drum march with a Hijaz brass line
      const beat=.5;waves(bt,(as||bt+6)-bt,.07);
      for(let t=bt;t<end;t+=beat/2){const i=Math.round((t-bt)/(beat/2));if(i%4===0)kick(t);if(i%4===2)snare(t);if(i%2===1)snare(t,.25);hat(t,.6);if(i%8===0)sub(t,i%16?55:73.42,beat*4,.3);}
      const line=[7,7,8,9,10,9,8,7];for(let t=bt,i=0;t<end-.2;t+=beat,i++)if(i%2===0)brass(t,[H[line[(i/2)%8]]],beat*.9,.1);
      if(ld)impact(ld,.6);if(as){riser(as-.8,.8,.2);taiko(as);}
      if(cap){impact(cap,.9);chime(cap+.1);brass(cap,[146.83,185,220],1.4,.16);}
      if(endS)pad(endS,[146.83,220,293.66],end-endS+.3,.07);
      outroHits();
    }
    const buf=await ac.startRendering(),n=buf.length,L=buf.getChannelData(0),R=buf.getChannelData(1),dv=new DataView(new ArrayBuffer(44+n*4));
    const w=(o,s)=>{for(let i=0;i<s.length;i++)dv.setUint8(o+i,s.charCodeAt(i));};
    w(0,'RIFF');dv.setUint32(4,36+n*4,true);w(8,'WAVE');w(12,'fmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,2,true);dv.setUint32(24,SR,true);dv.setUint32(28,SR*4,true);dv.setUint16(32,4,true);dv.setUint16(34,16,true);w(36,'data');dv.setUint32(40,n*4,true);
    for(let i=0;i<n;i++){const f=i>n-SR*.6?(n-i)/(SR*.6):1;dv.setInt16(44+i*4,Math.max(-1,Math.min(1,L[i]*f))*32767,true);dv.setInt16(46+i*4,Math.max(-1,Math.min(1,R[i]*f))*32767,true);}
    const u8=new Uint8Array(dv.buffer);let s='';for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s);
  },marks);
  fs.writeFileSync(OUT,Buffer.from(b64,'base64'));await b.close();console.log('wrote',OUT);
})();
