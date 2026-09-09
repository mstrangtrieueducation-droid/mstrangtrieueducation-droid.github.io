/* Portable source resolution for published-asset regression checks. */
const fs=require('fs'),path=require('path');
function option(name,fallback){const index=process.argv.indexOf(name);return index>=0?process.argv[index+1]:fallback;}
function runtime(kind){
  const explicit=option(kind==='fullTest'?'--full-runtime':'--fighter-runtime');if(explicit)return path.resolve(explicit);
  const manifestPath=option('--manifest');
  if(manifestPath){const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8')),entry=manifest[kind];if(!entry?.runtime)throw Error(`Manifest lacks ${kind}.runtime`);const siteRoot=option('--site-root');return siteRoot?path.resolve(siteRoot,entry.scriptBase.replace(/^\//,''),entry.runtime):path.resolve(path.dirname(manifestPath),kind==='fullTest'?'full-test':'fighter',entry.runtime);}
  return path.join(__dirname,kind==='fullTest'?'full-durable.js':'fighter-durable.js');
}
module.exports={option,runtime};
