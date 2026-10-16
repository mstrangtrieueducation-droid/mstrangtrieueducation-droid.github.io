(function(){
  'use strict';
  if(location.pathname!=='/p8w8wz4f/'&&location.pathname!=='/p8w8wz4f/index.html')return;
  function prepare(event){
    if(event.type==='auxclick'&&event.button!==1)return;
    const a=event.target.closest&&event.target.closest('a[href]');
    if(!a||!window.F9LessonEntry||!F9LessonEntry.key(a.href))return;
    try{
      // Reuse the maintained identity resolver; never grant from a stale sibling link.
      const safe=parentLearningUrl_(a.href);
      if(!safe||F9LessonEntry.key(safe)!==F9LessonEntry.key(a.href))throw Error('PROFILE_CHANGED');
      const pass=F9LessonEntry.issue(safe);
      event.preventDefault();event.stopImmediatePropagation();
      const child=window.open('','_blank');
      if(child){child.name=pass;child.opener=null;child.location.replace(safe)}
      else{window.name=pass;window.location.assign(safe)}
    }catch(_){
      event.preventDefault();event.stopImmediatePropagation();
      alert('Chưa mở được phiên bài học. Bố mẹ vui lòng mở dashboard bằng Safari hoặc Chrome, rồi bấm lại bài học.');
    }
  }
  document.addEventListener('click',prepare,true);
  document.addEventListener('auxclick',prepare,true);
})();
