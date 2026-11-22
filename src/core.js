// ── SIJAL · core: constants, utilities, shared data ──
const TPS=10,SEASON_LEN=450;
// terrain ids: 0 deep, 1 shallow, 2 plains, 3 forest, 4 desert, 5 hills, 6 mountain, 7 snow
const T_DELAY=[0,0,1.5,2.3,1.8,3,6.5,2.9],T_COST=[0,0,11,17,14,26,60,22],T_DEF=[0,0,1,1.3,.9,1.6,2.6,1.25],T_VAL=[0,0,1,.75,.3,.5,.12,.22];
// each further building of a kind costs `mul` times the previous one
const ST={city:{era:1,cost:400,mul:1.4},fort:{era:1,cost:200,mul:1.25},port:{era:2,cost:400,mul:1.35},factory:{era:3,cost:1200,mul:1.3},camp:{era:1,cost:2500,mul:1.5},coast:{era:2,cost:350,mul:1.25},silo:{era:3,cost:1500,mul:1.3},shield:{era:3,cost:900,mul:1.3},mon:{era:4,cost:15000,mul:1}};
const MSL={rocket:{era:3,cost:900,r:4,cd:50},nuke:{era:4,cost:6000,r:10,cd:50},doom:{era:4,cost:18000,r:20,cd:50}};
const ERA_COST=[0,1500,6000,18000];
const ULT={blitz:{cost:200,cd:900},wall:{cost:200,cd:900},levy:{cost:250,cd:1000},bribe:{cost:400,cd:1000,tg:1},tsunami:{cost:400,cd:1000,tg:1},beam:{cost:400,cd:900,tg:1}};
const FAC={
  hawks:{c:[226,158,44],spd:.78,ult:'blitz'},
  bastion:{c:[86,134,196],def:1.3,fort:.6,ult:'wall'},
  merchants:{c:[214,180,60],gold:1.4,ult:'bribe'},
  mariners:{c:[38,176,186],boat:1.9,slots:2,port:1.5,ult:'tsunami'},
  scholars:{c:[158,112,226],era:.7,msl:.7,ult:'beam'},
  horde:{c:[206,72,60],grow:1.3,def:.88,ult:'levy'}};
const FKEYS=Object.keys(FAC);
const PERS={war:{agg:.9,trust:.3,tre:.4,thr:.9},conq:{agg:.75,trust:.45,tre:.3,thr:1},sly:{agg:.6,trust:.7,tre:.9,thr:1.1},merc:{agg:.45,trust:.9,tre:.12,thr:1.45},sage:{agg:.35,trust:.75,tre:.05,thr:1.65}};
const PKEYS=Object.keys(PERS);
const DIFF=[{grow:.5,gold:.6,hate:-1},{grow:.75,gold:.8,hate:-.3},{grow:1,gold:1,hate:.2},{grow:1.35,gold:1.35,hate:.7}];
const SEAS=[{spd:1,cost:1,grow:1.3,gold:1},{spd:.82,cost:1,grow:1,gold:1},{spd:1,cost:1,grow:1,gold:1.4},{spd:1.4,cost:1.25,grow:.7,gold:.9}];
// battle pass: opens at 10,000 experience, then one tier every 1,000; each tier unlocks a land pattern or a building style
const PASS_AT=10000,PASS_STEP=1000,PATS=['stripes','dots','checker','grid','waves','chevron','bricks','stars','diamonds','zigzag'],BLDS=['gold','stone','neon','royal','ice','obsidian','fire','jade','crimson','silver'];
const PASS=[['pat','stripes'],['bld','gold'],['pat','dots'],['bld','stone'],['pat','checker'],['bld','neon'],['pat','grid'],['bld','royal'],['pat','waves'],['bld','ice'],['pat','chevron'],['bld','obsidian'],['pat','bricks'],['bld','fire'],['pat','stars'],['bld','jade'],['pat','diamonds'],['bld','crimson'],['pat','zigzag'],['bld','silver']];
// building styles: fill, rim, shape, glow
const BSTY={gold:{f:'#d9a93c',s:'#fff1c2',sh:'c',gl:'rgba(255,214,120,.9)'},stone:{f:'#8b877f',s:'#3b3833',sh:'hex'},neon:{f:'#0d1828',s:'#3ff0ff',sh:'c',gl:'rgba(63,240,255,.95)'},royal:{f:'#6a3c9e',s:'#ffd36b',sh:'c'},ice:{f:'#4fa6dc',s:'#e9f8ff',sh:'hex',gl:'rgba(190,235,255,.8)'},obsidian:{f:'#1c1a22',s:'#a586ff',sh:'oct'},fire:{f:'#d2461c',s:'#ffd166',sh:'c',gl:'rgba(255,140,40,.95)'},jade:{f:'#2e9e6e',s:'#d6ffe9',sh:'hex',gl:'rgba(120,255,190,.8)'},crimson:{f:'#8e1b2c',s:'#ffb3bd',sh:'oct'},silver:{f:'#b9c2cc',s:'#ffffff',sh:'c',gl:'rgba(230,240,255,.9)'}};
// whether a land pattern colours tile (x,y)
function patOn(k,x,y){switch(k){case'stripes':return(x+y)%6<2;case'dots':return x%6<2&&y%6<2;case'checker':return((x>>2)+(y>>2))&1;case'grid':return x%7===0||y%7===0;
  case'waves':return(y+Math.round(2*Math.sin(x/3)))%7<2;case'chevron':return(y+Math.abs(x%10-5))%8<2;case'bricks':return y%4===0||(x+((y>>2)&1)*4)%8===0;
  case'diamonds':return(Math.abs(x%8-4)+Math.abs(y%8-4))===3;case'zigzag':return(y+(x%8<4?x%8:7-x%8))%6<2;
  case'stars':{const a=x%9,b=y%9;return(a===4&&b>=3&&b<=5)||(b===4&&a>=3&&a<=5);}}return false;}
