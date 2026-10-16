/* Browser-only sharing deterrent. Public original lesson assets are unchanged. */
(function(root){
  'use strict';
  const MARK='mtt-class-window-entry-20261016';
  const ENTRY='/student-learning/class-entry/';
  const classes=new Set(['FIGHTER 5','FIGHTER 6','FIGHTER 7','FIGHTER 8','IELTS 45','IELTS 46','IELTS 47','IELTS 48','IELTS 49','IELTS 50','IELTS 51','IELTS 52']);
  function key(value){
    try{
      const u=new URL(value,root.location.href),p=u.searchParams;
      if(u.origin!==root.location.origin||u.pathname!==ENTRY)return null;
      if(['lesson','mtt_name','mtt_class'].some(k=>p.getAll(k).length!==1)||p.getAll('mtt_english').length>1||!classes.has(p.get('mtt_class'))||!p.get('mtt_name').trim())return null;
      const lesson=new URL(p.get('lesson'));
      if(lesson.origin!==root.location.origin||lesson.username||lesson.password||/^\/(student-learning|kids-learning)(\/|$)/.test(lesson.pathname))return null;
      return JSON.stringify([lesson.href,p.get('mtt_name'),p.get('mtt_class'),p.get('mtt_english')||'']);
    }catch(_){return null}
  }
  function issue(value){const k=key(value);if(!k)throw Error('INVALID_ENTRY');return JSON.stringify({marker:MARK,key:k,at:Date.now()});}
  function enter(value){
    const k=key(value);if(!k)return false;
    try{const p=JSON.parse(root.name||'null');return !!(p&&p.marker===MARK&&p.key===k&&Number.isFinite(p.at)&&Date.now()>=p.at&&Date.now()-p.at<43200000)}catch(_){return false}
  }
  root.LessonDashboardEntry=Object.freeze({key,issue,enter,ENTRY});
})(window);
