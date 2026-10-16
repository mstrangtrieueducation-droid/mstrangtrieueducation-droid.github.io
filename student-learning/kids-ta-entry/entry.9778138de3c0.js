(function(){
  'use strict';
  let allowed=false;
  try{allowed=LessonDashboardEntry.enter(location.href)}catch(_){}
  if(!allowed){
    document.getElementById('student').textContent='Cổng bài học';
    document.getElementById('message').textContent='Vui lòng mở bài từ dashboard.';
    document.querySelector('header').style.display='none';
    return;
  }
  // Keep the native lesson's immediate parent at the existing viewer URL.
  // Science and other courses read their profile from that parent themselves.
  const wrapper=new URL('/student-learning/',location.origin);
  wrapper.search=new URL(location.href).search;
  const frame=document.getElementById('lesson');
  document.title=new URL(location.href).searchParams.get('mtt_name')+' · '+new URL(location.href).searchParams.get('mtt_class')+' · Bài học';
  let readyTimer=null,readyChecks=0;
  const reveal=()=>{
    clearTimeout(readyTimer);
    frame.setAttribute('aria-busy','false');
    document.getElementById('status').hidden=true;
    document.querySelector('header').style.display='none';
  };
  // The original viewer owns profile binding and its own loading screen.
  // Show that viewer once its HTML is ready; do not wait for nested Drive media.
  const inspect=()=>{
    try{
      const doc=frame.contentDocument;
      if(frame.contentWindow.location.href===wrapper.href&&doc&&doc.readyState!=='loading'&&doc.getElementById('lesson')&&doc.getElementById('status'))return reveal();
    }catch(_){}
    if(++readyChecks<200)readyTimer=setTimeout(inspect,100);
  };
  frame.onload=reveal;
  frame.onerror=()=>{clearTimeout(readyTimer);document.getElementById('message').textContent='Chưa tải được trang học. Bố mẹ tải lại trang này giúp con nhé.';};
  frame.src=wrapper.href;
  inspect();
  window.addEventListener('pagehide',()=>clearTimeout(readyTimer));
  window.addEventListener('pageshow',event=>{if(event.persisted){readyChecks=0;inspect();}});
})();
