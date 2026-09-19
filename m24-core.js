const M24Core = (() => {
  const EVIDENCE = Object.freeze({
    MECHANISM_VISIBLE:'MECHANISM_VISIBLE',
    PLAUSIBLE_INTERPRETATION:'PLAUSIBLE_INTERPRETATION',
    INTENT_UNKNOWN:'INTENT_UNKNOWN',
    MANIPULATION_PROVEN:'MANIPULATION_PROVEN'
  });
  const USER_STATUS = Object.freeze(['KANDIDAAT','KLAAR','OPEN','DEELS','GESLOTEN','GEANNULEERD','AFGEWEZEN']);
  const AUDIT_STATUS = Object.freeze(['PREPARE','PREVIEW','APPROVE','COMMIT','VERIFY']);

  const uid = (prefix='M24') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;

  function record(type, data, meta={}) {
    return {
      id: meta.id || uid(type),
      type,
      subjectId: meta.subjectId || null,
      timestamp: meta.timestamp || new Date().toISOString(),
      window: meta.window || null,
      resolution: meta.resolution || null,
      evidenceStatus: meta.evidenceStatus || EVIDENCE.PLAUSIBLE_INTERPRETATION,
      confidence: Number.isFinite(meta.confidence) ? meta.confidence : null,
      provenance: meta.provenance || [],
      relations: meta.relations || [],
      data: structuredClone(data)
    };
  }

  class QubusStore {
    constructor(seed=[]) { this.records = seed.map(x => structuredClone(x)); }
    add(item) { this.records.push(structuredClone(item)); return item; }
    list(type=null) { return this.records.filter(x => !type || x.type === type).map(x => structuredClone(x)); }
    byId(id) { const x=this.records.find(r=>r.id===id); return x ? structuredClone(x) : null; }
    where(predicate) { return this.records.filter(predicate).map(x=>structuredClone(x)); }
  }

  class TricksterEngine {
    assess({subjectId,narrativeScore=0,mechanismScore=0,mechanisms=[],supportingIds=[]}) {
      const discrepancy = Math.abs(narrativeScore - mechanismScore);
      const directionConflict = Math.sign(narrativeScore) !== Math.sign(mechanismScore) && narrativeScore !== 0 && mechanismScore !== 0;
      const evidenceStatus = directionConflict && discrepancy >= 0.65 ? EVIDENCE.PLAUSIBLE_INTERPRETATION : EVIDENCE.MECHANISM_VISIBLE;
      return record('TRICKSTER_ASSESSMENT', {
        narrativeScore, mechanismScore, discrepancy,
        directionConflict,
        mechanisms,
        intentStatus: EVIDENCE.INTENT_UNKNOWN,
        summary: directionConflict ? 'Narratief en gemeten mechanisme lopen uiteen.' : 'Geen sterke narratief/mechanisme-tegenstrijdigheid.'
      }, {
        subjectId,
        evidenceStatus,
        confidence: Math.min(0.95, 0.45 + discrepancy/2),
        relations: supportingIds.map(id=>({type:'SUPPORTED_BY',targetId:id}))
      });
    }
  }

  class ForecastEngine {
    constructor() { this.horizons = ['NOW','3D','2W','1M','2M']; }
    create({subjectId,signalScore=0,conditions={},lens='m24'}) {
      const confidenceBase = Math.max(0.15, Math.min(0.85, 0.50 + Math.abs(signalScore)*0.30));
      const decay = {NOW:1, '3D':0.86, '2W':0.66, '1M':0.50, '2M':0.34};
      return this.horizons.map(h => record('FORECAST_INSTANCE', {
        horizon:h,
        lens,
        direction: h === 'NOW' || h === '3D' ? (signalScore > .18 ? 'UP' : signalScore < -.18 ? 'DOWN' : 'NEUTRAL') : 'SCENARIO',
        conditions,
        calibrationState:'UNSCORED'
      }, {
        subjectId,
        confidence: +(confidenceBase * decay[h]).toFixed(2),
        evidenceStatus:EVIDENCE.PLAUSIBLE_INTERPRETATION
      }));
    }
    score(forecast, outcome) {
      return record('OUTCOME_INSTANCE', {
        forecastId: forecast.id,
        horizon: forecast.data.horizon,
        realizedReturn: outcome.realizedReturn,
        maxDrawdown: outcome.maxDrawdown ?? null,
        directionCorrect: outcome.directionCorrect ?? null,
        note: outcome.note || ''
      }, {subjectId:forecast.subjectId,evidenceStatus:EVIDENCE.MECHANISM_VISIBLE,confidence:1});
    }
  }

  class TransactionEngine {
    constructor({mode='SIMULATED_ONLY'}={}) { this.mode=mode; }
    create(spec) {
      return record('TRANSACTION_INSTANCE', {
        ...spec,
        mode:'PAPER',
        userStatus: spec.userStatus || 'KANDIDAAT',
        auditStatus: spec.auditStatus || 'PREPARE',
        auditTrail: [{state:spec.auditStatus || 'PREPARE',at:new Date().toISOString()}]
      }, {subjectId:spec.asset,evidenceStatus:EVIDENCE.PLAUSIBLE_INTERPRETATION});
    }
    advance(tx, nextAuditStatus) {
      if (this.mode !== 'SIMULATED_ONLY') throw new Error('M24 v0.1 forbids live transaction execution.');
      const current = AUDIT_STATUS.indexOf(tx.data.auditStatus);
      const next = AUDIT_STATUS.indexOf(nextAuditStatus);
      if (next !== current + 1) throw new Error(`Invalid audit transition ${tx.data.auditStatus} → ${nextAuditStatus}`);
      const copy = structuredClone(tx);
      copy.data.auditStatus = nextAuditStatus;
      copy.data.auditTrail.push({state:nextAuditStatus,at:new Date().toISOString(),mode:'PAPER'});
      return copy;
    }
  }

  class Runtime {
    constructor({provider,seedRecords=[]}) {
      if (!provider) throw new Error('M24 requires a provider adapter.');
      this.provider = provider;
      this.store = new QubusStore(seedRecords);
      this.trickster = new TricksterEngine();
      this.forecast = new ForecastEngine();
      this.transactions = new TransactionEngine({mode:'SIMULATED_ONLY'});
    }
    async snapshot(asset, context={}) {
      const market = await this.provider.getMarketState(asset, context);
      const meaning = await this.provider.getMeaningState(asset, context);
      const cross = await this.provider.getCrossAssetState(asset, context);
      const marketRec = this.store.add(record('MARKET_STATE', market, {subjectId:asset,window:context.window,resolution:context.resolution,evidenceStatus:EVIDENCE.MECHANISM_VISIBLE,confidence:.95,provenance:market.provenance || []}));
      const meaningRec = this.store.add(record('MEANING_STATE', meaning, {subjectId:asset,window:context.window,resolution:context.resolution,evidenceStatus:EVIDENCE.PLAUSIBLE_INTERPRETATION,confidence:meaning.confidence ?? .6,provenance:meaning.provenance || []}));
      const crossRecs = (Array.isArray(cross)?cross:[]).map((item,index)=>this.store.add(record('CROSS_ASSET_STATE', item, {
        subjectId:item.key || item.name || `CROSS_${index}`,
        window:context.window,
        resolution:context.resolution,
        evidenceStatus:item.status==='OK'?EVIDENCE.MECHANISM_VISIBLE:EVIDENCE.PLAUSIBLE_INTERPRETATION,
        confidence:item.status==='OK'?.9:.35,
        provenance:item.provenance || []
      })));
      const trick = this.store.add(this.trickster.assess({subjectId:asset,narrativeScore:meaning.score,mechanismScore:market.mechanismScore,mechanisms:market.mechanisms || [],supportingIds:[marketRec.id,meaningRec.id,...crossRecs.map(r=>r.id)]}));
      return {market,meaning,cross,trick,marketRec,meaningRec,crossRecs};
    }
  }

  return {EVIDENCE,USER_STATUS,AUDIT_STATUS,record,QubusStore,TricksterEngine,ForecastEngine,TransactionEngine,Runtime};
})();
