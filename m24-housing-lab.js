globalThis.M24HousingLab = (() => {
  const round=(n,d=2)=>Number(Number(n).toFixed(d));
  const pct=(a,b)=>a&&b?round(((b/a)-1)*100):null;
  const inWindow=(rows,w)=>rows.filter(x=>x.date>=w.from&&x.date<=w.to);
  const select=(rows,w,mode)=>{
    const xs=inWindow(rows,w); if(!xs.length) throw new Error('No housing records in checkpoint window.');
    if(mode==='MAX_YOY') return xs.reduce((a,b)=>b.yoyPct>a.yoyPct?b:a);
    if(mode==='MAX_INDEX') return xs.reduce((a,b)=>b.priceIndex>a.priceIndex?b:a);
    if(mode==='MIN_INDEX') return xs.reduce((a,b)=>b.priceIndex<a.priceIndex?b:a);
    throw new Error('Unsupported housing selector '+mode);
  };
  function analyze(source,caseSchema){
    const rows=source.rows,w=caseSchema.checkpointWindows;
    const first=select(rows,w.firstTop,w.firstTop.select);
    const second=select(rows,w.secondTop,w.secondTop.select);
    const trough=select(rows,w.markdownOutcome,w.markdownOutcome.select);
    const support=select(rows,w.supportReference,w.supportReference.select);
    const breakRow=rows.find(x=>x.date>second.date&&x.priceIndex<support.priceIndex)||null;
    return {
      caseId:caseSchema.id,asset:caseSchema.asset,resolution:'M',priceBasis:'HOUSE_PRICE_INDEX',
      checkpointRoles:{firstTop:'GROWTH_MOMENTUM_PEAK',secondTop:'PRICE_LEVEL_PEAK'},
      firstTop:{date:first.date,asOf:first.publishedAt,close:first.priceIndex,high:null,volume:first.transactions,rsi14:null,priceBasis:'HOUSE_PRICE_INDEX',yoyPct:first.yoyPct,transactions:first.transactions,transactionYoYPct:first.transactionYoYPct},
      secondTop:{date:second.date,asOf:second.publishedAt,close:second.priceIndex,high:null,volume:second.transactions,rsi14:null,priceBasis:'HOUSE_PRICE_INDEX',yoyPct:second.yoyPct,transactions:second.transactions,transactionYoYPct:second.transactionYoYPct},
      comparisons:{
        priceHighChangePct:null,priceReferenceChangePct:pct(first.priceIndex,second.priceIndex),
        volumeChangePct:pct(first.transactions,second.transactions),rsiChange:null,rsiBearishDivergence:false,
        volumeBearishDivergence:Number.isFinite(first.transactions)&&Number.isFinite(second.transactions)&&second.transactions<first.transactions,
        yoyGrowthChange:round(second.yoyPct-first.yoyPct),transactionYoYAtSecond:second.transactionYoYPct
      },
      support:{referenceDate:support.date,referenceClose:support.priceIndex,referenceLow:null,firstCloseBelow:breakRow?.date||null,firstWeeklyCloseBelow:null,breakClose:breakRow?.priceIndex??null},
      outcome:{troughDate:trough.date,troughClose:trough.priceIndex,troughLow:null,drawdownFromSecondHighPct:null,drawdownFromSecondReferencePct:pct(second.priceIndex,trough.priceIndex)},
      provenance:source.provenance||[],
      note:'Slow-market housing cycle: first checkpoint is peak YoY growth, second checkpoint is peak price level. Publication lag is retained; no daily-market semantics are synthesized.'
    };
  }
  async function runCase({provider,caseSchema}={}){
    const source=await provider.fetchMonthly({from:caseSchema.window.from,to:caseSchema.window.to});
    return {sourceResult:source,result:analyze(source,caseSchema)};
  }
  return {analyze,runCase};
})();