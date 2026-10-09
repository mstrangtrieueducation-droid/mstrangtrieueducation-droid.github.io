import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {validateExport} from './integrity.mjs';
const fault=code=>{throw Error(code)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export async function exportProfiles({endpoint,secret},notify=()=>{}){
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)||!secret)fault('CONFIGURATION');
 const deliveryId=crypto.randomUUID(),started=Date.now();
 async function call(operation){
  const e={protocol:'fighter-static-v1',at:Date.now(),nonce:crypto.randomUUID(),body:JSON.stringify({classKey:'fighter:9',operation,deliveryId})};
  e.signature=crypto.createHmac('sha256',secret).update([e.at,e.nonce,e.body].join('\n')).digest('base64url');
  const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(e),signal:AbortSignal.timeout(operation==='export'?330000:60000)});
  let v;try{v=await r.json()}catch{fault('SOURCE_RESPONSE')}
  if(!r.ok||!v?.ok)fault(/^[A-Z][A-Z0-9_]{2,80}$/.test(v?.error)?v.error:'SOURCE_UNAVAILABLE');return v;
 }
 // A lost HTTP response does not start a second scan. Collect the same delivery.
 try{await call('export')}catch{notify('Export response unavailable; collecting the original job.');}
 let result;
 for(let i=0;i<8;i++){
  let v;try{v=await call('collect')}catch{await sleep(15000);continue}
  if(v.pending){await sleep(15000);continue}
  if(v.encoding!=='gzip-base64'||typeof v.packed!=='string'||v.packed.length>10000000||crypto.createHash('sha256').update(v.packed).digest('hex')!==v.digest)fault('DELIVERY_INTEGRITY');
  result=JSON.parse(zlib.gunzipSync(Buffer.from(v.packed,'base64')).toString('utf8'));break;
 }
 if(!result?.ok)fault(/^[A-Z][A-Z0-9_]{2,80}$/.test(result?.error)?result.error:'SOURCE_NOT_READY');
 validateExport(result,9,started);
 if(result.errors.length||!result.profiles.length||result.profiles.length!==result.manifest.length)fault('INCOMPLETE_EXPORT');
 const keys=new Set();
 for(const m of result.manifest){if(!/^[A-Za-z0-9_-]{22}$/.test(m.fileKey)||crypto.createHash('sha256').update(m.fileKey).digest('hex')!==m.tokenHash||keys.has(m.fileKey))fault('FILE_KEY_SCOPE');keys.add(m.fileKey)}
 for(const p of result.profiles){if(!keys.has(p.fileKey)||crypto.createHash('sha256').update(p.fileKey).digest('hex')!==p.tokenHash)fault('FILE_KEY_SCOPE')}
 return result;
}
export async function writeProfiles(result,root){
 const dir=path.join(root,'p8w8wz4f','data');await fs.mkdir(dir,{recursive:true});
 const active=new Set(result.profiles.map(p=>p.fileKey+'.json'));
 // Revocation is authoritative only after a complete, fenced roster export.
 for(const name of await fs.readdir(dir)){
  if(!/^[A-Za-z0-9_-]{22}\.json$/.test(name))fault('UNEXPECTED_DATA_FILE');
  if(!active.has(name))await fs.writeFile(path.join(dir,name),JSON.stringify({schema:1,className:'FIGHTER 9',revoked:true}));
 }
 for(const p of result.profiles)await fs.writeFile(path.join(dir,p.fileKey+'.json'),JSON.stringify(p.snapshot));
 return {profiles:result.profiles.length,capturedAt:result.capturedAt,sourceReads:result.sourceReads};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const result=await exportProfiles({endpoint:process.env.FIGHTER9_SOURCE_URL,secret:process.env.FIGHTER9_EXPORT_SECRET},console.log);console.log(JSON.stringify(await writeProfiles(result,process.cwd())))}
 catch(e){console.error(/^[A-Z][A-Z0-9_]{2,80}$/.test(e.message)?e.message:'STATIC_SYNC_FAILED');process.exitCode=1}
}
