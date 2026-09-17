globalThis.M24MacroLab = (() => {
  const DEFAULT_KEYS=Object.freeze(['FED_FUNDS','TEN_YEAR','DOLLAR','RRP','FED_ASSETS','FIN_CONDITIONS','WTI']);

  async function runCase({provider,caseSchema,labResult,keys=DEFAULT_KEYS}={}){
    if(!provider||!caseSchema||!labResult) throw new Error('Macro Lab requires provider, case schema and resolved Lab result.');
    const bundle=await provider.fetchBundle(keys,{start:`${caseSchema.window.from}T00:00:00Z`,end:`${caseSchema.window.to}T23:59:59Z`});
    const context=M24Macro.analyzeBundleAtCheckpoints(bundle,labResult);
    return {caseId:caseSchema.id,asset:caseSchema.asset,context,bundle};
  }

  function toRecordPayloads(result){
    const payloads=[{
      type:'MACRO_CROSS_ASSET_CONTEXT',
      data:result.context,
      evidenceStatus:'MECHANISM_VISIBLE',
      confidence:result.context.series.length?0.9:0.3,
      provenance:result.context.series.flatMap(x=>x.provenance||[])
    }];
    result.context.gaps.forEach(gap=>payloads.push({
      type:'SOURCE_GAP',data:{...gap,caseId:result.caseId,asset:result.asset,domain:'MACRO_CROSS_ASSET'},evidenceStatus:'MECHANISM_VISIBLE',confidence:1,provenance:[]
    }));
    return payloads;
  }

  return {DEFAULT_KEYS,runCase,toRecordPayloads};
})();
