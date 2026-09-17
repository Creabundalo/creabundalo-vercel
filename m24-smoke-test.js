const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const source=['m24-core.js','m24-data.js','m24-historical.js','m24-lab.js']
  .map(file=>fs.readFileSync(file,'utf8'))
  .join('\n');

const test=`
(async()=>{
  const fallback=new M24Data.MockProvider();
  const provider=new M24Historical.HistoricalProvider({fallback});
  const runtime=new M24Core.Runtime({provider});
  const snapshot=await runtime.snapshot('BTC',{mode:'lab',window:'episode',resolution:'W'});
  assert(snapshot.market.bars.length>=70,'historical bars missing');
  assert(snapshot.market.provenance[0].sourceType==='PUBLIC_REPRODUCIBLE_FIXTURE','provenance missing');
  const historicalCase=await provider.getHistoricalCase('BTC-2021-2022-TOP-MARKDOWN');
  const result=M24Lab.analyzeTopMarkdown(historicalCase);
  assert(result.comparisons.priceHighChangePct>5 && result.comparisons.priceHighChangePct<7,'unexpected second-top price comparison');
  assert(result.comparisons.volumeChangePct<-45,'expected lower week volume at second top');
  assert(result.comparisons.rsiBearishDivergence===false,'weekly RSI hypothesis must not be falsely confirmed');
  assert(result.support.firstWeeklyCloseBelow==='2022-01-17','unexpected support-break date');
  assert(result.outcome.drawdownFromSecondHighPct<-70,'historical markdown outcome not detected');
  console.log('M24 smoke test OK',JSON.stringify({comparisons:result.comparisons,support:result.support,outcome:result.outcome}));
})()
`;

(async()=>{
  await vm.runInThisContext(`${source}\n${test}`,{filename:'m24-smoke-bundle.js'});
})().catch(err=>{console.error(err);process.exit(1)});
