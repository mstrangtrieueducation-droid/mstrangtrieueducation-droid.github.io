/* Presentation only. Web homework keeps its grade in the teacher comment ("Chất lượng: đạt khoảng 85%") with no numeric field, and native views strip that line, so no percentage shows. Never changes marks, status, receipts or counts. */
(function(root){'use strict';
 const D=root.document,E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const LINE=/^\s*Chất lượng[^\n%]*?(\d+(?:[.,]\d+)?)\s*%/im,FIRST=/^\s*Chất lượng[^\n]*\n?/i;
 const tone=v=>v>=85?'emerald':v>=70?'blue':v>=50?'amber':'rose';
 const profile=()=>(root.location.hash.match(/[#&]p=([^&?]+)/)||[])[1]||root.location.hash;
 const squeeze=v=>String(v||'').replace(/\s+/g,'');
 let byParent=new Map,byTask=new Map,byDetail=new Map,owner='',queued=false;

 function grade(item,label){
  if(Number.isFinite(item.percentage))return null;
  const m=String(item.comment||'').match(LINE);if(!m)return null;
  const value=Number(m[1].replace(',','.'));
  return value>=0&&value<=100?{label,value,text:m[1]+'%'}:null;
 }
 // The dialog has no task id, so its task is recognised by title and the comment it renders. Two tasks that read the same but grade differently show nothing.
 function detailKey(title,comment,complete){
  const body=String(comment||'').replace(FIRST,'').trim()||(complete?'Đã ghi nhận bài nộp.':'Chưa có nhận xét của giáo viên.');
  return squeeze(title)+'|'+squeeze(body);
 }
 function remember(item,title,row){
  byTask.set(String(item.id),row);
  const key=detailKey(title,item.comment,item.complete),seen=byDetail.get(key);
  byDetail.set(key,seen===undefined||seen&&seen.text===row.text?row:null);
 }
 function collect(model){
  byParent=new Map;byTask=new Map;byDetail=new Map;
  for(const s of model?.sessions||[]){
   const rows=[];
   for(const t of s.tasks||[]){
    const row=grade(t,t.title||'Bài tập');
    if(row){rows.push(row);remember(t,t.title||'Bài tự luyện',row);}
   }
   if(rows.length)byParent.set(String(s.id),rows);
  }
  for(const v of model?.videos||[]){
   const row=grade(v,'Chất lượng');
   if(row){byParent.set(String(v.id),[row]);remember(v,'Video tự luyện',row);}
   for(const c of v.components||[]){
    const part=grade(c,c.title||'Chất lượng');
    if(part)remember(c,c.title||'Bài tự luyện',part);
   }
  }
 }
 function bars(rows){
  return rows.map(r=>`<div class="j-progress-row ${tone(r.value)}"><div><span>${E(r.label)}</span><b>${E(r.text)}</b></div><div class="j-track" role="progressbar" aria-label="${E(r.label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${r.value}"><span style="width:${r.value}%"></span></div></div>`).join('');
 }
 function holder(rows){
  const span=D.createElement('span');
  span.dataset.kgp='';span.style.display='contents';span.innerHTML=bars(rows);
  return span;
 }
 function paint(){
  queued=false;
  if(owner!==profile())return;
  for(const row of D.querySelectorAll('#kids-journey-root .j-card[data-open],#kids-journey-root .bc-journal-row[data-open]')){
   const rows=byParent.get(row.dataset.open);
   if(!rows||row.querySelector('[data-kgp]'))continue;
   const box=row.querySelector('.j-card-quality')||D.createElement('span');
   box.classList.add('j-card-quality');
   box.append(holder(rows));
   if(!box.isConnected)(row.querySelector('.j-card-chips')||row.lastElementChild).after(box);
  }
  // Library rows are keyed "group::id". A video row's native bar only says "Chưa có điểm" here, so it is replaced.
  for(const row of D.querySelectorAll('#kids-journey-root .ka-row[data-archive-detail]')){
   const key=row.dataset.archiveDetail,rows=byParent.get(key.slice(key.indexOf('::')+2));
   if(!rows||row.querySelector('[data-kgp]'))continue;
   let box=row.querySelector('.ka-row-progress');
   if(box)box.textContent='';
   else{box=D.createElement('span');box.className='ka-row-progress';row.querySelector('.ka-row-copy')?.append(box);}
   box.append(holder(rows));
  }
  for(const task of D.querySelectorAll('#kids-journey-root [data-schedule-task]')){
   const row=byTask.get(task.dataset.scheduleTask),line=task.querySelector('.sh-actions>span');
   if(!row||!line||task.querySelector('[data-kgp]'))continue;
   line.insertAdjacentHTML('beforeend',`<b data-kgp> · Chất lượng ${E(row.text)}</b>`);
  }
  for(const task of D.querySelectorAll('#j-detail .j-task-detail.bc-native-task')){
   if(task.querySelector('[data-kgp]'))continue;
   const facts=task.querySelector('.bc-receipt-facts'),feedback=task.querySelector('.bc-native-feedback');
   if(!facts||!feedback)continue;
   const copy=feedback.cloneNode(true);copy.querySelector('h4')?.remove();
   const row=byDetail.get(squeeze(task.querySelector('h3')?.textContent)+'|'+squeeze(copy.textContent));
   if(row)facts.insertAdjacentHTML('beforeend',`<div data-kgp><dt>Chất lượng bài làm</dt><dd>${E(row.text)}</dd></div>`);
  }
  // A single-video dialog shows one native quality bar and one comment.
  for(const body of D.querySelectorAll('#j-detail .ka-video-body')){
   const slot=body.querySelector('.bc-video-quality'),feedback=body.querySelector('.ka-session-feedback');
   if(!slot||!feedback||slot.querySelector('[data-kgp]')||slot.querySelector('.j-track'))continue;
   const copy=feedback.cloneNode(true);copy.querySelector('h3')?.remove();
   const row=byDetail.get(squeeze('Video tự luyện')+'|'+squeeze(copy.textContent));
   if(row){slot.textContent='';slot.append(holder([{...row,label:'Chất lượng bài tự luyện'}]));}
  }
 }
 function schedule(){if(!queued){queued=true;root.requestAnimationFrame(paint);}}
 function install(){
  const model=root.TrialKidsJourneyModel;
  if(!model||model.__gradePercentUI)return;
  model.__gradePercentUI=true;
  const build=model.build;
  model.build=function(){const result=build.apply(this,arguments);collect(result);owner=profile();schedule();return result;};
 }
 root.addEventListener('titi-dashboard-ready',install,true);
 new MutationObserver(schedule).observe(D.documentElement,{childList:true,subtree:true});
 install();
 const style=D.createElement('style');style.textContent=`
 #kids-journey-root .bc-journal-row>.j-card-quality{flex:1 1 100%;grid-column:1/-1;margin-top:8px}
 `;D.head.append(style);
})(window);
