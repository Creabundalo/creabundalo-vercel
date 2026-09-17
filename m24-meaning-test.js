const fs=require('fs');
const vm=require('vm');

const source=['m24-cases.js','m24-meaning.js'].map(file=>fs.readFileSync(file,'utf8')).join('\n');
const test=`
(()=>{
  const check=(condition,message)=>{if(!condition) throw new Error(message)};
  const btc=M24Cases.get('BTC-2021-2022-TOP-MARKDOWN');
  const btcResult=M24Meaning.analyzeCase(btc);
  check(btcResult.firstTop.count===2,'BTC first-top meaning sources should resolve from timestamp window');
  check(btcResult.automaticReaction.count===1,'BTC reaction source should resolve from timestamp window');
  check(btcResult.supportReference.count===1,'BTC support/adoption source should resolve from timestamp window');
  check(btcResult.secondTop.count===2,'BTC second-top meaning sources should resolve from timestamp window');
  check(btcResult.sources.every(x=>x.assets.includes('BTC')),'BTC meaning context leaked another asset source');
  check(btcResult.firstTop.dominantFrames.some(x=>x.frame==='MAINSTREAM_ADOPTION'),'BTC first-top adoption frame missing');
  check(btcResult.secondTop.dominantFrames.some(x=>x.frame==='INFLATION_HEDGE'),'BTC second-top inflation frame missing');
  check(btcResult.note.includes('not a truth score'),'meaning-world coding must not be presented as truth');

  const eth=M24Cases.get('ETH-2021-2022-TOP-MARKDOWN');
  const ethResult=M24Meaning.analyzeCase(eth);
  check(ethResult.firstTop.count===2,'ETH first-top source coverage missing');
  check(ethResult.secondTop.count===2,'ETH second-top source coverage missing');
  check(ethResult.sources.length===4,'ETH should have exactly four scoped source fixtures');
  check(ethResult.sources.every(x=>x.assets.includes('ETH')),'ETH meaning context leaked BTC source');
  check(ethResult.firstTop.dominantFrames.some(x=>x.frame==='DEFI_ADOPTION'),'ETH DeFi first-top frame missing');
  check(ethResult.secondTop.dominantFrames.some(x=>x.frame==='RECORD_HIGH'),'ETH second-top record frame missing');
  check(M24Meaning.sourcesForCase(eth).every(x=>!x.assets.includes('BTC')),'asset filter failed');

  const provenance=M24Meaning.toProvenance(ethResult.sources[0]);
  check(provenance.publisher==='Reuters'&&provenance.assets.includes('ETH'),'ETH meaning provenance scope missing');
  console.log('M24 meaning-world test OK',JSON.stringify({btc:{firstTop:btcResult.firstTop.count,secondTop:btcResult.secondTop.count},eth:{firstTop:ethResult.firstTop.count,secondTop:ethResult.secondTop.count}}));
})();
`;

try{vm.runInThisContext(`${source}\n${test}`,{filename:'m24-meaning-test-bundle.js'})}catch(err){console.error(err);process.exit(1)}
