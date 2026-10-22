/* Browser-only sharing deterrent. Public original lesson assets are unchanged. */
(function(root){
  'use strict';
  const MARK='mtt-kids-ta-window-entry-20261016';
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
  // Browser-only handoff, not authentication. Public original lessons stay public.
  // The complete URL works even when a webview discards tab memory or storage.
  const URL_MARK='dashboard-v2', STORE='mtt-lesson-url-handoff-v2:';
  function profileHash(value){
    try{
      const text=String(value||'').replace(/^#/,''),p=new URLSearchParams(text);
      const hash=(p.has('p')?p.get('p'):text).split(/[?&#]/,1)[0];
      return /^[A-Za-z0-9_-]{16,128}$/.test(hash)?hash:null;
    }catch(_){return null}
  }
  function remember(k,hash){
    try{
      const value=JSON.stringify({marker:URL_MARK,key:k,profile:hash});
      if(root.localStorage.getItem(STORE+k)!==value)root.localStorage.setItem(STORE+k,value);
    }catch(_){}
  }
  function link(value,profile){
    const k=key(value),hash=profileHash(profile);
    if(!k||!hash)throw Error('INVALID_ENTRY');
    const u=new URL(value,root.location.href);
    u.searchParams.set('mtt_entry',URL_MARK);
    u.searchParams.set('mtt_profile',hash);
    remember(k,hash);
    return u.href;
  }
  function issue(value){
    const k=key(value);if(!k)throw Error('INVALID_ENTRY');
    return JSON.stringify({marker:MARK,key:k,at:Date.now()});
  }
  function enter(value){
    const k=key(value);if(!k)return false;
    const p=new URL(value,root.location.href).searchParams;
    const hasUrlPass=p.has('mtt_entry')||p.has('mtt_profile');
    if(hasUrlPass){
      if(p.getAll('mtt_entry').length!==1||p.getAll('mtt_profile').length!==1||p.get('mtt_entry')!==URL_MARK)return false;
      const hash=profileHash(p.get('mtt_profile'));
      if(!hash||hash!==p.get('mtt_profile'))return false;
      remember(k,hash);
      return true;
    }
    // Compatibility for already-open dashboard tabs and reloads of old links.
    try{
      const saved=JSON.parse(root.localStorage.getItem(STORE+k)||'null');
      if(saved&&saved.marker===URL_MARK&&saved.key===k&&profileHash(saved.profile)===saved.profile)return true;
    }catch(_){}
    try{
      const pass=JSON.parse(root.name||'null');
      return !!(pass&&pass.marker===MARK&&pass.key===k&&Number.isFinite(pass.at)&&Date.now()>=pass.at&&Date.now()-pass.at<43200000);
    }catch(_){return false}
  }
  root.LessonDashboardEntry=Object.freeze({key,issue,enter,link,profileHash,ENTRY});
})(window);
