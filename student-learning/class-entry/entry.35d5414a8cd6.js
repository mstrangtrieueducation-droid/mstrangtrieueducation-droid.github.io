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
  const script=document.createElement('script');
  script.src='../viewer.c630bf2cc99c.js';
  script.onerror=()=>{document.getElementById('message').textContent='Chưa tải được trang học. Bố mẹ tải lại trang này giúp con nhé.';};
  document.head.appendChild(script);
})();
