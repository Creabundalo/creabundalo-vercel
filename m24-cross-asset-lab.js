globalThis.M24CrossAssetLab = (() => {
  const round=(n,d=2)=>Number(Number(n).toFixed(d));
  const pct=(a,b)=>a&&b?round(((b/a)-1)*100):null;
  const inWindow=(bars,w)=>bars.filter(x=>x.date>=w.from&&x.date<=w.to);
  function select(bars,w){
    const xs=inWindow(bars,w);
    if(!xs.length) throw new Error(`No market bars in cross-asset checkpoint window ${w.from} → ${w.to}.`);
    if(w.select==='MAX_CLOSE') return xs.reduce((a,b)=>b.close>a.close?b:a);
    if(w.select==='MIN_CLOSE') return xs.reduce((a,b)=>b.close<a.close?b:a);
    throw new Error('Unsupported cross-asset selector '+w.select);
  }
  function analyze(caseDef,caseSchema){
    const bars=caseDef.bars||[],w=caseSchema.checkpointWindows;
    const baseline=select(bars,w.firstTop);
    const stress=select(bars,w.secondTop);
    const support=select(bars,w.supportReference);
    const outcome=select(bars,w.markdownOutcome);
    const stressIndex=bars.findIndex(x=>x.date===stress.date);
    const breakBar=bars.find((x,i)=>i>stressIndex&&x.close<support.close)||null;
    return {
      caseId:caseSchema.id,asset:caseSchema.asset,resolution:'D',priceBasis:'CLOSE_ONLY',
      checkpointRoles:{firstTop:'PRE_SHOCK_BASELINE',secondTop:'SYSTEM_STRESS_CHECKPOINT'},
      firstTop:{date:baseline.date,asOf:baseline.date+'T23:59:59.999Z',close:baseline.close,high:null,volume:null,rsi14:null,priceBasis:'CLOSE'},
      secondTop:{date:stress.date,asOf:stress.date+'T23:59:59.999Z',close:stress.close,high:null,volume:null,rsi14:null,priceBasis:'CLOSE'},
      comparisons:{
        priceHighChangePct:null,priceReferenceChangePct:pct(baseline.close,stress.close),
        volumeChangePct:null,rsiChange:null,rsiBearishDivergence:false,volumeBearishDivergence:false
      },
      support:{referenceDate:support.date,referenceClose:support.close,referenceLow:null,firstCloseBelow:breakBar?.date||null,firstWeeklyCloseBelow:null,breakClose:breakBar?.close??null},
      outcome:{troughDate:outcome.date,troughClose:outcome.close,troughLow:null,drawdownFromSecondHighPct:null,drawdownFromSecondReferencePct:pct(stress.close,outcome.close)},
      provenance:caseDef.source?[caseDef.source]:[],
      note:'Cross-asset stress case: first checkpoint is a pre-shock baseline; second checkpoint is a system-stress observation. No double-top semantics are implied.'
    };
  }
  async function runCase({provider,caseSchema}={}){
    const sourceResult=await provider.getBarsForAsset(caseSchema.asset,{start:caseSchema.window.from+'T00:00:00Z',end:caseSchema.window.to+'T23:59:59Z'});
    const caseDef={id:caseSchema.id,asset:caseSchema.asset,resolution:'D',bars:structuredClone(sourceResult.bars),source:structuredClone(sourceResult.provenance?.[0]||null)};
    return {sourceResult,caseDef,result:analyze(caseDef,caseSchema)};
  }
  return {analyze,runCase};
})();