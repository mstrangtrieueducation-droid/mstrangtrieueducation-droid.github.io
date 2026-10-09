/* IELTS 50 public snapshot pilot. Source work belongs to the publisher. */
(function(root){
 'use strict';
 root.IeltsPublicSnapshotClient={create(options){
  const code=(value)=>Object.assign(new Error(value),{code:value});
  let pending=null,cached=null,epoch=0,controller=null;
  const supported=['bootstrap','check','dashboard','profile','refreshDashboard','refreshProfile','submissions'];
  const now=options.now||Date.now;
  const identity=async()=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(options.token))),v=>v.toString(16).padStart(2,'0')).join('');
  const id=identity();
  async function selected(){return (options.hashes||[]).includes(await id);}
  function clear(){epoch++;cached=null;controller?.abort();pending=null;}
  async function load(force){
   if(force){cached=null;}
   if(cached&&!cached.value.sourceStatus?.receiptProcessing&&now()-cached.loadedAt<30000)return cached.value;
   if(pending)return pending;
   const generation=epoch;controller=new AbortController();const active=controller;
   const work=(async()=>{
    const url=new URL((await id)+'.json',options.baseUrl);
    const timer=setTimeout(()=>active.abort(),options.timeoutMs||8000);
    try{
     const response=await (options.fetchImpl||fetch)(url.href,{credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',signal:active.signal});
     if(!response.ok)throw code(response.status===404?'INVALID_LINK':'SNAPSHOT_NOT_READY');
     const value=await response.json();
     if(generation!==epoch)throw code('INVALID_LINK');
     const age=now()-Date.parse(value.capturedAt),b=value.actions?.bootstrap;
     if(![1,2].includes(value.schemaVersion)||value.className!=='IELTS 50'||!Number.isFinite(age)||age<0||age>1800000||!b?.name||b.name!==value.name&&value.name!==undefined||!b.rosterRevision||b.dashboard?.className!=='IELTS 50'||b.profile?.student?.name!==b.name)throw code('SNAPSHOT_NOT_READY');
     for(const part of [b.dashboard,b.profile])if(part.parentName!==b.name||part.parentRosterRevision!==b.rosterRevision||part.studentDirectory?.all?.length!==1||part.studentDirectory.all[0].name!==b.name)throw code('INVALID_SNAPSHOT');
     const receipts=value.actions.submissions;
     if(!receipts||receipts.schema!==1||!Array.isArray(receipts.receipts)||!Array.isArray(receipts.coverage))throw code('SNAPSHOT_NOT_READY');
     if(receipts.parentName!==b.name||receipts.parentRosterRevision!==b.rosterRevision)throw code('INVALID_SNAPSHOT');
     cached={value,loadedAt:now()};options.onLoaded?.(value);return value;
    }catch(e){if(active.signal.aborted)throw code('SOURCE_UNAVAILABLE');throw e;}finally{clearTimeout(timer);}
   })();
   pending=work;
   try{return await work;}finally{if(pending===work)pending=null;}
  }
  async function request(action,force=false){
   if(!supported.includes(action))throw code('INVALID_REQUEST');
   const value=await load(force),key=({refreshDashboard:'dashboard',refreshProfile:'profile'})[action]||action;
   const data=value.actions[key];if(!data)throw code('SNAPSHOT_NOT_READY');
   // Each original renderer may mutate its input. Never mutate the shared package.
   return structuredClone(data);
  }
  return {selected,request,clear};
 }};
})(typeof window!=='undefined'?window:globalThis);
