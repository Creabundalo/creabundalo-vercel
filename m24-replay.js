globalThis.M24Replay = (() => {
  const HORIZON_PROFILES=Object.freeze({
    FAST_MARKET:Object.freeze({
      clock:'MARKET_DAILY_FIXED_DAYS',
      horizons:Object.freeze({
        '3D':Object.freeze({amount:3,unit:'DAYS'}),
        '2W':Object.freeze({amount:14,unit:'DAYS'}),
        '1M':Object.freeze({amount:30,unit:'DAYS'}),
        '2M':Object.freeze({amount:60,unit:'DAYS'})
      })
    }),
    SHOCK:Object.freeze({
      clock:'MARKET_DAILY_FIXED_DAYS',
      horizons:Object.freeze({
        '1D':Object.freeze({amount:1,unit:'DAYS'}),
        '3D':Object.freeze({amount:3,unit:'DAYS'}),
        '1W':Object.freeze({amount:7,unit:'DAYS'}),
        '2W':Object.freeze({amount:14,unit:'DAYS'}),
        '1M':Object.freeze({amount:30,unit:'DAYS'})
      })
    }),
    SLOW_MARKET:Object.freeze({
      clock:'PUBLICATION_CALENDAR',
      horizons:Object.freeze({
        '1M':Object.freeze({amount:1,unit:'MONTHS'}),
        '3M':Object.freeze({amount:3,unit:'MONTHS'}),
        '6M':Object.freeze({amount:6,unit:'MONTHS'}),
        '12M':Object.freeze({amount:12,unit:'MONTHS'})
      })
    })
  });
  const HORIZONS=Object.freeze(Object.fromEntries(Object.entries(HORIZON_PROFILES.FAST_MARKET.horizons).map(([k,v])=>[k,v.amount])));
  const DAY_MS=86400000;
  const round=(n,d=4)=>Number(Number(n).toFixed(d));

  function directionFromAction(action){
    if(action==='DOWNSIDE_WATCH') return 'DOWN';
    if(action==='UPSIDE_WATCH') return 'UP';
    return null;
  }

  function profileForCase(caseSchema){
    const name=caseSchema?.horizonProfile||'FAST_MARKET';
    const profile=HORIZON_PROFILES[name];
    if(!profile) throw new Error(`Unknown horizon profile ${name}.`);
    return {name,clock:profile.clock,horizons:profile.horizons};
  }

  function addDays(isoDate,days){
    const t=new Date(`${isoDate}T00:00:00Z`).getTime();
    return new Date(t+(days*DAY_MS)).toISOString().slice(0,10);
  }

  function addMonths(isoDate,months){
    const d=new Date(`${isoDate}T00:00:00Z`);
    const originalDay=d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth()+months);
    const lastDay=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();
    d.setUTCDate(Math.min(originalDay,lastDay));
    return d.toISOString().slice(0,10);
  }

  function targetDate(decisionDate,spec){
    return spec.unit==='MONTHS'?addMonths(decisionDate,spec.amount):addDays(decisionDate,spec.amount);
  }

  function firstBarOnOrAfter(bars,date){
    return (bars||[]).filter(b=>b.date>=date).sort((a,b)=>a.date.localeCompare(b.date))[0]||null;
  }

  function valueOfObservation(row){
    for(const key of ['priceIndex','close','value']) if(row?.[key]!==null&&row?.[key]!==undefined&&Number.isFinite(Number(row[key]))) return Number(row[key]);
    return null;
  }

  function validateSnapshot(snapshot,caseSchema){
    if(!snapshot||snapshot.type!=='VERIFIED_SOURCE_SNAPSHOT') throw new Error('Replay requires a verified source snapshot.');
    if(snapshot.caseId!==caseSchema?.id) throw new Error('Verified snapshot/case mismatch.');
    if(snapshot.verification?.sourceComplete!==true||snapshot.calibrationEligible!==true) throw new Error('Verified snapshot is not source-complete.');
    const direction=directionFromAction(snapshot.actionCandidate?.action);
    if(!direction) throw new Error(`Historical action ${snapshot.actionCandidate?.action||'NONE'} is not directional and cannot create directional forecast samples.`);
    return direction;
  }

  function createPair({snapshot,caseSchema,lens,horizon,horizonProfile,direction,targetDateValue,decisionValue,outcomeValue,observedDate,availableAt,provenance=[]}){
    const realizedReturn=round(((outcomeValue/decisionValue)-1)*100,4);
    const directionCorrect=direction==='DOWN'?realizedReturn<0:realizedReturn>0;
    const forecast=M24Core.record('FORECAST_INSTANCE',{
      horizon,lens,direction,
      conditions:{
        historicalCaseId:caseSchema.id,replay:'VERIFIED_SOURCE_SNAPSHOT',
        coverageProfile:snapshot.coverageProfile||'UNSPECIFIED',
        horizonProfile,
        regime:caseSchema.regimeFamily||caseSchema.analysis||null
      },
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
      forecastId:forecast.id,horizon,horizonProfile,
      realizedReturn,maxDrawdown:null,directionCorrect,
      targetDate:targetDateValue,observedDate,availableAt:availableAt||observedDate,
      decisionClose:decisionValue,outcomeClose:outcomeValue,
      note:'Historical replay outcome created strictly after the verified decision snapshot using the case horizon clock.'
    },{
      subjectId:caseSchema.asset,
      timestamp:availableAt||`${observedDate}T23:59:59.999Z`,
      evidenceStatus:M24Core.EVIDENCE.MECHANISM_VISIBLE,
      confidence:1,provenance
    });
    return {horizon,forecast,outcome};
  }

  async function runDaily({snapshot,caseSchema,priceProvider,lens,profile,granularity}){
    if(typeof priceProvider?.getBarsForAsset!=='function') throw new Error('Daily replay requires getBarsForAsset provider.');
    const decisionDate=String(snapshot.resolvedCheckpoints.decisionAsOf).slice(0,10);
    const targets=Object.fromEntries(Object.entries(profile.horizons).map(([h,s])=>[h,targetDate(decisionDate,s)]));
    const latestTarget=Object.values(targets).sort().at(-1);
    const endDate=addDays(latestTarget,5);
    const source=await priceProvider.getBarsForAsset(caseSchema.asset,{start:`${decisionDate}T00:00:00Z`,end:`${endDate}T23:59:59Z`,granularity});
    const bars=source.bars||[];
    const decisionBar=firstBarOnOrAfter(bars,decisionDate);
    if(!decisionBar) throw new Error('Replay has no decision-date price bar.');
    const pairs=[];
    for(const [horizon,spec] of Object.entries(profile.horizons)){
      const target=targets[horizon],outcomeBar=firstBarOnOrAfter(bars,target);
      if(!outcomeBar) throw new Error(`Replay has no outcome bar for ${horizon}.`);
      pairs.push(createPair({
        snapshot,caseSchema,lens,horizon,horizonProfile:profile.name,direction:directionFromAction(snapshot.actionCandidate.action),
        targetDateValue:target,decisionValue:decisionBar.close,outcomeValue:outcomeBar.close,
        observedDate:outcomeBar.date,availableAt:`${outcomeBar.date}T23:59:59.999Z`,provenance:source.provenance||[]
      }));
    }
    return {decisionDate,decisionValue:decisionBar.close,pairs,sourceProvenance:source.provenance||[]};
  }

  async function runPublication({snapshot,caseSchema,priceProvider,lens,profile}){
    if(typeof priceProvider?.fetchMonthly!=='function') throw new Error('Publication-clock replay requires fetchMonthly provider.');
    const decisionAsOf=String(snapshot.resolvedCheckpoints.decisionAsOf);
    const decisionDate=decisionAsOf.slice(0,10);
    const maxMonths=Math.max(...Object.values(profile.horizons).map(x=>x.amount));
    const source=await priceProvider.fetchMonthly({from:caseSchema.window.from,to:addMonths(decisionDate,maxMonths+2)});
    const rows=(source.rows||[]).filter(x=>x?.publishedAt).sort((a,b)=>String(a.publishedAt).localeCompare(String(b.publishedAt)));
    const known=rows.filter(x=>String(x.publishedAt)<=decisionDate).at(-1);
    const decisionValue=valueOfObservation(known);
    if(!known||!Number.isFinite(decisionValue)) throw new Error('Publication replay has no observation available by the decision cutoff.');
    const pairs=[];
    for(const [horizon,spec] of Object.entries(profile.horizons)){
      const target=targetDate(decisionDate,spec);
      const outcomeRow=rows.find(x=>String(x.publishedAt)>=target);
      const outcomeValue=valueOfObservation(outcomeRow);
      if(!outcomeRow||!Number.isFinite(outcomeValue)) throw new Error(`Publication replay has no available observation for ${horizon}.`);
      pairs.push(createPair({
        snapshot,caseSchema,lens,horizon,horizonProfile:profile.name,direction:directionFromAction(snapshot.actionCandidate.action),
        targetDateValue:target,decisionValue,outcomeValue,
        observedDate:outcomeRow.date,availableAt:outcomeRow.publishedAt,provenance:source.provenance||[]
      }));
    }
    return {decisionDate,decisionValue,pairs,sourceProvenance:source.provenance||[],decisionObservationDate:known.date,decisionAvailableAt:known.publishedAt};
  }

  async function run({snapshot,caseSchema,priceProvider,granularity=86400,lens='m24'}={}){
    if(!priceProvider) throw new Error('Replay requires a historical price provider.');
    const direction=validateSnapshot(snapshot,caseSchema);
    const profile=profileForCase(caseSchema);
    const measured=profile.clock==='PUBLICATION_CALENDAR'
      ?await runPublication({snapshot,caseSchema,priceProvider,lens,profile})
      :await runDaily({snapshot,caseSchema,priceProvider,lens,profile,granularity});
    return {
      type:'HISTORICAL_REPLAY_RESULT',caseId:caseSchema.id,asset:caseSchema.asset,direction,
      horizonProfile:profile.name,horizonClock:profile.clock,
      decisionDate:measured.decisionDate,decisionClose:measured.decisionValue,
      decisionObservationDate:measured.decisionObservationDate||measured.decisionDate,
      decisionAvailableAt:measured.decisionAvailableAt||snapshot.resolvedCheckpoints.decisionAsOf,
      pairs:measured.pairs,sourceProvenance:measured.sourceProvenance,
      rule:'Forecast records contain only verified information known at T. Horizon profile and clock are explicit; publication-lag markets never inherit fast-market timing.'
    };
  }

  function addToStore(store,result){
    result.pairs.forEach(({forecast,outcome})=>{store.add(forecast);store.add(outcome)});
    return result;
  }

  return {HORIZONS,HORIZON_PROFILES,directionFromAction,profileForCase,addDays,addMonths,targetDate,firstBarOnOrAfter,valueOfObservation,validateSnapshot,run,addToStore};
})();