/* Browser-only sharing deterrent. Public original lesson assets are unchanged. */
(function(root){
  'use strict';
  const MARK='mtt-kids-ta-window-entry-20261016',STAFF='mtt_kids_ta_staff_20261016';
  const ENTRY='/student-learning/kids-ta-entry/';
  const classes=new Set(["KIDS 7","KIDS 8","KIDS 10","KIDS 11","KIDS 14","KIDS 15","KIDS 17","KIDS 18","KIDS 19","KIDS 20","KIDS 21","KIDS 22","KIDS 23","KIDS 25","KIDS 26","KIDS 27","KIDS 28","KIDS 29","KIDS 30","KIDS 31","KIDS 32","KIDS 33","KIDS 34","KIDS 35","KIDS 36","KIDS 37","KIDS 38","KIDS 39","TA6","TA7"]);
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
  function staff(){try{return root.document.cookie.split(';').some(x=>x.trim()===(root.location.pathname.startsWith('/student-learning/class-entry/staff-')?'mtt_class_staff_20261016':STAFF)+'=yes')}catch(_){return false}}
  function setStaff(on){
    const suffix='; Max-Age='+(on?28800:0)+'; SameSite=Strict; Secure';
    root.document.cookie=STAFF+'='+(on?'yes':'')+'; Path=/student-learning/kids-ta-entry/'+suffix;
    // Unified teacher preview; existing gate assets remain unchanged.
    root.document.cookie='mtt_class_staff_20261016='+(on?'yes':'')+'; Path=/student-learning/class-entry/'+suffix;
    root.document.cookie='mtt_f9_staff_20261016='+(on?'yes':'')+'; Path=/student-learning/fighter9/'+suffix;
    if(staff()!==on)throw Error('STAFF_NOT_SAVED');
  }
  function issue(value){const k=key(value);if(!k)throw Error('INVALID_ENTRY');return JSON.stringify({marker:MARK,key:k,at:Date.now()});}
  function enter(value){
    const k=key(value);if(!k)return false;
    if(staff())return true;
    try{const p=JSON.parse(root.name||'null');return !!(p&&p.marker===MARK&&p.key===k&&Number.isFinite(p.at)&&Date.now()>=p.at&&Date.now()-p.at<43200000)}catch(_){return false}
  }
  root.LessonDashboardEntry=Object.freeze({key,issue,enter,staff,setStaff,ENTRY});
})(window);
