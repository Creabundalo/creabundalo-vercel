const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('m24-relation-stability.js','utf8');
const test=`
(()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const a={contemporaneous:{correlation:-0.7}},b={contemporaneous:{correlation:0.5}};
 const r=M24RelationStability.compare({relationA:a,relationB:b,labelA:'stress',labelB:'recovery'});
 check(r.state==='SIGN_FLIP','sign flip expected');
 check(r.causalityStatus==='NOT_ESTABLISHED','causality guard');
 console.log('M24 relation stability contract OK');
})();
`;
vm.runInThisContext(`${source}\n${test}`);
