import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {exportClass} from './export-data.mjs';
import {publishFiles} from './git-publish.mjs';
const routes=JSON.parse(process.env.IELTS_STATIC_ROUTES||'null');if(!routes)throw Error('STATIC_CONFIG_MISSING');
const base='https://api.github.com/repos/'+process.env.GITHUB_REPOSITORY,token=process.env.GITHUB_TOKEN;
async function api(tail,body,method=body?'POST':'GET'){const r=await fetch(base+tail,{method,headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('GITHUB_HTTP_'+r.status);return r.status===204?null:r.json();}
const baseHead=(await api('/git/ref/heads/main')).object.sha,tree=await api('/git/trees/'+baseHead+'?recursive=1');if(tree.truncated)throw Error('TREE_TRUNCATED');
const existing=new Set(tree.tree.filter(f=>f.type==='blob').map(f=>f.path)),folder=fs.mkdtempSync(path.join(os.tmpdir(),'ielts-static-')),results=[],failed=[];
// Four independent class captures stay below the Apps Script user concurrency limit.
const configs=Object.values(routes);for(let i=0;i<configs.length;i+=4){const batch=await Promise.allSettled(configs.slice(i,i+4).map(c=>exportClass(c,folder,null,existing)));batch.forEach((r,j)=>{if(r.status==='fulfilled'){results.push(r.value);console.log(JSON.stringify({class:r.value.className,profiles:r.value.profiles,files:r.value.files.length}));}else{failed.push(configs[i+j].className);console.error('CAPTURE_FAILED '+configs[i+j].className+' '+String(r.reason?.message||'ERROR').replace(/[^A-Z_0-9]/g,'_').slice(0,80));}});}
if(!results.length)throw Error('NO_COMPLETE_CLASSES');
// A single Git push avoids hundreds of content-creation API calls per refresh.
console.log('PUBLISHED '+publishFiles(folder,results,routes,existing));
// GITHUB_TOKEN pushes do not implicitly rebuild Pages: request it explicitly.
await api('/pages/builds',{});
if(failed.length)throw Error('SOME_CLASSES_RETAINED_PREVIOUS_DATA');
