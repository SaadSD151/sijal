// ── SIJAL · name filter: blocks insults, racism, hate/extremism, politics and sexual words in player names ──
// Names are normalised first (Arabic letter variants, diacritics, tatweel, leetspeak digits, separators, repeated letters),
// so «ن.ا.ز.ي», «نااازي», «N4Z1» and «n a z i» are all caught. SUB entries match anywhere; WORD entries only as a whole word
// (with ال / و / يا / بال in front allowed), because they are short and appear inside harmless names.
const NF_SUB=[
  // extremism, hate symbols, political parties and figures
  'نازي','هتلر','داعش','الدوله الاسلاميه','ارهاب','صهيون','حزب','موسوليني','ستالين','نتنياهو','خامنئي','الخميني','بن لادن','ابوبكر البغدادي','الاخوان المسلمين','اسرائيل','الكيان',
  'hitler','daesh','alqaeda','al qaeda','zion','holocaust','swastika','heil','fuhrer','fuehrer','whitepower','white power','mussolini','stalin','netanyahu','khamenei','binladen','bin laden','terroris','israel','party',
  // racism and sectarian slurs
  'زنجي','رافضي','رافضه','روافض','ناصبي','نواصب','مجوسي','مجوس','صفوي','وهابي','عنصري','خكري','طرش بحر',
  'nigg','negro','chink','kike','gook','wetback','beaner','raghead','towelhead','sandnig','racis',
  // insults and sexual words
  'كسمك','كس امك','كس اختك','كسختك','كسخت','منيوك','منيك','نياك','متناك','شرموط','قحبه','قحاب','عاهر','ديوث','معرص','مخنث','لوطي','طيز','يلعن','ملعون','لعنة الله','ابن الكلب','ولد الكلب','بنت الكلب','خنزير','خنازير','حقير','سافل','قذر','حيوان','حمار','زق','منيوكه','سكس','اباحي','بورن','مص زب',
  'fuck','fuk','fck','shit','bitch','whore','slut','cunt','pussy','penis','vagina','porn','faggot','retard','motherf','bastard','asshole','dickhead','nude','horny','boob','killyourself'
];
const NF_WORD=['ابوك','ابوكم','امك','امكم','اختك','اختكم','اخوك','اخوكم','عمك','عمكم','عمتك','عمتكم','خالك','خالكم','خالتك','خالتكم','جدك','جدكم','جدتك','زوجتك','مرتك','ولدك','بنتك','اهلك','ابوي','yourmom','urmom','yourdad','urdad','yoursister','yomama','زب','كس','زبي','زبر','زاني','زانيه','تفو','تفوو','خرا','خره','isis','coon','spic','kys','نيك','كلب','كلاب','وسخ','قرد','قرود','كافر','كفار','نجس','ass','fag','sex','cum','tit','tits','hoe','nig','dick','cock','rape','nazi','nazis','kkk','jew','jews','gay','sexy','لعن'];
const NF_RAW=['卐','卍','ϟϟ','1488','88heil','☭'];
function nfNorm(s){
  return String(s||'').toLowerCase().normalize('NFKC')
    .replace(/[ً-ٰٟـ​-‏‪-‮⁠﻿]/g,'')
    .replace(/[أإآٱ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/ک/g,'ك').replace(/[یي]/g,'ي').replace(/گ/g,'ك')
    .replace(/0/g,'o').replace(/1/g,'i').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/@/g,'a').replace(/\$/g,'s').replace(/!/g,'i').replace(/\|/g,'l');
}
const nfSquash=s=>s.replace(/[^a-zء-ي]/g,''),nfOne=s=>s.replace(/(.)\1+/g,'$1');
const NF_S=NF_SUB.map(w=>{const a=nfSquash(nfNorm(w));return[a,nfOne(a)];}),NF_W=new Set(NF_WORD.map(w=>nfSquash(nfNorm(w))));
const NF_W1=new Set([...NF_W].map(nfOne).filter(w=>w.length>=3));
function nfWordBad(w){
  if(!w)return false;const c=[w,nfOne(w)];
  for(const x of c)for(const y of[x,x.replace(/^(وال|بال|يال|ال|يا|و)/,'')])if(NF_W.has(y)||(y.length>=3&&NF_W1.has(nfOne(y))))return true;
  // English plurals and endings: dicks, nazis…
  return /^[a-z]+$/.test(w)&&(NF_W.has(w.replace(/(e?s)$/,''))||NF_W.has(w.replace(/(ed|er|ing)$/,'')));
}
// words the owner adds from the owner panel (stored in the database under bw/): 3+ letters match anywhere, shorter ones only as a word
let NF_X=[],NF_XW=new Set();
function nfSetExtra(L){NF_X=[];NF_XW=new Set();for(const w of L||[]){const a=nfSquash(nfNorm(w));if(a.length>=3)NF_X.push([a,nfOne(a)]);else if(a)NF_XW.add(a);}}
// true when the name must not be used
function badName(s){
  const raw=String(s||'');if(!raw.trim())return false;
  for(const r of NF_RAW)if(raw.includes(r))return true;
  const n=nfNorm(raw),sq=nfSquash(n),one=nfOne(sq);
  for(const[a,b]of NF_X)if(sq.includes(a)||one.includes(b))return true;
  for(const[a,b]of NF_S)if((a.length>=3&&sq.includes(a))||(b.length>=3&&one.includes(b)))return true;
  // whole words; runs of single letters (n a z i) are joined into one word first
  const toks=[],parts=n.split(/[^a-zء-ي]+/).filter(Boolean);let run='';
  for(const t of parts){if(t.length===1)run+=t;else{if(run)toks.push(run);run='';toks.push(t);}}if(run)toks.push(run);
  toks.push(sq);
  return toks.some(w=>nfWordBad(w)||NF_XW.has(w)||NF_XW.has(w.replace(/^(وال|بال|يال|ال|يا|و)/,'')));
}
// what other players see: a banned name shows as a plain placeholder
const cleanName=(s,fb)=>badName(s)?(fb||t('defPlayer')):s;
