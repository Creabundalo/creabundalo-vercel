const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('m24-patterns.js','utf8');
const test=`
(()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const lab={
  firstTop:{high:100,rsi14:80},
  secondTop:{high:103,rsi14:68},
  support:{referenceLow:70,firstCloseBelow:'2021-12-01'},
  outcome:{troughLow:40},
  checkpoints:{automaticReaction:{high:70,close:70}}
 };
 const rsi=M24Patterns.rsiDivergence(lab);
 check(rsi.status==='OBSERVED'&&rsi.direction==='BEARISH','RSI divergence');
 const w=M24Patterns.structuralDistribution(lab);
 check(w.status==='OBSERVED','structure');
 const fib=M24Patterns.fibGeometry({firstTop:{high:100},reaction:{close:70},secondTop:{high:103},trough:{troughLow:40}});
 check(fib.status==='MEASURED_GEOMETRY','fib');
 const pts=[100,110,102,118,108,125,112].map((v,i)=>({date:'2021-01-'+String(i+1).padStart(2,'0'),value:v}));
 const closeOnly={firstTop:{high:null,close:5000,rsi14:75},secondTop:{high:null,close:4900,rsi14:60},support:{referenceLow:null,referenceClose:4500,firstCloseBelow:'2000-04-01'}};
 const co=M24Patterns.structuralDistribution(closeOnly);
 check(co.firstTop===5000&&co.secondTop===4900,'close-only null high must fall through to close');
 const e=M24Patterns.elliottCandidate(pts,{thresholdPct:5});
 check(['CANDIDATE_ONLY','INSUFFICIENT'].includes(e.status),'elliott candidate contract');
 console.log('M24 pattern hypothesis contract OK');
})();
`;
vm.runInThisContext(`${source}\n${test}`);
