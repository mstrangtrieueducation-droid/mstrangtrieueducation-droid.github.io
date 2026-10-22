(function(){
  'use strict';
  const routes={zredv9ef:'FIGHTER 5',hwz7zw86:'FIGHTER 6',dgpu6c9h:'FIGHTER 7',cecccjpg:'FIGHTER 8', '7rsn6kbh':'IELTS 45',xpe6dd4j:'IELTS 46',bhg37bsz:'IELTS 47',e73wgva4:'IELTS 48','9k6a4bxe':'IELTS 49',jbjdsuj7:'IELTS 50',np93vg0b:'IELTS 51',t2n2eyyu:'IELTS 52'};
  const match=/^\/([^/]+)\/(?:index\.html)?$/.exec(location.pathname);
  const expected=match&&routes[match[1]];
  if(!expected)return;
  const parentHash=location.hash;
  function identityMatches(params){
    if(location.hash!==parentHash||!parentHash||params.get('mtt_class')!==expected)return false;
    const name=params.get('mtt_name').trim().normalize('NFC');
    if(expected.startsWith('FIGHTER')){
      const gate=document.getElementById('student-gateway'),label=document.querySelector('#student-profile .student-name');
      return !!(gate&&gate.hidden&&label&&label.textContent.trim().normalize('NFC')===name);
    }
    const gate=document.getElementById('student-gate'),shell=document.getElementById('portal-shell'),bar=document.getElementById('portal-student-bar'),label=document.getElementById('portal-student-name');
    return !!(gate&&gate.hidden&&shell&&!shell.hidden&&bar&&!bar.hidden&&label&&label.textContent.trim().normalize('NFC').startsWith(name+' · '));
  }
  function prepare(event){
    if(event.type==='auxclick'&&event.button!==1)return;
    const a=event.target.closest&&event.target.closest('a[href]');
    if(!a||!window.LessonDashboardEntry||!LessonDashboardEntry.key(a.href))return;
    try{
      const safe=bindAnchor(a);
      if(!safe)throw Error('PROFILE_CHANGED');
      const pass=LessonDashboardEntry.issue(safe);
      event.preventDefault();event.stopImmediatePropagation();
      // Navigate the existing context: in-app browsers may leave a new blank window detached.
      try{window.name=pass}catch(_){}
      window.location.assign(safe);
      document.documentElement.dataset.lessonEntryState='opened';
      const notice=document.getElementById('lesson-entry-notice');if(notice)notice.remove();
    }catch(error){
      event.preventDefault();event.stopImmediatePropagation();
      document.documentElement.dataset.lessonEntryState=String(error&&error.message||'entry-failed');
      let notice=document.getElementById('lesson-entry-notice');
      if(!notice){notice=document.createElement('p');notice.id='lesson-entry-notice';notice.setAttribute('role','alert');a.insertAdjacentElement('afterend',notice)}
      notice.textContent='Chưa mở được phiên bài học. Bố mẹ tải lại hồ sơ rồi bấm lại bài giúp con nhé.';
    }
  }

  function bindAnchor(a){
    if(!a||!window.LessonDashboardEntry||!LessonDashboardEntry.key(a.href))return null;
    if(!identityMatches(new URL(a.href).searchParams))return null;
    const safe=LessonDashboardEntry.link(a.href,parentHash);
    if(a.href!==safe)a.href=safe;
    return safe;
  }
  function decorateLinks(){
    document.querySelectorAll('a[href]').forEach(a=>{try{bindAnchor(a)}catch(_){}});
  }
  // Decorate rendered links before context-menu/new-tab navigation, too.
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
