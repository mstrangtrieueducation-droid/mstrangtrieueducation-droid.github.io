/* Presentation only. The notice bell never read Shadowing comments, which live in their own list, or Writing test reviews, which live in their own service, and it stays silent about a comment on a task this browser has not seen yet. Feeds the page's own bell from what the page already may read; never changes marks, status, receipts or counts. */
(function(root){'use strict';
 const bell=root.NativeUpdatesBell;
 if(!bell||bell.ieltsCommentNotices)return;
 const RECENT_MS=7*864e5,REVIEW_RECENT_MS=60*864e5,PREFIX='mtt_ielts_comment_notices_v1_',REVIEW_PREFIX='mtt_ielts_review_notices_v1_',REVIEW_ID='writing-review:',render=bell.render;
 const hash=v=>{let n=2166136261;for(const c of String(v)){n^=c.charCodeAt(0);n=Math.imul(n,16777619)}return(n>>>0).toString(36)};
 const stamp=v=>root.IeltsStudyPlannerModel?.timestamp?.(v,false)||0;
 function load(key){try{const value=JSON.parse(root.localStorage.getItem(key));return Array.isArray(value)?new Set(value):null;}catch{return null;}}
 function save(key,ids){try{root.localStorage.setItem(key,JSON.stringify(ids));}catch{}}
 // One row per Shadowing task, comment or not, so a comment added later is a change to a row the bell already knows.
 function shadowRecords(byId){
  const tasks=root.IeltsStudyHub?.model?.()?.tasks,list=typeof state==='object'?state.student?.shadowingFeedback:null;
  if(!Array.isArray(tasks)||!Array.isArray(list)||!root.ShadowingFeedback)return [];
  return tasks.filter(task=>task.skill==='shadowing').map(task=>{
   const found=root.ShadowingFeedback.find(list,task.source,state.dashboard?.shadowingAssignments),base=byId.get('task:'+task.id);
   return {id:'shadow:'+task.id,kind:'result',at:base?.at||0,label:base?.label||String(task.title||''),score:'',feedback:String(found?.comment||''),receiptAt:stamp(found?.submittedAt)};
  });
 }
 // Writing test reviews exist only on the classes with the review launcher. Read once per page open, the same list the launcher reads; a failed read just adds nothing.
 let reviews=null,reviewRead=false,lastInput=null,lastThis=null;
 function readReviews(){
  const endpoint=root.document.querySelector('script[data-assessment-endpoint]')?.dataset.assessmentEndpoint,access=root.ieltsParentAccess||(typeof ieltsParentAccess==='object'?ieltsParentAccess:null);
  if(reviewRead||!endpoint||!access?.token)return;
  reviewRead=true;
  const token=access.token;
  root.fetch(endpoint,{method:'POST',mode:'cors',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',headers:{'content-type':'application/json'},body:JSON.stringify({className:access.className,token,action:'index'})})
   .then(response=>response.ok?response.json():null)
   .then(envelope=>{
    if(envelope?.ok!==true||!Array.isArray(envelope.data?.reviews)||access.token!==token)return;
    reviews=envelope.data.reviews.map(row=>({id:REVIEW_ID+row.assessmentKey+'|'+row.attempt,kind:'result',at:stamp(row.examDate),label:String(row.title||'Bài kiểm tra Writing')+' · Bài chữa',score:row.classOverall==null?'':String(row.classOverall),feedback:String(row.reviewObjectSha256||row.assessmentKey)}));
    if(lastInput)bell.render.call(lastThis,lastInput);
   }).catch(()=>{});
 }
 bell.render=function(input){
  if(!input?.profileKey||!Array.isArray(input.records))return render.apply(this,arguments);
  lastInput=input;lastThis=this;
  readReviews();
  const records=[...input.records,...shadowRecords(new Map(input.records.map(r=>[r.id,r]))),...(reviews||[])],now=Date.now();
  const key=PREFIX+hash(input.profileKey),reviewKey=REVIEW_PREFIX+hash(input.profileKey),known=load(key),reviewKnown=load(reviewKey);
  const isReview=r=>r.id.startsWith(REVIEW_ID);
  // The source records no time for a comment, so a first open counts it as new when the work it marks is recent. A test review is returned well after the exam, so its window is wider.
  const recent=r=>{const at=isReview(r)?Number(r.at):r.kind==='task'?Number(r.receiptAt):Number(r.receiptAt||r.at);return at>0&&at<=now&&now-at<=(isReview(r)?REVIEW_RECENT_MS:RECENT_MS);};
  const announce=r=>{const set=isReview(r)?reviewKnown:known;return r.feedback&&(set?!set.has(r.id):recent(r));};
  const quiet=records.map(r=>announce(r)?{...r,feedback:'',score:''}:r);
  const output={...input,records,onSelect:event=>{
   if(event.recordId.startsWith(REVIEW_ID)){root.document.querySelector('#wa-assessment-launcher .wa-button')?.click();return;}
   return input.onSelect?.(event.recordId.startsWith('shadow:')?{...event,recordId:'task:'+event.recordId.slice(7)}:event);
  }};
  // The bell only announces a comment on a row it already holds, so the row goes in first without it.
  if(!known||quiet.some((r,i)=>r!==records[i]))render.call(this,{...output,records:quiet});
  save(key,records.filter(r=>!isReview(r)).map(r=>r.id));
  if(reviews)save(reviewKey,reviews.map(r=>r.id));
  return render.call(this,output);
 };
 bell.ieltsCommentNotices=true;
})(globalThis);
