export const CLASSES=[5,6,7,8,9];
const fail=code=>{throw Error(code)},key=x=>String(x||'').trim().normalize('NFC').toLocaleLowerCase('vi').replace(/\s+/g,' ');
export function validateSnapshot(s,n,identity,now=Date.now()){
 const klass='FIGHTER '+n,a=s?.actions,b=a?.bootstrap,d=a?.check?.directory,student=b?.profile?.student,r=a?.submissions;
 if(s?.schema!==1||s.className!==klass||s.identity!==identity||!/^[a-f0-9]{64}$/.test(identity||'')||!/^[a-f0-9]{64}$/.test(s.rosterRevision||'')||!Number.isFinite(s.capturedAt)||s.capturedAt>now+60000||now-s.capturedAt>360000)fail('SNAPSHOT_SCOPE');
 if(!a?.check||a.check.className!==klass||!d||d.className!==klass||d.students?.length!==1||!student||b?.className!==klass||b.fullDashboard?.students?.length!==1||!Array.isArray(b.fullDashboard.scoreDefinitions)||!Array.isArray(student.assignments)||!Array.isArray(student.scoreDetails))fail('SNAPSHOT_MODEL');
 if(!a.check.studentName||[student,b.fullDashboard.students[0],d.students[0]].some(v=>key(v.name)!==key(a.check.studentName)||key(v.englishName)!==key(a.check.englishName)))fail('SNAPSHOT_IDENTITY');
 if(!a.public||a.public.className!==klass||!Array.isArray(a.selfStudy)||!Array.isArray(a.public.assignments)||!Array.isArray(a.public.selfStudyAssignments)||!Array.isArray(a.public.schedule))fail('SNAPSHOT_MODEL');
 const writing=a.paragraphReviews;
 if(!writing||writing.className!==klass||key(writing.studentName)!==key(student.name)||!Array.isArray(writing.reviews)||writing.reviews.some(r=>r.className!==klass||key(r.studentName)!==key(student.name)))fail('SNAPSHOT_WRITING_SCOPE');
 if(b.manualTrackerRead?.complete===false)fail('SNAPSHOT_MANUAL_INCOMPLETE');
 if(!r||r.schema!==1||r.className!==klass||!Array.isArray(r.receipts)||!r.coverage?.length||!r.submissionVerification?.complete||!r.submissionVerification?.freshRead||!r.coverage.every(c=>c.freshRead&&(c.complete||c.readComplete)&&c.verifiedAt>0)||!r.assignmentAuthority?.complete||!r.assignmentAuthority?.freshRead)fail('SNAPSHOT_RECEIPTS_INCOMPLETE');
 if(JSON.stringify(a.dashboard)!==JSON.stringify(b.fullDashboard)||JSON.stringify(a.profile)!==JSON.stringify(b.profile))fail('SNAPSHOT_ACTION_MISMATCH');
 return s;
}
export function unavailable(snapshot,reason){
 const s=structuredClone(snapshot),r=s.actions.submissions;
 r.submissionVerification={...r.submissionVerification,complete:false,freshRead:false};
 r.coverage=r.coverage.map(c=>({...c,complete:false,readComplete:false,freshRead:false}));
 r.assignmentAuthority={...r.assignmentAuthority,complete:false,freshRead:false};
 s.sourceStatus={...s.sourceStatus,servingLastConfirmed:true,receiptError:reason};return s;
}
export function validateExport(v,n,started){
 if(!v?.ok||v.schema!==1||v.className!=='FIGHTER '+n||v.classKey!=='fighter:'+n||!v.manifestComplete||!Array.isArray(v.manifest)||!Array.isArray(v.profiles)||!Array.isArray(v.errors)||v.capturedAt<started-60000||v.capturedAt>Date.now()+60000)fail('EXPORT_SCOPE');
 const manifest=new Map(),identities=new Set(),seen=new Set();
 for(const m of v.manifest){if(!/^[a-f0-9]{64}$/.test(m.tokenHash)||!/^[a-f0-9]{64}$/.test(m.identity)||manifest.has(m.tokenHash)||identities.has(m.identity))fail('EXPORT_MANIFEST');manifest.set(m.tokenHash,m);identities.add(m.identity);}
 for(const p of [...v.profiles,...v.errors]){if(!manifest.has(p.tokenHash)||seen.has(p.tokenHash))fail('EXPORT_SCOPE');seen.add(p.tokenHash);}
 if(seen.size!==manifest.size)fail('EXPORT_INCOMPLETE');
 for(const p of v.profiles){validateSnapshot(p.snapshot,n,manifest.get(p.tokenHash).identity);if(p.snapshot.rosterRevision!==v.rosterRevision)fail('EXPORT_SCOPE');}
 return manifest;
}
