const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(process.argv[2]||'.');
(async()=>{const browser=await chromium.launch({headless:true});let count=0;try{
for(const file of fs.readdirSync(path.join(root,'ielts-nghe')).filter(f=>f.endsWith('.html'))){
 if(!/const DATA\s*=/.test(fs.readFileSync(path.join(root,'ielts-nghe',file),'utf8')))continue;
 const context=await browser.newContext(),page=await context.newPage();
 await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='review.test')return r.abort();const p=path.join(root,decodeURIComponent(u.pathname));return fs.existsSync(p)?r.fulfill({path:p}):r.abort();});
 await page.goto('https://review.test/ielts-nghe/'+file);
 const result=await page.evaluate(()=>{
  const legacy=Array.isArray(DATA.sections[0].questions);
  let migrated=true;
  if(legacy){
   const previous={};for(const s of DATA.sections)for(let i=0;i<20;i++)previous[`s${s.number}d${i}`]='saved-'+s.number+'-'+i;
   previous.q1='keep-IELTS';listeningWrite(studentStoreKey('audit'),JSON.stringify({schemaVersion:SCHEMA_VERSION,answers:previous}));loadStudentState('audit');
   for(const s of DATA.sections)s.dictationAnswers.forEach((v,i)=>{const old=(s.dictationPreviousAnswers||s.dictationAnswers).findIndex(a=>norm(a)===norm(v));const actual=answers[`s${s.number}d${i}`],expected=old>=0?previous[`s${s.number}d${old}`]:undefined;if(actual!==expected)migrated=false;});
   if(answers.q1!=='keep-IELTS')migrated=false;
   const first=JSON.stringify(answers);loadStudentState('audit');if(JSON.stringify(answers)!==first)migrated=false;
   answers={};for(const s of DATA.sections){s.dictationAnswers.forEach((a,i)=>answers[`s${s.number}d${i}`]=variants(a)[0]);s.questions.forEach(q=>answers[`q${q.number}`]=variants(s.ieltsAnswers[q.number-(s.number-1)*10-1])[0]);
    for(const g of s.groups||[]){if(!g.selectCount)continue;const items=groupQuestions(s,g),valid=[...new Set(items.flatMap(q=>variants(s.ieltsAnswers[q.number-(s.number-1)*10-1])))];if(items[0]?.options)answers[`group:${g.key||items[0].number}`]=valid.slice(0,g.selectCount);else items.forEach((q,i)=>answers[`q${q.number}`]=valid[i]);}
   }
   return {legacy,migrated,scores:gradeAllResponses(),sections:DATA.sections.length};
  }
  state.g={};state.q={};DATA.sections.forEach((s,index)=>{s.clozeAnswers.forEach((a,i)=>state.g[`${index+1}-${i}`]=a);const [first,last]=range(index);for(let q=first;q<=last;q++)state.q[q]=DATA.answers[q][0];for(const [key,nums] of questionGroupsFor(index))state.q[key]=[...new Set(nums.flatMap(q=>DATA.answers[q]))].slice(0,nums.length);});
  return {legacy,migrated,scores:gradeAllResponses().scores,sections:DATA.sections.length};
 });
 assert(result.migrated,file+': draft migration lost or reassigned an unchanged response');
 for(const [key,value] of Object.entries(result.scores))assert.equal(value,key.startsWith('d')?20:10,file+': '+key+' does not award full marks for its answer key');
 console.log('PASS content/grading/drafts '+file);count++;await context.close();
}
assert.equal(count,40);console.log('PASS all 40 pages / 120 sections');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
