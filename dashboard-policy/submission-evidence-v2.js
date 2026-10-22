(function(root){'use strict';
let writing=null,getStudent=()=>null;
const norm=v=>String(v||'').normalize('NFC').trim().toLocaleLowerCase('vi');
function setWriting(data,student){if(!data||!student||norm(data.studentName||data.parentName)!==norm(student.name))return false;writing=data;return true;}
function read(item,record){item=item||{};record=record||{};
 const sources=[item,record],deadline=item.directDeadline||record.directDeadline||{},direct=item.directSubmission||record.directSubmission||{};
 const manual=sources.some(v=>['completed','submitted_zalo'].includes(v.homeworkCode)||v.manualCompleted===true||[v.manualStatus,v.homeworkStatus,v.homeworkFeedback,v.homeworkTeacherComment].some(x=>['đủ','đạt','a+','tốt','✅','đã hoàn thành','đã nộp','✅ đã nộp','✅ đã hoàn thành','✅ đủ','✅ đạt'].includes(norm(x).replace(/\uFE0F/g,''))));
 const positive=sources.some(v=>v.submitted===true||['done','late'].includes(v.statusType)||Boolean(v.submittedAt||v.lastSubmittedAt));
 const receipts=[...(direct.receipts||[]),...(record.submissionAttempts||[])].filter(r=>r&&r.contentStatus!=='empty'&&r.contentMissing!==true);
 let reviews=[];
 if(item.skill==='writing'&&writing&&norm(getStudent()?.name)===norm(writing.studentName||writing.parentName)){const n=Number(item.sessionNumber),code=item.assignmentCode|| (n>0?'IELTS-WRITING-W'+String(n).padStart(2,'0'):'');reviews=(writing.reviews||[]).filter(r=>r.assignmentCode===code&&r.publication?.status==='published'&&r.receiptId);}
 // Optional incompleteness is not evidence that an independently confirmed submission is absent.
 const submitted=manual||positive||reviews.length>0||receipts.length>0||deadline.complete===true||direct.complete===true;
 const submittedAt=record.submittedAt||record.lastSubmittedAt||direct.latestSubmittedAt||direct.latestSubmittedAtMs||reviews[0]?.submittedAt||receipts[0]?.submittedAt||null;
 return {submitted,confirmed:true,label:submitted?(manual?'✅ ĐÃ HOÀN THÀNH':'✅ ĐÃ NỘP'):'— Chưa nộp bài',manual:submitted&&manual,late:submitted&&deadline.late===true,submittedAt};
}
root.IeltsSubmissionStatus={read,setWriting,configure:fn=>{getStudent=fn;writing=null;}};
})(globalThis);
