const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{webcrypto,createHash}=require('crypto');
const {runtime,option}=require('./test-paths.cjs');
const only=option('--only','all');
const fullSource=only==='fighter'?null:fs.readFileSync(runtime('fullTest'),'utf8'),fighterSource=only==='fullTest'?null:fs.readFileSync(runtime('fighter'),'utf8');
function storage(){const values={};return new Proxy({getItem:key=>values[key]??null,setItem:(key,value)=>{values[key]=value;},removeItem:key=>delete values[key]}, {ownKeys:()=>Object.keys(values),getOwnPropertyDescriptor:()=>({configurable:true,enumerable:true})});}
function environment(local=storage(),session=storage()){
  const events={},timers=[];const window={crypto:webcrypto,localStorage:local,sessionStorage:session,navigator:{onLine:true},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout:()=>{},addEventListener:(name,fn)=>{events[name]=fn;}};
  const ctx=vm.createContext({window,console,Promise,Map,Set,Date,Error,Number,JSON,TextEncoder,crypto:webcrypto});return{window,ctx,events,timers};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function payload(){return{attemptId:'attempt-a',requestId:'attempt-a:READING',testNumber:1,studentName:'STUDENT A',studentClass:'IELTS 53',module:'READING',score:12,maxScore:40,answerSummary:'ORIGINAL ANSWERS'};}
function context(p=payload()){return{draftKey:'ielts-full-test-01-v4',draft:{attemptId:p.attemptId,name:p.studentName,studentClass:p.studentClass,reading:{1:'ORIGINAL ANSWER'},results:{}},result:{score:p.score,maxScore:40,review:[{id:1,answer:'ORIGINAL ANSWER'}]}};}
function receipt(p){return{ok:true,attemptId:p.attemptId,requestId:p.requestId,module:p.module,score:p.score,maxScore:p.maxScore,moduleConfirmed:true,row:2,payloadFingerprint:createHash('sha256').update([p.module,String(p.score),String(p.maxScore),p.answerSummary].join('\n')).digest('hex')};}
(async()=>{
  const results=[];
  const denied=new Proxy({}, {get(){throw Error('SecurityError');},ownKeys(){throw Error('SecurityError');}});
  if(fullSource){
  const local=storage(),session=storage(),env=environment(local,session);vm.runInContext(fullSource,env.ctx);
  let good=false,calls=[];env.window.IELTSFullDurable.register(async p=>{calls.push(p);if(!good)throw Error('Sheet confirmation delayed');return receipt(p);});
  await tick();assert.equal(calls.length,0,'ordinary open must not submit');
  const original=payload(),view=context(original);await assert.rejects(env.window.IELTSFullDurable.submit(original,view));
  original.studentName='STUDENT B';original.score=39;original.answerSummary='CHANGED';view.result.review[0].answer='CHANGED';
  good=true;const saved=await env.window.IELTSFullDurable.submit(original,view);
  assert.equal(saved.score,12);assert.equal(saved.review[0].answer,'ORIGINAL ANSWER');assert.equal(calls.at(-1).studentName,'STUDENT A');assert.equal(calls.at(-1).answerSummary,'ORIGINAL ANSWERS');results.push('normal-network delayed confirmation freezes payload, identity and displayed result');
  const local2=storage(),session2=storage(),before=environment(local2,session2);vm.runInContext(fullSource,before.ctx);before.window.IELTSFullDurable.register(async()=>{throw Error('Sheet busy');});await tick();await assert.rejects(before.window.IELTSFullDurable.submit(payload(),context()));
  const after=environment(local2,storage());vm.runInContext(fullSource,after.ctx);let recovered=[];after.window.IELTSFullDurable.register(async p=>{recovered.push(p);return receipt(p);});await after.window.IELTSFullDurable.resume();assert.equal(recovered.length,1);const draft=await after.window.IELTSFullDurable.readDraft('ielts-full-test-01-v4');assert.equal(draft.reading[1],'ORIGINAL ANSWER');assert.equal(draft.results.READING.score,12);results.push('close/reopen recovers explicit pending submission and confirmed result without another click');
  const fallback=storage();const blocked=environment(denied,fallback);vm.runInContext(fullSource,blocked.ctx);blocked.window.IELTSFullDurable.register(async p=>receipt(p));await tick();blocked.window.IELTSFullDurable.writeDraft('draft',{name:'Student A'});assert.equal((await blocked.window.IELTSFullDurable.readDraft('draft')).name,'Student A');assert.equal((await blocked.window.IELTSFullDurable.submit(payload(),context())).score,12);results.push('localStorage denial uses sessionStorage without crash');
  const both=environment(denied,denied);vm.runInContext(fullSource,both.ctx);both.window.IELTSFullDurable.register(async p=>receipt(p));await tick();assert.equal((await both.window.IELTSFullDurable.submit(payload(),context())).score,12);results.push('all browser storage denied still submits and verifies in-memory without crashing');
  }
  if(fighterSource){
  const fight=environment(denied,storage());vm.runInContext(fighterSource,fight.ctx);let resolveSend,seen=[],subscribers=[];fight.window.IELTSSubmission={send:p=>{seen.push(p);return new Promise(resolve=>{resolveSend=resolve;});},subscribe:fn=>{subscribers.push(fn);return()=>{};},lookup:async()=>null};
  const make=()=>({submissionId:'fighter-a',values:['original'],paraChoices:[0],scores:{listening:1,paraphrase:2},receipt:false,payload:{submissionId:'fighter-a',fields:{name:'Student A',answer:'A'}}});
  let factories=0;const [rec1,rec2]=await Promise.all([fight.window.IELTSFighterDurable.prepare('fighter-key',()=>{factories++;return make();}),fight.window.IELTSFighterDurable.prepare('fighter-key',()=>{factories++;return make();})]);assert.equal(factories,1);assert.equal(rec1.submissionId,rec2.submissionId);
  let confirmed;fight.window.IELTSFighterDurable.subscribe('fighter-key',value=>{confirmed=value;});const p1=fight.window.IELTSFighterDurable.send('fighter-key',rec1),p2=fight.window.IELTSFighterDurable.send('fighter-key',rec2);await tick();assert.equal(seen.length,1);rec1.payload.fields.name='Student B';assert.equal(seen[0].fields.name,'Student A');
  const fighterReceipt={persisted:true,submitted:true,submissionId:'fighter-a',score:3,total:35};resolveSend(fighterReceipt);await Promise.all([p1,p2]);await subscribers[0]({status:'confirmed',submissionId:'fighter-a',result:fighterReceipt});await tick();assert(confirmed.receipt);results.push('Fighter simultaneous submit dedupes; payload copy and background receipt remain bound to original identity');
  }
  const output=option('--output');if(output)fs.writeFileSync(output,JSON.stringify({passed:true,tests:results},null,2));console.log('PASS '+results.length+' durability scenarios');
})().catch(error=>{console.error(error);process.exitCode=1;});
