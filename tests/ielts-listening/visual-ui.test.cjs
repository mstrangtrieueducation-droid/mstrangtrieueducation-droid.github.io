const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(process.argv[2]||'.'),reportDir=process.argv[3]&&path.resolve(process.argv[3]);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'tests/ielts-listening/visual-manifest.json'),'utf8'));
(async()=>{const browser=await chromium.launch({headless:true}),results=[];try{
 for(const width of [390,1440])for(const item of manifest.assets){
  const ctx=await browser.newContext({viewport:{width,height:1000}}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='visual.test')return r.abort();const p=path.join(root,decodeURIComponent(u.pathname));if(!fs.existsSync(p))return r.abort();return r.fulfill({path:p});});
  await page.goto('https://visual.test/ielts-nghe/'+item.page);
  await page.locator('#entryName,#studentName').fill('QA Visual Review');await page.locator('#entryClass,#studentClass').selectOption('IELTS 45');await page.locator('#enterTest').click();
  await page.evaluate(section=>{si=DATA.sections.findIndex(s=>Number(s.number)===section);stage='ielts';render();},item.section);
  const img=page.locator('img[src*="'+item.asset+'"]:not(.question-visual-dialog img)');await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());
  assert.equal(await img.count(),1);const box=await img.boundingBox();assert(box.width>200&&box.height>100);
  const controls=page.locator('[data-q]');const ids=await controls.evaluateAll(es=>[...new Set(es.map(e=>Number(e.dataset.q)))]);
  const grouped=await page.evaluate(()=>{const s=DATA.sections[si];return [...(s.groups||[]).filter(g=>g.selectCount).flatMap(g=>s.questions.filter(q=>q.groupKey===g.key).map(q=>q.number)),...Array.from(document.querySelectorAll('input[data-group]')).flatMap(el=>/^\d+-\d+$/.test(el.dataset.group)?el.dataset.group.split('-').map(Number):[])];});
  const expected=Array.from({length:10},(_,i)=>(item.section-1)*10+i+1);assert.deepEqual([...new Set([...ids,...grouped])].sort((a,b)=>a-b),expected);
  if(grouped.length)assert(await page.locator('input[type=checkbox], [data-group] input').count()>0);
  const zoom=page.getByRole('button',{name:'Phóng to hình đề bài'});assert.equal(await zoom.count(),1);
  if(item.test===20){for(const id of [11,12,13]){const control=page.locator(`select[data-q="${id}"]`);assert.equal(await control.count(),1);await control.selectOption(item.reviewedAnswers[id]);assert((await control.boundingBox()).y>=box.y+box.height);}}
  if(reportDir){fs.mkdirSync(reportDir,{recursive:true});await img.screenshot({path:path.join(reportDir,`t${item.test}-s${item.section}-${width}-image.png`)});}
  await zoom.click();const dialog=page.locator('.question-visual-dialog');assert(await dialog.isVisible());
  const enlarged=dialog.locator('img');await enlarged.evaluate(el=>el.decode());assert.equal(await enlarged.getAttribute('src'),await img.getAttribute('src').then(src=>new URL(src,page.url()).href));
  const fittedWidth=(await enlarged.boundingBox()).width;
  assert(await dialog.locator('.visual-pan').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  if(item.test===20&&reportDir)await page.screenshot({path:path.join(reportDir,`heater-overview-${width}.png`)});
  for(let i=0;i<3;i++)await dialog.getByRole('button',{name:'Phóng to',exact:true}).click();
  assert((await enlarged.boundingBox()).width>fittedWidth*2);assert(await dialog.getByRole('button',{name:'Đóng'}).isVisible());
  assert(await dialog.locator('.visual-pan').evaluate(el=>el.scrollWidth>el.clientWidth));
  if(item.test===20&&reportDir)await page.screenshot({path:path.join(reportDir,`heater-zoom-${width}.png`)});
  await dialog.getByRole('button',{name:'Vừa màn hình'}).click();assert(Math.abs((await enlarged.boundingBox()).width-fittedWidth)<1);
  await page.keyboard.press('Escape');assert(!(await dialog.isVisible()));assert(await zoom.evaluate(el=>document.activeElement===el));
  await page.evaluate(()=>render());assert.equal(await page.getByRole('button',{name:'Phóng to hình đề bài'}).count(),1);
  if(item.test===20){for(const id of [11,12,13])assert.equal(await page.locator(`select[data-q="${id}"]`).inputValue(),item.reviewedAnswers[id]);if(reportDir)await page.locator('.task-copy').first().screenshot({path:path.join(reportDir,`heater-${width}.png`)});}
  assert.deepEqual(errors,[]);results.push({test:item.test,section:item.section,width,imageLoaded:true,questionIds:ids,zoomPassed:true,answersPreserved:true});await ctx.close();
  console.log(`PASS visual Test ${item.test} Section ${item.section} width ${width}`);
 }
 if(reportDir)fs.writeFileSync(path.join(reportDir,'visual-ui-results.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify({passed:results.length,sourceVisuals:manifest.assets.length}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
