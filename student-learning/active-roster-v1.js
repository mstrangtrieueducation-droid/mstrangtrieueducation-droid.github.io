/* DASHBOARD_ACTIVE_ROSTER_V2_FAIL_OPEN: advisory check; only confirmed revocation blocks. */
(function(){'use strict';
 var cfg=document.currentScript.dataset,endpoint=cfg.access,key=cfg.classKey,originalFetch=window.fetch.bind(window),pending,revoked=false,stopped=false,timer,hashPromise;
 // Repair tracking appended after #p as well as ordinary query parameters, before native scripts parse the URL.
 function cleanUrl(){
  var u=new URL(location.href),raw=u.hash.slice(1),tracking=/^(fbclid|gclid|dclid|msclkid|mibextid|igshid|mc_cid|mc_eid|utm_[a-z0-9_]+)$/i;
  raw=raw.replace(/\?(?=(?:fbclid|gclid|dclid|msclkid|mibextid|igshid|mc_cid|mc_eid|utm_[a-z0-9_]+)=)/ig,'&');
  var params=new URLSearchParams(raw),tokens=params.getAll('p');
  if(!tokens.length||tokens.some(function(t){return t!==tokens[0];})||!/^[A-Za-z0-9_-]{22}$/.test(tokens[0]))return null;
  var changed=false;[params,u.searchParams].forEach(function(p){Array.from(p.keys()).forEach(function(k){if(tracking.test(k)){p.delete(k);changed=true;}});});
  if(changed||raw!==u.hash.slice(1)){u.hash=params.toString();try{history.replaceState(history.state,'',u.href);}catch{}}
  return tokens[0];
 }
 var token;try{token=cleanUrl();}catch{return;}if(!token)return;
 function unblockUnknown(){if(revoked)return;document.documentElement.classList.remove('mtt-access-pending');var old=document.getElementById('mtt-access-message');if(old)old.remove();}
 unblockUnknown();
 function revokedError(){var e=Error('PARENT_LINK_REVOKED');e.code='PARENT_LINK_REVOKED';return e;}
 function confirmed(r,v){return r.status===410&&v&&v.revoked===true&&v.code==='PARENT_LINK_REVOKED';}
 function block(){
  if(revoked)return;revoked=true;clearTimeout(timer);
  var style=document.createElement('style');style.textContent='html.mtt-access-pending body>*:not(#mtt-access-message){visibility:hidden!important}#mtt-access-message{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:#f5f8f8;color:#102a46;font:600 20px/1.6 system-ui;text-align:center;padding:24px}';document.head.appendChild(style);document.documentElement.classList.add('mtt-access-pending');
  var box=document.getElementById('mtt-access-message');if(!box){box=document.createElement('div');box.id='mtt-access-message';box.setAttribute('role','status');(document.body||document.documentElement).appendChild(box);}box.textContent='Hồ sơ học viên này đã ngừng hoạt động';
  try{Object.keys(sessionStorage).filter(function(k){return /mtt.*(?:grant|entry|access)|learning.*grant/i.test(k);}).forEach(function(k){sessionStorage.removeItem(k);});}catch{}
  window.dispatchEvent(new CustomEvent('mtt:profile-revoked'));
 }
 function digest(){if(!hashPromise)hashPromise=Promise.resolve().then(function(){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));}).then(function(b){return Array.from(new Uint8Array(b),function(v){return v.toString(16).padStart(2,'0');}).join('');});return hashPromise;}
 function check(){
  if(revoked)return Promise.reject(revokedError());if(pending)return pending;
  var controller=typeof AbortController==='function'?new AbortController():null,deadline;
  var timeout=new Promise(function(resolve,reject){deadline=setTimeout(function(){if(controller)controller.abort();reject(Error('ACCESS_TIMEOUT'));},4000);});
  var operation=digest().then(function(h){var init={mode:'cors',cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'};if(controller)init.signal=controller.signal;return originalFetch(endpoint+'/access/'+key+'/'+h,init);}).then(function(r){return r.json().then(function(v){if(confirmed(r,v)){block();throw revokedError();}if(!r.ok||v.active!==true)throw Error('ACCESS_UNKNOWN');return true;});});
  pending=Promise.race([operation,timeout]).catch(function(e){if(revoked)throw revokedError();unblockUnknown();return false;}).then(function(value){clearTimeout(deadline);pending=null;return value;},function(e){clearTimeout(deadline);pending=null;throw e;});return pending;
 }
 window.MTTActiveRoster={check:check,isRevoked:function(){return revoked;}};
 window.fetch=function(input,init){
  var u;try{u=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href);}catch{return originalFetch(input,init);}
  var trusted=u.origin===new URL(endpoint).origin,backup=u.origin===location.origin&&/\/data\/(?:fallback\.json|[a-f0-9]{64}\.json)$/.test(u.pathname);
  if(!trusted&&!backup)return originalFetch(input,init);
  if(revoked)return Promise.reject(revokedError());
  // Never wait for the advisory permission request. Preserve the existing data/fallback loader.
  return originalFetch(input,init).then(function(r){
   if(revoked)throw revokedError();
   if(trusted&&r.status===410)return r.clone().json().then(function(v){if(confirmed(r,v)){block();throw revokedError();}return r;},function(){return r;});
   return r;
  });
 };
 function schedule(){clearTimeout(timer);if(!revoked&&!stopped&&!document.hidden)timer=setTimeout(function(){check().catch(function(){}).then(schedule);},30000);}
 function refresh(){check().catch(function(){}).then(schedule);}
 document.addEventListener('visibilitychange',function(){if(document.hidden){clearTimeout(timer);return;}refresh();});
 window.addEventListener('pageshow',function(e){if(e.persisted)refresh();});
 window.addEventListener('hashchange',function(){stopped=true;clearTimeout(timer);location.reload();});
 refresh();
})();
