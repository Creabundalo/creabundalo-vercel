const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('m24-relations.js','utf8');
const test=`
(()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const left=[],right=[];
 for(let i=0;i<50;i++){
   const date='2020-01-'+String(i+1).padStart(2,'0');
   const x=100+i+(i%3);
   left.push({date,value:x});
   right.push({date,value:300-2*i-(i%3)});
 }
 const result=M24Relations.discoverPair({leftId:'A',rightId:'B',leftRecords:left,rightRecords:right,leftTransform:'DELTA',rightTransform:'DELTA',minObs:20,maxLag:2});
 check(result.state==='MEASURED_ASSOCIATION','relation state');
 check(result.sampleSize>=20,'sample size');
 check(result.contemporaneous.correlation<0,'expected inverse test relation');
 check(result.causalityStatus==='NOT_ESTABLISHED','causality guard');
 console.log('M24 cross-asset relation contract OK');
})();
`;
vm.runInThisContext(`${source}\n${test}`);
