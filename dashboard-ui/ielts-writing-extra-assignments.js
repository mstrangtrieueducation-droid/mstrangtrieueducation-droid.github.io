/* Writing weeks graded after this page was built (generated hourly from the Writing runner's public week list).
   Data only: it adds week/task entries to this page's Writing list and never changes reviews, marks or receipts. */
(function(root){'use strict';
 var EXTRA=[{"className":"IELTS 45","assignmentCode":"IELTS-WRITING-W33","tasks":[]},{"className":"IELTS 46","assignmentCode":"IELTS-WRITING-W36","tasks":[{"taskNumber":1,"title":"Task 2 · Bài 14.1.4"}]},{"className":"IELTS 46","assignmentCode":"IELTS-WRITING-W37","tasks":[{"taskNumber":1,"title":"Task 2 · Bài 17.1.1"}]},{"className":"IELTS 47","assignmentCode":"IELTS-WRITING-W26","tasks":[]},{"className":"IELTS 47","assignmentCode":"IELTS-WRITING-W27","tasks":[]},{"className":"IELTS 47","assignmentCode":"IELTS-WRITING-W28","tasks":[{"taskNumber":1,"title":"Task 2 · Bài 2.2"}]},{"className":"IELTS 47","assignmentCode":"IELTS-WRITING-W29","tasks":[]},{"className":"IELTS 48","assignmentCode":"IELTS-WRITING-W12","tasks":[]},{"className":"IELTS 48","assignmentCode":"IELTS-WRITING-W16","tasks":[]},{"className":"IELTS 49","assignmentCode":"IELTS-WRITING-W12","tasks":[]},{"className":"IELTS 49","assignmentCode":"IELTS-WRITING-W13","tasks":[{"taskNumber":1,"title":"Task 1 · Most common sports in the UK"},{"taskNumber":2,"title":"Task 1 · Doctors and other workers’ salaries"}]},{"className":"IELTS 50","assignmentCode":"IELTS-WRITING-W05","tasks":[]},{"className":"IELTS 50","assignmentCode":"IELTS-WRITING-W07","tasks":[{"taskNumber":1,"title":"Task 1 · Car production"},{"taskNumber":2,"title":"Task 1 · Prison population"}]},{"className":"IELTS 50","assignmentCode":"IELTS-WRITING-W08","tasks":[{"taskNumber":1,"title":"Task 1 · Meat and fish consumption"},{"taskNumber":2,"title":"Task 1 · Higher education"}]},{"className":"IELTS 51","assignmentCode":"IELTS-WRITING-W05","tasks":[]},{"className":"IELTS 51","assignmentCode":"IELTS-WRITING-W06","tasks":[]},{"className":"IELTS 52","assignmentCode":"IELTS-WRITING-W06","tasks":[]}];
 var m=root.IELTS_WRITING_ASSIGNMENTS; if(!m||!Array.isArray(m.assignments))return;
 var list=m.assignments;
 EXTRA.forEach(function(e){
  var week=Number(e.assignmentCode.replace(/^\D+/,''));
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
 /* Giảm tải Task 1 (Cô 14/11): these lessons now ask for ONE homework essay (the kept Đề: 2 for W15/W17/W18, else 1); the other moved to the
    end-of-course practice file. The kept Đề is shown as "Bài viết về nhà"; the other Đề card is hidden unless the pupil
    actually has work or a review for it (presentation only — reviews, marks and receipts are untouched). */
 var ONE={'IELTS-WRITING-W07':1,'IELTS-WRITING-W08':1,'IELTS-WRITING-W09':1,'IELTS-WRITING-W13':1,'IELTS-WRITING-W14':1,
  'IELTS-WRITING-W15':2,'IELTS-WRITING-W16':1,'IELTS-WRITING-W17':2,'IELTS-WRITING-W18':2};
 list.forEach(function(a){if(a&&ONE[a.assignmentCode]&&Array.isArray(a.tasks))a.tasks.forEach(function(t){
  if(Number(t.taskNumber)===ONE[a.assignmentCode]&&!t.displayLabel)t.displayLabel='Bài viết về nhà';});});
 var d=root.document;if(!d||!root.MutationObserver)return;
 var EMPTY=/Chưa có bài chữa chi tiết cho Đề|Chưa tìm thấy bài nộp Đề|để trống Đề/;
 function tidy(){Object.keys(ONE).forEach(function(code){
  var secs=d.querySelectorAll('[data-wr-assignment="'+code+'"]');
  for(var i=0;i<secs.length;i++){var cards=secs[i].querySelectorAll('article.wr-pending[data-wr-task]');
   for(var j=0;j<cards.length;j++){var c=cards[j];
    if(Number(c.getAttribute('data-wr-task'))!==ONE[code]&&EMPTY.test(c.textContent||''))c.parentNode.removeChild(c);}}});}
 var t=null;function soon(){if(t)return;t=setTimeout(function(){t=null;tidy();},60);}
 function start(){tidy();new root.MutationObserver(soon).observe(d.body,{childList:true,subtree:true});}
 if(d.body)start();else d.addEventListener('DOMContentLoaded',start);
})(window);
