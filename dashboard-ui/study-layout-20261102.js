/* Presentation only. IELTS and FIGHTER homework lists read by deadline (this week first, old debts folded),
   compact headers, clearer filters, and floating widgets kept off the content. Never changes status or counts. */
(function(root){'use strict';
 const D=root.document,DAY=864e5,OFFSET=7*36e5;
 const LISTS=[
  // IELTS: article.master-card (needs/overdue pending), deadline "Hạn dd/mm/yyyy".
  {list:'.master-list',card:'article.master-card',pending:c=>c.matches('.needs,.overdue'),date:c=>c.querySelector('.master-card-text p')?.textContent,skill:c=>c.querySelector('.master-skill')?.textContent},
  // FIGHTER: article.f5-unit (todo/overdue/fix pending), deadline "Hạn gần nhất dd/mm/yyyy".
  {list:'#f5-list',card:'article.f5-unit',pending:c=>c.matches('.todo,.overdue,.fix'),date:c=>c.querySelector('.f5-dates')?.textContent,skill:c=>c.querySelector('.f5-eyebrow')?.textContent}
 ];
 const GROUPS={week:'⏰ Hạn trong 7 ngày tới',late:'⚠️ Vừa quá hạn · làm bù ngay',later:'🗓 Hạn sau 7 ngày',done:'✅ Đã hoàn thành'};
 const openOld=new Set();let queued=false;

 function dueAt(text){const m=String(text||'').match(/Hạn[^0-9]*(\d{1,2})\/(\d{1,2})\/(\d{4})/);return m?Date.UTC(+m[3],+m[2]-1,+m[1]):NaN;}
 function today(){const d=new Date(Date.now()+OFFSET);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());}
 function skillKey(text){const t=String(text||'').toLowerCase();return /listen|nghe/.test(t)?'listening':/read/.test(t)?'reading':/shadow/.test(t)?'shadowing':/writ|đoạn văn|viết/.test(t)?'writing':/speak|nói/.test(t)?'speaking':/luyện đề|test/.test(t)?'test':'other';}
 function head(kind,label){const h=D.createElement(kind==='old'?'button':'div');h.className='sl-head';h.dataset.slHead=kind;if(kind==='old')h.type='button';h.textContent=label;return h;}

 // Cards stay direct children of the native list (other modules query them there); only order and
 // inserted group headings change, and folded old debts are hidden until "Xem thêm".
 function arrange(spec,list){
  const cards=[...list.children].filter(c=>c.matches(spec.card));
  const sig=cards.map(c=>(c.dataset.assignmentId||c.dataset.f5Key||'')+'|'+c.className).join(',');
  if(list.dataset.slSig===sig&&list.querySelector(':scope>.sl-head'))return;
  list.querySelectorAll(':scope>.sl-head').forEach(h=>h.remove());
  cards.forEach(c=>{c.dataset.slSkill=skillKey(spec.skill(c));});
  if(!cards.some(spec.pending)){list.dataset.slSig=sig;return;}
  const now=today(),buckets={week:[],late:[],later:[],old:[],done:[]};
  for(const c of cards){
   const at=dueAt(spec.date(c));c.dataset.slDue=Number.isFinite(at)?at:'';
   if(!spec.pending(c))buckets.done.push(c);
   else if(!Number.isFinite(at))buckets.later.push(c);
   else if(at>=now&&at<=now+7*DAY)buckets.week.push(c);
   else if(at>now)buckets.later.push(c);
   else if(at>=now-14*DAY)buckets.late.push(c);
   else buckets.old.push(c);
  }
  const asc=(a,b)=>(+a.dataset.slDue||Infinity)-(+b.dataset.slDue||Infinity),desc=(a,b)=>asc(b,a);
  buckets.week.sort(asc);buckets.later.sort(asc);buckets.late.sort(desc);buckets.old.sort(desc);
  const key=root.location.pathname+spec.list,expanded=openOld.has(key),frag=D.createDocumentFragment();
  for(const kind of ['week','late','later']){if(!buckets[kind].length)continue;frag.append(head(kind,GROUPS[kind]));buckets[kind].forEach(c=>{c.hidden=false;delete c.dataset.slOld;frag.append(c);});}
  // Only old debts left: nothing to fold them under, so they are the list.
  if(buckets.old.length&&!frag.children.length){frag.append(head('late','⚠️ Bài cũ chưa nộp'));buckets.old.forEach(c=>{c.hidden=false;delete c.dataset.slOld;frag.append(c);});}
  else if(buckets.old.length){
   const toggle=head('old',(expanded?'▾ Thu gọn bài cũ chưa nộp':'▸ Bài cũ chưa nộp ('+buckets.old.length+') · Xem thêm'));
   toggle.setAttribute('aria-expanded',String(expanded));
   toggle.addEventListener('click',()=>{if(openOld.has(key))openOld.delete(key);else openOld.add(key);delete list.dataset.slSig;arrange(spec,list);});
   frag.append(toggle);buckets.old.forEach(c=>{c.dataset.slOld='';c.hidden=!expanded;frag.append(c);});
  }
  if(buckets.done.length){frag.append(head('done',GROUPS.done));buckets.done.forEach(c=>{c.hidden=false;frag.append(c);});}
  list.append(frag);list.dataset.slSig=sig;
 }

 // The games dock starts folded once per tab; a pupil who opens it keeps it open (its own session choice).
 function foldDock(){
  let saved={};try{saved=JSON.parse(sessionStorage.getItem('mtt-titi-dock-v1')||'{}')||{};}catch(_){return true;}
  if(typeof saved.collapsed==='boolean')return true;
  const minimize=D.querySelector('#titi-games .titi-minimize');
  if(!minimize||minimize.hidden)return false;
  minimize.click();
  // The dock focuses its launcher after folding; a pupil did not ask for that focus ring.
  if(D.activeElement?.closest?.('#titi-games'))D.activeElement.blur();
  return true;
 }
 let dockDone=false;
 function paint(){
  queued=false;
  for(const spec of LISTS)for(const list of D.querySelectorAll(spec.list))arrange(spec,list);
  if(!dockDone)dockDone=foldDock();
 }
 function schedule(){if(!queued){queued=true;root.requestAnimationFrame(paint);}}
 new MutationObserver(records=>{if(records.some(r=>!(r.target.closest&&r.target.closest('.sl-head'))))schedule();}).observe(D.documentElement,{childList:true,subtree:true});
 schedule();

 const style=D.createElement('style');style.textContent=`
 /* Deadline groups */
 .sl-head{display:flex;align-items:center;gap:8px;margin:18px 0 8px;padding:0 2px;font:inherit;font-size:13px;font-weight:800;letter-spacing:.02em;color:#24425e;background:none;border:0}
 .sl-head:first-child{margin-top:4px}
 .sl-head[data-sl-head="late"]{color:#a1361f}
 .sl-head[data-sl-head="done"]{color:#2f7a54}
 button.sl-head[data-sl-head="old"]{cursor:pointer;margin:16px 0 8px;padding:9px 14px;border:1px dashed #c9d5e1;border-radius:12px;background:#f7f9fc;color:#45607a;width:100%;justify-content:center}
 button.sl-head[data-sl-head="old"]:hover{background:#eef3f8}
 button.sl-head:focus{outline:none}button.sl-head:focus-visible{outline:3px solid #2563eb;outline-offset:2px}
 [data-sl-old][hidden]{display:none!important}
 /* Skill colour on the card edge */
 :is(.master-card,.f5-unit)[data-sl-skill]{border-left-width:4px!important;border-left-style:solid!important}
 :is(.master-card,.f5-unit)[data-sl-skill="listening"]{border-left-color:#3b82f6!important}
 :is(.master-card,.f5-unit)[data-sl-skill="reading"]{border-left-color:#16a34a!important}
 :is(.master-card,.f5-unit)[data-sl-skill="shadowing"]{border-left-color:#8b5cf6!important}
 :is(.master-card,.f5-unit)[data-sl-skill="writing"]{border-left-color:#ea8a1a!important}
 :is(.master-card,.f5-unit)[data-sl-skill="speaking"]{border-left-color:#e2557a!important}
 :is(.master-card,.f5-unit)[data-sl-skill="test"]{border-left-color:#0f766e!important}
 :is(.master-card,.f5-unit)[data-sl-skill="other"]{border-left-color:#94a3b8!important}
 .master-list>.master-card{margin:0 0 8px!important}
 /* Floating widgets stay out of the way */
 #snapshot-stamp,#public-snapshot-stamp{position:static!important;display:block!important;width:max-content;max-width:calc(100% - 32px);margin:0 auto 18px!important;box-shadow:none!important;background:transparent!important;border:0!important;opacity:.75;transform:none!important}
 /* IELTS: compact header and student strip */
 #portal-shell>.hero{padding-top:22px!important;padding-bottom:22px!important;min-height:0!important}
 #portal-shell>.hero h1{font-size:clamp(30px,4vw,40px)!important;margin:4px 0!important}
 #portal-shell>.hero .fighter-tagline{font-size:14px!important;margin:0!important;opacity:.85}
 #portal-shell>.portal-student-bar{margin-top:14px!important;margin-bottom:6px!important}
 #portal-shell>[id$="-important"]{margin-top:6px!important}
 #panel-homework .master-heading{margin-bottom:10px!important}
 /* FIGHTER: compact header, one summary strip, filters that read as tabs */
 body.f5-study-hub #f5-summary{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:14px!important}
 body.f5-study-hub #f5-student{margin:0!important}
 body.f5-study-hub #f5-student>b{display:none!important}
 body.f5-study-hub #f5-alert{flex:1 1 360px;margin:0!important}
 body.f5-study-hub #f5-work .f5-section-heading{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
 body.f5-study-hub #f5-programs{justify-content:flex-start!important;flex-wrap:nowrap!important;overflow-x:auto;gap:2px!important;margin:8px 0 0!important;padding:0!important;border-bottom:1px solid #dfe7ef;scrollbar-width:none}
 body.f5-study-hub #f5-programs::-webkit-scrollbar{display:none}
 body.f5-study-hub #f5-programs>button{flex:none;border:0!important;border-bottom:3px solid transparent!important;border-radius:0!important;background:none!important;color:#5b6d80!important;padding:10px 14px 9px!important;font-size:13.5px!important;font-weight:650!important;box-shadow:none!important}
 body.f5-study-hub #f5-programs>button[aria-pressed="true"]{border-bottom-color:#0b2a4a!important;color:#0b2a4a!important;font-weight:800!important}
 body.f5-study-hub #f5-statuses{justify-content:flex-start!important;gap:6px!important;margin:12px 0 0!important}
 body.f5-study-hub #f5-statuses>button{border-radius:999px!important;padding:6px 12px!important;font-size:12px!important;background:#f3f6f9!important;border:1px solid #e0e7ee!important;color:#3d5670!important}
 body.f5-study-hub #f5-statuses>button[aria-pressed="true"]{background:#0b2a4a!important;border-color:#0b2a4a!important;color:#fff!important}
 body.f5-study-hub #f5-list-count{margin:12px 0 4px!important}
 body.f5-study-hub #f5-list>.f5-unit{padding:14px 18px!important;margin:0 0 10px!important;border-radius:14px!important}
 body.f5-study-hub #f5-list>.f5-unit h3{margin:4px 0 2px!important;font-size:17px!important}
 body.f5-study-hub #f5-list>.f5-unit .f5-dates{margin:0 0 8px!important;font-size:12.5px!important}
 body.f5-study-hub #f5-list>.f5-unit .f5-unit-footer{margin-top:10px!important;padding-top:10px!important}
 @media(max-width:600px){
  .sl-head{font-size:12.5px;margin:14px 0 6px}
  body.f5-study-hub #f5-summary{gap:8px}
  body.f5-study-hub #f5-programs>button{padding:9px 11px 8px!important;font-size:13px!important}
  body.f5-study-hub #f5-list>.f5-unit{padding:12px 14px!important}
 }
 `;D.head.append(style);
})(window);
