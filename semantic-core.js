(() => {
  const SCHEMA='creabundalo.semantic-event.v1';
  const VERSION=1;

  function uid(prefix='evt'){
    return globalThis.crypto?.randomUUID
      ? prefix+'_'+crypto.randomUUID()
      : prefix+'_'+Date.now()+'_'+Math.random().toString(16).slice(2);
  }
  function nowIso(){return new Date().toISOString()}
  function safeText(value,max=5000){
    return String(value??'').replace(/\s+/g,' ').trim().slice(0,max);
  }
  function ensureState(state){
    state ||= {};
    state.nodes=Array.isArray(state.nodes)?state.nodes:[];
    state.currentId=state.currentId || state.nodes[0]?.id || null;
    state.lens=state.lens || 'all';
    state.semantic ||= {};
    state.semantic.version=VERSION;
    state.semantic.events=Array.isArray(state.semantic.events)?state.semantic.events:[];
    state.semantic.appliedEventIds=Array.isArray(state.semantic.appliedEventIds)?state.semantic.appliedEventIds:[];
    const positions=state.semantic.events.map(e=>Number(e.streamPosition)).filter(Number.isFinite);
    const inferred=positions.length?Math.max(...positions)+1:0;
    state.semantic.nextPosition=Math.max(Number(state.semantic.nextPosition)||0,inferred);
    return state;
  }
  function byId(state,id){return state.nodes.find(n=>n.id===id)||null}
  function ancestors(state,id){
    const out=[]; let n=byId(state,id); const seen=new Set();
    while(n && !seen.has(n.id)){
      seen.add(n.id); out.unshift(n); n=n.parentId?byId(state,n.parentId):null;
    }
    return out;
  }
  function isDescendant(state,nodeId,candidateAncestorId){
    let n=byId(state,nodeId); const seen=new Set();
    while(n && n.parentId && !seen.has(n.id)){
      seen.add(n.id);
      if(n.parentId===candidateAncestorId) return true;
      n=byId(state,n.parentId);
    }
    return false;
  }
  function makeEvent(type,payload={},source={}){
    return {
      schema:SCHEMA,
      eventId:uid(),
      type:String(type),
      occurredAt:nowIso(),
      source:{
        surface:safeText(source.surface||'creabundalo-ui',80),
        adapter:safeText(source.adapter||'',80),
        host:safeText(source.host||'',200),
        actor:safeText(source.actor||'user',80)
      },
      payload
    };
  }
  function validateEvent(event){
    return !!(
      event && event.schema===SCHEMA &&
      typeof event.eventId==='string' &&
      typeof event.type==='string' &&
      typeof event.occurredAt==='string' &&
      event.payload && typeof event.payload==='object'
    );
  }
  function rememberEvent(state,event){
    state.semantic.events.push(event);
    state.semantic.appliedEventIds.push(event.eventId);
    if(state.semantic.events.length>250) state.semantic.events=state.semantic.events.slice(-250);
    if(state.semantic.appliedEventIds.length>10000) state.semantic.appliedEventIds=state.semantic.appliedEventIds.slice(-10000);
  }
  function apply(state,event,{record=true}={}){
    state=ensureState(state);
    if(!validateEvent(event)) throw new Error('INVALID_SEMANTIC_EVENT');
    if(state.semantic.appliedEventIds.includes(event.eventId)) return {state,changed:false,deduplicated:true};

    const p=event.payload||{};
    let changed=false;

    switch(event.type){
      case 'PROJECTION_SEEDED': {
        const projection=p.projection||{};
        state.nodes=structuredClone(Array.isArray(projection.nodes)?projection.nodes:[]);
        state.currentId=projection.currentId||state.nodes[0]?.id||null;
        state.lens=projection.lens||'all';
        changed=true;
        break;
      }
      case 'NODE_CREATED': {
        if(typeof p.node?.id!=='string') throw new Error('NODE_ID_REQUIRED');
        if(byId(state,p.node.id)) break;
        const node={
          id:p.node.id,
          title:safeText(p.node.title,500)||'Nieuwe node',
          parentId:p.node.parentId||null,
          edgeLabel:safeText(p.node.edgeLabel,1000)||null,
          kind:safeText(p.node.kind||'branch',40),
          scope:safeText(p.node.scope||'work',40),
          status:safeText(p.node.status||'active',40),
          createdAt:Number(p.node.createdAt)||Date.parse(event.occurredAt)||0,
          source:safeText(p.node.source||event.source.surface,80),
          externalRef:p.node.externalRef||null,
          provenance:p.node.provenance||{
            eventId:event.eventId,
            surface:event.source.surface,
            adapter:event.source.adapter||null,
            host:event.source.host||null,
            occurredAt:event.occurredAt
          }
        };
        if(node.parentId && !byId(state,node.parentId)) node.parentId=state.currentId||state.nodes[0]?.id||null;
        state.nodes.push(node);
        if(p.focus!==false) state.currentId=node.id;
        changed=true;
        break;
      }
      case 'NODE_FOCUSED': {
        if(byId(state,p.nodeId) && state.currentId!==p.nodeId){
          state.currentId=p.nodeId; changed=true;
        }
        break;
      }
      case 'NODE_KIND_SET': {
        const n=byId(state,p.nodeId);
        if(n && typeof p.kind==='string' && n.kind!==p.kind){
          n.kind=safeText(p.kind,40); changed=true;
        }
        break;
      }
      case 'NODE_STATUS_SET': {
        const n=byId(state,p.nodeId);
        if(n && typeof p.status==='string' && n.status!==p.status){
          n.status=safeText(p.status,40); changed=true;
        }
        break;
      }
      case 'NODE_REPARENTED': {
        const n=byId(state,p.nodeId);
        const parent=p.parentId?byId(state,p.parentId):null;
        if(n && (!p.parentId || parent)){
          if(p.parentId===n.id || (p.parentId && isDescendant(state,p.parentId,n.id))) throw new Error('GRAPH_CYCLE_BLOCKED');
          if(n.parentId!==p.parentId){n.parentId=p.parentId||null;changed=true;}
        }
        break;
      }
      case 'NODE_EDGE_LABEL_SET': {
        const n=byId(state,p.nodeId);
        const label=safeText(p.edgeLabel,1000)||null;
        if(n && n.edgeLabel!==label){n.edgeLabel=label;changed=true;}
        break;
      }
      case 'LENS_SET': {
        const lens=safeText(p.lens||'all',40);
        if(state.lens!==lens){state.lens=lens;changed=true;}
        break;
      }
      case 'NODE_PARKED': {
        const n=byId(state,p.nodeId);
        if(n){
          n.status='paused';
          if(p.focusParent!==false && n.parentId && byId(state,n.parentId)) state.currentId=n.parentId;
          changed=true;
        }
        break;
      }
      default:
        throw new Error('UNSUPPORTED_SEMANTIC_EVENT:'+event.type);
    }

    if(record) rememberEvent(state,event);
    return {state,changed,deduplicated:false,event};
  }
  function dispatch(state,type,payload={},source={}){
    state=ensureState(state);
    const event=makeEvent(type,payload,source);
    event.streamPosition=state.semantic.nextPosition++;
    return apply(state,event,{record:true});
  }
  function importEvent(state,event,mapper){
    if(typeof mapper!=='function') throw new Error('IMPORT_MAPPER_REQUIRED');
    const mapped=mapper(event,ensureState(state));
    if(!mapped) return {state,changed:false,ignored:true};
    const events=Array.isArray(mapped)?mapped:[mapped];
    let changed=false;
    for(const e of events){
      const result=apply(state,e,{record:true});
      changed ||= result.changed;
    }
    return {state,changed};
  }
  function audit(state,{limit=100}={}){
    state=ensureState(state);
    return state.semantic.events.slice(-limit);
  }
  function emptyState(){
    return ensureState({nodes:[],currentId:null,lens:'all'});
  }
  function replay(events=[]){
    const ordered=[...events].sort((a,b)=>{
      const ap=Number.isFinite(Number(a.streamPosition))?Number(a.streamPosition):Number.MAX_SAFE_INTEGER;
      const bp=Number.isFinite(Number(b.streamPosition))?Number(b.streamPosition):Number.MAX_SAFE_INTEGER;
      if(ap!==bp) return ap-bp;
      const at=Date.parse(a.occurredAt)||0,bt=Date.parse(b.occurredAt)||0;
      if(at!==bt) return at-bt;
      return String(a.eventId).localeCompare(String(b.eventId));
    });
    let state=emptyState();
    for(const event of ordered){
      const result=apply(state,event,{record:true});
      state=result.state;
      if(Number.isFinite(Number(event.streamPosition))){
        state.semantic.nextPosition=Math.max(state.semantic.nextPosition,Number(event.streamPosition)+1);
      }
    }
    return state;
  }
  function projection(state){
    state=ensureState(state);
    return {
      nodes:structuredClone(state.nodes),
      currentId:state.currentId,
      lens:state.lens
    };
  }

  window.CreaSemanticCore={
    SCHEMA,VERSION,uid,safeText,ensureState,byId,ancestors,
    makeEvent,validateEvent,apply,dispatch,importEvent,audit,emptyState,replay,projection
  };
})();