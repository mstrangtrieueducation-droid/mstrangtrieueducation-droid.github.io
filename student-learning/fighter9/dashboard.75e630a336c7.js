(function(){
  'use strict';
  if(location.pathname!=='/p8w8wz4f/'&&location.pathname!=='/p8w8wz4f/index.html')return;
  const parentHash=location.hash;
  function prepare(event){
    if(event.type==='auxclick'&&event.button!==1)return;
    const a=event.target.closest&&event.target.closest('a[href]');
    if(!a||!window.F9LessonEntry||!F9LessonEntry.key(a.href))return;
    try{
      // The maintained renderer already generated the prefilled link. Bind it
      // to its rendered, authorized profile rather than reentering its loader.
      const safe=a.href,params=new URL(safe).searchParams;
      const gateway=document.getElementById('student-gateway');
      const label=document.querySelector('#student-profile .student-name');
      if(location.hash!==parentHash||!parentHash||!gateway||!gateway.hidden||!label||label.textContent.trim().normalize('NFC')!==params.get('mtt_name').trim().normalize('NFC'))throw Error('PROFILE_CHANGED');
      const pass=F9LessonEntry.issue(safe);
      event.preventDefault();event.stopImmediatePropagation();
      // Navigate the existing context: in-app browsers may leave a new blank window detached.
      window.name=pass;
      window.location.assign(safe);
      document.documentElement.dataset.f9EntryState='opened';
    }catch(error){
      event.preventDefault();event.stopImmediatePropagation();
      document.documentElement.dataset.f9EntryState=String(error&&error.message||'entry-failed');
      let notice=document.getElementById('f9-entry-notice');
      if(!notice){notice=document.createElement('p');notice.id='f9-entry-notice';notice.setAttribute('role','alert');a.insertAdjacentElement('afterend',notice)}
      notice.textContent='Chưa mở được phiên bài học. Bố mẹ tải lại hồ sơ rồi bấm lại bài giúp con nhé.';
    }
  }
  document.addEventListener('click',prepare,true);
  document.addEventListener('auxclick',prepare,true);
})();
