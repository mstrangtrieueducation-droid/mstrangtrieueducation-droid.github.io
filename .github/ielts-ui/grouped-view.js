(function(root){
'use strict';
const native=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
const key=n=>n.nodeType===1?(n.id||['data-assignment-id','data-shadowing-code','data-history-section'].map(a=>n.hasAttribute(a)?a+':'+n.getAttribute(a):'').find(Boolean)||''):'';
function sync(parent,next){
 const pool=new Map(Array.from(parent.childNodes).filter(n=>key(n)).map(n=>[key(n),n]));let cursor=parent.firstChild;
 for(const desired of Array.from(next.childNodes)){
  const k=key(desired);let node=k?pool.get(k):cursor;
  if(!node||node.nodeType!==desired.nodeType||node.nodeName!==desired.nodeName||(!k&&key(node)))node=desired.cloneNode(true);
  if(node!==cursor)parent.insertBefore(node,cursor);
  if(node.nodeType===3){if(node.nodeValue!==desired.nodeValue)node.nodeValue=desired.nodeValue;}
  else if(node.nodeType===1){
   const preserveOpen=node.tagName==='DETAILS',scroll=node.scrollLeft;
   for(const attr of Array.from(node.attributes))if(!desired.hasAttribute(attr.name)&&!(preserveOpen&&attr.name==='open'))node.removeAttribute(attr.name);
   for(const attr of Array.from(desired.attributes))if(!(preserveOpen&&attr.name==='open')&&node.getAttribute(attr.name)!==attr.value)node.setAttribute(attr.name,attr.value);
   sync(node,desired);if(scroll)node.scrollLeft=scroll;
  }
  if(k)pool.delete(k);cursor=node.nextSibling;
 }
 while(cursor){const old=cursor;cursor=cursor.nextSibling;if(parent.id==='panel-overview'&&old.id==='ielts48-writing-overview')continue;old.remove();}
}
function protect(host){if(host.__inPlace)return;host.__inPlace=true;let previous=null;
 Object.defineProperty(host,'innerHTML',{configurable:true,get(){return native.get.call(this)},set(html){html=String(html);if(this.id==='panel-overview')html=(root.IeltsStudyHub?.overviewHtml?.()||'')+html;if(html===previous)return;previous=html;const template=document.createElement('template');native.set.call(template,html);const view=typeof IeltsStableView==='object'?IeltsStableView.capture():null;const update=()=>sync(this,template.content);if(view)IeltsStableView.update(view,update);else update();}});
}
function install(o){
 if(document.getElementById('ielts48-group-tools'))return;
 document.querySelectorAll('main>.panel').forEach(protect);
 const nav=document.getElementById('class-tabs');nav.classList.add('grouped-navigation');
 const old=document.createElement('div');old.hidden=true;old.className='native-tab-storage';while(nav.firstChild)old.append(nav.firstChild);nav.append(old);
 const names=[['plan','📅 Kế hoạch & lịch học'],['work','📚 Bài tập 4 kỹ năng'],['results','🏆 Kết quả & xếp hạng']];
 names.forEach(([id,label])=>{const b=document.createElement('button');b.type='button';b.dataset.group=id;b.textContent=label;b.addEventListener('click',()=>activate(id==='plan'?planMode:id==='work'?workMode:resultMode));nav.append(b);});
 const tools=document.createElement('div');tools.id='ielts48-group-tools';tools.innerHTML='<div data-tools="plan"><button data-view="schedule">Lịch học cả khoá</button><button data-view="planner">Việc cần làm tuần này</button></div><div data-tools="work">'+[['homework-all','Tất cả'],['speaking','Speaking'],['writing','Writing'],['reading','Reading'],['listening','Listening'],['shadowing','Shadowing']].map(([v,t])=>'<button data-view="'+v+'">'+t+'</button>').join('')+'</div><div data-tools="results"><button data-view="overview">📊 Kết quả của em</button><button data-view="leaderboard">🏆 Bảng xếp hạng lớp</button></div>';
 nav.insertAdjacentElement('afterend',tools);tools.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>activate(b.dataset.view)));
 let planMode='planner',workMode='homework-all',resultMode='overview',activating=false;
 function activate(tab,base){if(activating)return;activating=true;try{
  if(tab==='plan')tab=planMode;if(tab==='work')tab=workMode;if(tab==='results')tab=resultMode;
  const group=['schedule','planner'].includes(tab)?'plan':['speaking','writing','reading','listening','shadowing','homework-all'].includes(tab)?'work':'results';
  if(group==='plan')planMode=tab;if(group==='work')workMode=tab;if(group==='results')resultMode=tab;
  const call=base||o.original;
  if(group==='work'&&root.Ielts48Master){
   call(tab==='homework-all'?'speaking':tab);o.getState().active=tab;root.Ielts48Master.show(tab);
  }else if(group==='results'){
   call(tab);document.getElementById('panel-overview').hidden=tab!=='overview';document.getElementById('panel-leaderboard').hidden=tab!=='leaderboard';o.getState().active=tab;
  }else call(tab);
  if(group!=='work'){const master=document.getElementById('panel-homework');if(master)master.hidden=true;}
  nav.querySelectorAll('[data-group]').forEach(b=>{const selected=b.dataset.group===group;b.classList.toggle('is-active',selected);b.setAttribute('aria-pressed',selected);});
  tools.querySelectorAll('[data-tools]').forEach(p=>p.hidden=p.dataset.tools!==group||(group==='plan'&&tab==='planner'));
  tools.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('is-active',b.dataset.view===tab);b.setAttribute('aria-pressed',b.dataset.view===tab);});
  root.Ielts48Compact?.update?.();
 }finally{activating=false;}}
 o.wrapActivate(activate);
 const requested=new URLSearchParams(location.search).get('view');if(requested==='homework-all')o.getState().active=requested;
 root.Ielts48Grouped={activate,refresh:()=>activate(o.getState().active),protect,sync};
}
root.Ielts48Grouped={install,sync,protect};
})(globalThis);
