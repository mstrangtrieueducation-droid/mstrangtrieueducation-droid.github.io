// A daily operational heartbeat prevents unattended public workflow inactivity.
// It updates only this non-sensitive health file, never the frozen core.
import fs from 'node:fs';
const base='https://api.github.com/repos/'+process.env.GITHUB_REPOSITORY,headers={Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},file='system-health/dashboard-cloud.json',health=JSON.parse(fs.readFileSync('dashboard-cloud-health.json'));
let old=null;const read=await fetch(base+'/contents/'+file,{headers});if(read.ok)old=await read.json();else if(read.status!==404)throw Error('HEALTH_READ_'+read.status);
if(old){const prior=JSON.parse(Buffer.from(old.content,'base64').toString());if(prior.at?.slice(0,10)===health.at.slice(0,10)){console.log('Cloud heartbeat already recorded today');process.exit(0);}}
const r=await fetch(base+'/contents/'+file,{method:'PUT',headers,body:JSON.stringify({message:'Record daily dashboard cloud maintenance health',content:Buffer.from(JSON.stringify(health,null,2)+'\n').toString('base64'),...(old?{sha:old.sha}:{})})});if(!r.ok)throw Error('HEALTH_WRITE_'+r.status);console.log('Cloud heartbeat recorded');
