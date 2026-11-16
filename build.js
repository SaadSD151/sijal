// builds single-file versions of the game into dist/
const fs=require('fs'),path=require('path'),p=f=>fs.readFileSync(path.join(__dirname,'src',f),'utf8');
const js=['core','map','game','ai','render','i18n','net','ui'].map(f=>p(f+'.js')).join('\n'),css=p('style.css'),body=p('body.html');
const TITLE='<title>سِجال حرب المدن</title>';
const FONTS='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap">';
const script=m=>`<script>\n${m?`window.SIJAL_MODE='${m}';`:''}(function(){"use strict";\n${js}\n})();\n</script>`;
const out=(f,s)=>{fs.writeFileSync(path.join(__dirname,'dist',f),s);console.log(f,(s.length/1024).toFixed(0)+' KB');};
// page fragment for the hosted version (the host adds the document skeleton)
out('sijal-artifact.html',`${TITLE}\n<meta name="claude:viewport-fit-sides" content="cover">\n${FONTS}\n<style>\n${css}</style>\n${body}${script()}\n`);
// standalone files: auto-detect, forced mobile, forced PC
const full=m=>`<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n<meta name="theme-color" content="#092440">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-capable" content="yes">\n${TITLE}\n${FONTS}\n<style>:root{padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}[hidden]{display:none!important}</style>\n<style>\n${css}</style>\n</head>\n<body>\n${body}${script(m)}\n</body>\n</html>\n`;
out('sijal.html',full());try{fs.mkdirSync(path.join(__dirname,'dist','site'));}catch(e){}out('site/index.html',full().replace('<meta name="theme-color"','<meta name="description" content="سِجال حرب المدن: لعبة حرب استراتيجية مجانية على المتصفح، وسّع أرضك واحتلّ المدن والعب أونلاين مع أصحابك.">\n<meta name="theme-color"'));out('sijal-mobile.html',full('mobile'));out('sijal-pc.html',full('pc'));
