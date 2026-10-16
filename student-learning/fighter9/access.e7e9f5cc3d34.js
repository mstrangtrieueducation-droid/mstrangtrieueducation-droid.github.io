/* F9-only, client-side entry control. Not authentication for public lesson assets. */
(function(root){
  'use strict';
  const MARK='mtt-f9-window-entry-20261016',STAFF='mtt_f9_staff_20261016';
  const ENTRY='/student-learning/fighter9/';
  function key(value){
    try{const u=new URL(value,root.location.href);
      if(u.origin!==root.location.origin||u.pathname!==ENTRY)return null;
      const p=u.searchParams;
      if(['lesson','mtt_name','mtt_class'].some(k=>p.getAll(k).length!==1)||p.get('mtt_class')!=='FIGHTER 9'||!p.get('mtt_name').trim())return null;
      const lesson=new URL(p.get('lesson'));
      if(lesson.origin!==root.location.origin||lesson.username||lesson.password||/^\/(student-learning|kids-learning)(\/|$)/.test(lesson.pathname))return null;
      return JSON.stringify([lesson.href,p.get('mtt_name'),p.get('mtt_class'),p.get('mtt_english')||'']);
    }catch(_){return null}
  }
  function fresh(value,maxAge){return !!value&&Number.isFinite(value.at)&&Date.now()>=value.at&&Date.now()-value.at<maxAge}
  function staff(){try{return root.document.cookie.split(';').some(x=>x.trim()===STAFF+'=yes')}catch(_){return false}}
  function setStaff(on){root.document.cookie=STAFF+'='+(on?'yes':'')+'; Path=/student-learning/fighter9/; Max-Age='+(on?28800:0)+'; SameSite=Strict; Secure';if(staff()!==on)throw Error('STAFF_NOT_SAVED');}
  function issue(value){const k=key(value);if(!k)throw Error('INVALID_ENTRY');return JSON.stringify({marker:MARK,key:k,at:Date.now()});}
  function enter(value){
    const k=key(value);if(!k)return false;
    if(staff())return true;
    try{const pass=JSON.parse(root.name||'null');return !!(pass&&pass.marker===MARK&&pass.key===k&&fresh(pass,12*3600000))}catch(_){return false}
  }
  root.F9LessonEntry=Object.freeze({key,issue,enter,staff,setStaff,ENTRY});
})(window);
