globalThis.M24TricksterLab = (() => {
  function latest(store,type){const items=store?.list?.(type)||[];return items.at(-1)||null}

  function assess({labResult,meaningContext,derivativesContext=null,macroContext=null}={}){
    if(!labResult||!meaningContext) throw new Error('Historical Trickster assessment requires price Lab result and meaning-world context.');
    const contrasts=[];
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

    const macroSeries=macroContext?.series||[];
    const macroContrast=(key,id,statement)=>{
      const s=macroSeries.find(x=>x.key===key);
      if(bullishMeaning&&s?.status==='COMPARABLE'&&Number(s.delta)>0) contrasts.push({id,layerA:'MEANING_WORLD',layerB:'MACRO_CROSS_ASSET',seriesId:s.seriesId,evidence:'PLAUSIBLE_INTERPRETATION',statement});
    };
    macroContrast('DOLLAR','POSITIVE_NARRATIVE_STRONGER_DOLLAR','Positive source framing coexists with a stronger broad U.S. dollar between the two checkpoints.');
    macroContrast('FIN_CONDITIONS','POSITIVE_NARRATIVE_TIGHTER_FINANCIAL_CONDITIONS','Positive source framing coexists with a higher NFCI reading, i.e. tighter financial conditions relative to the first checkpoint.');
    macroContrast('TEN_YEAR','POSITIVE_NARRATIVE_HIGHER_LONG_RATE','Positive source framing coexists with a higher 10-year Treasury yield.');

    if(meaningContext.firstTop?.direction>0.25&&bullishMeaning){
      contrasts.push({id:'NARRATIVE_PERSISTENCE',layerA:'MEANING_WORLD',layerB:'TIME',evidence:'MECHANISM_VISIBLE',statement:'Positive adoption/acceptance framing is present around both major top windows.'});
    }

    const inputs={
      price:true,meaning:true,
      derivatives:Boolean(derivativesContext),
      macro:Boolean(macroContext)
    };
    const missing=Object.entries(inputs).filter(([,v])=>!v).map(([k])=>k);
    return {
      type:'HISTORICAL_TRICKSTER_ASSESSMENT',caseId:labResult.caseId,
      inputs,missingLayers:missing,contrasts,
      discrepancyCount:contrasts.filter(x=>x.evidence==='PLAUSIBLE_INTERPRETATION').length,
      evidenceStatus:'PLAUSIBLE_INTERPRETATION',intentStatus:'INTENT_UNKNOWN',actorAttribution:'NONE',
      conclusion:contrasts.length?'Meerdere zichtbare lagen lopen op relevante punten niet volledig gelijk; dit ondersteunt een Trickster-hypothese, niet een manipulatiebeschuldiging.':'Geen sterke multi-layer discrepantie gevonden met de geladen bronnen.',
      rule:'Mechanism/narrative discrepancies may guide hypotheses and confirmation rules; intent or actor identity requires separate hard evidence.'
    };
  }

  function assessFromStore({store,labResult}={}){
    const meaning=latest(store,'MEANING_WORLD_CONTEXT')?.data||null;
    const derivatives=latest(store,'DERIVATIVES_CONTEXT')?.data||null;
    const macro=latest(store,'MACRO_CROSS_ASSET_CONTEXT')?.data||null;
    return assess({labResult,meaningContext:meaning,derivativesContext:derivatives,macroContext:macro});
  }

  return {assess,assessFromStore};
})();
