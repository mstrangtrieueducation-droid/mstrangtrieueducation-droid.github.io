const fs=require('fs'),assert=require('assert');
module.exports=function(s){
 s=s.replace('const received=manualComplete||!missing&&',"const received=manualComplete||rows.length>0||((data.contentMissing!==true&&data.hasContent!==false&&data.contentStatus!=='empty')&&(legacyComplete||options.received===true||data.submitted===true||data.receiptReceived===true||data.submissionReceived===true))||!missing&&");
 if(!s.includes('root.IeltsSubmissionStatus={read};'))return s;
 const start=s.lastIndexOf("(function(root){'use strict';",s.indexOf('root.IeltsSubmissionStatus={read};'));
 const end=s.indexOf('})(globalThis);',s.indexOf('root.IeltsSubmissionStatus={read};'))+14;
 s=s.slice(0,start)+fs.readFileSync(__dirname+'/submission-evidence-v2.js','utf8')+s.slice(end);
 const old='function install(o){opts=o;o.status();ready=load()';
 assert(s.includes(old),'compact install not found');
 s=s.replace(old,"function install(o){opts=o;root.IeltsSubmissionStatus.configure(()=>opts.getState().student);o.status();ready=load()");
 const marker='function update(){const s=opts.getState();if(!s.student||!s.dashboard)return;';
 assert(s.includes(marker),'compact update not found');
 s=s.replace(marker,`let evidenceIdentity='',evidenceBusy=false,evidenceNext=0;
 function update(){const s=opts.getState();if(!s.student||!s.dashboard)return;
 const who=s.student.name;
 if(!evidenceBusy&&(who!==evidenceIdentity||Date.now()>evidenceNext)){evidenceBusy=true;const student=s.student;opts.access.request('writing',false,{}).then(data=>{if(opts.getState().student?.name!==who)return;root.IeltsSubmissionStatus.setWriting(data,student);evidenceIdentity=who;evidenceNext=Date.now()+300000;root.IeltsStudyHub?.render?.(opts.getState().active);}).catch(()=>{evidenceNext=Date.now()+30000;evidenceIdentity=who;}).finally(()=>{evidenceBusy=false;});}
 `);
 return s;
};
