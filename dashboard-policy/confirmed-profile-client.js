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
    present(retain(value,packet));packet=copy(value);sequence++;keyPromise.then(function(key){if(!revoked&&!ended)disk(key,{schema:2,packet:packet,savedAt:Date.now()});});if(loaded)loaded(value);
   }}),client=original.call(api,opts),request=client.request;
   function current(){return !revoked&&!ended&&(!options.isCurrent||options.isCurrent()===true);}
   function revoke(){ended=true;packet=null;keyPromise.then(function(key){disk(key,null);});}
   root.addEventListener('mtt:profile-revoked',revoke);
   root.addEventListener('hashchange',function(){ended=true;packet=null;});
   async function prior(){if(!current())return null;if(packet)return packet;var key=await keyPromise,record=await disk(key);if(record&&record.schema===2&&record.packet&&record.packet.actions&&current())packet=record.packet;return packet;}
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
