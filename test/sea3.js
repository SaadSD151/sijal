// land-border neighbour, landing chosen on the far side of their coast: the ship must go to that spot
const {chromium,devices}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();
  for(const [name,opts] of [['pc',{viewport:{width:1300,height:760}}],['phone',{...devices['iPhone 13']}]]){
    const ctx=await b.newContext(opts),p=await ctx.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await p.waitForTimeout(600);
    await p.evaluate(()=>{const S=__sijal;S.act('setBack');S.UI.prof.size=1;S.UI.prof.type='continents';S.act('quick');S.act('goQ');});await p.waitForTimeout(2500);
    const r=await p.evaluate(name=>{const S=__sijal,g=S.G,W=g.W,K=g.nations.length;
      let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%W,y=(i/W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]===2&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>200))sp=i;}S.tap(sp,0,0);
      const me=g.nations[g.human];for(let k=0;k<14;k++){me.troops=Math.max(me.troops,2e5);let t=-1,bd=1e9;for(let i=0;i<g.N;i+=5){if(g.M.ter[i]<2||g.owner[i])continue;const d=(i%W-me.cx)**2+(((i/W)|0)-me.cy)**2;if(d<bd){bd=d;t=i;}}S.UI.ratio=.3;if(t>=0)S.tap(t,0,0);S.act('closeCard');S.run(40);}
      me.troops=3e5;const res=[];
      for(const n of g.nations){if(!n||!n.alive||n.human||n.minor||me.ally[n.id]||g.nb[me.id*K+n.id]<1||n.coast<3)continue;
        // their shore tile farthest from our centre = "behind them"
        let far=-1,fd=-1;for(let i=0;i<g.N;i++)if(g.owner[i]===n.id&&g.M.coastD[i]===1){const d=(i%W-me.cx)**2+(((i/W)|0)-me.cy)**2;if(d>fd){fd=d;far=i;}}
        S.act('nat:'+n.id);S.act('sea:'+n.id);const mode=S.UI.mode;S.tap(far,0,0);if(S.UI.pend>=0)S.act('cfm');
        const bt=g.boats.filter(x=>x.a===me.id).pop(),msg=[...document.querySelectorAll('#toasts .ts')].slice(-1).map(e=>e.textContent).join('');
        res.push({id:n.id,mode,boat:!!bt,dist:bt?Math.round(Math.hypot(bt.ti%W-far%W,((bt.ti/W)|0)-((far/W)|0))):null,owner:bt?g.owner[bt.ti]:null,msg:bt?'':msg});
        g.boats=g.boats.filter(x=>x.a!==me.id);document.querySelectorAll('.ts').forEach(e=>e.remove());S.act('closeCard');}
      return res;},name);
    for(const o of r)console.log(name,'neighbour',o.id,'mode',o.mode,'| ship launched:',o.boat,o.boat?`lands ${o.dist} tiles from the chosen spot, on owner ${o.owner}`:'msg: '+o.msg);
    if(!r.length)console.log(name,'no coastal land neighbour in this map');console.log('  ',errs.join('|')||'no errors');await ctx.close();}
  await b.close();})();
