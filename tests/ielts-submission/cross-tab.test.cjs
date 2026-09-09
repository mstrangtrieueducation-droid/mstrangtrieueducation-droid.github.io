const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const sourcePath=path.resolve(__dirname,'../../ielts-nghe/submission-client.1608db39982c.js'),client=fs.readFileSync(sourcePath,'utf8');
const payload={source:'ielts-listening-submit',version:1,action:'submitListening',submissionId:'cross-tab-receipt-123456789',student:{name:'QA Test',className:'IELTS 53'},week:'Tuần 01',scores:[12,4,13,5]};
const denyLocal=process.env.DENY_LOCAL==='1';
async function waitConfirmed(page,id){const until=Date.now()+5000;while(Date.now()<until){const r=await page.evaluate(id=>IELTSSubmission.lookup(id),id);if(r?.status==='confirmed')return r;await page.waitForTimeout(25);}throw Error('Timed out waiting for confirmed record');}
(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext();
  const errors=[];let releaseA,markASeen;
  const responseGate=new Promise(resolve=>{releaseA=resolve;});
  const aSeen=new Promise(resolve=>{markASeen=resolve;});
  await context.addInitScript(denyLocal=>{const original=setTimeout;window.setTimeout=(fn,ms,...args)=>original(fn,ms>=700&&ms<2000?5:ms,...args);if(denyLocal)Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage blocked','SecurityError');}});},denyLocal);
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='script.google.com'){
      const raw=JSON.parse(new URLSearchParams(route.request().postData()).get('payload'));
      const isA=new URL(route.request().frame().url()).searchParams.get('tab')==='a';
      if(isA){markASeen();await responseGate;}
      const result=isA?{ok:false,error:{code:'ATTEMPT_BUSY',message:'Busy server'}}:{ok:true,data:{submitted:true,persisted:true,submissionId:raw.submissionId,score:34,total:60}};
      await route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({...result,requestId:raw.requestId,nonce:raw.nonce})});return;
    }
    if(url.pathname==='/client.js')return route.fulfill({contentType:'application/javascript',body:client});
    return route.fulfill({contentType:'text/html',body:'<!doctype html><body><script src="/client.js"></script>'});
  });
  try {
    const a=await context.newPage(),b=await context.newPage();
    for(const page of [a,b])page.on('pageerror',e=>errors.push(e.message));
    await a.goto('https://cross-tab.example/?tab=a');await b.goto('https://cross-tab.example/?tab=b');
    await a.evaluate(()=>IELTSSubmission.ready);await b.evaluate(()=>IELTSSubmission.ready);
    await a.evaluate(p=>{window.outcome='waiting';IELTSSubmission.send(p).then(()=>outcome='resolved',e=>outcome=e.code);},payload);
    await aSeen;
    await b.evaluate(p=>IELTSSubmission.send(p),payload);
    await waitConfirmed(b,payload.submissionId);
    if(!denyLocal)await waitConfirmed(a,payload.submissionId);
    releaseA();
    await a.waitForFunction(()=>outcome!=='waiting');
    const result=await a.evaluate(async({id,denyLocal})=>{
      let stored;
      if(denyLocal)stored=await new Promise((resolve,reject)=>{const open=indexedDB.open('mtt-confirmed-submissions',1);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const db=open.result,get=db.transaction('attempts','readonly').objectStore('attempts').get(id);get.onsuccess=()=>{resolve(get.result.status);db.close();};get.onerror=()=>reject(get.error);};});
      else stored=JSON.parse(localStorage.getItem('mtt-submission-v2:'+id)).status;
      return {outcome,status:(await IELTSSubmission.lookup(id)).status,stored};
    },{id:payload.submissionId,denyLocal});
    const proof={sourcePath,denyLocal,result,errors};fs.writeFileSync(path.join(__dirname,denyLocal?'client-cross-tab-idb-result.json':'client-cross-tab-result.json'),JSON.stringify(proof,null,2));
    console.log(JSON.stringify(proof));
    assert.equal(result.status,'confirmed','An already received confirmation must never regress after another tab gets ATTEMPT_BUSY');
    assert.equal(result.stored,'confirmed','Durable confirmation must remain monotonic');
    assert.equal(result.outcome,'resolved','The waiting caller should receive the matching receipt already observed from another tab');
  } finally {releaseA();await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
