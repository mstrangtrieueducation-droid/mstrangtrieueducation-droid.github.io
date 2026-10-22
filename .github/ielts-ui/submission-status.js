(function(root){'use strict';
function read(item,record){item=item||{};record=record||{};const deadline=item.directDeadline||record.directDeadline,direct=item.directSubmission||record.directSubmission;
 const empty=item.contentMissing||record.contentMissing;
 const normalize=v=>String(v??'').normalize('NFC').replace(/<[^>]*>/g,'').replace(/\uFE0F/g,'').replace(/\s+/g,' ').trim().toLocaleLowerCase('vi');
 const manual=[item,record].some(v=>['completed','submitted_zalo'].includes(v.homeworkCode)||v.manualCompleted===true||[v.manualStatus,v.homeworkStatus,v.homeworkFeedback,v.homeworkTeacherComment].some(x=>['đủ','đạt','a+','tốt','✅','đã hoàn thành','đã nộp','✅ đã nộp','✅ đã hoàn thành','✅ đủ','✅ đạt'].includes(normalize(x))));
 const submitted=!empty&&(manual|| (deadline?deadline.complete===true:direct?direct.complete===true:record.submitted===true||record.statusType==='done'||Boolean(record.submittedAt)));
 const submittedAt=record.submittedAt||direct?.latestSubmittedAt||direct?.latestSubmittedAtMs||record.lastSubmittedAt||null;
 return {submitted,confirmed:true,label:submitted?(manual?'✅ ĐÃ HOÀN THÀNH':'✅ ĐÃ NỘP'):'— Chưa nộp bài',manual:submitted&&manual,late:deadline?.late===true,submittedAt};
}
root.IeltsSubmissionStatus={read};
})(globalThis);
