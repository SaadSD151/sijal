// The one-minute story clip in Saad's own voice:
//   node marketing/story/make.js <voice file> <clips dir> <clips2 dir> <ui dir> <work dir> <out.mp4>
// Cuts the best take of each line, cleans the voice, lays real game footage under each line, adds captions,
// a quiet music bed that ducks under the voice, and an end card.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const [VOICE,CL1,CL2,UI,W,OUT]=process.argv.slice(2).map(p=>path.resolve(p));const FPS=30,GAP=.28,LEAD=.9,OUTRO=3.2;
fs.mkdirSync(W,{recursive:true});
// best takes (seconds in the recording) and what is said
const LINES=[
  {a:[[32.62,36.4]],t:['أنا حرفياً','ما أعرف أبرمج <y>ولا سطر</y>…'],v:{src:'revenge',f:[196,236]},hook:1},
  {a:[[37.86,40.95]],t:['وبأقل من <y>أسبوعين</y>…','سويت هذي اللعبة'],v:{src:'speed',f:[150,329]}},
  {a:[[82.85,87.8]],t:['ودّي من زمان أسوي لعبة…','بس كنت أقول: <r>البرمجة مو لي</r>'],v:{src:'menu',f:[0,149]}},
  {a:[[88.4,90.3],[95.05,98.92]],t:['كنت أحب الألعاب الحربية…','وقلت: ليش ما أسوي وحدة <y>بأسلوبي</y>؟'],v:{src:'empire',f:[0,116]}},
  {a:[[99.45,104.6]],t:['فجربت <y>الذكاء الاصطناعي</y>…','أنا أقول الفكرة، وهو يكتب الكود'],v:{src:'code'}},
  {a:[[114.8,119.45]],t:['وكل يوم ألعب، ألقى غلط…','أقوله… <y>ويتصلّح</y>'],v:{src:'revenge',f:[128,192]}},
  {a:[[123.15,127]],t:['ومن فكرة بسيطة…','صارت <y>حرب مدن كاملة</y>'],v:{src:'swarm',f:[120,300]}},
  {a:[[141.52,149]],t:['تحالفات، وغدر، وصواريخ وقنابل…','وتلعبها <y>أونلاين</y> مع أخوياك'],v:{multi:[{src:'betray',f:[0,60]},{src:'betray',f:[150,186]},{src:'revenge',f:[198,232]},{src:'online'}]}},
  {a:[[150.85,162.6]],t:['أهم شي إنها <y>سعودية</y> وأفتخر فيها…','وبالعربي، و<y>مجانية</y>','تلعبها في الموقع اللي بيطلع لكم الحين 👇'],v:{src:'empire',f:[200,300]},url:.62},
  {a:[[169.6,177.7]],t:['اللعبة للحين جالس أطورها…','وكل اقتراح منكم <y>بيساعدني كثير</y> 💛'],v:{src:'suggest'}}
];
// ── voice: cut, tidy, join with short pauses ──
const parts=[];let tl=LEAD;
for(const L of LINES){L.st=tl;let d=0;const pieces=[];for(const [a,b] of L.a){pieces.push([a,b]);d+=b-a+(pieces.length>1?.12:0);}L.dur=d;L.en=tl+d;tl=L.en+GAP;parts.push(L);}
const END=tl-GAP+.4,LEN=END+OUTRO;
{const filt=[],ins=[];let n=0;
  filt.push(`anullsrc=r=44100:cl=mono,atrim=0:${LEAD}[s0]`);ins.push('[s0]');
  for(const L of LINES){L.a.forEach(([a,b],k)=>{const i=`v${n}`;filt.push(`[0:a]atrim=${a}:${b},asetpts=PTS-STARTPTS,aformat=sample_rates=44100:channel_layouts=mono,afade=t=in:d=0.03,afade=t=out:st=${(b-a-.05).toFixed(3)}:d=0.05[${i}]`);ins.push(`[${i}]`);n++;
      if(k<L.a.length-1){filt.push(`anullsrc=r=44100:cl=mono,atrim=0:0.12[g${n}]`);ins.push(`[g${n}]`);}});
    filt.push(`anullsrc=r=44100:cl=mono,atrim=0:${GAP}[p${n}]`);ins.push(`[p${n}]`);}
  filt.push(`${ins.join('')}concat=n=${ins.length}:v=0:a=1,highpass=f=80,afftdn=nf=-25,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,loudnorm=I=-15:TP=-1.5:LRA=9,apad=whole_dur=${LEN.toFixed(2)}[out]`);
  execFileSync('ffmpeg',['-y','-loglevel','error','-i',VOICE,'-filter_complex',filt.join(';'),'-map','[out]','-ar','44100','-ac','2',path.join(W,'voice.wav')]);}
