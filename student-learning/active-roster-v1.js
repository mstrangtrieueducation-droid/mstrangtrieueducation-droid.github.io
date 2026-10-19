/* DASHBOARD_ACTIVE_ROSTER_V1: access only; no academic, Game or receipt transforms. */
(function(){'use strict';
 var cfg=document.currentScript.dataset,endpoint=cfg.access,key=cfg.classKey,originalFetch=window.fetch.bind(window),token=new URLSearchParams(location.hash.slice(1)).get('p'),pending,revoked=false,stopped=false,last=0,timer;
 if(!/^[A-Za-z0-9_-]{22}$/.test(token||''))return;
 var style=document.createElement('style');style.textContent='html.mtt-access-pending body>*:not(#mtt-access-message){visibility:hidden!important}#mtt-access-message{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:#f5f8f8;color:#102a46;font:600 20px/1.6 system-ui;text-align:center;padding:24px}';document.head.appendChild(style);document.documentElement.classList.add('mtt-access-pending');
 function show(message){var box=document.getElementById('mtt-access-message');if(!box){box=document.createElement('div');box.id='mtt-access-message';box.setAttribute('role','status');(document.body||document.documentElement).appendChild(box);}box.textContent=message;}
 function block(permanent){document.documentElement.classList.add('mtt-access-pending');show(permanent?'Hồ sơ học viên này đã ngừng hoạt động':'Chưa thể kiểm tra quyền truy cập. Vui lòng thử lại sau.');if(permanent){revoked=true;clearTimeout(timer);try{Object.keys(sessionStorage).filter(k=>/mtt.*(?:grant|entry|access)|learning.*grant/i.test(k)).forEach(k=>sessionStorage.removeItem(k));}catch{}window.dispatchEvent(new CustomEvent('mtt:profile-revoked'));}}
 var hashPromise=crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)).then(function(b){return Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');});
 function check(force){
  if(revoked)return Promise.reject(Error('PARENT_LINK_REVOKED'));if(pending)return pending;
  pending=hashPromise.then(h=>originalFetch(endpoint+'/access/'+key+'/'+h,{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(12000)})).then(async r=>{
   var v=await r.json();if(r.status===410&&v.revoked===true){block(true);throw Error('PARENT_LINK_REVOKED');}
   if(!r.ok||v.active!==true)throw Error('ACCESS_CHECK_UNAVAILABLE');if(revoked)throw Error('PARENT_LINK_REVOKED');last=Date.now();document.documentElement.classList.remove('mtt-access-pending');document.getElementById('mtt-access-message')?.remove();return true;
  }).catch(function(e){if(!revoked)block(false);throw e;}).finally(function(){pending=null;});return pending;
 }
 window.MTTActiveRoster={check:check,isRevoked:()=>revoked};
 window.fetch=function(input,init){var url=new URL(typeof input==='string'?input:input.url,location.href);
  if(/\.workers\.dev$/.test(url.hostname)||/\/data\/(?:fallback\.json|[a-f0-9]{64}\.json)$/.test(url.pathname)||url.hostname==='script.google.com')return check(false).then(()=>originalFetch(input,init)).then(async function(r){if(r.status===410){try{var v=await r.clone().json();if(v.revoked===true||v.code==='PARENT_LINK_REVOKED')block(true);}catch{}}return r;});
  return originalFetch(input,init);
 };
 function schedule(){clearTimeout(timer);if(!revoked&&!stopped&&!document.hidden)timer=setTimeout(function(){check(true).catch(()=>{}).finally(schedule);},30000);}
 document.addEventListener('visibilitychange',function(){if(document.hidden){clearTimeout(timer);return;}document.documentElement.classList.add('mtt-access-pending');check(true).catch(()=>{}).finally(schedule);});
 window.addEventListener('pageshow',function(e){if(e.persisted){document.documentElement.classList.add('mtt-access-pending');check(true).catch(()=>{}).finally(schedule);}});
 window.addEventListener('hashchange',function(){stopped=true;clearTimeout(timer);location.reload();});
 check(true).catch(()=>{}).finally(schedule);
})();
