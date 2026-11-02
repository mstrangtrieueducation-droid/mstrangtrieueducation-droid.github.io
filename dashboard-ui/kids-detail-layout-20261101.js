/* Presentation only. One shared look for KIDS detail dialogs and a readable paper-homework layout; never changes status, receipts or counts. */
(function(root){'use strict';
 const D=root.document,E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 // "trang 10, 11", "từ trang 63 đến hết trang 64", "đủ các trang 114 và từ trang 116 đến hết trang 119".
 const PAGES=/(?:(?:đủ\s+)?các\s+)?(?:từ\s+)?trang\s*\d+(?:\s*(?:,|và|[-–]|đến(?:\s+hết)?)\s*(?:từ\s+)?(?:hết\s+)?(?:trang\s*)?\d+)*/gi;
 const NOT_BOOK=/^(?:lưu ý|chú ý|ghi chú|audio|link|video|hoàn thiện)/i;
 let queued=false;

 function pageChip(text){
  const found=[];
  for(const phrase of text.match(PAGES)||[]){
   let range=false;
   for(const [,dash,num] of phrase.matchAll(/(đến|[-–])|(\d+)/gi)){
    if(dash){range=true;continue;}
    const n=+num,last=found[found.length-1];
    if(range&&last<n&&n-last<60)for(let k=last+1;k<=n;k++)found.push(k);else found.push(n);
    range=false;
   }
  }
  const pages=[...new Set(found)].sort((a,b)=>a-b),runs=[];
  for(const n of pages){const r=runs[runs.length-1];if(r&&n===r[1]+1)r[1]=n;else runs.push([n,n]);}
  return runs.map(([a,b])=>a===b?a:a+'–'+b).join(', ');
 }
 function inline(text){
  const t=/[.!?:…)]$|https?:\/\/\S+$/.test(text)?text:text+'.';
  return E(t).replace(/https?:\/\/[^\s<]+/g,u=>'<a href="'+u+'" target="_blank" rel="noopener noreferrer">'+u+'</a>').replace(PAGES,m=>'<b>'+m+'</b>');
 }
 // Lines arrive split on ";" by the native renderer: a lowercase start, or a short item after an
 // unfinished long sentence ("gồm ba nhánh: People we like; Toys…"), continues the previous line.
 function join(lines){
  const out=[];
  for(const raw of lines){
   const l=raw.label&&!bookLabel(raw.label)?{label:'',text:raw.label+': '+raw.text}:{...raw},prev=out[out.length-1];
   const whole=l.label?l.label+': '+l.text:l.text,prevWhole=prev&&(prev.label?prev.label+': '+prev.text:prev.text);
   const cont=prev&&(/^\p{Ll}/u.test(whole)||!/[.!?]$/.test(prev.text)&&prevWhole.length>60&&whole.length<=40);
   if(cont)prev.text=prev.text.replace(/[\s;]+$/,'')+'; '+whole;else out.push(l);
  }
  return out;
 }
 // Only a short heading ("Workbook", "Vở viết chính tả") names a book; a sentence with a colon does not.
 function bookLabel(label){return label.length<=30&&!NOT_BOOK.test(label)&&!/\d|^(?:con|em|buổi)\s/i.test(label);}
 function render(lines,knownLabels){
  const groups=[];
  for(const l of join(lines)){
   let name='',text=l.text;
   const m=!l.label&&!knownLabels&&text.match(/^((?:Sách|Vở)\s[^:]{1,32}):\s*(\S.*)$/i);
   if(l.label)name=l.label;
   if(m){name=m[1].replace(/^Sách\s+/i,'');text=m[2];}
   const g=groups[groups.length-1];
   if(name||!g)groups.push({name,main:text,notes:[]});else g.notes.push(text);
  }
  for(const g of groups)if(!g.name&&g.notes.length&&g.main.length<=90&&!/[.!]$/.test(g.main)){g.name=g.main;g.main=g.notes.shift();}
  return '<div class="kdl-list">'+groups.map(g=>{
   const chip=pageChip(g.main);
   return '<section class="kdl-book">'+(g.name||chip?'<div class="kdl-head">'+(g.name?'<strong>'+E(g.name)+'</strong>':'')+(chip?'<span class="kdl-pages">Trang '+E(chip)+'</span>':'')+'</div>':'')+'<p class="kdl-main">'+inline(g.main)+'</p>'+(g.notes.length?'<ul class="kdl-notes">'+g.notes.map(n=>'<li'+(/^(?:lưu ý|chú ý)/i.test(n)?' class="kdl-warn"':'')+'>'+inline(n)+'</li>').join('')+'</ul>':'')+'</section>';
  }).join('')+'</div>';
 }
 function paint(){
  queued=false;
  for(const ul of D.querySelectorAll('#j-detail .bc-paper-books:not([data-kdl])')){
   ul.dataset.kdl='';
   const lines=[...ul.children].map(li=>({label:li.querySelector('strong')?.textContent.trim()||'',text:(li.getAttribute('title')||li.textContent).trim()})).filter(l=>l.text);
   if(!lines.length)continue;
   ul.insertAdjacentHTML('afterend',render(lines,true));ul.hidden=true;
  }
  for(const block of D.querySelectorAll('#j-detail .ka-paper:not([data-kdl])')){
   block.dataset.kdl='';
   const ps=[...block.children].filter(n=>n.tagName==='P'),lines=ps.map(p=>({label:'',text:p.textContent.trim()})).filter(l=>l.text);
   if(!lines.length)continue;
   ps[0].insertAdjacentHTML('beforebegin',render(lines,false));ps.forEach(p=>p.hidden=true);
  }
  decorate();
  foldReceived();
 }
 // "Bài đã nhận" exists for work just submitted to a lesson Schedule has not listed yet. Older entries
 // are duplicates under a generic code or work from before the owner's history cut-off (the lesson
 // history already shows the real receipts), so only recent entries are shown.
 const RECENT_DAYS=14;
 function foldReceived(){
  for(const sec of D.querySelectorAll('#kids-journey-root .ka-received-work:not([data-kdl-received])')){
   sec.dataset.kdlReceived='';
   const now=Date.now(),articles=[...sec.querySelectorAll(':scope>article')];
   const old=articles.filter(art=>{
    const m=art.querySelector('.j-task-status')?.textContent.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    return m&&now-Date.UTC(+m[3],+m[2]-1,+m[1])>RECENT_DAYS*864e5;
   });
   old.forEach(art=>{art.hidden=true;});
   if(old.length===articles.length)sec.hidden=true;
  }
 }
 // Each native section gets a kind for its icon tile; emoji that only some native headings carry are dropped.
 const KINDS=[['web',/\bka-web-(?:details|empty)\b/],['paper',/\bka-paper\b/],['lesson',/\bbc-resource-details\b/],['feedback',/\bka-(?:session|assignment)-feedback\b/],['video',/\bka-video-score\b/]];
 function decorate(){
  for(const s of D.querySelectorAll('#j-detail .ka-detail-block:not([data-kdl-kind])')){
   const h=s.querySelector(':scope>h3,:scope>.ka-block-heading>h3'),title=h?.textContent||'';
   s.dataset.kdlKind=(KINDS.find(([,re])=>re.test(s.className))||[])[0]||(/kiểm tra/i.test(title)?'test':/phỏng vấn/i.test(title)?'interview':'note');
   const t=h?.firstChild;
   if(t?.nodeType===3){const clean=t.nodeValue.replace(/^[\p{Extended_Pictographic}️‍\s]+/u,'');if(clean!==t.nodeValue)t.nodeValue=clean;}
  }
  // The "Nhận bài" fact repeats the status chip beside the task title.
  for(const task of D.querySelectorAll('#j-detail .bc-native-task:not([data-kdl-task])')){
   task.dataset.kdlTask='';
   const state=task.querySelector('.bc-receipt-state')?.textContent.trim(),facts=task.querySelector('.bc-receipt-facts');
   if(!facts||!state)continue;
   for(const row of facts.children)if(row.querySelector('dt')?.textContent.trim()==='Nhận bài'&&row.querySelector('dd')?.textContent.trim()===state)row.hidden=true;
   if(![...facts.children].some(row=>!row.hidden))facts.hidden=true;
  }
 }
 const PENDING='#j-detail .bc-paper-books:not([data-kdl]),#j-detail .ka-paper:not([data-kdl]),#j-detail .ka-detail-block:not([data-kdl-kind]),#j-detail .bc-native-task:not([data-kdl-task]),#kids-journey-root .ka-received-work:not([data-kdl-received])';
 function schedule(){if(!queued){queued=true;root.requestAnimationFrame(paint);}}
 new MutationObserver(()=>{if(D.querySelector(PENDING))schedule();}).observe(D.documentElement,{childList:true,subtree:true});
 schedule();
 // The repeated id outranks the native per-variant rules, so every detail dialog shares one shell.
 const P='#kids-journey-root #j-detail#j-detail.ka-detail-modal';
 const icon=(kind,glyph,tint)=>`${P} .ka-detail-block[data-kdl-kind="${kind}"]::before{content:"${glyph}";background:${tint}}`;
 const style=D.createElement('style');style.textContent=`
 ${P}{width:min(720px,calc(100vw - 24px));max-width:calc(100vw - 24px);border:1px solid #dfe7ef;border-radius:22px;box-shadow:0 24px 70px #0f2a4a38}
 ${P} [hidden]{display:none!important}
 /* One header for every dialog. */
 ${P} .ka-modal-header{padding:22px 66px 18px 26px;background:#f6f8fc;border-bottom:1px solid #e6ecf2}
 ${P} .ka-modal-header .j-overline{margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6b7f93}
 ${P} .ka-modal-header h2{margin:0;font-size:21px;line-height:1.35;font-weight:700;letter-spacing:-.2px;color:#163b52}
 ${P} .bc-focused-context{margin:4px 0 0;font-size:13px;color:#6b7f93}
 ${P}>.j-modal-close{margin:16px 16px -52px 0;width:36px;height:36px;padding:0;border:0;border-radius:50%;background:#e9eef5;color:#33506a;font-size:20px;line-height:36px;box-shadow:none}
 ${P}>.j-modal-close:hover{background:#dde5ee}
 ${P} .j-modal-close:focus{outline:none}
 ${P} .j-modal-close:focus-visible{outline:3px solid #2563eb;outline-offset:2px}
 /* Body: sections are aligned rows (icon tile, small label, content) on one white sheet. */
 ${P} .ka-modal-body{padding:16px 26px 20px;background:#fff}
 ${P} .ka-detail-block{display:grid;grid-template-columns:38px minmax(0,1fr);column-gap:14px;row-gap:0;align-items:start;margin:0;padding:16px 0;background:none;border:0;border-left:0;border-radius:0;box-shadow:none}
 ${P} :is(.ka-course-details,.ka-video-body,.ka-modal-body)>.ka-detail-block:first-child{padding-top:2px}
 ${P} .ka-detail-block:last-child{padding-bottom:2px}
 ${P} .ka-detail-block+.ka-detail-block{border-top:1px solid #edf1f5}
 ${P} .ka-detail-block>*{grid-column:2;min-width:0}
 ${P} .ka-detail-block::before{content:"📌";grid-column:1;grid-row:1/span 30;display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:#eef3f8;font-size:18px;line-height:1}
 ${icon('web','💻','#e8f0ff')}
 ${icon('paper','📚','#fff3d6')}
 ${icon('lesson','📖','#e5f5ee')}
 ${icon('feedback','💬','#f1ecfb')}
 ${icon('video','🎬','#fdeaf0')}
 ${icon('test','📝','#fff3d6')}
 ${icon('interview','🎙️','#efe9ff')}
 ${P} .ka-detail-block>h3,${P} .ka-detail-block>.ka-block-heading{min-height:38px;margin:0}
 ${P} .ka-detail-block>h3{display:flex;align-items:center}
 ${P} .ka-detail-block>.ka-block-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
 ${P} .ka-detail-block>h3,${P} .ka-detail-block>.ka-block-heading h3{margin:0;font-size:12px;line-height:1.4;font-weight:750;letter-spacing:.06em;text-transform:uppercase;color:#5d7286}
 ${P} .ka-detail-block>p,${P} .ka-detail-block .kdl-main{margin:2px 0 0;font-size:14px;line-height:1.65;color:#2c4258}
 ${P} .ka-web-empty>p,${P} .bc-feedback-empty{margin:2px 0 0;font-size:13px;line-height:1.6;color:#8494a5}
 ${P} .ka-course-details>p.bc-feedback-empty{position:relative;display:flex;align-items:center;min-height:38px;margin:0;padding:16px 0 2px 52px;border-top:1px solid #edf1f5}
 ${P} .ka-course-details>p.bc-feedback-empty::before{content:"💬";position:absolute;left:0;top:16px;display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:#f1ecfb;font-size:18px}
 ${P} .ka-session-feedback blockquote{margin:2px 0 0;padding:2px 0 2px 12px;border-left:3px solid #d9cdf3;border-radius:0;background:none;color:#34485c;font-size:14px;line-height:1.75}
 ${P} .ka-session-feedback p{font-size:14px;line-height:1.75;color:#34485c}
 ${P} .bc-resource-row{padding:6px 0;border-top:0;gap:12px}
 ${P} .bc-resource-row+.bc-resource-row{border-top:1px dashed #e3e9ef;padding-top:10px}
 ${P} .bc-resource-row>strong{font-size:14px;line-height:1.55;font-weight:600;color:#1f3f58}
 ${P} .ka-paper .kdl-list{margin-top:4px}
 ${P} .ka-paper small{display:block;margin-top:10px;font-size:12.5px;color:#8a6a2c}
 ${P} .ka-paper small::before{content:"⏰ "}
 /* Web and video tasks: one light row each, no card inside a card. */
 ${P} .bc-native-task{margin:8px 0 0;padding:12px 14px;background:#f7f9fc;border:1px solid #e7edf3;border-radius:12px;box-shadow:none}
 ${P} .bc-native-task h3{margin:0;font-size:15px;line-height:1.45;font-weight:700;letter-spacing:0;text-transform:none;color:#183d57}
 ${P} .bc-receipt-state{padding:4px 10px;border-radius:999px;font-size:11.5px}
 ${P} .bc-receipt-facts{margin:8px 0 0;gap:8px}
 ${P} .bc-native-task .bc-feedback-empty{margin:6px 0 0}
 ${P} .j-task-actions,${P} .ka-submit-actions{margin:10px 0 0}
 ${P} a.j-primary{display:inline-flex;align-items:center;justify-content:center;width:auto;min-height:38px;padding:8px 14px;border:1px solid #173c59;border-radius:10px;background:#173c59;color:#fff;font-size:13px;font-weight:700;line-height:1.4;text-decoration:none;box-shadow:none}
 ${P} a.j-primary:hover{background:#245675;border-color:#245675}
 /* A multi-part video lists its parts as task rows under the deadline, without a tile per part. */
 ${P} .ka-video-body>.ka-video-score:has(>.j-task-detail){display:block;padding:0;border:0}
 ${P} .ka-video-body>.ka-video-score:has(>.j-task-detail)::before{content:none}
 ${P} .ka-video-body>.ka-video-score:has(>.j-task-detail)+.ka-video-score{margin-top:10px}
 ${P} .ka-video-body>.ka-video-score>.j-task-detail{margin:0}
 ${P} .ka-video-body>.bc-focused-deadline{margin:0 0 12px}
 ${P} .ka-modal-body.bc-focused-task{padding:20px 26px}
 ${P} .bc-focused-task>.bc-native-task{margin:0;padding:0;background:none;border:0}
 ${P} .bc-focused-receipt-label{display:none}
 ${P} .bc-focused-deadline{margin:0 0 16px;padding:10px 14px;border-radius:12px;font-size:13px}
 /* Plain bodies (next lesson): a title, facts, then the note in a soft box. */
 ${P} .ka-modal-body>h3{margin:12px 0 4px;font-size:18px;line-height:1.4;color:#163b52}
 ${P} .ka-modal-body>p{margin:6px 0;font-size:14px;line-height:1.65;color:#3a4d61}
 ${P} .ka-modal-body>p:last-child:not(:first-child){margin-top:14px;padding:10px 14px;border-radius:12px;background:#f6f8fc;color:#5b6d80;font-size:13px}
 /* One footer button everywhere. */
 ${P} .ka-modal-footer{padding:14px 26px 18px;border-top:1px solid #e6ecf2;background:#fff;text-align:right}
 ${P} .ka-modal-footer .j-modal-close{width:auto;height:auto;min-height:40px;padding:9px 18px;border:0;border-radius:11px;background:#173c54;color:#fff;font-size:13.5px;font-weight:700}
 ${P} .ka-modal-footer .j-modal-close:hover{background:#245675}
 /* Paper homework: a heading per book, the full instruction, then notes as a plain list. */
 #kids-journey-root #j-detail .kdl-list{display:grid}
 #kids-journey-root #j-detail .kdl-book{padding:14px 0}
 #kids-journey-root #j-detail .kdl-book:first-child{padding-top:0}
 #kids-journey-root #j-detail .kdl-book:last-child{padding-bottom:0}
 #kids-journey-root #j-detail .kdl-book+.kdl-book{border-top:1px solid #edf1f5}
 #kids-journey-root #j-detail .kdl-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:4px}
 #kids-journey-root #j-detail .kdl-head strong{font-size:15.5px;font-weight:700;line-height:1.4;color:#183355}
 #kids-journey-root #j-detail .kdl-pages{padding:3px 11px;border-radius:999px;background:#fff1c2;color:#795b12;font-size:12.5px;font-weight:700;white-space:nowrap}
 #kids-journey-root #j-detail .kdl-main{margin:0;font-size:14px;line-height:1.65;color:#2c4258}
 #kids-journey-root #j-detail .kdl-list b{font-weight:700;color:#183355}
 #kids-journey-root #j-detail .kdl-notes{display:grid;gap:4px;margin:6px 0 0;padding:0 0 0 20px;font-size:13.5px;line-height:1.65;color:#5b6d80}
 #kids-journey-root #j-detail .kdl-notes li{margin:0;padding:0;border:0;background:none}
 #kids-journey-root #j-detail .kdl-notes li::marker{color:#b8c3cf}
 #kids-journey-root #j-detail .kdl-notes .kdl-warn{color:#8a5a12}
 #kids-journey-root #j-detail .kdl-list a{color:#1d5fa8;text-decoration:underline;overflow-wrap:anywhere}
 #kids-journey-root .ka-received-work[hidden],#kids-journey-root .ka-received-work>article[hidden]{display:none!important}
 @media(max-width:600px){
  ${P}{width:calc(100vw - 16px);max-width:calc(100vw - 16px);border-radius:18px}
  ${P} .ka-modal-header{padding:18px 56px 14px 16px}
  ${P} .ka-modal-header h2{font-size:18px}
  ${P}>.j-modal-close{margin:12px 12px -48px 0}
  ${P} .ka-modal-body,${P} .ka-modal-body.bc-focused-task{padding:14px 16px 16px}
  ${P} .ka-detail-block{grid-template-columns:32px minmax(0,1fr);column-gap:11px}
  ${P} .ka-detail-block::before{width:32px;height:32px;border-radius:10px;font-size:16px}
  ${P} .ka-detail-block>h3,${P} .ka-detail-block>.ka-block-heading{min-height:32px}
  ${P} .ka-course-details>p.bc-feedback-empty{padding-left:43px}
  ${P} .ka-course-details>p.bc-feedback-empty::before{width:32px;height:32px;border-radius:10px;font-size:16px}
  ${P} .bc-resource-row>a.j-primary,${P} .j-task-actions a.j-primary{width:100%}
  ${P} .ka-modal-footer{padding:12px 16px}
  ${P} .ka-modal-footer .j-modal-close{width:100%}
  #kids-journey-root #j-detail .kdl-head strong{font-size:15px}
 }
 `;D.head.append(style);
})(window);
