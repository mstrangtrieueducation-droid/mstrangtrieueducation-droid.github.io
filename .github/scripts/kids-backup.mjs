// Scheduled GitHub runner. No Google scan, no parent-triggered refresh.
import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const config=JSON.parse(process.env.KIDS_BACKUP_CLUSTERS||'[]');if(config.length!==3)throw Error('BACKUP_CONFIGURATION');
let files=0;
for(const g of config)for(const c of g.classes){
 if(!/^[a-z0-9]{8}$/.test(c.route))throw Error('BACKUP_ROUTE');
 const r=await fetch(g.endpoint+'/backup/class',{method:'POST',headers:{Authorization:'Bearer '+g.secret,'Content-Type':'application/json'},body:JSON.stringify({classNumber:c.number}),signal:AbortSignal.timeout(30000)});
 if(!r.ok){console.error('Backup unavailable for class '+c.number+'; preserving prior file');continue;}
 const b=await r.json();if(b.schema!==1||b.classNumber!==c.number||!Object.keys(b.profiles||{}).length)continue;
 const dir=c.route+'/data';fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/fallback.json',JSON.stringify(b));files++;
}
if(!files)throw Error('NO_BACKUP_PUBLISHED');
const routes=config.flatMap(g=>g.classes.map(c=>c.route+'/data/fallback.json')).filter(p=>fs.existsSync(p));
execFileSync('git',['config','user.name','github-actions[bot]']);execFileSync('git',['config','user.email','41898282+github-actions[bot]@users.noreply.github.com']);execFileSync('git',['add','--',...routes]);
if(execFileSync('git',['diff','--cached','--name-only'],{encoding:'utf8'}).trim()){
 execFileSync('git',['commit','-m','Refresh encrypted KIDS fallback snapshots']);
 // Preserve concurrent frontend edits; only fallback JSON files are staged.
 execFileSync('git',['pull','--rebase','origin','main']);execFileSync('git',['push','origin','HEAD:main']);
 const r=await fetch('https://api.github.com/repos/'+process.env.GITHUB_REPOSITORY+'/pages/builds',{method:'POST',headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}});if(!r.ok)throw Error('PAGES_BUILD_'+r.status);
}
console.log('Encrypted fallback classes written: '+files);
