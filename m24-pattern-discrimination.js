globalThis.M24PatternDiscrimination = (() => {
  const pct=(a,b)=>b?Number(((a/b)*100).toFixed(1)):null;
  function signal(patterns,family){
    if(family==='RSI_BEARISH_DIVERGENCE') return patterns?.rsi?.status==='OBSERVED'&&patterns?.rsi?.direction==='BEARISH';
    if(family==='WYCKOFF_STRUCTURE') return patterns?.structure?.status==='OBSERVED';
    if(family==='FIBONACCI_REFERENCE_MATCH') return patterns?.fib?.secondLegReferenceMatch===true||patterns?.fib?.markdownReferenceMatch===true;
    if(family==='ELLIOTT_CANDIDATE') return patterns?.elliott?.status==='CANDIDATE_ONLY';
    return false;
  }

  function compare({matrix,actions,minSamples=30}={}){
    const families=['RSI_BEARISH_DIVERGENCE','WYCKOFF_STRUCTURE','FIBONACCI_REFERENCE_MATCH','ELLIOTT_CANDIDATE'];
    const cases=Object.entries(matrix?.cases||{}).map(([caseId,v])=>({caseId,patterns:v.patterns,action:actions?.[caseId]||null}));
    const usable=cases.filter(x=>['DOWNSIDE_WATCH','WAIT'].includes(x.action));
    const results={};
    for(const family of families){
      const down=usable.filter(x=>x.action==='DOWNSIDE_WATCH');
      const wait=usable.filter(x=>x.action==='WAIT');
      const downSignals=down.filter(x=>signal(x.patterns,family));
      const waitSignals=wait.filter(x=>signal(x.patterns,family));
      results[family]={
        directional:{signals:downSignals.length,total:down.length,hitRatePct:pct(downSignals.length,down.length),caseIds:downSignals.map(x=>x.caseId)},
        waitControls:{signals:waitSignals.length,total:wait.length,hitRatePct:pct(waitSignals.length,wait.length),caseIds:waitSignals.map(x=>x.caseId)},
        observedHitRateDifferencePct:(down.length&&wait.length)?Number((pct(downSignals.length,down.length)-pct(waitSignals.length,wait.length)).toFixed(1)):null,
        state:(down.length>=minSamples&&wait.length>=minSamples)?'SAMPLE_READY':'INSUFFICIENT_SAMPLE',
        predictiveProbability:null,
        note:family==='ELLIOTT_CANDIDATE'?'Swing alternation is candidate-only and partly induced by the swing extraction method; no predictive interpretation is allowed.':'Observed discrimination only; no probability is displayed below the minimum sample gate.'
      };
    }
    return {
      type:'PATTERN_DISCRIMINATION_RESULT',
      sample:{directional:usable.filter(x=>x.action==='DOWNSIDE_WATCH').length,waitControls:usable.filter(x=>x.action==='WAIT').length,minSamples},
      results,
      rule:'This is descriptive control comparison, not calibrated predictive performance. Source-complete WAIT cases act as negative controls; all probabilities remain null below the minimum sample threshold.'
    };
  }
  return {signal,compare};
})();