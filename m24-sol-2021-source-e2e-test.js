const fs=require('fs');
const vm=require('vm');
const {webcrypto}=require('crypto');
if(!globalThis.crypto?.subtle) globalThis.crypto=webcrypto;
globalThis.__m24fs=fs;

const files=[
  'm24-core.js','m24-cases.js','m24-lab.js','m24-primary-lab.js','m24-coinbase.js',
  'm24-meaning.js','m24-derivatives.js','m24-derivatives-lab.js',
  'm24-binance-vision.js','m24-funding-archive.js','m24-binance-vision-lab.js',
  'm24-macro.js','m24-macro-lab.js','m24-backtest.js','m24-evidence-gate.js','m24-enrichment.js'
];
const source=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
  const check=(condition,message)=>{if(!condition) throw new Error(message)};
  const caseSchema=M24Cases.get('SOL-2021-2022-TOP-MARKDOWN');
  const store=new M24Core.QubusStore();
  const providers={
    price:new M24Coinbase.CoinbaseHistoricalProvider(),
    derivatives:new M24FundingArchive.BinanceHistoricalDerivativesProvider(),
    archive:new M24BinanceVision.BinanceVisionMetricsProvider(),
    macro:new M24Macro.FredCsvProvider()
  };
  const startedAt=new Date().toISOString();
  const result=await M24Enrichment.runCase({store,caseSchema,providers,granularity:86400});
  const evidence=result.evidence;
  const summary={
    type:'M24_REAL_SOURCE_ENRICHMENT_SNAPSHOT',caseId:caseSchema.id,asset:caseSchema.asset,
    startedAt,finishedAt:new Date().toISOString(),state:result.state,calibrationEligible:result.calibrationEligible,
    coverageProfile:evidence.coverageProfile,
    resolvedCheckpoints:{
      firstTop:result.backtest.snapshot.price.firstTop.date,
      secondTop:result.backtest.snapshot.price.secondTop.date,
      decisionAsOf:result.backtest.snapshot.asOf,
      supportBreakDate:result.backtest.outcome.supportBreakDate,
      troughDate:result.backtest.outcome.troughDate
    },
    meaningScope:result.meaning.sourceScope,
    evidenceLayers:Object.fromEntries(Object.entries(evidence.layers).map(([k,v])=>[k,{state:v.state,extensionState:v.extensionState||null,note:v.note,resolvedGapIds:v.resolvedGapIds||[]}])) ,
    missingLayers:evidence.missingLayers,
    fundingSourceMode:result.derivatives.fundingContext.sourceMode,
    fundingCheckpointCounts:{firstTop:result.derivatives.fundingContext.firstTop.count,secondTop:result.derivatives.fundingContext.secondTop.count},
    fundingSourceGaps:result.derivatives.fundingContext.sourceGaps||[],
    archiveGaps:result.archive.gaps||[],
    archiveCheckpoints:{firstTop:result.archive.firstTop,secondTop:result.archive.secondTop},
    actionCandidate:{action:result.backtest.candidate.action,score:result.backtest.candidate.score,coverage:result.backtest.candidate.coverage,evidence:result.backtest.candidate.evidence,confirmations:result.backtest.candidate.confirmations},
    recordsByType:Object.fromEntries([...new Set(store.records.map(r=>r.type))].sort().map(type=>[type,store.list(type).length])),
    sourceNotes:{price:'Coinbase Exchange historical candles',funding:'Binance Vision monthly fundingRate archives with SHA-256 verification',derivativesArchive:'Binance Vision daily metrics with SHA-256 verification when available',macro:'Official-source series via FRED',meaning:'SOL-scoped timestamped media/protocol sources'},
    rule:'Source completeness is evidence-derived. Missing optional positioning extension data remains explicit; no live-order action exists.'
  };
  globalThis.__m24fs.writeFileSync('m24-sol-2021-source-snapshot.json',JSON.stringify(summary,null,2));
  check(result.meaning.asset==='SOL','meaning context asset mismatch');
  check(result.meaning.sources.every(x=>x.assets.includes('SOL')),'SOL meaning context leaked another asset');
  check(result.meaning.firstTop.count>=2&&result.meaning.secondTop.count>=2,'SOL top meaning coverage incomplete');
  check(store.list('LAB_RESULT_PRIMARY').length===1,'primary price record missing');
  check(store.list('DERIVATIVES_CONTEXT').length===1,'funding context missing');
  check(store.list('ARCHIVE_DERIVATIVES_CONTEXT').length===1,'archive derivatives context missing');
  check(store.list('MACRO_CROSS_ASSET_CONTEXT').length===1,'macro context missing');
  if(result.calibrationEligible!==true){
    throw new Error('real-source SOL 2021 chain incomplete: '+JSON.stringify({missing:evidence.missingLayers,derivatives:evidence.layers.DERIVATIVES,fundingCounts:summary.fundingCheckpointCounts,fundingGaps:summary.fundingSourceGaps,archiveGaps:summary.archiveGaps,checkpoints:summary.resolvedCheckpoints}));
  }
  console.log('M24 real-source SOL 2021 E2E OK');console.log(JSON.stringify(summary));
})().catch(err=>{
  const current=globalThis.__m24fs.existsSync('m24-sol-2021-source-snapshot.json')?JSON.parse(globalThis.__m24fs.readFileSync('m24-sol-2021-source-snapshot.json','utf8')):{};
  globalThis.__m24fs.writeFileSync('m24-sol-2021-source-snapshot.json',JSON.stringify({...current,failure:{at:new Date().toISOString(),message:String(err?.message||err),stack:String(err?.stack||'')}},null,2));
  console.error(err);process.exit(1);
});
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-sol-source-e2e-bundle.js'});
