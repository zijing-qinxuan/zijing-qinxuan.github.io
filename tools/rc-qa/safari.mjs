// Native macOS Safari verification. Local preview guard prevents production submissions.
import fs from 'node:fs/promises';
const base='http://127.0.0.1:4444';
async function api(route,body,method=body?'POST':'GET'){
 const r=await fetch(base+route,{method,headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const j=await r.json();if(j.value?.error)throw Error(JSON.stringify(j.value));return j.value;
}
const session=await api('/session',{capabilities:{alwaysMatch:{browserName:'safari'}}});const sid='/session/'+session.sessionId;
const out='/private/tmp/wedding-rc-safari';await fs.mkdir(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ev=script=>api(sid+'/execute/sync',{script:'return ('+script+')',args:[]});
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
const results=[];
try{
for(const width of (process.argv.includes('--probe')?[1680]:[1280,1440,1680]))for(const invite of ['full','wedding','online']){
 await api(sid+'/window/rect',{width,height:1000});
 await api(sid+'/url',{url:`http://127.0.0.1:8765/index.html?invite=${invite}`});
 for(let n=0;n<100;n++){if(await ev(`!!window.WeddingI18n && !!document.querySelector('.wedding-carousel__dot')`))break;await sleep(50);}
 const actual=await ev('({width:innerWidth,height:innerHeight,outerWidth,outerHeight,dpr:devicePixelRatio})');console.log('Safari dimensions',width,JSON.stringify(actual));
 if(process.argv.includes('--probe'))break;
 check(actual.width===width,'Safari viewport width mismatch');
 for(const lang of ['zh-TW','en']){
  await ev(`(()=>{WeddingI18n.applyLanguage('${lang}');document.documentElement.style.scrollBehavior='auto';return true})()`);
  check(await ev('document.documentElement.scrollWidth<=innerWidth'),'horizontal overflow');
  check(await ev(`document.documentElement.lang==='${lang}'`),'lang');
  check(await ev(`document.querySelector('#wedding-info').hidden===${invite!=='full'}`),'invite visibility');
  await ev(`(()=>{document.querySelector('[data-quick-nav="gallery"]').click();return true})()`);await sleep(1500);
  const before=await ev(`({y:scrollY,h:document.documentElement.scrollHeight,index:carouselActiveIndex})`);
  await ev(`(()=>{document.querySelector('.wedding-carousel__arrow--next').click();return true})()`);await sleep(650);
  check(await ev(`carouselActiveIndex===${(before.index+1)%22}`),'next');check(Math.abs(await ev('scrollY')-before.y)<2,'carousel scroll');check(await ev('document.documentElement.scrollHeight')===before.h,'carousel height');
  await ev(`(()=>{document.querySelector('.wedding-carousel__slide.is-active button').click();return true})()`);
  for(let n=0;n<100;n++){if(await ev(`!document.querySelector('#gallery-lightbox').hidden`))break;await sleep(50);}
  check(await ev(`!document.querySelector('#gallery-lightbox').hidden`),'lightbox opens');
  await ev(`(()=>{document.querySelector('.lightbox-close').click();return true})()`);await sleep(200);
  check(Math.abs(await ev('scrollY')-before.y)<2,'lightbox scroll restore');
  check(await ev(`document.activeElement===document.querySelector('.wedding-carousel__slide.is-active button')`),'lightbox focus');
  await ev(`(()=>{document.querySelector('#ceremony-arrival-trigger').click();return true})()`);await sleep(400);
  check(await ev('document.documentElement.scrollWidth<=innerWidth'),'expanded overflow');
  await ev(`(()=>{document.querySelector('#nav-more-toggle').click();return true})()`);check(await ev(`document.querySelector('#nav-more-toggle').getAttribute('aria-expanded')==='true'`),'more menu');
  await ev(`(()=>{document.querySelector('#nav-more-toggle').click();document.querySelector('#back-to-top').click();return true})()`);await sleep(1500);
  check(await ev('scrollY')===0,'back to top');
  if(width===1440&&invite==='full'){const screenshot=await api(sid+'/screenshot');await fs.writeFile(`${out}/${width}-${lang}.png`,Buffer.from(screenshot,'base64'));}
  results.push({requestedWidth:width,actual,invite,lang,status:'PASS'});console.log('PASS Safari',width,invite,lang);
 }
}
await fs.writeFile(out+'/results.json',JSON.stringify(results,null,2));
}catch(e){console.error(e);process.exitCode=1;}finally{await api(sid,null,'DELETE');}
