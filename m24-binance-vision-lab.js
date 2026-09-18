globalThis.M24BinanceVisionLab = (() => {
  const metricKeys=Object.freeze(['sumOpenInterest','sumOpenInterestValue','topTraderAccountLongShort','topTraderPositionLongShort','globalLongShort','takerLongShortVolume']);
  const round=(n,d=6)=>n==null?null:Number(Number(n).toFixed(d));

  function compareSummaries(first,second){
    const deltas={};
    metricKeys.forEach(key=>{
      const a=first?.[key],b=second?.[key];
      deltas[key]=Number.isFinite(a)&&Number.isFinite(b)?round(b-a):null;
    });
    return deltas;
  }

  async function runCase({provider,caseSchema,labResult}={}){
    if(!provider||!caseSchema||!labResult) throw new Error('Binance Vision Lab requires provider, case schema and Lab result.');
    const dates=[labResult.firstTop.date,labResult.secondTop.date];
    const observations=await provider.fetchDates(caseSchema.asset,dates);
    const first=observations[0],second=observations[1];
    const gaps=observations.filter(x=>x.status!=='OK').map(x=>({
      type:'SOURCE_GAP',domain:'DERIVATIVES_ARCHIVE',metric:'BINANCE_VISION_METRICS',date:x.date,reason:x.reason||'NO_METRICS_ROWS',url:x.url||null
    }));
    return {
      type:'ARCHIVE_DERIVATIVES_CONTEXT',caseId:caseSchema.id,asset:caseSchema.asset,
      firstTop:{date:first.date,status:first.status,summary:first.summary||null,provenance:first.provenance||[]},
      secondTop:{date:second.date,status:second.status,summary:second.summary||null,provenance:second.provenance||[]},
      deltas:first.status==='OK'&&second.status==='OK'?compareSummaries(first.summary,second.summary):{},
      gaps,
      interpretation:'Archived open-interest and long/short/taker ratios are measured positioning context. They do not identify an actor or prove manipulation.'
    };
  }

  function toRecordPayloads(result){
    const provenance=[...(result.firstTop.provenance||[]),...(result.secondTop.provenance||[])];
    const payloads=[{type:'ARCHIVE_DERIVATIVES_CONTEXT',data:result,evidenceStatus:'MECHANISM_VISIBLE',confidence:result.gaps.length?0.65:0.95,provenance}];
    result.gaps.forEach(gap=>payloads.push({type:'SOURCE_GAP',data:{...gap,caseId:result.caseId,asset:result.asset},evidenceStatus:'MECHANISM_VISIBLE',confidence:1,provenance:[]}));
    return payloads;
  }

  return {metricKeys,compareSummaries,runCase,toRecordPayloads};
})();
