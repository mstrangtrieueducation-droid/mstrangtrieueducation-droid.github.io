/* KIDS four-header tracker reader. Pure data projection; no network or storage. */
(function(root){
 'use strict';
 const text=v=>v==null?'':String(v).trim(),list=v=>Array.isArray(v)?v:[];
 const norm=v=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toUpperCase();
 const number=v=>{const s=text(v).replace(',','.');return /^-?\d+(?:\.\d+)?%?$/.test(s)?Number(s.replace('%','')):null;};
 function date(value){
  const m=text(value).match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/);if(!m)return null;
  const d=+m[1],mo=+m[2],y=+m[3],utc=Date.UTC(y,mo-1,d),v=new Date(utc);
  return v.getUTCDate()===d&&v.getUTCMonth()===mo-1?{label:[String(d).padStart(2,'0'),String(mo).padStart(2,'0'),y].join('/'),at:utc-25200000}:null;
 }
 const day=now=>Math.floor((now+25200000)/86400000)*86400000-25200000;
 function feedback(value){
  const raw=text(value),n=norm(raw),marker=raw.match(/[—\-–]+\s*NHẬN XÉT GV\s*[—\-–]+/i);
  let comment=marker?raw.slice(marker.index+marker[0].length).trim():'';
  if(!marker&&!/DA NOP|CHUA GHI NHAN|DA LAM LAI|LAN DAU:|LAN MOI:/.test(n)&&raw.length>10)comment=raw;
  if(/^(?:chưa có nhận xét|chờ gv nhận xét|đang cập nhật|—|-)\s*[.!]?$/i.test(comment))comment='';
  const teacherConfirmed=comment.length>10&&/[\p{L}]/u.test(comment);
  const submitted=/(?:DA NOP|DA LAM LAI|DA GHI NHAN)/.test(n)&&!/CHUA (?:NOP|GHI NHAN)/.test(n.split(/NHAN XET GV/)[0]);
  const count=raw.match(/(?:ĐÃ NỘP|ĐÃ LÀM LẠI)\s*(\d+)\s*LẦN/i);
  const quality=raw.match(/Chất lượng[^\n%]*?(\d+(?:[.,]\d+)?)\s*%/i);
  const score=raw.match(/(?:Điểm\s*)?(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)/i);
  const matches=[...raw.matchAll(/\b\d{1,2}\/\d{1,2}\/20\d{2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?/g)];
  return {complete:submitted||teacherConfirmed,teacherConfirmed,comment,attempts:count?+count[1]:submitted||teacherConfirmed?1:0,
   percentage:quality?+quality[1].replace(',','.'):null,score:score?+score[1].replace(',','.'):null,maximum:score?+score[2].replace(',','.'):null,
   submittedAt:matches.length?matches[matches.length-1][0]:'',supplemented:/MUON/.test(n)};
 }
 function urls(value){return [...new Set(list(value).flat().filter(v=>/^https:\/\//i.test(text(v))))];}
 function groups(values){
  const headers=values.slice(0,4),width=Math.max(...headers.map(r=>r.length)),starts=[];
  for(let c=6;c<width;c++){
   const h=headers.map(r=>text(r[c])),n=norm(h[0]);let type='';
   if(/BUOI HOC NGAY/.test(n))type='session';
   else if(/CHUOI VIDEO TU LUYEN/.test(n))type='video';
   else if(/KIEM TRA NOI|SPEAKING INTERVIEW/.test(n))type='interview';
   else if(/KIEM TRA GIAY|DIEM\s*\|\s*KIEM TRA/.test(n))type='written';
   if(type)starts.push({start:c,type});
  }
  return starts.map((g,i)=>({...g,end:i+1<starts.length?starts[i+1].start-1:width-1}));
 }
 function projectPeriod(pupil,startDate){
  const cutoff=date(startDate);if(!cutoff)return pupil;
  const p=JSON.parse(JSON.stringify(pupil)),allSessions=p.sessions||[];
  const column=v=>Number(String(v.id||'').split('-').pop());
  const videoDate=v=>date(v.assignedDate)?.at||v.assignedAt||date(v.deadline)?.at||(v.dueAt?day(v.dueAt):null)||allSessions.filter(s=>column(s)<column(v)).sort((a,b)=>column(b)-column(a))[0]?.at;
  p.videos=(p.videos||[]).filter(v=>videoDate(v)>=cutoff.at);
  p.sessions=allSessions.filter(s=>s.at>=cutoff.at);p.tests=(p.tests||[]).filter(t=>t.at>=cutoff.at);p.interviews=(p.interviews||[]).filter(t=>t.at>=cutoff.at);p.periodStart=cutoff.label;
  const past=p.sessions.filter(s=>!s.future),graded=past.filter(s=>s.paper&&/^(A\+|A|B|F)$/.test(s.paper.grade));let streak=0;
  for(const s of graded){if(s.paper.grade!=='A+')break;streak++;}
  const complete=p.videos.filter(v=>v.complete),q=complete.map(v=>v.percentage).filter(Number.isFinite);
  p.summary={stars:past.reduce((n,s)=>n+(s.stars||0),0),paperAPlus:graded.filter(s=>s.paper.grade==='A+').length,paperGraded:graded.length,paperStreak:streak,videoComplete:complete.length,videoTotal:p.videos.length,videoAverage:q.length?q.reduce((a,b)=>a+b,0)/q.length:null,practiceAttempts:[...past.flatMap(s=>s.tasks),...p.videos].reduce((n,t)=>n+(t.attempts||0),0),testAverage:p.tests.length?p.tests.reduce((n,t)=>n+t.percentage,0)/p.tests.length:null};
  return p;
 }
 function parseTracker(values,options){
  const o=options||{},now=Number(o.now),headers=list(values).slice(0,4);
  if(headers.length!==4||!Number.isFinite(now))return {schema:1,students:[],referenceDay:''};
  const blocks=groups(values),headerLinks=list(o.headerLinks),studentLinks=o.studentLinks||{},students=[];
  for(let r=4;r<values.length;r++){
   const row=values[r]||[],alias=text(row[2]).split('\n')[0].toUpperCase();if(!/^\d+$/.test(text(row[0]))||!alias)continue;
   const pupil={schema:1,alias,fullName:text(row[1]).split('\n')[0],classNumber:o.classNumber,className:o.className,sessions:[],videos:[],tests:[],interviews:[],sourceAt:now};
   for(const group of blocks){
    try{
     const {start,end,type}=group,hs=[];for(let c=start;c<=end;c++)for(let h=0;h<4;h++)if(headers[h][c])hs.push(text(headers[h][c]));
     const heading=hs.join('\n'),dt=date(heading),id=[type,dt?.label||'',start].join('-');
     if(type==='session'){
      const context=hs.find(v=>/Tiết học số\s*\d+/i.test(v))||'',match=context.match(/Tiết học số\s*(\d+)\s*:?\s*([\s\S]*)/i);
      if(!match||!dt)continue;
      const session={id,key:dt.label+'|'+Number(match[1]),date:dt.label,at:dt.at,number:+match[1],title:text(match[2]),program:(heading.match(/(?:Sách\s+)?(?:Oxford\s+)?Discover\s*\d+/i)||['Buổi học'])[0].replace(/^Sách\s*/i,''),tasks:[],paper:null,stars:null,teacherNote:'',future:dt.at>day(now)};
      for(let c=start;c<=end;c++){
       const h2=norm(headers[2][c]),h3=norm(headers[3][c]),raw=text(row[c]);
       if(/BAI TAP VE NHA \(SACH GIAY\)|SACH WORK BOOK|SACH WORKBOOK/.test(h3)){
        const grade=raw.match(/^\s*(A\+|A|B|F)(?=\s|$)/i);session.paper={grade:grade?grade[1]:'',note:raw};
       }else if(/SO SAO/.test(h3))session.stars=number(raw);
       else if(/^NHAN XET$/.test(h3))session.teacherNote=raw;
       else if(/VIDEO|LAM LAI BAI KIEM TRA|BAI TAP VE NHA/.test(h2)&&!(/BUOI HOC/.test(h2))){
        const f=feedback(raw),links=urls(studentLinks[alias]?.[c]),learning=urls(headerLinks.map(h=>h[c])).find(u=>u.includes('github.io'))||'';
        const title=text(headers[3][c]).split(/\n|🔗/)[0]||(/LAM LAI/.test(h2)?'Làm lại bài kiểm tra':'Video bài học');
        session.tasks.push({id:id+'-task-'+c,column:c,title,type:/LAM LAI/.test(h2)?'retake':/NGU PHAP/.test(h3)?'grammar':/TU VUNG|TU MOI/.test(h3)?'vocabulary':/DOC|READING/.test(h3)?'reading':'video',learningUrl:learning,links,...f});
       }
      }
      pupil.sessions.push(session);
     }else if(type==='video'){
      const vm=heading.match(/VIDEO\s*(\d+)/i);if(!vm)continue;
      const f=feedback(row[start]);pupil.videos.push({id,number:+vm[1],title:'Video '+vm[1],program:/PEPPA/i.test(heading)?'Peppa Pig':/PHONICS/i.test(heading)?'Phonics':'Discover English',deadline:dt?.label||'',dueAt:dt?dt.at+86399999:null,learningUrl:urls(headerLinks.map(h=>h[start])).find(u=>u.includes('github.io'))||'',links:urls(studentLinks[alias]?.[start]),...f});
     }else if(type==='written'){
      const scoreHeaders=headers[3].slice(start,end+1).join('\n'),maxMatch=scoreHeaders.match(/Tổng[^\d]*(\d+)\s*câu/i)||scoreHeaders.match(/\/\s*(\d+)/),maximum=maxMatch?+maxMatch[1]:null;
      let score=null,percentage=null;for(let c=start;c<=end;c++){const n=number(row[c]);if(n===null)continue;if(score===null)score=n;else if(percentage===null)percentage=n<=1?n*100:n;}
      if(score===null||maximum===null||score<0||score>maximum)continue;
      pupil.tests.push({id,type:'written',date:dt?.label||'',at:dt?.at||0,title:(heading.match(/UNIT\s*\d+(?:\s*\+\s*\d+)?/i)||['Kiểm tra giấy'])[0],score,maximum,percentage:score/maximum*100,sourcePercentage:percentage});
     }else if(type==='interview'){
      const criteria=[];let total=null,maximum=null,percentage=null,comment='';
      for(let c=start;c<=end;c++){
       const h=headers.map(r=>text(r[c])).join('\n'),n=norm(h),v=number(row[c]);
       const skill=/PRONUNCIATION|PHAT AM/.test(n)?'Phát âm':/GRAMMAR|NGU PHAP/.test(n)?'Ngữ pháp':/VOCABULARY|TU VUNG/.test(n)?'Từ vựng':/FLUENCY|TROI CHAY/.test(n)?'Độ trôi chảy':'';
       if(skill){const max=text(headers[3][c]).match(/\/\s*(\d+)/);if(v!==null&&max)criteria.push({title:skill,score:v,maximum:+max[1]});}
       else if(/TONG DIEM|\bTOTAL\b/.test(n)){total=v;maximum=+(h.match(/\/\s*(\d+)/)||[])[1]||null;}
       else if(/PERCENTAGE|MUC DO/.test(n))percentage=v===null?null:v<=1?v*100:v;
       else if(/NHAN XET CHUNG|GENERAL NOTES/.test(n))comment=text(row[c]);
      }
      if(total!==null)pupil.interviews.push({id,title:'Phỏng vấn nói 1-1',date:dt?.label||'',at:dt?.at||0,score:total,maximum,percentage:maximum?total/maximum*100:percentage,criteria,comment});
     }
    }catch(_){/* One malformed source group cannot suppress other sessions. */}
   }
   pupil.sessions.sort((a,b)=>b.at-a.at||b.number-a.number);pupil.videos.sort((a,b)=>b.number-a.number);pupil.tests.sort((a,b)=>a.at-b.at);
   const past=pupil.sessions.filter(s=>!s.future),graded=past.filter(s=>s.paper&&/^(A\+|A|B|F)$/.test(s.paper.grade));let streak=0;
   for(const s of graded){if(s.paper.grade!=='A+')break;streak++;}
   const complete=pupil.videos.filter(v=>v.complete),qualities=complete.map(v=>v.percentage).filter(Number.isFinite);
   pupil.summary={stars:past.reduce((sum,s)=>sum+(s.stars||0),0),paperAPlus:graded.filter(s=>s.paper.grade==='A+').length,paperGraded:graded.length,paperStreak:streak,videoComplete:complete.length,videoTotal:pupil.videos.length,videoAverage:qualities.length?qualities.reduce((a,b)=>a+b,0)/qualities.length:null,practiceAttempts:[...past.flatMap(s=>s.tasks),...pupil.videos].reduce((n,t)=>n+t.attempts,0),testAverage:pupil.tests.length?pupil.tests.reduce((n,t)=>n+t.percentage,0)/pupil.tests.length:null};
   students.push(o.startDate?projectPeriod(pupil,o.startDate):pupil);
  }
  const board=students.map(s=>({alias:s.alias,fullName:s.fullName,...s.summary})).sort((a,b)=>b.stars-a.stars||a.alias.localeCompare(b.alias));
  board.forEach((s,i)=>{s.rank=i&&s.stars===board[i-1].stars?board[i-1].rank:i+1});
  return {schema:1,referenceDay:new Date(day(now)+25200000).toISOString().slice(0,10),students,board};
 }
 const api={parseTracker,projectPeriod,feedback,date,day,norm};root.KidsJourneyParser=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

(function(root){
 'use strict';
 const P=root.KidsJourneyParser||(typeof require==='function'?require('./parser.js'):null),arr=v=>Array.isArray(v)?v:[],copy=v=>JSON.parse(JSON.stringify(v)),txt=v=>v==null?'':String(v).trim();
 const urls=v=>[...new Set(arr(v).flatMap(x=>typeof x==='string'?[x]:x&&typeof x==='object'?[x.url,x.href,x.viewUrl]:[]).filter(x=>/^https:\/\//.test(x||'')))];
 function mergeTask(base,live){
  if(!live)return base;const f=live.feedback||live,review=txt(f.teacherComment||f.comment),parsed=P.feedback(review);
  const attempts=arr(f.submissionAttempts||f.attempts),complete=base.complete||f.completed===true||f.submitted===true||f.receiptReceived===true||parsed.teacherConfirmed;
  const q=parsed.percentage??(typeof f.percentage==='number'?f.percentage:null);
  const links=urls([...(base.links||[]),...arr(f.links),...attempts.flatMap(x=>[x.viewUrl,x.submissionUrl,...arr(x.links)]),f.viewUrl,f.submissionUrl]);
  const last=attempts[attempts.length-1]||{},latestLinks=urls([f.viewUrl,f.submissionUrl,last.viewUrl,last.submissionUrl,...arr(last.links)]);
  return {...base,complete,comment:parsed.comment||base.comment,attempts:Math.max(base.attempts||0,attempts.length,Number(f.declaredAttemptCount)||0,complete?1:0),percentage:q??base.percentage,submittedAt:f.lastSubmittedAt||f.submittedAt||base.submittedAt,learningUrl:live.url||live.learningUrl||base.learningUrl,links,latestLinks:latestLinks.length?latestLinks:base.latestLinks||[],supplemented:base.supplemented||f.isLate===true};
 }
 function build(raw,input){
  const profile=input.profile||{},dashboard=input.dashboard||{};
  const displayStart=P.date(input.cutoffDate||dashboard.cutoffDate||profile.cutoffDate||raw.periodStart||'10/08/2026')||P.date('10/08/2026');
  const join=P.date(profile.joinDate||raw.joinDate),cutoff=Math.max(displayStart.at,join?.at||0),periodStart=P.date(join&&join.at>displayStart.at?join.label:displayStart.label).label;
  const m=P.projectPeriod(raw,periodStart),today=P.day(Number(input.serverNow)||raw.sourceAt),assignments=arr(profile.assignments),practice=arr(input.practice);
  m.dashboardStart=displayStart.label;m.joinDate=join?.label||'';
  m.interviews=m.interviews.map(i=>{const t=arr(profile.tests).find(t=>t.assessmentType==='speaking-interview'&&P.date(t.date)?.label===i.date);return {...i,videoUrl:t?.videoUrl||i.videoUrl||'',resultUrl:t?.resultUrl||i.resultUrl||''};});
  for(const s of m.sessions){
   s.future=s.at>today;
   const a=assignments.find(a=>Number(a.sessionNumber)===s.number&&P.date(a.lessonDate||a.assignedDate)?.label===s.date);
   if(a){
    s.dueDate=a.dueDate||'';s.title=s.title||a.title||'';
    const used=new Set();s.tasks=s.tasks.map(t=>{
     let i=arr(a.tasks).findIndex((x,i)=>!used.has(i)&&x.url&&t.learningUrl&&x.url===t.learningUrl);
     if(i<0)i=arr(a.tasks).findIndex((x,i)=>!used.has(i)&&((t.type==='grammar'&&/NGU PHAP/.test(P.norm(x.title)))||(t.type==='vocabulary'&&/TU VUNG|TU MOI/.test(P.norm(x.title)))||(t.type==='retake'&&/LAM LAI|KIEM TRA/.test(P.norm(x.title)))||(t.type==='reading'&&/DOC/.test(P.norm(x.title)))));
     if(i<0&&arr(a.tasks).length===1&&s.tasks.length===1)i=0;
     if(i>=0){used.add(i);return mergeTask(t,a.tasks[i])}return t;
    });
   }
  }
  for(const a of practice){
   const num=Number((txt(a.title).match(/VIDEO\s*0*(\d+)/i)||[])[1]);if(!num)continue;
   const at=P.date(a.assignedDate||a.date)?.at||P.date(a.dueDate)?.at||null;if(!at||at<cutoff||at>today)continue;
   const program=/PEPPA/i.test(a.title)?'Peppa Pig':/PHONICS/i.test(a.title)?'Phonics':'Discover English';
   let i=m.videos.findIndex(v=>v.number===num&&v.program===program),v=i>=0?m.videos[i]:{id:a.id,number:num,title:'Video '+num,program,complete:false,attempts:0,comment:'',links:[]};
   const f=mergeTask(mergeTask(v,a),arr(a.tasks)[0]);v={...f,id:v.id,number:num,program,deadline:a.dueDate||v.deadline,dueAt:P.date(a.dueDate)?.at+86399999||v.dueAt,assignedAt:at};
   if(i>=0)m.videos[i]=v;else m.videos.push(v);
  }
  m.videos.sort((a,b)=>b.number-a.number);
  const active=m.sessions.filter(s=>!s.future),latest=active[0],latestVideo=m.videos[0];
  m.weekly=[...(latest?.tasks||[]).map(t=>({...t,parent:latest.id,session:latest.number,displayTitle:t.title+' · Tiết '+latest.number})),...(latestVideo?[{...latestVideo,parent:latestVideo.id,displayTitle:latestVideo.program+' · Video '+latestVideo.number}]:[])];
  const currentIds=new Set(m.weekly.map(t=>t.id));
  m.older=[...active.flatMap(s=>s.tasks.map(t=>({...t,parent:s.id,displayTitle:t.title+' · Tiết '+s.number}))),...m.videos.map(v=>({...v,parent:v.id,displayTitle:v.program+' · Video '+v.number}))].filter(t=>!t.complete&&!currentIds.has(t.id));
  m.pending=m.weekly.filter(t=>!t.complete);m.weeklyDone=m.weekly.filter(t=>t.complete);
  m.summary.videoComplete=m.videos.filter(v=>v.complete).length;m.summary.videoTotal=m.videos.length;
  m.summary.practiceAttempts=[...active.flatMap(s=>s.tasks),...m.videos].reduce((n,t)=>n+(t.attempts||0),0);
  const q=m.videos.filter(v=>v.complete&&Number.isFinite(v.percentage)).map(v=>v.percentage);m.summary.videoAverage=q.length?q.reduce((a,b)=>a+b,0)/q.length:null;
  m.future=m.sessions.filter(s=>s.future).sort((a,b)=>a.at-b.at);m.recent=active.slice(0,5);
  m.badges=[];if(m.summary.paperStreak>=3)m.badges.push({icon:'🏅',title:'Phong độ A+',detail:m.summary.paperStreak+' buổi được chấm gần nhất đạt A+'});
  if([...active.flatMap(s=>s.tasks),...m.videos].some(t=>t.attempts>=2))m.badges.push({icon:'🔥',title:'Chăm chỉ luyện tập',detail:'Có nhiều lượt luyện tập hoặc làm lại bài'});
  if(m.interviews.some(i=>i.criteria.some(c=>c.title==='Phát âm'&&c.score===c.maximum))||m.videos.some(v=>v.percentage>=85))m.badges.push({icon:'🎙️',title:'Phát âm tốt',detail:'Ghi nhận từ phỏng vấn hoặc video đã chấm'});
  if(m.videos.length&&m.videos.every(v=>v.complete))m.badges.push({icon:'🎬',title:'Hoàn thành chuỗi video',detail:'Hoàn thành tất cả video đã được giao'});
  // Current receipts can advance this pupil's visible counters immediately.
  m.board=(raw.periodStart===displayStart.label?arr(m.board):[]).map(b=>b.alias===m.alias?{...b,...m.summary}:b).sort((a,b)=>b.stars-a.stars||a.alias.localeCompare(b.alias));
  m.board.forEach((b,i)=>{b.rank=i&&b.stars===m.board[i-1].stars?m.board[i-1].rank:i+1});
  return m;
 }
 const api={build,mergeTask};root.KidsJourneyModel=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

(function(){var s=document.createElement("style");s.id="kids-journey-pilot-style";s.textContent="body.kids-journey-pilot{background:#fff!important;color:#14263d}\nbody.kids-journey-pilot #dashboardShell{max-width:1240px;margin:0 auto;background:none;border:0;box-shadow:none;padding:0}\nbody.kids-journey-pilot #dashboardShell>:not(#kids-journey-root):not(#titi-games){display:none!important}\n#kids-journey-root{--ink:#14263d;--muted:#64748b;--line:#e2e8f0;max-width:1200px;margin:auto;padding:20px 24px 80px;font-family:inherit;line-height:1.55;color:var(--ink);text-align:left;font-size:14px}\n#kids-journey-root *{box-sizing:border-box}\n#kids-journey-root h1,#kids-journey-root h2,#kids-journey-root h3,#kids-journey-root p{margin:0}\n#kids-journey-root button,#kids-journey-root a{font:inherit;-webkit-tap-highlight-color:transparent}\n#kids-journey-root button{cursor:pointer;color:inherit}\n#kids-journey-root button:focus-visible,#kids-journey-root a:focus-visible,#kids-journey-root summary:focus-visible{outline:3px solid #93c5fd;outline-offset:3px}\n#kids-journey-root h2{font-size:19px;font-weight:800;line-height:1.4}\n#kids-journey-root #j-header{display:flex;align-items:center;justify-content:space-between;gap:22px;padding:18px 20px;border:1px solid var(--line);border-radius:18px;background:#fff;margin-bottom:18px}\n#kids-journey-root .j-brand{display:flex;align-items:center;gap:13px;min-width:0}\n#kids-journey-root .j-brand img{width:52px;height:52px;object-fit:contain;border-radius:12px;flex:none}\n#kids-journey-root .j-brand p{font-size:9px;letter-spacing:1px;font-weight:800;color:var(--muted);margin-bottom:3px}\n#kids-journey-root h1{font-size:23px;line-height:1.35;font-weight:850}\n#kids-journey-root h1 span{font-size:18px;font-weight:650}\n#kids-journey-root .j-brand small{font-size:11px;color:var(--muted)}\n#kids-journey-root .j-header-metrics{display:flex;flex-direction:column;gap:9px;align-items:flex-end;flex:none}\n#kids-journey-root .j-inline-stats{display:flex;gap:18px;font-size:12px;color:#475569;align-items:center}\n#kids-journey-root .j-inline-stats b{font-size:18px;color:var(--ink);margin-right:2px}\n#kids-journey-root .j-badges{display:flex;gap:6px;flex-wrap:wrap}\n#kids-journey-root .j-badge{display:inline-flex;align-items:center;gap:4px;border:1px solid var(--line);border-radius:30px;background:#fff;padding:4px 8px;font-size:10px;color:#475569;font-weight:650;white-space:nowrap}\n#kids-journey-root #j-tabs{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid var(--line);gap:10px;margin-bottom:16px}\n#kids-journey-root #j-tabs button{display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;border:0;border-bottom:3px solid transparent;background:#fff;font-size:14px;font-weight:750;color:var(--muted);padding:10px 5px}\n#kids-journey-root #j-tabs button[aria-selected=true]{color:#1d4ed8;border-color:#2563eb}\n#kids-journey-root #j-tabs button span{font-size:16px}\n#kids-journey-root .j-count-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}\n#kids-journey-root .j-count-tabs button{display:flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:10px;padding:8px 12px;background:#fff;font-size:12px;font-weight:650;color:#475569}\n#kids-journey-root .j-count-tabs button b{font-size:12px;min-width:20px;text-align:center;background:#f1f5f9;border-radius:5px;padding:1px 4px}\n#kids-journey-root .j-count-tabs button[aria-pressed=true]{border-color:#94a3b8;color:var(--ink);box-shadow:inset 0 0 0 1px #94a3b8}\n#kids-journey-root .j-overline{font-size:10px;font-weight:750;letter-spacing:.8px;color:var(--muted);line-height:1.4;margin-bottom:5px}\n#kids-journey-root .j-week-list{display:grid;gap:10px}\n#kids-journey-root .j-week-item{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:18px 20px;background:#fff;border:1px solid var(--line);border-radius:14px}\n#kids-journey-root .j-week-item.needs-action{border-left:4px solid #f59e0b;background:#fffdf9}\n#kids-journey-root .j-week-item h2{font-size:19px;margin-bottom:5px}\n#kids-journey-root .j-week-item p{font-size:12px;color:var(--muted)}\n#kids-journey-root .j-week-item .j-task-actions{flex:none;gap:9px}\n#kids-journey-root .j-week-item button{border:0;background:none;font-size:11px;color:#475569;padding:8px 0}\n#kids-journey-root .j-week-item .j-task-actions a{font-size:12px;padding:11px 15px}\n#kids-journey-root .j-work-copy{min-width:0}\n#kids-journey-root .j-empty{border:1px solid var(--line);border-radius:12px;padding:18px;color:var(--muted);font-size:13px;background:#fff}\n#kids-journey-root .j-next{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:16px 20px;border:1px solid var(--line);background:#fff;border-radius:14px;margin:16px 0 24px}\n#kids-journey-root .j-next h2{font-size:17px}\n#kids-journey-root .j-next p:not(.j-overline),#kids-journey-root .j-next small{font-size:11px;color:var(--muted);margin-top:3px}\n#kids-journey-root .j-calendar{display:flex;gap:4px;flex:none}\n#kids-journey-root .j-calendar span{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:10px;color:#94a3b8;width:29px;height:43px}\n#kids-journey-root .j-calendar b{font-size:8px;font-weight:400}\n#kids-journey-root .j-calendar span.active{color:#2563eb;background:#f8fafc;border-radius:8px;font-weight:700}\n#kids-journey-root .j-section-title{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:20px 0 13px}\n#kids-journey-root .j-section-title span{font-size:12px;color:var(--muted)}\n#kids-journey-root .j-recent{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}\n#kids-journey-root .j-recent article{border:1px solid var(--line);background:#fff;border-radius:12px;padding:15px}\n#kids-journey-root .j-recent article>div:first-child{display:flex;justify-content:space-between;gap:10px;margin-bottom:8px}\n#kids-journey-root .j-recent strong{font-size:15px}\n#kids-journey-root .j-recent small{font-size:11px;color:var(--muted)}\n#kids-journey-root .j-recent button{border:0;background:none;color:#475569;font-size:11px;padding:10px 0 0;font-weight:650}\n#kids-journey-root .j-recent .j-chip{margin-right:4px;margin-bottom:4px}\n#kids-journey-root .has-notice{border-left:3px solid #fb923c!important}\n#kids-journey-root .j-note{background:#fff7ed;color:#9a521c;border-radius:8px;padding:9px 11px;font-size:12px;line-height:1.7;margin-top:8px}\n#kids-journey-root .j-plain-note{font-size:12px;color:var(--muted);margin-top:6px;line-height:1.7}\n#kids-journey-root .j-chip{display:inline-flex;align-items:center;gap:4px;padding:4px 8px;background:#f8fafc;color:#64748b;border:1px solid #edf0f4;border-radius:7px;font-size:10px;font-weight:650;line-height:1.5}\n#kids-journey-root .j-chip.green{color:#28745c;background:#f5faf7;border-color:#e6f1ea}\n#kids-journey-root .j-chip.notice{background:#fff7ed;border-color:#fed7aa;color:#9a521c}\n#kids-journey-root .j-card-chips,#kids-journey-root .j-detail-chips{display:flex;flex-wrap:wrap;gap:6px}\n#kids-journey-root .j-filters{display:flex;gap:7px;flex-wrap:wrap;margin:13px 0 20px}\n#kids-journey-root .j-filters button{background:#fff;border:1px solid var(--line);border-radius:8px;padding:8px 12px;font-size:12px;font-weight:650;color:var(--muted)}\n#kids-journey-root .j-filters button[aria-pressed=true]{background:#f8fafc;color:var(--ink);border-color:#94a3b8}\n#kids-journey-root .j-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}\n#kids-journey-root .j-card{display:flex;flex-direction:column;align-items:flex-start;gap:9px;width:100%;border:1px solid var(--line);background:#fff;border-radius:14px;padding:19px;text-align:left}\n#kids-journey-root .j-card:hover{border-color:#94a3b8}\n#kids-journey-root .j-card.needs-action{border-left:3px solid #f59e0b}\n#kids-journey-root .j-card-overline{font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.5px}\n#kids-journey-root .j-card strong{font-size:18px;line-height:1.4}\n#kids-journey-root .j-card-title,#kids-journey-root .j-excerpt{font-size:12px;line-height:1.7;color:var(--muted)}\n#kids-journey-root .j-card-link{font-size:12px;font-weight:700;color:#475569;padding-top:4px;margin-top:auto;width:100%}\n#kids-journey-root .j-card-link>span{float:right}\n#kids-journey-root .j-subtabs{display:flex;gap:20px;border-bottom:1px solid var(--line);margin-bottom:20px}\n#kids-journey-root .j-subtabs button{font-size:13px;font-weight:700;color:var(--muted);border:0;border-bottom:2px solid transparent;background:#fff;padding:10px 0}\n#kids-journey-root .j-subtabs button[aria-selected=true]{color:var(--ink);border-color:#334155}\n#kids-journey-root .j-achievements{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:12px 0 20px}\n#kids-journey-root .j-achievements article{border:1px solid var(--line);border-radius:12px;padding:16px;background:#fff;text-align:center}\n#kids-journey-root .j-achievements span{font-size:19px}\n#kids-journey-root .j-achievements b{font-size:26px;display:block;font-weight:800;margin:3px 0}\n#kids-journey-root .j-achievements p{font-size:11px;color:var(--muted)}\n#kids-journey-root .j-certificate{border:1px solid var(--line);border-radius:16px;padding:24px;background:#fff;text-align:center;margin-bottom:18px}\n#kids-journey-root .j-certificate>p:not(.j-overline){font-size:12px;color:var(--muted);margin:5px 0}\n#kids-journey-root .j-cert-score{display:block;font-size:38px;font-weight:800;line-height:1.4;margin:10px 0}\n#kids-journey-root .j-cert-score span{font-size:20px;color:#94a3b8}\n#kids-journey-root .j-skills{display:grid;grid-template-columns:1fr 1fr;gap:18px 24px;text-align:left;max-width:680px;margin:22px auto}\n#kids-journey-root .j-skills>div{display:grid;grid-template-columns:1fr auto;gap:5px;font-size:12px}\n#kids-journey-root .j-skills b{font-size:11px;color:var(--muted)}\n#kids-journey-root meter{grid-column:span 2;width:100%;height:10px;border:0;accent-color:#64748b;background:#e2e8f0}\n#kids-journey-root meter::-webkit-meter-bar{background:#edf0f4;border:0;border-radius:20px}\n#kids-journey-root meter::-webkit-meter-optimum-value{background:#64748b;border-radius:20px}\n#kids-journey-root .j-certificate blockquote{border-top:1px solid var(--line);text-align:left;margin:18px 0 0;padding:18px 0 0;font-size:13px;line-height:1.9;color:#475569}\n#kids-journey-root .j-chart{border:1px solid var(--line);border-radius:14px;padding:20px;background:#fff}\n#kids-journey-root .j-chart-scroll{overflow:auto}\n#kids-journey-root .j-chart svg{display:block;width:100%;min-width:510px;max-height:330px;margin-top:10px}\n#kids-journey-root .j-chart text{font-family:inherit;font-size:16px;fill:#334155;font-weight:800}\n#kids-journey-root .j-chart .j-chart-label{font-size:10px;fill:#64748b;font-weight:500}\n#kids-journey-root .j-race-banner{text-align:center;padding:16px 0}\n#kids-journey-root .j-race-banner p:not(.j-overline){color:var(--muted);font-size:12px;margin-top:4px}\n#kids-journey-root .j-podium{display:grid;grid-template-columns:repeat(3,1fr);align-items:end;gap:12px;max-width:850px;margin:20px auto}\n#kids-journey-root .j-podium article{display:flex;flex-direction:column;align-items:center;text-align:center;border:1px solid var(--line);border-radius:14px;padding:18px;background:#fff}\n#kids-journey-root .j-podium article.place-1{padding-top:28px;padding-bottom:28px}\n#kids-journey-root .j-podium article>span{font-size:26px}\n#kids-journey-root .j-podium small,#kids-journey-root .j-podium p{font-size:10px;color:var(--muted);margin-top:4px}\n#kids-journey-root .j-podium h3{font-size:18px;margin-top:4px}\n#kids-journey-root .j-podium strong{font-size:22px;margin-top:10px}\n#kids-journey-root .j-my-place{display:flex;align-items:center;gap:24px;border:1px solid var(--line);border-radius:12px;padding:18px 20px;margin-bottom:20px;background:#fff}\n#kids-journey-root .j-my-place>div{min-width:210px}\n#kids-journey-root .j-my-place>p{font-size:12px;color:var(--muted)}\n#kids-journey-root .j-table-scroll{overflow:auto;border:1px solid var(--line);border-radius:12px;background:#fff}\n#kids-journey-root table{width:100%;min-width:650px;border-collapse:collapse;font-size:12px;text-align:left}\n#kids-journey-root caption{font-weight:750;text-align:left;padding:18px}\n#kids-journey-root th,#kids-journey-root td{padding:12px;border-top:1px solid #f1f5f9;vertical-align:middle}\n#kids-journey-root thead{background:#f8fafc;font-size:10px;color:var(--muted)}\n#kids-journey-root tbody th small{display:block;font-weight:400;font-size:10px;color:var(--muted)}\n#kids-journey-root .is-self{background:#f8fafc}\n#kids-journey-root .j-footnote{font-size:11px;color:var(--muted);margin:13px 0}\n#kids-journey-root .j-footer{border-top:1px solid var(--line);font-size:10px;color:#94a3b8;text-align:center;margin-top:24px;padding-top:18px}\n#kids-journey-root dialog{border:1px solid var(--line);border-radius:18px;background:#fff;color:var(--ink);max-width:800px;width:calc(100% - 32px);max-height:88vh;padding:28px;margin:auto;box-shadow:0 20px 70px #0f172a30;overflow:auto;overscroll-behavior:contain}\n#kids-journey-root dialog::backdrop{background:#0f172a70;backdrop-filter:blur(3px)}\n#kids-journey-root .j-modal-close{position:sticky;float:right;top:0;right:0;width:32px;height:32px;border:0;border-radius:50%;background:#f1f5f9;color:#475569;font-size:22px;z-index:2}\n#kids-journey-root #j-modal-title{font-size:22px;padding-right:26px;margin-bottom:16px}\n#kids-journey-root .j-love-note{border:1px solid var(--line);border-radius:10px;padding:14px 17px;margin:16px 0;background:#fff}\n#kids-journey-root .j-love-note.has-notice{background:#fff7ed;border-color:#fed7aa}\n#kids-journey-root .j-love-note h3{font-size:14px}\n#kids-journey-root .j-love-note p{font-size:13px;line-height:1.8;margin-top:6px}\n#kids-journey-root .j-task-detail{border-top:1px solid var(--line);padding:19px 0;margin-top:16px}\n#kids-journey-root .j-task-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}\n#kids-journey-root .j-task-heading h3{font-size:16px;max-width:75%}\n#kids-journey-root .j-task-status{font-size:12px;color:#64748b;margin:8px 0}\n#kids-journey-root .j-persistence{font-size:12px;color:#475569;margin:7px 0}\n#kids-journey-root .j-teacher-comment{font-size:13px;line-height:1.9;color:#475569;padding:10px 0}\n#kids-journey-root .j-teacher-comment p{margin:10px 0;overflow-wrap:anywhere;white-space:pre-wrap}\n#kids-journey-root .j-task-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap}\n#kids-journey-root .j-task-actions a{font-size:12px;font-weight:700;color:#334155;border:1px solid var(--line);border-radius:9px;background:#fff;padding:10px 14px;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}\n#kids-journey-root .j-task-actions a.j-primary{color:#fff;background:#1d4ed8;border-color:#1d4ed8}\n#kids-journey-root .j-interview-video{justify-content:center;margin:14px 0}\n#kids-journey-root .j-all-evidence{font-size:12px;color:var(--muted);margin-top:14px}\n#kids-journey-root .j-all-evidence summary{cursor:pointer}\n#kids-journey-root .j-all-evidence a{display:block;color:#1d4ed8;margin:6px 0}\n@media(max-width:800px){\n #kids-journey-root{padding:12px 12px 85px}\n #kids-journey-root #j-header{display:block;padding:14px;margin-bottom:10px}\n #kids-journey-root .j-brand{gap:10px}\n #kids-journey-root .j-brand img{width:44px;height:44px;border-radius:9px}\n #kids-journey-root .j-brand p{font-size:8px;letter-spacing:.6px}\n #kids-journey-root h1{font-size:20px}\n #kids-journey-root h1 span{font-size:15px}\n #kids-journey-root .j-brand small{font-size:10px}\n #kids-journey-root .j-header-metrics{margin-top:10px;align-items:flex-start;gap:7px}\n #kids-journey-root .j-inline-stats{font-size:11px;gap:15px}\n #kids-journey-root .j-inline-stats b{font-size:15px}\n #kids-journey-root .j-badges{gap:4px}\n #kids-journey-root .j-badge{font-size:8px;padding:3px 6px}\n #kids-journey-root #j-tabs{gap:3px;margin-bottom:12px}\n #kids-journey-root #j-tabs button{font-size:10px;gap:3px;min-height:46px;padding:8px 1px}\n #kids-journey-root #j-tabs button span{font-size:12px}\n #kids-journey-root .j-count-tabs{gap:6px;margin-bottom:12px}\n #kids-journey-root .j-count-tabs button{font-size:10px;padding:7px 8px;gap:4px}\n #kids-journey-root .j-count-tabs button b{font-size:10px;min-width:18px}\n #kids-journey-root .j-week-item{display:block;padding:14px 15px}\n #kids-journey-root .j-week-item h2{font-size:17px}\n #kids-journey-root .j-week-item p{font-size:11px}\n #kids-journey-root .j-week-item .j-task-actions{margin-top:11px}\n #kids-journey-root .j-week-item .j-task-actions a{font-size:11px;padding:10px 12px}\n #kids-journey-root .j-next{display:block;padding:13px 15px;margin:12px 0 20px}\n #kids-journey-root .j-next h2{font-size:15px}\n #kids-journey-root .j-next p:not(.j-overline),#kids-journey-root .j-next small{font-size:10px}\n #kids-journey-root .j-calendar{margin-top:8px;gap:6px}\n #kids-journey-root .j-calendar span{height:32px;gap:0;font-size:9px}\n #kids-journey-root .j-recent,#kids-journey-root .j-grid{grid-template-columns:1fr}\n #kids-journey-root .j-section-title h2{font-size:17px}\n #kids-journey-root .j-achievements{grid-template-columns:1fr 1fr}\n #kids-journey-root .j-achievements b{font-size:24px}\n #kids-journey-root .j-certificate{padding:20px 15px}\n #kids-journey-root .j-skills{gap:14px}\n #kids-journey-root .j-skills>div{font-size:11px}\n #kids-journey-root .j-subtabs{gap:16px}\n #kids-journey-root .j-subtabs button{font-size:12px}\n #kids-journey-root .j-podium{gap:6px}\n #kids-journey-root .j-podium article{padding:14px 5px}\n #kids-journey-root .j-podium article.place-1{padding:24px 5px}\n #kids-journey-root .j-podium h3{font-size:15px}\n #kids-journey-root .j-podium p{font-size:9px}\n #kids-journey-root .j-podium strong{font-size:19px}\n #kids-journey-root .j-my-place{display:block;padding:16px}\n #kids-journey-root .j-my-place>p{margin-top:10px}\n #kids-journey-root dialog{padding:22px 18px}\n #kids-journey-root .j-task-heading{flex-wrap:wrap}\n #kids-journey-root .j-task-heading h3{max-width:100%}\n}\n@media(prefers-reduced-motion:reduce){#kids-journey-root *{transition:none!important;scroll-behavior:auto!important}}\n";document.head.appendChild(s);})();
/* Presentation-only KIDS journey. Mounted solely through the verified pilot hook. */
(function(root){
 'use strict';
 const E=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=v=>Number.isFinite(v)?v.toLocaleString('vi-VN',{maximumFractionDigits:1}):'—',title=v=>String(v||'').toLocaleLowerCase('vi-VN').replace(/(^|\s)\p{L}/gu,c=>c.toLocaleUpperCase('vi-VN'));
 let host=null,model=null,tab='week',filter='all',weekFilter='pending',journeyTab='self',modalId=null,lastInput=null;
 const tabs=[['week','📅','Kế hoạch & Lịch học'],['library','🎬','Bài tập & Video'],['journey','🏆','Kết quả & Xếp hạng']];
 const weekday=value=>{const d=root.KidsJourneyParser.date(value);return d?['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'][new Date(d.at+25200000).getUTCDay()]+', '+d.label:value;};
 const attention=s=>/^(B|F)$/.test(s.paper?.grade||'')||s.stars<0||/CAN|CHU Y|TAP TRUNG|NOI CHUYEN|TRU.*SAO/.test(root.KidsJourneyParser.norm(s.teacherNote));
 const weeklyItem=t=>{const url=learningURL(t.learningUrl);return `<article class="j-week-item ${t.complete?'is-complete':'needs-action'}"><div class="j-work-copy"><span class="j-overline">${t.complete?'ĐÃ HOÀN THÀNH':'BÀI CẦN HOÀN THÀNH'}</span><h2>${E(t.displayTitle)}</h2><p>${E(status(t))}${Number.isFinite(t.percentage)?' · Chất lượng '+fmt(t.percentage)+'%':''}${t.deadline?' · Hạn '+E(t.deadline):''}</p></div><div class="j-task-actions">${!t.complete&&url?`<a class="j-primary" href="${E(url)}">🔗 Mở bài / Nộp bài</a>`:''}<button data-open="${E(t.parent)}">${t.complete?'Xem kết quả & nhận xét':'Xem chi tiết'} ↗</button></div></article>`;};
 function status(t){return t.complete?(t.supplemented?'✅ Đã hoàn thành · Nộp bổ sung':t.comment?'✅ Đã hoàn thành · Có nhận xét của GV':'✅ Đã hoàn thành'):'Chưa hoàn thành'}
 const chip=(label,cls='')=>`<span class="j-chip ${cls}">${E(label)}</span>`;
 function paper(p,verbose){if(!p?.grade)return '';return chip('Sách giấy: '+p.grade+(verbose&&p.grade==='A+'?' · Hoàn thành xuất sắc':''),/^(B|F)$/.test(p.grade)?'notice':'green');}
 function badgeHTML(){return model.badges.map(b=>`<span class="j-badge" title="${E(b.detail)}"><span>${b.icon}</span>${E(b.title)}</span>`).join('')}
 function region(id,html){const el=host.querySelector('#'+id);if(el&&el.innerHTML!==html)el.innerHTML=html;}
 function card(item,kind){
  const video=kind==='video',done=video?item.complete:item.tasks.length?item.tasks.every(t=>t.complete):true;
  return `<button type="button" class="j-card ${done?'is-done':'needs-action'} ${!video&&attention(item)?'has-notice':''}" data-open="${E(item.id)}"><span class="j-card-overline">${E(video?item.program:item.program)}</span><strong>${E(video?'Video '+item.number:'Tiết '+item.number+' · '+item.date)}</strong><span class="j-card-title">${E(video?(item.title==='Video '+item.number?'Luyện nói & thuyết trình':item.title):item.title||'Nội dung buổi học')}</span><span class="j-card-chips">${video?chip(status(item),done?'green':'notice')+(Number.isFinite(item.percentage)?chip('Chất lượng '+fmt(item.percentage)+'%','green'):'')+(item.attempts>1?chip('🔥 '+item.attempts+' lượt luyện tập'):''):item.tasks.map(t=>chip(t.title+': '+(t.complete?'✅ Hoàn thành':'Chưa hoàn thành')+(Number.isFinite(t.percentage)?' · '+fmt(t.percentage)+'%':''),t.complete?'green':'notice')).join('')+paper(item.paper)+(item.stars!==null?chip('⭐ '+(item.stars>=0?'+':'')+fmt(item.stars)+' sao'):'')+(!video&&attention(item)?chip('💬 Lưu ý từ GV','notice'):'')}</span>${video&&item.comment?`<span class="j-excerpt">${E(item.comment.replace(/Chất lượng[^\n]*\n?/i,'').slice(0,135))}${item.comment.length>135?'…':''}</span>`:''}<span class="j-card-link">Xem ${video?'bài tập & nhận xét':'chi tiết buổi học'} <span aria-hidden="true">↗</span></span></button>`;
 }
 function weekHTML(){
  const next=model.future[0],items=weekFilter==='older'?model.older:weekFilter==='done'?model.weeklyDone:model.pending;
  const labels={pending:'📌 Cần làm tuần này',older:'⏳ Cần bổ sung',done:'✅ Đã hoàn thành'},counts={pending:model.pending.length,older:model.older.length,done:model.weeklyDone.length};
  const days=new Map();model.sessions.filter(s=>!s.future).slice(0,12).forEach(s=>{const d=new Date(s.at+25200000).getUTCDay();days.set(d,(days.get(d)||0)+1)});const regular=new Set([...days].filter(([d,n])=>n>=2).map(([d])=>d));
  return `<div class="j-count-tabs" role="group" aria-label="Lọc bài tập">${['pending','older','done'].map(k=>`<button data-count="${k}" aria-pressed="${weekFilter===k}">${labels[k]} <b>${counts[k]}</b></button>`).join('')}</div>
  <section id="j-weekly-work" aria-label="${labels[weekFilter]}"><div class="j-week-list">${items.length?items.map(weeklyItem).join(''):`<p class="j-empty">${weekFilter==='done'?'Chưa có bài hoàn thành trong nhóm này.':weekFilter==='older'?'Không có bài cần bổ sung.':'✅ Đã hoàn thành các bài tập tuần này.'}</p>`}</div></section>
  <section class="j-next"><div><p class="j-overline">📅 BUỔI HỌC KẾ TIẾP</p><h2>${next?'Tiết '+next.number+' · '+weekday(next.date):'Chưa có buổi học kế tiếp'}</h2><p>${E(next?.program||model.className)}${next?.title?' · '+E(next.title):''}</p>${model.future[1]?`<small>Tiếp theo: ${weekday(model.future[1].date)} · Tiết ${model.future[1].number}</small>`:''}</div><div class="j-calendar" aria-label="Lịch học cố định của lớp">${['T2','T3','T4','T5','T6','T7','CN'].map((d,i)=>`<span class="${regular.has((i+1)%7)?'active':''}">${d}<b aria-hidden="true">${regular.has((i+1)%7)?'●':'·'}</b></span>`).join('')}</div></section>
  <section class="j-recent-section"><div class="j-section-title"><h2>Các buổi học gần đây</h2></div><div class="j-recent">${model.recent.map(s=>`<article class="${attention(s)?'has-notice':''}"><div><strong>Tiết ${s.number}</strong><small>${s.date}</small></div><div>${paper(s.paper)}${s.stars!==null?chip('⭐ '+(s.stars>=0?'+':'')+fmt(s.stars)+' sao'):''}${attention(s)?chip('💬 Lưu ý từ GV','notice'):''}</div>${s.teacherNote?`<p class="${attention(s)?'j-note':'j-plain-note'}">${E(s.teacherNote)}</p>`:''}<button data-open="${E(s.id)}">Xem buổi học ↗</button></article>`).join('')}</div></section>`;
 }
 function libraryHTML(){
  const labels=[['all','Tất cả'],['sessions','📘 Bài tập theo tiết học'],['videos','🎬 Chuỗi video thuyết trình'],['retakes','📝 Ôn luyện bài kiểm tra']];
  const sessions=model.sessions.filter(s=>!s.future),retakes=sessions.filter(s=>s.tasks.some(t=>t.type==='retake'));
  let content='';if(filter==='all'||filter==='sessions')content+=`<div class="j-section-title"><h2>Bài tập theo tiết học</h2><span>${sessions.length} buổi</span></div><div class="j-grid">${sessions.map(s=>card(s,'session')).join('')}</div>`;
  if(filter==='all'||filter==='videos')content+=`<div class="j-section-title"><div><p class="j-overline">LUYỆN NÓI & THUYẾT TRÌNH</p><h2>🎬 Chuỗi video thuyết trình</h2></div><span>${model.summary.videoComplete}/${model.summary.videoTotal} bài đã hoàn thành</span></div><div class="j-grid">${model.videos.map(v=>card(v,'video')).join('')}</div>`;
  if(filter==='retakes')content=`<div class="j-section-title"><h2>Làm lại bài kiểm tra</h2></div><div class="j-grid">${retakes.map(s=>card(s,'session')).join('')}</div>`;
  return `<div class="j-section-title"><div><p class="j-overline">KHÁM PHÁ · LUYỆN TẬP · TỰ TIN</p><h2>Bài tập & Video</h2></div></div><div class="j-filters">${labels.map(([key,label])=>`<button data-filter="${key}" aria-pressed="${filter===key}">${E(label)}</button>`).join('')}</div>${content}`;
 }
 function writtenChart(){
  const tests=model.tests;if(!tests.length)return '<p>Mỗi bài kiểm tra sẽ đánh dấu một bước tiến mới của con.</p>';
  const width=Math.max(560,tests.length*150),bars=tests.map((t,i)=>{const x=65+i*(width-100)/tests.length,y=190-t.percentage*1.4;return `<g><title>${E(t.title+' · '+t.date+' · '+t.score+'/'+t.maximum+' · '+fmt(t.percentage)+'%')}</title><rect x="${x}" y="${y}" width="64" height="${t.percentage*1.4}" rx="12" fill="#3b82f6"/><text x="${x+32}" y="${y-12}" text-anchor="middle">${fmt(t.percentage)}%</text><text class="j-chart-label" x="${x+32}" y="215" text-anchor="middle">${E(t.title)}</text><text class="j-chart-label" x="${x+32}" y="237" text-anchor="middle">${E(t.date.slice(0,5))} · ${t.score}/${t.maximum}</text></g>`}).join('');
  const improvements=tests.slice(1).map((t,i)=>t.title===tests[i].title&&t.percentage>tests[i].percentage?chip('🚀 Bứt phá +'+fmt(t.percentage-tests[i].percentage)+'% sau khi con ôn tập lại!','green'):'').join('');
  const retry=model.sessions.flatMap(s=>s.tasks).filter(t=>t.type==='retake'&&t.attempts>1);
  return `<div class="j-chart-scroll"><svg viewBox="0 0 ${width} 260" role="img" aria-label="Biểu đồ điểm kiểm tra giấy của ${E(model.alias)}"><line x1="35" x2="${width-20}" y1="190" y2="190" stroke="#d6e8ef"/>${bars}</svg></div><div class="j-card-chips">${improvements}${retry.map(t=>chip('💪 Con chủ động làm lại đề trên web '+t.attempts+' lần'+(t.score!==null&&t.maximum?' · '+t.score+'/'+t.maximum+' ('+fmt(t.score/t.maximum*100)+'%)':''),'gold')).join('')}</div>`;
 }
 function progressHTML(){
  const s=model.summary;
  return `<div class="j-section-title"><h2>Tổng quan kết quả</h2></div><div class="j-achievements"><article><span>⭐</span><b>${fmt(s.stars)}</b><p>Sao tích lũy</p></article><article><span>🏆</span><b>${s.paperAPlus}/${s.paperGraded}</b><p>Buổi sách giấy đạt A+</p></article><article><span>🎬</span><b>${s.videoComplete}/${s.videoTotal}</b><p>Video đã hoàn thành${s.videoAverage!==null?' · TB '+fmt(s.videoAverage)+'%':''}</p></article><article><span>💪</span><b>${s.practiceAttempts}</b><p>Lượt luyện tập</p></article></div>
  ${model.interviews.map(i=>`<article class="j-certificate"><p class="j-overline">KẾT QUẢ PHỎNG VẤN NÓI</p><h2>Phỏng vấn nói 1-1 cùng giáo viên</h2><p>${i.date}</p><strong class="j-cert-score">${i.score} <span>/ ${i.maximum}</span></strong>${/^https:\/\//.test(i.videoUrl||i.resultUrl||'')?`<div class="j-task-actions j-interview-video"><a class="j-primary" href="${E(i.videoUrl||i.resultUrl)}" target="_blank" rel="noopener noreferrer">🎥 Xem video phỏng vấn của con</a></div>`:''}<p>${fmt(i.percentage)}% · mức độ hoàn thành</p><div class="j-skills">${i.criteria.map((c,n)=>`<div><span>${['🌟','🧩','📘','💬'][n%4]} ${E(c.title)}</span><b>${fmt(c.score)} / ${c.maximum}</b><meter min="0" max="${c.maximum}" value="${c.score}">${fmt(c.score/c.maximum*100)}%</meter></div>`).join('')}</div>${i.comment?`<blockquote>${E(i.comment)}</blockquote>`:''}</article>`).join('')}
  <p class="j-footnote">Chất lượng video trung bình chỉ tính các video đã có điểm nhận xét.</p><section class="j-chart"><p class="j-overline">ÔN LẠI · THỬ LẠI · TIẾN BỘ</p><h2>📈 Hành trình kiểm tra định kỳ</h2>${writtenChart()}</section>`;
 }
 function raceHTML(){
  const board=model.board||[],me=board.find(x=>x.alias===model.alias),top=[board[1],board[0],board[2]].filter(Boolean);
  return `<section class="j-race-banner"><p class="j-overline">KẾT QUẢ THI ĐUA</p><h2>Xếp hạng lớp</h2><p>Xếp hạng theo sao tích lũy trong giai đoạn hiển thị.</p></section><div class="j-podium">${top.map(b=>`<article class="place-${b===board[0]?1:b===board[1]?2:3}"><span>${b===board[0]?'🏆':b===board[1]?'🥈':'🥉'}</span><small>HẠNG ${b.rank}</small><h3>${E(b.alias)}</h3><p>${E(title(b.fullName))}</p><strong>⭐ ${fmt(b.stars)}</strong></article>`).join('')}</div><article class="j-my-place"><div><p class="j-overline">📍 VỊ TRÍ CỦA ${E(model.alias)}</p><h2>${me?'Hạng '+me.rank+' / '+board.length+' bạn':'Chưa có thứ hạng'}</h2></div><p>Theo dõi kết quả và duy trì luyện tập đều đặn.</p></article><div class="j-table-scroll"><table><caption>Bảng vàng cả lớp · Số đếm từ bảng theo dõi hiện tại</caption><thead><tr><th>Hạng</th><th>Học sinh</th><th>⭐ Sao tích lũy</th><th>🏆 Sách giấy A+</th><th>🎬 Video hoàn thành</th><th>📝 Kiểm tra TB</th></tr></thead><tbody>${board.map(b=>`<tr class="${b.alias===model.alias?'is-self':''}"><td>${b.rank}</td><th scope="row">${E(b.alias)}<small>${E(title(b.fullName))}</small></th><td>${fmt(b.stars)}</td><td>${b.paperAPlus}/${b.paperGraded} buổi</td><td>${b.videoComplete}/${b.videoTotal} bài</td><td>${fmt(b.testAverage)}%</td></tr>`).join('')}</tbody></table></div><p class="j-footnote">Xếp hạng theo tổng sao tích lũy trong bảng theo dõi; cùng số sao, cùng hạng. Chỉ tính buổi đã diễn ra và điểm đã có. Bài chưa chấm không bị coi là điểm 0.</p>`;
 }
 function journeyHTML(){return `<div class="j-subtabs" role="tablist" aria-label="Hành trình của con và cả lớp"><button role="tab" aria-selected="${journeyTab==='self'}" data-journey="self">Tiến bộ học tập</button><button role="tab" aria-selected="${journeyTab==='class'}" data-journey="class">Xếp hạng lớp</button></div>${journeyTab==='self'?progressHTML():raceHTML()}`;}
 function learningURL(value){
  try{const lesson=new URL(value,location.href);if(lesson.origin!==location.origin)return lesson.protocol==='https:'?lesson.href:'';
   const u=new URL('/student-learning/kids-ta-entry/',location.origin);u.search=new URLSearchParams({lesson:lesson.href,mtt_name:model.alias,mtt_class:model.className,mtt_english:model.alias});
   return root.LessonDashboardEntry?.link(u.href,location.hash)||u.href;
  }catch(_){return ''}
 }
 function commentsHTML(comment,complete){
  const clean=String(comment||'').replace(/^\s*Chất lượng[^\n]*\n?/i,'').trim();
  return clean?clean.split(/\n+/).filter(Boolean).map(line=>{const i=line.indexOf(':');return `<p>${i>0&&i<100?'<b>'+E(line.slice(0,i+1))+'</b>'+E(line.slice(i+1)):E(line)}</p>`}).join(''):complete?'<p>Đã ghi nhận bài nộp.</p>':'<p>Chưa có nhận xét của giáo viên.</p>';
 }
 function detailHTML(item){
  const tasks=item.tasks||[item];
  return `<p class="j-overline">${E(item.program||model.className)}${item.date?' · '+E(item.date):''}</p><h2 id="j-modal-title">${E(item.tasks?'Tiết '+item.number+' · '+(item.title||'Buổi học của con'):item.program+' · Video '+item.number)}</h2><div class="j-detail-chips">${paper(item.paper,true)}${item.stars!==undefined&&item.stars!==null?chip('⭐ +'+fmt(item.stars)+' Sao','gold'):''}</div>${item.teacherNote?`<section class="j-love-note ${attention(item)?'has-notice':''}"><h3>${attention(item)?'💬 Lưu ý từ GV':'Nhận xét trên lớp'}</h3><p>${E(item.teacherNote)}</p></section>`:''}${item.paper?.grade==='B'?'<p class="j-note">Sách giấy B · Cần lưu ý hoàn thiện thêm bài tập.</p>':''}
  ${tasks.map(t=>{const url=learningURL(t.learningUrl);return `<section class="j-task-detail"><div class="j-task-heading"><h3>${E(item.tasks?t.title:"Nhận xét của giáo viên")}</h3>${Number.isFinite(t.percentage)?chip('Chất lượng '+fmt(t.percentage)+'%','green'):''}</div><p class="j-task-status">${E(status(t))}${t.submittedAt?' · '+E(t.submittedAt):''}</p>${t.attempts>1?`<p class="j-persistence">🔥 ${t.attempts} lượt luyện tập</p>`:''}<div class="j-teacher-comment">${commentsHTML(t.comment,t.complete)}</div><div class="j-task-actions">${url?`<a class="j-primary" href="${E(url)}">${t.type==='retake'?'Làm lại bài kiểm tra':'🔗 Mở bài / Nộp bài'}</a>`:''}${(t.latestLinks?.length?t.latestLinks:t.links?.slice(-1)||[]).map((u,i)=>`<a href="${E(u)}" target="_blank" rel="noopener noreferrer">🔗 Xem bài quay của con${i?' '+(i+1):''}</a>`).join('')}</div>${(t.links||[]).length>1?`<details class="j-all-evidence"><summary>Xem tất cả bài con đã gửi (${t.links.length} tệp) ↓</summary>${t.links.map((u,i)=>`<a href="${E(u)}" target="_blank" rel="noopener noreferrer">Bài con đã gửi · Tệp ${i+1} ↗</a>`).join('')}</details>`:''}</section>`}).join('')}`;
 }
 function showDetail(id){
  const item=[...model.sessions,...model.videos].find(s=>s.id===id);if(!item)return;
  modalId=id;const dialog=host.querySelector('#j-detail'),html=detailHTML(item),content=dialog.querySelector('#j-detail-content');if(content.innerHTML!==html)content.innerHTML=html;
  if(!dialog.open){if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');}
 }
 function paint(){
  if(!model||!host)return;
  region('j-header',`<div class="j-brand"><img src="${E(lastInput.dashboard.logoUrl||document.getElementById('brandLogo')?.src||'')}" alt="Ms. Trang Trieu Education"><div><p>MS. TRANG TRIEU EDUCATION</p><h1>${E(model.alias)} <span>· ${E(title(model.fullName))}</span></h1><small>${E(model.className)} · Hành trình từ ${E(model.periodStart)}</small></div></div><div class="j-header-metrics"><div class="j-inline-stats"><span>⭐ <b>${fmt(model.summary.stars)}</b> Sao tích lũy</span><span>🅰️ <b>${model.summary.paperAPlus}</b> Buổi A+</span></div><div class="j-badges">${badgeHTML()}</div></div>`);
  region('j-tabs',tabs.map(([key,icon,label])=>`<button role="tab" data-tab="${key}" aria-controls="j-panel" aria-selected="${tab===key}" tabindex="${tab===key?'0':'-1'}"><span>${icon}</span>${label}</button>`).join(''));
  host.querySelector('#j-panel').setAttribute('aria-label',tabs.find(x=>x[0]===tab)[2]);
  region('j-panel',tab==='week'?weekHTML():tab==='library'?libraryHTML():journeyHTML());
  if(modalId&&host.querySelector('#j-detail').open)showDetail(modalId);
 }
 function mount(){
  if(host)return;host=document.createElement('main');host.id='kids-journey-root';
  host.innerHTML='<header id="j-header"></header><nav id="j-tabs" role="tablist" aria-label="Hồ sơ học tập"></nav><section id="j-panel" role="tabpanel"></section><footer class="j-footer">Ms. Trang Trieu Education</footer><dialog id="j-detail" aria-labelledby="j-modal-title"><button type="button" class="j-modal-close" aria-label="Đóng chi tiết">×</button><div id="j-detail-content"></div></dialog>';
  document.getElementById('dashboardShell').prepend(host);document.body.classList.add('kids-journey-pilot');
  document.getElementById('pendingWorkGateOpen')?.addEventListener('click',()=>{if(!model||!host)return;tab='week';weekFilter='pending';paint();host.querySelector('[data-count="pending"]')?.focus({preventScroll:true});});
  host.addEventListener('click',event=>{
   const button=event.target.closest('button');if(!button)return;
   if(button.dataset.tab){tab=button.dataset.tab;paint();host.querySelector(`[data-tab="${tab}"]`).focus({preventScroll:true});}
   else if(button.dataset.filter){filter=button.dataset.filter;paint()}
   else if(button.dataset.journey){journeyTab=button.dataset.journey;paint()}
   else if(button.dataset.open)showDetail(button.dataset.open);
   else if(button.hasAttribute('data-refresh'))document.getElementById('refreshBtn')?.click();
   else if(button.classList.contains('j-modal-close')){host.querySelector('#j-detail').close();modalId=null;}
   else if(button.dataset.count){weekFilter=button.dataset.count;paint();host.querySelector(`[data-count="${weekFilter}"]`).focus({preventScroll:true});}
  });
  host.querySelector('#j-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();let i=tabs.findIndex(x=>x[0]===tab);i=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;tab=tabs[i][0];paint();host.querySelector(`[data-tab="${tab}"]`).focus()});
  const dialog=host.querySelector('#j-detail');dialog.addEventListener('click',e=>{if(e.target===dialog){dialog.close();modalId=null}});dialog.addEventListener('close',()=>modalId=null);
 }
 function update(input){
  if(input.profile?.classNumber!==21||input.profile?.englishName!=='BEAN'||!input.profile.kidsJourneyV1)return false;
  lastInput={...input,dashboard:{...input.dashboard,logoUrl:document.getElementById('brandLogo')?.src||'https://mstrangtrieueducation-droid.github.io/assets/brand-4522e70bbb8e7a81.jpg'}};model=root.KidsJourneyModel.build(input.profile.kidsJourneyV1,input);mount();paint();return true;
 }
 function disable(){if(host){host.remove();host=null;}model=null;modalId=null;document.body.classList.remove('kids-journey-pilot');}
 root.KidsJourneyPilot={update,disable};root.addEventListener('hashchange',disable);root.dispatchEvent(new Event('titi-dashboard-ready'));
})(window);
