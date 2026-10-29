/* Presentation only: display the native file/history renderer unchanged. */
(function(root){
 'use strict';
 function install(){
 const api=root.TrialKidsJourneyModel;
 if(!api||api.__videoActionsUI)return;
 api.__videoActionsUI=true;
 let model=null,opened='',route=root.location.hash;
 const original=api.build;
 api.build=function(){const result=original.apply(this,arguments);model=result;route=root.location.hash;return result;};
 function selected(){
  if(!model||route!==root.location.hash)return null;
  const matches=(model.videos||[]).filter(v=>opened===v.id||opened.endsWith('::'+v.id));
  return matches.length===1?matches[0]:null;
 }
 function draw(){
  const dialog=root.document.querySelector('#kids-journey-root #j-detail[open]');
  const v=selected();
  if(!dialog||!v||v.components?.length>1)return;
  const actions=dialog.querySelector('.ka-video-body .ka-submit-actions');
  if(!actions||actions.querySelector('[data-native-video-files]')||!v.nativeFilesHTML)return;
  const block=root.document.createElement('div');
  block.setAttribute('data-native-video-files','');
  block.setAttribute('aria-label','Bài nộp của con');
  block.innerHTML=v.nativeFilesHTML;
  actions.appendChild(block);
 }
 root.document.addEventListener('click',e=>{
  const b=e.target.closest?.('[data-open],[data-archive-detail]');
  if(b?.closest('#kids-journey-root')){opened=b.dataset.open||b.dataset.archiveDetail;queueMicrotask(draw);}
 },true);
 root.addEventListener('hashchange',()=>{model=null;opened='';});
 // The native view replaces an open modal after a fresh packet. Restore only
 // its native file markup, without fetching, classifying or changing state.
 new MutationObserver(draw).observe(root.document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
 }
 root.addEventListener('titi-dashboard-ready',install,true);
 install();
})(window);
