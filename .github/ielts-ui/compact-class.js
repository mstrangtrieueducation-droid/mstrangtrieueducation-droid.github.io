(function(root){'use strict';let opts,ready=null,cache=null;
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=(a,e={})=>a+'|'+JSON.stringify(Object.fromEntries(Object.entries(e).sort(([a],[b])=>a.localeCompare(b))));
async function load(){const token=new URLSearchParams(location.hash.slice(1)).get('p');if(!/^[\w-]{22}$/.test(token||''))throw Error('INVALID_LINK');const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');const r=await fetch('./data/writing/'+hash+'.json',{cache:'no-cache'});if(!r.ok)throw Error('WRITING_CACHE_UNAVAILABLE');const p=await window.IeltsSealedV1.open(await r.json());if(p.className!=='IELTS 48'||!p.actions)throw Error('INVALID_WRITING_CACHE');return p;}
function update(){const s=opts.getState();if(!s.student||!s.dashboard)return;const bar=document.getElementById('portal-student-bar'),name=s.student.name,group=/^group([12])$/.exec(s.student.speakingGroup||'')?.[1];if(!bar)return;
 if(['homework-all','speaking','writing','reading','listening','shadowing'].includes(s.active))root.Ielts48Master?.refresh();
 const html='<span class="compact-name">'+escape(name)+'</span><span class="compact-badge">IELTS 48'+(group?'.'+group:'')+'</span><span class="compact-badge group">🗣️ '+(group?'Speaking Nhóm '+group:'Nhóm Speaking chưa công bố')+'</span>';
 if(bar&&bar.__compact!==html){let content=bar.querySelector('[data-compact-student]');if(!content){content=document.createElement('div');content.dataset.compactStudent='';bar.appendChild(content);}content.innerHTML=html;bar.__compact=html;}
 const pending=(root.IeltsStudyHub.pendingTasks?.()||opts.pending()).map(t=>({...t,label:t.label||[t.skill&&t.skill.charAt(0).toUpperCase()+t.skill.slice(1),t.session||t.assignmentCode].filter(Boolean).join(' · ')})),notice=document.getElementById('update-banner');let box=document.getElementById('ielts48-important');if(!box){box=document.createElement('section');box.id='ielts48-important';bar.insertAdjacentElement('afterend',box);box.addEventListener('click',e=>{if(e.target.closest('[data-compact-pending]')){if(root.Ielts48Master?.openAllPending)root.Ielts48Master.openAllPending();else if(box.__pending&&root.IeltsStudyHub.openTask)root.IeltsStudyHub.openTask(box.__pending);else opts.openPending();}if(e.target.closest('[data-compact-schedule]'))opts.activate('schedule');});}box.__pending=pending[0]||null;
 const overdue=pending.filter(t=>t.dueAt&&t.dueAt<Date.now()).length,text='Em còn '+pending.length+' bài chưa hoàn thành'+(overdue?' · Trong đó '+overdue+' bài quá hạn':'');
 box.hidden=pending.length===0;
 const content='<svg class="compact-alert-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 21h20L12 3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 9v5m0 3v.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><p title="'+escape(text)+'"><strong><span class="compact-count-main">Em còn '+pending.length+' bài chưa hoàn thành</span>'+(overdue?'<span class="compact-count-separator"> · </span><span class="compact-count-late">Trong đó '+overdue+' bài quá hạn</span>':'')+'</strong></p><button data-compact-pending>Xem tất cả bài thiếu</button>';
 if(box.__content!==content){box.innerHTML=content;box.__content=content;}

}
function install(o){opts=o;o.status();ready=load().then(p=>{cache=p;return p;});ready.catch(()=>{});const request=o.access.request;
 o.access.request=async function(action,force,extra){if(['writing','classwork_index','classwork_review','classwork_source','writing_assessment','writing_assessment_source'].includes(action)){
  const p=cache||await ready,s=o.getState().student;if(s&&p.name!==s.name)throw Error('WRITING_CACHE_IDENTITY');let value=p.actions[key(action,extra||{})];if(!value||value.staticUnavailable)throw Error('Bài chữa đang được đồng bộ. Em vui lòng xem lại sau.');if(value.staticAsset){const r=await fetch('./data/writing/'+value.staticAsset,{cache:'force-cache'});if(!r.ok)throw Error('Bài chữa đang được đồng bộ. Em vui lòng xem lại sau.');value=await window.IeltsSealedV1.open(await r.json());}return structuredClone(value);
 }return request.call(this,action,force,extra);};
 setInterval(()=>{if(!document.hidden)load().then(p=>{cache=p;}).catch(()=>{});},300000);
 o.wrap(update);setInterval(()=>{if(!document.hidden)update();},1000);root.Ielts48Compact={update};
}
root.Ielts48Compact={install};
})(globalThis);
