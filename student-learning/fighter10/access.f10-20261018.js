/* F10-only, client-side entry control. Not authentication for public lesson assets. */
(function(root){
  'use strict';
  const MARK='mtt-f10-window-entry-20261018';
  const ENTRY='/student-learning/fighter10/';
  function key(value){
    try{const u=new URL(value,root.location.href);
      if(u.origin!==root.location.origin||u.pathname!==ENTRY)return null;
      const p=u.searchParams;
      if(['lesson','mtt_name','mtt_class'].some(k=>p.getAll(k).length!==1)||p.get('mtt_class')!=='FIGHTER 10'||!p.get('mtt_name').trim())return null;
      const lesson=new URL(p.get('lesson'));
      if(lesson.origin!==root.location.origin||lesson.username||lesson.password||/^\/(student-learning|kids-learning)(\/|$)/.test(lesson.pathname))return null;
      return JSON.stringify([lesson.href,p.get('mtt_name'),p.get('mtt_class'),p.get('mtt_english')||'']);
    }catch(_){return null}
  }
  function fresh(value,maxAge){return !!value&&Number.isFinite(value.at)&&Date.now()>=value.at&&Date.now()-value.at<maxAge}
  function issue(value){const k=key(value);if(!k)throw Error('INVALID_ENTRY');return JSON.stringify({marker:MARK,key:k,at:Date.now()});}
  function enter(value){
    const k=key(value);if(!k)return false;
    try{const pass=JSON.parse(root.name||'null');return !!(pass&&pass.marker===MARK&&pass.key===k&&fresh(pass,12*3600000))}catch(_){return false}
  }
  root.F10LessonEntry=Object.freeze({key,issue,enter,ENTRY});
})(window);
