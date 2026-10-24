(function(){
  'use strict';
  if(location.pathname!=='/p8w8wz4f/'&&location.pathname!=='/p8w8wz4f/index.html')return;
  const parentHash=location.hash;
  function identityMatches(params){
    const gateway=document.getElementById('student-gateway'),label=document.querySelector('#student-profile .student-name');
    return !!(location.hash===parentHash&&parentHash&&params.get('mtt_class')==='FIGHTER 9'&&gateway&&gateway.hidden&&label&&label.textContent.trim().normalize('NFC')===params.get('mtt_name').trim().normalize('NFC'));
  }
  function prepare(event){
    if(event.type==='auxclick'&&event.button!==1)return;
    const a=event.target.closest&&event.target.closest('a[href]');
    if(!a||!window.F9LessonEntry||!F9LessonEntry.key(a.href))return;
    try{
      const safe=bindAnchor(a);
      if(!safe)throw Error('PROFILE_CHANGED');
      const pass=F9LessonEntry.issue(safe);
      event.preventDefault();event.stopImmediatePropagation();
      // Navigate the existing context: in-app browsers may leave a new blank window detached.
      try{window.name=pass}catch(_){}
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

  function bindAnchor(a){
    if(!a||!window.F9LessonEntry||!F9LessonEntry.key(a.href))return null;
    if(!identityMatches(new URL(a.href).searchParams))return null;
    const safe=F9LessonEntry.link(a.href,parentHash);
    if(a.href!==safe)a.href=safe;
    return safe;
  }
  function decorateLinks(){
    document.querySelectorAll('a[href]').forEach(a=>{try{bindAnchor(a)}catch(_){}});
  }
  // Keep rendered URLs identity-bound; only the verified click issues a session grant.
  let pending=false;
  function scheduleLinks(){
    if(pending)return;pending=true;
    queueMicrotask(()=>{pending=false;decorateLinks()});
  }
  new MutationObserver(records=>{
    if(records.some(r=>r.type==='attributes'||Array.from(r.addedNodes).some(n=>n.nodeType===1&&(n.matches('a[href]')||n.querySelector('a[href]')))))scheduleLinks();
  }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['href','hidden']});
  decorateLinks();
  document.addEventListener('pointerdown',event=>{try{bindAnchor(event.target.closest&&event.target.closest('a[href]'))}catch(_){}},true);
  document.addEventListener('contextmenu',event=>{try{bindAnchor(event.target.closest&&event.target.closest('a[href]'))}catch(_){}},true);
  document.addEventListener('click',prepare,true);
  document.addEventListener('auxclick',prepare,true);
})();
