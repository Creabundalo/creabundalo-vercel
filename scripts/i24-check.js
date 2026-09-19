const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const skip=new Set(['node_modules','.git']);
const errors=[];
let checked=0;

function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(skip.has(entry.name)) continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()){walk(full);continue;}
    const rel=path.relative(root,full).replace(/\\/g,'/');
    if(rel.endsWith('.js')){
      try{new Function(fs.readFileSync(full,'utf8'));checked++;}
      catch(err){errors.push(rel+': '+err.message);}
    }else if(rel.endsWith('.json')){
      try{JSON.parse(fs.readFileSync(full,'utf8'));checked++;}
      catch(err){errors.push(rel+': '+err.message);}
    }
  }
}
walk(root);
if(errors.length){
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('I24 syntax/config check OK · '+checked+' files');
