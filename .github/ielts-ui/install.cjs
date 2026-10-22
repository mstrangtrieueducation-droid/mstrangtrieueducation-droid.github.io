// Adapt the approved UI modules, never class data, parent hashes or native assignment payloads.
const fs=require('node:fs'),path=require('node:path');
module.exports=function(html,number,route,seed){
 if(!Number.isInteger(number)||number<45||number>52||!/^\w{8}$/.test(route))throw Error('IELTS_UI_SCOPE');
 const canonical=fs.existsSync(path.join(__dirname,'base-install.cjs'))?__dirname:path.resolve(__dirname,'../ielts48-study-hub-20261022');
 const adapt=s=>s.replaceAll('Ielts48','Ielts'+number).replaceAll('ielts48','ielts'+number).replaceAll('IELTS48','IELTS'+number).replaceAll('IELTS 48','IELTS '+number).replaceAll('e73wgva4',route);
 const source=fs.readFileSync(path.join(canonical,canonical===__dirname?'base-install.cjs':'install.cjs'),'utf8');
 const adaptedFs={...fs,readFileSync(file,...args){const value=fs.readFileSync(file,...args);return typeof value==='string'&&/\.(?:js|css)$/.test(file)?adapt(value):value;}};
 const module={exports:{}};new Function('require','module','__dirname',adapt(source))(id=>id==='node:fs'||id==='fs'?adaptedFs:require(id),module,canonical);
 if(!seed){const file=[path.join(__dirname,'candidate',route,'data/academic-leaderboard.json'),path.resolve(route,'data/academic-leaderboard.json')].find(f=>fs.existsSync(f));if(file)seed=JSON.parse(fs.readFileSync(file));}
 if(seed?.className!=='IELTS '+number)throw Error('ACADEMIC_CLASS_IDENTITY');
 return module.exports(html,seed);
};
