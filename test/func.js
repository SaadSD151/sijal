// exercises the rarely-hit player paths in headless Chromium: node test/func.js <outdir>
const {chromium}=require('playwright');const path=require('path');
(async()=>{
  const out=process.argv[2],b=await chromium.launch(),pg=await(await b.newContext({viewport:{width:1366,height:768}})).newPage(),errs=[];
  pg.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,5).join('\n')));pg.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text());});
  await pg.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await pg.waitForTimeout(800);
  await pg.evaluate(()=>{__sijal.act('lang:en');__sijal.act('setBack');__sijal.UI.prof.fac='scholars';__sijal.UI.prof.type='islands';(__sijal.act('quick'),__sijal.act('go'));});await pg.waitForTimeout(1500);
  const log=await pg.evaluate(()=>{
    const S=__sijal,g=S.G,L=[],me=g.nations[g.human],W=g.W;
    let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%W,y=(i/W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]>3&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>(g.nations[s.owner]&&g.nations[s.owner].minor?110:250)))sp=i;}
    S.tap(sp,0,0);L.push('spawn '+S.UI.phase);
    me.gold=1e6;me.troops=5e5;
    for(let r=0;r<12;r++){S.UI.ratio=.3;let t=-1,bd=1e9;for(let i=0;i<g.N;i+=7){if(g.M.ter[i]<2||g.owner[i])continue;const d=(i%W-me.cx)**2+(((i/W)|0)-me.cy)**2;if(d<bd){bd=d;t=i;}}if(t>=0)S.tap(t,0,0);S.run(40);me.troops=Math.max(me.troops,3e5);}
    L.push('tiles '+me.tiles+' cities '+me.cnt.city);
    S.act('era');S.act('era');S.act('era');L.push('era '+me.era);
    // build one of everything on valid own tiles
    const site=(type)=>{for(let k=0;k<4000;k++){const i=(Math.random()*g.N)|0;if(g.owner[i]===me.id&&!canB(type,i))return i;}return -1;};
    const canB=(type,i)=>{S.act('b:'+type);const before=g.structs.length;S.tap(i,0,0);const ok=g.structs.length>before;if(!ok&&S.UI.mode)S.act('b:'+type);return ok?0:1;};
    for(const ty of['city','fort','port','silo','shield','mon']){let ok=false;for(let k=0;k<3000&&!ok;k++){const i=(Math.random()*g.N)|0;if(g.owner[i]!==me.id)continue;S.act('b:'+ty);if(!S.UI.mode){L.push(ty+' mode refused');break;}const n0=g.structs.length;S.tap(i,0,0);ok=g.structs.length>n0;if(S.UI.mode)S.act('b:'+ty);}L.push(ty+' built '+ok);}
    document.querySelectorAll('.ts').forEach(e=>e.remove());
    // missiles at the strongest rival's capital, ultimate, boat, diplomacy
    const riv=g.nations.filter(n=>n&&n.alive&&!n.human).sort((a,b)=>b.tiles-a.tiles)[0];
    S.act('b:rocket');S.tap(riv.cap.i+3,0,0);L.push('rocket missiles '+g.missiles.length);
    S.run(120);S.act('b:nuke');S.tap(riv.cap.i+5,0,0);L.push('nuke missiles '+g.missiles.length+' mode '+S.UI.mode);
    me.ultAt=0;S.act('b:ult');S.tap(riv.cap.i-4,0,0);L.push('ult pending '+g.pending.length);
    let far=-1;for(let i=0;i<g.N;i++)if(g.M.coastD[i]===1&&g.owner[i]!==me.id&&g.owner[i]&&g.nb[me.id*g.nations.length+g.owner[i]]===0){far=i;break;}
    const b0=g.boats.length;if(far>=0){S.UI.ratio=.2;S.tap(far,0,0);}L.push('boat '+(g.boats.length-b0)+' far '+far);
    for(const n of g.nations)if(n&&n.alive&&!n.human){n.att[me.id]=80;S.act('nat:'+n.id);S.act('ally:'+n.id);S.act('gift:'+n.id);}
    let al=0;for(const n of g.nations)if(n&&me.ally[n.id])al++;L.push('allies '+al);
    S.act('arms:'+riv.id);const a1=g.nations.find(n=>n&&me.ally[n.id]);if(a1){S.act('break:'+a1.id);L.push('broke '+!me.ally[a1.id]);}
    const pr=g.nations.find(n=>n&&n.alive&&!n.human&&!me.ally[n.id]);g.proposals.push({from:pr.id,until:g.tick+250});g.ev.push({t:'proposal',a:pr.id,tick:g.tick});
    return L;});
  console.log(log.join('\n'));
  await pg.waitForTimeout(600);
  await pg.evaluate(()=>{const g=__sijal.G,p=g.proposals[0];if(p)__sijal.act('acc:'+p.from);__sijal.run(260);__sijal.act('home');});
  await pg.waitForTimeout(700);await pg.screenshot({path:`${out}/f1-en.png`});
  const st=await pg.evaluate(()=>{const g=__sijal.G,me=g.nations[g.human];__sijal.act('pause');const a=__sijal.UI.screen;__sijal.act('how');const b2=__sijal.UI.screen;__sijal.act('helpBack');__sijal.act('resume');
    __sijal.run(1500);return{pause:a,help:b2,after:__sijal.UI.screen,tick:g.tick,over:g.over,mon:!!me.mon,alive:me.alive,tiles:me.tiles,booms:__sijal.R.fx.length};});
  console.log(JSON.stringify(st));
  await pg.waitForTimeout(2400);await pg.screenshot({path:`${out}/f2-end.png`});
  console.log(errs.length?errs.join('\n'):'no errors');await b.close();
})();
