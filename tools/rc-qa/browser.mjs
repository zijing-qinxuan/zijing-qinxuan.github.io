// Dependency-free Chrome DevTools Protocol RC checks. Never sends production RSVP requests.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'../..');
const port=process.env.CDP_PORT||(process.argv.includes('--edge')?9230:9225);
const out=process.env.QA_OUT||`/private/tmp/wedding-rc-qa-${port}`;
await fs.mkdir(out,{recursive:true});
const targets=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0, errors=[], requests=[], mode='created', pending=0;
const calls=new Map();
function send(method,params={}){return new Promise((resolve,reject)=>{const n=++id;calls.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});}
ws.addEventListener('message',async e=>{const m=JSON.parse(e.data);if(m.id){const c=calls.get(m.id);calls.delete(m.id);m.error?c.reject(m.error):c.resolve(m.result);return;}
 if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
 if(m.method==='Log.entryAdded' && m.params.entry.level==='error') errors.push(m.params.entry.text);
 if(m.method==='Network.requestWillBeSent')requests.push(m.params.request.url);
 if(m.method==='Fetch.requestPaused'){
  const {requestId,request}=m.params; const url=new URL(request.url);
  try{
   if(url.hostname==='wedding-rc.test'){
    const p=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
    if(!p.startsWith(root+path.sep))throw Error('invalid path');
    const body=await fs.readFile(p); const mime=({'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.svg':'image/svg+xml'})[path.extname(p)]||'application/octet-stream';
    await send('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:mime},{name:'Cache-Control',value:'no-store'}],body:body.toString('base64')});
   }else if(url.hostname==='script.google.com'){
    const cb=url.searchParams.get('callback');
    const result=pending-->0?{ready:false}:{ready:true,success:mode!=='error',action:mode,message:mode==='error'?'測試錯誤':''};
    await send('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/javascript'}],body:Buffer.from(`${cb}(${JSON.stringify(result)});`).toString('base64')});
   }else await send('Fetch.continueRequest',{requestId});
  }catch(e){errors.push(String(e));await send('Fetch.fulfillRequest',{requestId,responseCode:404,body:''});}
 }
});
await send('Page.enable');await send('Runtime.enable');await send('Log.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Network.clearBrowserCache');
await send('Fetch.enable',{patterns:[{urlPattern:'http://wedding-rc.test/*'},{urlPattern:'https://script.google.com/*'}]});
await send('Page.addScriptToEvaluateOnNewDocument',{source:`try{localStorage.clear()}catch{}window.__posts=[];const nativeFetch=window.fetch;window.fetch=(url,options)=>{if(String(url).includes('script.google.com')){window.__posts.push(Object.fromEntries(options.body.entries()));return Promise.resolve({type:'opaque'});}return nativeFetch(url,options);};window.__shifts=[];new PerformanceObserver(list=>list.getEntries().forEach(e=>{if(!e.hadRecentInput)__shifts.push(e.value)})).observe({type:'layout-shift',buffered:true});`});
async function ev(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function settle(){let last=-1,stable=0;for(let n=0;n<35;n++){await sleep(80);const y=await ev('scrollY');stable=Math.abs(y-last)<1?stable+1:0;if(stable>=3)return;last=y;}}
async function until(expr){for(let n=0;n<100;n++){if(await ev(expr))return;await sleep(50);}throw Error('Timed out: '+expr);}
async function shot(name){const s=await send('Page.captureScreenshot',{format:'png'});await fs.writeFile(path.join(out,name+'.png'),Buffer.from(s.data,'base64'));}
const results=[];
try{
for(const width of ((process.argv.includes('--extra')||process.argv.includes('--online'))?[]:(process.env.QUICK_QA||process.argv.includes('--quick')?[390,1440]:(process.argv.includes('--desktop')?[1280,1440,1680]:[320,375,390,430,1280,1440,1680])))){
 for(const invite of ['full','wedding','online'])for(const language of ['zh-TW','en']){
  errors=[];requests=[];
  await send('Emulation.setDeviceMetricsOverride',{width,height:width<821?844:1000,deviceScaleFactor:1,mobile:width<821});
  await send('Page.navigate',{url:`http://wedding-rc.test/?invite=${invite}&rc=${Date.now()}`});
  await until(`!!window.WeddingI18n && !!document.querySelector('.wedding-carousel__dot')`);
  await ev(`localStorage.clear();WeddingI18n.applyLanguage(${JSON.stringify(language)});document.documentElement.style.scrollBehavior='auto'`);
  await ev('document.fonts.ready');await sleep(150);
  const initial=await ev(`({lang:document.documentElement.lang,overflow:document.documentElement.scrollWidth>innerWidth,slides:document.querySelectorAll('.wedding-carousel__slide').length,large:performance.getEntriesByType('resource').filter(x=>x.name.includes('/large/')).length,banquet:!document.querySelector('#wedding-info').hidden,seat:!document.querySelector('#seating').hidden,parking:!document.querySelector('#ceremony-parking').hidden,times:[...document.querySelectorAll('.fact-card time')].map(x=>x.textContent),inert:document.querySelector('#rsvp-panel').inert})`);
  assert.equal(initial.overflow,false);assert.equal(initial.lang,language);assert.equal(initial.slides,22);assert.equal(initial.large,0);assert.equal(initial.banquet,invite==='full');assert.equal(initial.seat,invite==='full');assert.equal(initial.parking,invite!=='online');assert.equal(initial.inert,invite!=='online');
  assert.equal(initial.times[0],language==='en'?'2:00 PM':'14:00');assert.equal(initial.times[1],language==='en'?'3:00 PM':'15:00');
  // Walk all displayed content; detect localized text omissions and overflow even inside accordions.
  await ev(`document.querySelectorAll('.info-accordion__trigger').forEach(x=>{if(!x.closest('[hidden]'))x.click()});document.querySelectorAll('.faq-list details').forEach(x=>x.open=true)`);
  await sleep(400);
  const layout=await ev(`(()=>{const visible=e=>e.getClientRects().length&&!e.closest('[hidden]');return {overflow:[...document.querySelectorAll('main *')].filter(e=>visible(e)&&!e.closest('.wedding-carousel, .hero-media')&&e.getBoundingClientRect().right>innerWidth+1).map(e=>e.id||e.className).slice(0,12),missing:[...document.querySelectorAll('img[src]')].filter(e=>e.complete&&!e.naturalWidth).map(e=>e.src),chinese:${language==='en'}?[...document.querySelectorAll('main,header,footer')].flatMap(e=>{const w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let n,a=[];while(n=w.nextNode())if(/[\u3400-\u9fff]/.test(n.textContent)&&visible(n.parentElement)&&!n.parentElement.closest('script'))a.push(n.textContent.trim());return a}).filter(x=>x!=='中文'):[]}})()`);
  assert.deepEqual(layout.overflow,[]);assert.deepEqual(layout.missing,[]);assert.deepEqual(layout.chinese,[]);
  await ev(`document.querySelector('[data-quick-nav="gallery"]').click()`);await settle();
  let state=await ev(`({y:scrollY,h:document.documentElement.scrollHeight,node:document.querySelector('.wedding-carousel__track').children.length})`);
  await ev(`document.querySelector('.wedding-carousel__arrow--next').click()`);await sleep(550);
  assert.equal(await ev('carouselActiveIndex'),1);assert.equal(await ev('document.documentElement.scrollHeight'),state.h);assert.ok(Math.abs(await ev('scrollY')-state.y)<2);
  // Language preserves inputs, accordion state and carousel identity/position.
  await ev(`document.querySelector('#rsvp-name').value='RC Tester';document.querySelector('#rsvp-phone').value='0912345678';window.__track=document.querySelector('.wedding-carousel__track');WeddingI18n.applyLanguage(${JSON.stringify(language==='en'?'zh-TW':'en')})`);
  assert.ok(Math.abs(await ev('scrollY')-state.y)<2);assert.equal(await ev('carouselActiveIndex'),1);assert.equal(await ev(`document.querySelector('.wedding-carousel__track')===__track`),true);assert.equal(await ev(`document.querySelector('#rsvp-phone').value`),'0912345678');
  await ev(`WeddingI18n.applyLanguage(${JSON.stringify(language)})`);
  await ev(`document.querySelector('.wedding-carousel__slide.is-active button').click()`);await until(`!document.querySelector('#gallery-lightbox').hidden`);
  assert.equal(await ev('currentGalleryIndex'),1);assert.equal(await ev(`getComputedStyle(document.querySelector('.lightbox-image')).objectFit`),'contain');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});await until('currentGalleryIndex===2');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await sleep(100);
  assert.equal(await ev(`document.querySelector('#gallery-lightbox').hidden`),true);assert.equal(await ev('carouselActiveIndex'),1);assert.ok(Math.abs(await ev('scrollY')-state.y)<2);assert.equal(await ev(`document.activeElement===document.querySelector('.wedding-carousel__slide.is-active button')`),true);
  await ev(`document.querySelector('.wedding-carousel__return').click()`);await sleep(550);assert.equal(await ev('carouselActiveIndex'),0);
  // Full dimensions also exercise actual form serialization against an isolated mock transport.
  await ev(`if(inviteMode!=='online')document.querySelector('#rsvp-toggle').click();document.querySelectorAll('[data-rsvp-question]:not([hidden]) input[type=radio]').forEach((e)=>{if(!document.querySelector('input[name='+e.name+']:checked')){e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}));}});document.querySelector('#rsvp-note').value='RC note';document.querySelector('#rsvp-message').value='RC message';document.querySelector('#rsvp-form').requestSubmit();document.querySelector('#rsvp-form').requestSubmit()`);
  await until(`!document.querySelector('#rsvp-success').hidden`);await settle();
  const posts=await ev('__posts');assert.equal(posts.length,1);assert.equal(posts[0].phone,'0912345678');assert.ok(posts[0].submissionId);assert.equal(posts[0].note,invite==='online'?'':'RC note');assert.equal(posts[0].message,'RC message');assert.equal(posts[0].invite,invite);
  if(invite==='online'){assert.equal(posts[0].online,'會參加');assert.equal(posts[0].people,'0');}else assert.equal(posts[0].ceremony,'現場參加');
  await ev(`document.querySelector('#back-to-top').click()`);await settle();assert.equal(await ev('scrollY'),0);
  if((width===390||width===1440)&&invite==='full'){
   await shot(`${width}-${language}-hero`);
   await ev(`document.querySelector('[data-quick-nav="banquet"]').click()`);await settle();await shot(`${width}-${language}-banquet`);
   await ev(`document.querySelector('[data-quick-nav="gallery"]').click()`);await settle();await shot(`${width}-${language}-gallery`);
  }
  assert.deepEqual(errors,[]);
  results.push({width,invite,language,status:'PASS'});console.log('PASS',width,invite,language);
 }
}
if(process.argv.includes('--online')) {
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const width of [375,390,430,1440])for(const language of ['zh-TW','en']) {
  errors=[];requests=[];mode='created';pending=0;
  await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<821});
  await send('Page.navigate',{url:`http://wedding-rc.test/?invite=online&rc=${Date.now()}`});
  await until(`!!window.WeddingI18n && !!document.querySelector('.wedding-carousel__dot')`);
  await ev(`WeddingI18n.applyLanguage('${language}')`);await ev('document.fonts.ready');await sleep(100);
  const state=await ev(`(()=>{const visible=e=>!!e.getClientRects().length&&!e.closest('[hidden]');return {title:document.querySelector('#rsvp-title').textContent,questions:[...document.querySelectorAll('[data-rsvp-question]')].filter(visible).length,fields:[...document.querySelectorAll('#rsvp-form input:not([type=hidden]),#rsvp-form textarea')].filter(visible).map(e=>e.name),sections:[...document.querySelector('main').children].filter(visible).map(e=>e.id),formOpen:!document.querySelector('#rsvp-panel').inert,emptyRows:[...document.querySelectorAll('[data-zoom-field]')].every(e=>e.hidden),joinHidden:document.querySelector('.online-meeting-button').hidden,nav:[...document.querySelectorAll('[data-quick-nav]')].filter(visible).map(e=>e.textContent),time:[...document.querySelectorAll('.online-schedule time')].map(e=>e.textContent),date:document.querySelector('#online-wedding-date').textContent,overflow:document.documentElement.scrollWidth>innerWidth,visibleRsvp:/RSVP|出席回覆|出席人數|素食|大合照/.test(document.body.innerText)}})()`);
  assert.equal(state.title,language==='en'?'Leave a Message':'留下祝福');assert.equal(state.questions,0);assert.deepEqual(state.fields,['name','phone','message']);assert.equal(state.formOpen,true);assert.equal(state.emptyRows,true);assert.equal(state.joinHidden,true);assert.equal(state.overflow,false);assert.equal(state.visibleRsvp,false);
  assert.deepEqual(state.sections,['home','quick-nav-wrapper','ceremony-info','rsvp','wedding-gallery','share']);
  assert.deepEqual(state.nav,language==='en'?['Online Ceremony','Gallery','Share']:['線上婚禮','婚紗','分享']);
  assert.deepEqual(state.time,[language==='en'?'3:00 PM':'下午 3:00']);assert.ok(state.date.includes(language==='en'?'Saturday, December 26, 2026':'2026 年 12 月 26 日'));
  // Empty, ID-only, full credentials, then no-passcode configurations.
  await ev(`Object.assign(onlineWedding,{meetingId:'123 4567 8901'});renderOnlineDetails()`);
  assert.equal(await ev(`document.querySelector('[data-zoom-field=meetingId]').hidden`),false);assert.equal(await ev(`document.querySelector('[data-zoom-field=passcode]').hidden`),true);
  await ev(`Object.assign(onlineWedding,{zoomUrl:'https://example.com/zoom-test',passcode:'001234'});renderOnlineDetails()`);
  assert.equal(await ev(`document.querySelector('.online-meeting-button').getAttribute('href')`),'https://example.com/zoom-test');
  assert.equal(await ev(`document.querySelector('[data-zoom-field=passcode]').hidden`),false);
  await ev(`document.querySelector('[data-quick-nav=ceremony]').click()`);await settle();
  assert.equal(await ev(`document.documentElement.scrollWidth>innerWidth`),false);
  assert.equal(await ev(`getComputedStyle(document.querySelector('.online-zoom-value')).whiteSpace`),'nowrap');
  await ev(`window.__copied=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{__copied.push(value)}}})`);
  await ev(`document.querySelector('[data-zoom-copy=meetingId]').click()`);await sleep(30);await ev(`document.querySelector('[data-zoom-copy=passcode]').click()`);await sleep(30);
  assert.deepEqual(await ev('__copied'),['123 4567 8901','001234']);
  // Fallback and refused clipboard remain usable and localized.
  await ev(`window.__execCopy=document.execCommand;document.execCommand=()=>false;navigator.clipboard.writeText=async()=>{throw Error('Denied')};document.querySelector('[data-zoom-copy=meetingId]').click()`);await sleep(30);
  assert.equal(await ev(`document.querySelector('#online-copy-status').dataset.messageKey`),'online.copyFailed');
  await ev(`document.execCommand=()=>{__copied.push(document.activeElement.value);return true};document.querySelector('[data-zoom-copy=meetingId]').click()`);await sleep(30);
  assert.equal(await ev(`document.querySelector('#online-copy-status').dataset.messageKey`),'online.copiedMeetingId');
  await ev(`document.execCommand=__execCopy`);
  await shot(`online-${width}-${language}-zoom`);
  await ev(`onlineWedding.passcode='';renderOnlineDetails()`);assert.equal(await ev(`document.querySelector('[data-zoom-field=passcode]').hidden`),true);
  // Required message, fixed attendance, unchanged payload keys, update and error states.
  await ev(`document.querySelector('#rsvp-name').value='Online QA';document.querySelector('#rsvp-phone').value='0912345678';document.querySelector('#rsvp-form').requestSubmit()`);
  assert.equal(await ev('__posts.length'),0);assert.equal(await ev(`document.querySelector('#rsvp-message').getAttribute('aria-invalid')`),'true');
  await ev(`document.querySelector('#rsvp-message').value='Warm wishes!';document.querySelector('#rsvp-message').dispatchEvent(new Event('input'));document.querySelector('#rsvp-form').requestSubmit();document.querySelector('#rsvp-form').requestSubmit()`);
  assert.equal(await ev(`document.querySelector('.rsvp-submit-label').textContent`),language==='en'?'Sending…':'留言送出中…');
  await until(`!document.querySelector('#rsvp-success').hidden`);await settle();
  const posts=await ev('__posts');assert.equal(posts.length,1);assert.equal(posts[0].online,'會參加');assert.equal(posts[0].ceremony,'');assert.equal(posts[0].banquet,'');assert.equal(posts[0].people,'0');assert.equal(posts[0].vegetarian,'0');assert.equal(posts[0].phone,'0912345678');assert.equal(posts[0].note,'');assert.equal(posts[0].message,'Warm wishes!');assert.ok(posts[0].submissionId);
  assert.equal(await ev(`document.querySelector('#rsvp-success-title').textContent`),language==='en'?'Thank you for your message!':'謝謝你的祝福！');
  mode='updated';await ev(`document.querySelector('#rsvp-edit').click();document.querySelector('#rsvp-message').value='Updated wishes';document.querySelector('#rsvp-form').requestSubmit()`);await until(`!document.querySelector('#rsvp-success').hidden`);await settle();
  assert.equal(await ev('__posts.length'),2);assert.equal(await ev(`document.querySelector('#rsvp-success-message').textContent`),language==='en'?'Your message has been updated.':'你的留言已更新。');
  mode='error';await ev(`document.querySelector('#rsvp-edit').click();document.querySelector('#rsvp-form').requestSubmit()`);await until(`!rsvpSubmitting && !!document.querySelector('#rsvp-submit-error').textContent`);
  assert.equal(await ev(`document.body.innerText.includes('RSVP')`),false);
  await ev(`document.querySelector('#rsvp-message').focus();window.scrollTo({top:document.querySelector('#rsvp').offsetTop-130,behavior:'auto'})`);await sleep(250);
  const y=await ev('scrollY');await ev(`WeddingI18n.applyLanguage('${language==='en'?'zh-TW':'en'}')`);await sleep(50);assert.ok(Math.abs(await ev('scrollY')-y)<2);assert.equal(await ev(`document.querySelector('#rsvp-message').value`),'Updated wishes');assert.equal(await ev(`document.querySelector('#rsvp-phone').value`),'0912345678');
  await ev(`WeddingI18n.applyLanguage('${language}')`);await shot(`online-${width}-${language}-message`);
  if(width<821){await send('Emulation.setDeviceMetricsOverride',{width,height:500,deviceScaleFactor:1,mobile:true});await sleep(100);assert.equal(await ev(`document.documentElement.scrollWidth>innerWidth`),false);assert.equal(await ev(`document.querySelector('#rsvp-panel').inert`),false);}
  assert.deepEqual(errors,[]);results.push({width,language,test:'online Zoom/message',status:'PASS'});console.log('PASS online Zoom/message',width,language);
 }
}
if(process.argv.includes('--extra')) {
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await send('Page.navigate',{url:`http://wedding-rc.test/?invite=full&rc=${Date.now()}#ceremony-info`});
 await until(`!!window.WeddingI18n && !!document.querySelector('.wedding-carousel__dot')`);await ev('document.fonts.ready');await settle();
 assert.ok(await ev('scrollY')>0);
 const log=(name)=>{results.push({test:name,status:'PASS'});console.log('PASS',name)};
 for(const key of ['ceremony','banquet','gallery','share']){
  await ev(`document.querySelector('[data-quick-nav="${key}"]').click()`);await settle();
  assert.equal(await ev(`document.querySelector('[data-quick-nav="${key}"]').getAttribute('aria-current')`),'location');
  const sticky=await ev(`({key:'${key}',y:scrollY,quick:document.querySelector('#quick-nav-wrapper').getBoundingClientRect().top,header:document.querySelector('#site-header').getBoundingClientRect().bottom})`);assert.ok(Math.abs(sticky.quick-sticky.header)<2,JSON.stringify(sticky));
 }
 log('deep link, Quick Nav sticky and scroll spy');
 await ev(`document.querySelector('#ceremony-arrival-trigger').click()`);await sleep(150);
 assert.ok(await ev(`Math.abs(Number(document.querySelector('#scroll-progress').getAttribute('aria-valuenow'))-Math.round(scrollY/(document.documentElement.scrollHeight-innerHeight)*100))<=1`));
 log('accordion updates reading progress');
 await ev(`window.scrollTo({top:document.querySelector('.share-button').getBoundingClientRect().top+scrollY-innerHeight+70,behavior:'auto'})`);await sleep(150);assert.equal(await ev(`document.querySelector('#back-to-top').classList.contains('is-visible')`),false);log('back to top stays clear of CTA');
 await ev(`document.querySelector('.menu-toggle').click()`);
 assert.equal(await ev(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')`),'true');
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});
 assert.equal(await ev(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')`),'false');
 log('mobile menu and Escape');
 await ev(`document.querySelector('[data-quick-nav="gallery"]').click()`);await settle();
 const geometry=await ev(`window.__galleryHeight=document.documentElement.scrollHeight;window.__galleryY=scrollY;({})`);
 for(let n=0;n<22;n++){
  await ev(`document.querySelectorAll('.wedding-carousel__dot')[${n}].click()`);await until(`carouselActiveIndex===${n}`);await sleep(30);
  const g=await ev(`(()=>{let e=document.querySelector('.wedding-carousel__slide.is-active'),r=e.querySelector('button').getBoundingClientRect();return {center:(r.left+r.right)/2,ratio:r.width/r.height,orientation:e.dataset.orientation,h:document.documentElement.scrollHeight,y:scrollY}})()`);
  assert.ok(Math.abs(g.center-195)<2);assert.ok(Math.abs(g.ratio-(g.orientation==='portrait'?2/3:3/2))<.02);assert.equal(g.h,await ev('__galleryHeight'));assert.ok(Math.abs(g.y-await ev('__galleryY'))<2);
 }
 await ev(`document.querySelector('.wedding-carousel__arrow--next').click()`);await until('carouselActiveIndex===0');
 await ev(`document.querySelector('.wedding-carousel__arrow--previous').click()`);await until('carouselActiveIndex===21');
 log('all photos, orientation, dots and circular previous/next');
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:270,y:600}]});
 await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:100,y:603}]});
 await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(100);
 assert.equal(await ev('carouselActiveIndex'),21);log('horizontal touch does not change carousel');
 await ev(`document.querySelector('.wedding-carousel__slide.is-active button').click()`);await until(`!document.querySelector('#gallery-lightbox').hidden`);
 assert.equal(await ev(`document.querySelector('main').inert`),true);
 assert.equal(await ev(`new Set(performance.getEntriesByType('resource').filter(x=>x.name.includes('/large/')).map(x=>x.name)).size`),3);
 assert.equal(await ev(`getComputedStyle(document.querySelector('#back-to-top')).visibility`),'hidden');
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',modifiers:8});
 assert.equal(await ev(`document.activeElement.className`),'lightbox-nav lightbox-next');
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await sleep(100);
 assert.equal(await ev(`document.querySelector('main').inert`),false);log('lightbox focus trap and inert restore');
 await send('Emulation.setDeviceMetricsOverride',{width:430,height:932,deviceScaleFactor:1,mobile:true});await sleep(150);
 assert.equal(await ev('carouselActiveIndex'),21);
 await send('Emulation.setDeviceMetricsOverride',{width:430,height:760,deviceScaleFactor:1,mobile:true});await sleep(150);
 assert.equal(await ev('carouselActiveIndex'),21);log('width and address-bar resize retain active index');
 await ev(`WeddingI18n.applyLanguage('en');document.querySelector('#rsvp-toggle').click();document.querySelector('#rsvp-name').value='RC Tester';document.querySelector('#rsvp-phone').value='0912345678';document.querySelector('input[name=ceremony]').checked=true;document.querySelector('input[name=banquet]').checked=true;updateRsvpAttendanceCounts()`);
 const submit=()=>ev(`document.querySelector('#rsvp-form').requestSubmit();document.querySelector('#rsvp-form').requestSubmit()`);
 mode='created';pending=2;await submit();await until(`!document.querySelector('#rsvp-success').hidden`);assert.equal(await ev('__posts.length'),1);log('pending JSONP then created, single POST');
 mode='updated';await ev(`document.querySelector('#rsvp-edit').click()`);await submit();await until(`document.querySelector('#rsvp-success-title').textContent.includes('Updated')`);assert.equal(await ev('__posts.length'),2);log('same name/phone updated result');
 mode='error';await ev(`document.querySelector('#rsvp-edit').click()`);await submit();await until(`!rsvpSubmitting && !!document.querySelector('#rsvp-submit-error').textContent`);assert.equal(await ev(`document.querySelector('#rsvp-form').hidden`),false);log('backend error restores form');
 await ev(`window.__nativeLocalHost=isLocalDevelopmentHost;isLocalDevelopmentHost=()=>true`);await submit();assert.equal(await ev('__posts.length'),3);assert.ok(await ev(`document.querySelector('#rsvp-submit-error').textContent.includes('Local previews')`));await ev('isLocalDevelopmentHost=__nativeLocalHost');log('local preview blocks production POST');
 pending=99;await submit();await until('rsvpSubmitting');await ev(`finishRsvpWithErrorKey('rsvp.statusTimeout')`);assert.equal(await ev('activeRsvpJsonpRequests.size'),0);assert.equal(await ev('rsvpSubmitting'),false);log('timeout cleanup and retry state');
 assert.equal(await ev(`isSeatLookupOpen(Date.parse('2026-12-19T00:00:00+08:00')-1)`),false);assert.equal(await ev(`isSeatLookupOpen(Date.parse('2026-12-19T00:00:00+08:00'))`),true);log('seat opening exact Taipei boundary');
 await ev(`window.__nativeLocalHost=isLocalDevelopmentHost;isLocalDevelopmentHost=()=>true;sessionStorage.setItem(SEAT_LOOKUP_DEV_PREVIEW_KEY,'open');initializeSeatLookupAvailability();document.querySelector('#guest-name').value='王小明';document.querySelector('#seat-search').requestSubmit()`);await until(`document.querySelector('#lookup-result').textContent.includes('A12')`);await ev(`isLocalDevelopmentHost=__nativeLocalHost`);log('unchanged sample seat lookup');
 await ev(`localStorage.setItem(RSVP_STORAGE_KEY,JSON.stringify({invite:'full',name:'RC stored'}));window.__revisit=true`);
 // Simulate the stored-return initialization directly, with the same path invoked at startup.
 await ev(`const stored=readStoredRsvp();rsvpName.value=stored.name;showRsvpSuccess(true)`);assert.equal(await ev(`document.querySelector('#rsvp-success').hidden`),false);log('stored RSVP state');
 assert.deepEqual(errors,[]);
}
await fs.writeFile(path.join(out,process.argv.includes('--online')?'results-online.json':(process.argv.includes('--extra')?'results-extra.json':'results-matrix.json')),JSON.stringify(results,null,2));
}catch(e){await shot('failure');console.error(e);console.error('Browser errors:',errors);await fs.writeFile(path.join(out,'failure.json'),JSON.stringify({error:String(e),errors,results},null,2));process.exitCode=1;}finally{ws.close();}
