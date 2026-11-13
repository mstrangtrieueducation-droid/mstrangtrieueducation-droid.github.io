/* IELTS_SCORE_DISPLAY_V1 (owner 13/11/2026: "ielts speaking hay shadow đều có % hay band điểm... tìm cách hiển thị thật hiệu quả").
   Presentation only. Reads the comment text the page already shows; never fetches, grades, counts or changes a submission.
   1. Speaking: the grader writes two formats. Old: "🎯 Estimated Band: 5.5" + "• Pronunciation:".
      New (from late 10/2026): "IELTS Speaking: Band ước tính 5.5." + "• Fluency & Coherence (5):".
      The frozen parser only knew the old one, so new comments lost their band and all but one criterion.
      The text is rewritten into the old shape before the frozen parser reads it; criterion bands are shown on each tile.
   2. One score block for every skill: big band or %, colour by level, bar, criteria chips (Speaking, Shadowing, Writing).
   3. The "Nhận xét của cô trên bảng theo dõi" fallback keeps only lines that are not already shown on the card. */
(function(root){
 'use strict';
 if(root.IeltsScoreDisplay)return;
 const doc=root.document;
 const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
 const num=v=>{const n=Number(String(v==null?'':v).replace(',','.'));return Number.isFinite(n)?n:null};
 const fmtBand=n=>Number.isInteger(n)?n.toFixed(1):String(n);
 function bandLevel(n){return n>=7?'high':n>=5.5?'good':n>=4.5?'mid':'low'}
 function pctLevel(n){return n>=80?'high':n>=60?'good':n>=40?'mid':'low'}
 const levelWord={high:'Tốt',good:'Khá',mid:'Cần cố gắng',low:'Cần luyện thêm'};

 // ---------- Speaking text normalisation ----------
 const CRIT=[
  ['pronunciation',/Pronunciation/i,'Phát âm'],
  ['fluency',/Fluency\s*&\s*Coherence/i,'Độ trôi chảy & liên kết'],
  ['lexical',/Lexical Resource/i,'Từ vựng'],
  ['grammar',/Grammatical Range\s*&\s*Accuracy/i,'Ngữ pháp']
 ];
 function speakingNormalize(value){
  let text=String(value==null?'':value);const scores={};let band=null;
  const oldBand=/Estimated Band\s*:\s*(\d+(?:[.,]\d+)?)/i.exec(text);
  const newBand=/IELTS Speaking\s*:\s*Band ước tính\s*(\d+(?:[.,]\d+)?)\.?/i.exec(text);
  if(oldBand)band=num(oldBand[1]);
  else if(newBand){band=num(newBand[1]);text=text.replace(newBand[0],'🎯 Estimated Band: '+newBand[1].replace(',','.'));}
  text=text.replace(/^(\s*[•*]?\s*)(Pronunciation|Fluency\s*&\s*Coherence|Lexical Resource|Grammatical Range\s*&\s*Accuracy)\s*\(\s*(\d+(?:[.,]\d+)?)\s*\)\s*:/gim,(all,lead,name,score)=>{
   const c=CRIT.find(x=>x[1].test(name));if(c)scores[c[0]]=num(score);return lead+name+':';});
  const line=/Phát âm:\s*([\d.,]+)\s*·\s*Trôi chảy:\s*([\d.,]+)\s*·\s*Từ vựng:\s*([\d.,]+)\s*·\s*Ngữ pháp:\s*([\d.,]+)/i.exec(text);
  if(line){['pronunciation','fluency','lexical','grammar'].forEach((k,i)=>{if(scores[k]==null)scores[k]=num(line[i+1])});}
  return{text,band,scores};
 }
 function bar(fraction,level){return '<span class="isd-bar"><i class="isd-'+level+'" style="width:'+Math.max(4,Math.min(100,Math.round(fraction*100)))+'%"></i></span>'}
 function scoreBlock(kind,value,label,chips){
  const isBand=kind==='band',level=isBand?bandLevel(value):pctLevel(value);
  const shown=isBand?fmtBand(value):(Math.round(value*10)/10)+'%';
  return '<div class="isd-score isd-'+level+'" data-isd="'+kind+'"><div class="isd-num"><b>'+esc(shown)+'</b><small>'+esc(label)+'</small></div>'+
   '<div class="isd-meta"><span class="isd-word">'+esc(levelWord[level])+'</span>'+bar(isBand?value/9:value/100,level)+
   (chips&&chips.length?'<div class="isd-chips">'+chips.map(c=>'<span class="isd-chip isd-'+bandLevel(c[1])+'"><em>'+esc(c[0])+'</em>'+esc(fmtBand(c[1]))+'</span>').join('')+'</div>':'')+'</div></div>';
 }

 function patchSpeaking(){
  const api=root.IeltsSpeakingFeedback;if(!api||api.__isd)return !!api;
  const parse0=api.parse,render0=api.render;
  api.parse=function(value){return parse0.call(this,speakingNormalize(value).text)};
  api.render=function(value,key){
   const n=speakingNormalize(value);let html=render0.call(this,n.text,key);if(!html)return html;
   CRIT.forEach(([id,,label])=>{const s=n.scores[id];if(s==null)return;
    const tag='<h4>'+esc(label)+'</h4>';
    html=html.split(tag).join('<h4>'+esc(label)+' <span class="isd-crit isd-'+bandLevel(s)+'">'+esc(fmtBand(s))+'</span></h4>'+bar(s/9,bandLevel(s)));});
   if(n.band!=null){
    const chips=CRIT.filter(c=>n.scores[c[0]]!=null).map(c=>[c[2],n.scores[c[0]]]);
    html=html.replace(/<span class="speaking-feedback-band">[\s\S]*?<\/span><\/header>/,'</header>'+scoreBlock('band',n.band,'Band ước tính bài nói',html.includes('isd-crit')?null:chips));
   }
   return html;
  };
  api.__isd=true;return true;
 }

 // ---------- Shadowing ----------
 function patchShadowing(){
  const api=root.ShadowingFeedback;if(!api||api.__isd)return !!api;
  const render0=api.render;
  api.render=function(record,key){
   let html=render0.call(this,record,key);if(!html)return html;
   return html.replace(/(<header class="shadow-feedback-head"><strong>Nhận xét Shadowing<\/strong>)<span>([^<]*?(\d+(?:[.,]\d+)?)\s*%[^<]*)<\/span>(<\/header>)/,(all,head,text,p,end)=>{
    const v=num(p);return v==null?all:head+end+scoreBlock('pct',v,'Chất lượng bài Shadowing');});
  };
  api.__isd=true;return true;
 }

 // ---------- Writing (DOM: .wr-summary .wr-verdict) ----------
 function writingCriteria(text){
  const after=/sau khi trừ\s*:?\s*([^)]*)\)/i.exec(text),base=/tiêu chí\s*:\s*([^)]*)\)/i.exec(text);
  const src=(after||base||[])[1]||'';const out=[];
  src.replace(/\b(TR|TA|CC|LR|GRA)\s*([\d.,]+)/g,(m,k,v)=>{const n=num(v);if(n!=null)out.push([k,n]);});
  return out;
 }
 function enhanceWriting(scope){
  scope.querySelectorAll('.wr-summary .wr-verdict:not([data-isd-done])').forEach(v=>{
   v.setAttribute('data-isd-done','1');
   const t=v.textContent.trim();const band=/^Band\s*([\d.,]+)/i.exec(t),pct=/([\d.,]+)\s*%/.exec(t);
   const card=v.closest('.wr-summary');const overall=card&&card.querySelector('.wr-overall');
   let html='';
   if(band){const n=num(band[1]);if(n!=null)html=scoreBlock('band',n,'Band bài viết',writingCriteria(overall?overall.textContent:''));}
   else if(pct){const n=num(pct[1]);if(n!=null)html=scoreBlock('pct',n,'Chất lượng bài viết trên lớp');}
   if(!html)return;
   const holder=doc.createElement('div');holder.className='isd-writing';holder.innerHTML=html;
   v.hidden=true;v.style.display='none';v.insertAdjacentElement('afterend',holder);
  });
 }

 // ---------- Fallback block: keep only what the card does not already show ----------
 const norm=s=>String(s||'').normalize('NFC').replace(/^\s*(?:[-•*]|\d+[.)])\s*/,'').replace(/\s+/g,' ').trim().toLowerCase();
 function tidyFallback(scope){
  scope.querySelectorAll('section.native-tracker-teacher-comment:not([data-isd-done])').forEach(sec=>{
   sec.setAttribute('data-isd-done','1');
   const p=sec.querySelector('p');if(!p)return;
   const host=sec.closest('dialog')||sec.parentElement||doc.body;
   const clone=host.cloneNode(true);clone.querySelectorAll('section.native-tracker-teacher-comment').forEach(x=>x.remove());
   const shown=norm(clone.textContent);
   const hasScore=!!host.querySelector('.isd-score');
   const keep=p.textContent.split(/\n+/).filter(line=>{
    const l=line.trim();if(!l)return false;
    if(/^【[^】]*】$/.test(l))return false;                                   // writing markers like 【Bài 2.2 · band 6.5】
    if(hasScore&&/(Band ước tính|Estimated Band|^Phát âm:\s*[\d.,]+\s*·|^Chất lượng:\s*đạt)/i.test(l))return false;
    if(/^[•*]?\s*(Pronunciation|Fluency\s*&\s*Coherence|Lexical Resource|Grammatical Range\s*&\s*Accuracy)\s*(\([\d.,\s]*\))?\s*:$/i.test(l))return false;
    if(/^(?:👉\s*)?Lời khuyên trọng tâm\s*:?$/i.test(l))return false;
    const n=norm(l);return n&&!shown.includes(n);
   });
   if(!keep.length){sec.hidden=true;sec.style.display='none';return;}
   p.textContent=keep.join('\n');
  });
 }

 // ---------- List cards: colour the existing score chip by level ----------
 function enhanceChips(scope){
  scope.querySelectorAll('.master-result span:not([data-isd-chip])').forEach(el=>{
   if(el.children.length)return;const t=el.textContent.trim();
   const b=/^Band(?: ước tính)?\s*(\d+(?:[.,]\d+)?)$/i.exec(t),q=/^Chất lượng\s*(?:đạt\s*)?(\d+(?:[.,]\d+)?)\s*%$/i.exec(t);
   const n=num((b||q||[])[1]);if(n==null)return;
   el.setAttribute('data-isd-chip','1');el.classList.add('isd-pill','isd-'+(b?bandLevel(n):pctLevel(n)));
  });
 }
 function scan(scope){try{enhanceChips(scope)}catch(_){}try{enhanceWriting(scope)}catch(_){}try{tidyFallback(scope)}catch(_){}}
 function boot(){
  patchSpeaking();patchShadowing();scan(doc);
  let queued=false;
  new MutationObserver(()=>{if(queued)return;queued=true;(root.requestAnimationFrame||setTimeout)(()=>{queued=false;scan(doc)});})
   .observe(doc.body,{childList:true,subtree:true});
 }
 // The frozen renderers are defined by inline scripts before this file; patch at once so the first paint uses them.
 patchSpeaking();patchShadowing();
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

 const css=`.isd-score{display:flex;align-items:center;gap:14px;margin:10px 0 12px;padding:12px 14px;border-radius:14px;border:1px solid var(--isd-line);background:var(--isd-bg)}
.isd-num{display:flex;flex-direction:column;align-items:center;min-width:76px}
.isd-num b{font-size:34px;line-height:1;font-weight:800;color:var(--isd-ink);font-variant-numeric:tabular-nums}
.isd-num small{margin-top:5px;font-size:11px;color:#5d6b80;text-align:center;line-height:1.25;max-width:110px}
.isd-meta{flex:1;min-width:0;display:flex;flex-direction:column;gap:7px}
.isd-word{font-size:13px;font-weight:700;color:var(--isd-ink)}
.isd-bar{display:block;height:8px;border-radius:8px;background:#e7edf4;overflow:hidden}
.isd-bar i{display:block;height:100%;border-radius:8px;background:var(--isd-fill)}
.isd-chips{display:flex;flex-wrap:wrap;gap:6px}
.isd-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:999px;font-size:12px;font-weight:700;background:#fff;border:1px solid var(--isd-line);color:var(--isd-ink)}
.isd-chip em{font-style:normal;font-weight:500;color:#5d6b80}
.isd-crit{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;font-size:12px;font-weight:800;background:var(--isd-bg);color:var(--isd-ink);border:1px solid var(--isd-line);vertical-align:1px}
.speaking-feedback-preview .isd-bar,.speaking-feedback-criterion .isd-bar{height:5px;margin:2px 0 6px}
.isd-high{--isd-ink:#17663a;--isd-bg:#edf8f1;--isd-line:#bfe3cc;--isd-fill:#2e9d5b}
.isd-good{--isd-ink:#164f8c;--isd-bg:#eef5fd;--isd-line:#c4daf3;--isd-fill:#2f7bd0}
.isd-mid{--isd-ink:#8a4b05;--isd-bg:#fff6e8;--isd-line:#f3d5a6;--isd-fill:#e39b2d}
.isd-low{--isd-ink:#9b1c3a;--isd-bg:#fdeef2;--isd-line:#f3c2cf;--isd-fill:#d64a6c}
.isd-bar i.isd-high{--isd-fill:#2e9d5b}.isd-bar i.isd-good{--isd-fill:#2f7bd0}.isd-bar i.isd-mid{--isd-fill:#e39b2d}.isd-bar i.isd-low{--isd-fill:#d64a6c}
.isd-pill{background:var(--isd-bg)!important;color:var(--isd-ink)!important;border:1px solid var(--isd-line)!important;font-weight:800!important}
@media(max-width:520px){.isd-score{gap:10px;padding:10px 12px}.isd-num{min-width:64px}.isd-num b{font-size:28px}}`;
 const st=doc.createElement('style');st.id='ielts-score-display-v1';st.textContent=css;(doc.head||doc.documentElement).appendChild(st);
 root.IeltsScoreDisplay={version:1,speakingNormalize,writingCriteria};
})(window);
