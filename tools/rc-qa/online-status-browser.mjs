// Read-only browser JSONP verification for an existing live-test evidence file. Never POSTs.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const evidencePath = process.argv[2];
if (!evidencePath) throw Error('Pass the existing live-test evidence JSON path. No submissions are created.');
const evidence = JSON.parse(await fs.readFile(evidencePath, 'utf8'));
const endpoint = evidence.endpoint;
assert.match(endpoint, /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/);
const base = 'http://127.0.0.1:9225';
const version = await (await fetch(base + '/json/version')).json();
async function connect(url) {
 const ws = new WebSocket(url), pending = new Map();let seq = 0;
 await new Promise(resolve => ws.addEventListener('open', resolve, {once:true}));
 ws.addEventListener('message', event => {const data=JSON.parse(event.data);if(data.id){const p=pending.get(data.id);pending.delete(data.id);data.error?p.reject(data.error):p.resolve(data.result);}});
 return {ws,send:(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));})};
}
const browser = await connect(version.webSocketDebuggerUrl);
const {targetId}=await browser.send('Target.createTarget',{url:'about:blank'});
const targets=await (await fetch(base+'/json/list')).json();
const page=await connect(targets.find(x=>x.id===targetId).webSocketDebuggerUrl);
const result={checkedAt:new Date().toISOString(),errors:[],responses:[],networkFailures:[],statusChecks:[]};
const requestUrls=new Map();
try {
 page.ws.addEventListener('message',event=>{
  const m=JSON.parse(event.data);
  if(m.method==='Runtime.exceptionThrown')result.errors.push(m.params.exceptionDetails.text);
  if(m.method==='Log.entryAdded'&&m.params.entry.level==='error')result.errors.push(m.params.entry.text);
  if(m.method==='Network.requestWillBeSent')requestUrls.set(m.params.requestId,m.params.request.url);
  if(m.method==='Network.loadingFailed')result.networkFailures.push({url:requestUrls.get(m.params.requestId),error:m.params.errorText});
  if(m.method==='Network.responseReceived')result.responses.push({url:m.params.response.url,status:m.params.response.status});
  if(m.method==='Fetch.requestPaused')void page.send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/html'}],body:Buffer.from('<!doctype html><html lang="zh-TW"><title>Local read-only Online status probe</title><link rel="icon" href="data:,"><body>Read-only JSONP status verification</body></html>').toString('base64')});
 });
 for(const method of ['Page.enable','Runtime.enable','Log.enable','Network.enable'])await page.send(method);
 await page.send('Fetch.enable',{patterns:[{urlPattern:'http://localhost:8765/online-status-probe'}]});
 await page.send('Page.navigate',{url:'http://localhost:8765/online-status-probe'});
 await new Promise(resolve=>setTimeout(resolve,300));
 for(const id of [...new Set(evidence.plannedRequests.map(x=>x.submissionId))]) {
  const url=new URL(endpoint);url.search=new URLSearchParams({action:'status',id,callback:'onlineStatusProbe',_:String(Date.now())});
  const expression=`new Promise(resolve=>{const script=document.createElement('script');let timer;const finish=result=>{clearTimeout(timer);script.remove();delete window.onlineStatusProbe;resolve(result)};window.onlineStatusProbe=value=>finish({value});script.onerror=()=>finish({error:'JSONP network error'});timer=setTimeout(()=>finish({error:'JSONP timeout'}),20000);script.src=${JSON.stringify(String(url))};document.head.append(script)})`;
  const value=await page.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  result.statusChecks.push({id,result:value.result?.value,exception:value.exceptionDetails});
 }
 result.transportPassed=result.errors.length===0&&result.networkFailures.length===0&&result.statusChecks.every(x=>typeof x.result?.value?.ready==='boolean');
 result.cachedSuccessAvailable=result.statusChecks.every(x=>x.result?.value?.ready===true&&x.result.value.success===true&&x.result.value.action==='created');
 console.log(JSON.stringify(result,null,2));
 await fs.writeFile(evidencePath.replace(/\.json$/,'.browser.json'),JSON.stringify(result,null,2));
 if(!result.transportPassed)process.exitCode=1;
} finally {
 await browser.send('Target.closeTarget',{targetId});page.ws.close();browser.ws.close();
}