console.log('voice',LEN.toFixed(1)+'s');
// ── frame plan: which picture each output frame shows ──
const total=Math.round(LEN*FPS),plan=[];
const pickSrc=(v,u)=>{if(v.multi){const k=Math.min(v.multi.length-1,Math.floor(u*v.multi.length));return pickSrc(v.multi[k],u*v.multi.length-k);}
  if(v.src==='code'||v.src==='online'||v.src==='suggest')return{kind:v.src,u};
  const dir=v.src==='menu'?path.join(UI,'menu'):path.join(['empire','revenge','naval'].includes(v.src)?CL1:CL2,v.src,'f');
  const f=Math.round(v.f[0]+(v.f[1]-v.f[0])*Math.min(1,u));return{kind:'img',src:'file://'+path.join(dir,String(f).padStart(5,'0')+'.jpg'),u};};
for(let i=0;i<total;i++){const t=i/FPS;let L=null;for(const x of LINES)if(t>=x.st-GAP*.5)L=x;
  if(t<LEAD*.55){plan.push({kind:'black'});continue;}if(!L)L=LINES[0];
  if(t>=END){plan.push({kind:'outro',u:(t-END)/OUTRO,bg:pickSrc(LINES[8].v,1)});continue;}
  const span=Math.max(.5,(LINES[LINES.indexOf(L)+1]||{st:END}).st-L.st);plan.push(pickSrc(L.v,Math.max(0,(t-L.st)/span)));}
