const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const rows=JSON.parse(fs.readFileSync('private/frontend-inventory.json')).rows;
const shared=fs.readFileSync('confirmed-profile-client.js','utf8');new vm.Script(shared);
const manifest=[];
for(const row of rows){
 let s=fs.readFileSync('private/frontend/'+row.route+'.html','utf8').replace(/\r\n?/g,'\n');
 s=s.replace(/<script\b[^>]*data-core-profile-policy=["']2["'][^>]*>[\s\S]*?<\/script>/gi,'');
 s=s.replace(/(\/student-learning\/active-roster-v1\.js)(?:\?v=[^"']+)?/g,'$1?v=20261023-core-profile-v2');
 let gates=0;
 if(row.kind.startsWith('kids')){
  s=s.replace(/var proof = fallback \? withdrawn : verified;[\s\S]*?(?=if \(boot\.preparedHistory \|\| sub\.preparedProjection\))/,()=>{
   gates++;return `// CORE_PROFILE_POLICY_V2: optional completeness does not own profile availability.\n    if (!sub.coverage.every(function(c){return object(c)&&typeof c.family==='string'&&c.family!=='*'&&typeof c.complete==='boolean'&&typeof c.freshRead==='boolean';}) || !object(sub.submissionVerification) || typeof sub.submissionVerification.complete!=='boolean' || !object(sub.assignmentAuthority)) throw failure('INVALID_SNAPSHOT');\n    `;
  });assert(gates===1||gates===0&&s.includes('CORE_PROFILE_POLICY_V2: optional completeness does not own profile availability.'),row.className+' optional gate');
  for(const [fn,arg]of [['responseHasErrors','data'],['parentPackagePartial_','value'],['parentPackageStale_','value']]){
   const pattern=new RegExp('function '+fn+'\\('+arg+'\\) \\{');
   assert(pattern.test(s),row.className+' '+fn);
   const start=s.search(pattern),near=s.slice(start,start+250);
   if(!near.includes('coreAvailableForViewV2'))s=s.replace(pattern,m=>m+'\n      // CORE_PROFILE_POLICY_V2: optional errors/age cannot veto a validated prepared core.\n      if ('+arg+' && '+arg+'.coreAvailableForViewV2 === true) return false;\n');
  }
 }
 // Context-specific presentation labels: unavailable metadata is not an unsubmitted assignment.
 const labels={
 'Đang cập nhật link bài':'Chưa có link bài','Đang cập nhật số bài kiểm tra':'Chưa có số liệu kiểm tra','Đang cập nhật tiêu chí':'Chưa có tiêu chí',
 'Đang cập nhật địa điểm':'Chưa có địa điểm','Đang cập nhật kết quả':'Chưa có điểm','Đang cập nhật điểm mới':'Điểm đã lưu',
 'Đang hiển thị dữ liệu gần nhất · Đang cập nhật lịch học…':'Lịch học đã lưu',
 'Đang cập nhật hồ sơ của con…':'Hồ sơ học tập','Đang cập nhật hồ sơ của em…':'Hồ sơ học tập',
 'Hồ sơ chưa tải xong. Bố mẹ bấm tải lại nhé.':'Chưa có bản lưu trên thiết bị này. Vui lòng thử lại kết nối.',
 'Đang cập nhật dữ liệu. Các phần đã tải vẫn có thể xem bình thường.':'Các phần đã lưu vẫn có thể xem bình thường.',
 'Đang cập nhật phần dữ liệu còn lại…':'Dữ liệu đã lưu','Đang cập nhật phía sau…':'Bản lưu gần nhất',
 'Hồ sơ chưa tải xong':'Hồ sơ học tập','Chưa thể kết nối hồ sơ':'Hồ sơ học tập','Chưa thể kiểm tra quyền truy cập':'Hồ sơ học tập',
 'Đang cập nhật':'—','Đang xác minh':'— Chưa nộp bài','Đang xác nhận':'— Chưa nộp bài','Chưa đọc đủ':'— Chưa nộp bài','Cần đối chiếu':'Cô sẽ kiểm tra'
 };
 for(const[a,b]of Object.entries(labels))s=s.split(a).join(b);
 s=s.replace(/<head([^>]*)>/i,(m)=>m+'\n<script data-core-profile-policy="2">'+shared+'</script>');
 const scripts=[...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!(/\bsrc=|type=["'](?:application\/json|application\/ld\+json)/i.test(m[1])));
 for(let i=0;i<scripts.length;i++)new vm.Script(scripts[i][2],{filename:row.route+'/script'+i});
 fs.mkdirSync('candidate/frontend',{recursive:true});fs.writeFileSync('candidate/frontend/'+row.route+'.html',s);
 manifest.push({class:row.className,kind:row.kind,route:row.route,gitSha:row.gitSha,gates,scripts:scripts.length,bytes:Buffer.byteLength(s)});
}
assert.equal(manifest.length,43);fs.writeFileSync('frontend-build-manifest.json',JSON.stringify(manifest,null,2));console.log(JSON.stringify({classes:manifest.length,kidsGates:manifest.reduce((n,r)=>n+r.gates,0),allSyntaxChecked:true}));
