globalThis.M24Replay = (() => {
  const HORIZONS=Object.freeze({'3D':3,'2W':14,'1M':30,'2M':60});
  const DAY_MS=86400000;
  const round=(n,d=4)=>Number(Number(n).toFixed(d));

  function directionFromAction(action){
    if(action==='DOWNSIDE_WATCH') return 'DOWN';
    if(action==='UPSIDE_WATCH') return 'UP';
    return null;
  }

  function addDays(isoDate,days){
    const t=new Date(`${isoDate}T00:00:00Z`).getTime();
    return new Date(t+(days*DAY_MS)).toISOString().slice(0,10);
  }

  function firstBarOnOrAfter(bars,date){
    return (bars||[]).filter(b=>b.date>=date).sort((a,b)=>a.date.localeCompare(b.date))[0]||null;
  }

  function validateSnapshot(snapshot,caseSchema){
    if(!snapshot||snapshot.type!=='VERIFIED_SOURCE_SNAPSHOT') throw new Error('Replay requires a verified source snapshot.');
    if(snapshot.caseId!==caseSchema?.id) throw new Error('Verified snapshot/case mismatch.');
    if(snapshot.verification?.sourceComplete!==true||snapshot.calibrationEligible!==true) throw new Error('Verified snapshot is not source-complete.');
    const direction=directionFromAction(snapshot.actionCandidate?.action);
    if(!direction) throw new Error(`Historical action ${snapshot.actionCandidate?.action||'NONE'} is not directional and cannot create directional forecast samples.`);
    return direction;
  }

  async function run({snapshot,caseSchema,priceProvider,granularity=86400,lens='m24'}={}){
    if(!priceProvider) throw new Error('Replay requires a historical price provider.');
    const direction=validateSnapshot(snapshot,caseSchema);
    const decisionDate=String(snapshot.resolvedCheckpoints.decisionAsOf).slice(0,10);
    const maxDays=Math.max(...Object.values(HORIZONS));
    const endDate=addDays(decisionDate,maxDays+5);
    const source=await priceProvider.getBarsForAsset(caseSchema.asset,{
      start:`${decisionDate}T00:00:00Z`,end:`${endDate}T23:59:59Z`,granularity
    });
    const bars=source.bars||[];
    const decisionBar=firstBarOnOrAfter(bars,decisionDate);
    if(!decisionBar) throw new Error('Replay has no decision-date price bar.');
    const pairs=[];
    for(const [horizon,days] of Object.entries(HORIZONS)){
      const targetDate=addDays(decisionDate,days);
      const outcomeBar=firstBarOnOrAfter(bars,targetDate);
      if(!outcomeBar) throw new Error(`Replay has no outcome bar for ${horizon}.`);
      const realizedReturn=round(((outcomeBar.close/decisionBar.close)-1)*100,4);
      const directionCorrect=direction==='DOWN'?realizedReturn<0:realizedReturn>0;
      const forecast=M24Core.record('FORECAST_INSTANCE',{
        horizon,lens,direction,
        conditions:{historicalCaseId:caseSchema.id,replay:'VERIFIED_SOURCE_SNAPSHOT',coverageProfile:snapshot.coverageProfile||'UNSPECIFIED'},
        calibrationState:'HISTORICAL_REPLAY',
        decisionAsOf:snapshot.resolvedCheckpoints.decisionAsOf,
        sourceSnapshotDigest:snapshot.verification.artifactDigest
      },{
        subjectId:caseSchema.asset,
        timestamp:snapshot.resolvedCheckpoints.decisionAsOf,
        confidence:null,
        evidenceStatus:M24Core.EVIDENCE.PLAUSIBLE_INTERPRETATION,
        provenance:[{sourceId:`M24-SOURCE-E2E-${snapshot.verification.workflowRunId}`,quality:'VERIFIED_REAL_SOURCE_REPLAY',digest:snapshot.verification.artifactDigest}]
      });
      const outcome=M24Core.record('OUTCOME_INSTANCE',{
        forecastId:forecast.id,horizon,
        realizedReturn,
        maxDrawdown:null,
        directionCorrect,
        targetDate,
        observedDate:outcomeBar.date,
        decisionClose:decisionBar.close,
        outcomeClose:outcomeBar.close,
        note:'Historical replay outcome created strictly after the verified decision snapshot.'
      },{
        subjectId:caseSchema.asset,
        timestamp:`${outcomeBar.date}T23:59:59.999Z`,
        evidenceStatus:M24Core.EVIDENCE.MECHANISM_VISIBLE,
        confidence:1,
        provenance:source.provenance||[]
      });
      pairs.push({horizon,forecast,outcome});
    }
    return {
      type:'HISTORICAL_REPLAY_RESULT',caseId:caseSchema.id,asset:caseSchema.asset,direction,decisionDate,
      decisionClose:decisionBar.close,pairs,
      sourceProvenance:source.provenance||[],
      rule:'Forecast records contain only verified information known at T; each OUTCOME_INSTANCE is created from later bars and is linked by forecastId.'
    };
  }

  function addToStore(store,result){
    result.pairs.forEach(({forecast,outcome})=>{store.add(forecast);store.add(outcome)});
    return result;
  }

  return {HORIZONS,directionFromAction,addDays,firstBarOnOrAfter,validateSnapshot,run,addToStore};
})();
