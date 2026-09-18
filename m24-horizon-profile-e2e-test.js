const fs=require('fs'),vm=require('vm');
globalThis.__m24fs=fs;
globalThis.__m24snapshots={
  housing:JSON.parse(fs.readFileSync('m24-verified-nl-housing-2015-2023.json','utf8')),
  shock:JSON.parse(fs.readFileSync('m24-verified-global-mar2020.json','utf8')),
  btc:JSON.parse(fs.readFileSync('m24-verified-btc-2021.json','utf8'))
};
const source=['m24-core.js','m24-cases.js','m24-fred-market.js','m24-cbs-housing.js','m24-replay.js','m24-calibration.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const housingSchema=M24Cases.get(globalThis.__m24snapshots.housing.caseId);
 const shockSchema=M24Cases.get(globalThis.__m24snapshots.shock.caseId);
 const btcSchema=M24Cases.get(globalThis.__m24snapshots.btc.caseId);
 check(M24Replay.profileForCase(btcSchema).name==='FAST_MARKET','BTC fast profile');
 check(M24Replay.profileForCase(shockSchema).name==='SHOCK','shock profile');
 check(M24Replay.profileForCase(housingSchema).name==='SLOW_MARKET','housing slow profile');

 const housing=await M24Replay.run({
   snapshot:globalThis.__m24snapshots.housing,caseSchema:housingSchema,
   priceProvider:new M24CbsHousing.Provider(),lens:'m24'
 });
 const shock=await M24Replay.run({
   snapshot:globalThis.__m24snapshots.shock,caseSchema:shockSchema,
   priceProvider:new M24FredMarket.FredMarketProvider(),lens:'m24'
 });

 check(housing.horizonClock==='PUBLICATION_CALENDAR','housing publication clock');
 check(housing.decisionAvailableAt==='2022-08-22','housing decision availability');
 check(housing.pairs.map(x=>x.horizon).join(',')==='1M,3M,6M,12M','housing horizons');
 check(shock.horizonClock==='MARKET_DAILY_FIXED_DAYS','shock market clock');
 check(shock.pairs.map(x=>x.horizon).join(',')==='1D,3D,1W,2W,1M','shock horizons');

 const allForecasts=[],allOutcomes=[];
 for(const replay of [housing,shock]){
   const store=new M24Core.QubusStore();M24Replay.addToStore(store,replay);
   allForecasts.push(...store.list('FORECAST_INSTANCE'));
   allOutcomes.push(...store.list('OUTCOME_INSTANCE'));
 }
 for(const pair of housing.pairs){
   check(pair.forecast.data.conditions.horizonProfile==='SLOW_MARKET','housing profile lost');
 }
 for(const pair of shock.pairs){
   check(pair.forecast.data.conditions.horizonProfile==='SHOCK','shock profile lost');
 }

 const housingCal=M24Calibration.calibrate({
   forecasts:allForecasts,outcomes:allOutcomes,horizon:'1M',lens:'m24',direction:'DOWN',
   coverageProfile:'HOUSING_PRICE_RATE_MEANING',horizonProfile:'SLOW_MARKET',minSamples:30
 });
 const shockCal=M24Calibration.calibrate({
   forecasts:allForecasts,outcomes:allOutcomes,horizon:'1D',lens:'m24',direction:'DOWN',
   coverageProfile:'CROSS_ASSET_LIQUIDITY',horizonProfile:'SHOCK',minSamples:30
 });
 check(housingCal.sampleSize===1&&shockCal.sampleSize===1,'profile-specific calibration n');
 check(housingCal.displayProbability===null&&shockCal.displayProbability===null,'no probability under n=30');

 const summary={
   type:'M24_HORIZON_PROFILE_VALIDATION',
   housing:{
     profile:housing.horizonProfile,clock:housing.horizonClock,
     decisionObservationDate:housing.decisionObservationDate,decisionAvailableAt:housing.decisionAvailableAt,
     horizons:Object.fromEntries(housing.pairs.map(x=>[x.horizon,{
       targetDate:x.outcome.data.targetDate,observedDate:x.outcome.data.observedDate,availableAt:x.outcome.data.availableAt,
       realizedReturnPct:x.outcome.data.realizedReturn,directionCorrect:x.outcome.data.directionCorrect
     }]))
   },
   shock:{
     profile:shock.horizonProfile,clock:shock.horizonClock,
     horizons:Object.fromEntries(shock.pairs.map(x=>[x.horizon,{
       targetDate:x.outcome.data.targetDate,observedDate:x.outcome.data.observedDate,
       realizedReturnPct:x.outcome.data.realizedReturn,directionCorrect:x.outcome.data.directionCorrect
     }]))
   },
   negativeRule:'Outcome correctness is retained per horizon exactly as measured; a source-complete directional candidate may be right at some horizons and wrong at others.',
   calibrationRule:'Horizon profile is part of cohort identity. FAST_MARKET, SHOCK and SLOW_MARKET samples may not be silently pooled.'
 };
 globalThis.__m24fs.writeFileSync('m24-horizon-profile-validation-snapshot.json',JSON.stringify(summary,null,2));
 console.log('M24 real-source horizon profile validation OK');
 console.log(JSON.stringify(summary));
})().catch(e=>{globalThis.__m24fs.writeFileSync('m24-horizon-profile-validation-snapshot.json',JSON.stringify({failure:{message:String(e?.message||e),stack:String(e?.stack||'')}},null,2));console.error(e);process.exit(1)});
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-horizon-profile-e2e-bundle.js'});
