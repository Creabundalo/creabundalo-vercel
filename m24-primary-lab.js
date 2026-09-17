globalThis.M24PrimaryLab = (() => {
  function buildCaseFromBars({caseSchema,sourceResult,resolution='D'}) {
    if(!caseSchema) throw new Error('caseSchema is required.');
    if(!sourceResult?.bars?.length) throw new Error('Primary source returned no bars.');
    return {
      id:caseSchema.id,
      asset:caseSchema.asset,
      resolution,
      bars:structuredClone(sourceResult.bars),
      source:structuredClone(sourceResult.provenance?.[0]||null)
    };
  }

  async function runCase({provider,caseSchema,granularity=86400}={}) {
    if(!provider) throw new Error('Primary Lab requires a historical provider.');
    if(!caseSchema) throw new Error('Primary Lab requires a case schema.');
    if(caseSchema.analysis!=='TOP_MARKDOWN') throw new Error(`Unsupported primary Lab analysis ${caseSchema.analysis}.`);
    const sourceResult=await provider.getBarsForAsset(caseSchema.asset,{
      start:`${caseSchema.window.from}T00:00:00Z`,
      end:`${caseSchema.window.to}T23:59:59Z`,
      granularity
    });
    const resolution=granularity===86400?'D':String(granularity);
    const caseDef=buildCaseFromBars({caseSchema,sourceResult,resolution});
    const result=M24Lab.analyzeTopMarkdown(caseDef,caseSchema);
    return {sourceResult,caseDef,result};
  }

  async function runBtcCase(args={}) { return runCase(args); }

  function compare({baseline,primary}) {
    return M24Lab.compareSourceResults(baseline,primary);
  }

  return {buildCaseFromBars,runCase,runBtcCase,compare};
})();
