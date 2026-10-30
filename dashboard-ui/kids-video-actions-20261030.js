/* Presentation only: display the exact current lesson's native file renderer. */
(function(root){
 'use strict';
 function install(){
 const api=root.TrialKidsJourneyModel;
 if(!api||api.__videoActionsUI)return;
 api.__videoActionsUI=true;
 let model=null,route=root.location.hash;
 const original=api.build;
 api.build=function(){const result=original.apply(this,arguments);model=result;route=root.location.hash;return result;};
 // The modal's native learning action is its binding. Never retain the last
 // clicked archive ID: weekly cards and notifications use other openers.
 function lessonKey(value){
  if(!value)return '';
  try{
   let url=new URL(value,root.location.href);
   if(url.origin===root.location.origin&&/^\/student-learning\/(?:kids-ta-entry\/)?$/.test(url.pathname)){
    const lesson=url.searchParams.get('lesson');if(!lesson)return '';
    url=new URL(lesson,root.location.href);
   }
   if(!/^https?:$/.test(url.protocol))return '';
   url.hash='';return url.href;
  }catch(_){return '';}
 }
 function draw(){
  const dialog=root.document.querySelector('#kids-journey-root #j-detail[open]');
  const actions=dialog?.querySelector('.ka-video-body .ka-submit-actions');
  if(!actions)return;
  const existing=actions.querySelector('[data-native-video-files]');
  const key=lessonKey(actions.querySelector('a.j-primary[href]')?.getAttribute('href'));
  const matches=model&&route===root.location.hash&&key?(model.videos||[]).filter(v=>lessonKey(v.learningUrl)===key):[];
  const v=matches.length===1?matches[0]:null;
  const html=v&&!(v.components?.length>1)?v.nativeFilesHTML:'';
  if(!html){existing?.remove();return;}
  if(existing?.getAttribute('data-native-video-files')===v.id&&existing.__nativeHTML===html)return;
  existing?.remove();
  const block=root.document.createElement('div');
  block.setAttribute('data-native-video-files',v.id);
  block.setAttribute('aria-label','Bài nộp của con');
  block.__nativeHTML=html;block.innerHTML=html;actions.appendChild(block);
 }
 root.addEventListener('hashchange',()=>{model=null;draw();});
 new MutationObserver(draw).observe(root.document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['open','href']});
 }
 root.addEventListener('titi-dashboard-ready',install,true);
 install();
})(window);
