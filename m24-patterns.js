globalThis.M24Patterns = (() => {
  const round=(n,d=4)=>Number(Number(n).toFixed(d));
  const finite=x=>x!==null&&x!==undefined&&String(x).trim()!==''&&Number.isFinite(Number(x));
  const valueOf=p=>{
    for(const k of ['high','low','close','priceIndex','value','troughLow','troughClose']) if(finite(p?.[k])) return Number(p[k]);
    return null;
  };

  function fibGeometry({firstTop,reaction,secondTop,trough,tolerance=0.05}={}){
    const a=valueOf(firstTop),b=valueOf(reaction),c=valueOf(secondTop),d=valueOf(trough);
    if(![a,b,c,d].every(finite)||a===b) return {family:'FIBONACCI',status:'INSUFFICIENT'};
    const base=Math.abs(a-b);
    const retracement=round(Math.abs(c-b)/base);
    const markdownExtension=round(Math.abs(c-d)/base);
    const refs=[0.382,0.5,0.618,0.786,1,1.272,1.618,2,2.618];
    const nearest=x=>refs.map(r=>({level:r,error:round(Math.abs(x-r))})).sort((x,y)=>x.error-y.error)[0];
    const secondNearest=nearest(retracement),markdownNearest=nearest(markdownExtension);
    return {
      family:'FIBONACCI',status:'MEASURED_GEOMETRY',
      baseSwing:{from:a,to:b,size:round(base)},
      secondLegRatio:retracement,secondLegNearest:secondNearest,secondLegReferenceMatch:secondNearest.error<=tolerance,
      markdownExtensionRatio:markdownExtension,markdownNearest,markdownReferenceMatch:markdownNearest.error<=tolerance,
      tolerance,
      causalStatus:'NOT_ESTABLISHED',
      rule:'Ratios are descriptive geometry. A reference match is defined only by the explicit tolerance and does not establish predictive power or causality.'
    };
  }

  function rsiDivergence(lab){
    const a=lab?.firstTop,b=lab?.secondTop;
    if(!finite(a?.rsi14)||!finite(b?.rsi14)) return {family:'RSI_DIVERGENCE',status:'INSUFFICIENT'};
    const pa=valueOf(a),pb=valueOf(b);
    const bearish=finite(pa)&&finite(pb)&&pb>=pa&&Number(b.rsi14)<Number(a.rsi14);
    const bullish=finite(pa)&&finite(pb)&&pb<=pa&&Number(b.rsi14)>Number(a.rsi14);
    return {
      family:'RSI_DIVERGENCE',status:(bearish||bullish)?'OBSERVED':'NOT_OBSERVED',
      direction:bearish?'BEARISH':bullish?'BULLISH':'NONE',
      firstRsi:round(a.rsi14),secondRsi:round(b.rsi14),priceFirst:pa,priceSecond:pb,
      causalStatus:'NOT_ESTABLISHED'
    };
  }

  function structuralDistribution(lab){
    const first=valueOf(lab?.firstTop),second=valueOf(lab?.secondTop);
    const support=lab?.support?.referenceLow??lab?.support?.referenceClose;
    const breakDate=lab?.support?.firstCloseBelow||lab?.support?.firstWeeklyCloseBelow||null;
    if(!finite(first)||!finite(second)||!finite(support)) return {family:'WYCKOFF_STRUCTURE',status:'INSUFFICIENT'};
    return {
      family:'WYCKOFF_STRUCTURE',
      status:breakDate?'OBSERVED':'NOT_OBSERVED',
      subtype:'DISTRIBUTION_CANDIDATE',
      firstTop:first,secondTop:second,support:Number(support),supportBreakDate:breakDate,
      relativeSecondTop:round((second/first)-1),
      causalStatus:'NOT_ESTABLISHED',
      rule:'A top→reaction/support→retest→break sequence is a structural analogue only; it is not proof of Wyckoff operator intent.'
    };
  }

  function swings(points,{thresholdPct=5}={}){
    const xs=(points||[]).filter(x=>x?.date&&finite(x.value)).sort((a,b)=>a.date.localeCompare(b.date));
    if(xs.length<3) return [];
    const out=[xs[0]];
    let anchor=xs[0],direction=0,extreme=xs[0];
    for(let i=1;i<xs.length;i++){
      const p=xs[i],move=((p.value-anchor.value)/anchor.value)*100;
      if(direction===0&&Math.abs(move)>=thresholdPct){direction=Math.sign(move);extreme=p;continue}
      if(direction>0){
        if(p.value>extreme.value) extreme=p;
        const rev=((p.value-extreme.value)/extreme.value)*100;
        if(rev<=-thresholdPct){out.push(extreme);anchor=extreme;direction=-1;extreme=p}
      }else if(direction<0){
        if(p.value<extreme.value) extreme=p;
        const rev=((p.value-extreme.value)/extreme.value)*100;
        if(rev>=thresholdPct){out.push(extreme);anchor=extreme;direction=1;extreme=p}
      }
    }
    if(out.at(-1)?.date!==extreme.date) out.push(extreme);
    return out;
  }

  function elliottCandidate(points,{thresholdPct=5}={}){
    const pivots=swings(points,{thresholdPct});
    if(pivots.length<6) return {family:'ELLIOTT_SWING_CANDIDATE',status:'INSUFFICIENT',pivotCount:pivots.length,pivots};
    const dirs=[];
    for(let i=1;i<pivots.length;i++) dirs.push(Math.sign(pivots[i].value-pivots[i-1].value));
    const alternating=dirs.every((x,i)=>i===0||x!==dirs[i-1]);
    return {
      family:'ELLIOTT_SWING_CANDIDATE',status:alternating?'CANDIDATE_ONLY':'NOT_OBSERVED',
      pivotCount:pivots.length,pivots:pivots.slice(-8),alternating,
      waveValidation:'NOT_PERFORMED',
      causalStatus:'NOT_ESTABLISHED',
      rule:'Alternating pivots are partly produced by the swing-extraction method itself. This is not Elliott validation; wave numbering, constraints and predictive interpretation require separate null/control testing.'
    };
  }

  function analyzeLab({caseId,asset,labResult,reaction=null,trough=null}={}){
    const reactionPoint=reaction||labResult?.checkpoints?.automaticReaction||labResult?.automaticReaction||null;
    const troughPoint=trough||labResult?.outcome||null;
    return {
      type:'PATTERN_HYPOTHESIS_SET',caseId,asset,
      patterns:[
        rsiDivergence(labResult),
        structuralDistribution(labResult),
        fibGeometry({firstTop:labResult?.firstTop,reaction:reactionPoint,secondTop:labResult?.secondTop,trough:troughPoint})
      ],
      causalStatus:'NOT_ESTABLISHED'
    };
  }

  return {valueOf,fibGeometry,rsiDivergence,structuralDistribution,swings,elliottCandidate,analyzeLab};
})();