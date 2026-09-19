(() => {
  const EVENT_PREFIX='semantic:event:v1:';
  const PROJECTION_ID='semantic:projection:v1';
  const LEGACY_AUDIT_ID='semantic:legacy-audit:v05';

  function eventRecordId(eventId){return EVENT_PREFIX+eventId}

  function projectionEnvelope(state){
    return {
      type:'CREABUNDALO_SEMANTIC_PROJECTION',
      version:1,
      savedAt:new Date().toISOString(),
      graph:window.CreaSemanticCore.projection(state),
      operational:{
        integrations:structuredClone(state.integrations||{})
      }
    };
  }

  async function listEvents(){
    const records=await window.CreaVault.listJSON(EVENT_PREFIX);
    return records
      .map(r=>r.value)
      .filter(window.CreaSemanticCore.validateEvent)
      .sort((a,b)=>{
        const ap=Number.isFinite(Number(a.streamPosition))?Number(a.streamPosition):Number.MAX_SAFE_INTEGER;
        const bp=Number.isFinite(Number(b.streamPosition))?Number(b.streamPosition):Number.MAX_SAFE_INTEGER;
        if(ap!==bp) return ap-bp;
        const at=Date.parse(a.occurredAt)||0,bt=Date.parse(b.occurredAt)||0;
        if(at!==bt) return at-bt;
        return String(a.eventId).localeCompare(String(b.eventId));
      });
  }

  async function loadProjectionEnvelope(){
    return window.CreaVault.loadJSON(PROJECTION_ID);
  }

  function seedEventFromState(state){
    const event=window.CreaSemanticCore.makeEvent(
      'PROJECTION_SEEDED',
      {projection:window.CreaSemanticCore.projection(state)},
      {surface:'migration',actor:'system'}
    );
    event.streamPosition=0;
    return event;
  }

  async function ensureMigrated(state){
    state=window.CreaSemanticCore.ensureState(state);
    const existing=await window.CreaVault.listRecordMetadata(EVENT_PREFIX);
    if(existing.length){
      const restored=await restore();
      return {state:restored,migrated:false,eventCount:existing.length};
    }

    const seed=seedEventFromState(state);
    const legacyEvents=Array.isArray(state.semantic?.events)?structuredClone(state.semantic.events):[];
    const projection=projectionEnvelope(state);

    const upsert=[{
      id:PROJECTION_ID,
      value:projection,
      privacyClass:'PRIVATE'
    }];
    if(legacyEvents.length){
      upsert.push({
        id:LEGACY_AUDIT_ID,
        value:{
          type:'CREABUNDALO_LEGACY_SEMANTIC_AUDIT',
          migratedAt:new Date().toISOString(),
          sourceVersion:'v0.5-inline',
          events:legacyEvents
        },
        privacyClass:'PRIVATE'
      });
    }

    await window.CreaVault.commitJSONBatch({
      append:[{
        id:eventRecordId(seed.eventId),
        value:seed,
        privacyClass:'PRIVATE'
      }],
      upsert
    });

    const restored=window.CreaSemanticCore.replay([seed]);
    restored.integrations=structuredClone(state.integrations||{});
    return {state:restored,migrated:true,eventCount:1};
  }

  async function commit(state,events=[]){
    state=window.CreaSemanticCore.ensureState(state);
    const valid=(events||[]).filter(window.CreaSemanticCore.validateEvent);

    const metadata=await window.CreaVault.listRecordMetadata(EVENT_PREFIX);
    const existingIds=new Set(metadata.map(m=>m.id));
    const append=valid
      .filter(e=>!existingIds.has(eventRecordId(e.eventId)))
      .map(e=>({
        id:eventRecordId(e.eventId),
        value:e,
        privacyClass:'PRIVATE'
      }));

    await window.CreaVault.commitJSONBatch({
      append,
      upsert:[{
        id:PROJECTION_ID,
        value:projectionEnvelope(state),
        privacyClass:'PRIVATE'
      }]
    });

    return {
      appended:append.length,
      deduplicated:valid.length-append.length,
      projectionSaved:true
    };
  }

  async function restore(){
    const [events,projection]=await Promise.all([
      listEvents(),
      loadProjectionEnvelope()
    ]);
    if(!events.length) return null;

    const replayed=window.CreaSemanticCore.replay(events);
    replayed.integrations=structuredClone(projection?.operational?.integrations||{});
    return replayed;
  }

  function stable(value){
    if(Array.isArray(value)) return value.map(stable);
    if(value && typeof value==='object'){
      const out={};
      for(const key of Object.keys(value).sort()) out[key]=stable(value[key]);
      return out;
    }
    return value;
  }

  function comparable(state){
    const graph=window.CreaSemanticCore.projection(state);
    return stable(graph);
  }

  async function hashObject(value){
    const text=JSON.stringify(stable(value));
    const bytes=new TextEncoder().encode(text);
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  async function verifyReplay(currentState){
    const events=await listEvents();
    if(!events.length) return {ok:false,error:'NO_EVENTS'};
    const replayed=window.CreaSemanticCore.replay(events);
    const currentHash=await hashObject(comparable(currentState));
    const replayHash=await hashObject(comparable(replayed));
    return {
      ok:currentHash===replayHash,
      eventCount:events.length,
      currentHash,
      replayHash,
      replayed
    };
  }

  async function stats(){
    const [events,projection,legacy]=await Promise.all([
      listEvents(),
      loadProjectionEnvelope(),
      window.CreaVault.loadJSON(LEGACY_AUDIT_ID)
    ]);
    return {
      eventCount:events.length,
      firstEventAt:events[0]?.occurredAt||null,
      lastEventAt:events.at(-1)?.occurredAt||null,
      projectionSavedAt:projection?.savedAt||null,
      legacyEventCount:Array.isArray(legacy?.events)?legacy.events.length:0
    };
  }

  window.CreaSemanticEventStore={
    EVENT_PREFIX,PROJECTION_ID,LEGACY_AUDIT_ID,
    ensureMigrated,commit,restore,listEvents,verifyReplay,stats
  };
})();