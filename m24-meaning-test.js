const fs=require('fs');
const vm=require('vm');

const source=['m24-cases.js','m24-meaning.js'].map(file=>fs.readFileSync(file,'utf8')).join('\n');
const test=`
(()=>{
  const check=(condition,message)=>{if(!condition) throw new Error(message)};
  const caseSchema=M24Cases.get('BTC-2021-2022-TOP-MARKDOWN');
  const result=M24Meaning.analyzeCase(caseSchema);
  check(result.firstTop.count===2,'first-top meaning sources should resolve from timestamp window');
  check(result.automaticReaction.count===1,'reaction source should resolve from timestamp window');
  check(result.supportReference.count===1,'support/adoption source should resolve from timestamp window');
  check(result.secondTop.count===2,'second-top meaning sources should resolve from timestamp window');
  check(result.firstTop.dominantFrames.some(x=>x.frame==='MAINSTREAM_ADOPTION'),'first-top adoption frame missing');
  check(result.secondTop.dominantFrames.some(x=>x.frame==='INFLATION_HEDGE'),'second-top inflation frame missing');
  check(result.secondTop.direction>0.8,'second-top coded narrative direction unexpected');
  check(result.note.includes('not a truth score'),'meaning-world coding must not be presented as truth');
  const provenance=M24Meaning.toProvenance(result.sources[0]);
  check(provenance.publisher==='Reuters'&&provenance.publishedAt.startsWith('2021-04-14'),'meaning source provenance missing');
  console.log('M24 meaning-world test OK',JSON.stringify({firstTop:result.firstTop.count,secondTop:result.secondTop.count,delta:result.comparison.directionDelta}));
})();
`;

try{vm.runInThisContext(`${source}\n${test}`,{filename:'m24-meaning-test-bundle.js'})}catch(err){console.error(err);process.exit(1)}
