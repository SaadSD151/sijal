// renders the logo (transparent PNG) and reference screenshots for the promo video
const {chromium,devices}=require('playwright'),path=require('path'),out=path.resolve(process.argv[2]||require('os').tmpdir());
(async()=>{const b=await chromium.launch();
  const lp=await b.newPage({viewport:{width:1600,height:900},deviceScaleFactor:2});
  await lp.setContent(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@700&family=IBM+Plex+Sans+Arabic:wght@600&display=swap">
  <style>body{margin:0;background:transparent}#l{display:inline-flex;flex-direction:column;align-items:center;padding:30px 60px 40px}
  .l1{font:700 300px/1.2 'Aref Ruqaa',serif;padding:0 .2em .16em;background:linear-gradient(180deg,#fff6d0,#e3b95a 52%,#9a6a1c);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 8px 0 rgba(0,0,0,.45))}
  .l2{font:700 80px/1.3 'Aref Ruqaa',serif;color:#f1e6cc;margin-top:-30px;text-shadow:0 4px 0 rgba(0,0,0,.5)}</style>
  <div id="l" dir="rtl"><div class="l1">سِجال</div><div class="l2">حرب المدن</div></div>`);
  await lp.waitForTimeout(2500);console.log('font ok:',await lp.evaluate(()=>document.fonts.check("700 300px 'Aref Ruqaa'")));
  await (await lp.$('#l')).screenshot({path:out+'/sijal-logo.png',omitBackground:true});
  await lp.evaluate(()=>{document.querySelector('.l2').remove();});await (await lp.$('#l')).screenshot({path:out+'/sijal-logo-word.png',omitBackground:true});
  const shots=async(name,ctxOpts)=>{const ctx=await b.newContext(ctxOpts),p=await ctx.newPage();await p.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await p.waitForTimeout(2500);
    await p.evaluate(()=>__sijal.act('setBack'));await p.waitForTimeout(1500);await p.screenshot({path:`${out}/ref-${name}-1-menu.png`});
    await p.evaluate(()=>{__sijal.UI.prof.size=1;__sijal.UI.prof.diff=1;__sijal.act('quick');__sijal.act('goQ');});await p.waitForTimeout(3000);
    await p.evaluate(()=>{const S=__sijal,g=S.G;let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%g.W,y=(i/g.W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]>3&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>250))sp=i;}S.tap(sp,0,0);
      const me=g.nations[g.human];for(let r=0;r<25;r++){me.troops=Math.max(me.troops,2e5);let t=-1,bd=1e9;for(let i=0;i<g.N;i+=7){if(g.M.ter[i]<2||g.owner[i]===me.id)continue;const d=(i%g.W-me.cx)**2+(((i/g.W)|0)-me.cy)**2;if(d<bd){bd=d;t=i;}}S.UI.ratio=.3;if(t>=0)S.tap(t,0,0);S.act('closeCard');S.run(80);}
      document.querySelectorAll('.ts,#hint').forEach(e=>e.hidden=true);S.act('home');});
    await p.waitForTimeout(2500);await p.screenshot({path:`${out}/ref-${name}-2-battle.png`});
    await p.evaluate(()=>{const S=__sijal,g=S.G,me=g.nations[g.human];const t=g.structs.filter(s=>!s.dead&&s.type==='city'&&s.owner&&s.owner!==me.id).sort((a,b)=>((a.x-me.cx)**2+(a.y-me.cy)**2)-((b.x-me.cx)**2+(b.y-me.cy)**2))[0];
      if(t){S.R.fx.push({type:'boom',x:t.x,y:t.y,t:.25,dur:2000,r:14,nuke:true});t.ruin=g.tick+500;S.cam.tx=t.x;S.cam.ty=t.y;}});
    await p.waitForTimeout(700);await p.screenshot({path:`${out}/ref-${name}-3-explosion.png`});await ctx.close();};
  await shots('vertical',{...devices['iPhone 13'],deviceScaleFactor:3});await shots('horizontal',{viewport:{width:1920,height:1080}});
  await b.close();})();
