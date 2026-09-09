/* Immutable, explicit-submit outbox for the integrated IELTS full test. */
(function(root){
  'use strict';
  const PREFIX='ielts-full-durable:v1:', memory=new Map(), active=new Map(), listeners=new Set();
  const copy=value=>JSON.parse(JSON.stringify(value));
  const fingerprints=new Map(),durableKeys=new Set(),storageChecked=new Set(),STORAGE_TIMEOUT=2500;
  let transport=null, retryTimer=null, dbPromise=null, retryDelay=15000;
  function storage(name,op,...args){try{return root[name][op](...args);}catch(_){return null;}}
  const samePayload=(a,b)=>JSON.stringify(a?.payload)===JSON.stringify(b?.payload);
  const canonical=p=>[p.module,String(p.score),String(p.maxScore),p.answerSummary].join('\n');
  async function fingerprint(record){
    if(record.kind!=='submission')return null;
    const text=canonical(record.payload);if(fingerprints.has(text))return fingerprints.get(text);
    const digest=await root.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
    const hash=Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,'0')).join('');fingerprints.set(text,hash);return hash;
  }
  function saved(record,expected){
    const p=record?.payload,r=record?.receipt;
    return record?.status==='saved'&&!!expected&&r?.ok===true&&r.moduleConfirmed===true&&Number(r.row)>0&&r.attemptId===p.attemptId&&r.requestId===p.requestId&&r.module===p.module&&Number(r.score)===p.score&&Number(r.maxScore)===p.maxScore&&r.payloadFingerprint===expected&&record.result?.score===p.score&&record.result?.maxScore===p.maxScore;
  }
  function normalize(record,expected){
    if(record?.kind==='submission'&&record.status==='saved'&&!saved(record,expected)){record=copy(record);record.status='pending';delete record.receipt;}
    return record;
  }
  function merge(current,next,expected){
    if(next?.kind!=='submission')return copy(next);
    if(current?.kind==='submission'&&!samePayload(current,next))return copy(current); // An attempt owns its first immutable request.
    if(saved(current,expected))return copy(current);
    return copy(normalize(next,expected));
  }
  function cached(key,next,expected){
    let value=next;
    if(memory.has(key))value=merge(memory.get(key),value,expected);
    for(const name of ['localStorage','sessionStorage']){
      const raw=storage(name,'getItem',PREFIX+key);if(raw)try{value=merge(JSON.parse(raw),value,expected);}catch(_){}
    }
    return value;
  }
  function renderStorageStatus(){
    if(!root.document?.body)return;
    const pending=[...memory.values()].some(record=>record.kind==='submission'&&record.status==='pending'&&storageChecked.has(record.key)&&!durableKeys.has(record.key));
    let notice=root.document.getElementById('ielts-full-storage-status');
    if(!pending){notice?.remove();return;}
    if(notice)return;
    notice=root.document.createElement('aside');notice.id='ielts-full-storage-status';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
    notice.textContent='Trình duyệt chưa lưu được bản dự phòng. Em giữ nguyên trang này đến khi có xác nhận lưu điểm.';
    notice.style.cssText='position:fixed;right:16px;bottom:16px;z-index:10000;max-width:420px;padding:14px 18px;border:1px solid #b77712;border-radius:8px;background:#fff7df;color:#593700;font:600 14px/1.5 system-ui;box-shadow:0 3px 16px #0002';
    root.document.body.appendChild(notice);
  }
  function cache(key,value,expected){
    let merged=cached(key,value,expected);
    for(const name of ['localStorage','sessionStorage']){
      // Read immediately before writing: a late failure must retain another tab's success.
      const raw=storage(name,'getItem',PREFIX+key);if(raw)try{merged=merge(JSON.parse(raw),merged,expected);}catch(_){}
      const rawValue=JSON.stringify(merged);storage(name,'setItem',PREFIX+key,rawValue);
      if(name==='localStorage'&&storage(name,'getItem',PREFIX+key)===rawValue)durableKeys.add(key);
    }
    memory.set(key,copy(merged));return merged;
  }
  function database(){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise(resolve=>{
      let settled=false;const timer=root.setTimeout(()=>finish(null),STORAGE_TIMEOUT);
      function finish(db){if(settled){if(db)try{db.close();}catch(_){}return;}settled=true;root.clearTimeout?.(timer);resolve(db);}
      try{
        const request=root.indexedDB.open('ielts-full-durable-v1',1);
        request.onupgradeneeded=()=>request.result.createObjectStore('records');
        request.onsuccess=()=>finish(request.result);
        request.onerror=()=>finish(null);
        request.onblocked=()=>finish(null);
      }catch(_){finish(null);}
    });
    return dbPromise;
  }
  async function dbCall(mode,operation){
    const db=await database();if(!db)return null;
    return new Promise(resolve=>{
      let tx,value=null,settled=false;const timer=root.setTimeout(()=>{try{tx?.abort();}catch(_){}finish(null);},STORAGE_TIMEOUT);
      function finish(result){if(settled)return;settled=true;root.clearTimeout?.(timer);resolve(result);}
      try{tx=db.transaction('records',mode);tx.oncomplete=()=>finish(value);tx.onerror=tx.onabort=()=>finish(null);operation(tx.objectStore('records'),result=>{value=result;});}catch(_){finish(null);}
    });
  }
  function read(key){
    if(memory.has(key))return copy(memory.get(key));
    for(const name of ['localStorage','sessionStorage']){
      const raw=storage(name,'getItem',PREFIX+key);if(!raw)continue;
      try{const value=JSON.parse(raw);memory.set(key,value);return copy(value);}catch(_){}
    }
    return null;
  }
  async function write(key,value){
    const frozen=copy(value);
    // Preserve intent synchronously as well as in IndexedDB before the first network operation.
    if(!memory.has(key))memory.set(key,frozen);
    const expected=await fingerprint(frozen);
    let merged=cache(key,normalize(frozen,expected),expected);
    const stored=await dbCall('readwrite',(store,done)=>{
      const request=store.get(key);
      request.onsuccess=()=>{const chosen=merge(request.result,merged,expected);store.put(chosen,key);done(chosen);};
    });
    if(stored){merged=stored;durableKeys.add(key);}
    // A receipt with a different frozen payload is validated against its own fingerprint.
    const finalExpected=await fingerprint(merged);
    merged=cache(key,normalize(merged,finalExpected),finalExpected);
    storageChecked.add(key);renderStorageStatus();
    return copy(merged);
  }
  const ready=(async()=>{
    for(const name of ['localStorage','sessionStorage']){
      let keys=[];try{keys=Object.keys(root[name]);}catch(_){}
      for(const key of keys)if(key.startsWith(PREFIX))read(key.slice(PREFIX.length));
    }
    const rows=await dbCall('readonly',(store,done)=>{const request=store.getAll();request.onsuccess=()=>done(request.result);});
    if(rows)for(const row of rows){const key=row.key;if(key){const expected=await fingerprint(row);memory.set(key,merge(memory.get(key),row,expected));}}
    for(const [key,row] of memory){const expected=await fingerprint(row);cache(key,normalize(row,expected),expected);}
  })();
  function emit(record){for(const listener of listeners)try{listener(copy(record));}catch(_){}}
  function schedule(){if(retryTimer!==null)return;const delay=Math.round(retryDelay*(0.8+Math.random()*0.4));retryDelay=Math.min(retryDelay*2,300000);retryTimer=root.setTimeout(()=>{retryTimer=null;resume();},delay);}
  function perform(record){
    if(active.has(record.key))return active.get(record.key);
    const work=(async()=>{
      record=await write(record.key,record); // Keep the exact payload before touching the network.
      if(saved(record,await fingerprint(record))){emit(record);return copy(record.result);}
      try{
        const receipt=await transport(copy(record.payload));
        record.status='saved';record.receipt=copy(receipt);record.result={...record.result,submissionId:receipt.attemptId,score:record.payload.score,maxScore:record.payload.maxScore};
        if(!saved(record,await fingerprint(record)))throw Error('Không xác nhận được đúng lượt nộp. Bài vẫn đang chờ gửi.');
        retryDelay=15000;record=await write(record.key,record);emit(record);return copy(record.result);
      }catch(error){record.status='pending';record=await write(record.key,record);emit(record);if(saved(record,await fingerprint(record)))return copy(record.result);schedule();throw error;}
    })();
    active.set(record.key,work);work.then(()=>active.delete(record.key),()=>active.delete(record.key));return work;
  }
  async function resume(){
    await ready;if(!transport||root.navigator?.onLine===false){schedule();return;}
    // Serialize background saves so reconnecting does not flood Apps Script.
    for(const record of [...memory.values()])if(record.kind==='submission'&&record.status==='pending')try{await perform(record);}catch(_){}
  }
  const api={
    register(fn){transport=fn;ready.then(resume);},
    async readDraft(key){
      await ready;
      let draft=read('draft:'+key);
      if(!draft){for(const name of ['localStorage','sessionStorage']){const raw=storage(name,'getItem',key);if(raw)try{draft=JSON.parse(raw);break;}catch(_){}}}
      const candidates=[...memory.values()].filter(r=>r.kind==='submission'&&r.draftKey===key).sort((a,b)=>b.createdAt-a.createdAt);
      if(!draft&&candidates.length)draft=copy(candidates[0].draft);
      if(!draft)return null;
      for(const record of memory.values())if(record.kind==='submission'&&record.draftKey===key&&record.payload.attemptId===draft.attemptId){
        const field=record.payload.module==='LISTENING'?'listening':'reading';draft[field]=copy(record.draft[field]);
        draft.name=record.payload.studentName;draft.studentClass=record.payload.studentClass;
        if(record.status==='saved')draft.results={...draft.results,[record.payload.module]:copy(record.result)};
      }
      return copy(draft);
    },
    writeDraft(key,draft){
      const value={...copy(draft),key:'draft:'+key};write('draft:'+key,value);
      // Preserve the deployed draft key so existing URLs and old sessions remain compatible.
      for(const name of ['localStorage','sessionStorage'])storage(name,'setItem',key,JSON.stringify(draft));
    },
    async submit(payload,context){
      const key='submission:'+payload.attemptId+':'+payload.module;
      let record=read(key);
      if(!record){record={key,kind:'submission',status:'pending',payload:copy(payload),result:copy(context.result),draft:copy(context.draft),draftKey:context.draftKey,createdAt:Date.now()};write(key,record);}
      if(!transport)throw Error('Hệ thống ghi điểm đang khởi động. Bài vẫn đang chờ gửi.');
      return perform(record);
    },
    locked(attemptId,module){return !!read('submission:'+attemptId+':'+module);},
    subscribe(attemptId,callback){const fn=record=>{if(record.kind==='submission'&&record.payload.attemptId===attemptId&&record.status==='saved')callback(record.payload.module,copy(record.result));};listeners.add(fn);ready.then(()=>{for(const record of memory.values())fn(record);resume();});return()=>listeners.delete(fn);},
    resume
  };
  root.addEventListener?.('online',resume);
  root.addEventListener?.('pageshow',resume);
  root.document?.addEventListener('DOMContentLoaded',renderStorageStatus);
  root.addEventListener?.('storage',event=>{
    if(!event.key?.startsWith(PREFIX)||!event.newValue)return;
    try{const row=JSON.parse(event.newValue);if(row.kind==='submission')write(event.key.slice(PREFIX.length),row).then(emit).catch(()=>{});}catch(_){}
  });
  root.IELTSFullDurable=api;
})(window);
