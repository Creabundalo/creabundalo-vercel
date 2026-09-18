const fs=require('fs'),vm=require('vm');
globalThis.__m24fs=fs;
const files=[
  'm24-core.js','m24-lab.js','m24-primary-lab.js','m24-coinbase.js',
  'm24-episode-generator.js','m24-episode-universe.js','m24-generated-case.js','m24-generated-batch.js',
  'm24-binance-vision.js','m24-derivatives.js','m24-funding-archive.js','m24-derivatives-lab.js','m24-binance-vision-lab.js',
  'm24-macro.js','m24-macro-lab.js','m24-meaning.js','m24-backtest.js','m24-evidence-gate.js','m24-enrichment.js'
];
const source=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
  const check=(x,m)=>{if(!x)throw new Error(m)};
  const priceProvider=new M24Coinbase.CoinbaseHistoricalProvider();
  const fundingProvider=new M24FundingArchive.BinanceHistoricalDerivativesProvider();
  const archiveProvider=new M24BinanceVision.BinanceVisionMetricsProvider();
  const macroProvider=new M24Macro.FredCsvProvider();

  const window=M24EpisodeUniverse.assetWindow('ETH','FAST_DISTRIBUTION_V1');
  const history=await priceProvider.getBarsForAsset('ETH',{
    start:window.from+'T00:00:00Z',end:window.to+'T23:59:59Z',granularity:86400
  });
  const scan=M24EpisodeUniverse.scanCanonical({asset:'ETH',bars:history.bars,universeId:'FAST_DISTRIBUTION_V1'});
  const processed=new Set(['ETH:DISTRIBUTION_MARKDOWN:2020-07-22']);
  const queue=scan.candidates.filter(x=>!processed.has(x.episodeGroup));

  const batch=await M24GeneratedBatch.run({
    candidates:queue,maxCases:3,
    enrichOne:async candidate=>{
      check(M24EpisodeUniverse.verifyCandidate(candidate).eligible===true,'noncanonical candidate entered batch');
      const caseSchema=M24GeneratedCase.fromEpisodeCandidate(candidate);
      const store=new M24Core.QubusStore();
      const enrichment=await M24Enrichment.runCase({
        store,caseSchema,granularity:86400,
        providers:{price:priceProvider,derivatives:fundingProvider,archive:archiveProvider,macro:macroProvider}
      });
      enrichment.generatedCaseSchema={
        id:caseSchema.id,asset:caseSchema.asset,episodeGroup:caseSchema.episodeGroup,
        selectionEligible:caseSchema.selectionEligible,selectionUniverseId:caseSchema.selectionUniverseId,
        selectionWindow:caseSchema.selectionWindow,coverageProfile:caseSchema.coverageProfile,
        horizonProfile:caseSchema.horizonProfile,regimeFamily:caseSchema.regimeFamily,
        generatorRule:caseSchema.generatorRule
      };
      return enrichment;
    }
  });

  const compact={
    type:'M24_GENERATED_CALIBRATION_BATCH_CHECKPOINT',
    batchId:'M99-B019-T05-BATCH-002',
    universeId:'FAST_DISTRIBUTION_V1',
    attempted:batch.attempted,
    sourceComplete:batch.sourceComplete,
    directionalSourceComplete:batch.directionalSourceComplete,
    waitSourceComplete:batch.waitSourceComplete,
    incomplete:batch.incomplete,
    sourceErrors:batch.sourceErrors,
    results:batch.results.map(x=>({
      candidateKey:x.candidateKey,asset:x.asset,decisionDate:x.decisionDate,episodeGroup:x.episodeGroup,
      status:x.status,calibrationEligible:x.calibrationEligible,action:x.action,coverageProfile:x.coverageProfile,
      missingLayers:x.missingLayers,error:x.error||null,
      caseSchema:x.enrichment?.generatedCaseSchema||null,
      decision:x.enrichment?{
        asOf:x.enrichment.backtest.snapshot.asOf,
        score:x.enrichment.backtest.candidate.score,
        coverage:x.enrichment.backtest.candidate.coverage,
        evidence:x.enrichment.backtest.candidate.evidence
      }:null,
      outcome:x.enrichment?.backtest?.outcome||null,
      layerStates:x.enrichment?Object.fromEntries(Object.entries(x.enrichment.evidence.layers||{}).map(([k,v])=>[k,{state:v.state,extensionState:v.extensionState||null,note:v.note}])):null
    })),
    calibrationSamplesCreated:0,
    rule:'Batch enriches the next three canonical candidates in deterministic decision-date order. It does not retune thresholds, skip bad outcomes or increment calibration n until each directional source-complete result is separately pinned and replayed.'
  };
  globalThis.__m24fs.writeFileSync('m24-generated-batch-002-snapshot.json',JSON.stringify(compact,null,2));

  check(batch.attempted===3,'batch must attempt exactly three canonical candidates');
  check(batch.results.every(x=>x.episodeGroup!=='ETH:DISTRIBUTION_MARKDOWN:2020-07-22'),'already processed episode repeated');
  check(batch.results.every(x=>x.enrichment?.generatedCaseSchema?.selectionEligible===true||x.status==='SOURCE_ERROR'),'selection eligibility lost');

  console.log('M24 generated calibration batch 002 OK');
  console.log(JSON.stringify(compact));
})().catch(e=>{globalThis.__m24fs.writeFileSync('m24-generated-batch-002-snapshot.json',JSON.stringify({failure:{message:String(e?.message||e),stack:String(e?.stack||'')}},null,2));console.error(e);process.exit(1)});
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-generated-batch-e2e-bundle.js'});
