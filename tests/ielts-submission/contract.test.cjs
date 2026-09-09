#!/usr/bin/env node
'use strict';
// Portable deployment contract. Tests the files referenced by current HTML, not an unused old asset.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const argv=process.argv.slice(2),options={};
for(let i=0;i<argv.length;i+=2){assert.ok(/^--[a-z-]+$/.test(argv[i])&&argv[i+1],'Use --root DIR --kind main|reading|fighter --manifest JSON [--write-config JSON]');options[argv[i].slice(2)]=argv[i+1]}
const root=path.resolve(options.root||'.'),kind=options.kind;
assert.ok(['main','reading','fighter'].includes(kind),'--kind must be main, reading, or fighter');
assert.ok(options.manifest,'--manifest is required');
const input=JSON.parse(fs.readFileSync(path.resolve(options.manifest),'utf8'));
// Git checkouts may use CRLF on Windows; release filenames were derived from LF source text.
const hash=text=>crypto.createHash('sha256').update(text.replace(/\r\n/g,'\n')).digest('hex');
const sorted=values=>[...values].sort();
function disk(relative){assert.ok(typeof relative==='string'&&!path.isAbsolute(relative)&&!relative.split(/[\\/]/).includes('..'),'Unsafe repo-relative path: '+relative);const value=path.resolve(root,relative);assert.ok(value===root||value.startsWith(root+path.sep),'Asset outside repo: '+relative);return value}
function walk(relative=''){const dir=disk(relative||'.');return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{if(['.git','.github','node_modules','tests'].includes(entry.name))return [];const file=path.posix.join(relative,entry.name);return entry.isDirectory()?walk(file):file.endsWith('.html')?[file]:[]})}
function read(relative){return fs.readFileSync(disk(relative),'utf8')}
function attrs(text){const result={};for(const match of text.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))result[match[1].toLowerCase()]=match[2]??match[3]??match[4]??'';return result}
function scripts(html){const clean=html.replace(/<!--[\s\S]*?-->/g,'');return [...clean.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].map(match=>({...attrs(match[1]),body:match[2]}))}
function resolveUrl(src,page,publicBase){const base=new URL(publicBase+page,'https://contract.invalid');const url=new URL(src.replace(/&amp;/g,'&'),base);assert.equal(url.origin,base.origin,'Unexpected external executable: '+src);assert.ok(url.pathname.startsWith(publicBase),'Executable outside deployed repo: '+src);return decodeURIComponent(url.pathname.slice(publicBase.length))}
function asset(file,requires){const body=read(file);return {file,sha256:hash(body),requires}}
function createConfig(manifest){
  const sharedRequires=['enqueueListening(','subscribe(listener)','async lookup(','indexedDB.open','SUBMISSION_PAYLOAD_CHANGED','validateReceipt(payload'];
  const config={version:1,kind,publicBase:kind==='reading'?'/ielts-reading-web/':kind==='fighter'?'/listening-lab-7q4m9x2k/':'/',pages:[],assets:[]};
  const addAsset=(file,requires)=>{if(!config.assets.some(x=>x.file===file))config.assets.push(asset(file,requires));return file};
  const page=(file,expected,inline=[])=>config.pages.push({file,expected,inline});
  if(kind==='main'){
    const listening=(manifest.files.main||[]).filter(file=>/^ielts-nghe\/[^/]+\.html$/.test(file));assert.equal(listening.length,40);
    const client=addAsset('ielts-nghe/'+manifest.client,sharedRequires);
    for(const file of listening){const full=read(file).includes('function ensureScoresSubmitted()');page(file,[{role:'client',file:client}],['const SCHEMA_VERSION=4;','window.IELTSSubmission.listening(','window.IELTSSubmission.subscribe?.(','listeningReceipt(',...(full?['window.IELTSSubmission.enqueueListening(','record.final.payloads[part.key]','persistStudentState(record,current())']:['record.finalIntent.payload','listeningWrite(studentStoreKey(owner)'])])}
    const full=manifest.fullFighter.fullTest,base='ielts-full-test/assets/';
    const runtime=addAsset(base+full.runtime,['root.IELTSFullDurable=api','indexedDB.open','payloadFingerprint','moduleConfirmed','requestId']);
    const module=addAsset(base+full.bundle,['window.IELTSFullDurable.register(','window.IELTSFullDurable.submit(','window.IELTSFullDurable.subscribe(','window.IELTSFullDurable.writeDraft(','window.IELTSFullDurable.readDraft(']);
    for(const file of ['ielts-full-test/index.html','ielts-full-test/404.html'])page(file,[{role:'runtime',file:runtime},{role:'module',file:module}]);
  }else if(kind==='reading'){
    const routes=(manifest.files.reading||[]).filter(file=>file.endsWith('.html'));assert.equal(routes.length,41);
    const client=addAsset('assets/'+manifest.client,sharedRequires);
    const module=addAsset('assets/'+manifest.readingBundle,['window.IELTSSubmission.send(','window.IELTSSubmission.subscribe(','window.IELTSSubmission.lookup(','window.IELTS_READING_DRAFTS.prepare(','window.IELTS_READING_DRAFTS.confirmResult(','window.IELTS_READING_DRAFTS.commit(','window.IELTS_READING_DRAFTS.fail(']);
    for(const file of routes)page(file,[{role:'client',file:client},{role:'module',file:module}]);
  }else{
    const fighter=manifest.fullFighter.fighter;
    const client=addAsset(manifest.client,sharedRequires);
    const runtime=addAsset(fighter.runtime,['root.IELTSFighterDurable=','indexedDB.open','root.IELTSSubmission.send(','root.IELTSSubmission.subscribe?.(']);
    const module=addAsset(fighter.bundle,['window.IELTSFighterDurable.prepare(','window.IELTSFighterDurable.send(','window.IELTSFighterDurable.subscribe(','window.IELTSFighterDurable.readAsync(']);
    page('index.html',[{role:'client',file:client},{role:'runtime',file:runtime},{role:'module',file:module}]);
  }
  return config;
}
const config=input.version===1&&Array.isArray(input.pages)&&Array.isArray(input.assets)?input:createConfig(input);
assert.equal(config.kind,kind,'Contract is for a different repository kind');
assert.equal(config.pages.length,{main:42,reading:41,fighter:1}[kind],'Unexpected route count');
assert.equal(new Set(config.pages.map(p=>p.file)).size,config.pages.length,'Duplicate route');
const actualRoutes=kind==='main'?[...walk('ielts-nghe').filter(file=>path.posix.basename(file)!=='index.html'),...walk('ielts-full-test')]:kind==='reading'?walk().filter(file=>file!=='index.html'&&!file.startsWith('internal-review/')):['index.html'];
assert.deepEqual(sorted(actualRoutes),sorted(config.pages.map(p=>p.file)),'HTML routes added/removed without updating the tested contract');
for(const expected of config.assets){
  const body=read(expected.file);assert.equal(hash(body),expected.sha256,'Tested asset changed: '+expected.file);
  const token=path.posix.basename(expected.file).match(/[.-]([0-9a-f]{12})\.js$/);assert.ok(token,'Asset must use a versioned release filename: '+expected.file);
  for(const needle of expected.requires)assert.ok(body.includes(needle),'Missing durable integration '+needle+' in actual asset '+expected.file);
}
for(const page of config.pages){
  const html=read(page.file),tags=scripts(html),executables=tags.map((tag,index)=>({...tag,index,file:tag.src?resolveUrl(tag.src,page.file,config.publicBase):null}));
  for(const needle of page.inline)assert.ok(html.includes(needle),'Missing inline integration '+needle+' in '+page.file);
  const relevant=executables.filter(tag=>tag.type==='module'||tag.file&&(/(?:^|\/)submission-client[^/]*\.js$/.test(tag.file)||/(?:^|\/)(?:full|fighter)-durable[^/]*\.js$/.test(tag.file)));
  assert.deepEqual(relevant.map(tag=>tag.file),page.expected.map(tag=>tag.file),'Current HTML must load exactly the tested client/runtime/module, in that order: '+page.file);
  for(let i=0;i<page.expected.length;i++){
    const expected=page.expected[i],tag=relevant[i];assert.ok(config.assets.some(asset=>asset.file===tag.file),'HTML executes an asset missing from the test contract: '+tag.file);
    if(expected.role==='module')assert.equal(tag.type,'module','App bundle must be a module: '+page.file);
    else{assert.ok(!('async'in tag)&&!('defer'in tag),'Durable runtime must execute before the app: '+page.file);assert.ok(!tag.type||['text/javascript','application/javascript'].includes(tag.type),'Durable runtime cannot be inert: '+page.file)}
    assert.equal(executables.filter(other=>other.file===tag.file).length,1,'Duplicate runtime/client/module: '+page.file);
  }
  // A classic app-bundle tag must not bypass the verified module/runtime path.
  const extraBundles=executables.filter(tag=>tag.file&&/(?:^|\/)index-[^/]+\.js$/.test(tag.file)&&!page.expected.some(expected=>expected.file===tag.file));
  assert.equal(extraBundles.length,0,'HTML also loads an untested app bundle: '+page.file);
}
if(options['write-config'])fs.writeFileSync(path.resolve(options['write-config']),JSON.stringify(config,null,2)+'\n');
console.log(JSON.stringify({kind,html:config.pages.length,assets:config.assets.length,passed:true}));
