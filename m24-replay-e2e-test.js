const fs=require('fs');
const vm=require('vm');
globalThis.__m24fs=fs;
const verified=JSON.parse(fs.readFileSync('m24-verified-btc-2021.json','utf8'));
globalThis.__m24verified=verified;
const source=['m24-core.js','m24-cases.js','m24-coinbase.js','m24-replay.js','m24-calibration.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
  const check=(condition,message)=>{if(!condition)throw new Error(message)};
  const snapshot=globalThis.__m24verified;
  const caseSchema=M24Cases.get(snapshot.caseId);
  const provider=new M24Coinbase.CoinbaseHistoricalProvider();
  const replay=await M24Replay.run({snapshot,caseSchema,priceProvider:provider,granularity:86400,lens:'m24'});
  const store=new M24Core.QubusStore();M24Replay.addToStore(store,replay);
  const calibrations={};
  for(const horizon of Object.keys(M24Replay.HORIZONS)){
    calibrations[horizon]=M24Calibration.calibrate({
      forecasts:store.list('FORECAST_INSTANCE'),outcomes:store.list('OUTCOME_INSTANCE'),
      horizon,lens:'m24',direction:replay.direction,minSamples:30
    });
    check(calibrations[horizon].sampleSize===1,horizon+' should have exactly one verified replay sample');
    check(calibrations[horizon].state==='INSUFFICIENT_SAMPLE',horizon+' must not be calibrated at n=1');
    check(calibrations[horizon].displayProbability===null,horizon+' must not display a probability at n=1');
  }
  const summary={
    type:'M24_VERIFIED_REPLAY_SNAPSHOT',caseId:snapshot.caseId,asset:snapshot.asset,
    sourceSnapshotDigest:snapshot.verification.artifactDigest,direction:replay.direction,
    decisionDate:replay.decisionDate,decisionClose:replay.decisionClose,
    horizons:Object.fromEntries(replay.pairs.map(({horizon,outcome})=>[horizon,{
      targetDate:outcome.data.targetDate,observedDate:outcome.data.observedDate,
      realizedReturnPct:outcome.data.realizedReturn,directionCorrect:outcome.data.directionCorrect,
      outcomeClose:outcome.data.outcomeClose
    }])),
    calibrations:Object.fromEntries(Object.entries(calibrations).map(([h,c])=>[h,{sampleSize:c.sampleSize,state:c.state,displayProbability:c.displayProbability}])),
    rule:'One verified historical case contributes one sample to each replayed horizon. n=1 remains INSUFFICIENT_SAMPLE; no probability is displayed.'
  };
  globalThis.__m24fs.writeFileSync('m24-btc-2021-replay-snapshot.json',JSON.stringify(summary,null,2));
  console.log('M24 verified replay E2E OK');console.log(JSON.stringify(summary));
})().catch(err=>{
  globalThis.__m24fs.writeFileSync('m24-btc-2021-replay-snapshot.json',JSON.stringify({type:'M24_VERIFIED_REPLAY_FAILURE',message:String(err?.message||err),stack:String(err?.stack||'')},null,2));
  console.error(err);process.exit(1);
});
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-replay-e2e-bundle.js'});
