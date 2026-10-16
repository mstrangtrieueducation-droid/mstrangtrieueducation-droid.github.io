/* F9-only, client-side entry control. Not authentication for public lesson assets. */
(function(root){
  'use strict';
  const PREFIX='mtt:f9:entry:20261016:',SESSION='mtt:f9:lesson-session:20261016',STAFF='mtt:f9:staff:20261016';
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
  function read(store,k){try{return JSON.parse(store.getItem(k)||'null')}catch(_){return null}}
  function fresh(value,maxAge){return !!value&&Number.isFinite(value.at)&&Date.now()>=value.at&&Date.now()-value.at<maxAge}
  function staff(){return fresh(read(root.localStorage,STAFF),8*3600000)}
  function setStaff(on){root.localStorage.setItem(STAFF,JSON.stringify(on?{at:Date.now()}:null));}
  function issue(value){
    const k=key(value);if(!k)throw Error('INVALID_ENTRY');
    const bytes=new Uint8Array(24);root.crypto.getRandomValues(bytes);
    const ticket=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
    const s=root.localStorage;
    for(let i=s.length-1;i>=0;i--){const n=s.key(i);if(n&&n.startsWith(PREFIX)&&!fresh(read(s,n),120000))s.removeItem(n);}
    const record={key:k,at:Date.now()};s.setItem(PREFIX+ticket,JSON.stringify(record));
    if(!read(s,PREFIX+ticket))throw Error('STORAGE_UNAVAILABLE');
    const url=new URL(value);url.searchParams.set('entry',ticket);return url.href;
  }
  function enter(value){
    const k=key(value);if(!k)return false;
    const url=new URL(value),ticket=url.searchParams.get('entry');
    let admitted=false;
    if(ticket&&/^[a-f0-9]{48}$/.test(ticket)){
      const grant=read(root.localStorage,PREFIX+ticket);
      if(grant&&grant.key===k&&fresh(grant,120000)){
        root.sessionStorage.setItem(SESSION,JSON.stringify({key:k,at:Date.now()}));
        root.localStorage.removeItem(PREFIX+ticket);admitted=true;
      }
    }
    const session=read(root.sessionStorage,SESSION);
    return admitted||staff()||!!(session&&session.key===k&&fresh(session,12*3600000));
  }
  root.F9LessonEntry=Object.freeze({key,issue,enter,staff,setStaff,ENTRY});
})(window);
