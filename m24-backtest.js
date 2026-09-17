globalThis.M24Backtest = (() => {
  const asTime=value=>new Date(value).getTime();
  const endOfDay=date=>/^\d{4}-\d{2}-\d{2}$/.test(String(date))?`${date}T23:59:59.999Z`:String(date);
  const clone=value=>structuredClone(value);

  function aggregateMeaningSources(sources,asOf){
    const cutoff=asTime(asOf);
    const available=(sources||[]).filter(x=>asTime(x.publishedAt)<=cutoff);
    const frames={};
    available.forEach(x=>(x.frames||[]).forEach(frame=>frames[frame]=(frames[frame]||0)+1));
    const direction=available.length?available.reduce((sum,x)=>sum+Number(x.direction||0),0)/available.length:null;
    return {count:available.length,direction,frames:Object.entries(frames).sort((a,b)=>b[1]-a[1]).map(([frame,count])=>({frame,count})),sourceIds:available.map(x=>x.id)};
  }

  function macroSecondTop(macroContext,cutoffMs){
    return (macroContext?.series||[])
      .filter(x=>x.status==='COMPARABLE'&&x.secondTop?.date&&asTime(endOfDay(x.secondTop.date))<=cutoffMs)
      .map(x=>({key:x.key,seriesId:x.seriesId,secondTop:{date:x.secondTop.date,value:x.secondTop.value,lagDays:x.secondTop.lagDays},delta:x.delta,higherMeaning:x.higherMeaning}));
  }

  function verifiedFundingContext(derivativesContext,cutoffMs){
    if(!derivativesContext?.secondTop?.asOf||!derivativesContext?.firstTop?.asOf) return null;
    if(asTime(derivativesContext.secondTop.asOf)>cutoffMs||asTime(derivativesContext.firstTop.asOf)>cutoffMs) return null;
    if(Number(derivativesContext.firstTop.count||0)<1||Number(derivativesContext.secondTop.count||0)<1) return null;
    return clone({firstTop:derivativesContext.firstTop,secondTop:derivativesContext.secondTop,comparison:derivativesContext.comparison,cutoffPolicy:derivativesContext.cutoffPolicy||null});
  }

  function verifiedArchiveContext(archiveContext,cutoffMs){
    if(!archiveContext?.firstTop||!archiveContext?.secondTop) return null;
    if(archiveContext.firstTop.status!=='OK'||archiveContext.secondTop.status!=='OK') return null;
    if((archiveContext.gaps||[]).length) return null;
    if(!archiveContext.secondTop.date||asTime(endOfDay(archiveContext.secondTop.date))>cutoffMs) return null;
    return {firstTop:clone(archiveContext.firstTop),secondTop:clone(archiveContext.secondTop),deltas:clone(archiveContext.deltas||{})};
  }

  function buildDecisionSnapshot({caseSchema,labResult,meaningContext=null,derivativesContext=null,archiveDerivativesContext=null,macroContext=null,asOf=null}={}){
    if(!caseSchema||!labResult) throw new Error('Backtest requires case schema and measured price Lab result.');
    const cutoff=asOf||endOfDay(labResult.secondTop.date);
    const cutoffMs=asTime(cutoff);
    if(!Number.isFinite(cutoffMs)) throw new Error('Invalid backtest asOf.');
    if(asTime(endOfDay(labResult.secondTop.date))>cutoffMs) throw new Error('Backtest asOf precedes resolved second top.');

    const meaning=meaningContext?aggregateMeaningSources(meaningContext.sources,cutoff):null;
    const funding=verifiedFundingContext(derivativesContext,cutoffMs);
    const archive=verifiedArchiveContext(archiveDerivativesContext,cutoffMs);
    const macro=macroContext?macroSecondTop(macroContext,cutoffMs):null;

    const snapshot={
      type:'DECISION_SNAPSHOT',caseId:caseSchema.id,asset:caseSchema.asset,asOf:cutoff,
      price:{
        firstTop:clone(labResult.firstTop),secondTop:clone(labResult.secondTop),
        comparisons:{
          priceHighChangePct:labResult.comparisons.priceHighChangePct,
          volumeChangePct:labResult.comparisons.volumeChangePct,
          rsiChange:labResult.comparisons.rsiChange,
          rsiBearishDivergence:Boolean(labResult.comparisons.rsiBearishDivergence),
          volumeBearishDivergence:Boolean(labResult.comparisons.volumeBearishDivergence)
        }
      },
      meaning,
      funding,
      archiveDerivatives:archive,
      macro,
      coverage:{price:true,meaning:Boolean(meaning),funding:Boolean(funding),archiveDerivatives:Boolean(archive),macro:Boolean(macro?.length)},
      excludedFutureFields:['support.firstCloseBelow','support.firstWeeklyCloseBelow','outcome.troughDate','outcome.troughLow','outcome.drawdownFromSecondHighPct'],
      rejectedUnverifiableAggregates:{funding:Boolean(derivativesContext)&&!funding,archiveDerivatives:Boolean(archiveDerivativesContext)&&!archive,macro:Boolean(macroContext)&&!macro?.length},
      rule:'Only information provably available by asOf may enter this record. Outcome is evaluated later in a separate record; source-gap archive objects do not count as loaded evidence.'
    };
    return snapshot;
  }

  function scoreCandidate(snapshot){
    let score=0;const evidence=[];const confirmations=[];
    const add=(id,weight,reason)=>{score+=weight;evidence.push({id,weight,reason})};
    if(snapshot.price.comparisons.volumeBearishDivergence) add('WEAK_PARTICIPATION',1,'Second top has lower measured volume than first top.');
    if(snapshot.price.comparisons.rsiBearishDivergence) add('WEAK_RSI',1,'Measured RSI bearish divergence is present.');
    if(snapshot.meaning?.direction>0.25&&snapshot.funding?.comparison?.crowdingShift==='MORE_POSITIVE_AT_SECOND_TOP') add('BULLISH_NARRATIVE_LONG_CROWDING',1,'Positive framing coexists with more-positive funding available by the decision cutoff.');
    const archive=snapshot.archiveDerivatives;
    if(snapshot.meaning?.direction>0.25&&archive?.secondTop?.summary?.globalLongShort>1&&Number(archive?.deltas?.globalLongShort)>0) add('ARCHIVE_LONG_SKEW',1,'Positive framing coexists with increasingly long-skewed archived positioning.');
    if(archive?.secondTop?.summary?.takerLongShortVolume>1&&Number(archive?.deltas?.takerLongShortVolume)>0) confirmations.push({id:'TAKER_BUY_CONFIRMATION',reason:'Taker buy/sell ratio confirms buy-side aggression at the archived checkpoint.'});
    const macro=Object.fromEntries((snapshot.macro||[]).map(x=>[x.key,x]));
    if(Number(macro.DOLLAR?.delta)>0) add('STRONGER_DOLLAR',0.5,'Broad U.S. dollar is stronger versus first-top checkpoint.');
    if(Number(macro.FIN_CONDITIONS?.delta)>0) add('TIGHTER_FINANCIAL_CONDITIONS',0.5,'NFCI is higher/tighter versus first-top checkpoint.');

    const loaded=Object.values(snapshot.coverage).filter(Boolean).length;
    const total=Object.keys(snapshot.coverage).length;
    const coverage=loaded/total;
    const action=coverage<0.6?'INSUFFICIENT_CONTEXT':score>=2?'DOWNSIDE_WATCH':'WAIT';
    return {type:'ACTION_CANDIDATE',asOf:snapshot.asOf,score,coverage,action,evidence,confirmations,rule:'Historical candidate only; not calibrated performance and not a live order signal.'};
  }

  function evaluateOutcome({snapshot,labResult}={}){
    if(!snapshot||!labResult) throw new Error('Outcome evaluation requires snapshot and Lab result.');
    const breakDate=labResult.support?.firstCloseBelow||labResult.support?.firstWeeklyCloseBelow||null;
    return {
      type:'BACKTEST_OUTCOME',caseId:snapshot.caseId,decisionAsOf:snapshot.asOf,
      supportBreakAfterDecision:Boolean(breakDate&&asTime(endOfDay(breakDate))>asTime(snapshot.asOf)),
      supportBreakDate:breakDate,
      troughDate:labResult.outcome?.troughDate||null,
      drawdownFromSecondHighPct:labResult.outcome?.drawdownFromSecondHighPct??null,
      rule:'Outcome is scoring data only and was not available to the decision snapshot.'
    };
  }

  function run(args){
    const snapshot=buildDecisionSnapshot(args);
    const candidate=scoreCandidate(snapshot);
    const outcome=evaluateOutcome({snapshot,labResult:args.labResult});
    return {caseId:snapshot.caseId,snapshot,candidate,outcome};
  }

  return {aggregateMeaningSources,macroSecondTop,verifiedFundingContext,verifiedArchiveContext,buildDecisionSnapshot,scoreCandidate,evaluateOutcome,run};
})();
