// Reads only the already-prepared edge packets. Never calls Google or grading APIs.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {buildAcademicLeaderboard} from './academic-score.mjs';
const require=createRequire(import.meta.url),folder=path.dirname(fileURLToPath(import.meta.url));
const resolver=require(fs.existsSync(path.join(folder,'ielts-assignment-resolver.cjs'))?'./ielts-assignment-resolver.cjs':'../parent-prefill-review/submission-status/ielts-assignment-resolver.js');
const frozen=process.argv.includes('--frozen'),publish=process.argv.includes('--publish');
const source=fs.readFileSync(frozen?path.join(folder,'private/frontend.html'):path.join(process.cwd(),'e73wgva4/index.html'),'utf8');
const configText=source.match(/\{"baseUrl":"https:\/\/ielts48-private-pilot\.trangnga2024\.workers\.dev\/data\/","hashes":\[[^\]]+\]\}/)?.[0];
if(!configText)throw Error('PREPARED_ROSTER_CONFIG_NOT_FOUND');
const config=JSON.parse(configText);if(config.hashes.length<1||config.hashes.some(h=>!/^[a-f0-9]{64}$/.test(h)))throw Error('INVALID_PREPARED_ROSTER');
const packets=[];let index=0;
async function capture(){while(index<config.hashes.length){const hash=config.hashes[index++];let packet;
 if(frozen)packet=JSON.parse(fs.readFileSync(path.join(folder,'private/profile-'+hash+'.json'),'utf8'));
 else{const response=await fetch(config.baseUrl+hash+'.json',{signal:AbortSignal.timeout(25000)});if(!response.ok)throw Error('PREPARED_PROFILE_UNAVAILABLE_'+response.status);packet=await response.json();}
 const boot=packet.actions?.bootstrap,profile=packet.actions?.profile,dashboard=packet.actions?.dashboard;
 if(packet.className!=='IELTS 48'||!packet.name||!boot||!profile?.student||dashboard?.className!=='IELTS 48'||boot.dashboard?.className!=='IELTS 48')throw Error('PREPARED_PROFILE_INVALID');
 if(boot.name!==packet.name||profile.student.name!==packet.name||boot.profile?.student?.name!==packet.name||boot.rosterRevision!==packet.rosterRevision)throw Error('PREPARED_IDENTITY_MISMATCH');
 for(const part of [profile,dashboard,boot.profile,boot.dashboard,packet.actions?.submissions]){
  if(part?.parentName&&part.parentName!==packet.name||part?.parentRosterRevision&&part.parentRosterRevision!==packet.rosterRevision)throw Error('PREPARED_REVISION_MISMATCH');
 }
 packets.push({hash,packet});}}
await Promise.all(Array.from({length:4},capture));
packets.sort((a,b)=>a.hash.localeCompare(b.hash));
if(new Set(packets.map(x=>x.hash)).size!==packets.length||new Set(packets.map(x=>x.packet.name)).size!==packets.length)throw Error('DUPLICATE_ROSTER_ENTRY');
const result=buildAcademicLeaderboard(packets,{now:Date.now(),resolveAssignment:item=>resolver.resolve(item),commonHabitScope:true});
// Publish scores and compact provenance only; never publish tokens, recordings or teacher comments.
result.entries=result.entries.map(entry=>({name:entry.name,hash:entry.hash,rank:entry.rank,total:entry.total,provisional:entry.provisional,missing:entry.missing,coverage:entry.coverage,components:Object.fromEntries(Object.entries(entry.components).map(([key,value])=>[key,{value:value.value,band:value.band,sourceDate:value.sourceDate,title:value.title,coverage:value.coverage,completionRate:value.completionRate,onTimeRate:value.onTimeRate}]))}));
result.sourceFingerprint=createHash('sha256').update(JSON.stringify({scope:result.scope,entries:result.entries,day:new Date(Date.now()+7*3600000).toISOString().slice(0,10)})).digest('hex');
let output=path.join(folder,'public/academic-leaderboard.json');
if(!frozen)output=path.join(process.cwd(),'e73wgva4/data/academic-leaderboard.json');
let previous;try{previous=JSON.parse(fs.readFileSync(output,'utf8'));}catch(_){}
const changed=previous?.sourceFingerprint!==result.sourceFingerprint;
if(changed){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result));}
if(publish&&changed){
 if(process.env.GITHUB_REPOSITORY!=='mstrangtrieueducation-droid/mstrangtrieueducation-droid.github.io'||!process.env.GITHUB_TOKEN)throw Error('INVALID_PUBLICATION_CONTEXT');
 const endpoint='https://api.github.com/repos/'+process.env.GITHUB_REPOSITORY+'/contents/e73wgva4/data/academic-leaderboard.json';
 const headers={Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json','Content-Type':'application/json'};
 const old=await fetch(endpoint+'?ref=main',{headers});if(!old.ok)throw Error('PUBLICATION_READ_FAILED_'+old.status);const row=await old.json();
 const response=await fetch(endpoint,{method:'PUT',headers,body:JSON.stringify({message:'Refresh IELTS 48 academic leaderboard',content:Buffer.from(JSON.stringify(result)).toString('base64'),sha:row.sha,branch:'main'})});
 if(!response.ok)throw Error('PUBLICATION_FAILED_'+response.status);
}
console.log(JSON.stringify({profiles:packets.length,ranked:result.rankedCount,provisional:result.coverage.provisional,changed,published:publish&&changed,bytes:fs.statSync(output).size}));
