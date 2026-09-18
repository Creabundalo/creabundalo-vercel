globalThis.M24CftcLab = (() => {
  async function runCase({provider,caseSchema,labResult}={}){
    if(!provider||!caseSchema||!labResult) throw new Error('CFTC Lab requires provider, caseSchema and labResult.');
    const history=await provider.fetchHistory({
      asset:caseSchema.asset,
      start:`${caseSchema.window.from}T00:00:00Z`,
      end:`${caseSchema.window.to}T23:59:59Z`
    });
    const context=M24Cftc.analyzeAtCheckpoints(history.records,caseSchema,labResult);
    context.provenance=history.provenance||[];
    return {caseId:caseSchema.id,asset:caseSchema.asset,context,evidenceStatus:'MECHANISM_VISIBLE',intentStatus:'INTENT_UNKNOWN'};
  }
  function toRecordPayloads(result){
    const payloads=[{type:'DERIVATIVES_CONTEXT',data:result.context,evidenceStatus:'MECHANISM_VISIBLE',confidence:0.9,provenance:result.context.provenance||[]}];
    (result.context.sourceGaps||[]).forEach(gap=>payloads.push({type:'SOURCE_GAP',data:{...gap,caseId:result.caseId,asset:result.asset},evidenceStatus:'MECHANISM_VISIBLE',confidence:1,provenance:[]}));
    return payloads;
  }
  return {runCase,toRecordPayloads};
})();