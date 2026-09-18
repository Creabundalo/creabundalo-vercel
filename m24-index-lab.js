globalThis.M24IndexLab = (() => {
  const round=(n,d=2)=>Number(Number(n).toFixed(d));
  const pct=(a,b)=>b===0?null:((a/b)-1)*100;

  function inWindow(bars,spec){return bars.map((bar,index)=>({bar,index})).filter(({bar})=>bar.date>=spec.from&&bar.date<=spec.to)}
  function select(bars,spec){
    const candidates=inWindow(bars,spec);
    if(!candidates.length) throw new Error(`No close-only bars inside checkpoint window ${spec.from} → ${spec.to}.`);
    const reducers={
      MAX_CLOSE:(a,b)=>b.bar.close>a.bar.close?b:a,
      MIN_CLOSE:(a,b)=>b.bar.close<a.bar.close?b:a,
      FIRST:a=>a,LAST:(_,b)=>b
    };
    const reducer=reducers[spec.select];
    if(!reducer) throw new Error(`Unsupported close-only selector ${spec.select}.`);
    return candidates.reduce(reducer);
  }

  function analyze(caseDef,caseSchema){
    const bars=caseDef.bars||[];
    const w=caseSchema.checkpointWindows;
    const first=select(bars,w.firstTop),reaction=w.automaticReaction?select(bars,w.automaticReaction):null;
    const support=select(bars,w.supportReference),second=select(bars,w.secondTop);
    const outcome=w.markdownOutcome?select(bars,w.markdownOutcome):null;
    if(second.index<=first.index) throw new Error('Second-top checkpoint must occur after first top.');
    const rsi=M24Lab.rsiWilder(bars,14);
    const firstRsi=rsi[first.index],secondRsi=rsi[second.index];
    const breakBar=bars.find((x,i)=>i>second.index&&x.close<support.bar.close)||null;
    const closeChange=round(pct(second.bar.close,first.bar.close));
    const rsiDivergence=Number.isFinite(firstRsi)&&Number.isFinite(secondRsi)&&second.bar.close>first.bar.close&&secondRsi<firstRsi;
    const trough=outcome?.bar||bars.slice(second.index+1).reduce((a,b)=>!a||b.close<a.close?b:a,null);
    return {
      caseId:caseDef.id,asset:caseDef.asset,resolution:caseDef.resolution||'D',checkpointMode:'WINDOW_RESOLVED',priceBasis:'CLOSE_ONLY',
      checkpoints:{
        firstTop:{date:first.bar.date,selector:w.firstTop.select},
        automaticReaction:reaction?{date:reaction.bar.date,close:reaction.bar.close}:null,
        supportReference:{date:support.bar.date,selector:w.supportReference.select},
        secondTop:{date:second.bar.date,selector:w.secondTop.select},
        markdownOutcome:trough?{date:trough.date,close:trough.close}:null
      },
      firstTop:{date:first.bar.date,high:null,close:first.bar.close,volume:null,rsi14:firstRsi==null?null:round(firstRsi),priceBasis:'CLOSE'},
      secondTop:{date:second.bar.date,high:null,close:second.bar.close,volume:null,rsi14:secondRsi==null?null:round(secondRsi),priceBasis:'CLOSE'},
      comparisons:{
        priceHighChangePct:null,priceReferenceChangePct:closeChange,volumeChangePct:null,
        rsiChange:Number.isFinite(firstRsi)&&Number.isFinite(secondRsi)?round(secondRsi-firstRsi):null,
        rsiBearishDivergence:rsiDivergence,volumeBearishDivergence:false,volumeComparisonAvailable:false
      },
      support:{
        referenceDate:support.bar.date,referenceLow:null,referenceClose:support.bar.close,
        firstCloseBelow:breakBar?.date||null,firstWeeklyCloseBelow:null,breakClose:breakBar?.close??null
      },
      outcome:{
        troughDate:trough?.date||null,troughLow:null,troughClose:trough?.close??null,
        drawdownFromSecondHighPct:null,
        drawdownFromSecondReferencePct:trough?round(pct(trough.close,second.bar.close)):null
      },
      verdicts:[
        {test:'SECOND_TOP',status:second.bar.close>first.bar.close?'CONFIRMED':'LOWER_SECOND_PEAK',statement:`Second close peak ${second.bar.close>first.bar.close?'above':'below'} first close peak.`},
        {test:'VOLUME_DIVERGENCE',status:'NOT_AVAILABLE_FOR_SOURCE',statement:'Close-only index source contains no volume; no volume divergence is inferred.'},
        {test:'RSI_DIVERGENCE',status:rsiDivergence?'CONFIRMED':'REJECTED_FOR_THIS_SOURCE_RESOLUTION',statement:rsiDivergence?'RSI(14) confirms bearish divergence on close-only daily data.':'RSI(14) does not confirm bearish divergence on close-only daily data.'},
        {test:'SUPPORT_BREAK',status:breakBar?'CONFIRMED':'NOT_CONFIRMED',statement:breakBar?`First daily close below support on ${breakBar.date}.`:'No support break found.'}
      ],
      provenance:[caseDef.source].filter(Boolean),
      note:'Close-only index analysis. No synthetic high/low/volume values are created.'
    };
  }

  async function runCase({provider,caseSchema}={}){
    if(!provider||!caseSchema) throw new Error('Index Lab requires provider and case schema.');
    const sourceResult=await provider.getBarsForAsset(caseSchema.asset,{start:`${caseSchema.window.from}T00:00:00Z`,end:`${caseSchema.window.to}T23:59:59Z`});
    const caseDef={id:caseSchema.id,asset:caseSchema.asset,resolution:'D',bars:structuredClone(sourceResult.bars),source:structuredClone(sourceResult.provenance?.[0]||null)};
    const result=analyze(caseDef,caseSchema);
    return {sourceResult,caseDef,result};
  }
  return {inWindow,select,analyze,runCase};
})();