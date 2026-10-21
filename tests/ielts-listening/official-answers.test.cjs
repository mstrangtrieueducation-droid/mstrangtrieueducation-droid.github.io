const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(process.argv[2]||'.');
const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'official-answer-keys.json'),'utf8'));
(async()=>{
 const browser=await chromium.launch({headless:true});let questions=0,variants=0,groups=0;
 try{for(const test of fixture.tests)for(const file of test.pages){
  const context=await browser.newContext(),page=await context.newPage();
  await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='review.test')return r.abort();const p=path.join(root,decodeURIComponent(u.pathname));return fs.existsSync(p)?r.fulfill({path:p}):r.abort();});
  await page.goto('https://review.test/ielts-nghe/'+file);
  const result=await page.evaluate(test=>{
   const legacy=Array.isArray(DATA.sections[0].questions),errors=[];let checked=0,variants=0,groups=0;
   function reset(){if(legacy)answers={};else{state.g={};state.q={};}}
   function score(index){return legacy?scoreIeltsAt(index):gradeAllResponses().scores['i'+(index+1)];}
   function put(q,value){if(legacy)answers['q'+q]=value;else state.q[q]=value;}
   const inGroup=new Set(test.anyOrder.flat());
   DATA.sections.forEach((section,index)=>{
    const number=legacy?section.number:index+1;
    for(const row of test.questions.filter(q=>Math.ceil(q.number/10)===number)){
     checked++;
     if(inGroup.has(row.number))continue;
     for(const answer of row.accepted){reset();put(row.number,answer);variants++;if(score(index)!==1)errors.push({q:row.number,answer,score:score(index),expected:1});}
     for(const answer of row.rejected){reset();put(row.number,answer);if(score(index)!==0)errors.push({q:row.number,rejected:answer,score:score(index)});}
     reset();put(row.number,'__incorrect__');if(score(index)!==0)errors.push({q:row.number,wrongAccepted:true});
    }
    for(const nums of test.anyOrder.filter(g=>Math.ceil(g[0]/10)===number)){
     groups++;
     const values=[...new Set(nums.flatMap(n=>test.questions.find(q=>q.number===n).accepted))];
     const group=legacy?(section.groups||[]).find(g=>g.selectCount&&groupQuestions(section,g).some(q=>q.number===nums[0])):[...questionGroupsFor(index)].find(([,numbers])=>numbers.includes(nums[0]));
     const textGroup=legacy&&group&&!groupQuestions(section,group)[0].options;
     if(!group){errors.push({nums,missingGroup:true});continue;}
     const setGroup=chosen=>{reset();if(textGroup)nums.forEach((q,i)=>put(q,chosen[i]));else if(legacy)answers['group:'+(group.key||nums[0])]=chosen;else state.q[group[0]]=chosen;};
     for(const a of values)for(const b of values){
      setGroup([a,b]);const same=a===b||(textGroup&&(group.answerConcepts||[]).some(forms=>forms.includes(a)&&forms.includes(b)));const wanted=same?1:2;
      variants++;if(score(index)!==wanted)errors.push({nums,answers:[a,b],score:score(index),expected:wanted});
     }
     setGroup([values[0],'__incorrect__']);if(score(index)!==1)errors.push({nums,partialCredit:true});
    }
   });return{errors,checked,variants,groups};
  },test);
  assert.deepEqual(result.errors,[],`Test ${test.test} ${file}`);questions+=result.checked;variants+=result.variants;groups+=result.groups;
  console.log(`PASS Test ${test.test} ${file}: ${result.checked} official questions, ${result.variants} answer cases`);await context.close();
 }
 assert.equal(questions,1200);assert.equal(fixture.tests.length,30);console.log(`PASS ${questions} questions / ${variants} variant cases / ${groups} any-order groups`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

