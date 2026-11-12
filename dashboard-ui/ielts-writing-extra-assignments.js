/* Writing weeks graded after this page was built (generated hourly from the Writing runner's public week list).
   Data only: it adds week/task entries to this page's Writing list and never changes reviews, marks or receipts. */
(function(root){'use strict';
 var EXTRA=[{"className":"IELTS 46","assignmentCode":"IELTS-WRITING-W36","tasks":[{"taskNumber":1,"title":"Task 2 · Bài 14.1.4"}]},{"className":"IELTS 46","assignmentCode":"IELTS-WRITING-W37","tasks":[{"taskNumber":1,"title":"Task 2 · Bài 17.1.1"}]},{"className":"IELTS 47","assignmentCode":"IELTS-WRITING-W26","tasks":[]},{"className":"IELTS 47","assignmentCode":"IELTS-WRITING-W27","tasks":[]},{"className":"IELTS 47","assignmentCode":"IELTS-WRITING-W28","tasks":[{"taskNumber":1,"title":"Task 2 · Bài 2.2"}]},{"className":"IELTS 48","assignmentCode":"IELTS-WRITING-W12","tasks":[]},{"className":"IELTS 48","assignmentCode":"IELTS-WRITING-W16","tasks":[]},{"className":"IELTS 49","assignmentCode":"IELTS-WRITING-W12","tasks":[]},{"className":"IELTS 49","assignmentCode":"IELTS-WRITING-W13","tasks":[{"taskNumber":1,"title":"Task 1 · Most common sports in the UK"},{"taskNumber":2,"title":"Task 1 · Doctors and other workers’ salaries"}]},{"className":"IELTS 50","assignmentCode":"IELTS-WRITING-W05","tasks":[]},{"className":"IELTS 50","assignmentCode":"IELTS-WRITING-W07","tasks":[{"taskNumber":1,"title":"Task 1 · Car production"},{"taskNumber":2,"title":"Task 1 · Prison population"}]},{"className":"IELTS 51","assignmentCode":"IELTS-WRITING-W05","tasks":[]},{"className":"IELTS 51","assignmentCode":"IELTS-WRITING-W06","tasks":[]},{"className":"IELTS 52","assignmentCode":"IELTS-WRITING-W06","tasks":[]}];
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
})(window);
