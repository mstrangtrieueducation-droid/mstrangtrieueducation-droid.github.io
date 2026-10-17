const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const routes=require('./classes.json'),root=path.resolve(__dirname,'../..'),student='A'.repeat(22);
test('All 43 current private dashboards parse, load one shared adapter and expose the existing guarded identity callback',()=>{
 assert.equal(routes.length,43);
 for(const r of routes){const html=fs.readFileSync(path.join(root,r.path,'index.html'),'utf8');for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc=/.test(m[1])&&m[2].trim())new vm.Script(m[2],{filename:r.path});
  for(const name of ['student-context.js','classroom-progress.js','galaxy-core.js','/titi-games/dashboard.js','id="titi-games"'])assert.equal(html.split(name).length-1,1,r.className+' '+name);
  assert.match(html,/return Object\.freeze\(\{\s*decorate,\s*getIdentity:\s*options\.getIdentity\s*\}\)/);
  assert.match(html,/student-learning\/(?:kids-ta-entry|class-entry|fighter9)\/access\./);
 }
});
test('Each family snapshot evaluates its real identity callback: wrong identity, locked profile or bad link returns nothing',()=>{
 for(const r of routes){const html=fs.readFileSync(path.join(root,r.path,'index.html'),'utf8'),family=r.className.startsWith('KIDS')?'kids':r.className.startsWith('TA')?'ta':r.className.startsWith('FIGHTER')?'fighter':'ielts',klass=r.className.replace(/^(KIDS|FIGHTER|IELTS)/,'$1 '),name='Luna';
  const who={name,englishName:name},model={className:klass,program:'TA',assignments:[{lessonDate:'16/10/2026',url:'https://example.test/classroom'}]},profile={className:klass,student:who};
  const env={window:{ClassroomProgress:{completedAssignments:m=>m.assignments}},document:{hidden:false,body:{classList:{contains:()=>true}},getElementById:()=>({hidden:false})},location:{pathname:'/'+r.path+'/',hash:'#p='+student},URLSearchParams,
   createStudentLearningPrefill:o=>o,text:v=>String(v||''),matchKey:v=>v,liveDirectoryContainsAlias_:()=>true,validProfileData:()=>true,validDashboardData:()=>true,$:()=>({hidden:false}),sessions:()=>[{program:'Phonics 1',url:'https://example.test/classroom'}],childAssignmentFor:()=>null,
   CLASS_NAME:klass,CLASS_NUMBER:Number(r.className.replace(/\D/g,'')),kidsApi:{parent:{authorized:true,alias:name,revoked:false}},app:{directoryLoad:{ready:true},childAlias:name,child:profile,data:model},
   EXPECTED_CLASS:klass,PROGRAM_LABEL:'TA',taParent:{identity:who,terminal:false},activeStudent:who,dashboard:model,directory:model,
   fighterApi:{parent:{authorized:true,revoked:false,binding:{className:klass,studentName:name,englishName:name,directory:{className:klass,students:[who]}}}},fighterParentPackage_:{profile,publicData:model,fullDashboard:model},activeStudentName_:name,fighterParentPainted_:true,
   ieltsParentAccess:{className:klass},parentState:{authorized:true,locked:false,dashboard:model,profile,directory:{all:[who]},name},state:{student:who,dashboard:model},parentPayloadValid_:()=>true};
  const declaration=html.match(new RegExp('const '+family+'LearningPrefill_\\s*=\\s*createStudentLearningPrefill\\(\\{[^]*?\\}\\);'))?.[0];assert.ok(declaration,r.className);
  const begin=html.indexOf('window.TitiDashboardSnapshot=function'),end=html.indexOf('\n};',begin)+3;assert.ok(end>begin);
  vm.createContext(env);vm.runInContext(declaration+'\n'+html.slice(begin,end),env);
  const snapshot=env.window.TitiDashboardSnapshot();assert.equal(snapshot.className,klass,r.className);assert.equal(snapshot.student,student);assert.equal(snapshot.lessons.length,1);assert.equal(snapshot.parentRoute,'/'+r.path+'/');
  env.location.hash='#p=bad';assert.equal(env.window.TitiDashboardSnapshot(),null);env.location.hash='#p='+student;
  if(family==='kids')env.kidsApi.parent.authorized=false;else if(family==='ta')env.taParent.terminal=true;else if(family==='fighter')env.fighterApi.parent.authorized=false;else env.parentState.locked=true;
  assert.equal(env.window.TitiDashboardSnapshot(),null,r.className+' closed identity');
 }
});
