// cheats: chosen in custom setup, take effect for the player, and the battle never counts toward stats
const {chromium,devices}=require('playwright'),path=require('path');const SH=process.argv[2];
(async()=>{const b=await chromium.launch(),c=await b.newContext({...devices['iPhone 13']}),p=await c.newPage(),e=[];p.on('pageerror',x=>e.push(x.message));
await p.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await p.waitForTimeout(600);
const r=await p.evaluate(()=>{const S=__sijal;S.act('setBack');S.act('custom');for(const k of['gold','troops','build','era','msl'])S.act('cheat:'+k);return{chips:document.querySelectorAll('.cheats .chip.on').length};});
await p.screenshot({path:SH+'/cheat-setup.png',fullPage:true});
await p.evaluate(()=>__sijal.act('go'));await p.waitForTimeout(1500);
const r2=await p.evaluate(()=>{const S=__sijal,g=S.G,W=g.W;let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%W,y=(i/W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]>3&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>300))sp=i;}S.tap(sp,0,0);S.run(5);
  const me=g.nations[g.human];let fi=-1;for(let i=0;i<g.N;i++)if(g.owner[i]===me.id&&!S.cb(g,me,'silo',i)){fi=i;break;}S.fn.build(g,me,'silo',fi);S.run(12);const s=g.structs[g.structAt[fi]-1];
  const xp0=S.UI.prof.xp,g0=S.UI.prof.games;S.act('toMenu');return{opt:JSON.stringify(g.o.cheats),gold:me.gold>=1e8,troops:me.troops>=9e6,era:me.era,siloReady:s&&!s.build,xpAdded:S.UI.prof.xp-xp0,gamesAdded:S.UI.prof.games-g0};});
// quick battle never carries cheats
const r3=await p.evaluate(()=>{const S=__sijal;S.act('goQ');return 0;});await p.waitForTimeout(1500);const q=await p.evaluate(()=>!!__sijal.G.o.cheats);
console.log(JSON.stringify(r),JSON.stringify(r2),'| quick battle has cheats:',q,e.join('|')||'no errors');await b.close();})();
