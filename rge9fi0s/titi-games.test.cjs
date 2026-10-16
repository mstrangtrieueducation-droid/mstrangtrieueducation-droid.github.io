const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
test('Dashboard keeps valid inline JavaScript and loads the isolated game adapter once',()=>{
 for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(!/\bsrc=/.test(match[1])&&match[2].trim())new vm.Script(match[2]);}
 for(const name of ['student-context.js','classroom-progress.js','galaxy-core.js','titi-games.js'])assert.equal(html.split(name).length-1,1);
 assert.equal(html.split('id="titi-games"').length-1,1);
});
test('The game snapshot requires the authorized profile, complete class data, valid token and visible dashboard',()=>{
 const source=html.slice(html.indexOf('window.TitiDashboardSnapshot = function'),html.indexOf('    function parentLearningUrl_'));
 const student='A'.repeat(22),env={window:{},location:{hash:'#p='+student},kidsLearningPrefill_:{getIdentity:()=>({englishName:'Luna',className:'QA'})},kidsApi:{parent:{revoked:false}},app:{data:{gameUnlocks:{'phonics-1':2}}},validDashboardData:()=>true,$:()=>({hidden:false}),sessions:()=>[{program:'Phonics 1',url:'https://example.test/finished'}],childAssignmentFor:()=>({title:'Completed only'}),URLSearchParams};
 vm.runInNewContext(source,env);assert.equal(env.window.TitiDashboardSnapshot().student,student);assert.equal(env.window.TitiDashboardSnapshot().lessons.length,1);
 env.kidsApi.parent.revoked=true;assert.equal(env.window.TitiDashboardSnapshot(),null);env.kidsApi.parent.revoked=false;
 env.kidsLearningPrefill_.getIdentity=()=>null;assert.equal(env.window.TitiDashboardSnapshot(),null);env.kidsLearningPrefill_.getIdentity=()=>({englishName:'Luna'});
 env.validDashboardData=()=>false;assert.equal(env.window.TitiDashboardSnapshot(),null);env.validDashboardData=()=>true;
 env.location.hash='#p=bad';assert.equal(env.window.TitiDashboardSnapshot(),null);
});
