const fs=require('fs'),vm=require('vm');
globalThis.__m24fs=fs;
const files=[
  'm24-core.js','m24-lab.js','m24-primary-lab.js','m24-coinbase.js','m24-episode-generator.js','m24-generated-case.js',
  'm24-binance-vision.js','m24-derivatives.js','m24-funding-archive.js','m24-derivatives-lab.js','m24-binance-vision-lab.js',
  'm24-macro.js','m24-macro-lab.js','m24-meaning.js','m24-backtest.js','m24-evidence-gate.js','m24-enrichment.js'
];
const source=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
  const check=(x,m)=>{if(!x)throw new Error(m)};
  const priceProvider=new M24Coinbase.CoinbaseHistoricalProvider();

  // Selection window/rule is fixed before enrichment/outcome inspection.
  const selectionSource=await priceProvider.getBarsForAsset('ETH',{
    start:'2023-01-01T00:00:00Z',end:'2023-12-31T23:59:59Z',granularity:86400
  });
  const scan=M24EpisodeGenerator.scanFastMarket({asset:'ETH',bars:selectionSource.bars});
  check(scan.candidates.length>=1,'no ETH 2023 generated candidate');
  const candidate=scan.candidates[0];
  const caseSchema=M24GeneratedCase.fromEpisodeCandidate(candidate);
  const integrity=M24GeneratedCase.assertNoOutcomeLeak(caseSchema,candidate);
  check(integrity.valid===true,'generated case outcome leak guard failed');
  check(caseSchema.coverageProfile==='MECHANICS_CORE_DERIVATIVES','generated coverage profile');
  check(caseSchema.requiredLayers.includes('MEANING_WORLD')===false,'generated mechanics profile must not require meaning');

  const store=new M24Core.QubusStore();
  const result=await M24Enrichment.runCase({
    store,caseSchema,granularity:86400,
    providers:{
      price:priceProvider,
      derivatives:new M24FundingArchive.BinanceHistoricalDerivativesProvider(),
      archive:new M24BinanceVision.BinanceVisionMetricsProvider(),
      macro:new M24Macro.FredCsvProvider()
    }
  });

  const directional=['DOWNSIDE_WATCH','UPSIDE_WATCH'].includes(result.backtest.candidate.action);
  const summary={
    type:'M24_GENERATED_MECHANICS_CORE_ENRICHMENT',
    selectorRule:candidate.selectorRule,
    episodeGroup:candidate.episodeGroup,
    candidate:{
      asset:candidate.asset,decisionDate:candidate.decisionDate,firstTopDate:candidate.firstTop.date,
      observed:candidate.observed,outcomeStatus:candidate.outcomeStatus
    },
    caseSchema:{
      id:caseSchema.id,window:caseSchema.window,coverageProfile:caseSchema.coverageProfile,
      horizonProfile:caseSchema.horizonProfile,regimeFamily:caseSchema.regimeFamily,
      requiredLayers:caseSchema.requiredLayers,scoreProfile:caseSchema.scoreProfile
    },
    enrichment:{
      state:result.state,calibrationEligible:result.calibrationEligible,
      evidenceProfile:result.evidence.coverageProfile,missingLayers:result.evidence.missingLayers,
      layerStates:Object.fromEntries(Object.entries(result.evidence.layers).map(([k,v])=>[k,{state:v.state,extensionState:v.extensionState||null,note:v.note}])),
      action:result.backtest.candidate.action,score:result.backtest.candidate.score,
      coverage:result.backtest.candidate.coverage,evidence:result.backtest.candidate.evidence,
      decisionAsOf:result.backtest.snapshot.asOf,
      outcome:result.backtest.outcome
    },
    eligibleDirectionalSample:result.calibrationEligible&&directional,
    meaningAugmentationStatus:'NOT_REQUIRED_FOR_THIS_COHORT',
    calibrationSampleCreated:0,
    rule:'Source completeness plus a directional decision is required before replay can create a mechanics-core calibration sample. This E2E validates enrichment only; it does not silently add a sample.'
  };
  globalThis.__m24fs.writeFileSync('m24-generated-mechanics-core-snapshot.json',JSON.stringify(summary,null,2));

  check(result.evidence.requiredLayers.includes('MEANING_WORLD')===false,'evidence gate reintroduced meaning');
  check(result.evidence.coverageProfile==='MECHANICS_CORE_DERIVATIVES','evidence profile lost');
  check(result.evidence.layers.PRICE.state==='COMPLETE','price incomplete');
  check(result.evidence.layers.DERIVATIVES.state==='COMPLETE','derivatives incomplete');
  check(result.evidence.layers.MACRO.state==='COMPLETE','macro incomplete');
  check(result.evidence.layers.DECISION_SNAPSHOT.state==='COMPLETE','decision snapshot incomplete');
  check(result.evidence.layers.BACKTEST_OUTCOME.state==='COMPLETE','outcome incomplete');
  check(result.calibrationEligible===true,'generated mechanics-core case is not source complete: '+JSON.stringify(result.evidence));
  check(directional===true,'first fixed ETH-2023 candidate did not produce a directional mechanics decision');
  const mechanismIds=result.backtest.candidate.evidence.map(x=>x.id);
  check(mechanismIds.some(id=>[
    'FAILED_RETEST','FAILED_RETEST_WEAK_PARTICIPATION','FAILED_RETEST_WEAK_MOMENTUM',
    'WEAK_PARTICIPATION','WEAK_RSI'
  ].includes(id)),'no price/participation/momentum mechanism scored');

  console.log('M24 real-source generated mechanics-core E2E OK');
  console.log(JSON.stringify(summary));
})().catch(e=>{
  globalThis.__m24fs.writeFileSync('m24-generated-mechanics-core-snapshot.json',JSON.stringify({failure:{message:String(e?.message||e),stack:String(e?.stack||'')}},null,2));
  console.error(e);process.exit(1);
});
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-generated-case-e2e-bundle.js'});
