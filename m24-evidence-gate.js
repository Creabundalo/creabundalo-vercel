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
    return {state:'COMPLETE',recordIds:[rec.id],note:`${sources.length} timestamped source item(s).`};
  }

  function derivativesState(records,caseId){
    const funding=latest(forCase(records,caseId,'DERIVATIVES_CONTEXT'));
    const archive=latest(forCase(records,caseId,'ARCHIVE_DERIVATIVES_CONTEXT'));
    const gaps=forCase(records,caseId,'SOURCE_GAP').filter(r=>['DERIVATIVES_ARCHIVE','DERIVATIVES'].includes(r?.data?.domain)||String(r?.data?.metric||'').includes('OPEN_INTEREST'));
    if(!funding) return {state:'MISSING',recordIds:[],note:'No checkpoint-bounded funding context.'};
    if(!archive) return {state:'INCOMPLETE',recordIds:[funding.id],note:'Funding exists, but archived OI/long-short/taker context is missing.'};
    const archiveGaps=archive?.data?.gaps||[];
    if(archiveGaps.length||gaps.length) return {state:'BLOCKED_BY_SOURCE_GAP',recordIds:[funding.id,archive.id,...gaps.map(x=>x.id)],note:'Derivatives archive contains an explicit source gap; do not promote.'};
    return {state:'COMPLETE',recordIds:[funding.id,archive.id],note:'Funding and archived positioning context complete.'};
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
    return {
      type:'CASE_EVIDENCE_STATUS',caseId:caseSchema.id,asset:caseSchema.asset,
      requiredLayers:[...REQUIRED],layers:clone(layers),missingLayers:missing,
      calibrationEligible,
      state:calibrationEligible?'SOURCE_COMPLETE':'INCOMPLETE',
      rule:'A case may enter forecast calibration only when every required source layer is complete and the no-lookahead decision/outcome split exists.'
    };
  }

  function toRecordPayload(result){return {type:'CASE_EVIDENCE_STATUS',data:result,evidenceStatus:'MECHANISM_VISIBLE',confidence:1,provenance:[]}}

  return {REQUIRED,assess,toRecordPayload};
})();
