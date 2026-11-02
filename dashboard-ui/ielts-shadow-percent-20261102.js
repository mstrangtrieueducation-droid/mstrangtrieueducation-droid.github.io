/* Presentation only. IELTS Shadowing keeps its grade in the teacher comment ("Chất lượng: đạt 75%"), and the task list never shows it. Reads the profile the page already loaded; never changes marks, status, receipts or counts. */
(function(root){'use strict';
 const D=root.document,E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const LINE=/^\s*Chất lượng[^\n%]*?(\d+(?:[.,]\d+)?)\s*%/im,CODE=/SHADOW-L\d+-\d+/i;
 let grades=new Map,queued=false;

 function collect(profile){
  const list=profile?.student?.shadowingFeedback;
  if(!Array.isArray(list))return;
  const byCode=new Map;
  for(const row of list){
   const code=String(row?.code||'').toUpperCase(),m=String(row?.comment||'').match(LINE);
   if(!code||!m)continue;
   const value=Number(m[1].replace(',','.'));
   if(!(value>=0&&value<=100))continue;
   if(!byCode.has(code))byCode.set(code,[]);
   byCode.get(code).push({due:String(row.dueDate||''),text:m[1]+'%'});
  }
  grades=byCode;schedule();
 }
 // One code can be set again with a new deadline, so the card's own deadline chooses between grades.
 function gradeFor(card){
  const rows=grades.get((card.querySelector('.master-title')?.textContent.match(CODE)||[''])[0].toUpperCase());
  if(!rows)return null;
  if(rows.length===1)return rows[0];
  const due=card.querySelector('.master-card-text p')?.textContent||'';
  return rows.find(r=>r.due&&due.includes(r.due))||null;
 }
 function paint(){
  queued=false;
  for(const card of D.querySelectorAll('#panel-homework article.master-card')){
   const slot=card.querySelector('.master-result');
   if(!slot)continue;
   const row=gradeFor(card),shown=slot.querySelector('[data-isp]');
   if(shown&&(!row||shown.dataset.isp!==row.text))shown.remove();
   if(row&&!slot.querySelector('[data-isp]'))slot.insertAdjacentHTML('beforeend',`<span class="isp-grade" data-isp="${E(row.text)}">Chất lượng ${E(row.text)}</span>`);
  }
 }
 function schedule(){if(!queued){queued=true;root.requestAnimationFrame(paint);}}
 // Sees the page's own requests as they finish, so no extra download is made.
 function install(){
  const access=typeof ieltsParentAccess==='object'?ieltsParentAccess:null;
  if(!access||access.__shadowPercentUI)return;
  access.__shadowPercentUI=true;
  const request=access.request;
  access.request=function(){
   const result=request.apply(this,arguments);
   Promise.resolve(result).then(collect,()=>{});
   return result;
  };
 }
 install();
 new MutationObserver(()=>{install();schedule();}).observe(D.documentElement,{childList:true,subtree:true});
 const style=D.createElement('style');style.textContent=`
 .isp-grade{display:block;width:max-content;max-width:100%;margin-top:6px;padding:3px 9px;border-radius:999px;background:#eaf5ed;color:#1b5e20;font-size:12px;font-weight:700;white-space:nowrap}
 `;D.head.append(style);
})(window);
