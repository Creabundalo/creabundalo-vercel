const fs=require('fs');
const vm=require('vm');
globalThis.__m24fs=fs;
globalThis.__m24verifiedSnapshots=[
  JSON.parse(fs.readFileSync('m24-verified-btc-2021.json','utf8')),
  JSON.parse(fs.readFileSync('m24-verified-eth-2021.json','utf8')),
  JSON.parse(fs.readFileSync('m24-verified-sol-2021.json','utf8'))
];
const source=['m24-core.js','m24-cases.js','m24-coinbase.js','m24-replay.js','m24-calibration.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
  const check=(condition,message)=>{if(!condition)throw new Error(message)};
  const provider=new M24Coinbase.CoinbaseHistoricalProvider();
  const allForecasts=[];const allOutcomes=[];const summaries={};

  for(const snapshot of globalThis.__m24verifiedSnapshots){
    const caseSchema=M24Cases.get(snapshot.caseId);
    const replay=await M24Replay.run({snapshot,caseSchema,priceProvider:provider,granularity:86400,lens:'m24'});
    const store=new M24Core.QubusStore();M24Replay.addToStore(store,replay);
    const calibrations={};

    check(replay.pairs.every(x=>x.forecast.data.conditions.coverageProfile===snapshot.coverageProfile),
      snapshot.asset+' replay forecasts lost coverage profile');

    for(const horizon of Object.keys(M24Replay.HORIZONS)){
      calibrations[horizon]=M24Calibration.calibrate({
        forecasts:store.list('FORECAST_INSTANCE'),outcomes:store.list('OUTCOME_INSTANCE'),
        horizon,lens:'m24',direction:replay.direction,coverageProfile:snapshot.coverageProfile,minSamples:30
      });
      check(calibrations[horizon].sampleSize===1,horizon+' '+snapshot.asset+' should have exactly one verified replay sample');
      check(calibrations[horizon].state==='INSUFFICIENT_SAMPLE',horizon+' '+snapshot.asset+' must not be calibrated at n=1');
      check(calibrations[horizon].displayProbability===null,horizon+' '+snapshot.asset+' must not display a probability at n=1');
    }

    allForecasts.push(...store.list('FORECAST_INSTANCE'));
    allOutcomes.push(...store.list('OUTCOME_INSTANCE'));

    const summary={
      type:'M24_VERIFIED_REPLAY_SNAPSHOT',caseId:snapshot.caseId,asset:snapshot.asset,
      coverageProfile:snapshot.coverageProfile,
      sourceSnapshotDigest:snapshot.verification.artifactDigest,direction:replay.direction,
      decisionDate:replay.decisionDate,decisionClose:replay.decisionClose,
      horizons:Object.fromEntries(replay.pairs.map(({horizon,outcome})=>[horizon,{
        targetDate:outcome.data.targetDate,observedDate:outcome.data.observedDate,
        realizedReturnPct:outcome.data.realizedReturn,directionCorrect:outcome.data.directionCorrect,
        outcomeClose:outcome.data.outcomeClose
      }])),
      calibrations:Object.fromEntries(Object.entries(calibrations).map(([h,c])=>[h,{
        sampleSize:c.sampleSize,state:c.state,displayProbability:c.displayProbability,coverageProfile:c.filter.coverageProfile
      }])),
      rule:'One verified historical case contributes one sample to each replayed horizon inside its own evidence-coverage cohort. n=1 remains INSUFFICIENT_SAMPLE; no probability is displayed.'
    };
    summaries[snapshot.asset]=summary;
    globalThis.__m24fs.writeFileSync('m24-'+snapshot.asset.toLowerCase()+'-2021-replay-snapshot.json',JSON.stringify(summary,null,2));
  }

  const extended=M24Calibration.calibrate({
    forecasts:allForecasts,outcomes:allOutcomes,horizon:'3D',lens:'m24',direction:'DOWN',
    coverageProfile:'EXTENDED_DERIVATIVES',minSamples:30
  });
  const core=M24Calibration.calibrate({
    forecasts:allForecasts,outcomes:allOutcomes,horizon:'3D',lens:'m24',direction:'DOWN',
    coverageProfile:'CORE_DERIVATIVES',minSamples:30
  });
  const research=M24Calibration.calibrate({
    forecasts:allForecasts,outcomes:allOutcomes,horizon:'3D',lens:'m24',direction:'DOWN',minSamples:30
  });
  check(extended.sampleSize===1,'EXTENDED cohort should contain BTC only');
  check(core.sampleSize===2,'CORE cohort should contain ETH and SOL');
  check(research.sampleSize===3,'unprofiled research view should see all three samples');
  check(extended.displayProbability===null&&core.displayProbability===null&&research.displayProbability===null,
    'no cohort may display probability below n=30');

  console.log('M24 verified multi-asset replay E2E OK');
  console.log(JSON.stringify({BTC:summaries.BTC,ETH:summaries.ETH,cohorts:{extendedN:extended.sampleSize,coreN:core.sampleSize,researchN:research.sampleSize}}));
})().catch(err=>{
  globalThis.__m24fs.writeFileSync('m24-replay-failure.json',JSON.stringify({type:'M24_VERIFIED_REPLAY_FAILURE',message:String(err?.message||err),stack:String(err?.stack||'')},null,2));
  console.error(err);process.exit(1);
});
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-replay-e2e-bundle.js'});
