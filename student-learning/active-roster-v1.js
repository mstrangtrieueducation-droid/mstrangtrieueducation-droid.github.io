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

/* SHARED_CONFIRMED_CORE_CLIENT_V2 */
/* CONFIRMED_PROFILE_CLIENT_V2: validated profile fallback, scoped by token hash. */
(function(root){'use strict';
 var names=['KidsPreparedSnapshotClient','IeltsPublicSnapshotClient','FighterSnapshotClient','TaSnapshotClient'];
 var revoked=false,dbPromise;
 function copy(v){return JSON.parse(JSON.stringify(v));}
 function present(v){
  if(typeof v==='string')return v.replace(/cần đối chiếu/gi,function(s){return s[0]===s[0].toUpperCase()?'Cô sẽ kiểm tra':'cô sẽ kiểm tra';}).replace(/Đang cập nhật|Đang xác minh|Đang xác nhận|Chưa đọc đủ/gi,'— Chưa nộp bài').replace(/Hồ sơ chưa tải xong|Chưa thể kết nối hồ sơ|Chưa thể kiểm tra quyền truy cập/gi,'Hồ sơ học tập');
  if(v&&typeof v==='object')Object.keys(v).forEach(function(k){v[k]=present(v[k]);});return v;
 }
 function withdraw(v){
  if(!v||typeof v!=='object')return v;
  if(typeof v.complete==='boolean'&&typeof v.freshRead==='boolean'){v.complete=false;v.freshRead=false;}
  Object.keys(v).forEach(function(k){withdraw(v[k]);});return v;
 }
 function retain(next,old){
  if(!old||next.className!==old.className||next.alias&&next.alias!==old.alias||next.name&&next.name!==old.name||next.identity&&next.identity!==old.identity)return next;
  var a=next.actions&&next.actions.submissions,b=old.actions&&old.actions.submissions;if(!a||!b||a.className!==b.className)return next;
  var failed=(a.coverage||[]).filter(function(c){return !c.complete||!c.freshRead;}).map(function(c){return c.family;});if(!failed.length)return next;
  ['receipts','emptyReceipts'].forEach(function(k){var map={};(b[k]||[]).forEach(function(r){if(r.id&&(failed.indexOf(r.family)>=0||failed.indexOf('OPTIONAL_SOURCE')>=0))map[r.id]=copy(r);});(a[k]||[]).forEach(function(r){if(r.id)map[r.id]=r;});a[k]=Object.keys(map).map(function(k){return map[k];});});
  if(next.actions.bootstrap&&next.actions.bootstrap.preparedSubmissions)next.actions.bootstrap.preparedSubmissions=a;
  next.sourceStatus=Object.assign({},next.sourceStatus,{retainedReceiptAsOf:old.sourceStatus&&old.sourceStatus.receiptAsOf||old.capturedAt});return next;
 }
 // Availability of a validated prepared core is separate from freshness/completeness
 // of supplementary sources. This marker never promotes receipt verification.
 function available(packet){if(!packet||!packet.actions)return packet;var a=packet.actions,b=a.bootstrap;
  [a.dashboard,a.profile,b,b&&b.dashboard,b&&b.profile].forEach(function(v){if(v&&typeof v==='object'){
   v.coreAvailableForViewV2=true;
   if(Array.isArray(v.errors)&&v.errors.length){v.optionalSourceErrors=copy(v.errors);v.errors=[];}
  }});
  if(packet.classNumber&&b&&b.partial){b.optionalSourcesPartial=true;b.partial=false;}return packet;
 }
 function database(){if(!dbPromise)dbPromise=new Promise(function(resolve){
  try{var r=root.indexedDB.open('mtt-confirmed-profile-v2',1);r.onupgradeneeded=function(){r.result.createObjectStore('profiles');};r.onsuccess=function(){resolve(r.result);};r.onerror=function(){resolve(null);};r.onblocked=function(){resolve(null);};}catch(e){resolve(null);}
 });return dbPromise;}
 async function disk(key,value){try{var db=await database();if(!db)return null;return await new Promise(function(resolve){var t=db.transaction('profiles',value===undefined?'readonly':'readwrite'),s=t.objectStore('profiles'),r=value===undefined?s.get(key):value===null?s.delete(key):s.put(value,key);r.onsuccess=function(){resolve(r.result||null);};r.onerror=function(){resolve(null);};t.onabort=function(){resolve(null);};});}catch(e){return null;}}
 function dead(e){return /^(PARENT_LINK_REVOKED|LINK_REVOKED|TOKEN_REVOKED|PARENT_LINK_INVALID|INVALID_LINK|INVALID_TOKEN)$/.test(e&&e.code||'');}
 function temporary(e){return /^(SOURCE_UNAVAILABLE|DATA_UNAVAILABLE|SNAPSHOT_NOT_READY|SNAPSHOT_PREPARING|NETWORK_ERROR|HTTP_5\d\d)$/.test(e&&e.code||'')||e&&/^(TypeError|AbortError)$/.test(e.name);}
 function install(api,label){if(!api||!api.create||api.confirmedProfilePolicy===2)return api;
  var original=api.create;api.create=function(options){
   var packet=null,sequence=0,ended=false,keyPromise=Promise.resolve().then(function(){return root.crypto.subtle.digest('SHA-256',new TextEncoder().encode(options.token));}).then(function(b){return location.pathname+'|'+label+'|'+String(options.className||options.classNumber||'')+'|'+Array.from(new Uint8Array(b),function(n){return n.toString(16).padStart(2,'0');}).join('');});
   var loaded=options.onLoaded,opts=Object.assign({},options,{onLoaded:function(value){
    available(present(retain(value,packet)));packet=copy(value);sequence++;keyPromise.then(function(key){if(!revoked&&!ended)disk(key,{schema:2,packet:packet,savedAt:Date.now()});});if(loaded)loaded(value);
   }}),client=original.call(api,opts),request=client.request;
   function current(){return !revoked&&!ended&&(!options.isCurrent||options.isCurrent()===true);}
   function revoke(){ended=true;packet=null;keyPromise.then(function(key){disk(key,null);});}
   root.addEventListener('mtt:profile-revoked',revoke);
   root.addEventListener('hashchange',function(){ended=true;packet=null;});
   async function prior(){if(!current())return null;if(packet)return packet;var key=await keyPromise,record=await disk(key);if(record&&record.schema===2&&record.packet&&record.packet.actions&&current())packet=available(record.packet);return packet;}
   async function fallback(action,args){
    var p=await prior();if(!p||!current())return null;
    var a={refreshDashboard:'dashboard',refreshProfile:'profile'}[action]||action,value;
    if(a==='history'&&args[2]&&p.historyPages){var extra=args[2];if(p.actions.bootstrap&&p.actions.bootstrap.preparedSource&&p.actions.bootstrap.preparedSource.generation===extra.generation)value=p.historyPages[String(extra.historyPage)];}
    else value=p.actions[a];
    if(value===undefined)return null;document.documentElement.dataset.confirmedProfileFallback='true';return {value:present(withdraw(copy(value)))};
   }
   client.request=async function(action){
    var args=Array.prototype.slice.call(arguments),last=await prior(),work=Promise.resolve().then(function(){return request.apply(client,args);});
    var settle=work.then(function(value){if(!current())return {ok:false,error:Object.assign(Error('SESSION_ENDED'),{code:'SESSION_ENDED'})};return {ok:true,value:present(value)};},function(error){if(dead(error))revoke();return {ok:false,error:error};});
    var timer,result;
    if(last){result=await Promise.race([settle,new Promise(function(resolve){timer=setTimeout(function(){resolve(null);},650);})]);clearTimeout(timer);if(!result){var saved=await fallback(action,args);if(saved)return saved.value;result=await settle;}}
    else result=await settle;
    if(result.ok)return result.value;
    if(dead(result.error)){revoke();throw result.error;}
    if(temporary(result.error)){var saved=await fallback(action,args);if(saved)return saved.value;}
    throw result.error;
   };
   if(client.response)client.response=function(action,force,extra){return client.request(action,force,extra).then(function(data){return {ok:true,status:200,json:function(){return Promise.resolve({ok:true,data:data});}};},function(e){if(!dead(e))throw e;return {ok:true,status:200,json:function(){return Promise.resolve({ok:false,revoked:true,code:'PARENT_LINK_REVOKED'});}};});};
   return client;
  };api.confirmedProfilePolicy=2;return api;
 }
 names.forEach(function(name){var value=root[name];Object.defineProperty(root,name,{configurable:true,enumerable:true,get:function(){return value;},set:function(v){value=install(v,name);}});if(value)root[name]=value;});
 root.addEventListener('mtt:profile-revoked',function(){revoked=true;});
 root.ConfirmedProfilePolicyV2={present:present,withdraw:withdraw,retain:retain};
})(typeof window!=='undefined'?window:globalThis);

