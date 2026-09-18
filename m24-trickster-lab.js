globalThis.M24TricksterLab = (() => {
  function latest(store,type){const items=store?.list?.(type)||[];return items.at(-1)||null}

  function assess({labResult,meaningContext,derivativesContext=null,archiveDerivativesContext=null,macroContext=null}={}){
    if(!labResult||!meaningContext) throw new Error('Historical Trickster assessment requires price Lab result and meaning-world context.');
    const contrasts=[];
    const confirmations=[];
    const observations=[];
    const secondNarrative=meaningContext.secondTop?.direction;
    const bullishMeaning=Number.isFinite(secondNarrative)&&secondNarrative>0.25;

    if(bullishMeaning&&labResult.comparisons?.volumeBearishDivergence){
      contrasts.push({id:'POSITIVE_NARRATIVE_WEAK_PARTICIPATION',layerA:'MEANING_WORLD',layerB:'PRICE_VOLUME',evidence:'PLAUSIBLE_INTERPRETATION',statement:'Second-top source framing is positive while measured participation is weaker than at the first top.'});
    }
    if(bullishMeaning&&labResult.comparisons?.rsiBearishDivergence){
      contrasts.push({id:'POSITIVE_NARRATIVE_WEAK_MOMENTUM',layerA:'MEANING_WORLD',layerB:'MOMENTUM',evidence:'PLAUSIBLE_INTERPRETATION',statement:'Positive source framing coexists with measured bearish RSI divergence.'});
    }
    const crowding=derivativesContext?.comparison?.crowdingShift;
    if(bullishMeaning&&crowding==='MORE_POSITIVE_AT_SECOND_TOP'){
      contrasts.push({id:'POSITIVE_NARRATIVE_LONG_CROWDING',layerA:'MEANING_WORLD',layerB:'DERIVATIVES',evidence:'PLAUSIBLE_INTERPRETATION',statement:'Positive source framing coexists with more-positive funding at the second top, consistent with increased long crowding.'});
    }

    if(archiveDerivativesContext){
      const first=archiveDerivativesContext.firstTop?.summary;
      const second=archiveDerivativesContext.secondTop?.summary;
      const delta=archiveDerivativesContext.deltas||{};
      if(Number.isFinite(delta.sumOpenInterest)){
        observations.push({id:'OPEN_INTEREST_CHANGE',layer:'DERIVATIVES_ARCHIVE',evidence:'MECHANISM_VISIBLE',direction:Math.sign(delta.sumOpenInterest),statement:`Open interest changed by ${delta.sumOpenInterest} between the two archived checkpoint observations. Open interest alone is directionless.`});
      }
      const longSkew=second&&Number.isFinite(second.globalLongShort)&&second.globalLongShort>1&&Number(delta.globalLongShort)>0;
      if(bullishMeaning&&longSkew){
        contrasts.push({id:'POSITIVE_NARRATIVE_ARCHIVE_LONG_SKEW',layerA:'MEANING_WORLD',layerB:'DERIVATIVES_ARCHIVE',evidence:'PLAUSIBLE_INTERPRETATION',statement:'Positive source framing coexists with a more long-skewed global long/short ratio at the second archived checkpoint.'});
      }
      const takerBuy=second&&Number.isFinite(second.takerLongShortVolume)&&second.takerLongShortVolume>1&&Number(delta.takerLongShortVolume)>0;
      if(bullishMeaning&&takerBuy){
        confirmations.push({id:'POSITIVE_NARRATIVE_TAKER_BUY_CONFIRMATION',layerA:'MEANING_WORLD',layerB:'DERIVATIVES_ARCHIVE',evidence:'MECHANISM_VISIBLE',statement:'Positive source framing is accompanied by a stronger taker buy/sell volume ratio at the second archived checkpoint.'});
      }
    }

    const macroSeries=macroContext?.series||[];
    const macroContrast=(key,id,statement)=>{
      const s=macroSeries.find(x=>x.key===key);
      if(bullishMeaning&&s?.status==='COMPARABLE'&&Number(s.delta)>0) contrasts.push({id,layerA:'MEANING_WORLD',layerB:'MACRO_CROSS_ASSET',seriesId:s.seriesId,evidence:'PLAUSIBLE_INTERPRETATION',statement});
    };
    macroContrast('DOLLAR','POSITIVE_NARRATIVE_STRONGER_DOLLAR','Positive source framing coexists with a stronger broad U.S. dollar between the two checkpoints.');
    macroContrast('FIN_CONDITIONS','POSITIVE_NARRATIVE_TIGHTER_FINANCIAL_CONDITIONS','Positive source framing coexists with a higher NFCI reading, i.e. tighter financial conditions relative to the first checkpoint.');
    macroContrast('TEN_YEAR','POSITIVE_NARRATIVE_HIGHER_LONG_RATE','Positive source framing coexists with a higher 10-year Treasury yield.');

    if(meaningContext.firstTop?.direction>0.25&&bullishMeaning){
      observations.push({id:'NARRATIVE_PERSISTENCE',layer:'MEANING_WORLD',evidence:'MECHANISM_VISIBLE',statement:'Positive adoption/acceptance framing is present around both major top windows.'});
    }

    const inputs={
      price:true,meaning:true,
      derivatives:Boolean(derivativesContext),
      archiveDerivatives:Boolean(archiveDerivativesContext),
      macro:Boolean(macroContext)
    };
    const missing=Object.entries(inputs).filter(([,v])=>!v).map(([k])=>k);
    return {
      type:'HISTORICAL_TRICKSTER_ASSESSMENT',caseId:labResult.caseId,
      inputs,missingLayers:missing,contrasts,confirmations,observations,
      discrepancyCount:contrasts.filter(x=>x.evidence==='PLAUSIBLE_INTERPRETATION').length,
      evidenceStatus:'PLAUSIBLE_INTERPRETATION',intentStatus:'INTENT_UNKNOWN',actorAttribution:'NONE',
      conclusion:contrasts.length?'Meerdere zichtbare lagen lopen op relevante punten niet volledig gelijk; dit ondersteunt een Trickster-hypothese, niet een manipulatiebeschuldiging.':'Geen sterke multi-layer discrepantie gevonden met de geladen bronnen.',
      rule:'Open interest is directionless by itself. Mechanism/narrative discrepancies may guide hypotheses and confirmation rules; intent or actor identity requires separate hard evidence.'
    };
  }

  const finite=value=>value!==null&&value!==undefined&&String(value).trim()!==''&&Number.isFinite(Number(value));
  const round=(n,d=3)=>Number(Number(n).toFixed(d));

  function normalizedEvidence(snapshot){
    return (snapshot?.actionCandidate?.evidence||[]).map(item=>typeof item==='string'?{id:item,weight:null}:{id:item?.id||'UNKNOWN',weight:finite(item?.weight)?Number(item.weight):null}).filter(x=>x.id);
  }

  function assessVerifiedSnapshot({caseSchema,snapshot,meaningContext}={}){
    if(!caseSchema?.id||!snapshot||!meaningContext) throw new Error('Verified Trickster assessment requires case schema, verified snapshot and meaning context.');
    if(snapshot.verification?.sourceComplete!==true) throw new Error('Trickster cross-case validation requires a source-complete snapshot.');

    const firstNarrative=finite(meaningContext.firstTop?.direction)?Number(meaningContext.firstTop.direction):null;
    const secondNarrative=finite(meaningContext.secondTop?.direction)?Number(meaningContext.secondTop.direction):null;
    const narrativeShift=finite(firstNarrative)&&finite(secondNarrative)?round(secondNarrative-firstNarrative):null;
    const actionScore=finite(snapshot.actionCandidate?.score)?Number(snapshot.actionCandidate.score):0;
    const mechanismStressScore=round(Math.max(0,Math.min(1,actionScore/4)));
    const mechanismDirection=round(-mechanismStressScore);
    const discrepancyMagnitude=finite(secondNarrative)?round(Math.abs(secondNarrative-mechanismDirection)/2):null;
    const evidenceItems=normalizedEvidence(snapshot);
    const contrasts=[],confirmations=[],observations=[];

    let state='MIXED_OR_LOW_SIGNAL';
    if(finite(secondNarrative)&&mechanismStressScore>=0.4&&secondNarrative>0.25){
      state='DIVERGENCE_VISIBLE';
      contrasts.push({
        id:'POSITIVE_MEANING_MECHANISM_STRESS',layerA:'MEANING_WORLD',layerB:'MECHANISM_STATE',
        evidence:'PLAUSIBLE_INTERPRETATION',
        statement:'Positive source framing coexists with a materially stressed/downside mechanism state in the verified decision evidence.'
      });
    }else if(finite(secondNarrative)&&mechanismStressScore>=0.4&&secondNarrative<-0.25){
      state='ALIGNMENT_VISIBLE';
      confirmations.push({
        id:'NEGATIVE_MEANING_STRESS_ALIGNMENT',layerA:'MEANING_WORLD',layerB:'MECHANISM_STATE',
        evidence:'MECHANISM_VISIBLE',
        statement:'Negative/risk source framing and the verified mechanism state point in the same broad stress direction.'
      });
    }else if(finite(secondNarrative)&&mechanismStressScore<0.25&&Math.abs(secondNarrative)>=0.5){
      state='MEANING_AHEAD_OF_MECHANISM';
      contrasts.push({
        id:'STRONG_MEANING_LOW_MEASURED_STRESS',layerA:'MEANING_WORLD',layerB:'MECHANISM_STATE',
        evidence:'PLAUSIBLE_INTERPRETATION',
        statement:'Strong source framing is present while the verified decision engine shows little measured stress. This is a discrepancy to inspect, not a directional signal.'
      });
    }

    if(finite(firstNarrative)&&finite(secondNarrative)&&Math.sign(firstNarrative)!==Math.sign(secondNarrative)&&Math.abs(narrativeShift)>=0.5){
      observations.push({
        id:'NARRATIVE_REGIME_SHIFT',layer:'MEANING_WORLD',evidence:'MECHANISM_VISIBLE',
        direction:narrativeShift,
        statement:'The coded meaning-world direction changed materially between the two case checkpoints.'
      });
    }

    if(caseSchema.scoreProfile==='HOUSING_SLOW_MARKET'){
      observations.push({id:'SLOW_MARKET_PUBLICATION_LAG',layer:'TIME',evidence:'MECHANISM_VISIBLE',statement:'Housing meaning/mechanism comparison uses publication availability rather than pretending monthly observations were known at period start.'});
    }
    if(caseSchema.scoreProfile==='CROSS_ASSET_LIQUIDITY'){
      observations.push({id:'CROSS_ASSET_STRESS_PROFILE',layer:'CROSS_ASSET',evidence:'MECHANISM_VISIBLE',statement:'Stress evidence is aggregated across volatility, dollar, financial conditions, rates and commodities rather than forced into a double-top template.'});
    }

    return {
      type:'HISTORICAL_TRICKSTER_CROSS_CASE',
      caseId:caseSchema.id,asset:caseSchema.asset,
      action:snapshot.actionCandidate?.action||null,
      coverageProfile:snapshot.coverageProfile||caseSchema.coverageProfile||null,
      meaning:{firstDirection:firstNarrative,secondDirection:secondNarrative,directionShift:narrativeShift,sourceCount:meaningContext.sourceScope?.totalScopedSources??null},
      mechanism:{stressScore:mechanismStressScore,direction:mechanismDirection,evidenceItems},
      state,discrepancyMagnitude,
      contrasts,confirmations,observations,
      evidenceStatus:'PLAUSIBLE_INTERPRETATION',
      intentStatus:'INTENT_UNKNOWN',
      actorAttribution:'NONE',
      manipulationStatus:'NOT_ESTABLISHED',
      predictiveStatus:'NOT_CALIBRATED',
      rule:'Trickster compares meaning with verified mechanism state. Divergence or alignment is descriptive evidence; neither proves manipulation, actor intent, causality or predictive edge.'
    };
  }

  function assessFromStore({store,labResult}={}){
    const meaning=latest(store,'MEANING_WORLD_CONTEXT')?.data||null;
    const derivatives=latest(store,'DERIVATIVES_CONTEXT')?.data||null;
    const archiveDerivatives=latest(store,'ARCHIVE_DERIVATIVES_CONTEXT')?.data||null;
    const macro=latest(store,'MACRO_CROSS_ASSET_CONTEXT')?.data||null;
    return assess({labResult,meaningContext:meaning,derivativesContext:derivatives,archiveDerivativesContext:archiveDerivatives,macroContext:macro});
  }

  return {assess,assessVerifiedSnapshot,normalizedEvidence,assessFromStore};
})();
