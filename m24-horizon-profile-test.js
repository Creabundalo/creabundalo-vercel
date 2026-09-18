const fs=require('fs'),vm=require('vm');
const source=['m24-core.js','m24-replay.js','m24-calibration.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const fast=M24Replay.profileForCase({horizonProfile:'FAST_MARKET'});
 const shock=M24Replay.profileForCase({horizonProfile:'SHOCK'});
 const slow=M24Replay.profileForCase({horizonProfile:'SLOW_MARKET'});
 check(fast.clock==='MARKET_DAILY_FIXED_DAYS','fast clock');
 check(Object.keys(fast.horizons).join(',')==='3D,2W,1M,2M','fast horizons');
 check(Object.keys(shock.horizons).join(',')==='1D,3D,1W,2W,1M','shock horizons');
 check(slow.clock==='PUBLICATION_CALENDAR','slow clock');
 check(Object.keys(slow.horizons).join(',')==='1M,3M,6M,12M','slow horizons');
 check(M24Replay.targetDate('2022-08-22',slow.horizons['12M'])==='2023-08-22','month calendar target');
 const fakeForecast={id:'F',type:'FORECAST_INSTANCE',data:{horizon:'1M',lens:'m24',direction:'DOWN',conditions:{coverageProfile:'HOUSING',horizonProfile:'SLOW_MARKET'}},confidence:null};
 const fakeOutcome={id:'O',type:'OUTCOME_INSTANCE',data:{forecastId:'F',directionCorrect:true}};
 const ok=M24Calibration.calibrate({forecasts:[fakeForecast],outcomes:[fakeOutcome],horizon:'1M',lens:'m24',direction:'DOWN',coverageProfile:'HOUSING',horizonProfile:'SLOW_MARKET',minSamples:30});
 const wrong=M24Calibration.calibrate({forecasts:[fakeForecast],outcomes:[fakeOutcome],horizon:'1M',lens:'m24',direction:'DOWN',coverageProfile:'HOUSING',horizonProfile:'FAST_MARKET',minSamples:30});
 check(ok.sampleSize===1&&wrong.sampleSize===0,'horizon-profile cohort isolation');
 check(ok.displayProbability===null,'n=1 must not display probability');
 console.log('M24 horizon profile contract OK');
})();
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-horizon-profile-test-bundle.js'});
