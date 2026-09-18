globalThis.M24Enrichment = (() => {
  const clone=value=>structuredClone(value);

  function latestCaseRecord(store,caseId,types){
    const records=types.flatMap(type=>store.where(r=>r.type===type&&r.data?.caseId===caseId));
    return records.length?records.at(-1):null;
  }

  function addPayload(store,payload,{subjectId=null,resolution='ENRICHMENT'}={}){
    return store.add(M24Core.record(payload.type,payload.data,{
      subjectId,
      resolution,
      evidenceStatus:payload.evidenceStatus||M24Core.EVIDENCE.MECHANISM_VISIBLE,
      confidence:Number.isFinite(payload.confidence)?payload.confidence:1,
      provenance:payload.provenance||[]
    }));
  }

  function addPayloads(store,payloads,meta){return (payloads||[]).map(payload=>addPayload(store,payload,meta))}

  async function ensurePrice({store,caseSchema,priceProvider=null,priceLab=null,granularity=86400}={}){
    let record=latestCaseRecord(store,caseSchema.id,['LAB_RESULT_PRIMARY','LAB_RESULT']);
    if(record) return {record,result:clone(record.data),created:false};
    if(!priceProvider) throw new Error('Case enrichment needs a measured price layer or priceProvider.');
    const lab=priceLab||M24PrimaryLab;
    const measured=await lab.runCase({provider:priceProvider,caseSchema,granularity});
    record=store.add(M24Core.record('LAB_RESULT_PRIMARY',measured.result,{
      subjectId:caseSchema.asset,resolution:'D',evidenceStatus:M24Core.EVIDENCE.MECHANISM_VISIBLE,confidence:1,provenance:measured.result.provenance||[]
    }));
    return {record,result:measured.result,created:true};
  }

  async function runCase({store,caseSchema,providers={},granularity=86400}={}){
    if(!store||!caseSchema) throw new Error('Case enrichment requires store and case schema.');
    const price=await ensurePrice({store,caseSchema,priceProvider:providers.price,priceLab:providers.priceLab,granularity});
    const labResult=price.result;

    const meaning=M24Meaning.analyzeCase(caseSchema);
    store.add(M24Core.record('MEANING_WORLD_CONTEXT',meaning,{
      subjectId:caseSchema.asset,resolution:'SOURCE_TIMESTAMPS',evidenceStatus:M24Core.EVIDENCE.PLAUSIBLE_INTERPRETATION,
      confidence:0.75,provenance:meaning.sources.map(M24Meaning.toProvenance)
    }));

    let derivatives=null;
    const derivativesRequired=(caseSchema.requiredLayers||[]).includes('DERIVATIVES');
    if(providers.derivatives){
      const derivativesLab=providers.derivativesLab||M24DerivativesLab;
      derivatives=await derivativesLab.runCase({provider:providers.derivatives,caseSchema,labResult});
      addPayloads(store,derivativesLab.toRecordPayloads(derivatives),{subjectId:caseSchema.asset,resolution:'CHECKPOINT_BOUNDED'});
    }else if(derivativesRequired){
      throw new Error('Derivatives provider is required for this case evidence profile.');
    }

    let archive=null;
    if(providers.archive){
      archive=await M24BinanceVisionLab.runCase({provider:providers.archive,caseSchema,labResult});
      addPayloads(store,M24BinanceVisionLab.toRecordPayloads(archive),{subjectId:caseSchema.asset,resolution:'ARCHIVE_CHECKPOINTS'});
    }

    if(!providers.macro) throw new Error('Macro provider is required.');
    const macro=await M24MacroLab.runCase({provider:providers.macro,caseSchema,labResult,keys:providers.macroKeys||caseSchema.macroKeys||M24MacroLab.DEFAULT_KEYS});
    addPayloads(store,M24MacroLab.toRecordPayloads(macro),{subjectId:caseSchema.asset,resolution:'CHECKPOINT_CONTEXT'});

    const backtest=M24Backtest.run({
      caseSchema,labResult,meaningContext:meaning,
      derivativesContext:derivatives?(derivatives.context||derivatives.fundingContext):null,
      archiveDerivativesContext:archive,
      macroContext:macro.context
    });
    store.add(M24Core.record('DECISION_SNAPSHOT',backtest.snapshot,{subjectId:caseSchema.asset,resolution:'DECISION_T',evidenceStatus:M24Core.EVIDENCE.MECHANISM_VISIBLE,confidence:1,provenance:[]}));
    store.add(M24Core.record('ACTION_CANDIDATE',backtest.candidate,{subjectId:caseSchema.asset,resolution:'DECISION_T',evidenceStatus:M24Core.EVIDENCE.PLAUSIBLE_INTERPRETATION,confidence:null,provenance:[]}));
    store.add(M24Core.record('BACKTEST_OUTCOME',backtest.outcome,{subjectId:caseSchema.asset,resolution:'OUTCOME',evidenceStatus:M24Core.EVIDENCE.MECHANISM_VISIBLE,confidence:1,provenance:[]}));

    const evidence=M24EvidenceGate.assess(store,caseSchema);
    store.add(M24Core.record('CASE_EVIDENCE_STATUS',evidence,{subjectId:caseSchema.asset,resolution:'EVIDENCE_GATE',evidenceStatus:M24Core.EVIDENCE.MECHANISM_VISIBLE,confidence:1,provenance:[]}));

    return {
      type:'CASE_ENRICHMENT_RESULT',caseId:caseSchema.id,asset:caseSchema.asset,
      priceCreated:price.created,meaning,derivatives,archive,macro:macro.context,backtest,evidence,
      calibrationEligible:evidence.calibrationEligible,
      state:evidence.calibrationEligible?'SOURCE_COMPLETE':'INCOMPLETE',
      rule:'Promotion is computed from Qubus evidence records; it is never set manually in the case registry.'
    };
  }

  return {latestCaseRecord,ensurePrice,runCase};
})();
