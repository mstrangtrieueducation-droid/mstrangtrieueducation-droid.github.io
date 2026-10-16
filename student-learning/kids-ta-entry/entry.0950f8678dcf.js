(function(){
  'use strict';
  let allowed=false;
  try{allowed=LessonDashboardEntry.enter(location.href)}catch(_){}
  if(!allowed){
    document.getElementById('student').textContent='Cổng bài học';
    document.getElementById('message').textContent='Vui lòng mở bài từ dashboard của con.';
    document.getElementById('entry-help').hidden=false;
    return;
  }
  // Keep the native lesson's immediate parent at the existing viewer URL.
  // Science and other courses read their profile from that parent themselves.
  const wrapper=new URL('/student-learning/',location.origin);
  wrapper.search=new URL(location.href).search;
  const frame=document.getElementById('lesson');
  document.title=new URL(location.href).searchParams.get('mtt_name')+' · '+new URL(location.href).searchParams.get('mtt_class')+' · Bài học';
  frame.onload=()=>{
    frame.setAttribute('aria-busy','false');
    document.getElementById('status').hidden=true;
    document.querySelector('header').style.display='none';
  };
  frame.onerror=()=>{document.getElementById('message').textContent='Chưa tải được trang học. Bố mẹ tải lại trang này giúp con nhé.';};
  frame.src=wrapper.href;
})();
