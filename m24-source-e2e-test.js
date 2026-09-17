const fs=require('fs');
const vm=require('vm');
const {webcrypto}=require('crypto');
if(!globalThis.crypto?.subtle) globalThis.crypto=webcrypto;
globalThis.__m24fs=fs;

const files=[
  'm24-core.js','m24-cases.js','m24-lab.js','m24-primary-lab.js','m24-coinbase.js',
  'm24-meaning.js','m24-derivatives.js','m24-derivatives-lab.js',
  'm24-binance-vision.js','m24-binance-vision-lab.js',
  'm24-macro.js','m24-macro-lab.js','m24-backtest.js','m24-evidence-gate.js','m24-enrichment.js'
];
const source=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
  const check=(condition,message)=>{if(!condition) throw new Error(message)};
  const caseSchema=M24Cases.get('BTC-2021-2022-TOP-MARKDOWN');
  const store=new M24Core.QubusStore();
  const providers={
    price:new M24Coinbase.CoinbaseHistoricalProvider(),
    derivatives:new M24Derivatives.BinanceDerivativesProvider(),
    archive:new M24BinanceVision.BinanceVisionMetricsProvider(),
    macro:new M24Macro.FredCsvProvider()
  };
  const startedAt=new Date().toISOString();
  const result=await M24Enrichment.runCase({store,caseSchema,providers,granularity:86400});
  const evidence=result.evidence;
  const summary={
    type:'M24_REAL_SOURCE_ENRICHMENT_SNAPSHOT',
    caseId:caseSchema.id,
    asset:caseSchema.asset,
    startedAt,
    finishedAt:new Date().toISOString(),
    state:result.state,
    calibrationEligible:result.calibrationEligible,
    resolvedCheckpoints:{
      firstTop:result.backtest.snapshot.price.firstTop.date,
      secondTop:result.backtest.snapshot.price.secondTop.date,
      decisionAsOf:result.backtest.snapshot.asOf,
      supportBreakDate:result.backtest.outcome.supportBreakDate,
      troughDate:result.backtest.outcome.troughDate
    },
    evidenceLayers:Object.fromEntries(Object.entries(evidence.layers).map(([k,v])=>[k,{state:v.state,note:v.note,resolvedGapIds:v.resolvedGapIds||[]}])) ,
    missingLayers:evidence.missingLayers,
    actionCandidate:{action:result.backtest.candidate.action,score:result.backtest.candidate.score,coverage:result.backtest.candidate.coverage,evidence:result.backtest.candidate.evidence,confirmations:result.backtest.candidate.confirmations},
    recordsByType:Object.fromEntries([...new Set(store.records.map(r=>r.type))].sort().map(type=>[type,store.list(type).length])),
    sourceNotes:{
      price:'Coinbase Exchange historical candles',
      funding:'Binance USD-M funding API',
      derivativesArchive:'Binance Vision daily metrics with SHA-256 verification',
      macro:'Official-source series via FRED',
      meaning:'Timestamped source fixture with provenance'
    },
    rule:'This snapshot may increment historical calibration n only when calibrationEligible=true. It remains SIMULATED_ONLY and contains no live-order action.'
  };
  globalThis.__m24fs.writeFileSync('m24-btc-2021-source-snapshot.json',JSON.stringify(summary,null,2));
  check(store.list('LAB_RESULT_PRIMARY').length===1,'primary price record missing');
  check(store.list('MEANING_WORLD_CONTEXT').length===1,'meaning-world record missing');
  check(store.list('DERIVATIVES_CONTEXT').length===1,'funding context missing');
  check(store.list('ARCHIVE_DERIVATIVES_CONTEXT').length===1,'archive derivatives context missing');
  check(store.list('MACRO_CROSS_ASSET_CONTEXT').length===1,'macro context missing');
  check(store.list('DECISION_SNAPSHOT').length===1&&store.list('BACKTEST_OUTCOME').length===1,'no-lookahead split missing');
  check(result.calibrationEligible===true,'real-source BTC 2021 chain is not source-complete: '+evidence.missingLayers.join(','));
  console.log('M24 real-source BTC 2021 E2E OK');
  console.log(JSON.stringify(summary));
})().catch(err=>{
  const failure={type:'M24_REAL_SOURCE_ENRICHMENT_FAILURE',at:new Date().toISOString(),message:String(err?.message||err),stack:String(err?.stack||'')};
  globalThis.__m24fs.writeFileSync('m24-btc-2021-source-snapshot.json',JSON.stringify(failure,null,2));
  console.error(err);
  process.exit(1);
});
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-source-e2e-bundle.js'});
