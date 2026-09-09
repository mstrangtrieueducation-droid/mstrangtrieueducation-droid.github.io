const fs=require('fs'),assert=require('assert/strict'),{createHash}=require('crypto');
const {chromium}=require('playwright'),{runtime,option}=require('./test-paths.cjs');
const source=fs.readFileSync(runtime('fullTest'),'utf8'),prefix='ielts-full-durable:v1:';
const p={attemptId:'qa-concurrent-attempt',requestId:'qa-concurrent-attempt:READING',testNumber:1,studentName:'SYNTHETIC QA STUDENT',studentClass:'QA CLASS',module:'READING',score:12,maxScore:40,answerSummary:JSON.stringify([{question:1,answer:'synthetic',correct:'synthetic',isCorrect:true}])};
const c={draftKey:'qa-draft',draft:{attemptId:p.attemptId,name:p.studentName,studentClass:p.studentClass,reading:{1:'synthetic'},results:{}},result:{score:p.score,maxScore:40,review:[{id:1,answer:'synthetic',correct:'synthetic',isCorrect:true}]}};
const receipt={ok:true,attemptId:p.attemptId,requestId:p.requestId,module:p.module,score:p.score,maxScore:p.maxScore,moduleConfirmed:true,row:2,payloadFingerprint:createHash('sha256').update([p.module,String(p.score),String(p.maxScore),p.answerSummary].join('\n')).digest('hex')};
async function pageFor(context,init){const page=await context.newPage();if(init)await page.addInitScript(init);await page.goto('https://durability-test.example/');await page.addScriptTag({content:source});return page;}
async function dbRecord(page){return page.evaluate(()=>new Promise((resolve,reject)=>{const open=indexedDB.open('ielts-full-durable-v1',1);open.onsuccess=()=>{const tx=open.result.transaction('records','readonly'),get=tx.objectStore('records').get('submission:qa-concurrent-attempt:READING');get.onsuccess=()=>resolve(get.result);get.onerror=()=>reject(get.error);};open.onerror=()=>reject(open.error);}));}
(async()=>{
 const browser=await chromium.launch({headless:true}),results=[];
 try{
  for(const storageMode of ['all','idbOnly','localOnly']){
    const context=await browser.newContext();await context.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Durability test</title>'}));
    const init=storageMode==='idbOnly'?()=>{for(const name of ['getItem','setItem','removeItem'])Storage.prototype[name]=()=>{throw Error('Storage denied');};}:storageMode==='localOnly'?()=>{Object.defineProperty(window,'indexedDB',{value:{open(){throw Error('IndexedDB denied');}}});}:null;
    const first=await pageFor(context,init);await first.evaluate(({p,c})=>{window.testResult=null;window.testCalls=0;IELTSFullDurable.register(()=>{window.testCalls++;return new Promise((resolve,reject)=>{window.failLate=()=>reject(Error('Healthy server reply arrived too late'));});});void IELTSFullDurable.submit(p,c).then(result=>window.testResult={ok:true,result},error=>window.testResult={ok:false,error:error.message});},{p,c});
    await first.waitForFunction(()=>window.testCalls===1);
    const second=await pageFor(context,init);await second.evaluate(async receipt=>{IELTSFullDurable.register(async()=>receipt);await IELTSFullDurable.resume();},receipt);
    if(storageMode!=='localOnly')assert.equal((await dbRecord(second)).status,'saved');
    await first.evaluate(()=>window.failLate());await first.waitForFunction(()=>window.testResult!==null);assert.equal(await first.evaluate(()=>window.testResult.ok),true,'late failure must resolve to already saved result');
    const durable=storageMode==='localOnly'?await first.evaluate(key=>JSON.parse(localStorage.getItem(key)),prefix+'submission:'+p.attemptId+':READING'):await dbRecord(first);assert.equal(durable.status,'saved');assert.deepEqual(durable.payload,p);assert.equal(durable.receipt.payloadFingerprint,receipt.payloadFingerprint);
    if(storageMode!=='idbOnly')assert.equal(await first.evaluate(key=>JSON.parse(localStorage.getItem(key)).status,prefix+'submission:'+p.attemptId+':READING'),'saved');
    results.push(`healthy concurrent tabs retain saved receipt after late failure (${storageMode})`);await context.close();
  }
  for(const corruption of ['score','fingerprint']){
    const context=await browser.newContext();await context.route('**/*',route=>route.fulfill({body:'<!doctype html><title>Corrupt cache test</title>'}));const seed=await context.newPage();await seed.goto('https://durability-test.example/');
    const record={key:'submission:'+p.attemptId+':READING',kind:'submission',status:'saved',payload:p,result:c.result,draft:c.draft,draftKey:c.draftKey,createdAt:1,receipt:{...receipt,[corruption==='score'?'score':'payloadFingerprint']:corruption==='score'?999:'corrupt'}};
    await seed.evaluate(async record=>{localStorage.setItem('ielts-full-durable:v1:'+record.key,JSON.stringify(record));await new Promise((resolve,reject)=>{const open=indexedDB.open('ielts-full-durable-v1',1);open.onupgradeneeded=()=>open.result.createObjectStore('records');open.onsuccess=()=>{const tx=open.result.transaction('records','readwrite');tx.objectStore('records').put(record,record.key);tx.oncomplete=()=>{open.result.close();resolve();};tx.onerror=()=>reject(tx.error);};});},record);await seed.close();
    const page=await pageFor(context);await page.evaluate(async receipt=>{window.calls=0;IELTSFullDurable.register(async()=>{window.calls++;return receipt;});await IELTSFullDurable.resume();},receipt);assert.equal(await page.evaluate(()=>window.calls),1);assert.equal((await dbRecord(page)).status,'saved');assert.equal((await dbRecord(page)).receipt.payloadFingerprint,receipt.payloadFingerprint);results.push(`corrupt cached saved ${corruption} resumes exact original payload`);await context.close();
  }
  for(const kind of ['open','transaction']){
    const context=await browser.newContext();await context.route('**/*',route=>route.fulfill({body:'<!doctype html><title>Blocked storage test</title>'}));const page=await context.newPage();
    await page.addInitScript(kind=>{
      const nativeSetTimeout=window.setTimeout.bind(window);window.storageDeadlines=0;window.setTimeout=(fn,ms,...args)=>{if(ms===2500){window.storageDeadlines++;return nativeSetTimeout(fn,25,...args);}return nativeSetTimeout(fn,ms,...args);};
      if(kind==='open')Object.defineProperty(window,'indexedDB',{value:{open:()=>({})}});
      else Object.defineProperty(window,'indexedDB',{value:{open:()=>{const req={result:{transaction:()=>({objectStore:()=>({getAll:()=>({}),get:()=>({}),put:()=>({})}),abort(){}}),close(){}}};nativeSetTimeout(()=>req.onsuccess?.(),0);return req;}}});
    },kind);
    await page.goto('https://durability-test.example/');await page.addScriptTag({content:source});const result=await page.evaluate(async({p,c,receipt})=>{IELTSFullDurable.register(async()=>receipt);await IELTSFullDurable.readDraft('qa-draft');return await IELTSFullDurable.submit(p,c);},{p,c,receipt});assert.equal(result.score,p.score);assert((await page.evaluate(()=>window.storageDeadlines))>0);results.push(`hung IndexedDB ${kind} is bounded and healthy submission still succeeds`);await context.close();
  }
  {
    const context=await browser.newContext();await context.route('**/*',route=>route.fulfill({body:'<!doctype html><title>Unavailable persistence test</title>'}));
    const page=await pageFor(context,()=>{for(const name of ['getItem','setItem','removeItem'])Storage.prototype[name]=()=>{throw Error('Storage denied');};Object.defineProperty(window,'indexedDB',{value:{open(){throw Error('IndexedDB denied');}}});});
    await page.evaluate(({p,c,receipt})=>{IELTSFullDurable.register(()=>new Promise(resolve=>{window.completeSubmission=()=>resolve(receipt);}));void IELTSFullDurable.submit(p,c);},{p,c,receipt});
    await page.getByRole('status').filter({hasText:'chưa lưu được bản dự phòng'}).waitFor();await page.evaluate(()=>window.completeSubmission());await page.locator('#ielts-full-storage-status').waitFor({state:'detached'});results.push('confirmed unavailable persistence shows keep-page-open status only while pending');await context.close();
  }
  const output=option('--output');if(output)fs.writeFileSync(output,JSON.stringify({passed:true,tests:results},null,2));console.log('PASS '+results.length+' cross-tab and bounded-storage scenarios');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
