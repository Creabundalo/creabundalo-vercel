const fs=require('fs'),vm=require('vm');
globalThis.__m24fs=fs;
globalThis.__m24CanonicalGeneratedSnapshot=JSON.parse(fs.readFileSync('m24-verified-generated-eth-2020-07-22.json','utf8'));
const source=['m24-core.js','m24-coinbase.js','m24-replay.js','m24-calibration.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
  const check=(x,m)=>{if(!x)throw new Error(m)};
  const snapshot=globalThis.__m24CanonicalGeneratedSnapshot;
  check(snapshot.selectionEligible===true,'canonical selection eligibility required');
  const caseSchema={id:snapshot.caseId,asset:snapshot.asset,horizonProfile:snapshot.horizonProfile,regimeFamily:snapshot.regimeFamily};
  const replay=await M24Replay.run({snapshot,caseSchema,priceProvider:new M24Coinbase.CoinbaseHistoricalProvider(),granularity:86400,lens:'m24'});
  check(replay.pairs.length===4,'canonical generated replay horizons');
  const store=new M24Core.QubusStore();M24Replay.addToStore(store,replay);
  const calibration={};
  for(const h of Object.keys(M24Replay.HORIZONS)){
    calibration[h]=M24Calibration.calibrate({
      forecasts:store.list('FORECAST_INSTANCE'),outcomes:store.list('OUTCOME_INSTANCE'),
      horizon:h,lens:'m24',direction:'DOWN',
      coverageProfile:'MECHANICS_CORE_DERIVATIVES',horizonProfile:'FAST_MARKET',regime:'DISTRIBUTION_MARKDOWN',minSamples:30
    });
    check(calibration[h].sampleSize===1,h+' canonical mechanics n');
    check(calibration[h].displayProbability===null,h+' probability must remain hidden');
  }
  const summary={
    type:'M24_CANONICAL_GENERATED_MECHANICS_REPLAY',
    caseId:snapshot.caseId,episodeGroup:snapshot.episodeGroup,selectionUniverseId:snapshot.selectionUniverseId,
    horizons:Object.fromEntries(replay.pairs.map(x=>[x.horizon,{
      targetDate:x.outcome.data.targetDate,observedDate:x.outcome.data.observedDate,
      realizedReturnPct:x.outcome.data.realizedReturn,directionCorrect:x.outcome.data.directionCorrect,
      outcomeClose:x.outcome.data.outcomeClose
    }])),
    calibration:Object.fromEntries(Object.entries(calibration).map(([h,x])=>[h,{sampleSize:x.sampleSize,state:x.state,displayProbability:x.displayProbability}])),
    rule:'Canonical generated episode contributes one compatible sample per FAST_MARKET horizon. Correct and incorrect horizons are retained exactly; probability remains null below n=30.'
  };
  globalThis.__m24fs.writeFileSync('m24-canonical-generated-replay-snapshot.json',JSON.stringify(summary,null,2));
  console.log('M24 canonical generated mechanics replay E2E OK');
  console.log(JSON.stringify(summary));
})().catch(e=>{globalThis.__m24fs.writeFileSync('m24-canonical-generated-replay-snapshot.json',JSON.stringify({failure:{message:String(e?.message||e),stack:String(e?.stack||'')}},null,2));console.error(e);process.exit(1)});
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-canonical-generated-replay-e2e-bundle.js'});
