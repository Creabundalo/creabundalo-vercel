globalThis.M24GeneratedBatch = (() => {
  function candidateKey(c){return [c.asset,c.selectorRule,c.decisionDate].join('|')}

  async function run({candidates=[],maxCases=3,enrichOne,onProgress=null}={}){
    if(typeof enrichOne!=='function') throw new Error('Generated batch requires enrichOne.');
    const ordered=[...candidates].sort((a,b)=>a.decisionDate.localeCompare(b.decisionDate)||a.asset.localeCompare(b.asset));
    const selected=ordered.slice(0,Math.max(0,Number(maxCases)||0));
    const results=[];
    for(let i=0;i<selected.length;i++){
      const candidate=selected[i];
      let item;
      try{
        const enrichment=await enrichOne(candidate);
        item={
          candidateKey:candidateKey(candidate),
          asset:candidate.asset,decisionDate:candidate.decisionDate,episodeGroup:candidate.episodeGroup,
          status:enrichment?.calibrationEligible===true?'SOURCE_COMPLETE':'INCOMPLETE',
          calibrationEligible:enrichment?.calibrationEligible===true,
          action:enrichment?.backtest?.candidate?.action||null,
          coverageProfile:enrichment?.evidence?.coverageProfile||null,
          missingLayers:structuredClone(enrichment?.evidence?.missingLayers||[]),
          enrichment
        };
      }catch(error){
        item={
          candidateKey:candidateKey(candidate),
          asset:candidate.asset,decisionDate:candidate.decisionDate,episodeGroup:candidate.episodeGroup,
          status:'SOURCE_ERROR',calibrationEligible:false,action:null,coverageProfile:null,
          missingLayers:[],error:String(error?.message||error)
        };
      }
      results.push(item);
      if(typeof onProgress==='function') onProgress({index:i+1,total:selected.length,result:structuredClone(item)});
    }
    return {
      type:'GENERATED_ENRICHMENT_BATCH',
      requestedMaxCases:maxCases,
      inputCandidates:candidates.length,
      attempted:selected.length,
      sourceComplete:results.filter(x=>x.status==='SOURCE_COMPLETE').length,
      directionalSourceComplete:results.filter(x=>x.status==='SOURCE_COMPLETE'&&['DOWNSIDE_WATCH','UPSIDE_WATCH'].includes(x.action)).length,
      waitSourceComplete:results.filter(x=>x.status==='SOURCE_COMPLETE'&&x.action==='WAIT').length,
      incomplete:results.filter(x=>x.status==='INCOMPLETE').length,
      sourceErrors:results.filter(x=>x.status==='SOURCE_ERROR').length,
      results,
      rule:'Batch order is deterministic by decisionDate then asset. Source errors and WAIT cases remain visible and do not become calibration samples.'
    };
  }

  return {candidateKey,run};
})();