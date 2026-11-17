// renders the site icon (512px) and the link-preview image (1200x630) from the game itself
const {chromium}=require('playwright'),path=require('path');
(async()=>{const b=await chromium.launch(),out=path.resolve(__dirname,'../src/assets');
  const ic=await b.newPage({viewport:{width:512,height:512}});
  await ic.setContent(`<canvas id="c" width="512" height="512"></canvas><style>body{margin:0}</style>`);
  await ic.evaluate(async()=>{const f=new FontFace('Aref Ruqaa','url(https://fonts.gstatic.com/s/arefruqaa/v25/WwkYxPW1E165rajQKDulKDwNcNIS2N_7Bdk.woff2)');try{await f.load();document.fonts.add(f);}catch(e){}
    const x=document.getElementById('c').getContext('2d'),g=x.createRadialGradient(256,200,40,256,256,360);g.addColorStop(0,'#1b3a5c');g.addColorStop(1,'#071422');
    x.fillStyle=g;x.beginPath();x.roundRect(0,0,512,512,96);x.fill();
    x.strokeStyle='rgba(227,185,90,.55)';x.lineWidth=10;x.beginPath();x.roundRect(14,14,484,484,84);x.stroke();
    const gl=x.createLinearGradient(0,120,0,400);gl.addColorStop(0,'#fff6d0');gl.addColorStop(.55,'#e3b95a');gl.addColorStop(1,'#9a6a1c');
    x.fillStyle=gl;let fs=250;x.font=`700 ${fs}px 'Aref Ruqaa',serif`;const w=x.measureText('سِجال').width;if(w>390){fs=fs*390/w;x.font=`700 ${fs}px 'Aref Ruqaa',serif`;}x.textAlign='center';x.textBaseline='middle';x.shadowColor='rgba(0,0,0,.5)';x.shadowOffsetY=10;x.fillText('سِجال',256,262);});
  await ic.waitForTimeout(300);await (await ic.$('#c')).screenshot({path:out+'/icon.png',omitBackground:true});
  const pv=await b.newPage({viewport:{width:1200,height:630}});await pv.goto('file://'+path.resolve(__dirname,'../dist/sijal.html'));await pv.waitForTimeout(2500);
  await pv.evaluate(()=>{__sijal.act('setBack');for(const e of document.querySelectorAll('.mb .btn:not(.big), .mf, .acc, .news'))e.style.display='none';});await pv.waitForTimeout(3000);
  await pv.screenshot({path:out+'/preview.png'});await b.close();})();
