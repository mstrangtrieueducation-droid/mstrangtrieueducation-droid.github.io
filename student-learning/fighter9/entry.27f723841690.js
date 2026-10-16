(function(){
  'use strict';
  let allowed=false;
  try{allowed=F9LessonEntry.enter(location.href)}catch(_){}
  const clean=new URL(location.href);clean.searchParams.delete('entry');
  history.replaceState(null,'',clean.href);
  if(!allowed){
    document.getElementById('student').textContent='FIGHTER 9';
    document.getElementById('message').textContent='Vui lòng mở bài từ dashboard.';
    document.querySelector('header').style.display='none';
    return;
  }
  // Same native viewer/receiver, same lesson origin, storage and submission URLs.
  const script=document.createElement('script');
  script.src='../viewer.c630bf2cc99c.js';
  script.onerror=()=>{document.getElementById('message').textContent='Chưa tải được trang học. Bố mẹ tải lại trang này giúp con nhé.';};
  document.head.appendChild(script);
})();
