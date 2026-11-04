/* Presentation only. A browser opening a link for the first time treats every comment as old, so a comment just written never reaches the bell; and the bell's small count is easy to miss, so a red label sits beside it until it is opened. Feeds the page's own bell; never changes marks, status, receipts or counts. */
(function(root){'use strict';
 const RECENT_MS=7*864e5,KEEP=10,PREFIX='kids_journey_updates_v1_',KEPT_PREFIX='kids_notice_kept_v1_',SEEN_PREFIX='kids_notice_label_seen_v1_',D=root.document;
 const hash=v=>{let n=2166136261;for(const c of String(v)){n^=c.charCodeAt(0);n=Math.imul(n,16777619)}return(n>>>0).toString(36)};
 const dayOf=v=>root.TrialKidsJourneyParser?.date?.(v)?.at||0;
 let videoAt=new Map,activeKey='';const keptMemory=new Map;
 function stored(input){
  for(const name of ['localStorage','sessionStorage']){
   try{for(const key of [input.studentKey,input.legacyStudentKey])if(key&&root[name].getItem(PREFIX+hash(key)))return true;}catch{return true;}
  }
  return false;
 }
 // The source records no time for a comment, so it counts as new when its lesson or video submission is recent.
 function recordAt(record){
  if(videoAt.has(record.id))return videoAt.get(record.id);
  const date=String(record.label||'').match(/\d{1,2}\/\d{1,2}\/\d{4}/);
  return date?dayOf(date[0]):0;
 }
 // The bell's own list stops at 3, inside the frozen bundle. The bell still decides what is a notice; this only keeps more of what it announces, beside its ledger.
 function ledgerOf(input){
  for(const key of [input.studentKey,input.legacyStudentKey])if(key)for(const name of ['localStorage','sessionStorage']){
   try{const value=root[name].getItem(PREFIX+hash(key));if(value)return JSON.parse(value);}catch{}
  }
  return null;
 }
 function keptOf(key){
  try{const value=JSON.parse(root.localStorage.getItem(KEPT_PREFIX+key));if(Array.isArray(value))return value;}catch{}
  return keptMemory.get(key)||[];
 }
 function newest(...feeds){
  const keys=new Set();
  return feeds.flat().map((e,index)=>({e,index})).sort((a,b)=>(b.e.createdAt||0)-(a.e.createdAt||0)||a.index-b.index).filter(({e})=>!keys.has(e.key)&&keys.add(e.key)).slice(0,KEEP).map(({e})=>e);
 }
 function announced(api,input,prior){
  const day=new Date((input.now??Date.now())+252e5).getUTCDay(),options={weekend:day===6||day===0},known=new Set((prior?.events||[]).map(e=>e.key));
  if(api.advance(prior,input.records,options).events.every(e=>known.has(e.key)))return [];
  // One refresh can bring more than 3 notices and the bell drops the rest in that same call, so each row is asked about alone.
  return input.records.flatMap(r=>api.advance(prior&&{...prior,events:[]},[r],options).events).reverse();
 }
 function keeping(api,render){
  return function(input){
   if(!input?.studentKey||!Array.isArray(input.records))return render.apply(this,arguments);
   const key=hash(input.studentKey),prior=ledgerOf(input),open=input.openNotifications;
   // The open list can redraw during the bell's render, so the new notices are in place before it runs.
   let list=newest(keptOf(key),prior?.events||[],announced(api,input,prior));
   const result=render.call(this,{...input,openNotifications:open&&(()=>open(list.slice()))});
   list=newest(list,ledgerOf(input)?.events||[]);
   keptMemory.set(key,list);
   try{root.localStorage.setItem(KEPT_PREFIX+key,JSON.stringify(list));}catch{}
   const bell=D.querySelector('#bean-updates .ku-bell');
   if(bell&&list.length){bell.setAttribute('aria-label','Thông báo — '+list.length+' mới');const count=bell.querySelector('.ku-bell-count');if(count)count.textContent=list.length;}
   return result;
  };
 }
 function results(){return keptOf(activeKey).filter(e=>e.kind==='result').map(e=>e.key);}
 function seen(){try{const value=JSON.parse(root.localStorage.getItem(SEEN_PREFIX+activeKey));return Array.isArray(value)?value:[];}catch{return [];}}
 function paint(){
  const slot=D.querySelector('#kids-journey-root .j-notification-slot');if(!slot)return;
  const old=new Set(seen()),n=results().filter(key=>!old.has(key)).length;let label=slot.querySelector('.kids-notice-label');
  if(!n){label?.remove();return;}
  if(!label){
   label=D.createElement('button');label.type='button';label.className='kids-notice-label';
   label.addEventListener('click',()=>slot.querySelector('.ku-bell')?.click());
   slot.append(label);
  }
  const text='Có '+n+' điểm / nhận xét mới';
  if(label.dataset.text!==text){label.dataset.text=text;label.textContent=text+' ›';}
 }
 // Opening the bell's list clears the label; the bell itself keeps its notices.
 D.addEventListener('click',e=>{
  if(!e.target.closest?.('.ku-bell')||!activeKey)return;
  try{root.localStorage.setItem(SEEN_PREFIX+activeKey,JSON.stringify([...new Set([...seen(),...results()])].slice(-50)));}catch{}
  root.setTimeout(paint);
 },true);
 function install(){
  const model=root.TrialKidsJourneyModel;
  if(model&&!model.__firstNotices){model.__firstNotices=true;const build=model.build;model.build=function(){
   const result=build.apply(this,arguments);
   videoAt=new Map((result?.videos||[]).flatMap(v=>[
    ['video:'+v.id,dayOf(v.submittedAt)||Number(v.assignedAt)||0],
    ...(v.components||[]).map(t=>['practice-component:'+v.id+':'+t.id,dayOf(t.submittedAt)||Number(v.assignedAt)||0])
   ]));
   return result;
  };}
  const api=root.TrialBeanHomeworkUpdates;
  if(!api||api.__firstNotices)return;
  api.__firstNotices=true;
  const render=keeping(api,api.render);
  api.render=function(input){
   if(Array.isArray(input?.records)&&!stored(input)){
    const now=Number(input.now)||Date.now();
    // The bell only announces a change to a row it already holds, so the row goes in first without the comment.
    render.call(this,{...input,records:input.records.map(r=>{
     const at=r.signals?.comment?recordAt(r):0;
     return at>0&&at<=now&&now-at<=RECENT_MS?{...r,signals:{...r.signals,comment:null}}:r;
    })});
   }
   const result=render.apply(this,arguments);
   if(input?.studentKey){activeKey=hash(input.studentKey);paint();}
   return result;
  };
 }
 root.addEventListener('titi-dashboard-ready',install,true);install();
 const style=D.createElement('style');style.textContent=`
 #kids-journey-root .kids-notice-label{position:absolute;left:66px;bottom:9px;max-width:calc(100vw - 96px);width:max-content;padding:9px 14px;border:2px solid #fff;border-radius:99px;background:#ae3841;color:#fff;font:inherit;font-size:13px;font-weight:700;line-height:1.3;text-align:left;cursor:pointer;box-shadow:0 6px 16px #ae384155;animation:kids-notice-pulse 2.4s ease-in-out 4}
 #kids-journey-root .kids-notice-label:hover{background:#94303a}
 body:has(#pendingWorkGate:not([hidden])) #kids-journey-root .kids-notice-label{display:none}
 @keyframes kids-notice-pulse{0%,100%{box-shadow:0 6px 16px #ae384155}50%{box-shadow:0 0 0 7px #ae384133,0 6px 16px #ae384155}}
 @media(max-width:768px){#kids-journey-root .kids-notice-label{left:58px;bottom:7px;padding:8px 12px;font-size:12px}}
 @media(prefers-reduced-motion:reduce){#kids-journey-root .kids-notice-label{animation:none}}
 `;D.head.append(style);
})(window);
