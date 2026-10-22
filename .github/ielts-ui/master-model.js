(function(root){'use strict';
const M=root.IeltsStudyPlannerModel,parse=v=>{if(typeof v==='string')v=v.replace(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(\d{1,2}\/\d{1,2}\/\d{4})$/,'$2 $1');return M.timestamp(v,false)||0;},canon=v=>String(v||'').trim().toUpperCase();
function bucket(t,now=Date.now()){return t.status==='done'?'submitted':t.dueAt&&t.dueAt<now?'overdue':'needs';}
function partition(tasks,skill='all',now=Date.now()){const rows=tasks.filter(t=>skill==='all'||t.skill===skill),groups={needs:[],overdue:[],submitted:[]},later=[],undated=[],start=M.timestamp(M.mondayKey(now),false),end=start+7*86400000;for(const t of rows){const state=bucket(t,now);if(state==='needs'&&!t.dueAt)undated.push(t);else if(state==='needs'&&t.dueAt>=end)later.push(t);else groups[state].push(t);}return{groups,counts:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,v.length])),total:Object.values(groups).reduce((s,a)=>s+a.length,0),assignedTotal:rows.length,later,undated,weekStart:start,weekEnd:end-1};}
function writingBadges(record){const text=String(record?.homeworkTeacherComment||record?.homeworkFeedback||'').replace(/【(?:KẾT QUẢ CHẤM WRITING|HẾT KẾT QUẢ CHẤM)】/g,'');const out=[];for(const raw of text.split(/\n+/)){const line=raw.trim();if(/^(?:Đã trả\s+\d+\s*\/\s*\d+\s+bài chữa|KHÔNG ĐƯỢC CHẤM BÀI|(?:VỞ )?(?:ĐÃ )?ĐẠT YÊU CẦU|Đề\s+\d+\s*:)/iu.test(line))out.push(line.replace(/\s+trên dashboard\.?$/iu,'').replace(/\.$/,''));}return out;}
function details(task,student,resolve,record,now=Date.now()){
 const item=task.source||{},refs=(resolve(item)||[]).map(r=>({...r,code:canon(r.code)}));
 const direct=item.directSubmission||record?.directSubmission||{},receipts=[...(direct.receipts||[]),...(direct.contentEvidence||[])];
 const assigned=parse(item.assignedAt||item.releaseDate||item.lessonDate);
 const rows=root.IeltsHomeworkEvidence({actions:{profile:{student},submissions:{receipts}}}).filter(r=>r.skill===task.skill&&r.sourceAt>=assigned&&r.sourceAt<=now&&refs.some(ref=>ref.code===r.code&&(!ref.requiredParts?.length||ref.requiredParts.includes(r.part))));
 const parts=rows.filter(r=>r.scale==='raw/max');
 // Homework estimates come only from the already-published, explicitly labelled feedback.
 // A lesson's generic record.band is not a homework score.
 const explicit=task.skill==='speaking'&&record&&!record.dataConflict?root.IeltsSpeakingFeedback?.parse(record.homeworkFeedback||'')?.band:null;
 const estimated=explicit!==null&&explicit!==undefined&&explicit!==''?Number(explicit):null,band=typeof estimated==='number'&&Number.isFinite(estimated)&&estimated>=0&&estimated<=9?estimated:null;
 const raw=parts.length?parts.reduce((s,r)=>s+r.raw,0):null,max=parts.length?parts.reduce((s,r)=>s+r.maximum,0):null;
 const last=Math.max(parse(task.submittedAt),...receipts.map(r=>parse(r.submittedAtMs||r.submittedAt)),...rows.map(r=>r.sourceAt),0);
 const duration=receipts.filter(r=>r.receiptType==='attempt'&&r.scoreSource==='original-grading'&&parse(r.submittedAtMs||r.submittedAt)===last).map(r=>r.durationSeconds||r.elapsedSeconds).find(v=>typeof v==='number'&&v>0)||null;
 const target=typeof item.targetBand==='number'&&item.targetBand>=0&&item.targetBand<=9?item.targetBand:null;
 return{refs,parts,band,raw,max,last,duration,target,score:band!==null?'Band ước tính '+band:raw!==null?raw+'/'+max:null};
}
function streak(tasks,now=Date.now()){
 // A deadline cohort is indivisible: simultaneous tasks cannot inflate a streak.
 const cohorts=new Map();for(const t of tasks){if(!t.dueAt||t.dueAt>now)continue;if(!cohorts.has(t.dueAt))cohorts.set(t.dueAt,[]);cohorts.get(t.dueAt).push(t);}
 let count=0;for(const [due,rows] of [...cohorts].sort((a,b)=>b[0]-a[0])){if(!rows.every(t=>t.status==='done'&&!t.late&&parse(t.submittedAt)>0&&parse(t.submittedAt)<=due))break;count+=rows.length;}return count;
}
// All assigned unfinished work, independent of the currently selected planner week.
function pending(tasks,skill='all'){return tasks.filter(t=>t.status!=='done'&&(skill==='all'||t.skill===skill));}
root.Ielts48MasterModel={bucket,partition,pending,details,streak,writingBadges};
})(globalThis);
