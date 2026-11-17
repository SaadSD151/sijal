// sea attack from the realm card, on PC (card opened by right-click/ranking, no tile) and phone (card opened by tapping a tile)
const {chromium,devices}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();
  for(const [name,opts] of [['pc',{viewport:{width:1300,height:760}}],['phone',{...devices['iPhone 13']}]]){
    const ctx=await b.newContext(opts),p=await ctx.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await p.waitForTimeout(600);
    await p.evaluate(()=>{const S=__sijal;S.act('setBack');S.UI.prof.size=1;S.UI.prof.type='continents';S.act('quick');S.act('goQ');});await p.waitForTimeout(2500);
    const r=await p.evaluate(name=>{const S=__sijal,g=S.G,W=g.W,out=[];
      let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%W,y=(i/W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]===2&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>200))sp=i;}S.tap(sp,0,0);
      const me=g.nations[g.human];for(let k=0;k<12;k++){me.troops=Math.max(me.troops,2e5);let t=-1,bd=1e9;for(let i=0;i<g.N;i+=5){if(g.M.ter[i]<2||g.owner[i])continue;const d=(i%W-me.cx)**2+(((i/W)|0)-me.cy)**2;if(d<bd){bd=d;t=i;}}S.UI.ratio=.3;if(t>=0)S.tap(t,0,0);S.act('closeCard');S.run(40);}
      me.troops=3e5;const K=g.nations.length;
      // try every live AI realm: some share a land border, some only a sea
      for(const n of g.nations){if(!n||!n.alive||n.human||n.minor||me.ally[n.id])continue;
        const b0=g.boats.filter(x=>x.a===me.id).length;let tile=-1;for(let i=0;i<g.N;i+=3)if(g.owner[i]===n.id){tile=i;break;}
        if(name==='phone'){S.tap(tile,0,0);}else S.act('nat:'+n.id);
        const toasts0=document.querySelectorAll('.ts').length;S.act('sea:'+n.id);
        const made=g.boats.filter(x=>x.a===me.id).length-b0,msg=[...document.querySelectorAll('#toasts .ts,#gToasts .ts')].slice(-1).map(e=>e.textContent).join('');
        const bt=g.boats.filter(x=>x.a===me.id).pop();
        out.push({id:n.id,land:g.nb[me.id*K+n.id]>0,coast:n.coast,boat:made,target:made?g.owner[bt.ti]:null,msg:made?'':msg});
        for(const x of g.boats)if(x.a===me.id)x.troops=0;g.boats=g.boats.filter(x=>x.a!==me.id);S.act('closeCard');document.querySelectorAll('.ts').forEach(e=>e.remove());}
      return{myCoast:me.coast,out};},name);
    console.log(name,'my coast',r.myCoast);for(const o of r.out)console.log('  realm',o.id,'land border',o.land,'their coast',o.coast,'-> boat',o.boat,o.boat?'lands on owner '+o.target:'msg: '+o.msg);
    console.log('  ',errs.join('|')||'no errors');await ctx.close();}
  await b.close();})();
