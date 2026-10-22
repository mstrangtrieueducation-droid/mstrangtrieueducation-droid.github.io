/* CORE_PROFILE_POLICY_V2: tracker first; optional readers never own availability. */
var CORE_PROFILE_OPTIONAL_ERRORS_V2_=[];
function coreProfileCopyV2_(v){return JSON.parse(JSON.stringify(v));}
function coreProfileOptionalV2_(name,read,fallback){
 try{return read();}catch(error){CORE_PROFILE_OPTIONAL_ERRORS_V2_.push({source:String(name),code:String(error&&(error.code||error.message)||'SOURCE_UNAVAILABLE').replace(/[^A-Z0-9_]/g,'').slice(0,90)});return typeof fallback==='function'?fallback():coreProfileCopyV2_(fallback);}
}
function coreProfileUnknownProofV2_(){return {schema:1,complete:false,freshRead:false,verifiedAt:0};}
function coreProfileUnknownAuthorityV2_(klass){var p=coreProfileUnknownProofV2_();p.className=klass;p.assignments=[];p.lessonData={};return p;}
function coreProfileReceiptFallbackV2_(klass,families,authority){return {schema:1,className:klass,receipts:[],emptyReceipts:[],unassignedReceipts:[],coverage:(families||['OPTIONAL_SOURCE']).map(function(f){var p=coreProfileUnknownProofV2_();p.family=f;p.structurallyComplete=false;p.sourceFailure=true;p.issues=[];return p;}),submissionVerification:coreProfileUnknownProofV2_(),assignmentAuthority:authority||coreProfileUnknownAuthorityV2_(klass)};}
function coreProfileReceiptShapeV2_(s,klass){
 return !!(s&&s.schema===1&&s.className===klass&&Array.isArray(s.receipts)&&Array.isArray(s.coverage)&&s.coverage.length>0&&s.coverage.every(function(c){return c&&typeof c.family==='string'&&c.family!=='*';})&&s.submissionVerification&&typeof s.submissionVerification.complete==='boolean'&&s.assignmentAuthority&&s.assignmentAuthority.className===klass);
}
function coreProfilePartialV2_(s){return !s||!s.submissionVerification||s.submissionVerification.complete!==true||s.submissionVerification.freshRead!==true||!s.coverage.every(function(c){return c.complete===true&&c.freshRead===true;})||s.assignmentAuthority.complete!==true||s.assignmentAuthority.freshRead!==true;}
function coreProfileKidsEmptyDatasetV2_(job){var cfg=kidsAccountConfigV1_(),ids=uniqueStrings_(CONFIG.submissionSpreadsheetIds||[]),direct={};ids.forEach(function(id){direct[id]={spreadsheetId:id,sheets:[],optionalSourceError:true};});return {schema:1,cluster:cfg.cluster,generation:job.sourceGeneration,classes:cfg.classes,capturedAt:0,sourceIds:ids,allowed:(CONFIG.submissionSheetNames||[]).map(normalizeSearchText_).sort(),direct:direct,index:{recordsByClass:{},snapshotBuiltAt:0}};}
function coreProfilePresentationV2_(value){
 if(typeof value==='string')return value.replace(/cần đối chiếu/gi,function(s){return s[0]===s[0].toUpperCase()?'Cô sẽ kiểm tra':'cô sẽ kiểm tra';}).replace(/Đang cập nhật|Đang xác minh|Chưa đọc đủ/gi,'— Chưa nộp bài').replace(/Hồ sơ chưa tải xong|Chưa thể kết nối hồ sơ|Chưa thể kiểm tra quyền truy cập/gi,'Hồ sơ học tập');
 if(Array.isArray(value)){for(var i=0;i<value.length;i++)value[i]=coreProfilePresentationV2_(value[i]);return value;}
 if(value&&typeof value==='object'){Object.keys(value).forEach(function(k){value[k]=coreProfilePresentationV2_(value[k]);});return value;}return value;
}
function coreProfileMergeExtrasV2_(next,prior){
 if(!prior||next.className!==prior.className||next.identity&&next.identity!==prior.identity||next.name&&next.name!==prior.name)return next;
 var a=next.actions,b=prior.actions;if(!a||!b)return next;
 var s=a.submissions,old=b.submissions;if(!s||!old||s.className!==old.className)return next;
 var failed=(s.coverage||[]).filter(function(c){return !c.complete||!c.freshRead;}).map(function(c){return c.family;});
 function merge(current,previous){var values={},unknown=failed.indexOf('OPTIONAL_SOURCE')>=0;
  (previous||[]).forEach(function(r){if(r&&r.id&&(unknown||failed.indexOf(r.family)>=0))values[r.id]=coreProfileCopyV2_(r);});
  (current||[]).forEach(function(r){if(r&&r.id)values[r.id]=r;});return Object.keys(values).map(function(k){return values[k];}).sort(function(a,b){return a.submittedAt-b.submittedAt;});}
 if(failed.length){s.receipts=merge(s.receipts,old.receipts);s.emptyReceipts=merge(s.emptyReceipts,old.emptyReceipts);next.sourceStatus=Object.assign({},next.sourceStatus,{retainedReceiptAsOf:prior.sourceStatus&&prior.sourceStatus.receiptAsOf||prior.capturedAt});}
 var reads=next.sourceStatus&&next.sourceStatus.optionalReads||[];
 if(reads.indexOf('paragraph-reviews')>=0&&a.paragraphReviews&&b.paragraphReviews&&a.paragraphReviews.studentName===b.paragraphReviews.studentName&&!a.paragraphReviews.reviews.length)a.paragraphReviews=coreProfileCopyV2_(b.paragraphReviews);
 var student=a.profile&&a.profile.student,previous=b.profile&&b.profile.student;
 if(reads.indexOf('shadowing-feedback')>=0&&student&&previous&&student.name===previous.name&&(!student.shadowingFeedback||!student.shadowingFeedback.length)){
  student.shadowingFeedback=coreProfileCopyV2_(previous.shadowingFeedback||[]);
  var embedded=a.bootstrap&&a.bootstrap.profile&&a.bootstrap.profile.student;if(embedded&&embedded.name===student.name)embedded.shadowingFeedback=coreProfileCopyV2_(student.shadowingFeedback);
 }
 if(reads.indexOf('self-study')>=0&&Array.isArray(a.selfStudy)&&!a.selfStudy.length&&Array.isArray(b.selfStudy))a.selfStudy=coreProfileCopyV2_(b.selfStudy);
 return next;
}
if(typeof module==='object'&&module.exports)module.exports={coreProfileOptionalV2_,coreProfileReceiptFallbackV2_,coreProfileReceiptShapeV2_,coreProfilePartialV2_,coreProfileMergeExtrasV2_};
