const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('m24-calibration.js','utf8');
const test=`
(()=>{
  const check=(condition,message)=>{if(!condition) throw new Error(message)};
  const forecasts=[];const outcomes=[];
  for(let i=0;i<40;i++){
    const id='F-'+i;
    forecasts.push({id,confidence:0.7,data:{horizon:'3D',lens:'m24',direction:'DOWN',conditions:{regime:'RISK_OFF',coverageProfile:'EXTENDED_DERIVATIVES',horizonProfile:'FAST_MARKET'}}});
    outcomes.push({id:'O-'+i,data:{forecastId:id,directionCorrect:i<28}});
  }
  const insufficient=M24Calibration.calibrate({forecasts:forecasts.slice(0,12),outcomes:outcomes.slice(0,12),horizon:'3D',lens:'m24',direction:'DOWN',regime:'RISK_OFF',coverageProfile:'EXTENDED_DERIVATIVES'});
  check(insufficient.state==='INSUFFICIENT_SAMPLE','small sample must remain insufficient');
  check(insufficient.displayProbability===null,'small sample must not expose a probability');
  check(insufficient.sampleSize===12,'small sample count incorrect');

  const calibrated=M24Calibration.calibrate({forecasts,outcomes,horizon:'3D',lens:'m24',direction:'DOWN',regime:'RISK_OFF',coverageProfile:'EXTENDED_DERIVATIVES'});
  check(calibrated.state==='CALIBRATED_REFERENCE','40-sample set should calibrate');
  check(calibrated.sampleSize===40&&calibrated.successes===28,'calibration counts incorrect');
  check(calibrated.historicalHitRate===0.7&&calibrated.displayProbability===0.7,'historical hit rate incorrect');
  check(calibrated.interval95.low<0.7&&calibrated.interval95.high>0.7,'Wilson interval should contain observed hit rate');
  check(calibrated.calibrationGap===0,'raw 0.70 confidence should match observed 0.70 hit rate in fixture');

  const coreForecast={id:'F-core',confidence:0.8,data:{horizon:'3D',lens:'m24',direction:'DOWN',conditions:{regime:'RISK_OFF',coverageProfile:'CORE_DERIVATIVES',horizonProfile:'FAST_MARKET'}}};
  const coreOutcome={id:'O-core',data:{forecastId:'F-core',directionCorrect:true}};
  const mixed=[...forecasts,coreForecast,{id:'F-other',confidence:0.99,data:{horizon:'2W',lens:'m24',direction:'UP',conditions:{regime:'RISK_ON',coverageProfile:'EXTENDED_DERIVATIVES',horizonProfile:'FAST_MARKET'}}}];
  const mixedOut=[...outcomes,coreOutcome,{id:'O-other',data:{forecastId:'F-other',directionCorrect:true}}];
  const filtered=M24Calibration.calibrate({forecasts:mixed,outcomes:mixedOut,horizon:'3D',lens:'m24',direction:'DOWN',regime:'RISK_OFF',coverageProfile:'EXTENDED_DERIVATIVES'});
  check(filtered.sampleSize===40,'coverage profile filter must exclude CORE sample');
  const coreOnly=M24Calibration.calibrate({forecasts:mixed,outcomes:mixedOut,horizon:'3D',lens:'m24',direction:'DOWN',regime:'RISK_OFF',coverageProfile:'CORE_DERIVATIVES'});
  check(coreOnly.sampleSize===1&&coreOnly.state==='INSUFFICIENT_SAMPLE','CORE cohort should stay isolated at n=1');
  const slowForecast={id:'F-slow',confidence:0.6,data:{horizon:'1M',lens:'m24',direction:'DOWN',conditions:{regime:'RISK_OFF',coverageProfile:'HOUSING_PRICE_RATE_MEANING',horizonProfile:'SLOW_MARKET'}}};
  const slowOutcome={id:'O-slow',data:{forecastId:'F-slow',directionCorrect:true}};
  const withSlow=[...mixed,slowForecast],withSlowOut=[...mixedOut,slowOutcome];
  const slowOnly=M24Calibration.calibrate({forecasts:withSlow,outcomes:withSlowOut,horizon:'1M',lens:'m24',direction:'DOWN',horizonProfile:'SLOW_MARKET'});
  check(slowOnly.sampleSize===1,'slow horizon profile sample missing');
  const fastOneMonth=M24Calibration.calibrate({forecasts:withSlow,outcomes:withSlowOut,horizon:'1M',lens:'m24',direction:'DOWN',horizonProfile:'FAST_MARKET'});
  check(fastOneMonth.sampleSize===0,'FAST and SLOW 1M samples must not mix');
  const unprofiled=M24Calibration.calibrate({forecasts:mixed,outcomes:mixedOut,horizon:'3D',lens:'m24',direction:'DOWN',regime:'RISK_OFF'});
  check(unprofiled.sampleSize===41,'unprofiled research view may inspect all samples but must not replace profile-specific calibration');

  const table=M24Calibration.horizonTable({forecasts,outcomes,lens:'m24',coverageProfile:'EXTENDED_DERIVATIVES'});
  check(table.length===5,'default horizon table incomplete');
  check(table.find(x=>x.filter.horizon==='3D').state==='CALIBRATED_REFERENCE','3D cohort should calibrate');
  check(table.find(x=>x.filter.horizon==='2W').state==='INSUFFICIENT_SAMPLE','empty horizon must remain insufficient');
  console.log('M24 calibration test OK',JSON.stringify({extendedN:calibrated.sampleSize,coreN:coreOnly.sampleSize,hitRate:calibrated.historicalHitRate}));
})();
`;
try{vm.runInThisContext(`${source}\n${test}`,{filename:'m24-calibration-test-bundle.js'})}catch(err){console.error(err);process.exit(1)}
