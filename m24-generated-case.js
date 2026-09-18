globalThis.M24GeneratedCase = (() => {
  const DAY_MS=86400000;
  const isoShift=(date,days)=>new Date(new Date(`${date}T00:00:00Z`).getTime()+days*DAY_MS).toISOString().slice(0,10);

  function fromEpisodeCandidate(candidate,{preFirstDays=30,outcomeDays=90}={}){
    if(!candidate?.asset||!candidate?.decisionDate||!candidate?.firstTop?.date||!candidate?.episodeGroup) throw new Error('Generated case requires a complete episode candidate.');
    if(candidate.outcomeStatus!=='UNREAD_AT_SELECTION') throw new Error('Generated calibration case requires unread outcome at selection.');
    const firstDate=candidate.firstTop.date;
    const decisionDate=candidate.decisionDate;
    if(firstDate>=decisionDate) throw new Error('Generated case first top must precede decision checkpoint.');
    const reactionFrom=isoShift(firstDate,1);
    const reactionTo=isoShift(decisionDate,-1);
    if(reactionFrom>reactionTo) throw new Error('Generated case has no reaction/support interval.');

    return Object.freeze({
      id:`GEN-${candidate.asset}-${candidate.selectorRule}-${decisionDate}`,
      asset:candidate.asset,
      generated:true,
      generatorRule:candidate.selectorRule,
      episodeGroup:candidate.episodeGroup,
      selectionEligible:candidate.selectionEligible===true,
      selectionUniverseId:candidate.selectionUniverseId||null,
      selectionWindow:candidate.selectionWindow?structuredClone(candidate.selectionWindow):null,
      analysis:'TOP_MARKDOWN',
      providerFamily:'COINBASE_EXCHANGE',
      status:'GENERATED_CANDIDATE',
      calibrationEligible:false,
      horizonProfile:'FAST_MARKET',
      regimeFamily:'DISTRIBUTION_MARKDOWN',
      coverageProfile:'MECHANICS_CORE_DERIVATIVES',
      scoreProfile:'MECHANICS_CORE',
      requiredLayers:['PRICE','DERIVATIVES','MACRO','DECISION_SNAPSHOT','BACKTEST_OUTCOME'],
      rules:Object.freeze({
        supportBreak:'FIRST_CLOSE_BELOW_SUPPORT_LOW_AFTER_SECOND_TOP',
        momentum:'WILDER_RSI_14',
        participation:'COMPARE_VOLUME_AT_RESOLVED_TOP_BARS'
      }),
      window:{from:isoShift(firstDate,-preFirstDays),to:isoShift(decisionDate,outcomeDays)},
      checkpointWindows:{
        firstTop:{from:firstDate,to:firstDate,select:'MAX_HIGH'},
        automaticReaction:{from:reactionFrom,to:reactionTo,select:'MIN_LOW'},
        supportReference:{from:reactionFrom,to:reactionTo,select:'MIN_LOW'},
        secondTop:{from:decisionDate,to:decisionDate,select:'MAX_HIGH'},
        markdownOutcome:{from:isoShift(decisionDate,1),to:isoShift(decisionDate,outcomeDays),select:'MIN_LOW'}
      },
      selectionEvidence:{
        observed:structuredClone(candidate.observed||{}),
        firstTop:structuredClone(candidate.firstTop),
        checkpoint:structuredClone(candidate.checkpoint),
        decisionDate,
        outcomeStatus:candidate.outcomeStatus
      },
      note:'Generated mechanics-core calibration candidate. Meaning-world evidence is deliberately not required in this coverage profile; it remains a separate augmentation layer. Outcome window is fixed by rule before outcome inspection.'
    });
  }

  function assertNoOutcomeLeak(caseSchema,candidate,{outcomeDays=90}={}){
    const expectedEnd=isoShift(candidate.decisionDate,outcomeDays);
    return {
      type:'GENERATED_CASE_INTEGRITY',
      caseId:caseSchema.id,
      decisionDate:candidate.decisionDate,
      outcomeWindowStart:caseSchema.checkpointWindows.markdownOutcome.from,
      outcomeWindowEnd:caseSchema.checkpointWindows.markdownOutcome.to,
      expectedOutcomeWindowEnd:expectedEnd,
      selectionOutcomeStatus:candidate.outcomeStatus,
      valid:caseSchema.checkpointWindows.markdownOutcome.from===isoShift(candidate.decisionDate,1)&&
        caseSchema.checkpointWindows.markdownOutcome.to===expectedEnd&&
        candidate.outcomeStatus==='UNREAD_AT_SELECTION',
      rule:'Outcome window is deterministic from decisionDate and generator version; outcome values never participate in candidate selection.'
    };
  }

  return {isoShift,fromEpisodeCandidate,assertNoOutcomeLeak};
})();