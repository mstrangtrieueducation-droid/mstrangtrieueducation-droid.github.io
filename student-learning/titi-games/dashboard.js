/* One adapter for all private class dashboards. Never fetches another pupil's data. */
(()=>{'use strict';
 const C=window.StudentContext,P=window.ClassroomProgress,G=window.GalaxyCore,host=document.getElementById('titi-games');if(!C||!P||!G||!host)return;
 const storage=C.browserStorage||{getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v),removeItem:k=>localStorage.removeItem(k)},base='/vanlang-on-thi-lop-6/';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let assets,revision=0,lastSignature='',pending,expanded=false,owner='';
 // Keep the launcher independent of the dashboard's tabs and card layout.
 document.body.append(host);
 // The dashboard may have marked its children inert before this script loads.
 // Reparenting preserves that attribute; clear it only on our own detached widget.
 host.inert=false;
 const planet=`<span class="titi-arcade" aria-hidden="true"><span class="titi-portal-ring"></span><span class="titi-star s1">✦</span><span class="titi-star s2">✧</span><span class="titi-star s3">✦</span><span class="titi-flight"><span class="titi-pilot-face"></span><svg viewBox="0 0 160 92"><defs><linearGradient id="titi-hull" x2="0" y2="1"><stop stop-color="#fff7ce"/><stop offset=".5" stop-color="#ffcb47"/><stop offset="1" stop-color="#da7025"/></linearGradient></defs><path class="titi-jet" d="M56 64Q80 113 104 64" fill="#6bffff"/><path d="m10 34 25 4 15-18h60l15 18 25-4-14 31H24z" fill="url(#titi-hull)" stroke="#fff2b8" stroke-width="2"/><ellipse cx="80" cy="39" rx="36" ry="14" fill="#254884"/><path d="M46 43q34 17 68 0" fill="none" stroke="#8dffff" stroke-width="4"/><circle cx="30" cy="51" r="4" fill="white"/><circle cx="130" cy="51" r="4" fill="white"/></svg></span><span class="titi-orbit-dot"></span></span>`;

 function panel(open,focus=false){expanded=open;host.querySelector('.titi-games-panel')?.toggleAttribute('hidden',!open);const button=host.querySelector('.titi-games-launcher');button?.setAttribute('aria-expanded',String(open));if(focus)(open?host.querySelector('.titi-games-close'):button)?.focus();}
 function message(text){panel(true);const note=host.querySelector('#titi-games-note');if(note)note.textContent=text;}
 function snapshot(){try{const s=window.TitiDashboardSnapshot?.();return s&&C.validStudent(s.student)&&C.ROUTES[s.className.replace(/\s/g,'').toUpperCase()]===location.pathname&&s.parentRoute===location.pathname?s:null;}catch{return null;}}
 function load(){return assets||=Promise.all(['vu-tru/catalog.json','vu-tru/teaching-map.json'].map(p=>fetch(base+p+'?v=classroom-4').then(r=>{if(!r.ok)throw Error('Game catalogue unavailable');return r.json();}))).catch(e=>{assets=null;throw e;});}
 function scoped(courses,s){return courses.filter(c=>s.family==='kids'?/^(phonics-|family-friends-|discover-)/.test(c.id):s.family==='ta'?c.id==='van-lang':s.family==='fighter'?c.id==='fighter':s.family==='ielts'?c.id.startsWith('ielts'):false);}
 function issue(s,courses,map,courseId){
  const fresh=P.currentBooks(scoped(courses,s),map,s.lessons),scopedCourses=courses.filter(c=>Object.hasOwn(fresh.books,c.id)),course=scopedCourses.find(c=>c.id===courseId)||scopedCourses.find(c=>fresh.allowed[c.id]?.length)||scopedCourses[0];
  // Empty courses still issue a closed context, preventing stale access from another class.
  const context=C.normalize({schema:3,student:s.student,name:s.name,displayName:s.displayName,className:s.className,parentRoute:s.parentRoute,issuedAt:Date.now(),course:course?.id||'no-course',limits:fresh.limits,allowed:fresh.allowed,books:fresh.books,focus:1});
  if(course)context.focus=C.summary(course,G.load(storage,course.id,{student:s.student}),context).next||1;
  return {context,fresh,courses:scopedCourses,saved:C.store(storage,context)};
 }
 function revoke(){
  try{const student=new URLSearchParams(location.hash.slice(1)).get('p'),own=JSON.parse(storage.getItem('vl_student_context_'+student)||'null');if(own?.parentRoute!==location.pathname)return;storage.removeItem('vl_student_context_'+student);const active=JSON.parse(storage.getItem(C.ACTIVE)||'null');if(active?.student===student)storage.removeItem(C.ACTIVE);}catch{}
 }
 async function render(force=false){if(document.hidden)return;const ticket=++revision,s=snapshot();
  if(document.body.matches('.pending-work-locked,.fighter-pending-work-locked')){host.hidden=true;panel(false);return;}
  if(!s){host.hidden=true;host.replaceChildren();lastSignature='';expanded=false;owner='';revoke();return;}
  if(owner!==s.student){expanded=false;owner=s.student;}
  try{const [all,map]=await load();if(ticket!==revision||snapshot()?.student!==s.student)return;
   const issued=issue(s,all,map),courses=issued.courses,context=issued.context,fresh=issued.fresh,profile={student:s.student};
   const cards=courses.filter(c=>fresh.active.includes(c.id)),summaries=cards.map(c=>C.summary(c,G.load(storage,c.id,profile),context));
   const total=courses.reduce((sum,c)=>sum+G.load(storage,c.id,profile).stardust,0),signature=JSON.stringify([s.student,s.className,s.displayName,context.allowed,context.books,summaries,total,issued.saved]);
   if(signature===lastSignature&&!force){host.hidden=false;return;}lastSignature=signature;
   const keepFocus=host.contains(document.activeElement),focusClass=document.activeElement?.className;
   host.innerHTML=`<div class="titi-games-panel" id="titi-games-panel" role="dialog" aria-labelledby="titi-games-title" ${expanded?'':'hidden'}><button type="button" class="titi-games-close" aria-label="Đóng bảng game">×</button><div class="titi-games-head"><span class="titi-games-eyebrow">SÂN CHƠI CỦA ${esc(s.displayName||s.name)}</span><h2 id="titi-games-title">Cùng Titi chinh phục! <span aria-hidden="true">✦</span></h2><p>🚀 Nhận nhiệm vụ · Chinh phục · Gom sao</p></div><div class="titi-games-grid">${cards.map((c,i)=>{const p=summaries[i],next=c.lessons[p.next-1],tracks=context.books[c.id];return `<article class="titi-game-course"><span class="titi-games-book-label">GIÁO TRÌNH LỚP ĐANG HỌC</span><h3>${esc(c.name)}</h3>${tracks.length?`<p class="titi-games-tracks">${tracks.map(esc).join(' · ')}</p>`:''}<div class="titi-games-progress"><span>${p.completed}/${p.limit} thử thách</span><span>⭐ ${p.stars}</span></div><progress max="${Math.max(1,p.limit)}" value="${p.completed}" aria-label="Tiến độ ${esc(c.name)}"></progress>${next?`<p class="titi-games-next">${p.completed>=p.limit?'Săn sao tại':'Thử thách tiếp theo'}<strong>${esc(next.title)}</strong></p>`:'<p class="titi-games-empty">Titi đang chờ lớp mình học đủ phần của thử thách này nhé!</p>'}<button type="button" data-game-course="${esc(c.id)}" ${p.limit?'':'disabled'}>${!p.limit?'🌱 Chờ thử thách mới':p.completed>=p.limit?'🌟 Săn thêm sao':p.completed?'🚀 Chơi tiếp cùng Titi':'🚀 Chơi cùng Titi'}</button></article>`;}).join('')||'<p class="titi-games-empty">🌱 Thử thách của giáo trình lớp mình đang được chuẩn bị. Con quay lại sau nhé!</p>'}</div><div class="titi-games-footer"><span>✨ ${total} Bụi Sao</span><span>${esc(s.className)}</span></div><p class="titi-games-note" id="titi-games-note" role="status">${!issued.saved?'Chưa giữ được lượt chơi. Con bấm Chơi để thử lại nhé.':storage.temporary?'Con vẫn chơi được. Tiến độ tạm giữ trong tab này; đừng đóng tab khi đang chơi nhé.':''}</p></div><button type="button" class="titi-games-launcher" aria-label="Mở sân chơi ôn tập cùng Titi" aria-controls="titi-games-panel" aria-expanded="${expanded}">${planet}<span>Vào chơi! <b aria-hidden="true">▶</b></span></button>`;
   host.hidden=false;
   host.querySelectorAll('[data-game-course]').forEach(button=>button.onclick=()=>openCourse(button.dataset.gameCourse).catch(()=>message('Tín hiệu bị ngắt một chút. Con bấm chơi lại nhé!')));
   host.querySelector('.titi-games-launcher').onclick=()=>panel(!expanded,true);host.querySelector('.titi-games-close').onclick=()=>panel(false,true);
   if(keepFocus)(host.querySelector(focusClass==='titi-games-launcher'?'.titi-games-launcher':'.titi-games-close'))?.focus({preventScroll:true});
  }catch{if(ticket!==revision)return;host.hidden=false;host.innerHTML=`<button type="button" class="titi-games-launcher" aria-label="Tải lại sân chơi Titi">${planet}<span>Thử lại nhé</span></button>`;host.querySelector('button').onclick=()=>render(true);}
 }
 async function openCourse(id,destination){
  const s=snapshot();if(!s){render(true);return;}
  const [courses,map]=await load();if(snapshot()?.student!==s.student)return;
  const {context,saved}=issue(s,courses,map,id),course=courses.find(c=>c.id===id);if(!course){render(true);return;}if(!saved){message('Chưa tạo được lượt chơi trên trình duyệt này. Con tải lại Dashboard rồi bấm Chơi nhé.');return;}if(!Object.hasOwn(context.books,id)){message('Phần này không thuộc giáo trình lớp mình đang học. Con chọn thử thách hiện trên bảng này nhé!');return;}
  const progress=G.load(storage,id,{student:s.student}),sum=C.summary(course,progress,context);
  let number=sum.next;
  if(destination){const lessonId=destination.searchParams.get('lesson')||destination.pathname.match(/\/(tu-luyen-\d+)\/?$/)?.[1];if(lessonId){number=course.lessons.findIndex(l=>l.id===lessonId)+1;const gate=C.status(course,number,progress,{...context,entered:true});if(!gate.open){message(gate.reason);return;}}}
  if(!sum.limit){render(true);return;}
  const url=destination||P.link(location.href,id,context.limits[id],sum.completed,s.student);C.decorate(url,context,id,number);if(!C.handoff(storage,context,url)){document.getElementById('titi-games-note').textContent='Chưa mở được lượt chơi. Con tải lại Dashboard rồi thử lại nhé.';return;}location.assign(url.href);
 }
 // Previously assigned game links also pass through the same classroom gate.
 document.addEventListener('click',e=>{const a=e.target.closest?.('a[href]');if(!a)return;let u;try{u=new URL(a.href);if(u.origin!==location.origin)return;for(let i=0;i<3&&u.searchParams.has('lesson');i++){const value=u.searchParams.get('lesson');if(!/^https?:/.test(value))break;u=new URL(value);}if(u.origin!==location.origin||!/^\/vanlang-on-thi-lop-6\/(?:tu-luyen-\d+|khoa-hoc|vu-tru|hanh-trinh)\/?$/.test(u.pathname))return;}catch{return;}
  e.preventDefault();e.stopImmediatePropagation();openCourse(u.searchParams.get('course')||'van-lang',u).catch(()=>render(true));
 },true);
 const schedule=()=>{clearTimeout(pending);pending=setTimeout(()=>render(),100);};
 document.addEventListener('pointerdown',e=>{if(expanded&&!host.contains(e.target))panel(false);});
 document.addEventListener('keydown',e=>{if(expanded&&e.key==='Escape'){e.preventDefault();panel(false,true);}});
 // Give the existing homework reminder its own space on small screens.
 const position=()=>{const reminder=document.querySelector('.paper-homework-reminder:not([hidden])');const rect=reminder?.getBoundingClientRect();host.style.setProperty('--titi-dock-lift',rect&&rect.height&&rect.top<innerHeight?Math.max(0,innerHeight-rect.top)+'px':'0px');};
 window.addEventListener('resize',position);position();
 for(const event of ['titi-dashboard-ready','pageshow','focus','hashchange','fighter-parent-access'])window.addEventListener(event,schedule);
 window.addEventListener('storage',e=>{if(!e.key||e.key.startsWith('universe_progress_'))schedule();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
 // Existing dashboards have different render lifecycles; observe their rendered readiness.
 const observer=new MutationObserver(records=>{if(records.some(r=>r.target!==host&&!host.contains(r.target))){position();schedule();}});
 observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class']});
 render();
})();
