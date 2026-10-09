import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import zlib from 'node:zlib';import {fileURLToPath} from 'node:url';
const P=path.dirname(fileURLToPath(import.meta.url));
export const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
export async function source(config,operation,extras={}){
 const id=crypto.randomUUID();
 async function call(op){const at=Date.now(),nonce=crypto.randomUUID(),body=JSON.stringify({className:config.className,id,operation:op,...extras}),signature=crypto.createHmac('sha256',config.secret).update([at,nonce,body].join('\n')).digest('base64url');
  const r=await fetch(config.endpoint,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({protocol:'ielts-github-static-v1',at,nonce,body,signature}),signal:AbortSignal.timeout(op==='collect'?60000:240000)});
  if(!r.ok)throw Error('GOOGLE_HTTP_'+r.status);const value=await r.json();if(!value.ok)throw Error(value.error||'STATIC_SOURCE_UNAVAILABLE');return value;
 }
 try{await call(operation)}catch(e){if(!/GOOGLE_HTTP_(404|429|5\d\d)|fetch failed|abort|timeout/i.test(e.message))throw e;}
 for(let i=0;i<20;i++){
  let result;try{result=await call('collect')}catch(e){if(i>=19)throw e;await pause(10000);continue;}
  if(result.pending){await pause(10000);continue;}
  if(result.encoding!=='gzip-base64'||digest(result.packed)!==result.digest)throw Error('STATIC_INTEGRITY');
  const value=JSON.parse(zlib.gunzipSync(Buffer.from(result.packed,'base64')).toString('utf8'));if(!value.ok)throw Error(value.error||'STATIC_SOURCE_UNAVAILABLE');return value;
 }
 throw Error('STATIC_DELIVERY_TIMEOUT');
}
export function validate(result,config){
 if(!result.ok||result.className!==config.className||result.errors?.length||!result.profiles?.length)throw Error('CLASS_INCOMPLETE');
 const seen=new Set();for(const p of result.profiles){const s=p.snapshot,b=s?.actions?.bootstrap,r=s?.actions?.submissions;
  if(!/^[A-Za-z0-9_-]{22}$/.test(p.fileKey)||digest(p.fileKey)!==p.tokenHash||s.staticTokenHash!==p.tokenHash||seen.has(p.fileKey))throw Error('LINK_SCOPE');seen.add(p.fileKey);
  if(s.className!==config.className||b?.name!==s.name||b?.profile?.student?.name!==s.name||b?.dashboard?.className!==config.className||!s.rosterRevision||Date.now()-Date.parse(s.capturedAt)>1200000)throw Error('PROFILE_SCOPE');
  const complete=x=>x?.complete===true&&x.freshRead===true&&Number(x.verifiedAt)>0;
  if(!Array.isArray(r?.receipts)||!r.coverage?.length||!complete(r.submissionVerification)||!r.coverage.every(complete)||!complete(r.assignmentAuthority))throw Error('RECEIPTS_INCOMPLETE');
  for(const x of [b.dashboard,b.profile,r])if(x.parentName!==s.name||x.parentRosterRevision!==s.rosterRevision)throw Error('PROFILE_IDENTITY');
 }
}
export async function exportClass(config,out,referenceFile,existingFiles=new Set(),verifiedCapture=null){
 let result=verifiedCapture;if(!result)for(let attempt=0;attempt<2;attempt++){try{result=await source(config,'export');break;}catch(e){if(attempt||!/BUSY|STATIC_CAPTURE_INCOMPLETE/.test(e.message))throw e;await pause(20000);}}validate(result,config);
 if(referenceFile){fs.mkdirSync(path.dirname(referenceFile),{recursive:true});fs.writeFileSync(referenceFile,JSON.stringify(result));}
 const files=new Map(),retained=[];
 const tasks=result.profiles.flatMap(p=>(p.snapshot.staticDetails||[]).map(entry=>({p,entry})));let cursor=0;
 async function detailWorker(){while(cursor<tasks.length){const {p,entry}=tasks[cursor++];
   const key=digest(JSON.stringify([p.tokenHash,entry.action,entry.selector,entry.version])),relative=config.route+'/data/'+p.fileKey+'/'+key+'.json',existing=path.join(out,relative);
   if(existingFiles.has(relative)){retained.push(relative);entry.path='data/'+p.fileKey+'/'+key+'.json';continue;}
   let value;if(fs.existsSync(existing))value=JSON.parse(fs.readFileSync(existing));else {
    for(let attempt=0;attempt<3;attempt++){
     try{value=(await source(config,'detail',{token:p.fileKey,action:entry.action,selector:entry.selector})).value;break;}
     catch(e){if(attempt===2||!/STATIC_SOURCE_UNAVAILABLE|BUSY|GOOGLE_HTTP_|DELIVERY_TIMEOUT|fetch failed|timeout/i.test(e.message)){
      if(referenceFile)fs.writeFileSync(path.join(path.dirname(referenceFile),'failed-detail.json'),JSON.stringify({token:p.fileKey,action:entry.action,selector:entry.selector,version:entry.version,code:e.message}));
      throw e;
     }await pause(5000*(attempt+1));}
    }
   }
   if(value.className!==config.className||value.studentName!==p.snapshot.name||entry.action.startsWith('classwork_')&&value.hash!==entry.version||entry.action.startsWith('writing_assessment')&&value.payloadSha256!==entry.version)throw Error('DETAIL_SCOPE');
   const encoded=JSON.stringify(value);files.set(relative,encoded);fs.mkdirSync(path.dirname(existing),{recursive:true});fs.writeFileSync(existing,encoded);entry.path='data/'+p.fileKey+'/'+key+'.json';
  }}
 await Promise.all([detailWorker(),detailWorker(),detailWorker()]);
 for(const p of result.profiles)files.set(config.route+'/data/'+p.fileKey+'.json',JSON.stringify(p.snapshot));
 // Write only after the entire class, receipts and selected reviews are verified.
 for(const [relative,data]of files){const file=path.join(out,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,data);}
 return {className:config.className,profiles:result.profiles.length,files:[...files.keys(),...retained],written:[...files.keys()],bytes:[...files.values()].reduce((n,s)=>n+Buffer.byteLength(s),0),sourceMs:result.elapsedMs};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const routes=JSON.parse(process.env.IELTS_STATIC_ROUTES||fs.readFileSync(P+'/private/static-routes.json')),out=process.env.STATIC_OUTPUT||P+'/public-candidate',numbers=process.argv.slice(2).length?process.argv.slice(2):Object.keys(routes),reports=[];
 for(const number of numbers){console.log({starting:'IELTS '+number});const report=await exportClass(routes[number],out,process.env.CI?null:P+'/private/'+number+'/export.json');reports.push(report);console.log({className:report.className,profiles:report.profiles,files:report.files.length,bytes:report.bytes,sourceMs:report.sourceMs});fs.writeFileSync(P+'/private/'+number+'/export-report.json',JSON.stringify(report));}
 fs.writeFileSync(P+'/export-report.json',JSON.stringify({at:new Date().toISOString(),reports},null,2));
}
