/* One adapter for all private class dashboards. Never fetches another pupil's data. */
(()=>{'use strict';
 const C=window.StudentContext,P=window.ClassroomProgress,G=window.GalaxyCore,host=document.getElementById('titi-games');if(!C||!P||!G||!host)return;
 const storage={getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v),removeItem:k=>localStorage.removeItem(k)},base='/vanlang-on-thi-lop-6/';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let assets,revision=0,lastSignature='',pending;
 function snapshot(){try{const s=window.TitiDashboardSnapshot?.();return s&&C.validStudent(s.student)&&C.ROUTES[s.className.replace(/\s/g,'').toUpperCase()]===location.pathname&&s.parentRoute===location.pathname?s:null;}catch{return null;}}
 function load(){return assets||=Promise.all(['vu-tru/catalog.json','vu-tru/teaching-map.json'].map(p=>fetch(base+p+'?v=classroom-2').then(r=>{if(!r.ok)throw Error('Game catalogue unavailable');return r.json();}))).catch(e=>{assets=null;throw e;});}
 function scoped(courses,s){return courses.filter(c=>s.family==='kids'?/^(phonics-|family-friends-|discover-)/.test(c.id):s.family==='ta'?c.id==='van-lang':s.family==='fighter'?c.id==='fighter':s.family==='ielts'?c.id.startsWith('ielts'):false);}
 function issue(s,courses,map,courseId){
  const scopedCourses=scoped(courses,s),fresh=P.limits(scopedCourses,map,s.lessons),course=scopedCourses.find(c=>c.id===courseId)||scopedCourses.find(c=>fresh.allowed[c.id]?.length)||scopedCourses[0];
  // Empty courses still issue a closed context, preventing stale access from another class.
  const context=C.normalize({schema:2,student:s.student,name:s.name,displayName:s.displayName,className:s.className,parentRoute:s.parentRoute,issuedAt:Date.now(),course:course?.id||'no-course',limits:fresh.limits,allowed:fresh.allowed,focus:1});
  if(course)context.focus=C.summary(course,G.load(storage,course.id,{student:s.student}),context).next||1;
  return {context,fresh,courses:scopedCourses,saved:C.store(storage,context)};
 }
 function revoke(){
  try{const student=new URLSearchParams(location.hash.slice(1)).get('p'),own=JSON.parse(localStorage.getItem('vl_student_context_'+student)||'null');if(own?.parentRoute!==location.pathname)return;localStorage.removeItem('vl_student_context_'+student);const active=JSON.parse(localStorage.getItem(C.ACTIVE)||'null');if(active?.student===student)localStorage.removeItem(C.ACTIVE);}catch{}
 }
 async function render(force=false){if(document.hidden)return;const ticket=++revision,s=snapshot();
  if(!s){host.hidden=true;host.replaceChildren();lastSignature='';revoke();return;}
  try{const [all,map]=await load();if(ticket!==revision||snapshot()?.student!==s.student)return;
   const issued=issue(s,all,map),courses=issued.courses,context=issued.context,fresh=issued.fresh,profile={student:s.student};
   const cards=courses.filter(c=>fresh.active.includes(c.id)),summaries=cards.map(c=>C.summary(c,G.load(storage,c.id,profile),context));
   const total=courses.reduce((sum,c)=>sum+G.load(storage,c.id,profile).stardust,0),signature=JSON.stringify([s.student,s.className,s.displayName,context.allowed,summaries,total,issued.saved]);
   if(signature===lastSignature&&!force){host.hidden=false;return;}lastSignature=signature;
   host.innerHTML=`<div class="titi-games-head"><div><span class="titi-games-eyebrow">TITI LEARNING UNIVERSE · ${esc(s.className)}</span><h2>Vũ trụ ôn tập của ${esc(s.displayName||s.name)}</h2></div><strong class="titi-games-dust">✨ ${total} Bụi Sao</strong></div><p class="titi-games-intro">Ôn đúng phần lớp mình đã học. Mỗi game thường gộp khoảng 2 buổi; giành ít nhất 1 Sao để mở bài tiếp theo trong cùng phần học.</p><div class="titi-games-grid">${cards.map((c,i)=>{const progress=summaries[i];return `<article class="titi-game-course"><h3>${esc(c.name)}</h3><p><b>${progress.completed}/${progress.limit}</b> hành tinh đã vượt qua · ⭐ ${progress.stars} sao · ✨ ${progress.stardust} Bụi Sao</p><progress max="${Math.max(1,progress.limit)}" value="${progress.completed}" aria-label="Tiến độ ${esc(c.name)}"></progress><button type="button" data-game-course="${esc(c.id)}" ${progress.limit&&issued.saved?'':'disabled'}>${esc(P.cta(progress))}</button>${progress.limit?'':'<small>Titi chờ lớp mình học đủ nội dung của game này nhé.</small>'}</article>`;}).join('')||'<p class="titi-games-empty">🌱 Chưa có game tương ứng với phần lớp mình đã học. Khi có bài phù hợp, Titi sẽ mở ngay tại đây nhé!</p>'}</div><p class="titi-games-note" id="titi-games-note">${issued.saved?'Tiến độ game được lưu riêng cho con trên trình duyệt này.':'Trình duyệt chưa cho phép lưu hồ sơ game. Bố mẹ bật lưu dữ liệu trang web rồi thử lại nhé.'}</p>`;
   host.hidden=false;
   host.querySelectorAll('[data-game-course]').forEach(button=>button.onclick=()=>openCourse(button.dataset.gameCourse));
  }catch{if(ticket!==revision)return;host.hidden=false;host.innerHTML='<h2>Vũ trụ ôn tập</h2><p>Chưa kiểm tra được bài đã học. Con bấm thử lại nhé.</p><button type="button">Thử lại</button>';host.querySelector('button').onclick=()=>render(true);}
 }
 async function openCourse(id,destination){
  const s=snapshot();if(!s){render(true);return;}
  const [courses,map]=await load();if(snapshot()?.student!==s.student)return;
  const {context,saved}=issue(s,courses,map,id),course=courses.find(c=>c.id===id);if(!saved||!course){render(true);return;}
  const progress=G.load(storage,id,{student:s.student}),sum=C.summary(course,progress,context);
  let number=sum.next;
  if(destination){const lessonId=destination.searchParams.get('lesson')||destination.pathname.match(/\/(tu-luyen-\d+)\/?$/)?.[1];if(lessonId){number=course.lessons.findIndex(l=>l.id===lessonId)+1;const gate=C.status(course,number,progress,{...context,entered:true});if(!gate.open){document.getElementById('titi-games-note').textContent=gate.reason;host.scrollIntoView({block:'nearest',behavior:'smooth'});return;}}}
  if(!sum.limit){render(true);return;}
  const url=destination||P.link(location.href,id,context.limits[id],sum.completed,s.student);C.decorate(url,context,id,number);if(!C.handoff(storage,context,url)){document.getElementById('titi-games-note').textContent='Chưa mở được lượt chơi. Con bật lưu dữ liệu trang web và thử lại nhé.';return;}location.assign(url.href);
 }
 // Previously assigned game links also pass through the same classroom gate.
 document.addEventListener('click',e=>{const a=e.target.closest?.('a[href]');if(!a)return;let u;try{u=new URL(a.href);if(u.origin!==location.origin)return;for(let i=0;i<3&&u.searchParams.has('lesson');i++){const value=u.searchParams.get('lesson');if(!/^https?:/.test(value))break;u=new URL(value);}if(u.origin!==location.origin||!/^\/vanlang-on-thi-lop-6\/(?:tu-luyen-\d+|khoa-hoc|vu-tru|hanh-trinh)\/?$/.test(u.pathname))return;}catch{return;}
  e.preventDefault();e.stopImmediatePropagation();openCourse(u.searchParams.get('course')||'van-lang',u).catch(()=>render(true));
 },true);
 const schedule=()=>{clearTimeout(pending);pending=setTimeout(()=>render(),100);};
 for(const event of ['titi-dashboard-ready','pageshow','focus','hashchange','fighter-parent-access'])window.addEventListener(event,schedule);
 window.addEventListener('storage',e=>{if(!e.key||e.key.startsWith('universe_progress_'))schedule();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
 // Existing dashboards have different render lifecycles; observe their rendered readiness.
 const observer=new MutationObserver(records=>{if(records.some(r=>r.target!==host&&!host.contains(r.target)))schedule();});
 observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class']});
 render();
})();
