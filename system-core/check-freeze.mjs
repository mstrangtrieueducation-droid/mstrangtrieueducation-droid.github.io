// Offline drift check. CSS/markup and new /dashboard-ui/ modules are separate.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const base=path.resolve(process.argv[2]||'.'),lock=JSON.parse(fs.readFileSync(process.argv[3]||path.join(base,'system-core/freeze-lock.json'))),errors=[];
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const [name,expected]of Object.entries(lock.assets)){try{if(hash(fs.readFileSync(path.join(base,name)))!==expected)errors.push(name);}catch{errors.push(name+' missing');}}
for(const [name,expected]of Object.entries(lock.pageScripts)){
 let html;try{html=fs.readFileSync(path.join(base,name),'utf8');}catch{errors.push(name+' missing');continue;}
 const actual=[];
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
  const src=m[1].match(/\bsrc\s*=\s*['"]([^'"]+)/i)?.[1];
  if(src&&/^\/dashboard-ui\/[\w./-]+\.m?js(?:\?[^\s]*)?$/.test(src))continue;
  actual.push(src?{src}:{sha256:hash(m[2])});
 }
 if(JSON.stringify(actual)!==JSON.stringify(expected))errors.push(name+' frozen scripts');
}
if(errors.length){console.error('CORE_FREEZE_CHANGED: '+errors.join(', '));process.exitCode=1;}else console.log(JSON.stringify({coreFreezePassed:true,classes:lock.classes,assets:Object.keys(lock.assets).length}));
