const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('A widget marked inert by the real homework gate becomes clickable after leaving the shell',()=>{
 const html=fs.readFileSync('rge9fi0s/index.html','utf8'),code=fs.readFileSync('student-learning/titi-games/dashboard.js','utf8');
 const start=html.indexOf('function setPendingWorkLock(locked)'),end=html.indexOf('\n    function hidePendingWorkGate',start);const host={inert:false},gate={},shell={children:[host,gate]},body={classList:{toggle(){}},append(node){shell.children=shell.children.filter(x=>x!==node);}};
 const scope={host,document:{body},$:id=>id==='#dashboardShell'?shell:gate};vm.createContext(scope);vm.runInContext(html.slice(start,end),scope);scope.setPendingWorkLock(true);assert.equal(host.inert,true);
 vm.runInContext(code.slice(code.indexOf('document.body.append(host);'),code.indexOf(' const planet=')),scope);assert.equal(host.inert,false);scope.setPendingWorkLock(false);assert.equal(host.inert,false);
 assert.match(code,/body.matches\('\.pending-work-locked,\.fighter-pending-work-locked'\)/);
});
