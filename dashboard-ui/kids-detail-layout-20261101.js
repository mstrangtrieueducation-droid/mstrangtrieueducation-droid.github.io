/* Presentation only. Re-lays out the native paper-homework text in KIDS detail dialogs; never changes status, receipts or counts. */
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
 }
 function schedule(){if(!queued){queued=true;root.requestAnimationFrame(paint);}}
 new MutationObserver(()=>{if(D.querySelector('#j-detail .bc-paper-books:not([data-kdl]),#j-detail .ka-paper:not([data-kdl])'))schedule();}).observe(D.documentElement,{childList:true,subtree:true});
 schedule();
 const style=D.createElement('style');style.textContent=`
 /* Lesson details: one sheet with hairline dividers instead of a card per section. */
 #kids-journey-root #j-detail .ka-course-details>.ka-detail-block{background:none;border:0;border-radius:0;box-shadow:none;margin:0;padding:18px 2px}
 #kids-journey-root #j-detail .ka-course-details>.ka-detail-block:first-child{padding-top:2px}
 #kids-journey-root #j-detail .ka-course-details>.ka-detail-block+.ka-detail-block{border-top:1px solid #e8edf2}
 #kids-journey-root #j-detail .ka-course-details>.ka-detail-block:last-child{padding-bottom:2px}
 #kids-journey-root #j-detail .ka-course-details .ka-detail-block h3{font-size:15px;margin-bottom:8px}
 #kids-journey-root #j-detail .ka-course-details .ka-block-heading{margin-bottom:8px}
 #kids-journey-root #j-detail .bc-resource-details .bc-resource-row:first-of-type{border-top:0;padding-top:2px}
 #kids-journey-root #j-detail .ka-paper small{display:block;margin-top:10px}
 /* Paper homework: a heading per book, the full instruction, then notes as a plain list. */
 #kids-journey-root #j-detail .kdl-list{display:grid}
 #kids-journey-root #j-detail .kdl-book{padding:14px 0}
 #kids-journey-root #j-detail .kdl-book:first-child{padding-top:0}
 #kids-journey-root #j-detail .kdl-book+.kdl-book{border-top:1px solid #e8edf2}
 #kids-journey-root #j-detail .kdl-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:6px}
 #kids-journey-root #j-detail .kdl-head strong{font-size:16px;font-weight:700;line-height:1.4;color:#183355}
 #kids-journey-root #j-detail .kdl-pages{padding:3px 11px;border-radius:999px;background:#fff1c2;color:#795b12;font-size:13px;font-weight:700;white-space:nowrap}
 #kids-journey-root #j-detail .kdl-main{margin:0;font-size:14.5px;line-height:1.7;color:#2c4258}
 #kids-journey-root #j-detail .kdl-list b{font-weight:700;color:#183355}
 #kids-journey-root #j-detail .kdl-notes{display:grid;gap:5px;margin:8px 0 0;padding:0 0 0 20px;font-size:13.5px;line-height:1.65;color:#5b6d80}
 #kids-journey-root #j-detail .kdl-notes li{margin:0;padding:0;border:0;background:none}
 #kids-journey-root #j-detail .kdl-notes li::marker{color:#b8c3cf}
 #kids-journey-root #j-detail .kdl-notes .kdl-warn{color:#8a5a12}
 #kids-journey-root #j-detail .kdl-list a{color:#1d5fa8;text-decoration:underline;overflow-wrap:anywhere}
 @media(max-width:600px){#kids-journey-root #j-detail .kdl-head strong{font-size:15px}#kids-journey-root #j-detail .kdl-main{font-size:14px}}
 `;D.head.append(style);
})(window);
