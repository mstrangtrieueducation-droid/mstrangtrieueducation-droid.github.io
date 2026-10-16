/* Reuses the dashboard's authorized, current profile. No additional profile API. */
(()=>{'use strict';
 const C=window.StudentContext,P=window.ClassroomProgress,G=window.GalaxyCore,host=document.getElementById('titi-games');if(!C||!P||!G||!host)return;
 const storage={getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)},base='/vanlang-on-thi-lop-6/';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let assets,revision=0;
 function snapshot(){try{const s=window.TitiDashboardSnapshot?.();return s&&C.validStudent(s.student)?s:null;}catch{return null;}}
 function load(){return assets||=Promise.all(['vu-tru/catalog.json','vu-tru/teaching-map.json'].map(p=>fetch(base+p+'?v=classroom-1').then(r=>{if(!r.ok)throw Error('Game catalogue unavailable');return r.json();}))).catch(e=>{assets=null;throw e;});}
 async function render(){const ticket=++revision,s=snapshot();host.hidden=!s;if(!s){host.replaceChildren();return;}
  try{const [courses,map]=await load();if(ticket!==revision||snapshot()?.student!==s.student)return;
   const unlocked=P.limits(courses,map,s.lessons,s.gameUnlocks),profile={student:s.student};
   const cards=courses.filter(c=>unlocked.active.includes(c.id));
   const total=courses.reduce((sum,c)=>sum+G.load(storage,c.id,profile).stardust,0);
   host.innerHTML=`<div class="titi-games-head"><div><span class="titi-games-eyebrow">TITI LEARNING UNIVERSE</span><h2>Vũ trụ ôn tập của ${esc(s.name)}</h2></div><strong class="titi-games-dust">✨ ${total} Bụi Sao</strong></div><p class="titi-games-intro">Ôn đúng bài lớp mình đã học. Giành ít nhất 1 Sao để mở hành tinh tiếp theo!</p><div class="titi-games-grid">${cards.map(c=>{const progress=C.summary(c,G.load(storage,c.id,profile),unlocked.limits[c.id]);return `<article class="titi-game-course"><h3>${esc(c.name)}</h3><p><b>${progress.completed}/${progress.limit}</b> hành tinh đã vượt qua · ⭐ ${progress.stars} sao · ✨ ${progress.stardust} Bụi Sao</p><progress max="${Math.max(1,progress.limit)}" value="${progress.completed}" aria-label="Tiến độ ${esc(c.name)}"></progress><button type="button" data-game-course="${esc(c.id)}" ${progress.limit?'':'disabled'}>${esc(P.cta(progress))}</button>${progress.limit?'':'<small>Titi đang chờ lớp mình học đủ nội dung của game đầu tiên.</small>'}</article>`;}).join('')||'<p class="titi-games-empty">🌱 Titi đang chờ bài học của lớp được nối với hành tinh ôn tập. Con quay lại sau buổi học nhé!</p>'}</div><p class="titi-games-note" id="titi-games-note">Bụi Sao và tiến độ game được lưu riêng cho con trên trình duyệt này.</p>`;
   host.querySelectorAll('[data-game-course]').forEach(button=>button.onclick=()=>{
    const current=snapshot();if(!current||current.student!==s.student){render();return;}
    const fresh=P.limits(courses,map,current.lessons,current.gameUnlocks),course=courses.find(c=>c.id===button.dataset.gameCourse),progress=C.summary(course,G.load(storage,course.id,profile),fresh.limits[course.id]);if(!progress.limit){render();return;}
    const context=C.normalize({student:current.student,name:current.name,displayName:current.name,className:current.className,course:course.id,limit:progress.limit,focus:progress.completed+1,limits:fresh.limits});
    const saved=C.store(storage,context),url=P.link(location.href,course.id,progress.limit,progress.completed,current.student);
    if(!saved){url.searchParams.set('mtt_name',current.name);url.searchParams.set('mtt_class',current.className);}
    location.assign(url.href);
   });
  }catch{if(ticket!==revision)return;host.innerHTML='<h2>Vũ trụ ôn tập</h2><p>Chưa tải được hành tinh ôn tập. Con thử lại nhé.</p><button type="button">Thử lại</button>';host.querySelector('button').onclick=render;}
 }
 for(const event of ['titi-dashboard-ready','pageshow','focus','hashchange'])window.addEventListener(event,render);
 window.addEventListener('storage',e=>{if(!e.key||e.key.startsWith('universe_progress_'))render();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
 render();
})();
