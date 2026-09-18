globalThis.M24EvidenceGate = (() => {
  const REQUIRED=Object.freeze(['PRICE','MEANING_WORLD','DERIVATIVES','MACRO','DECISION_SNAPSHOT','BACKTEST_OUTCOME']);
  const clone=value=>structuredClone(value);

  function recordsOf(input){
    if(Array.isArray(input)) return input;
    if(input?.list) return input.list();
    return [];
  }

  function caseIdOf(record){return record?.data?.caseId||record?.data?.caseID||null}
  function forCase(records,caseId,type){return records.filter(r=>r.type===type&&caseIdOf(r)===caseId)}
  function latest(records){return records.length?records.at(-1):null}

  function priceState(records,caseId){
    const rec=latest([...forCase(records,caseId,'LAB_RESULT'),...forCase(records,caseId,'LAB_RESULT_PRIMARY')]);
    return rec?{state:'COMPLETE',recordIds:[rec.id],note:'Measured price structure exists.'}:{state:'MISSING',recordIds:[],note:'No measured price result.'};
  }

  function meaningState(records,caseId){
    const rec=latest(forCase(records,caseId,'MEANING_WORLD_CONTEXT'));
    const sources=rec?.data?.sources||[];
    if(!rec) return {state:'MISSING',recordIds:[],note:'No timestamped meaning-world context.'};
    if(!sources.length) return {state:'INCOMPLETE',recordIds:[rec.id],note:'Meaning-world record has no timestamped sources.'};
    const firstCount=Number(rec?.data?.firstTop?.count||0),secondCount=Number(rec?.data?.secondTop?.count||0);
    if(firstCount<1||secondCount<1) return {state:'INCOMPLETE',recordIds:[rec.id],note:`Meaning-world top coverage incomplete (${firstCount}/${secondCount}); require timestamped evidence around both resolved top windows.`};
    return {state:'COMPLETE',recordIds:[rec.id],note:`${sources.length} scoped timestamped source item(s); top coverage ${firstCount}/${secondCount}.`};
  }

  function derivativesState(records,caseId){
    const context=latest(forCase(records,caseId,'DERIVATIVES_CONTEXT'));
    const archive=latest(forCase(records,caseId,'ARCHIVE_DERIVATIVES_CONTEXT'));
    const relatedGaps=forCase(records,caseId,'SOURCE_GAP').filter(r=>['DERIVATIVES_ARCHIVE','DERIVATIVES'].includes(r?.data?.domain)||String(r?.data?.metric||'').includes('OPEN_INTEREST'));
    if(!context) return {state:'MISSING',extensionState:'MISSING',coverageProfile:'NONE',recordIds:[],note:'No checkpoint-bounded derivatives context.'};

    const family=context?.data?.evidenceFamily||'PERPETUAL_FUNDING';
    const firstCount=Number(context?.data?.firstTop?.count||0);
    const secondCount=Number(context?.data?.secondTop?.count||0);
    const sourceGaps=context?.data?.sourceGaps||[];

    if(sourceGaps.length){
      return {state:'INCOMPLETE',extensionState:'UNKNOWN',coverageProfile:family,recordIds:[context.id],note:`Derivatives source has ${sourceGaps.length} unresolved gap(s).`,sourceGaps:clone(sourceGaps)};
    }
    if(firstCount<1||secondCount<1){
      return {state:'INCOMPLETE',extensionState:'UNKNOWN',coverageProfile:family,recordIds:[context.id],note:`Derivatives observations incomplete at resolved checkpoints (${firstCount}/${secondCount}).`};
    }

    if(family==='FUTURES_POSITIONING'){
      const unexpected=relatedGaps.filter(r=>r?.data?.reason!=='HISTORY_WINDOW_EXCEEDED');
      if(unexpected.length) return {state:'INCOMPLETE',extensionState:'SOURCE_LIMITED',coverageProfile:'FUTURES_POSITIONING',recordIds:[context.id],note:`Futures positioning has ${unexpected.length} unresolved source gap(s).`,sourceGapIds:unexpected.map(x=>x.id)};
      return {
        state:'COMPLETE',extensionState:'PROFILE_COMPLETE',coverageProfile:'FUTURES_POSITIONING',recordIds:[context.id],
        note:'Checkpoint-bounded regulated futures positioning is complete for this historical case. Perpetual funding is not required for a pre-perpetual futures profile.',
        sourceGapIds:relatedGaps.map(x=>x.id),resolvedGapIds:[]
      };
    }

    const recentApiGaps=relatedGaps.filter(r=>r?.data?.reason==='HISTORY_WINDOW_EXCEEDED'&&r?.data?.recommendedSource==='BINANCE_VISION_METRICS');
    if(!archive){
      return {
        state:'INCOMPLETE',extensionState:'NOT_ATTEMPTED',coverageProfile:'CORE_DERIVATIVES',recordIds:[context.id],
        note:'Core funding is complete, but the historical positioning extension has not yet been attempted; run the archive adapter before promotion.',
        sourceGapIds:relatedGaps.map(x=>x.id),resolvedGapIds:[]
      };
    }

    const archiveGaps=archive?.data?.gaps||[];
    const archiveComplete=archiveGaps.length===0;
    const unexpectedNonRetentionGaps=relatedGaps.filter(r=>!recentApiGaps.includes(r));
    if(archiveComplete&&unexpectedNonRetentionGaps.length===0){
      return {
        state:'COMPLETE',extensionState:'COMPLETE',coverageProfile:'EXTENDED_DERIVATIVES',recordIds:[context.id,archive.id],
        note:recentApiGaps.length?'Core funding and extended archived positioning complete; recent-API retention gap is resolved by Binance Vision archive.':'Core funding and extended archived positioning complete.',
        sourceGapIds:relatedGaps.map(x=>x.id),resolvedGapIds:recentApiGaps.map(x=>x.id)
      };
    }

    return {
      state:'COMPLETE',extensionState:'SOURCE_LIMITED',coverageProfile:'CORE_DERIVATIVES',recordIds:[context.id,archive.id],
      note:`Core checkpoint funding is complete. Extended OI/long-short/taker archive is source-limited (${archiveGaps.length+unexpectedNonRetentionGaps.length} unresolved extension gap(s)); keep the limitation visible and do not synthesize missing positioning values.`,
      sourceGapIds:[...relatedGaps.map(x=>x.id)],resolvedGapIds:[],archiveGaps:clone(archiveGaps)
    };
  }

  function macroState(records,caseId){
    const rec=latest(forCase(records,caseId,'MACRO_CROSS_ASSET_CONTEXT'));
    if(!rec) return {state:'MISSING',recordIds:[],note:'No macro/cross-asset context.'};
    const gaps=rec?.data?.gaps||rec?.data?.context?.gaps||[];
    const series=rec?.data?.series||rec?.data?.context?.series||[];
    if(gaps.length) return {state:'INCOMPLETE',recordIds:[rec.id],note:`Macro context has ${gaps.length} source gap(s).`};
    if(!series.length) return {state:'INCOMPLETE',recordIds:[rec.id],note:'Macro record has no comparable series.'};
    return {state:'COMPLETE',recordIds:[rec.id],note:`${series.length} source-backed series.`};
  }

  function simpleState(records,caseId,type,note){
    const rec=latest(forCase(records,caseId,type));
    return rec?{state:'COMPLETE',recordIds:[rec.id],note}:{state:'MISSING',recordIds:[],note:`Missing ${type}.`};
  }

  function assess(input,caseSchema){
    if(!caseSchema?.id) throw new Error('Evidence gate requires a case schema.');
    const records=recordsOf(input);
    const layers={
      PRICE:priceState(records,caseSchema.id),
      MEANING_WORLD:meaningState(records,caseSchema.id),
      DERIVATIVES:derivativesState(records,caseSchema.id),
      MACRO:macroState(records,caseSchema.id),
      DECISION_SNAPSHOT:simpleState(records,caseSchema.id,'DECISION_SNAPSHOT','No-lookahead decision snapshot exists.'),
      BACKTEST_OUTCOME:simpleState(records,caseSchema.id,'BACKTEST_OUTCOME','Later outcome exists separately from decision input.')
    };
    const missing=REQUIRED.filter(key=>layers[key].state!=='COMPLETE');
    const calibrationEligible=missing.length===0;
    const coverageProfile=layers.DERIVATIVES.coverageProfile||(layers.DERIVATIVES.extensionState==='COMPLETE'?'EXTENDED_DERIVATIVES':'CORE_DERIVATIVES');
    return {
      type:'CASE_EVIDENCE_STATUS',caseId:caseSchema.id,asset:caseSchema.asset,
      requiredLayers:[...REQUIRED],layers:clone(layers),missingLayers:missing,
      calibrationEligible,coverageProfile,
      state:calibrationEligible?'SOURCE_COMPLETE':'INCOMPLETE',
      rule:'Source completeness requires the common cross-asset core. Optional positioning extensions remain explicit in coverageProfile and may not be silently mixed in calibration cohorts.'
    };
  }

  function toRecordPayload(result){return {type:'CASE_EVIDENCE_STATUS',data:result,evidenceStatus:'MECHANISM_VISIBLE',confidence:1,provenance:[]}}

  return {REQUIRED,assess,toRecordPayload};
})();
