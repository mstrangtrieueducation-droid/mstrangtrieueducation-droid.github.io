// Builds /dashboard-ui/ielts-writing-extra-assignments.js from the Writing runner's public week list
// (class, week code, task titles only — no pupil data). Background job; parents only load the static file.
import fs from 'node:fs';
const SRC = 'https://raw.githubusercontent.com/mstrangtrieueducation-droid/ielts-grader-runner/writing-dashboard/dashboard-assignments.json';
const OUT = 'dashboard-ui/ielts-writing-extra-assignments.js';
let data = {entries: []};
try { const r = await fetch(SRC, {signal: AbortSignal.timeout(30000)}); if (r.ok) data = await r.json(); else if (r.status !== 404) throw Error('HTTP_' + r.status); }
catch (e) { console.log('source unavailable:', e.message); process.exit(0); }
const clean = v => String(v ?? '').replace(/[<>\u0000-\u001f]/g, ' ').trim().slice(0, 160);
const entries = (Array.isArray(data.entries) ? data.entries : []).filter(e => /^IELTS \d{2,3}$/.test(e.className) && /^IELTS-WRITING-W\d{2,3}$/.test(e.assignmentCode))
  .map(e => ({className: e.className, assignmentCode: e.assignmentCode,
    tasks: (Array.isArray(e.tasks) ? e.tasks : []).filter(t => Number.isInteger(t.taskNumber) && t.taskNumber > 0 && t.taskNumber <= 50).map(t => ({taskNumber: t.taskNumber, title: clean(t.title)}))}))
  .sort((a, b) => (a.className + a.assignmentCode).localeCompare(b.className + b.assignmentCode));
const js = `/* Writing weeks graded after this page was built (generated hourly from the Writing runner's public week list).
   Data only: it adds week/task entries to this page's Writing list and never changes reviews, marks or receipts. */
(function(root){'use strict';
 var EXTRA=${JSON.stringify(entries)};
 var m=root.IELTS_WRITING_ASSIGNMENTS; if(!m||!Array.isArray(m.assignments))return;
 var list=m.assignments;
 EXTRA.forEach(function(e){
  var week=Number(e.assignmentCode.replace(/^\\D+/,''));
  var same=list.filter(function(a){return a&&a.assignmentCode===e.assignmentCode;});
  var mine=same.filter(function(a){return Array.isArray(a.classNames)&&a.classNames.indexOf(e.className)>=0;});
  var have={};mine.forEach(function(a){(a.tasks||[]).forEach(function(t){have[Number(t.taskNumber)]=1;});});
  var base=same.filter(function(a){return Array.isArray(a.tasks)&&e.tasks.every(function(t){return a.tasks.some(function(x){return Number(x.taskNumber)===t.taskNumber;});});})[0];
  var tasks=e.tasks.filter(function(t){return !have[t.taskNumber];}).map(function(t){
   var b=base&&base.tasks.filter(function(x){return Number(x.taskNumber)===t.taskNumber;})[0];
   return b?b:{taskNumber:t.taskNumber,title:t.title,lessonAliases:[]};});
  if(mine.length&&!tasks.length)return;
  list.push({assignmentCode:e.assignmentCode,enabledFromWeek:week,classNames:[e.className],sessionNumbers:[week],
   lessonUrl:base&&base.lessonUrl||undefined,lessonAliases:[],notebook:true,reviewDriven:false,tasks:tasks});
 });
 /* Giảm tải Task 1 (Cô 14/11): these lessons now ask for ONE homework essay (Đề 1); the other prompt moved to the
    end-of-course practice file. Đề 1 is shown as "Bài viết về nhà"; an Đề 2 card is hidden unless the pupil
    actually has work or a review for it (presentation only — reviews, marks and receipts are untouched). */
 var ONE={'IELTS-WRITING-W07':1,'IELTS-WRITING-W08':1,'IELTS-WRITING-W09':1,'IELTS-WRITING-W13':1,'IELTS-WRITING-W14':1,
  'IELTS-WRITING-W15':1,'IELTS-WRITING-W16':1,'IELTS-WRITING-W17':1,'IELTS-WRITING-W18':1};
 list.forEach(function(a){if(a&&ONE[a.assignmentCode]&&Array.isArray(a.tasks))a.tasks.forEach(function(t){
  if(Number(t.taskNumber)===1&&!t.displayLabel)t.displayLabel='Bài viết về nhà';});});
 var d=root.document;if(!d||!root.MutationObserver)return;
 var EMPTY=/Chưa có bài chữa chi tiết cho Đề|Chưa tìm thấy bài nộp Đề|để trống Đề/;
 function tidy(){Object.keys(ONE).forEach(function(code){
  var secs=d.querySelectorAll('[data-wr-assignment="'+code+'"]');
  for(var i=0;i<secs.length;i++){var cards=secs[i].querySelectorAll('article.wr-pending[data-wr-task]');
   for(var j=0;j<cards.length;j++){var c=cards[j];
    if(Number(c.getAttribute('data-wr-task'))>1&&EMPTY.test(c.textContent||''))c.parentNode.removeChild(c);}}});}
 var t=null;function soon(){if(t)return;t=setTimeout(function(){t=null;tidy();},60);}
 function start(){tidy();new root.MutationObserver(soon).observe(d.body,{childList:true,subtree:true});}
 if(d.body)start();else d.addEventListener('DOMContentLoaded',start);
})(window);
`;
const old = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
if (old === js) { console.log('unchanged'); process.exit(0); }
fs.mkdirSync('dashboard-ui', {recursive: true}); fs.writeFileSync(OUT, js); console.log(JSON.stringify({entries: entries.length}));
