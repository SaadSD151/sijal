// alliance renew/expire flow and focused-vs-border attacks, through the real UI
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch(),pg=await b.newPage({viewport:{width:1300,height:760}}),errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await pg.waitForTimeout(600);await pg.evaluate(()=>{__sijal.act('setBack');__sijal.act('quick');__sijal.act('go');});await pg.waitForTimeout(2500);
  const r=await pg.evaluate(()=>{const S=__sijal,g=S.G,o={};let sp=-1;for(let i=0;i<g.N&&sp<0;i++){const x=i%g.W,y=(i/g.W)|0;if(g.M.ter[i]===2&&g.M.coastD[i]>2&&!g.owner[i]&&g.structs.every(s=>(s.x-x)**2+(s.y-y)**2>200))sp=i;}S.tap(sp,0,0);
    const me=g.nations[g.human];const P=g.nations.find(n=>n&&n.alive&&!n.human&&!n.minor);P.att[me.id]=90;setAllyT(P.id);
    function setAllyT(id){S.act('nat:'+id);}
    // accept through game rules: the AI proposes to us
    g.proposals.push({from:P.id,to:me.id,until:g.tick+250});S.act('acc:'+P.id);S.run(1);o.allied=!!me.ally[P.id];o.until=me.allyUntil[P.id]-g.tick;
    S.run(1010);o.warnToast=!!document.querySelector('.ts[data-ally="'+P.id+'"]');
    return{o,pid:P.id};});
  await pg.waitForTimeout(400);await pg.screenshot({path:process.argv[2]+'/ally.png'});
  const r2=await pg.evaluate(pid=>{const S=__sijal,g=S.G,me=g.nations[g.human],o={};S.act('renew:'+pid+':1');o.toastGone=!document.querySelector('.ts[data-ally="'+pid+'"]');S.run(220);o.stillAlly=!!me.ally[pid];o.left=me.allyUntil[pid]-g.tick;
    S.run(1200);o.endedWithoutAnswer=!me.ally[pid];return o;},r.pid);
  // focused vs all-border attack width, from a fresh capital
  const r3=await pg.evaluate(()=>{const S=__sijal,g=S.G,me=g.nations[g.human],K=g.nations.length,res={};S.act('closeCard');
    const E=g.nations.find(n=>n&&n.alive&&n.id!==me.id&&!me.ally[n.id]&&g.nb[me.id*K+n.id]>8);if(!E)return{noNeighbour:true};res.border=g.nb[me.id*K+E.id];
    for(const mode of['pt','all']){S.UI.prof.amode=mode;me.troops=5e5;for(const k of g.attacks)if(k.a===me.id)k.cancel=true;S.run(1);
      let tgt=-1;for(let i=0;i<g.N;i++)if(g.owner[i]===E.id&&adjOwn(i)){tgt=i;break;}
      function adjOwn(i){const W=g.W;return g.owner[i-1]===me.id||g.owner[i+1]===me.id||g.owner[i-W]===me.id||g.owner[i+W]===me.id;}
      S.UI.ratio=.3;S.tap(tgt,0,0);const k=g.attacks.filter(k=>k.a===me.id&&!k.cancel).pop();res[mode]=k?{seeds:k.heap.size,focus:!!k.focus}:'none';}
    return res;});
  console.log(JSON.stringify(r.o),JSON.stringify(r2),JSON.stringify(r3),errs.join('|')||'no errors');await b.close();})();
