/* Owner-approved ("sửa lõi nhận bài", 3 Nov 2026): every refresh repainted the whole page four times, freezing it for seconds even when the pupil's data had not changed.
   A download identical to what is on screen now leaves the receipt state and the screen as they are. A change, an error, an unfinished receipt read or 5 minutes without a full refresh takes the page's own refresh unchanged. Never changes marks, status, receipts or counts. */
(function(root){'use strict';
 const PACKET=/\/data\/[a-f0-9]{64}\.json$/,MERGE_MS=15e3,SERVE_MS=2e4,FULL_MS=3e5,TIMEOUT_MS=8e3;
 const PACKET_ACTIONS=/^(bootstrap|check|dashboard|profile|refreshDashboard|refreshProfile|submissions|classwork_\w+)$/;
 const nativeFetch=root.fetch,probes=new WeakSet,dataset=root.document.documentElement.dataset;
 let latest=null,painted=null,fullAt=0,armed=false,stale=false;
 const processing=()=>latest.text.includes('"receiptProcessing":true');
 const age=()=>performance.now()-latest.at;

 // The page reads one packet for several purposes; a copy this recent is the same answer without another 500 KB download. A receipt being processed always goes to the network.
 root.fetch=function(input,init){
  const url=typeof input==='string'?input:String(input?.url||input||'');
  if(!PACKET.test(url.split(/[?#]/)[0])||init?.method&&init.method!=='GET')return nativeFetch.apply(root,arguments);
  if(latest&&latest.url===url&&!probes.has(init)&&age()<SERVE_MS&&!processing())return Promise.resolve(new Response(latest.text,{status:200,headers:{'content-type':'application/json'}}));
  return nativeFetch.apply(root,arguments).then(async response=>{
   if(response.status===200){
    try{
     latest={url,text:await response.clone().text(),at:performance.now()};
     if(painted===null){painted=latest.text;fullAt=latest.at;}
    }catch{}
   }
   return response;
  });
 };

 async function unchanged(){
  if(!latest)return false;
  if(age()>=MERGE_MS||processing()){
   const init={credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',signal:AbortSignal.timeout(TIMEOUT_MS)};
   probes.add(init);
   // Through the outermost fetch, so a removed link still locks the page here.
   if((await root.fetch(latest.url,init)).status!==200)return false;
  }
  return latest.text===painted;
 }
 // A view drawn from this packet may stand, with a receipt retry left to finish on its own. Anything not yet drawn, dropped or shown from the saved copy takes the page's own refresh.
 function settled(owner){
  return Boolean(parentState.authorized&&!parentState.locked&&!parentState.checking&&!root.document.hidden&&
   parentState.dashboard&&parentState.renderedDashboard===parentState.dashboard&&
   parentState.profile&&parentState.renderedProfile===parentState.profile&&
   !owner.inFlight&&owner.readState!=='idle'&&dataset.confirmedProfileFallback!=='true'&&
   (owner.retryQueued||!parentAcademicSessionV1_||parentAcademicSessionV1_.done));
 }
 function install(){
  if(typeof parentReceiptOwner_!=='object'||typeof parentState!=='object'||typeof root.parentQuietResume_!=='function')return;
  const owner=parentReceiptOwner_,invalidate=owner.invalidate,resume=root.parentQuietResume_,request=ieltsParentAccess.request,heard=new Map;
  // Writing reviews arrive outside the packet and repaint only the open tab, so a new answer still needs one repaint of the others.
  ieltsParentAccess.request=function(action){
   const result=request.apply(this,arguments);
   if(!PACKET_ACTIONS.test(action))Promise.resolve(result).then(JSON.stringify,()=>'failed').then(text=>{
    if(heard.get(action)!==text){heard.set(action,text);stale=true;}
   });
   return result;
  };
  // IELTS 45 adds its hidden Writing section again on every paint and the page grows for as long as it stays open; only the newest copy is kept.
  const overview=root.renderOverview;
  if(typeof overview==='function')root.renderOverview=function(){
   const result=overview.apply(this,arguments),copies=root.document.querySelectorAll('#panel-overview>.wr-personal');
   for(let i=0;i<copies.length-1;i++)copies[i].remove();
   return result;
  };
  // The page's timer drops the receipt state just before it asks to refresh, so the drop waits to see whether this refresh will need it. Other callers lose nothing: it runs before their next step.
  owner.invalidate=function(){
   armed=true;
   queueMicrotask(()=>{if(armed){armed=false;invalidate();}});
  };
  root.parentQuietResume_=async function(refresh){
   const held=armed;armed=false;
   if(refresh===true&&held&&!parentState.checking){
    // Downloading first also means the page's own refresh, if it follows, gets this copy at once and never falls back to the saved one on a slow connection.
    const id=parentState.requestId,due=performance.now()-fullAt>=FULL_MS;
    let same=false;
    parentState.checking=true;
    try{same=await unchanged();}catch{}finally{parentState.checking=false;}
    if(same&&!due&&id===parentState.requestId&&settled(owner)){
     if(stale){stale=false;parentState.renderedProfile=null;parentRender_();}
     return;
    }
   }
   if(held)invalidate();
   delete dataset.confirmedProfileFallback;
   stale=false;
   const text=latest?.text,result=await resume.apply(this,arguments);
   if(refresh===true&&text!==undefined){painted=text;fullAt=performance.now();}
   return result;
  };
 }
 root.document.addEventListener('DOMContentLoaded',install,{once:true});
})(window);
