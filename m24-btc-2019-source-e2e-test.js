const fs=require('fs');
const vm=require('vm');
const files=[
  'm24-core.js','m24-cases.js','m24-lab.js','m24-primary-lab.js','m24-coinbase.js',
  'm24-meaning.js','m24-cftc.js','m24-cftc-lab.js',
  'm24-macro.js','m24-macro-lab.js','m24-backtest.js','m24-evidence-gate.js','m24-enrichment.js'
];
globalThis.__m24fs=fs;
const source=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
  const check=(condition,message)=>{if(!condition)throw new Error(message)};
  const caseSchema=M24Cases.get('BTC-2019-TOP-MARKDOWN');
  const store=new M24Core.QubusStore();
  const providers={
    price:new M24Coinbase.CoinbaseHistoricalProvider(),
    derivatives:new M24Cftc.TffProvider(),
    derivativesLab:M24CftcLab,
    macro:new M24Macro.FredCsvProvider()
  };
  const startedAt=new Date().toISOString();
  const result=await M24Enrichment.runCase({store,caseSchema,providers,granularity:86400});
  const context=result.derivatives.context;
  const summary={
    type:'M24_REAL_SOURCE_ENRICHMENT_SNAPSHOT',caseId:caseSchema.id,asset:caseSchema.asset,
    startedAt,finishedAt:new Date().toISOString(),state:result.state,calibrationEligible:result.calibrationEligible,
    coverageProfile:result.evidence.coverageProfile,
    resolvedCheckpoints:{
      firstTop:result.backtest.snapshot.price.firstTop.date,
      secondTop:result.backtest.snapshot.price.secondTop.date,
      decisionAsOf:result.backtest.snapshot.asOf,
      supportBreakDate:result.backtest.outcome.supportBreakDate,
      troughDate:result.backtest.outcome.troughDate
    },
    meaningScope:result.meaning.sourceScope,
    derivatives:{
      evidenceFamily:context.evidenceFamily,sourceMode:context.sourceMode,
      firstTop:context.firstTop,secondTop:context.secondTop,comparison:context.comparison,
      sourceGaps:context.sourceGaps
    },
    evidenceLayers:Object.fromEntries(Object.entries(result.evidence.layers).map(([k,v])=>[k,{state:v.state,extensionState:v.extensionState||null,coverageProfile:v.coverageProfile||null,note:v.note}])),
    missingLayers:result.evidence.missingLayers,
    actionCandidate:result.backtest.candidate,
    sourceNotes:{
      price:'Coinbase Exchange historical candles',
      derivatives:'CFTC Traders in Financial Futures Futures Only, CME Bitcoin code 133741',
      macro:'Official-source series via FRED',
      meaning:'BTC-2019-scoped timestamped Reuters-source fixtures'
    },
    rule:'BTC 2019 uses regulated futures positioning rather than perpetual funding. COT reports are admitted only after publication availability; no live-order action exists.'
  };
  globalThis.__m24fs.writeFileSync('m24-btc-2019-source-snapshot.json',JSON.stringify(summary,null,2));
  check(result.meaning.firstTop.count>=1&&result.meaning.secondTop.count>=1,'BTC 2019 meaning coverage incomplete');
  check(context.evidenceFamily==='FUTURES_POSITIONING','BTC 2019 wrong derivatives family');
  check(context.firstTop.count===1&&context.secondTop.count===1,'CFTC checkpoints incomplete');
  check(context.firstTop.publishedAt<=result.backtest.snapshot.asOf,'first CFTC report leaked future');
  check(context.secondTop.publishedAt<=result.backtest.snapshot.asOf,'second CFTC report leaked future');
  check(result.evidence.coverageProfile==='FUTURES_POSITIONING','wrong evidence coverage profile');
  check(result.calibrationEligible===true,'BTC 2019 did not promote: '+JSON.stringify(result.evidence));
  console.log('M24 real-source BTC 2019 E2E OK');
  console.log(JSON.stringify(summary));
})().catch(err=>{
  const current=globalThis.__m24fs.existsSync('m24-btc-2019-source-snapshot.json')?JSON.parse(globalThis.__m24fs.readFileSync('m24-btc-2019-source-snapshot.json','utf8')):{};
  globalThis.__m24fs.writeFileSync('m24-btc-2019-source-snapshot.json',JSON.stringify({...current,failure:{at:new Date().toISOString(),message:String(err?.message||err),stack:String(err?.stack||'')}},null,2));
  console.error(err);process.exit(1);
});
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-btc-2019-source-e2e-bundle.js'});