(function(root){'use strict';
 var canonical=(function (root) {




  'use strict';




  var own = Object.prototype.hasOwnProperty;




  function failure(code) { var e = new Error(code); e.code = code; return e; }




  function copy(value) { return JSON.parse(JSON.stringify(value)); }




  function object(value) { return value && typeof value === 'object' && !Array.isArray(value); }




  function finite(value) { return typeof value === 'number' && isFinite(value); }




  function alias(value) {




    var result = String(typeof value === 'string' ? value : value && (value.alias || value.englishName || value.value) || '').trim().toUpperCase();




    return result.normalize ? result.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/Đ/g, 'D').replace(/[^A-Z0-9]/g, '') : result;




  }




  function verified(value) { return object(value) && value.complete === true && value.freshRead === true && finite(Number(value.verifiedAt)) && Number(value.verifiedAt) > 0; }




  function withdrawn(value) { return object(value) && value.complete === false && value.freshRead === false; }




  function unpack(value) {




    if (object(value) && value.schema === 1 && object(value.actions) && object(value.actions.bootstrap) && object(value.actions.submissions) && !own.call(value.actions,'dashboard') && !own.call(value.actions,'profile')) {




      value.actions.dashboard=value.actions.bootstrap.dashboard;




      value.actions.profile=value.actions.bootstrap.profile;




      value.actions.bootstrap.preparedSubmissions=value.actions.submissions;




      return value;




    }




    if (!object(value) || !own.call(value, 'wireSchema')) return value;




    if (value.wireSchema !== 1 || Object.keys(value).sort().join('|') !== 'bootstrap|bundle|check|embeddedSubmissions|submissions|wireSchema' ||




        !object(value.bundle) || own.call(value.bundle, 'actions') || !object(value.check) || !object(value.bootstrap) ||




        own.call(value.bootstrap, 'preparedSubmissions') || !object(value.submissions) || typeof value.embeddedSubmissions !== 'boolean') throw failure('INVALID_SNAPSHOT');




    var result = {}, bootstrap = {};




    Object.keys(value.bundle).forEach(function (key) { result[key] = value.bundle[key]; });




    Object.keys(value.bootstrap).forEach(function (key) { bootstrap[key] = value.bootstrap[key]; });




    if (value.embeddedSubmissions) bootstrap.preparedSubmissions = value.submissions;




    result.actions = {check: value.check, bootstrap: bootstrap, dashboard: bootstrap.dashboard, profile: bootstrap.profile, submissions: value.submissions};




    return result;




  }




  function validate(value, options, now) {




    var className = 'KIDS ' + options.classNumber;




    if (!object(value) || value.schema !== 1 || value.classNumber !== options.classNumber || value.className !== className || !alias(value.alias) || typeof value.rosterRevision !== 'string' || !value.rosterRevision) throw failure('INVALID_SCOPE');




    var fallback = Boolean(value.sourceStatus && value.sourceStatus.servingLastConfirmed === true);




    // SNAPSHOT_SERVER_AUTHORITY_V1: the server owns freshness; device time cannot refuse this pupil's package.




    var actions = value.actions, target = alias(value.alias), keys = ['check', 'bootstrap', 'dashboard', 'profile', 'submissions'];




    if (!object(actions) || keys.some(function (key) { return !object(actions[key]); })) throw failure('INVALID_SNAPSHOT');




    function scoped(part, name, directory) {




      if (!object(part) || part.classNumber !== options.classNumber || part.className !== className) throw failure('INVALID_SCOPE');




      if (directory && (!Array.isArray(part.studentAliases) || part.studentAliases.length !== 1 || alias(part.studentAliases[0]) !== target)) throw failure('INVALID_SCOPE');




      if (name && alias(part.englishName || part.alias) !== target) throw failure('INVALID_SCOPE');




      if (own.call(part, 'rosterRevision') && part.rosterRevision !== value.rosterRevision) throw failure('INVALID_SCOPE');




    }




    scoped(actions.check, false, true); scoped(actions.bootstrap, false, true); scoped(actions.dashboard, false, true); scoped(actions.profile, true, false);




    var boot = actions.bootstrap;




    scoped(boot.dashboard, false, true); scoped(boot.profile, true, false);




    if (!(Number(boot.sourceModelBuiltAt) > 0) || Number(boot.sourceModelBuiltAt) !== Number(boot.profile.sourceModelBuiltAt) || !(Number(boot.dashboard.snapshotBuiltAt) > 0) || !(Number(boot.profile.snapshotBuiltAt) > 0)) throw failure('INVALID_SNAPSHOT');




    if (JSON.stringify(boot.dashboard) !== JSON.stringify(actions.dashboard) || JSON.stringify(boot.profile) !== JSON.stringify(actions.profile)) throw failure('INVALID_SNAPSHOT');




    var sub = actions.submissions;




    if (sub.className !== className || sub.schema !== 1 || !Array.isArray(sub.receipts) || !Array.isArray(sub.coverage) || !sub.coverage.length || own.call(sub, 'emptyReceipts') && !Array.isArray(sub.emptyReceipts)) throw failure('INVALID_SNAPSHOT');




    if (sub.assignmentAuthority && sub.assignmentAuthority.className !== className) throw failure('INVALID_SCOPE');




    // CORE_PROFILE_POLICY_V2: optional completeness does not own profile availability.
    if (!sub.coverage.every(function(c){return object(c)&&typeof c.family==='string'&&c.family!=='*'&&typeof c.complete==='boolean'&&typeof c.freshRead==='boolean';}) || !object(sub.submissionVerification) || typeof sub.submissionVerification.complete!=='boolean' || !object(sub.assignmentAuthority)) throw failure('INVALID_SNAPSHOT');
    if (boot.preparedHistory || sub.preparedProjection) {




      var generation = boot.preparedSource && boot.preparedSource.generation, embedded = boot.preparedSubmissions;




      if (!generation || !sub.preparedSource || sub.preparedSource.generation !== generation || !sub.preparedProjection || sub.preparedProjection.schema !== 1 || !embedded || !embedded.preparedSource || embedded.preparedSource.generation !== generation || !embedded.preparedProjection || embedded.preparedProjection.schema !== 1) throw failure('INVALID_SNAPSHOT');




      if (JSON.stringify(embedded) !== JSON.stringify(sub)) throw failure('INVALID_SNAPSHOT');




      var count = Number(boot.preparedHistory && boot.preparedHistory.pageCount), pages = value.historyPages;




      if (!finite(count) || count < 0 || Math.floor(count) !== count || !object(pages) || Object.keys(pages).length !== count) throw failure('INVALID_SNAPSHOT');




      for (var i = 0; i < count; i += 1) {




        var page = pages[String(i)];




        if (!object(page) || page.schema !== 1 || page.page !== i || !Array.isArray(page.entries) || page.classNumber !== options.classNumber || page.className !== className || alias(page.englishName) !== target || !page.preparedSource || page.preparedSource.generation !== generation) throw failure('INVALID_SNAPSHOT');




      }




    }




    // Prepared history and projected positives survive source failures, but no




    // nested receipt proof may accidentally reauthorize a negative status.




    if (fallback) (function visit(node) {




      if (!node || typeof node !== 'object') return;




      if (node.preparedSubmissionVerification && !withdrawn(node.preparedSubmissionVerification)) throw failure('INVALID_SNAPSHOT');




      Object.keys(node).forEach(function (key) { visit(node[key]); });




    })({actions: actions, historyPages: value.historyPages});




    return value;




  }




  function create(options) {




    if (!options || !/^https:\/\/[^\s/]+(?:\/[^\s]*)?$/.test(options.endpoint || '') && !/^http:\/\/127\.0\.0\.1:\d+\/v1\/parent$/.test(options.endpoint || '') || !/^[A-Za-z0-9_-]{22}$/.test(options.token || '') || !finite(options.classNumber) || options.classNumber <= 0) throw failure('INVALID_CONFIG');




    var cached = null, pending = null, generation = 0, controller = null;




    var now = options.now || Date.now, supported = ['check', 'bootstrap', 'dashboard', 'profile', 'submissions', 'history'];




    function current(epoch) { return epoch === generation && (!options.isCurrent || options.isCurrent() === true); }




    function clear() { generation += 1; cached = null; pending = null; if (controller) controller.abort(); }




    var endpoint = options.endpointPromise || Promise.resolve().then(function(){




      var cryptoImpl=root.crypto||root.webkitCrypto, subtle=cryptoImpl&&(cryptoImpl.subtle||cryptoImpl.webkitSubtle);




      if(!subtle)throw failure('CRYPTO_UNAVAILABLE');




      var bytes=new Uint8Array(options.token.length);for(var i=0;i<bytes.length;i++)bytes[i]=options.token.charCodeAt(i);




      return subtle.digest('SHA-256',bytes);




    }).then(function(bytes){var hex='',a=new Uint8Array(bytes);for(var i=0;i<a.length;i++)hex+=('0'+a[i].toString(16)).slice(-2);return options.endpoint.replace(/\/v1\/parent$/,'/data/'+options.classNumber+'/'+hex+'.json');});




    function load(force, live) {




      if (pending) return pending;




      // A prepared opening is one immutable read session. Existing background




      // consumers share it; explicit refresh/reopen may request a new package.




      // Keep the prior package visible when an explicit refresh fails.




      if (cached && !force && (options.sessionSnapshot === true || now() - cached.loadedAt < (options.clientCacheMs === undefined ? 15000 : options.clientCacheMs))) return Promise.resolve(cached.value);




      var epoch = generation, active = typeof AbortController === 'function' ? new AbortController() : null;




      controller = active;




      var timeout, finished = false;




      var work = new Promise(function (resolve, reject) {




        timeout = setTimeout(function () { if (finished) return; finished = true; if (active) active.abort(); reject(failure('SOURCE_UNAVAILABLE')); }, options.timeoutMs || 8000);




        var init = {method: 'GET', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer'};




        if (active) init.signal = active.signal;




        Promise.resolve().then(function () {




          if (options.onRequest) { try { options.onRequest(); } catch (_) {} }




          return endpoint.then(function(url){return live?(options.fetchImpl || root.fetch)(url.replace('/data/','/live-data/'),init):KidsClusterFallback.fetch(url, init, options.token, options.classNumber, options.fetchImpl || root.fetch);});




        }).then(function (response) {




          if (!current(epoch)) throw failure('SESSION_ENDED');




          if (!response.ok) throw failure('SNAPSHOT_NOT_READY');




          return response.text();




        }).then(function (text) {




          if (!current(epoch)) throw failure('SESSION_ENDED');




          if (text.length > (options.maxBodyChars || 8000000)) throw failure('INVALID_SNAPSHOT');




          var value; try { value = JSON.parse(text); } catch (_) { throw failure('INVALID_SNAPSHOT'); }




          value = unpack(value); validate(value, options, now());




          if (finished) return;




          finished = true; cached = {value: value, loadedAt: now()};




          if (options.onLoaded) { try { options.onLoaded(copy(value)); } catch (_) {} }




          resolve(value);




        }).catch(function (e) { if (finished) return; finished = true; if (e && e.code === 'PARENT_LINK_REVOKED') clear(); reject(e && e.code ? e : failure('SOURCE_UNAVAILABLE')); });




      });




      pending = work;




      var cleanup = function () { clearTimeout(timeout); if (pending === work) pending = null; if (controller === active) controller = null; };




      work.then(cleanup, cleanup);




      return work;




    }




    function request(action, force, extra) {




      if (supported.indexOf(action) < 0) return Promise.reject(failure('INVALID_REQUEST'));




      if (action === 'history') {




        extra = extra || {};




        var history = cached && cached.value, index = Number(extra.historyPage);




        if (!history || !finite(index) || index < 0 || Math.floor(index) !== index || !history.actions.bootstrap.preparedSource || history.actions.bootstrap.preparedSource.generation !== extra.generation || !history.historyPages || !history.historyPages[String(index)] || options.isCurrent && options.isCurrent() !== true) return Promise.reject(failure('INVALID_SCOPE'));




        return Promise.resolve(copy(history.historyPages[String(index)]));




      }




      return load(force === true && action === 'bootstrap').then(function (value) {




        if (options.isCurrent && options.isCurrent() !== true) throw failure('SESSION_ENDED');




        return copy(value.actions[action]);




      });




    }




    function response(action, force, extra) {




      return request(action, force, extra).then(function (data) { return {ok: true, status: 200, json: function () { return Promise.resolve({ok: true, data: data}); }}; }, function (error) {




        if (error.code !== 'PARENT_LINK_REVOKED') throw error;




        clear(); return {ok: true, status: 200, json: function () { return Promise.resolve({ok: false, revoked: true, code: 'PARENT_LINK_REVOKED'}); }};




      });




    }




    return {liveConfig:{endpoint:options.endpoint,classNumber:options.classNumber},request: request, response: response, clear: clear,



      requestLive: function(){var active=pending;return Promise.resolve(active).catch(function(){}).then(function(){return load(true,true);}).then(function(value){return copy(value.actions.bootstrap);});},




      hasSnapshot: function () { return Boolean(cached && (!options.isCurrent || options.isCurrent() === true)); },




      sourceStatus: function () {




        if (!cached || options.isCurrent && options.isCurrent() !== true) return {};




        var status = copy(cached.value.sourceStatus || {}), proof = cached.value.actions.submissions.submissionVerification;




        if (!status.receiptAsOf) status.receiptAsOf = Number(proof && proof.verifiedAt) || 0;




        if (!status.receiptStatusMode && verified(proof)) status.receiptStatusMode = 'native-confirmed';




        return status;




      },




      supports: function (action) { return supported.indexOf(action) >= 0; }};




  }




  var api = {create: create, validate: validate, unpack: unpack};




  return api;




  




})(root);
 var descriptor=Object.getOwnPropertyDescriptor(root,'KidsPreparedSnapshotClient');
 if(descriptor&&descriptor.set)descriptor.set.call(root,canonical);else root.KidsPreparedSnapshotClient=canonical;
 var protectedApi=root.KidsPreparedSnapshotClient;
 // Keep one class-scoped client contract even when a page template is rebuilt.
 Object.defineProperty(root,'KidsPreparedSnapshotClient',{configurable:true,enumerable:true,get:function(){return protectedApi;},set:function(){}});
})(window);
