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
})(window);
`;
const old = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
if (old === js) { console.log('unchanged'); process.exit(0); }
fs.mkdirSync('dashboard-ui', {recursive: true}); fs.writeFileSync(OUT, js); console.log(JSON.stringify({entries: entries.length}));