// emoji a realm can show over its land
const EMO=['😀','😊','😂','😍','😎','🤔','🙄','😢','😭','😱','😡','🤬','😈','🤡','💀','👍','👎','👏','🙏','💪','🤝','🕊️','🏳️','⚔️','🔥','💣','☢️','⚠️','🎯','👑','💰','❤️','💔','🆘','⏳','👀','67'];
const PAL=[[231,76,60],[52,152,219],[46,204,113],[241,196,15],[155,89,182],[230,126,34],[26,188,156],[236,112,160],[127,140,255],[149,165,60],[211,84,0],[94,214,214],[190,144,212],[255,165,120],[100,180,100],[170,120,80],[220,220,110],[90,120,200],[200,90,130],[60,160,140],[240,150,200],[140,200,240],[180,60,60],[120,120,160]];
const DX8=[1,-1,0,0,1,1,-1,-1],DY8=[0,0,1,-1,1,-1,1,-1];

const hyp=(a,b)=>Math.sqrt(a*a+b*b),bump=(d,s)=>{const v=1/(1+d*d/s);return v*v;};
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{x=clamp((x-a)/(b-a),0,1);return x*x*(3-2*x);};
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function shuffle(a,r){for(let i=a.length-1;i>0;i--){const j=(r()*(i+1))|0,t=a[i];a[i]=a[j];a[j]=t;}return a;}
function fmt(n){n=Math.floor(n);if(n>=1e6)return(n/1e6).toFixed(n>=1e7?1:2)+'M';if(n>=1e4)return(n/1e3).toFixed(n>=1e5?0:1)+'K';return''+n;}

class Heap{
  constructor(){this.p=[];this.v=[];}
  get size(){return this.p.length;}
  peek(){return this.p[0];}
  push(pr,val){const p=this.p,v=this.v;let i=p.length;p.push(pr);v.push(val);while(i>0){const j=(i-1)>>1;if(p[j]<=pr)break;p[i]=p[j];v[i]=v[j];i=j;}p[i]=pr;v[i]=val;}
  pop(){const p=this.p,v=this.v,top=v[0],lp=p.pop(),lv=v.pop(),n=p.length;
    if(n>0){let i=0;for(;;){let c=2*i+1;if(c>=n)break;if(c+1<n&&p[c+1]<p[c])c++;if(p[c]>=lp)break;p[i]=p[c];v[i]=v[c];i=c;}p[i]=lp;v[i]=lv;}
    return top;}
}

// gradient-noise fbm, seeded
function makeNoise(seed){
  const r=mulberry32(seed),p=new Uint8Array(256),perm=new Uint8Array(512);
  for(let i=0;i<256;i++)p[i]=i;for(let i=255;i>0;i--){const j=(r()*(i+1))|0,t=p[i];p[i]=p[j];p[j]=t;}for(let i=0;i<512;i++)perm[i]=p[i&255];
  const GX=[1,-1,1,-1,1,-1,0,0],GY=[1,1,-1,-1,0,0,1,-1];
  function n2(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,X=xi&255,Y=yi&255;
    const h0=perm[X+perm[Y]]&7,h1=perm[X+1+perm[Y]]&7,h2=perm[X+perm[Y+1]]&7,h3=perm[X+1+perm[Y+1]]&7;
    const a=GX[h0]*xf+GY[h0]*yf,b=GX[h1]*(xf-1)+GY[h1]*yf,c=GX[h2]*xf+GY[h2]*(yf-1),d=GX[h3]*(xf-1)+GY[h3]*(yf-1);
    const u=xf*xf*xf*(xf*(xf*6-15)+10),v=yf*yf*yf*(yf*(yf*6-15)+10);
    return a+(b-a)*u+(c+(d-c)*u-(a+(b-a)*u))*v;}
  return function(x,y,oct){let s=0,amp=1,f=1,tot=0;for(let o=0;o<oct;o++){s+=n2(x*f,y*f)*amp;tot+=amp;amp*=.5;f*=2.03;}return s/tot;};
}

