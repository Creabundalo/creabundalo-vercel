globalThis.M24Calibration = (() => {
  const DEFAULT_MIN_SAMPLES=30;
  const Z95=1.959963984540054;
  const round=(n,d=4)=>Number(Number(n).toFixed(d));

  function joinForecastOutcomes(forecasts=[],outcomes=[]){
    const outcomeByForecast=new Map();
    outcomes.forEach(o=>{
      const forecastId=o?.data?.forecastId||o?.forecastId;
      if(forecastId) outcomeByForecast.set(forecastId,o);
    });
    return forecasts.map(f=>({forecast:f,outcome:outcomeByForecast.get(f.id)||null})).filter(x=>x.outcome);
  }

  function wilson95(successes,n){
    if(!n) return {low:null,high:null};
    const p=successes/n,z2=Z95*Z95,den=1+z2/n;
    const center=(p+z2/(2*n))/den;
    const margin=(Z95*Math.sqrt((p*(1-p)/n)+(z2/(4*n*n))))/den;
    return {low:round(Math.max(0,center-margin)),high:round(Math.min(1,center+margin))};
  }

  function sampleMatches(pair,{horizon=null,lens=null,direction=null,regime=null,coverageProfile=null}={}){
    const f=pair.forecast;
    if(horizon&&f?.data?.horizon!==horizon) return false;
    if(lens&&f?.data?.lens!==lens) return false;
    if(direction&&f?.data?.direction!==direction) return false;
    if(regime&&f?.data?.conditions?.regime!==regime) return false;
    if(coverageProfile&&f?.data?.conditions?.coverageProfile!==coverageProfile) return false;
    return typeof pair.outcome?.data?.directionCorrect==='boolean';
  }

  function calibrate({forecasts=[],outcomes=[],horizon=null,lens=null,direction=null,regime=null,coverageProfile=null,minSamples=DEFAULT_MIN_SAMPLES}={}){
    const pairs=joinForecastOutcomes(forecasts,outcomes).filter(pair=>sampleMatches(pair,{horizon,lens,direction,regime,coverageProfile}));
    const n=pairs.length;
    const successes=pairs.filter(x=>x.outcome.data.directionCorrect===true).length;
    const meanRawConfidence=n?pairs.reduce((sum,x)=>sum+(Number.isFinite(x.forecast.confidence)?x.forecast.confidence:0),0)/n:null;
    const enough=n>=minSamples;
    const historicalHitRate=enough?successes/n:null;
    const interval=enough?wilson95(successes,n):{low:null,high:null};
    return {
      type:'CALIBRATION_RESULT',
      filter:{horizon,lens,direction,regime,coverageProfile},
      sampleSize:n,
      successes,
      minSamples,
      state:enough?'CALIBRATED_REFERENCE':'INSUFFICIENT_SAMPLE',
      historicalHitRate:historicalHitRate==null?null:round(historicalHitRate),
      interval95:interval,
      meanRawConfidence:meanRawConfidence==null?null:round(meanRawConfidence),
      calibrationGap:enough&&meanRawConfidence!=null?round(historicalHitRate-meanRawConfidence):null,
      displayProbability:enough?round(historicalHitRate):null,
      rule:enough?'Historical reference only; non-stationary markets can change. Evidence coverage profiles are separate cohorts.':'Do not display a probability before the minimum sample threshold is met. Evidence coverage profiles may not be silently mixed.'
    };
  }

  function horizonTable({forecasts=[],outcomes=[],lens='m24',coverageProfile=null,minSamples=DEFAULT_MIN_SAMPLES,horizons=['NOW','3D','2W','1M','2M']}={}){
    return horizons.map(horizon=>calibrate({forecasts,outcomes,horizon,lens,coverageProfile,minSamples}));
  }

  function toRecordPayload(result){
    return {type:'CALIBRATION_RESULT',data:result,evidenceStatus:'MECHANISM_VISIBLE',confidence:result.state==='CALIBRATED_REFERENCE'?0.8:1,provenance:[]};
  }

  return {DEFAULT_MIN_SAMPLES,joinForecastOutcomes,wilson95,sampleMatches,calibrate,horizonTable,toRecordPayload};
})();
