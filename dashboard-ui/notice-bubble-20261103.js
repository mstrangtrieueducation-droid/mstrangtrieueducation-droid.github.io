/* Presentation only. A red label beside the IELTS and Fighter notice bell while a new review or comment is unread, so a parent or pupil does not have to notice the small count. Reads the bell's own saved list; opening the bell clears it. Never changes marks, status, receipts or counts. */
(function(root){'use strict';
 const bell=root.NativeUpdatesBell;
 if(!bell||bell.noticeBubble)return;
 const PREFIX='mtt_native_updates_v1_',FRESH_MS=14*864e5,render=bell.render,D=root.document;
 const hash=v=>{let n=2166136261;for(const c of String(v)){n^=c.charCodeAt(0);n=Math.imul(n,16777619)}return(n>>>0).toString(36)};
 let activeKey='';
 // Older unread entries were never pointed out, so they stay in the bell without raising the label.
 function count(){
  try{
   const ledger=JSON.parse(root.localStorage.getItem(activeKey)),now=Date.now();
   return (ledger?.events||[]).filter(e=>e.unread&&e.type==='result'&&now-Number(e.at)<=FRESH_MS).length;
  }catch{return 0;}
 }
 function paint(){
  const host=D.getElementById('mtt-native-bell');if(!host)return;
  const n=count();let bubble=host.querySelector('.mtt-notice-bubble');
  if(!n){bubble?.remove();return;}
  if(!bubble){
   bubble=D.createElement('button');bubble.type='button';bubble.className='mtt-notice-bubble';
   // The bell's own handler opens its list for this attribute and marks the entries read.
   bubble.setAttribute('data-nub-open','');
   host.append(bubble);
  }
  const text='Có '+n+' bài chữa / nhận xét mới';
  if(bubble.dataset.text!==text){bubble.dataset.text=text;bubble.textContent=text+' ›';}
 }
 bell.render=function(input){
  const result=render.apply(this,arguments);
  if(input?.profileKey){activeKey=PREFIX+hash(input.profileKey);paint();}
  return result;
 };
 D.addEventListener('click',e=>{if(e.target.closest?.('#mtt-native-bell'))root.setTimeout(paint);},true);
 const style=D.createElement('style');style.textContent=`
 #mtt-native-bell .mtt-notice-bubble{position:absolute;left:72px;bottom:12px;max-width:calc(100vw - 108px);width:max-content;padding:9px 14px;border:2px solid #fff;border-radius:99px;background:#ae3841;color:#fff;font:700 13px/1.3 inherit;font-family:inherit;text-align:left;cursor:pointer;box-shadow:0 6px 16px #ae384155;animation:mtt-notice-pulse 2.4s ease-in-out 4}
 #mtt-native-bell .mtt-notice-bubble:hover{background:#94303a}
 #mtt-native-bell .nub-panel:not([hidden])~.mtt-notice-bubble{display:none}
 @keyframes mtt-notice-pulse{0%,100%{box-shadow:0 6px 16px #ae384155}50%{box-shadow:0 0 0 7px #ae384133,0 6px 16px #ae384155}}
 @media(max-width:600px){#mtt-native-bell .mtt-notice-bubble{left:64px;bottom:9px;padding:8px 12px;font-size:12px}}
 @media(prefers-reduced-motion:reduce){#mtt-native-bell .mtt-notice-bubble{animation:none}}
 `;D.head.append(style);
 bell.noticeBubble=true;
})(globalThis);
