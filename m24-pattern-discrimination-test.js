const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('m24-pattern-discrimination.js','utf8');
const test=`
(()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const matrix={cases:{
  A:{patterns:{rsi:{status:'OBSERVED',direction:'BEARISH'},structure:{status:'OBSERVED'},fib:{secondLegReferenceMatch:false,markdownReferenceMatch:true},elliott:{status:'CANDIDATE_ONLY'}}},
  B:{patterns:{rsi:{status:'NOT_OBSERVED',direction:'NONE'},structure:{status:'OBSERVED'},fib:{secondLegReferenceMatch:true,markdownReferenceMatch:false},elliott:{status:'CANDIDATE_ONLY'}}}
 }};
 const r=M24PatternDiscrimination.compare({matrix,actions:{A:'DOWNSIDE_WATCH',B:'WAIT'},minSamples:30});
 check(r.results.RSI_BEARISH_DIVERGENCE.directional.signals===1,'RSI directional signal');
 check(r.results.RSI_BEARISH_DIVERGENCE.waitControls.signals===0,'RSI control signal');
 check(r.results.WYCKOFF_STRUCTURE.waitControls.signals===1,'structure must expose false discrimination');
 check(r.results.ELLIOTT_CANDIDATE.predictiveProbability===null,'no probability');
 check(r.results.RSI_BEARISH_DIVERGENCE.state==='INSUFFICIENT_SAMPLE','sample gate');
 console.log('M24 pattern discrimination contract OK');
})();
`;
vm.runInThisContext(`${source}\n${test}`);
