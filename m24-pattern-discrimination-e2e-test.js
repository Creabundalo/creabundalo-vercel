const fs=require('fs'),vm=require('vm');
globalThis.__m24fs=fs;
const source=fs.readFileSync('m24-pattern-discrimination.js','utf8');
const test=`
(()=>{
 const matrix=JSON.parse(globalThis.__m24fs.readFileSync('m24-pattern-matrix-snapshot.json','utf8'));
 const snapFiles={
  'BTC-2019-TOP-MARKDOWN':'m24-verified-btc-2019.json',
  'BTC-2021-2022-TOP-MARKDOWN':'m24-verified-btc-2021.json',
  'ETH-2021-2022-TOP-MARKDOWN':'m24-verified-eth-2021.json',
  'SOL-2021-2022-TOP-MARKDOWN':'m24-verified-sol-2021.json',
  'NASDAQ-1999-2002':'m24-verified-nasdaq-2000.json'
 };
 const actions=Object.fromEntries(Object.entries(snapFiles).map(([caseId,file])=>[caseId,JSON.parse(globalThis.__m24fs.readFileSync(file,'utf8')).actionCandidate?.action||null]));
 const result=M24PatternDiscrimination.compare({matrix,actions,minSamples:30});
 globalThis.__m24fs.writeFileSync('m24-pattern-discrimination-snapshot.json',JSON.stringify(result,null,2));
 if(result.sample.directional!==3||result.sample.waitControls!==2) throw new Error('unexpected directional/control sample composition');
 if(result.results.RSI_BEARISH_DIVERGENCE.directional.signals!==3) throw new Error('RSI expected in all three directional seed cases');
 if(result.results.RSI_BEARISH_DIVERGENCE.waitControls.signals!==0) throw new Error('RSI unexpectedly present in WAIT controls');
 if(result.results.WYCKOFF_STRUCTURE.directional.signals!==3||result.results.WYCKOFF_STRUCTURE.waitControls.signals!==2) throw new Error('structural pattern should show no discrimination in selected top/markdown seed cohort');
 if(Object.values(result.results).some(x=>x.predictiveProbability!==null)) throw new Error('no pattern probability permitted at tiny n');
 console.log('M24 pattern discrimination E2E OK');
 console.log(JSON.stringify(result));
})();
`;
vm.runInThisContext(`${source}\n${test}`);
