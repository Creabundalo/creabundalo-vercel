const fs=require('fs'),vm=require('vm');
globalThis.__m24fs=fs;
globalThis.__m24GeneratedSnapshot=JSON.parse(fs.readFileSync('m24-verified-generated-eth-2023-02-16.json','utf8'));
const source=['m24-core.js','m24-coinbase.js','m24-replay.js','m24-calibration.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
  const check=(x,m)=>{if(!x)throw new Error(m)};
  const snapshot=globalThis.__m24GeneratedSnapshot;
  const caseSchema={
    id:snapshot.caseId,asset:snapshot.asset,
    horizonProfile:snapshot.horizonProfile,
    regimeFamily:snapshot.regimeFamily
  };
  const replay=await M24Replay.run({
    snapshot,caseSchema,
    priceProvider:new M24Coinbase.CoinbaseHistoricalProvider(),
    granularity:86400,lens:'m24'
  });
  check(replay.pairs.length===4,'generated fast-market replay must have four horizons');
  check(replay.direction==='DOWN','generated direction');
  check(replay.pairs.every(x=>x.forecast.data.conditions.coverageProfile==='MECHANICS_CORE_DERIVATIVES'),'generated coverage lost');
  check(replay.pairs.every(x=>x.forecast.data.conditions.horizonProfile==='FAST_MARKET'),'generated horizon profile lost');
  check(replay.pairs.every(x=>x.forecast.data.conditions.regime==='DISTRIBUTION_MARKDOWN'),'generated regime lost');

  const store=new M24Core.QubusStore();
  M24Replay.addToStore(store,replay);
  const calibration={};
  for(const h of Object.keys(M24Replay.HORIZONS)){
    calibration[h]=M24Calibration.calibrate({
      forecasts:store.list('FORECAST_INSTANCE'),outcomes:store.list('OUTCOME_INSTANCE'),
      horizon:h,lens:'m24',direction:'DOWN',
      coverageProfile:'MECHANICS_CORE_DERIVATIVES',
      horizonProfile:'FAST_MARKET',
      regime:'DISTRIBUTION_MARKDOWN',
      minSamples:30
    });
    check(calibration[h].sampleSize===1,h+' generated cohort n');
    check(calibration[h].state==='INSUFFICIENT_SAMPLE',h+' generated cohort threshold');
    check(calibration[h].displayProbability===null,h+' must hide probability');
  }

  const summary={
    type:'M24_GENERATED_MECHANICS_CORE_REPLAY',
    caseId:snapshot.caseId,episodeGroup:snapshot.episodeGroup,
    coverageProfile:snapshot.coverageProfile,horizonProfile:snapshot.horizonProfile,regimeFamily:snapshot.regimeFamily,
    decisionDate:replay.decisionDate,decisionClose:replay.decisionClose,
    horizons:Object.fromEntries(replay.pairs.map(({horizon,outcome})=>[horizon,{
      targetDate:outcome.data.targetDate,observedDate:outcome.data.observedDate,
      realizedReturnPct:outcome.data.realizedReturn,directionCorrect:outcome.data.directionCorrect,
      outcomeClose:outcome.data.outcomeClose
    }])),
    calibration:Object.fromEntries(Object.entries(calibration).map(([h,x])=>[h,{sampleSize:x.sampleSize,state:x.state,displayProbability:x.displayProbability}])),
    rule:'First generated mechanics-core episode contributes one sample per FAST_MARKET horizon only inside its exact compatible cohort. Probability remains null at n=1.'
  };
  globalThis.__m24fs.writeFileSync('m24-generated-mechanics-core-replay-snapshot.json',JSON.stringify(summary,null,2));
  console.log('M24 generated mechanics-core replay E2E OK');
  console.log(JSON.stringify(summary));
})().catch(e=>{globalThis.__m24fs.writeFileSync('m24-generated-mechanics-core-replay-snapshot.json',JSON.stringify({failure:{message:String(e?.message||e),stack:String(e?.stack||'')}},null,2));console.error(e);process.exit(1)});
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-generated-replay-e2e-bundle.js'});
