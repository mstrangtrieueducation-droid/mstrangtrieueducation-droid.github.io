(function(root){'use strict';
function received(s){if(!s)return false;
 const text=String(s.status||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();
 if(s.contentMissing===true||s.contentStatus==='empty'||s.hasContent===false||s.requiresResubmission===true||/can (?:nop lai|bo sung)|nop sai|chua hop le|da nop mot phan/.test(text))return false;
 if(s.completed===true||s.submitted===true||s.receiptReceived===true||s.submissionReceived===true)return true;
 const rows=[...(s.submissionAttempts||[]),...(s.directFormEvidence?.receipts||[]),...(s.directSubmission?.receipts||[])];
 return rows.some(r=>r&&r.contentMissing!==true&&r.contentStatus!=='empty'&&(r.submittedAt||r.submittedAtMs||r.receiptId))||Boolean(s.submittedAt)&&s.tracked===true;
}
root.FighterSubmissionEvidence={received};
})(globalThis);
