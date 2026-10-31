// Retired 2026-10-31: IELTS 48 uses the shared .github/ielts-ui exporters, which seal pupil data (IELTS_SEALED_V1).
// This script wrote plaintext pupil data to the public repo; do not re-enable it.
throw Error('RETIRED_USE_IELTS_UI_EXPORTERS');
import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const paths=execFileSync('git',['status','--porcelain','--untracked-files=all','--','e73wgva4/data/writing'],{encoding:'utf8'}).split('\n').filter(Boolean).map(line=>line.slice(3)).filter(p=>!p.endsWith('export-report.json'));
if(!paths.length){console.log('Prepared Writing unchanged');process.exit(0);}
const api='https://api.github.com/repos/'+process.env.GITHUB_REPOSITORY,headers={Authorization:'Bearer '+process.env.GITHUB_TOKEN,'Content-Type':'application/json'};
if(process.env.GITHUB_REPOSITORY!=='mstrangtrieueducation-droid/mstrangtrieueducation-droid.github.io')throw Error('WRONG_REPOSITORY');
async function request(tail,body,method){const r=await fetch(api+tail,{method:method||(body?'POST':'GET'),headers,body:body?JSON.stringify(body):undefined});if(!r.ok)throw Error('PUBLICATION_HTTP_'+r.status);return r.json();}
const head=(await request('/git/ref/heads/main')).object.sha,c=await request('/git/commits/'+head),tree=[];
for(const p of paths){if(!/^e73wgva4\/data\/writing\/(?:[a-f0-9]{64}|asset-[a-f0-9]{64})\.json$/.test(p))throw Error('PUBLICATION_PATH');const data=fs.readFileSync(p),b=await request('/git/blobs',{content:data.toString('base64'),encoding:'base64'});tree.push({path:p,mode:'100644',type:'blob',sha:b.sha});}
const t=await request('/git/trees',{base_tree:c.tree.sha,tree});if((await request('/git/ref/heads/main')).object.sha!==head)throw Error('CONCURRENT_CHANGE');const n=await request('/git/commits',{message:'Refresh IELTS 48 prepared Writing reviews',tree:t.sha,parents:[head]});await request('/git/refs/heads/main',{sha:n.sha,force:false},'PATCH');await request('/pages/builds',{},'POST');console.log(JSON.stringify({published:paths.length,pagesBuildRequested:true}));
