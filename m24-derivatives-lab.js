globalThis.M24DerivativesLab = (() => {
  const caseId='BTC-2021-2022-TOP-MARKDOWN';

  function checkpointBoundCase(caseSchema,labResult){
    if(!labResult?.firstTop?.date||!labResult?.secondTop?.date) throw new Error('Derivatives Lab requires resolved firstTop and secondTop dates to prevent lookahead.');
    const bounded=structuredClone(caseSchema);
    bounded.checkpointWindows.firstTop.to=labResult.firstTop.date;
    bounded.checkpointWindows.secondTop.to=labResult.secondTop.date;
    return bounded;
  }

  async function runCase({provider,caseSchema,labResult}={}){
    if(!provider) throw new Error('Derivatives Lab requires a provider.');
    if(!caseSchema) throw new Error('Derivatives Lab requires a case schema.');
    const boundedCase=checkpointBoundCase(caseSchema,labResult);
    const funding=await provider.fetchFundingHistory({asset:caseSchema.asset,start:`${caseSchema.window.from}T00:00:00Z`,end:`${caseSchema.window.to}T23:59:59Z`});
    const fundingContext=M24Derivatives.analyzeFundingAroundCase(funding.records,boundedCase);
    fundingContext.firstTop.asOf=`${labResult.firstTop.date}T23:59:59.999Z`;
    fundingContext.secondTop.asOf=`${labResult.secondTop.date}T23:59:59.999Z`;
    fundingContext.cutoffPolicy='RESOLVED_CHECKPOINT_DATE';
    fundingContext.sourceMode=funding.sourceMode||'BINANCE_USDM_FUNDING_API';
    fundingContext.sourceGaps=structuredClone(funding.gaps||[]);

    let openInterestGap=null;
    try{
      await provider.fetchOpenInterestRecent({asset:caseSchema.asset,start:`${caseSchema.window.from}T00:00:00Z`,end:`${caseSchema.window.to}T23:59:59Z`,period:'1d'});
    }catch(err){
      if(err?.code!=='HISTORY_WINDOW_EXCEEDED') throw err;
      openInterestGap={
        type:'SOURCE_GAP',
        source:'BINANCE_USDM_OPEN_INTEREST_API',
        domain:'DERIVATIVES',
        metric:'OPEN_INTEREST',
        caseId:caseSchema.id,
        asset:caseSchema.asset,
        requestedWindow:structuredClone(caseSchema.window),
        reason:err.code,
        retentionDays:err.detail?.retentionDays??null,
        recommendedSource:err.detail?.recommendedSource||'BINANCE_VISION_METRICS',
        archiveExample:err.detail?.archiveExample||null,
        interpretation:'Historical open-interest absence in the recent-history API is a source limitation, not a zero market value.'
      };
    }

    return {
      caseId:caseSchema.id,
      asset:caseSchema.asset,
      fundingContext:{...fundingContext,provenance:funding.provenance||[]},
      openInterestGap,
      evidenceStatus:'MECHANISM_VISIBLE',
      intentStatus:'INTENT_UNKNOWN',
      note:'Derivatives context is bounded by resolved checkpoint dates. It can support or contradict a market-structure hypothesis; it does not identify a manipulating actor.'
    };
  }

  function toRecordPayloads(result){
    const payloads=[{
      type:'DERIVATIVES_CONTEXT',
      data:result.fundingContext,
      evidenceStatus:'MECHANISM_VISIBLE',
      confidence:result.fundingContext.firstTop.count&&result.fundingContext.secondTop.count?0.9:0.4,
      provenance:result.fundingContext.provenance||[]
    }];
    if(result.openInterestGap) payloads.push({type:'SOURCE_GAP',data:result.openInterestGap,evidenceStatus:'MECHANISM_VISIBLE',confidence:1,provenance:[]});
    return payloads;
  }

  return {caseId,checkpointBoundCase,runCase,toRecordPayloads};
})();