// the code shown while the line about the AI plays: real lines of the game's source
const CODE=fs.readFileSync(path.join(__dirname,'../../src/game.js'),'utf8').split('\n').filter(l=>l.trim()&&l.length<140).slice(200,290).map(l=>l.replace(/&/g,'&amp;').replace(/</g,'&lt;'));
const LOGO='data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'../sijal-logo.png')).toString('base64');
(async()=>{
  // music bed: a soft Hijaz drone and a slow heartbeat drum, louder in the gaps, ending on a warm chord
  fs.rmSync(path.join(W,'f'),{recursive:true,force:true});fs.mkdirSync(path.join(W,'f'));
  const b=await chromium.launch();
  const mp=await b.newPage();const b64=await mp.evaluate(async([LEN,END])=>{const SR=44100,ac=new OfflineAudioContext(2,Math.ceil(SR*LEN),SR),out=ac.createGain();out.gain.value=.55;out.connect(ac.destination);
    const o=(t,f,d,type,v,lp)=>{const s=ac.createOscillator(),g=ac.createGain(),l=ac.createBiquadFilter();l.type='lowpass';l.frequency.value=lp||1200;s.type=type;s.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+Math.min(1.2,d/3));g.gain.linearRampToValueAtTime(.0001,t+d);s.connect(l);l.connect(g);g.connect(out);s.start(t);s.stop(t+d+.1);};
    const drum=(t,v)=>{const s=ac.createOscillator(),g=ac.createGain();s.frequency.setValueAtTime(95,t);s.frequency.exponentialRampToValueAtTime(45,t+.4);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.6);s.connect(g);g.connect(out);s.start(t);s.stop(t+.7);};
    const ch=[[73.42,110,146.83],[69.3,103.83,138.59],[73.42,110,146.83],[65.41,98,130.81]];for(let t=0,k=0;t<END;t+=6.4,k++)for(const f of ch[k%4])for(const det of[-.4,.4])o(t,f+det,7,'sawtooth',.035,700);
    for(let t=.9;t<END;t+=1.6)drum(t,.28);const H=[293.66,311.13,369.99,392,440,466.16,523.25];for(let t=1.2,i=0;t<END;t+=1.6,i++)if(i%2===0)o(t,H[[4,5,4,3,2,3,1,0][(i/2)%8]],1.4,'triangle',.05,2400);
    for(const f of[146.83,185,220,293.66])o(END,f,LEN-END,'sawtooth',.05,1600);drum(END,.6);
    const buf=await ac.startRendering(),n=buf.length,Lc=buf.getChannelData(0),Rc=buf.getChannelData(1),dv=new DataView(new ArrayBuffer(44+n*4)),w=(p,s)=>{for(let i=0;i<s.length;i++)dv.setUint8(p+i,s.charCodeAt(i));};
    w(0,'RIFF');dv.setUint32(4,36+n*4,true);w(8,'WAVE');w(12,'fmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,2,true);dv.setUint32(24,SR,true);dv.setUint32(28,SR*4,true);dv.setUint16(32,4,true);dv.setUint16(34,16,true);w(36,'data');dv.setUint32(40,n*4,true);
    for(let i=0;i<n;i++){const f=i>n-SR?(n-i)/SR:1;dv.setInt16(44+i*4,Math.max(-1,Math.min(1,Lc[i]*f))*32767,true);dv.setInt16(46+i*4,Math.max(-1,Math.min(1,Rc[i]*f))*32767,true);}
    const u8=new Uint8Array(dv.buffer);let s='';for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s);},[LEN,END]);
  fs.writeFileSync(path.join(W,'music.wav'),Buffer.from(b64,'base64'));
  // the editing page
  const pg=await (await b.newContext({viewport:{width:360,height:640},deviceScaleFactor:3})).newPage();
  const page=path.join(W,'page.html');fs.writeFileSync(page,`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@500;700&display=swap" rel="stylesheet"><style>
    html,body{margin:0;width:360px;height:640px;overflow:hidden;background:#000;font-family:'IBM Plex Sans Arabic',sans-serif}
    #bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform-origin:50% 45%}
    #shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.45),rgba(0,0,0,0) 30%,rgba(0,0,0,0) 55%,rgba(0,0,0,.6))}
    #code{position:absolute;inset:0;background:#0b1220;overflow:hidden;opacity:0;direction:ltr;text-align:left}
    #code pre{margin:0;padding:90px 14px 0;font:9.5px/1.55 ui-monospace,Menlo,monospace;color:#8fb3d9;white-space:pre-wrap;word-break:break-all}
    #code .k{color:#f1cf6e}#code .cur{display:inline-block;width:6px;height:11px;background:#f1cf6e;vertical-align:middle}
    #code .tag{position:absolute;top:78px;left:50%;transform:translateX(-50%);padding:6px 14px;border-radius:999px;background:rgba(241,207,110,.16);border:1px solid rgba(241,207,110,.5);color:#ffe7a6;font:700 13px 'IBM Plex Sans Arabic';direction:rtl;white-space:nowrap}
    .cap{position:absolute;left:5%;right:5%;bottom:22%;text-align:center;color:#fff;font-weight:700;font-size:25px;line-height:1.4;opacity:0;-webkit-text-stroke:4.5px #000;paint-order:stroke fill;text-shadow:0 4px 14px rgba(0,0,0,.6)}
    .cap y{color:#ffd23f}.cap r{color:#ff5a4d}
    #hook .cap{bottom:40%;font-size:31px}
    #url{position:absolute;left:50%;bottom:9%;transform:translateX(-50%);direction:ltr;padding:10px 20px;border-radius:999px;background:linear-gradient(180deg,#f1cf6e,#c9952d);color:#1a1205;font-weight:700;font-size:21px;box-shadow:0 8px 24px rgba(0,0,0,.5);opacity:0;white-space:nowrap}
    #out{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(4,10,20,.78);backdrop-filter:blur(6px);opacity:0}
    #out img{width:72%}#out .q{color:#fff;font-weight:700;font-size:24px;-webkit-text-stroke:3px #000;paint-order:stroke fill}#out .l{direction:ltr;padding:10px 20px;border-radius:999px;background:linear-gradient(180deg,#f1cf6e,#c9952d);color:#1a1205;font-weight:700;font-size:21px}#out .s{color:#d7e6f5;font-size:15px}
    #brand{position:absolute;left:10px;top:12px;width:64px;opacity:.85}
  </style></head><body><img id="bg"><div id="code"><div class="tag">🤖 الذكاء الاصطناعي يكتب…</div><pre id="cd"></pre></div><div id="shade"></div><div id="caps"></div><div id="url">sijalwar.com</div><img id="brand" src="${LOGO}">
    <div id="out"><img src="${LOGO}"><div class="q">جرّبوها… وقولوا لي رايكم 💛</div><div class="l">sijalwar.com</div><div class="s">مجانية · من المتصفح · بدون تحميل</div></div></body></html>`);
  await pg.goto('file://'+page);await pg.waitForTimeout(1500);await pg.evaluate(()=>document.fonts.ready);
  const STILL={online:'file://'+path.join(UI,'online.jpg'),suggest:'file://'+path.join(UI,'suggest.jpg')};
  for(let i=0;i<total;i++){const t=i/FPS,P=plan[i];
    await pg.evaluate(async([t,P,LINES,STILL,CODE,LEN,END])=>{
      const bg=document.getElementById('bg'),code=document.getElementById('code'),out=document.getElementById('out'),url=document.getElementById('url');
      const B=P.kind==='outro'?P.bg:P;let src=B.kind==='img'?B.src:STILL[B.kind]||'';
      if(B.kind==='black'){bg.style.opacity=0;}else{bg.style.opacity=1;if(src&&bg.dataset.s!==src){bg.src=src;bg.dataset.s=src;await bg.decode().catch(()=>{});}}
      // slow push-in on stills, a hard punch on the hook
      const z=(B.kind==='online'||B.kind==='suggest')?1+.06*B.u:1;let hk=1;if(t>=.5&&t<1.1)hk=1.12-.12*Math.min(1,(t-.5)/.6);bg.style.transform=`scale(${z*hk})`;
      code.style.opacity=B.kind==='code'?1:0;if(B.kind==='code'){const n=Math.floor(8+B.u*70);document.getElementById('cd').innerHTML=CODE.slice(Math.max(0,n-34),n).map((l,k,a)=>k===a.length-1?l.slice(0,Math.floor(l.length*((B.u*70)%1)))+'<span class="cur"></span>':l.replace(/\b(function|const|let|return|if|for|else)\b/g,'<span class="k">$1</span>')).join('\n');}
      // captions: each line splits into its phrases across its time
      let html='';for(const L of LINES){if(t<L.st-.05||t>L.en+.25)continue;const k=Math.max(0,Math.min(L.t.length-1,Math.floor((t-L.st)/(L.dur/L.t.length)))),a=Math.max(0,t-(L.st+k*L.dur/L.t.length)),pop=a<.1?.85+1.5*a:1;
        html=`<div ${L.hook?'id="hook"':''}><div class="cap" style="opacity:1;transform:scale(${pop})">${L.t[k]}</div></div>`;}
      document.getElementById('caps').innerHTML=html;
      const U=LINES.find(L=>L.url);url.style.opacity=U&&t>=U.st+U.dur*U.url&&t<END?1:0;
      const ou=Math.max(0,Math.min(1,(t-END)/.4));out.style.opacity=ou;document.getElementById('brand').style.opacity=t<END&&P.kind!=='black'?.85:0;
    },[t,P,LINES,STILL,CODE,LEN,END]);
    await pg.screenshot({path:path.join(W,'f',String(i).padStart(5,'0')+'.jpg'),type:'jpeg',quality:92});if(i%150===0)process.stdout.write((t|0)+'s ');}
  await b.close();
  // mix: music ducks under the voice
  execFileSync('ffmpeg',['-y','-loglevel','error','-framerate',String(FPS),'-i',path.join(W,'f','%05d.jpg'),'-i',path.join(W,'voice.wav'),'-i',path.join(W,'music.wav'),
    '-filter_complex','[2:a][1:a]sidechaincompress=threshold=0.03:ratio=8:attack=15:release=350[duck];[1:a][duck]amix=inputs=2:duration=first:weights=1 0.7:normalize=0,loudnorm=I=-14:TP=-1:LRA=9[a]',
    '-map','0:v','-map','[a]','-vf','format=yuv420p','-c:v','libx264','-preset','slow','-crf','18','-c:a','aac','-b:a','192k','-movflags','+faststart','-shortest',OUT]);
  console.log('\nmade',OUT,LEN.toFixed(1)+'s');
})();
