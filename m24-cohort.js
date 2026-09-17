globalThis.M24Cohort = (() => {
  const clone=value=>structuredClone(value);

  function summarizeCase(caseSchema,run=null,error=null){
    if(error){
      return {
        caseId:caseSchema.id,asset:caseSchema.asset,status:'SOURCE_ERROR',analysis:caseSchema.analysis,
        calibrationEligible:false,missingLayers:clone(caseSchema.requiredLayers||[]),error:String(error.message||error)
      };
    }
    const result=run.result;
    const required=clone(caseSchema.requiredLayers||[]);
    return {
      caseId:caseSchema.id,asset:caseSchema.asset,status:'MEASURED_PRICE_LAYER',analysis:caseSchema.analysis,
      resolution:result.resolution,
      firstTop:clone(result.firstTop),secondTop:clone(result.secondTop),support:clone(result.support),outcome:clone(result.outcome),comparisons:clone(result.comparisons),
      provenance:clone(result.provenance||[]),
      calibrationEligible:caseSchema.calibrationEligible===true,
      missingLayers:caseSchema.calibrationEligible===true?[]:required.filter(x=>x!=='PRICE'),
      rule:caseSchema.calibrationEligible===true?'Eligible only because the case schema explicitly says all required layers are source-complete.':'Price measurement alone is not a calibration sample.'
    };
  }

  async function run({provider,caseSchemas=null,granularity=86400,onProgress=null}={}){
    if(!provider) throw new Error('Cohort runner requires a historical provider.');
    const schemas=caseSchemas||M24Cases.list({status:'EXECUTABLE_PRIMARY'});
    const cases=[];
    for(let i=0;i<schemas.length;i++){
      const caseSchema=schemas[i];
      try{
        const measured=await M24PrimaryLab.runCase({provider,caseSchema,granularity});
        cases.push({...summarizeCase(caseSchema,measured,null),labResult:clone(measured.result)});
      }catch(error){
        cases.push(summarizeCase(caseSchema,null,error));
      }
      if(typeof onProgress==='function') onProgress({index:i+1,total:schemas.length,caseId:caseSchema.id,result:clone(cases.at(-1))});
    }
    const measured=cases.filter(x=>x.status==='MEASURED_PRICE_LAYER').length;
    const eligible=cases.filter(x=>x.calibrationEligible===true&&x.status==='MEASURED_PRICE_LAYER').length;
    return {
      type:'CASE_COHORT_RESULT',granularity,total:cases.length,measured,sourceErrors:cases.length-measured,calibrationEligible:eligible,cases,
      rule:'A measured price episode is not automatically a forecast-calibration sample. Required source layers and no-lookahead decision/outcome records must be complete first.'
    };
  }

  function toRecordPayload(result){
    return {type:'CASE_COHORT_RESULT',data:result,evidenceStatus:'MECHANISM_VISIBLE',confidence:1,provenance:[]};
  }

  return {summarizeCase,run,toRecordPayload};
})();
