globalThis.M24Lab = (() => {
  const round=(n,d=2)=>Number(n.toFixed(d));
  const pct=(a,b)=>b===0?null:((a/b)-1)*100;
  const dayMs=86400000;

  function rsiWilder(bars, period=14) {
    const closes=bars.map(x=>Number(x.close));
    const values=Array(closes.length).fill(null);
    if (closes.length<=period) return values;
    let gain=0,loss=0;
    for(let i=1;i<=period;i++){
      const d=closes[i]-closes[i-1];
      gain+=Math.max(d,0);loss+=Math.max(-d,0);
    }
    let avgGain=gain/period,avgLoss=loss/period;
    values[period]=avgLoss===0?100:100-(100/(1+(avgGain/avgLoss)));
    for(let i=period+1;i<closes.length;i++){
      const d=closes[i]-closes[i-1];
      avgGain=((avgGain*(period-1))+Math.max(d,0))/period;
      avgLoss=((avgLoss*(period-1))+Math.max(-d,0))/period;
      values[i]=avgLoss===0?100:100-(100/(1+(avgGain/avgLoss)));
    }
    return values;
  }

  function barsInWindow(bars, spec) {
    if (!spec?.from || !spec?.to) throw new Error('Checkpoint window requires from/to.');
    return bars.map((bar,index)=>({bar,index})).filter(({bar})=>bar.date>=spec.from&&bar.date<=spec.to);
  }

  function selectCheckpoint(bars, spec) {
    const candidates=barsInWindow(bars,spec);
    if(!candidates.length) throw new Error(`No bars inside checkpoint window ${spec.from} → ${spec.to}.`);
    const selectors={
      MAX_HIGH:(a,b)=>b.bar.high>a.bar.high?b:a,
      MIN_LOW:(a,b)=>b.bar.low<a.bar.low?b:a,
      MAX_CLOSE:(a,b)=>b.bar.close>a.bar.close?b:a,
      MIN_CLOSE:(a,b)=>b.bar.close<a.bar.close?b:a,
      FIRST:(a)=>a,
      LAST:(_,b)=>b
    };
    const reducer=selectors[spec.select];
    if(!reducer) throw new Error(`Unsupported checkpoint selector ${spec.select}.`);
    return candidates.reduce(reducer);
  }

  function exactCheckpoint(bars,date) {
    const index=bars.findIndex(x=>x.date===date);
    if(index<0) throw new Error(`Historical checkpoint ${date} is missing from bars.`);
    return {bar:bars[index],index};
  }

  function resolveCheckpoints(caseDef, caseSchema=null) {
    const bars=caseDef.bars||[];
    const windows=caseSchema?.checkpointWindows||caseDef.checkpointWindows||null;
    if(windows){
      return {
        firstTop:selectCheckpoint(bars,windows.firstTop),
        automaticReaction:windows.automaticReaction?selectCheckpoint(bars,windows.automaticReaction):null,
        supportReference:selectCheckpoint(bars,windows.supportReference),
        secondTop:selectCheckpoint(bars,windows.secondTop),
        markdownOutcome:windows.markdownOutcome?selectCheckpoint(bars,windows.markdownOutcome):null,
        mode:'WINDOW_RESOLVED'
      };
    }
    return {
      firstTop:exactCheckpoint(bars,caseDef.firstTopDate),
      automaticReaction:null,
      supportReference:exactCheckpoint(bars,caseDef.supportDate),
      secondTop:exactCheckpoint(bars,caseDef.secondTopDate),
      markdownOutcome:null,
      mode:'EXACT_DATE_LEGACY'
    };
  }

  function resolutionLabel(resolution){
    return ({W:'weekly',D:'daily','4H':'4-hour','1H':'hourly'})[resolution]||String(resolution||'unknown');
  }

  function analyzeTopMarkdown(caseDef, caseSchema=null) {
    caseSchema=caseSchema||globalThis.M24Cases?.get?.(caseDef.id)||null;
    const bars=caseDef.bars||[];
    if(!bars.length) throw new Error('Historical case has no bars.');
    const checkpoints=resolveCheckpoints(caseDef,caseSchema);
    const firstIndex=checkpoints.firstTop.index;
    const secondIndex=checkpoints.secondTop.index;
    const supportIndex=checkpoints.supportReference.index;
    if(secondIndex<=firstIndex) throw new Error('Second-top checkpoint must occur after first top.');

    const rsi=rsiWilder(bars,14);
    const first=bars[firstIndex],second=bars[secondIndex];
    const supportLow=bars[supportIndex].low;
    const breakIndex=bars.findIndex((x,i)=>i>secondIndex && x.close<supportLow);
    const after=bars.slice(secondIndex+1);
    const trough=checkpoints.markdownOutcome?.bar || (after.length?after.reduce((a,b)=>b.low<a.low?b:a):null);
    const firstRsi=rsi[firstIndex],secondRsi=rsi[secondIndex];
    const rsiDivergence=Number.isFinite(firstRsi)&&Number.isFinite(secondRsi)&&second.high>first.high&&secondRsi<firstRsi;
    const volumeDivergence=second.high>first.high&&second.volume<first.volume;
    const resolution=caseDef.resolution||'W';
    const resolutionName=resolutionLabel(resolution);

    return {
      caseId:caseDef.id,
      resolution,
      checkpointMode:checkpoints.mode,
      checkpoints:{
        firstTop:{date:first.date,selector:caseSchema?.checkpointWindows?.firstTop?.select||null},
        automaticReaction:checkpoints.automaticReaction?{date:checkpoints.automaticReaction.bar.date,low:checkpoints.automaticReaction.bar.low}:null,
        supportReference:{date:bars[supportIndex].date,selector:caseSchema?.checkpointWindows?.supportReference?.select||null},
        secondTop:{date:second.date,selector:caseSchema?.checkpointWindows?.secondTop?.select||null},
        markdownOutcome:trough?{date:trough.date,low:trough.low}:null
      },
      firstTop:{date:first.date,high:first.high,close:first.close,volume:first.volume,rsi14:firstRsi==null?null:round(firstRsi)},
      secondTop:{date:second.date,high:second.high,close:second.close,volume:second.volume,rsi14:secondRsi==null?null:round(secondRsi)},
      comparisons:{
        priceHighChangePct:round(pct(second.high,first.high)),
        volumeChangePct:round(pct(second.volume,first.volume)),
        rsiChange:Number.isFinite(firstRsi)&&Number.isFinite(secondRsi)?round(secondRsi-firstRsi):null,
        rsiBearishDivergence:rsiDivergence,
        volumeBearishDivergence:volumeDivergence
      },
      support:{
        referenceDate:bars[supportIndex].date,
        referenceLow:supportLow,
        firstCloseBelow:breakIndex>=0?bars[breakIndex].date:null,
        firstWeeklyCloseBelow:resolution==='W'&&breakIndex>=0?bars[breakIndex].date:null,
        breakClose:breakIndex>=0?bars[breakIndex].close:null
      },
      outcome:{
        troughDate:trough?.date||null,
        troughLow:trough?.low??null,
        drawdownFromSecondHighPct:trough?round(pct(trough.low,second.high)):null
      },
      verdicts:[
        {
          test:'SECOND_TOP',
          status:second.high>first.high?'CONFIRMED':'NOT_CONFIRMED',
          statement:`Tweede ${resolutionName} high ${second.high>first.high?'boven':'niet boven'} eerste ${resolutionName} high.`
        },
        {
          test:'VOLUME_DIVERGENCE',
          status:volumeDivergence?'CONFIRMED':'NOT_CONFIRMED',
          statement:`${resolutionName} volume tweede top ${Math.abs(round(pct(second.volume,first.volume),1))}% ${second.volume<first.volume?'lager':'hoger'} dan bij de eerste top.`
        },
        {
          test:'RSI_DIVERGENCE',
          status:rsiDivergence?'CONFIRMED':'REJECTED_FOR_THIS_SOURCE_RESOLUTION',
          statement:rsiDivergence?`RSI(14) bevestigt bearish divergentie op ${resolutionName} resolutie.`:`RSI(14) bevestigt op ${resolutionName} resolutie géén bearish divergentie; hypothese wordt niet als feit opgeslagen.`
        },
        {
          test:'SUPPORT_BREAK',
          status:breakIndex>=0?'CONFIRMED':'NOT_CONFIRMED',
          statement:breakIndex>=0?`Eerste ${resolutionName} close onder support op ${bars[breakIndex].date}.`:`Geen ${resolutionName} support-break gevonden.`
        }
      ],
      provenance:[caseDef.source||caseDef.provenance?.[0]].filter(Boolean)
    };
  }

  function compareSourceResults(baseline,candidate) {
    if(!baseline||!candidate) throw new Error('Two Lab results are required for source comparison.');
    const daysBetween=(a,b)=>a&&b?Math.round((new Date(b)-new Date(a))/dayMs):null;
    return {
      caseId:baseline.caseId,
      baselineResolution:baseline.resolution,
      candidateResolution:candidate.resolution,
      checkpointDateDeltaDays:{
        firstTop:daysBetween(baseline.firstTop.date,candidate.firstTop.date),
        secondTop:daysBetween(baseline.secondTop.date,candidate.secondTop.date),
        supportBreak:daysBetween(baseline.support.firstCloseBelow,candidate.support.firstCloseBelow)
      },
      metricDelta:{
        priceHighChangePct:round(candidate.comparisons.priceHighChangePct-baseline.comparisons.priceHighChangePct),
        volumeChangePct:round(candidate.comparisons.volumeChangePct-baseline.comparisons.volumeChangePct),
        rsiChange:(baseline.comparisons.rsiChange==null||candidate.comparisons.rsiChange==null)?null:round(candidate.comparisons.rsiChange-baseline.comparisons.rsiChange),
        drawdownPct:round(candidate.outcome.drawdownFromSecondHighPct-baseline.outcome.drawdownFromSecondHighPct)
      },
      agreement:{
        secondTop:baseline.verdicts.find(x=>x.test==='SECOND_TOP')?.status===candidate.verdicts.find(x=>x.test==='SECOND_TOP')?.status,
        volumeDivergence:baseline.comparisons.volumeBearishDivergence===candidate.comparisons.volumeBearishDivergence,
        rsiDivergence:baseline.comparisons.rsiBearishDivergence===candidate.comparisons.rsiBearishDivergence,
        supportBreak:Boolean(baseline.support.firstCloseBelow)===Boolean(candidate.support.firstCloseBelow)
      },
      baselineProvenance:baseline.provenance,
      candidateProvenance:candidate.provenance
    };
  }

  return {rsiWilder,barsInWindow,selectCheckpoint,resolveCheckpoints,analyzeTopMarkdown,compareSourceResults};
})();
