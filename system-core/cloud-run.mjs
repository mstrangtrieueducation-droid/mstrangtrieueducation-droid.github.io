// Server maintenance only. Uses the approved native readers and projections.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import{createDecipheriv,createHash}from'node:crypto';import{gunzipSync}from'node:zlib';import{spawn}from'node:child_process';
const required=k=>{const v=process.env[k];if(!v)throw Error('CLOUD_CONFIG_'+k);return v;},dir=fs.mkdtempSync(path.join(process.env.RUNNER_TEMP||os.tmpdir(),'dashboard-core-')),repo=required('GITHUB_REPOSITORY');
const readSecret=k=>JSON.parse(required(k));
try{
 const bytes=fs.readFileSync(new URL('./runtime.enc',import.meta.url)),manifest=JSON.parse(fs.readFileSync(new URL('./runtime-manifest.json',import.meta.url)));if(createHash('sha256').update(bytes).digest('hex')!==manifest.sha256)throw Error('CLOUD_PACKAGE_HASH');
 const d=createDecipheriv('aes-256-gcm',Buffer.from(required('DASHBOARD_CORE_KEY'),'base64'),bytes.subarray(4,16));d.setAAD(Buffer.from(repo+'/dashboard-core-v1'));d.setAuthTag(bytes.subarray(16,32));const files=JSON.parse(gunzipSync(Buffer.concat([d.update(bytes.subarray(32)),d.final()])));
 for(const [name,content]of Object.entries(files)){if(!/^[a-zA-Z0-9_./-]+$/.test(name)||name.split('/').includes('..')||path.isAbsolute(name))throw Error('CLOUD_PACKAGE_PATH');const target=path.join(dir,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content);}
 const put=(name,value)=>{const target=path.join(dir,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(value),{mode:0o600});};
 put('tracker-fast-pilot-20260924/private/google-service-account.json',readSecret('DASHBOARD_GOOGLE_PRIMARY'));
 put('unified-receipt-core-20261026/private/backup-service-account.json',readSecret('DASHBOARD_GOOGLE_BACKUP'));
 put('unified-receipt-core-20261026/private/receipt-runtime-secrets.json',{secret:required('DASHBOARD_RECEIPT_SECRET')});
 await new Promise((resolve,reject)=>{const p=spawn(process.execPath,[path.join(dir,'kids-schedule-refresh-20261026/source-runner.mjs')],{cwd:dir,env:{...process.env,TZ:'Asia/Bangkok'},stdio:['ignore','pipe','pipe']});p.stdout.resume();p.stderr.resume();p.on('error',()=>reject(Error('CLOUD_RUNNER_START')));p.on('exit',code=>code===0?resolve():reject(Error('CLOUD_NATIVE_RUN_FAILED')));});
 const summary=JSON.parse(fs.readFileSync(path.join(dir,'kids-schedule-refresh-20261026/private/source-runner-last.json'))),schedule=JSON.parse(fs.readFileSync(path.join(dir,'kids-schedule-refresh-20261026/private/schedule-publication.json'))),boards=JSON.parse(fs.readFileSync(path.join(dir,'kids-class-results-20261026/private/refresh-report.json')));
 // Owner 12/11 ("sửa đi... tôi cấp quyền"): say which coverage condition failed. Class-level fields only; no pupil data.
 const tag=r=>String(r&&(r.classKey||r.className||r.classNumber||r.class||r.key||r.id||'?')).slice(0,40),why=r=>String(r&&(r.error||r.code||r.reason||r.status||'')).replace(/\s+/g,' ').slice(0,80);
 const problems=[];
 if(!summary.ok)problems.push('summary.ok=false'+(summary.error?' ('+String(summary.error).slice(0,120)+')':''));
 if(summary.classes!==44)problems.push('summary.classes='+summary.classes);
 if(!summary.classResultsOk)problems.push('summary.classResultsOk=false');
 if(schedule.length!==44)problems.push('schedule.length='+schedule.length);
 schedule.filter(r=>!r.published).forEach(r=>problems.push('schedule not published: '+tag(r)+' '+why(r)));
 if(boards.length!==28)problems.push('boards.length='+boards.length);
 boards.filter(r=>!r.ok).forEach(r=>problems.push('board not ok: '+tag(r)+' '+why(r)));
 if(problems.length){console.error('CLOUD_COVERAGE_DETAIL '+JSON.stringify({problems:problems.slice(0,60),summaryKeys:Object.keys(summary).slice(0,30),scheduleKeys:Object.keys(schedule[0]||{}).slice(0,20),boardKeys:Object.keys(boards[0]||{}).slice(0,20)}));throw Error('CLOUD_COVERAGE_INCOMPLETE');}
 const health={schema:1,ok:true,at:new Date().toISOString(),scheduleClasses:44,classResultClasses:28,runId:process.env.GITHUB_RUN_ID,commit:process.env.GITHUB_SHA,runtimeHash:manifest.sha256,hostedRunner:process.env.RUNNER_ENVIRONMENT==='github-hosted',localProcessesRequired:false};
 fs.writeFileSync('dashboard-cloud-health.json',JSON.stringify(health,null,2));console.log(JSON.stringify(health));
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'Native Schedule: **44/44**. KIDS class summaries: **28/28**. No local process, AI grading or tracker writes.\n');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