// names — nations (name, leader) and city name parts, in ar / en
const NAT={
 ar:[['مملكة الرمال','الملك نمر'],['سلطنة البحر','السلطان بدر'],['إمارة النخيل','الأمير راكان'],['اتحاد الجبل','القائد صخر'],['إمبراطورية الشمس','الإمبراطورة شمس'],['مملكة القمر','الملكة ليان'],['خانية السهوب','الخان باتور'],['دولة الصقر','الأمير غيث'],['قبائل الثلج','الزعيم برّاق'],['ممالك الذهب','الملكة جود'],['دوقية الغابة','الدوق أوس'],['إمارة اللؤلؤ','الأميرة لولوة'],['اتحاد الحديد','القائد ليث'],['سلطنة المرجان','السلطانة مرجانة'],['مملكة العاصفة','الملك رعد'],['دولة النهر','الحاكم فرات'],['إمبراطورية الفجر','الإمبراطور ضياء'],['قلاع الشمال','الأمير شهاب'],['إمارة الواحة','الشيخ فهد'],['مملكة الياقوت','الملكة ياقوت'],['حلف الذئاب','القائد ذيب'],['سلطنة النجوم','السلطان نجم'],['دولة البركان','الحاكم لهب'],['مملكة السحاب','الملكة غيمة'],['إمارة الزيتون','الأمير زيد'],['سلطنة الرياح','السلطان هبوب'],['مملكة العنبر','الملكة عنبر'],['حلف النسور','القائد عقاب'],['دولة الكثبان','الشيخ رمّال'],['إمبراطورية الأفق','الإمبراطور مدى']],
 en:[['Kingdom of Sands','King Nimr'],['Sea Sultanate','Sultan Badr'],['Emirate of Palms','Emir Rakan'],['Mountain League','Chief Sakhr'],['Sun Empire','Empress Shams'],['Moon Kingdom','Queen Layan'],['Steppe Khanate','Khan Batur'],['Falcon State','Prince Ghaith'],['Frost Tribes','Chief Barraq'],['Golden Realms','Queen Joud'],['Forest Duchy','Duke Aws'],['Pearl Emirate','Princess Lulwa'],['Iron Union','Marshal Laith'],['Coral Sultanate','Sultana Marjana'],['Storm Kingdom','King Raad'],['River State','Governor Furat'],['Dawn Empire','Emperor Diya'],['Northern Keeps','Prince Shihab'],['Oasis Emirate','Sheikh Fahd'],['Ruby Kingdom','Queen Yaqut'],['Wolf Pact','Warlord Dheeb'],['Star Sultanate','Sultan Najm'],['Volcano State','Governor Lahab'],['Cloud Kingdom','Queen Ghaima'],['Olive Emirate','Emir Zaid'],['Wind Sultanate','Sultan Haboob'],['Amber Kingdom','Queen Anbar'],['Eagle Pact','Marshal Uqab'],['Dune State','Sheikh Rammal'],['Horizon Empire','Emperor Mada']]};
const CITY={
 ar:[['تل','واحة','قلعة','مرسى','برج','عين','رأس','وادي','حصن','دار','باب','جسر','بئر','روضة','ثغر','قصر'],['الريح','النور','الصخر','اللؤلؤ','الغيم','الذهب','الموج','الظل','النسر','الأمان','النجم','الفجر','الرمل','الزيتون','الياقوت','السحاب','الأسد','الندى']],
 en:[['Tel','Waha','Qalat','Marsa','Burj','Ain','Ras','Wadi','Hisn','Dar','Bab','Jisr','Bir','Rawda','Thaghr','Qasr'],['Rih','Noor','Sakhr','Lulu','Ghaym','Dhahab','Mawj','Dhill','Nasr','Aman','Najm','Fajr','Raml','Zaytun','Yaqut','Sahab','Asad','Nada']]};
// tribe names: 6 x 10 x 10 = 600 combinations
const TRIBE={
 ar:[['قبيلة','بنو','آل','عشيرة','فرسان','أهل'],['الصقر','الذئب','الأسد','النمر','الفهد','النسر','الحصان','الجمل','الغزال','الثعلب'],['الأحمر','الأسود','الأبيض','الذهبي','الرمادي','الشمالي','الجنوبي','الشرقي','الغربي','العالي']],
 en:[['Tribe','Clan','House','Band','Riders','Folk'],['Falcon','Wolf','Lion','Tiger','Cheetah','Eagle','Horse','Camel','Gazelle','Fox'],['Red','Black','White','Golden','Grey','Northern','Southern','Eastern','Western','High']]};
const tribeName=(i,lang)=>{const T=TRIBE[lang]||TRIBE.ar,a=T[0][(i/100)|0],b=T[1][((i/10)|0)%10],c=T[2][i%10];return lang==='en'?a+' of the '+c+' '+b:a+' '+b+' '+c;};
const cityName=(idx,lang)=>{const c=CITY[lang]||CITY.ar;return c[0][(idx/18)|0]+' '+c[1][idx%18];};
