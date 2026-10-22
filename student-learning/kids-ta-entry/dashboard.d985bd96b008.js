(function(){
  'use strict';
  const routes={"u90k1f5e":"KIDS 7","byogxkvy":"KIDS 8","iw6h6bmb":"KIDS 10","r60hdc1i":"KIDS 11","chaq17fk":"KIDS 14","y31ibppw":"KIDS 15","gu159u7j":"KIDS 17","uee89ho9":"KIDS 18","ywxrw9yp":"KIDS 19","l8tzmx20":"KIDS 20","rge9fi0s":"KIDS 21","muqt11rj":"KIDS 22","3lu0698p":"KIDS 23","myude9i0":"KIDS 25","i8a0r77q":"KIDS 26","qo7alz0y":"KIDS 27","xcxhducu":"KIDS 28","9fpwzhnz":"KIDS 29","31wagboo":"KIDS 30","juzwewi0":"KIDS 31","wfyjrm4m":"KIDS 32","firegh4f":"KIDS 33","u1g9ay98":"KIDS 34","63habmwz":"KIDS 35","odwhkat1":"KIDS 36","d5f9almb":"KIDS 37","p8qdzsoa":"KIDS 38","1t5tlkn7":"KIDS 39","6shx6heb":"TA6","qhaj55f2":"TA7"};
  const match=/^\/([^/]+)\/(?:index\.html)?$/.exec(location.pathname);
  const expected=match&&routes[match[1]];
  if(!expected)return;
  const parentHash=location.hash;
  function identityMatches(params){
    if(location.hash!==parentHash||!parentHash||params.get('mtt_class')!==expected)return false;
    const name=params.get('mtt_name').trim().normalize('NFC');
    if(expected.startsWith('KIDS')){
      const gate=document.getElementById('entryGate'),shell=document.getElementById('dashboardShell'),label=document.getElementById('activeChild');
      return !!(gate&&gate.hidden&&shell&&!shell.hidden&&label&&label.textContent.trim().normalize('NFC')==='Hồ sơ · '+name);
    }
    const gate=document.getElementById('student-gateway'),bar=document.getElementById('student-context'),label=document.getElementById('selected-student');
    const expectedLabel=name+(params.get('mtt_english')?' · '+params.get('mtt_english').normalize('NFC'):'');
    return !!(gate&&gate.hidden&&bar&&!bar.hidden&&document.body.classList.contains('portal-ready')&&label&&label.textContent.trim().normalize('NFC')===expectedLabel);
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
