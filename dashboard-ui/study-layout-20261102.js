/* Presentation only. IELTS and FIGHTER homework lists read by deadline (this week first, old debts folded),
   compact headers, clearer filters, and floating widgets kept off the content. Never changes status or counts. */
(function(root){'use strict';
 const D=root.document,DAY=864e5,OFFSET=7*36e5;
 const LISTS=[
  // IELTS: article.master-card (needs/overdue pending), deadline "Hạn dd/mm/yyyy".
  {list:'.master-list',card:'article.master-card',pending:c=>c.matches('.needs,.overdue'),date:c=>c.querySelector('.master-card-text p')?.textContent,skill:c=>c.querySelector('.master-skill')?.textContent},
  // FIGHTER: article.f5-unit (todo/overdue pending; fix has its own tab, so it is never put first), deadline "Hạn gần nhất dd/mm/yyyy".
  {list:'#f5-list',card:'article.f5-unit',pending:c=>c.matches('.todo,.overdue'),aside:c=>c.matches('.fix'),date:c=>c.querySelector('.f5-dates')?.textContent,skill:c=>c.querySelector('.f5-eyebrow')?.textContent}
 ];
 const GROUPS={week:'⏰ Hạn trong 7 ngày tới',late:'⚠️ Vừa quá hạn · làm bù ngay',later:'🗓 Hạn sau 7 ngày',aside:'📝 Cần bổ sung',done:'✅ Đã hoàn thành'};
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
  const now=today(),buckets={week:[],late:[],later:[],old:[],aside:[],done:[]};
  for(const c of cards){
   const at=dueAt(spec.date(c));c.dataset.slDue=Number.isFinite(at)?at:'';
   if(spec.aside?.(c))buckets.aside.push(c);
   else if(!spec.pending(c))buckets.done.push(c);
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
  if(buckets.aside.length){frag.append(head('aside',GROUPS.aside));buckets.aside.forEach(c=>{c.hidden=false;delete c.dataset.slOld;frag.append(c);});}
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
 function arrangeAll(){for(const spec of LISTS)for(const list of D.querySelectorAll(spec.list))arrange(spec,list);}
 // After a repaint the native stable view scrolls back to the card the pupil was reading. Arrange inside
 // that repaint, before it measures, or it measures the native order and the page jumps on every refresh.
 function wrapStableViews(){
  for(const name of ['IeltsStableView','FighterStableView']){
   const api=root[name];
   if(!api||api.slArranged)continue;
   const update=api.update;
   api.update=function(view,render){return update.call(this,view,function(){const out=render.apply(this,arguments);arrangeAll();return out;});};
   api.slArranged=true;
  }
 }
 // The native warning keeps its own text and numbers. Only attributes are added here (the native renderer
 // rewrites the box contents), and CSS turns them into the number tile and the "next task" line.
 const ALERTS=[
  {box:'[id$="-important"]',gate:'#ielts-pending-work-gate',list:'#panel-homework .master-list',card:'article.master-card',pending:'.needs,.overdue',title:'.master-title',date:'.master-card-text p',total:'.compact-count-main',late:'.compact-count-late'},
  {box:'#f5-alert',gate:'#fighter-pending-work-gate',list:'#f5-list',card:'article.f5-unit',pending:'.todo,.overdue',title:'h3',date:'.f5-dates',total:'strong',late:null}
 ];
 function setAttr(el,name,value){if(value==null){if(el.hasAttribute(name))el.removeAttribute(name);}else if(el.getAttribute(name)!==value)el.setAttribute(name,value);}
 function nextTask(spec){
  const card=[...D.querySelectorAll(spec.list+'>'+spec.card)].find(c=>!c.hidden&&c.matches(spec.pending));
  if(!card)return null;
  const title=card.querySelector(spec.title)?.textContent.trim().replace(/\s+/g,' ').replace(/\s*↗$/,'');
  const at=dueAt(card.querySelector(spec.date)?.textContent);
  if(!title)return null;
  if(!Number.isFinite(at))return 'Tiếp theo: '+title;
  const days=Math.round((at-today())/DAY);
  return 'Tiếp theo: '+title+' · '+(days>1?'còn '+days+' ngày':days===1?'hạn ngày mai':days===0?'hạn hôm nay':'quá hạn '+(-days)+' ngày');
 }
 function lateCount(spec,box){
  const text=spec.late?box.querySelector(spec.late)?.textContent:box.textContent.match(/(\d+)\s*quá hạn/)?.[0];
  return +(String(text||'').match(/\d+/)?.[0]||0);
 }
 function decorateAlerts(){
  for(const spec of ALERTS){
   for(const box of D.querySelectorAll(spec.box)){
    const total=box.querySelector(spec.total)?.textContent.match(/\d+/)?.[0];
    if(!total){setAttr(box,'data-sl-alert',null);continue;}
    setAttr(box,'data-sl-alert',lateCount(spec,box)>0?'late':'todo');
    setAttr(box,'data-sl-count',total);
    const next=nextTask(spec);if(next)setAttr(box,'data-sl-next',next);
   }
   // The opening notice: same next task and overdue count. Its native button and page lock are untouched.
   const gate=D.querySelector(spec.gate),card=gate?.firstElementChild,title=gate?.querySelector('h2');
   if(!card||!title)continue;
   const box=D.querySelector(spec.box),late=box?lateCount(spec,box):0;
   setAttr(card,'data-sl-next',nextTask(spec));
   setAttr(title,'data-sl-late',late>0?'Trong đó '+late+' quá hạn':null);
  }
 }
 function markSkillReviews(){
  for(const section of D.querySelectorAll('#panel-overview .ielts-self-study-skill-section'))setAttr(section,'data-sl-skill-review',/^(Speaking|Shadow)/i.test(section.querySelector('h3')?.textContent.trim()||'')?'':null);
 }
 function paint(){
  queued=false;
  wrapStableViews();
  arrangeAll();
  decorateAlerts();
  markSkillReviews();
  if(!dockDone)dockDone=foldDock();
 }
 function schedule(){if(!queued){queued=true;root.requestAnimationFrame(paint);}}
 new MutationObserver(records=>{if(records.some(r=>!(r.target.closest&&r.target.closest('.sl-head'))))schedule();}).observe(D.documentElement,{childList:true,subtree:true});
 wrapStableViews();
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
 /* The warning as a mission bar: number tile, native sentence, next task, gold action. */
 :is([id$="-important"],#f5-alert)[data-sl-alert]{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto;column-gap:16px;row-gap:2px;align-items:center;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;padding:14px 18px!important;border:0!important;border-radius:16px!important;background:linear-gradient(105deg,#0b2a4a,#123d66)!important;color:#fff!important;box-shadow:0 10px 26px #0b2a4a2e}
 :is([id$="-important"],#f5-alert)[data-sl-alert]::before{content:attr(data-sl-count);grid-column:1;grid-row:1/span 2;display:grid;place-items:center;min-width:54px;height:54px;padding:0 8px;box-sizing:border-box;border-radius:14px;font-size:26px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums}
 :is([id$="-important"],#f5-alert)[data-sl-alert="todo"]::before{background:#f6c445;color:#0b2a4a}
 :is([id$="-important"],#f5-alert)[data-sl-alert="late"]::before{background:#e5484d;color:#fff;animation:sl-pulse 2.4s ease-out infinite}
 :is([id$="-important"],#f5-alert)[data-sl-next]::after{content:attr(data-sl-next);grid-column:2;grid-row:2;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:13px;line-height:1.5;color:#c9d9ea}
 [id$="-important"][data-sl-alert]>svg{display:none!important}
 [id$="-important"][data-sl-alert]>p,#f5-alert[data-sl-alert]>span{grid-column:2;grid-row:1;align-self:end;margin:0!important;min-width:0;color:#fff!important;font-size:14px!important;line-height:1.45!important}
 :is([id$="-important"],#f5-alert)[data-sl-alert]:not([data-sl-next])>:is(p,span){grid-row:1/span 2;align-self:center}
 [id$="-important"][data-sl-alert] :is(.compact-count-main,.compact-count-late,.compact-count-separator){display:inline!important;font-size:15px!important;line-height:1.45!important;white-space:normal!important;color:#fff!important}
 [id$="-important"][data-sl-alert="late"] .compact-count-late{color:#ffb4b0!important}
 #f5-alert[data-sl-alert]>span strong{font-size:15px;color:#fff}
 :is([id$="-important"],#f5-alert)[data-sl-alert]>button{grid-column:3;grid-row:1/span 2;margin:0!important;min-height:42px;padding:9px 16px!important;border:0!important;border-radius:11px!important;background:#f6c445!important;color:#0b2a4a!important;font-size:13.5px!important;font-weight:800!important;white-space:nowrap;box-shadow:none!important}
 :is([id$="-important"],#f5-alert)[data-sl-alert]>button:hover{background:#ffd566!important}
 :is([id$="-important"],#f5-alert)[data-sl-alert]>button:focus-visible{outline:3px solid #fff;outline-offset:2px}
 body.f5-study-hub #f5-alert[data-sl-alert]{flex:1 1 100%}
 @keyframes sl-pulse{0%{box-shadow:0 0 0 0 #e5484d99}70%{box-shadow:0 0 0 12px #e5484d00}100%{box-shadow:0 0 0 0 #e5484d00}}
 @media(prefers-reduced-motion:reduce){:is([id$="-important"],#f5-alert)[data-sl-alert="late"]::before{animation:none}}
 @media(max-width:600px){
  :is([id$="-important"],#f5-alert)[data-sl-alert]{grid-template-columns:auto minmax(0,1fr);column-gap:12px;padding:12px 14px!important;row-gap:3px}
  :is([id$="-important"],#f5-alert)[data-sl-alert]::before{min-width:46px;height:46px;font-size:22px;border-radius:12px}
  :is([id$="-important"],#f5-alert)[data-sl-next]::after{white-space:normal;font-size:12.5px}
  :is([id$="-important"],#f5-alert)[data-sl-alert]>button{grid-column:1/-1;grid-row:3;width:100%;margin-top:8px!important}
  [id$="-important"][data-sl-alert] :is(.compact-count-main,.compact-count-late,.compact-count-separator){font-size:14px!important}
 }
 /* The opening notice: one navy header (who, how many), then the next task, the rule and one action. */
 [class$="-pending-work-gate__card"]{display:grid!important;grid-template-columns:minmax(0,1fr);grid-template-rows:22px;width:min(480px,100%)!important;max-width:480px!important;padding:0 0 24px!important;border:0!important;border-radius:22px!important;background:#fff!important;overflow:hidden}
 [class$="-pending-work-gate__card"]::before{content:"";grid-column:1;grid-row:1/5;background:linear-gradient(105deg,#0b2a4a,#123d66)}
 [class$="-pending-work-gate__card"]>*{grid-column:1;width:auto!important;margin-left:26px!important;margin-right:26px!important}
 [class$="-pending-work-gate__card"]>[class$="-pending-work-gate__icon"]{display:none!important}
 [class$="-pending-work-gate__card"]>:is(#parent-pending-identity,#parentPendingIdentity){grid-row:2;margin-top:0!important;margin-bottom:12px!important;padding:0!important;border:0!important;color:#c9d9ea!important;font-size:14px!important;font-weight:700!important;line-height:1.4!important}
 [class$="-pending-work-gate__card"]>[class$="-pending-work-gate__label"]{grid-row:3;margin-top:0!important;margin-bottom:4px!important;color:#f6c445!important;font-size:11.5px!important}
 [class$="-pending-work-gate__card"]>h2{grid-row:4;margin-top:0!important;margin-bottom:22px!important;color:#fff!important;font-size:clamp(25px,4vw,30px)!important;line-height:1.25!important}
 [class$="-pending-work-gate__card"]>h2[data-sl-late]::after{content:attr(data-sl-late);display:block;margin-top:5px;color:#ffb4b0;font-size:15px;font-weight:700;letter-spacing:0;line-height:1.4}
 [class$="-pending-work-gate__card"]>[class$="-pending-work-gate__detail"]{grid-row:5;margin-top:18px!important;margin-bottom:0!important;color:#3d5670!important;font-size:14px!important;line-height:1.55!important}
 [class$="-pending-work-gate__card"][data-sl-next]>[class$="-pending-work-gate__detail"]{display:none!important}
 [class$="-pending-work-gate__card"][data-sl-next]::after{content:attr(data-sl-next);grid-column:1;grid-row:5;margin:18px 26px 0;color:#0b2a4a;font-size:15px;font-weight:700;line-height:1.5;overflow-wrap:anywhere}
 [class$="-pending-work-gate__card"]>[class$="-pending-work-gate__encourage"]{grid-row:6;margin-top:10px!important;margin-bottom:0!important;padding:0!important;border:0!important;border-radius:0!important;background:none!important;color:#b42318!important;font-size:13.5px!important;font-weight:600!important;line-height:1.55!important}
 [class$="-pending-work-gate__card"]>[class$="-pending-work-gate__button"]{grid-row:7;width:auto!important;min-height:52px!important;margin-top:18px!important;margin-bottom:0!important;border-radius:12px!important;background:#f6c445!important;color:#0b2a4a!important;font-size:15px!important;font-weight:800!important}
 [class$="-pending-work-gate__card"]>[class$="-pending-work-gate__button"]:hover{background:#ffd566!important}
 [class$="-pending-work-gate__card"]>[class$="-pending-work-gate__button"]:focus-visible{outline:2px solid #0b2a4a!important;outline-offset:2px!important}
 /* Homework reviews open from their own skill tab; the results tab keeps tests and scores. */
 #panel-overview .wr-personal,#panel-overview [data-sl-skill-review]{display:none!important}
 /* Test results: the attempt marker is a small label above the comments, not a tall coloured column beside them. */
 .ielts-assessment-attempt:has(>.ielts-attempt-marker){grid-template-columns:minmax(0,1fr)!important;gap:12px!important}
 .ielts-assessment-attempt>.ielts-attempt-marker{display:inline-flex!important;flex-direction:row!important;gap:6px;width:auto!important;min-height:0!important;justify-self:start;padding:6px 12px!important;border-radius:999px!important;box-shadow:none!important}
 .ielts-assessment-attempt>.ielts-attempt-marker strong{margin:0!important;font-size:15px!important}
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
