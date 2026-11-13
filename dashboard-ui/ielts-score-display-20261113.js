/* IELTS_SCORE_DISPLAY_V1 (owner 13/11/2026: "ielts speaking hay shadow đều có % hay band điểm... tìm cách hiển thị thật hiệu quả").
   Presentation only. Reads the comment text the page already shows; never fetches, grades, counts or changes a submission.
   1. Speaking: the grader writes two formats. Old: "🎯 Estimated Band: 5.5" + "• Pronunciation:".
      New (from late 10/2026): "IELTS Speaking: Band ước tính 5.5." + "• Fluency & Coherence (5):".
      The frozen parser only knew the old one, so new comments lost their band and all but one criterion.
      The text is rewritten into the old shape before the frozen parser reads it; criterion bands are shown on each tile.
   2. One score block for every skill: big band or %, colour by level, bar, criteria chips (Speaking, Shadowing, Writing).
   3. The "Nhận xét của cô trên bảng theo dõi" fallback keeps only lines that are not already shown on the card. */
(function(root){
 'use strict';
 if(root.IeltsScoreDisplay)return;
 const doc=root.document;
 const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
 const num=v=>{const t=String(v==null?'':v).replace(',','.').trim();if(!/^\d+(?:\.\d+)?$/.test(t))return null;const n=Number(t);return Number.isFinite(n)?n:null};
 const fmtBand=n=>Number.isInteger(n)?n.toFixed(1):String(n);
 function bandLevel(n){return n>=7?'high':n>=5.5?'good':n>=4.5?'mid':'low'}
 function pctLevel(n){return n>=80?'high':n>=60?'good':n>=40?'mid':'low'}
 const levelWord={high:'Tốt',good:'Khá',mid:'Cần cố gắng',low:'Cần luyện thêm'};

 // ---------- Speaking text normalisation ----------
 const CRIT=[
  ['pronunciation',/Pronunciation/i,'Phát âm'],
  ['fluency',/Fluency\s*&\s*Coherence/i,'Độ trôi chảy & liên kết'],
  ['lexical',/Lexical Resource/i,'Từ vựng'],
  ['grammar',/Grammatical Range\s*&\s*Accuracy/i,'Ngữ pháp']
 ];
 function speakingNormalize(value){
  let text=String(value==null?'':value);const scores={};let band=null;
  const oldBand=/Estimated Band\s*:\s*(\d+(?:[.,]\d+)?)/i.exec(text);
  const newBand=/IELTS Speaking\s*:\s*Band ước tính\s*(\d+(?:[.,]\d+)?)\.?/i.exec(text);
  if(oldBand)band=num(oldBand[1]);
  else if(newBand){band=num(newBand[1]);text=text.replace(newBand[0],'🎯 Estimated Band: '+newBand[1].replace(',','.'));}
  text=text.replace(/^(\s*[•*]?\s*)(Pronunciation|Fluency\s*&\s*Coherence|Lexical Resource|Grammatical Range\s*&\s*Accuracy)\s*\(\s*(\d+(?:[.,]\d+)?)\s*\)\s*:/gim,(all,lead,name,score)=>{
   const c=CRIT.find(x=>x[1].test(name));if(c)scores[c[0]]=num(score);return lead+name+':';});
  const line=/Phát âm:\s*([\d.,]+)\s*·\s*Trôi chảy:\s*([\d.,]+)\s*·\s*Từ vựng:\s*([\d.,]+)\s*·\s*Ngữ pháp:\s*([\d.,]+)/i.exec(text);
  if(line){['pronunciation','fluency','lexical','grammar'].forEach((k,i)=>{if(scores[k]==null)scores[k]=num(line[i+1])});}
  return{text,band,scores};
 }
 function bar(fraction,level){return '<span class="isd-bar"><i class="isd-'+level+'" style="width:'+Math.max(4,Math.min(100,Math.round(fraction*100)))+'%"></i></span>'}
 function scoreBlock(kind,value,label,chips){
  const isBand=kind==='band',level=isBand?bandLevel(value):pctLevel(value);
  const shown=isBand?fmtBand(value):(Math.round(value*10)/10)+'%';
  return '<div class="isd-score isd-'+level+'" data-isd="'+kind+'"><div class="isd-num"><b>'+esc(shown)+'</b><small>'+esc(label)+'</small></div>'+
   '<div class="isd-meta"><span class="isd-word">'+esc(levelWord[level])+'</span>'+bar(isBand?value/9:value/100,level)+
   (chips&&chips.length?'<div class="isd-chips">'+chips.map(c=>'<span class="isd-chip isd-'+bandLevel(c[1])+'"><em>'+esc(c[0])+'</em>'+esc(fmtBand(c[1]))+'</span>').join('')+'</div>':'')+'</div></div>';
 }

 function patchSpeaking(){
  const api=root.IeltsSpeakingFeedback;if(!api||api.__isd)return !!api;
  const parse0=api.parse,render0=api.render;
  api.parse=function(value){return parse0.call(this,speakingNormalize(value).text)};
  api.render=function(value,key){
   const n=speakingNormalize(value);let html=render0.call(this,n.text,key);if(!html)return html;
   CRIT.forEach(([id,,label])=>{const s=n.scores[id];if(s==null)return;
    const tag='<h4>'+esc(label)+'</h4>';
    html=html.split(tag).join('<h4>'+esc(label)+' <span class="isd-crit isd-'+bandLevel(s)+'">'+esc(fmtBand(s))+'</span></h4>'+bar(s/9,bandLevel(s)));});
   if(n.band!=null){
    const chips=CRIT.filter(c=>n.scores[c[0]]!=null).map(c=>[c[2],n.scores[c[0]]]);
    html=html.replace(/<span class="speaking-feedback-band">[\s\S]*?<\/span><\/header>/,'</header>'+scoreBlock('band',n.band,'Band ước tính bài nói',html.includes('isd-crit')?null:chips));
   }
   return html;
  };
  api.__isd=true;return true;
 }

 // ---------- Shadowing ----------
 function patchShadowing(){
  const api=root.ShadowingFeedback;if(!api||api.__isd)return !!api;
  const render0=api.render;
  api.render=function(record,key){
   let html=render0.call(this,record,key);if(!html)return html;
   return html.replace(/(<header class="shadow-feedback-head"><strong>Nhận xét Shadowing<\/strong>)<span>([^<]*?(\d+(?:[.,]\d+)?)\s*%[^<]*)<\/span>(<\/header>)/,(all,head,text,p,end)=>{
    const v=num(p);return v==null?all:head+end+scoreBlock('pct',v,'Chất lượng bài Shadowing');});
  };
  api.__isd=true;return true;
 }

 // ---------- Writing (DOM: .wr-summary .wr-verdict) ----------
 function writingCriteria(text){
  const after=/sau khi trừ\s*:?\s*([^)]*)\)/i.exec(text),base=/tiêu chí\s*:\s*([^)]*)\)/i.exec(text);
  const src=(after||base||[])[1]||'';const out=[];
  src.replace(/\b(TR|TA|CC|LR|GRA)\s*([\d.,]+)/g,(m,k,v)=>{const n=num(v);if(n!=null)out.push([k,n]);});
  return out;
 }
 function enhanceWriting(scope){
  scope.querySelectorAll('.wr-summary .wr-verdict:not([data-isd-done])').forEach(v=>{
   v.setAttribute('data-isd-done','1');
   const t=v.textContent.trim();const band=/^Band\s*([\d.,]+)/i.exec(t),pct=/([\d.,]+)\s*%/.exec(t);
   const card=v.closest('.wr-summary');const overall=card&&card.querySelector('.wr-overall');
   let html='';
   if(band){const n=num(band[1]);if(n!=null)html=scoreBlock('band',n,'Band bài viết',writingCriteria(overall?overall.textContent:''));}
   else if(pct){const n=num(pct[1]);if(n!=null)html=scoreBlock('pct',n,'Chất lượng bài viết trên lớp');}
   if(!html)return;
   const holder=doc.createElement('div');holder.className='isd-writing';holder.innerHTML=html;
   v.hidden=true;v.style.display='none';v.insertAdjacentElement('afterend',holder);
  });
 }

 // ---------- Fallback block: keep only what the card does not already show ----------
 const norm=s=>String(s||'').normalize('NFC').replace(/^\s*(?:[-•*]|\d+[.)])\s*/,'').replace(/\s+/g,' ').trim().toLowerCase();
 function tidyFallback(scope){
  scope.querySelectorAll('section.native-tracker-teacher-comment:not([data-isd-done])').forEach(sec=>{
   sec.setAttribute('data-isd-done','1');
   const p=sec.querySelector('p');if(!p)return;
   const host=sec.closest('dialog')||sec.parentElement||doc.body;
   if(host.querySelector('.wr-summary,.speaking-feedback-card,.shadow-feedback-card'))return;   // the card already shows the comment
   sec.classList.add('isd-keep');const h=sec.querySelector('h3');if(h)h.textContent='Nhận xét của cô';
   const clone=host.cloneNode(true);clone.querySelectorAll('section.native-tracker-teacher-comment').forEach(x=>x.remove());
   const shown=norm(clone.textContent);
   const hasScore=!!host.querySelector('.isd-score');
   const keep=p.textContent.split(/\n+/).filter(line=>{
    const l=line.trim();if(!l)return false;
    if(/^【[^】]*】$/.test(l))return false;                                   // writing markers like 【Bài 2.2 · band 6.5】
    if(hasScore&&/(Band ước tính|Estimated Band|^Phát âm:\s*[\d.,]+\s*·|^Chất lượng:\s*đạt)/i.test(l))return false;
    if(/^[•*]?\s*(Pronunciation|Fluency\s*&\s*Coherence|Lexical Resource|Grammatical Range\s*&\s*Accuracy)\s*(\([\d.,\s]*\))?\s*:$/i.test(l))return false;
    if(/^(?:👉\s*)?Lời khuyên trọng tâm\s*:?$/i.test(l))return false;
    const n=norm(l);return n&&!shown.includes(n);
   });
   if(!keep.length){sec.hidden=true;sec.style.display='none';return;}
   p.textContent=keep.join('\n');
  });
 }

 // ---------- List cards: colour the existing score chip by level ----------
 function enhanceChips(scope){
  scope.querySelectorAll('.master-result span:not([data-isd-chip])').forEach(el=>{
   if(el.children.length)return;const t=el.textContent.trim();
   const b=/^Band(?: ước tính)?\s*(\d+(?:[.,]\d+)?)$/i.exec(t),q=/^Chất lượng\s*(?:đạt\s*)?(\d+(?:[.,]\d+)?)\s*%$/i.exec(t);
   const n=num((b||q||[])[1]);if(n==null)return;
   el.setAttribute('data-isd-chip','1');el.classList.add('isd-pill','isd-'+(b?bandLevel(n):pctLevel(n)));
  });
 }
 // ---------- Writing list cards: band from the review already in the page, as a button that opens the detail ----------
 function writingResults(n){
  const out=[];
  doc.querySelectorAll('.wr-assignment[data-wr-assignment]').forEach(a=>{
   const m=/W0*(\d+)$/i.exec(a.getAttribute('data-wr-assignment')||'');if(!m||Number(m[1])!==n)return;
   // One result per essay: the first summary of each task is the newest; older submissions repeat the same task.
   const seen=new Set();
   a.querySelectorAll('.wr-summary').forEach(sm=>{const task=sm.getAttribute('data-wr-task')||'';if(seen.has(task))return;seen.add(task);const v=sm.querySelector('.wr-verdict');if(!v)return;const t=v.textContent.trim();const b=/^Band\s*(\d+(?:[.,]\d+)?)/i.exec(t),q=/(\d+(?:[.,]\d+)?)\s*%/.exec(t);
    if(b&&num(b[1])!=null)out.push(['band',num(b[1])]);else if(q&&num(q[1])!=null)out.push(['pct',num(q[1])]);else if(t)out.push(['word',t]);});
  });
  return out;
 }
 function classworkCards(){
  // In-class reviews: cards of the hidden "Nhận xét bài viết trên lớp" list (IELTS 47/50/51/52 modules), keyed classwork-bNN-…
  const out=new Map();
  doc.querySelectorAll('section[id$="-classwork-list"] > section').forEach(c=>{
   const attr=[...c.attributes].find(a=>/^data-ielts\d+-classwork-host$/.test(a.name));const m=attr&&/^classwork-b0*(\d+)/.exec(attr.value);if(!m)return;
   const btn=c.querySelector('button');if(!btn)return;const n=Number(m[1]);if(!out.has(n))out.set(n,[]);out.get(n).push(btn);
  });
  return out;
 }
 // Small pills next to the page's own "Đã trả n/n bài chữa" chip (owner 13/11: "nhỏ xinh nhẹ nhàng ở góc").
 function tile(kind,label,value,lvl,onClick){
  const b=doc.createElement('button');b.type='button';b.className='isd-mini isd-'+lvl;b.setAttribute('data-kind',kind);
  b.title=(kind==='home'?'Bài viết về nhà':'Bài viết trên lớp')+': '+value;
  b.innerHTML=(kind==='home'?'✍️ ':'🏫 ')+'<span>'+esc(label)+'</span> <b>'+esc(value)+'</b>';
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();onClick();});return b;
 }
 const shortWord=w=>/sửa và viết lại|viết lại/i.test(w)?'Cần viết lại':/sửa và nộp lại|nộp lại/i.test(w)?'Cần nộp lại':w;
 // In-class verdicts read ahead (owner 13/11: show on the card at a glance, even before the homework is handed in).
 // Same read-only parent1 calls the class's own classwork module makes; cached for this tab for 10 minutes.
 const CW_ENDPOINTS={
  'IELTS 47':'https://script.google.com/macros/s/AKfycbyv_VgJvYeeTGstj1vw_BH2gpBBid_XcIZ3CpA3Ily92hwAcYPI2Bn55uSQMk4Rg_Cj/exec',
  'IELTS 50':'https://script.google.com/macros/s/AKfycbyjzCPx_hBh6IghVPvbp7M7UKaIYJZkIo2x8Xgsn-ZVayegrnb5nlpSln-WkLOY-PstlA/exec',
  'IELTS 51':'https://script.google.com/macros/s/AKfycbwzfiAQHqToF0oIgyvWFXOJ00WvAg-BMH4C_gkBTYwATuMuHHnRI7ZfallYQghkhOSq/exec',
  'IELTS 52':'https://script.google.com/macros/s/AKfycbxVyYvP4C08eiBdU7adnwKtY1xwplsgTdO45-y9tx7Gq3MhqH2OC_UTTHzqOEn8OoGw/exec'};
 let cw={sig:'',state:'idle',byLesson:new Map()};
 const nameKey=v=>String(v||'').normalize('NFC').trim().replace(/\s+/g,' ').toUpperCase();
 function cwKick(){
  let cls='',token='',name='';
  try{const acc=typeof ieltsParentAccess!=='undefined'?ieltsParentAccess:root.ieltsParentAccess;const ps=typeof parentState!=='undefined'?parentState:root.parentState;cls=acc.className;token=acc.token;name=ps&&ps.name||'';}catch(_){return}
  const ep=CW_ENDPOINTS[cls];if(!ep||!token||!name)return;
  const sig=cls+'|'+location.hash+'|'+name;if(cw.sig===sig)return;
  cw={sig,state:'loading',byLesson:new Map()};const mine=cw;
  const store='isd-cw:'+sig;
  try{const c=JSON.parse(root.localStorage.getItem(store)||'null');if(c&&Date.now()-c.at<14*864e5){c.rows.forEach(r=>{if(!mine.byLesson.has(r.n))mine.byLesson.set(r.n,[]);mine.byLesson.get(r.n).push(r)});mine.state='ready';if(Date.now()-c.at<600000)return;}}catch(_){}
  const q=async(action,extra)=>{const u=new URL(ep);Object.entries(Object.assign({api:'parent1',class:cls,action,token,_:String(Date.now())},extra||{})).forEach(([k,v])=>u.searchParams.set(k,v));
   const r=await fetch(u.href,{credentials:'omit',mode:'cors',cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(40000)});const e=await r.json();
   if(!e||!e.ok||!e.data||e.data.className!==cls||nameKey(e.data.studentName)!==nameKey(name))throw Error('x');return e.data;};
  (async()=>{
   const idx=await q('classwork_index');const reviews=(Array.isArray(idx.reviews)?idx.reviews:[]).filter(r=>/^classwork-b\d{2}-/.test(r.key)).sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,8);
   const rows=[];
   for(const r of reviews){
    const n=Number(/^classwork-b0*(\d+)/.exec(r.key)[1]);let verdict='';
    try{const d=await q('classwork_review',{reviewKey:r.key,reviewHash:r.hash});const v=d.review&&d.review.learningVerdict;verdict=typeof v==='string'?v:(v&&typeof v.label==='string'?v.label:'');}catch(_){}
    rows.push({n,key:r.key,verdict:verdict.trim().slice(0,40)});
   }
   if(cw!==mine)return;
   mine.byLesson=new Map();rows.forEach(r=>{if(!mine.byLesson.has(r.n))mine.byLesson.set(r.n,[]);mine.byLesson.get(r.n).push(r)});mine.state='ready';
   try{root.localStorage.setItem(store,JSON.stringify({at:Date.now(),rows}))}catch(_){}
   scan(doc);
  })().catch(()=>{if(cw===mine)mine.state='error';});
 }
 function openClasswork(key){
  const find=()=>{for(const c of doc.querySelectorAll('section[id$="-classwork-list"] > section')){if([...c.attributes].some(a=>/^data-ielts\d+-classwork-host$/.test(a.name)&&a.value===key))return c.querySelector('button')}return null};
  let b=find();if(b){b.click();return}
  // The class module builds its list only while the Writing filter is on: switch to it, then open.
  const w=[...doc.querySelectorAll('[data-view="writing"],button')].find(x=>x.offsetParent&&(x.getAttribute('data-view')==='writing'||x.textContent.trim()==='Writing'));if(w)w.click();
  let tries=0;const t=setInterval(()=>{b=find();if(b||++tries>40){clearInterval(t);if(b)b.click();}},250);
 }
 const wordLevel=w=>/nộp lại|viết lại/i.test(w)?'low':/cần sửa|chưa/i.test(w)?'mid':/đạt|tốt/i.test(w)?'high':'good';
 function enhanceWritingCards(scope){
  cwKick();
  // Owner 14/11: "bỏ Đã trả 2/2 bài chữa đi" — the small result pills already say it.
  scope.querySelectorAll('.master-result span:not([data-isd-hid])').forEach(x=>{if(!x.children.length&&/^Đã trả\s+\d+\s*\/\s*\d+\s+bài chữa$/i.test(x.textContent.trim())){x.setAttribute('data-isd-hid','1');x.style.display='none';}});
  scope.querySelectorAll('article.master-card[data-sl-skill="writing"]').forEach(card=>{
   const title=card.querySelector('.master-title');const m=title&&/Buổi\s*0*(\d+)/i.exec(title.textContent);if(!m)return;
   const n=Number(m[1]);const res=writingResults(n);const cwRows=cw.byLesson.get(n)||[];
   const key=JSON.stringify([res,cwRows]);
   const host=card.querySelector('.master-result');if(!host)return;
   const old=[...host.querySelectorAll('.isd-mini')];if(old.length&&host.getAttribute('data-isd-k')===key)return;old.forEach(x=>x.remove());
   host.setAttribute('data-isd-k',key);
   if(!res.length&&!cwRows.length)return;
   const row=doc.createDocumentFragment();
   if(res.length){
    const scored=res.filter(r=>r[0]!=='word'),words=res.filter(r=>r[0]==='word');
    const best=scored[0]||words[0];const lvl=best[0]==='band'?bandLevel(best[1]):best[0]==='pct'?pctLevel(best[1]):wordLevel(best[1]);
    const value=scored.length?(scored[0][0]==='band'?'Band ':'')+scored.map(r=>r[0]==='band'?fmtBand(r[1]):(Math.round(r[1]*10)/10)+'%').join(' · '):shortWord(words[0][1]);
    row.appendChild(tile('home','Về nhà',value,lvl,()=>{const open=card.querySelector('.master-action[data-master-open],.master-title[data-master-open]');if(open)open.click();}));
   }
   cwRows.forEach((r,i)=>row.appendChild(tile('class','Trên lớp'+(cwRows.length>1?' '+(i+1):''),r.verdict?shortWord(r.verdict):'Xem bài chữa',r.verdict?wordLevel(r.verdict):'good',()=>openClasswork(r.key))));
   host.insertBefore(row,host.firstChild);
  });
 }
 function scan(scope){try{enhanceWritingCards(scope)}catch(_){}try{enhanceChips(scope)}catch(_){}try{enhanceWriting(scope)}catch(_){}try{tidyFallback(scope)}catch(_){}}
 function boot(){
  patchSpeaking();patchShadowing();scan(doc);
  let queued=false;
  new MutationObserver(()=>{if(queued)return;queued=true;(root.requestAnimationFrame||setTimeout)(()=>{queued=false;scan(doc)});})
   .observe(doc.body,{childList:true,subtree:true});
 }
 // ---------- IELTS 47: a receipt record (from the Nộp bài button) hides the tracker comment of the same lesson ----------
 // ielts47RecordForAssignment_ returns item.directRecord first. That record carries the submission but no comment, so the
 // detail said "Chưa có nhận xét" while the tracker held the lesson and homework comments (owner 13/11, IELTS 47.2 Buổi 27).
 // Only the comment fields are filled in, on a copy; status, attempts and counts stay from the receipt record.
 const COMMENT_FIELDS=['homeworkTeacherComment','homeworkFeedback','lessonFeedback'];
 function patchRecordComments(){
  for(const n of [45,46,47,48,49,50,51,52])patchRecordFn('ielts'+n+'RecordForAssignment_');
 }
 function patchRecordFn(fname){
  const f=root[fname];if(typeof f!=='function'||f.__isd)return;
  const wrapped=function(item){
   const rec=f.apply(this,arguments);
   try{
    if(!rec||!item||!item.directRecord||rec!==item.directRecord)return rec;
    if(COMMENT_FIELDS.some(k=>String(rec[k]||'').trim()))return rec;
    const copy=Object.assign({},item);delete copy.directRecord;
    const tracker=f.call(this,copy);
    if(!tracker||tracker===rec||!COMMENT_FIELDS.some(k=>String(tracker[k]||'').trim()))return rec;
    const merged=Object.assign({},rec);COMMENT_FIELDS.forEach(k=>{if(!String(merged[k]||'').trim()&&tracker[k])merged[k]=tracker[k];});
    if(merged.band==null&&Number.isFinite(tracker.band))merged.band=tracker.band;
    return merged;
   }catch(_){return rec}
  };
  wrapped.__isd=true;root[fname]=wrapped;
 }
 patchRecordComments();
 // IELTS 50/51 (audit 13/11): the Writing payload also carries Listening notebook states (e.g. IELTS-LISTENING-B04).
 // The frozen Writing reader rejects the whole payload on a non-Writing code, so every Writing card said
 // "Chưa tải được bài chữa". Only items the reader can use (Writing codes) are passed on; nothing else changes.
 function patchWritingRequest(){
  const acc=typeof ieltsParentAccess!=='undefined'?ieltsParentAccess:null;
  const codeFn=typeof ieltsWritingAssignments_!=='undefined'&&ieltsWritingAssignments_&&ieltsWritingAssignments_.code;
  if(!acc||acc.__isd||typeof acc.request!=='function'||typeof codeFn!=='function'||Object.isFrozen(acc))return;
  const r0=acc.request;
  // Owner 13/11: "bài chữa chữa xong là ít sửa sao không hiện lù lù ở đó luôn". The last good Writing payload of this
  // pupil is kept on the device; when the live read is slower than 1.2 s the kept copy is shown at once, and the live
  // answer replaces it on the module's next refresh. The frozen reader still checks class, name and roster revision.
  const store=()=>{try{return 'isd-wr:'+acc.className+'|'+location.hash}catch(_){return ''}};
  const keep=d=>{try{if(d&&Array.isArray(d.reviews))root.localStorage.setItem(store(),JSON.stringify({at:Date.now(),d}))}catch(_){}};
  const kept=()=>{try{const c=JSON.parse(root.localStorage.getItem(store())||'null');return c&&Date.now()-c.at<14*864e5?c.d:null}catch(_){return null}};
  const clean=d=>{try{if(d&&Array.isArray(d.notebookStates)){const k=d.notebookStates.filter(x=>x&&codeFn(x.assignmentCode));if(k.length!==d.notebookStates.length)return Object.assign({},d,{notebookStates:k});}}catch(_){}return d;};
  acc.request=function(action,force){
   const p=r0.apply(this,arguments);
   if(action!=='writing'||!p||typeof p.then!=='function')return p;
   const live=p.then(d=>{const c=clean(d);keep(c);return c;});
   const old=force?null:kept();
   if(!old)return live;
   return Promise.race([live.catch(()=>old),new Promise(r=>setTimeout(()=>r(old),1200))]);
  };
  acc.__isd=true;
 }
 try{patchWritingRequest()}catch(_){}
 // The frozen renderers are defined by inline scripts before this file; patch at once so the first paint uses them.
 patchSpeaking();patchShadowing();
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

 const css=`.isd-score{display:flex;align-items:center;gap:14px;margin:10px 0 12px;padding:12px 14px;border-radius:14px;border:1px solid var(--isd-line);background:var(--isd-bg)}
.isd-num{display:flex;flex-direction:column;align-items:center;min-width:76px}
.isd-num b{font-size:34px;line-height:1;font-weight:800;color:var(--isd-ink);font-variant-numeric:tabular-nums}
.isd-num small{margin-top:5px;font-size:11px;color:#5d6b80;text-align:center;line-height:1.25;max-width:110px}
.isd-meta{flex:1;min-width:0;display:flex;flex-direction:column;gap:7px}
.isd-word{font-size:13px;font-weight:700;color:var(--isd-ink)}
.isd-bar{display:block;height:8px;border-radius:8px;background:#e7edf4;overflow:hidden}
.isd-bar i{display:block;height:100%;border-radius:8px;background:var(--isd-fill)}
.isd-chips{display:flex;flex-wrap:wrap;gap:6px}
.isd-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:999px;font-size:12px;font-weight:700;background:#fff;border:1px solid var(--isd-line);color:var(--isd-ink)}
.isd-chip em{font-style:normal;font-weight:500;color:#5d6b80}
.isd-crit{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;font-size:12px;font-weight:800;background:var(--isd-bg);color:var(--isd-ink);border:1px solid var(--isd-line);vertical-align:1px}
.speaking-feedback-preview .isd-bar,.speaking-feedback-criterion .isd-bar{height:5px;margin:2px 0 6px}
.isd-high{--isd-ink:#17663a;--isd-bg:#edf8f1;--isd-line:#bfe3cc;--isd-fill:#2e9d5b}
.isd-good{--isd-ink:#164f8c;--isd-bg:#eef5fd;--isd-line:#c4daf3;--isd-fill:#2f7bd0}
.isd-mid{--isd-ink:#8a4b05;--isd-bg:#fff6e8;--isd-line:#f3d5a6;--isd-fill:#e39b2d}
.isd-low{--isd-ink:#9b1c3a;--isd-bg:#fdeef2;--isd-line:#f3c2cf;--isd-fill:#d64a6c}
.isd-bar i.isd-high{--isd-fill:#2e9d5b}.isd-bar i.isd-good{--isd-fill:#2f7bd0}.isd-bar i.isd-mid{--isd-fill:#e39b2d}.isd-bar i.isd-low{--isd-fill:#d64a6c}
.isd-pill{background:var(--isd-bg)!important;color:var(--isd-ink)!important;border:1px solid var(--isd-line)!important;font-weight:800!important}
.isd-mini{display:inline-flex;align-items:center;gap:3px;margin:0 6px 6px 0;padding:5px 10px;border-radius:8px;border:0;background:var(--isd-bg);color:var(--isd-ink);font:inherit;font-size:12.5px;line-height:1.3;white-space:nowrap;cursor:pointer;vertical-align:middle}
.isd-mini span{font-weight:500;opacity:.8}.isd-mini b{font-weight:800}
.isd-mini:hover{filter:brightness(.96)}.isd-mini:focus-visible{outline:2px solid #678dad;outline-offset:2px}
/* The in-class reviews now open from the Writing card tiles; the separate list under the cards is redundant (owner 13/11). */
section[id^="ielts"][id$="-classwork-list"]{display:none!important}
/* Owner 13/11: remove the "Nhận xét của cô trên bảng theo dõi" block. Hidden until checked; shown (as "Nhận xét của cô") only when the card itself shows no comment. */
section.native-tracker-teacher-comment:not(.isd-keep){display:none!important}
@media(max-width:520px){.isd-score{gap:10px;padding:10px 12px}.isd-num{min-width:64px}.isd-num b{font-size:28px}}`;
 const st=doc.createElement('style');st.id='ielts-score-display-v1';st.textContent=css;(doc.head||doc.documentElement).appendChild(st);
 root.IeltsScoreDisplay={version:1,debugCw:()=>({sig:cw.sig.length,state:cw.state,lessons:[...cw.byLesson.keys()]}),speakingNormalize,writingCriteria};
})(window);
