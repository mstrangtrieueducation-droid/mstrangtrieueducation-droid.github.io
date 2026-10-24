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
  // A click on a verified dashboard grants only this browsing session.
  // URL parameters and old shared localStorage records are never entry proofs.
  const STORE='mtt-lesson-session-entry-v3:'+MARK, TTL=43200000;
  function profileHash(value){
    try{const text=String(value||'').replace(/^#/,''),p=new URLSearchParams(text),hash=(p.has('p')?p.get('p'):text).split(/[?&#]/,1)[0];return /^[A-Za-z0-9_-]{16,128}$/.test(hash)?hash:null}catch(_){return null}
  }
  function link(value,profile){
    if(!key(value)||!profileHash(profile))throw Error('INVALID_ENTRY');
    const u=new URL(value,root.location.href);
    u.searchParams.delete('mtt_entry');u.searchParams.delete('mtt_profile');
    return u.href;
  }
  function valid(raw,k){
    try{const pass=JSON.parse(raw||'null'),age=Date.now()-pass.at;return !!(pass&&pass.marker===MARK&&pass.key===k&&Number.isFinite(pass.at)&&age>=0&&age<TTL)}catch(_){return false}
  }
  function issue(value){
    const k=key(value);if(!k)throw Error('INVALID_ENTRY');
    const pass=JSON.stringify({marker:MARK,key:k,at:Date.now()});let stored=false;
    try{root.sessionStorage.setItem(STORE,pass);stored=root.sessionStorage.getItem(STORE)===pass}catch(_){}
    try{root.name=pass;stored=stored||root.name===pass}catch(_){}
    if(!stored)throw Error('ENTRY_SESSION_UNAVAILABLE');
    return pass;
  }
  function enter(value){
    const k=key(value);if(!k)return false;
    try{if(valid(root.name,k))return true}catch(_){}
    try{if(valid(root.sessionStorage.getItem(STORE),k))return true}catch(_){}
    return false;
  }

  root.LessonDashboardEntry=Object.freeze({key,issue,enter,link,profileHash,ENTRY});
})(window);
