import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
export function publishFiles(folder,results,routes,existing){
 const git=args=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:180000}).trim();
 if(git(['diff','--cached','--name-only']))throw Error('UNEXPECTED_STAGED_FILES');
 const root=path.resolve(git(['rev-parse','--show-toplevel'])),paths=[];
 function target(relative,route){
  if(!relative.startsWith(route+'/data/')||!/^([A-Za-z0-9_-]{22}\.json|[A-Za-z0-9_-]{22}\/[a-f0-9]{64}\.json)$/.test(relative.slice((route+'/data/').length)))throw Error('STATIC_FILE_SCOPE');
  const dest=path.resolve(root,relative);if(!dest.startsWith(root+path.sep))throw Error('STATIC_FILE_SCOPE');return dest;
 }
 for(const result of results){
  const route=Object.values(routes).find(c=>c.className===result.className).route,keep=new Set(result.files),pupils=new Set(result.files.filter(f=>new RegExp('^'+route+'/data/[A-Za-z0-9_-]{22}\\.json$').test(f)).map(f=>f.slice((route+'/data/').length,-5)));
  for(const file of result.written){const dest=target(file,route);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(folder,file),dest);paths.push(file);}
  for(const old of existing)if(old.startsWith(route+'/data/')&&old.endsWith('.json')&&!keep.has(old)){
   const tail=old.slice((route+'/data/').length);if(tail.includes('/')&&pupils.has(tail.split('/')[0]))continue;
   // git rm is needed for sparse-checkout entries that do not exist on disk.
   target(old,route);git(['rm','--sparse','--ignore-unmatch','--',old]);
  }
 }
 for(let i=0;i<paths.length;i+=50)git(['add','--sparse','--',...paths.slice(i,i+50)]);
 git(['config','user.name','github-actions[bot]']);git(['config','user.email','41898282+github-actions[bot]@users.noreply.github.com']);
 if(!git(['diff','--cached','--name-only']))return git(['rev-parse','HEAD']);
 git(['commit','-m','Update verified IELTS static profiles']);
 for(let attempt=0;attempt<3;attempt++){
  try{git(['push','origin','HEAD:main']);return git(['rev-parse','HEAD']);}
  catch(error){if(attempt===2)throw Error('GIT_PUBLISH_FAILED');git(['fetch','origin','main']);try{git(['rebase','origin/main']);}catch(_){git(['rebase','--abort']);throw Error('CONCURRENT_STATIC_DATA_EDIT');}}
 }
}
