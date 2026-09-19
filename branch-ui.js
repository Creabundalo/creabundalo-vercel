const KEY = 'creabundalo.branch-ui.v0';

const seed = {
  currentId: 'branch-ui',
  lens: 'all',
  nodes: [
    {id:'root', title:'Creabundalo', parentId:null, edgeLabel:null, kind:'root', scope:'work', status:'active', createdAt:Date.now()-600000},
    {id:'als', title:'ALS / ziekteonderzoek', parentId:'root', edgeLabel:'Hoe past dit in het bredere onderzoek?', kind:'branch', scope:'work', status:'paused', createdAt:Date.now()-500000},
    {id:'systems', title:'Systeemdenkers / NODE Atlas', parentId:'als', edgeLabel:'Welke systeemdenkers veranderden het gezondheidsmodel?', kind:'branch', scope:'work', status:'paused', createdAt:Date.now()-450000},
    {id:'power', title:'Macht → autoriteit → legitimiteit', parentId:'systems', edgeLabel:'Wie mag regels bepalen en waarom accepteren anderen dat?', kind:'branch', scope:'work', status:'paused', createdAt:Date.now()-400000},
    {id:'branch-ui', title:'Branch UI · één scherm', parentId:'root', edgeLabel:'Hoe voorkom ik dat ik mijn zijtakken en context kwijtraak?', kind:'project', scope:'work', status:'active', createdAt:Date.now()-250000},
    {id:'ip', title:'Creabundalo IP Estate', parentId:'branch-ui', edgeLabel:'Hoe bescherm ik wat hier uniek aan is?', kind:'branch', scope:'work', status:'paused', createdAt:Date.now()-180000},
    {id:'build', title:'Bouw Branch UI v0', parentId:'branch-ui', edgeLabel:'Kun je dit hier gewoon werkend bouwen?', kind:'action', scope:'work', status:'active', createdAt:Date.now()-60000}
  ]
};

let state = window.CreaSemanticCore.ensureState(load());
let semanticOutbox = [];
let semanticCommitPromise = null;
let semanticRevision = 0;
let semanticCommittedRevision = 0;
let zoom = 1;
let pan = {x: 120, y: 80};
let dragging = false;
let dragStart = null;

const $ = id => document.getElementById(id);
const stage = $('stage');
const viewport = $('viewport');
const edgeSvg = $('edgeSvg');
const edgeLabels = $('edgeLabels');
const nodeLayer = $('nodes');
const input = $('commandInput');
const vaultButton = $('vaultButton');
const vaultDialog = $('vaultDialog');
const vaultStatusText = $('vaultStatusText');
const vaultPassphrase = $('vaultPassphrase');
const vaultRecoveryInput = $('vaultRecoveryInput');
const recoveryBox = $('recoveryBox');
const vaultRecoveryOutput = $('vaultRecoveryOutput');
const vaultImportInput = $('vaultImportInput');
const scalewaySyncToken = $('scalewaySyncToken');
const overlayExtensionId = $('overlayExtensionId');
const overlayBridgeStatus = $('overlayBridgeStatus');
const deviceBundleInput = $('deviceBundleInput');
let multiDeviceConflicts = [];
let semanticCloudSyncPromise = null;
let lastSemanticCloudSyncAt = 0;
const AUTO_SEMANTIC_SYNC_MS = 2*60*1000;

function uid(prefix='n'){
  return window.CreaSemanticCore.uid(prefix);
}
function coreDispatch(type,payload={},source={surface:'creabundalo-ui'}){
  const result=window.CreaSemanticCore.dispatch(state,type,payload,source);
  state=result.state;
  if(result.event) semanticOutbox.push(result.event);
  return result;
}
function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(raw) return JSON.parse(raw);
  }catch{}
  return structuredClone(seed);
}
function save(){
  const status = window.CreaVault?.status?.();
  if(status?.initialized){
    if(status.unlocked){
      semanticRevision++;
      queueSemanticCommit();
    }
    return;
  }
  localStorage.setItem(KEY, JSON.stringify(state));
}

function queueSemanticCommit(){
  if(semanticCommitPromise) return semanticCommitPromise;

  semanticCommitPromise=(async()=>{
    let totalEvents=0;
    try{
      while(semanticCommittedRevision<semanticRevision || semanticOutbox.length){
        const targetRevision=semanticRevision;
        const batch=semanticOutbox.splice(0);
        const snapshot=structuredClone(state);

        try{
          const result=await window.CreaSemanticEventStore.commit(snapshot,batch);
          totalEvents+=result.appended||0;
          semanticCommittedRevision=targetRevision;
        }catch(err){
          semanticOutbox=[...batch,...semanticOutbox];
          await window.CreaVaultHealth?.error?.('local',err);
          throw err;
        }
      }
      await window.CreaVaultHealth?.success?.('local');
      window.CreaVaultPolicy?.maybeAutoContinuity?.().catch(()=>{});
      maybeAutoSemanticCloudSync().catch(()=>{});
      return {ok:true,events:totalEvents,revision:semanticCommittedRevision};
    }catch(err){
      console.error('Semantic commit failed',err);
      throw err;
    }finally{
      semanticCommitPromise=null;
    }
  })();

  return semanticCommitPromise;
}

async function commitSemanticNow(){
  semanticRevision++;
  return queueSemanticCommit();
}
function current(){
  return state.nodes.find(n => n.id === state.currentId) || state.nodes[0];
}
function byId(id){ return state.nodes.find(n => n.id === id); }
function children(id){ return state.nodes.filter(n => n.parentId === id); }
function ancestors(id){
  const out=[]; let n=byId(id);
  while(n){ out.unshift(n); n=n.parentId ? byId(n.parentId) : null; }
  return out;
}
function depth(id){ return Math.max(0, ancestors(id).length-1); }
function descendantSet(id){
  const set = new Set([id]);
  let changed=true;
  while(changed){
    changed=false;
    for(const n of state.nodes){
      if(n.parentId && set.has(n.parentId) && !set.has(n.id)){ set.add(n.id); changed=true; }
    }
  }
  return set;
}
function visibleNodeIds(){
  const lens = state.lens || 'all';
  if(lens==='all') return new Set(state.nodes.map(n=>n.id));
  let matches = [];
  if(lens==='action') matches = state.nodes.filter(n=>n.kind==='action');
  if(lens==='mail') matches = state.nodes.filter(n=>n.kind==='mail');
  if(lens==='project') matches = state.nodes.filter(n=>n.kind==='project');
  if(lens==='time') matches = state.nodes.filter(n=>n.when);
  if(lens==='work') matches = state.nodes.filter(n=>n.scope==='work');
  if(lens==='private') matches = state.nodes.filter(n=>n.scope==='private');
  const ids = new Set();
  for(const m of matches) ancestors(m.id).forEach(a=>ids.add(a.id));
  ids.add(state.currentId);
  ancestors(state.currentId).forEach(a=>ids.add(a.id));
  return ids;
}
function layout(visible){
  const positions = {};
  const levels = new Map();
  for(const n of state.nodes){
    if(!visible.has(n.id)) continue;
    const d = depth(n.id);
    if(!levels.has(d)) levels.set(d,[]);
    levels.get(d).push(n);
  }
  const xGap=280, yGap=145;
  [...levels.entries()].sort((a,b)=>a[0]-b[0]).forEach(([d,list])=>{
    list.sort((a,b)=>a.createdAt-b.createdAt);
    const total=(list.length-1)*xGap;
    list.forEach((n,i)=>{
      positions[n.id]={x:900 + i*xGap-total/2, y:120+d*yGap};
    });
  });
  return positions;
}
function svgPath(a,b){
  const mid=(a.y+b.y)/2;
  return `M ${a.x} ${a.y+38} C ${a.x} ${mid}, ${b.x} ${mid}, ${b.x} ${b.y-38}`;
}
function esc(s=''){
  return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function render(){
  const visible = visibleNodeIds();
  const pos = layout(visible);
  nodeLayer.innerHTML='';
  edgeLabels.innerHTML='';
  edgeSvg.innerHTML='';
  $('emptyState').classList.toggle('hidden', visible.size>0);

  for(const n of state.nodes){
    if(!visible.has(n.id)) continue;
    if(n.parentId && visible.has(n.parentId)){
      const a=pos[n.parentId], b=pos[n.id];
      if(a&&b){
        const path=document.createElementNS('http://www.w3.org/2000/svg','path');
        path.setAttribute('d',svgPath(a,b));
        path.setAttribute('class','edge '+(n.id===state.currentId?'active ':'')+(n.status==='paused'?'paused':''));
        edgeSvg.appendChild(path);

        const label=document.createElement('button');
        label.className='edge-label';
        label.style.left=((a.x+b.x)/2)+'px';
        label.style.top=((a.y+b.y)/2)+'px';
        label.innerHTML=esc(n.edgeLabel || 'volgende stap');
        label.title='Open branch: '+n.title;
        label.onclick=()=>focusNode(n.id);
        edgeLabels.appendChild(label);
      }
    }
  }

  for(const n of state.nodes){
    if(!visible.has(n.id)) continue;
    const p=pos[n.id]; if(!p) continue;
    const el=document.createElement('article');
    el.className='node '+(n.id===state.currentId?'current ':'')+(n.status==='paused'?'paused ':'')+(n.kind==='project'?'project':'');
    el.style.left=p.x+'px'; el.style.top=p.y+'px';
    el.innerHTML=`
      <div class="kicker">${esc(n.kind || 'branch')} · ${esc(n.status || 'active')}</div>
      <div class="title">${esc(n.title)}</div>
      <div class="meta"><span><i class="pin"></i> depth ${depth(n.id)}</span><span>${esc(n.scope||'')}</span></div>
    `;
    el.onclick=()=>focusNode(n.id);
    nodeLayer.appendChild(el);
  }

  const chain=ancestors(state.currentId);
  $('breadcrumb').textContent=chain.map(n=>n.title).join('  ›  ');
  $('depthBadge').textContent='DEPTH '+depth(state.currentId);
  const c=current();
  $('currentMeta').textContent=`CURRENT: ${c.title} · ${c.kind.toUpperCase()} · ${c.status.toUpperCase()}`;
  document.querySelectorAll('.lens').forEach(b=>b.classList.toggle('active',b.dataset.lens===state.lens));
  $('continuityPanel').classList.toggle('hidden',state.lens!=='continuity');
  $('auditPanel').classList.toggle('hidden',state.lens!=='audit');
  if(state.lens==='continuity') refreshContinuityHealth();
  if(state.lens==='audit') renderAudit();
  applyTransform();
  save();
}
function applyTransform(){
  stage.style.transform=`translate(${pan.x}px,${pan.y}px) scale(${zoom})`;
  $('zoomReset').textContent=Math.round(zoom*100)+'%';
}
function focusNode(id){
  if(!byId(id)) return;
  coreDispatch('NODE_FOCUSED',{nodeId:id});
  coreDispatch('LENS_SET',{lens:'all'});
  render();
  centerCurrent();
}
function centerCurrent(){
  const visible=visibleNodeIds();
  const pos=layout(visible)[state.currentId];
  if(!pos) return;
  const box=viewport.getBoundingClientRect();
  pan.x=box.width/2-pos.x*zoom;
  pan.y=Math.min(120, box.height*.22)-pos.y*zoom;
  applyTransform();
}
function goBack(){
  const c=current();
  if(c?.parentId) focusNode(c.parentId);
}
function goRoot(){
  focusNode(ancestors(state.currentId)[0]?.id || 'root');
}
function promote(){
  const c=current();
  if(!c) return;
  coreDispatch('NODE_KIND_SET',{nodeId:c.id,kind:'project'});
  coreDispatch('NODE_STATUS_SET',{nodeId:c.id,status:'active'});
  render();
}
function park(){
  const c=current();
  if(!c) return;
  coreDispatch('NODE_PARKED',{nodeId:c.id,focusParent:true});
  render();
  centerCurrent();
}
function setLens(lens){
  coreDispatch('LENS_SET',{lens});
  render();
}
function titleFrom(text){
  const clean=text.replace(/\s+/g,' ').trim();
  return clean.length>52 ? clean.slice(0,49)+'…' : clean;
}
function addQuestion(text){
  const parent=current();
  const node={
    id:uid('node'),
    title:titleFrom(text),
    parentId:parent.id,
    edgeLabel:text,
    kind:'branch',
    scope:parent.scope || 'work',
    status:'active',
    createdAt:Date.now()
  };
  coreDispatch('NODE_CREATED',{node,focus:true});
  coreDispatch('LENS_SET',{lens:'all'});
  render();
  centerCurrent();
}
function handleCommand(raw){
  const text=raw.trim(); if(!text) return;
  const l=text.toLocaleLowerCase('nl-NL');
  if(/^(actielijst|acties|toon acties)/.test(l)) return setLens('action');
  if(/^(mail|e-?mail|toon mail)/.test(l)) return setLens('mail');
  if(/^(projecten|toon projecten)/.test(l)) return setLens('project');
  if(/^(tijd|tijdlijn)/.test(l)) return setLens('time');
  if(/^(werk|alleen werk)/.test(l)) return setLens('work');
  if(/^(privé|prive|alleen privé|alleen prive)/.test(l)) return setLens('private');
  if(/^(alles|toon alles)/.test(l)) return setLens('all');
  if(/^(terug|ga terug|back)$/.test(l)) return goBack();
  if(/^(root|naar root|terug naar root)$/.test(l)) return goRoot();
  if(/maak.*project|promoveer.*project/.test(l)) return promote();
  if(/^(parkeer|parkeer branch|pauzeer branch)/.test(l)) return park();
  addQuestion(text);
}






async function runSemanticCloudSync({manual=false}={}){
  if(semanticCloudSyncPromise) return semanticCloudSyncPromise;

  semanticCloudSyncPromise=(async()=>{
    try{
      const vault=window.CreaVault.status();
      const provider=window.CreaVaultStorage.get('SCALEWAY_SYNC');
      if(!vault.initialized||!vault.unlocked) throw new Error('VAULT_UNLOCK_REQUIRED');
      if(provider?.mode!=='AVAILABLE') throw new Error('SCALEWAY_SYNC_NOT_ACTIVE');
      if(multiDeviceConflicts.length){
        if(manual) vaultMessage('Los eerst de bestaande multi-device conflicten op.',true);
        return {skipped:'CONFLICTS_PENDING'};
      }

      await commitSemanticNow();
      const result=await window.CreaSemanticCloudSync.sync(state);
      state=window.CreaSemanticCore.ensureState(result.state||state);
      semanticOutbox=[];
      semanticRevision=0;
      semanticCommittedRevision=0;
      multiDeviceConflicts=result.conflicts||[];
      lastSemanticCloudSyncAt=Date.now();

      await window.CreaVaultHealth.success('semanticSync',{
        remoteObjects:result.remoteObjects,
        uploaded:result.uploaded,
        downloaded:result.downloaded,
        merged:result.merged,
        conflicts:result.conflicts.length
      });

      render();
      centerCurrent();
      renderConflicts();
      updateDeviceUi();
      await refreshContinuityHealth();

      const text=
        'Event sync: '+result.uploaded+' upload · '+result.downloaded+' download · '+
        result.merged+' merged · '+result.conflicts.length+' conflict(en).';
      $('multiDeviceStatus').textContent=text;

      if(result.remoteTruncated){
        vaultMessage('Event sync bereikte de huidige pilotlimiet. Verder pagineren volgt in een volgende schaalstap.',true);
      }else if(result.conflicts.length){
        vaultMessage(text+' Kies per conflict lokaal of remote.',true);
      }else if(manual){
        vaultMessage(text);
      }
      return result;
    }catch(err){
      await window.CreaVaultHealth?.error?.('semanticSync',err);
      if(manual) vaultMessage('Semantic event sync mislukt: '+err.message,true);
      throw err;
    }finally{
      semanticCloudSyncPromise=null;
    }
  })();

  return semanticCloudSyncPromise;
}

async function maybeAutoSemanticCloudSync({force=false}={}){
  if(semanticCloudSyncPromise) return {skipped:'BUSY'};
  const vault=window.CreaVault?.status?.();
  const provider=window.CreaVaultStorage?.get?.('SCALEWAY_SYNC');
  if(!vault?.initialized||!vault.unlocked) return {skipped:'VAULT_LOCKED'};
  if(provider?.mode!=='AVAILABLE') return {skipped:'SYNC_INACTIVE'};
  if(multiDeviceConflicts.length) return {skipped:'CONFLICTS_PENDING'};
  if(!force && Date.now()-lastSemanticCloudSyncAt<AUTO_SEMANTIC_SYNC_MS) return {skipped:'TOO_SOON'};
  return runSemanticCloudSync({manual:false});
}

function updateDeviceUi(){
  const d=window.CreaSemanticDevice?.status?.()||{};
  const identity=$('deviceIdentityText');
  const clock=$('deviceClockText');
  if(!d.initialized){
    identity.textContent='Device identity niet geïnitialiseerd';
    clock.textContent='';
    return;
  }
  identity.textContent=(d.label||'Dit apparaat')+' · '+d.deviceId;
  clock.textContent='seq '+d.seq+' · lamport '+d.lamport+' · '+Object.keys(d.vector||{}).length+' device(s) gezien';
}

async function renameDevice(){
  const current=window.CreaSemanticDevice.status();
  const name=prompt('Naam voor dit apparaat',current.label||'Dit apparaat');
  if(name===null) return;
  await window.CreaSemanticDevice.setLabel(name);
  updateDeviceUi();
}

function downloadJson(filename,value){
  const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=filename;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

async function exportDeviceBundle(){
  const vault=window.CreaVault.status();
  if(!vault.initialized||!vault.unlocked){
    vaultMessage('Ontgrendel eerst de Vault.',true);
    return;
  }
  try{
    await commitSemanticNow();
    const bundle=await window.CreaSemanticEventStore.exportSharedBundle();
    const encrypted=await window.CreaVault.sealJSON('semantic-device-bundle-v1',bundle);
    const d=window.CreaSemanticDevice.status();
    downloadJson(
      'creabundalo-device-'+(d.deviceId||'unknown').slice(0,16)+'-'+new Date().toISOString().slice(0,10)+'.enc.json',
      encrypted
    );
    $('multiDeviceStatus').textContent='Encrypted device bundle geëxporteerd · '+bundle.events.length+' gedeelde events.';
  }catch(err){
    vaultMessage('Device bundle export mislukt: '+err.message,true);
  }
}

function conflictValue(event){
  const p=event?.payload||{};
  switch(event?.type){
    case 'NODE_KIND_SET': return p.kind;
    case 'NODE_STATUS_SET': return p.status;
    case 'NODE_REPARENTED': return p.parentId;
    case 'NODE_EDGE_LABEL_SET': return p.edgeLabel;
    case 'NODE_PARKED': return 'paused';
    default: return JSON.stringify(p);
  }
}

function renderConflicts(){
  const list=$('conflictList');
  if(!list) return;
  list.innerHTML='';
  if(!multiDeviceConflicts.length) return;

  for(const conflict of multiDeviceConflicts){
    const row=document.createElement('article');
    row.className='audit-row';

    const left=document.createElement('div');
    left.innerHTML='<strong></strong><small></small>';
    left.querySelector('strong').textContent='CONFLICT';
    left.querySelector('small').textContent=conflict.mutationKey;

    const mid=document.createElement('div');
    mid.innerHTML='<small></small><code></code>';
    mid.querySelector('small').textContent='Lokaal';
    mid.querySelector('code').textContent=String(conflictValue(conflict.localEvent));

    const right=document.createElement('div');
    right.innerHTML='<small></small><code></code><div class="vault-actions"></div>';
    right.querySelector('small').textContent='Remote';
    right.querySelector('code').textContent=String(conflictValue(conflict.remoteEvent));
    const actions=right.querySelector('.vault-actions');

    const localButton=document.createElement('button');
    localButton.className='ghost';
    localButton.type='button';
    localButton.textContent='Houd lokaal';
    localButton.onclick=()=>resolveMultiDeviceConflict(conflict.id,'local');

    const remoteButton=document.createElement('button');
    remoteButton.className='ghost';
    remoteButton.type='button';
    remoteButton.textContent='Neem remote';
    remoteButton.onclick=()=>resolveMultiDeviceConflict(conflict.id,'remote');

    actions.append(localButton,remoteButton);
    row.append(left,mid,right);
    list.appendChild(row);
  }
}

async function resolveMultiDeviceConflict(conflictId,choice){
  const conflict=multiDeviceConflicts.find(c=>c.id===conflictId);
  if(!conflict) return;

  try{
    window.CreaSemanticDevice.observe(conflict.remoteEvent);

    const imported=window.CreaSemanticCore.apply(state,conflict.remoteEvent,{record:true});
    state=imported.state;
    if(!imported.deduplicated) semanticOutbox.push(conflict.remoteEvent);

    const winner=choice==='remote'?conflict.remoteEvent:conflict.localEvent;
    coreDispatch(
      winner.type,
      window.CreaSemanticEventStore.resolutionPayload(winner),
      {surface:'conflict-resolution',actor:'user'}
    );

    await commitSemanticNow();
    multiDeviceConflicts=multiDeviceConflicts.filter(c=>c.id!==conflictId);
    render();
    renderConflicts();
    updateDeviceUi();
    $('multiDeviceStatus').textContent=multiDeviceConflicts.length
      ? multiDeviceConflicts.length+' conflict(en) wachten nog op keuze.'
      : 'Alle multi-device conflicten opgelost en als causal resolution-events vastgelegd.';
    if(!multiDeviceConflicts.length) maybeAutoSemanticCloudSync({force:true}).catch(()=>{});
  }catch(err){
    vaultMessage('Conflict oplossen mislukt: '+err.message,true);
  }
}

async function importDeviceBundle(file){
  if(!file) return;
  const vault=window.CreaVault.status();
  if(!vault.initialized||!vault.unlocked){
    vaultMessage('Ontgrendel eerst de Vault.',true);
    deviceBundleInput.value='';
    return;
  }

  try{
    await commitSemanticNow();
    const envelope=JSON.parse(await file.text());
    const bundle=await window.CreaVault.openJSON('semantic-device-bundle-v1',envelope);
    const preview=await window.CreaSemanticEventStore.previewMerge(bundle);
    const result=await window.CreaSemanticEventStore.mergeBundle(bundle,state);

    state=window.CreaSemanticCore.ensureState(result.state||state);
    semanticOutbox=[];
    semanticRevision=0;
    semanticCommittedRevision=0;
    multiDeviceConflicts=preview.conflicts;

    render();
    centerCurrent();
    renderConflicts();
    updateDeviceUi();

    $('multiDeviceStatus').textContent=
      'Import: '+preview.incoming+' nieuw · '+result.appended+' conflictvrij gemerged · '+
      preview.conflicts.length+' conflict(en) · '+preview.deduplicated+' al bekend.';

    if(preview.conflicts.length){
      vaultMessage('Multi-device merge bevat '+preview.conflicts.length+' expliciete conflict(en). Kies per conflict lokaal of remote.',true);
    }else{
      vaultMessage('Multi-device bundle conflictvrij gemerged.');
    }
  }catch(err){
    $('multiDeviceStatus').textContent='Import mislukt: '+err.message;
    vaultMessage('Device bundle import mislukt: '+err.message,true);
  }finally{
    deviceBundleInput.value='';
  }
}

async function renderAudit(){
  const list=$('auditList');
  if(!list) return;

  let events=[];
  const vault=window.CreaVault?.status?.();
  if(vault?.initialized && vault.unlocked){
    try{
      await queueSemanticCommit();
      events=(await window.CreaSemanticEventStore.listEvents()).slice(-120).reverse();
    }catch{
      events=window.CreaSemanticCore.audit(state,{limit:120}).slice().reverse();
    }
  }else{
    events=window.CreaSemanticCore.audit(state,{limit:120}).slice().reverse();
  }

  list.innerHTML='';
  if(!events.length){
    const empty=document.createElement('div');
    empty.className='audit-empty';
    empty.textContent='Nog geen Semantic Core-events.';
    list.appendChild(empty);
    return;
  }
  for(const event of events){
    const row=document.createElement('article');
    row.className='audit-row';
    const left=document.createElement('div');
    const mid=document.createElement('div');
    const right=document.createElement('div');
    const time=new Date(event.occurredAt);
    left.innerHTML='<strong></strong><small></small>';
    left.querySelector('strong').textContent=event.type;
    left.querySelector('small').textContent=(Number.isNaN(time.getTime())?event.occurredAt:time.toLocaleString('nl-NL'))+
      (Number.isFinite(Number(event.streamPosition))?' · #'+event.streamPosition:'');
    mid.innerHTML='<code></code><small></small>';
    mid.querySelector('code').textContent=event.eventId;
    mid.querySelector('small').textContent=(event.source?.surface||'')+(event.source?.adapter?' · '+event.source.adapter:'');
    right.innerHTML='<code></code>';
    right.querySelector('code').textContent=JSON.stringify(event.payload);
    row.append(left,mid,right);
    list.appendChild(row);
  }
}

async function verifySemanticReplay(){
  const status=$('replayStatus');
  const vault=window.CreaVault?.status?.();
  if(!vault?.initialized || !vault.unlocked){
    status.textContent='Replay check vereist een ontgrendelde Vault.';
    status.classList.add('alert');
    return;
  }
  status.textContent='Replay controleren…';
  status.classList.remove('alert');
  try{
    await commitSemanticNow();
    const result=await window.CreaSemanticEventStore.verifyReplay(state);
    if(result.ok){
      status.textContent='REPLAY OK · '+result.eventCount+' events · hash '+result.currentHash.slice(0,12)+'…';
      status.classList.remove('alert');
    }else{
      status.textContent='REPLAY MISMATCH · projection '+(result.currentHash||'').slice(0,12)+'… · replay '+(result.replayHash||'').slice(0,12)+'…';
      status.classList.add('alert');
    }
  }catch(err){
    status.textContent='Replay check fout: '+err.message;
    status.classList.add('alert');
  }
}

function healthClass(status){
  if(status==='OK') return 'ok';
  if(status==='ERROR') return 'error';
  return 'warn';
}
async function refreshContinuityHealth(){
  if(!window.CreaVaultHealth) return;
  const h=await window.CreaVaultHealth.summary();
  const localStatus=window.CreaVault.status();
  const syncProvider=window.CreaVaultStorage.get('SCALEWAY_SYNC');
  const backupProvider=window.CreaVaultStorage.get('INDEPENDENT_BACKUP');

  $('healthLocalDot').className='continuity-dot '+healthClass(h.local.status);
  $('healthLocalText').textContent=(localStatus.initialized?'Vault aanwezig':'nog niet ingericht')+' · laatste save '+h.labels.local;

  $('healthScalewayDot').className='continuity-dot '+healthClass(h.scaleway.status);
  $('healthScalewayText').textContent=(syncProvider?.mode||'onbekend')+' · snapshot '+h.labels.scaleway+' · verificatie '+h.labels.scalewayVerified;

  $('healthSemanticSyncDot').className='continuity-dot '+healthClass(h.semanticSync?.status||'UNKNOWN');
  $('healthSemanticSyncText').textContent=(syncProvider?.mode||'onbekend')+' · events '+(h.labels.semanticSync||'nog nooit');

  $('healthBackupDot').className='continuity-dot '+healthClass(h.independent.status);
  $('healthBackupText').textContent=(backupProvider?.mode||'onbekend')+' · backup '+h.labels.independent+' · verificatie '+h.labels.independentVerified;

  $('healthRestoreDot').className='continuity-dot '+healthClass(h.restore.lastError?'ERROR':(h.restore.lastSuccess?'OK':'UNKNOWN'));
  $('healthRestoreText').textContent='laatste herstel '+h.labels.restore+(h.restore.lastSource?' · '+h.restore.lastSource:'');

  const warnings=window.CreaVaultPolicy?.continuityWarnings?.(h,{
    syncEnabled:syncProvider?.mode==='AVAILABLE',
    semanticSyncEnabled:syncProvider?.mode==='AVAILABLE',
    backupEnabled:backupProvider?.mode==='AVAILABLE'
  }) || [];
  const policyText=$('healthPolicyText');
  policyText.classList.toggle('alert',warnings.length>0);
  policyText.textContent=warnings.length
    ? 'Aandacht: '+warnings.join(' · ')
    : 'Continuïteit binnen policy. Privacy degradation is nooit een geldige fallback.';
}
async function sha256Text(text){
  const bytes=new TextEncoder().encode(text);
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function verifyContinuity(){
  const expected=await window.CreaVault.exportEncryptedSnapshot();
  const expectedHash=await sha256Text(expected);
  const results=[];

  try{
    if(window.CreaVaultStorage.get('SCALEWAY_SYNC')?.mode==='AVAILABLE'){
      const cloud=await window.CreaVaultStorage.read('SCALEWAY_SYNC',{privacyClass:'VAULT_HIGH'});
      if(!cloud) throw new Error('NO_SCALEWAY_SNAPSHOT');
      if(await sha256Text(cloud)!==expectedHash) throw new Error('SCALEWAY_HASH_MISMATCH');
      await window.CreaVaultHealth.verified('scaleway');
      results.push('Scaleway OK');
    }
  }catch(err){
    await window.CreaVaultHealth.error('scaleway',err);
    results.push('Scaleway fout');
  }

  try{
    if(window.CreaVaultStorage.get('INDEPENDENT_BACKUP')?.mode==='AVAILABLE'){
      const backup=await window.CreaVaultStorage.read('INDEPENDENT_BACKUP',{privacyClass:'VAULT_HIGH'});
      if(!backup) throw new Error('NO_INDEPENDENT_BACKUP');
      if(await sha256Text(backup)!==expectedHash) throw new Error('BACKUP_HASH_MISMATCH');
      await window.CreaVaultHealth.verified('independent');
      results.push('Backup OK');
    }
  }catch(err){
    await window.CreaVaultHealth.error('independent',err);
    results.push('Backup fout');
  }

  await refreshContinuityHealth();
  vaultMessage(results.length?results.join(' · '):'Geen actieve externe provider om te controleren.');
}


async function analyzeRetention(){
  const summary=$('retentionSummary');
  try{
    const preview=await window.CreaVaultPolicy.retentionPreview();
    summary.textContent=preview.total+' snapshots · bewaren '+preview.keep.length+' · opruimkandidaten '+preview.delete.length;
    summary.dataset.deleteCount=String(preview.delete.length);
    vaultMessage('Retentie-analyse gereed. Er is nog niets verwijderd.');
  }catch(err){
    summary.textContent='Analyse niet beschikbaar: '+err.message;
    summary.dataset.deleteCount='0';
    vaultMessage('Retentie-analyse mislukt: '+err.message,true);
  }
}
async function applyRetention(){
  const summary=$('retentionSummary');
  let preview;
  try{
    preview=await window.CreaVaultPolicy.retentionPreview();
  }catch(err){
    vaultMessage('Retentie-analyse mislukt: '+err.message,true);
    return;
  }
  if(!preview.delete.length){
    summary.textContent=preview.total+' snapshots · niets op te ruimen';
    return;
  }
  const ok=confirm(
    preview.delete.length+' oude encrypted backup(s) verwijderen? '+
    'Volgens de policy blijven '+preview.keep.length+' herstelpunten bewaard.'
  );
  if(!ok) return;
  try{
    const result=await window.CreaVaultPolicy.applyRetention();
    summary.textContent='Opgeruimd '+result.deleted+' · resterende herstelpunten '+result.preview.keep.length;
    vaultMessage(result.deleted+' oude encrypted backup(s) verwijderd volgens de retentiepolicy.');
  }catch(err){
    vaultMessage('Opruimen mislukt: '+err.message,true);
  }
}


function validateOverlayEvent(event){
  if(!event || event.schema!=='creabundalo.semantic-event.v1') return false;
  if(typeof event.eventId!=='string' || typeof event.sessionId!=='string') return false;
  return ['BRANCH_CREATED','NODE_FOCUSED','NODE_PROJECT_PROMOTED','NODE_REPARENTED'].includes(event.type);
}
function ensureOverlayState(){
  state.integrations ||= {};
  state.integrations.overlay ||= {sessions:{}};
  state.integrations.overlay.sessions ||= {};
  return state.integrations.overlay;
}
function overlaySession(event){
  const overlay=ensureOverlayState();
  let session=overlay.sessions[event.sessionId];
  if(session) return session;

  const parent=current();
  const sessionNodeId=uid('overlay');
  const adapter=event.source?.adapter || 'AI';
  const host=event.source?.host || '';
  const title='Overlay · '+adapter+(host?' · '+host:'');
  const node={
    id:sessionNodeId,
    title,
    parentId:parent.id,
    edgeLabel:'Semantic Overlay sessie',
    kind:'session',
    scope:parent.scope || 'work',
    status:'active',
    createdAt:Date.now(),
    source:'semantic-overlay',
    provenance:{
      source:'browser-extension',
      sessionId:event.sessionId,
      adapter,
      host,
      firstEventAt:event.occurredAt
    }
  };
  coreDispatch('NODE_CREATED',{node,focus:false},{
    surface:'browser-extension',
    adapter,
    host
  });
  session={
    sessionId:event.sessionId,
    rootNodeId:sessionNodeId,
    nodes:{root:sessionNodeId},
    adapter,
    host,
    importedAt:new Date().toISOString()
  };
  overlay.sessions[event.sessionId]=session;
  return session;
}
function mappedOverlayNode(session,externalId){
  return session.nodes?.[externalId] ? byId(session.nodes[externalId]) : null;
}
function safeOverlayText(value,max=5000){
  return String(value||'').replace(/\s+/g,' ').trim().slice(0,max);
}
function applyOverlayEvent(event){
  const session=overlaySession(event);
  const p=event.payload||{};

  if(event.type==='BRANCH_CREATED'){
    const ext=p.node||{};
    if(typeof ext.id!=='string') return;
    if(mappedOverlayNode(session,ext.id)) return;

    const parentNode=mappedOverlayNode(session,ext.parentId) || byId(session.rootNodeId);
    const webId=uid('ov');
    const node={
      id:webId,
      title:safeOverlayText(ext.title,500) || 'Overlay branch',
      parentId:parentNode?.id || session.rootNodeId,
      edgeLabel:safeOverlayText(ext.edgeLabel,1000) || 'Overlay branch',
      kind:['branch','project','action'].includes(ext.kind)?ext.kind:'branch',
      scope:parentNode?.scope || 'work',
      status:ext.status==='paused'?'paused':'active',
      createdAt:Number(ext.createdAt)||Date.now(),
      source:'semantic-overlay',
      externalRef:'overlay:'+event.sessionId+':'+ext.id,
      provenance:{
        source:'browser-extension',
        eventId:event.eventId,
        sessionId:event.sessionId,
        adapter:event.source?.adapter||session.adapter,
        host:event.source?.host||session.host,
        occurredAt:event.occurredAt
      }
    };
    coreDispatch('NODE_CREATED',{node,focus:false},{
      surface:'browser-extension',
      adapter:event.source?.adapter||session.adapter,
      host:event.source?.host||session.host
    });
    session.nodes[ext.id]=webId;
    session.lastEventAt=event.occurredAt;
    return;
  }

  const target=mappedOverlayNode(session,p.nodeId);
  if(event.type==='NODE_FOCUSED'){
    if(target) session.lastFocusedNodeId=target.id;
    session.lastEventAt=event.occurredAt;
    return;
  }
  if(event.type==='NODE_PROJECT_PROMOTED'){
    if(target){
      coreDispatch('NODE_KIND_SET',{nodeId:target.id,kind:'project'},{surface:'browser-extension',adapter:session.adapter,host:session.host});
      coreDispatch('NODE_STATUS_SET',{nodeId:target.id,status:'active'},{surface:'browser-extension',adapter:session.adapter,host:session.host});
    }
    session.lastEventAt=event.occurredAt;
    return;
  }
  if(event.type==='NODE_REPARENTED'){
    if(target){
      const newParent=mappedOverlayNode(session,p.parentId) || byId(session.rootNodeId);
      if(newParent && newParent.id!==target.id){
        coreDispatch('NODE_REPARENTED',{nodeId:target.id,parentId:newParent.id},{surface:'browser-extension',adapter:session.adapter,host:session.host});
      }
    }
    session.lastEventAt=event.occurredAt;
  }
}
async function connectOverlayBridge(){
  try{
    const id=overlayExtensionId.value.trim();
    window.CreaOverlayBridge.configure({id,remember:true});
    const status=await window.CreaOverlayBridge.status();
    overlayBridgeStatus.textContent='Gekoppeld · sessie '+status.sessionId.slice(0,8)+' · '+status.pending+' pending event(s).';
    $('overlayImportButton').disabled=status.pending===0;
    vaultMessage('Semantic Overlay gekoppeld. Context blijft pending totdat je hem importeert in de Vault.');
  }catch(err){
    overlayBridgeStatus.textContent='Koppelen mislukt: '+err.message;
    vaultMessage('Overlay Bridge koppelen mislukt: '+err.message,true);
  }
}
async function refreshOverlayBridgeStatus(){
  const stored=window.CreaOverlayBridge?.getId?.()||'';
  if(stored && !overlayExtensionId.value) overlayExtensionId.value=stored;
  if(!stored){
    overlayBridgeStatus.textContent='Nog niet gekoppeld. Importeren vereist een ontgrendelde Vault.';
    $('overlayImportButton').disabled=true;
    return;
  }
  try{
    const status=await window.CreaOverlayBridge.status();
    overlayBridgeStatus.textContent='Gekoppeld · sessie '+status.sessionId.slice(0,8)+' · '+status.pending+' pending event(s).';
    $('overlayImportButton').disabled=status.pending===0;
  }catch(err){
    overlayBridgeStatus.textContent='Extension niet bereikbaar: '+err.message;
    $('overlayImportButton').disabled=true;
  }
}
async function importOverlayContext(){
  const vault=window.CreaVault.status();
  if(!vault.initialized || !vault.unlocked){
    vaultMessage('Ontgrendel eerst de Vault. Overlay-events worden pas daarna geïmporteerd.',true);
    return;
  }
  let pulled;
  try{
    pulled=await window.CreaOverlayBridge.pull();
  }catch(err){
    vaultMessage('Overlay-events ophalen mislukt: '+err.message,true);
    return;
  }
  const events=(pulled.events||[]).filter(validateOverlayEvent);
  if(!events.length){
    overlayBridgeStatus.textContent='Geen pending context.';
    return;
  }

  try{
    for(const event of events) applyOverlayEvent(event);
    const overlay=ensureOverlayState();
    const lastSession=overlay.sessions[events.at(-1).sessionId];
    if(lastSession?.lastFocusedNodeId && byId(lastSession.lastFocusedNodeId)){
      coreDispatch('NODE_FOCUSED',{nodeId:lastSession.lastFocusedNodeId},{surface:'browser-extension',adapter:lastSession.adapter,host:lastSession.host});
    }
    await commitSemanticNow();
    await window.CreaVaultHealth?.success?.('local');
    await window.CreaOverlayBridge.ack(events.map(e=>e.eventId));
    render();
    centerCurrent();
    await refreshOverlayBridgeStatus();
    vaultMessage(events.length+' Semantic Overlay event(s) encrypted in de Creabundalo Vault en daarna ge-ACKed.');
  }catch(err){
    vaultMessage('Overlay import mislukt; events blijven pending: '+err.message,true);
  }
}

function vaultMessage(message,isError=false){
  vaultStatusText.textContent=message;
  vaultStatusText.dataset.error=isError?'1':'0';
}
function updateVaultUi(){
  const status=window.CreaVault?.status?.() || {mode:'UNAVAILABLE',initialized:false,unlocked:false};
  const labels={
    UNINITIALIZED:'VAULT · UIT',
    LOCKED:'VAULT · OP SLOT',
    UNLOCKED:'VAULT · OPEN',
    UNAVAILABLE:'VAULT · N/A'
  };
  vaultButton.textContent=labels[status.mode] || 'VAULT';
  vaultButton.classList.toggle('unlocked',!!status.unlocked);
  $('vaultSetupButton').disabled=!!status.initialized;
  $('vaultUnlockButton').disabled=!status.initialized || !!status.unlocked;
  $('vaultRecoverButton').disabled=!status.initialized || !!status.unlocked;
  $('vaultBackupButton').disabled=!status.initialized;
  $('vaultLockButton').disabled=!status.unlocked;
  const syncMode=window.CreaVaultStorage?.get?.('SCALEWAY_SYNC')?.mode || 'DISABLED';
  $('scalewaySyncButton').disabled=!status.initialized || syncMode!=='AVAILABLE';
  $('scalewayRestoreButton').disabled=syncMode!=='AVAILABLE';
  $('semanticSyncNowButton').disabled=!status.unlocked || syncMode!=='AVAILABLE';

  const backupProvider=window.CreaVaultStorage?.get?.('INDEPENDENT_BACKUP');
  const backupMode=backupProvider?.mode || 'DISABLED';
  $('backupFolderButton').disabled=backupMode==='DISABLED';
  $('backupAuthorizeButton').disabled=!['NEEDS_AUTH'].includes(backupMode);
  $('backupNowButton').disabled=!status.initialized || backupMode!=='AVAILABLE';
  $('backupRestoreButton').disabled=backupMode!=='AVAILABLE';
  const backupStatus=$('backupFolderStatus');
  if(backupMode==='DISABLED') backupStatus.textContent='Deze browser ondersteunt geen directe backupmap. Gebruik encrypted snapshot export.';
  if(backupMode==='NEEDS_FOLDER') backupStatus.textContent='Nog geen backupmap gekozen. Kies bij voorkeur een Proton Drive- of NAS-synced map.';
  if(backupMode==='NEEDS_AUTH') backupStatus.textContent='Backupmap '+(backupProvider?.folderName||'')+' is bekend, maar heeft opnieuw toestemming nodig.';
  if(backupMode==='AVAILABLE') backupStatus.textContent='Backupmap actief: '+(backupProvider?.folderName||'gekozen map')+'. Nieuwe backups krijgen een eigen tijdstempel.';
  if(status.mode==='UNINITIALIZED') vaultMessage('Nog geen kluis. Tot setup gebruikt deze v0 alleen lokale prototype-opslag.');
  if(status.mode==='LOCKED') vaultMessage('Kluis bestaat en is vergrendeld. Er wordt geen plaintext state naar localStorage geschreven.');
  if(status.mode==='UNLOCKED') vaultMessage('Kluis ontgrendeld. Branch-state wordt encrypted in IndexedDB opgeslagen.');
  refreshOverlayBridgeStatus().catch(()=>{});
}
async function initVaultUI(){
  try{
    const status=await window.CreaVault.init();
    if(status.initialized && !status.unlocked){
      localStorage.removeItem(KEY);
      state=structuredClone(seed);
      render();
    }
    updateVaultUi();
  }catch(err){
    vaultMessage('Vault niet beschikbaar in deze browser: '+err.message,true);
    vaultButton.textContent='VAULT · N/A';
  }
}

async function restoreSemanticStateFromVault(){
  const eventState=await window.CreaSemanticEventStore.restore();
  if(eventState){
    semanticOutbox=[];
    return window.CreaSemanticCore.ensureState(eventState);
  }

  const legacy=await window.CreaVault.loadJSON(KEY);
  const base=window.CreaSemanticCore.ensureState(legacy||state);
  const migrated=await window.CreaSemanticEventStore.ensureMigrated(base);
  semanticOutbox=[];
  return window.CreaSemanticCore.ensureState(migrated.state);
}

async function setupVault(){
  const pass=vaultPassphrase.value;
  try{
    const result=await window.CreaVault.setup(pass);
    await window.CreaVault.saveJSON(KEY,state,{privacyClass:'PRIVATE'});
    const migrated=await window.CreaSemanticEventStore.ensureMigrated(state);
    state=window.CreaSemanticCore.ensureState(migrated.state);
    semanticOutbox=[];
    localStorage.removeItem(KEY);
    vaultRecoveryOutput.value=result.recoveryKey;
    recoveryBox.classList.remove('hidden');
    vaultPassphrase.value='';
    updateVaultUi();
    vaultMessage('Kluis aangemaakt. Bewaar de recovery key nu op een tweede veilige plek.');
  }catch(err){
    const msg=err.message==='PASSPHRASE_TOO_SHORT'?'Gebruik een wachtzin van minimaal 12 tekens.':err.message;
    vaultMessage('Setup mislukt: '+msg,true);
  }
}
async function unlockVault(){
  try{
    await window.CreaVault.unlock(vaultPassphrase.value);
    state=await restoreSemanticStateFromVault();
    vaultPassphrase.value='';
    updateVaultUi();
    render();
    requestAnimationFrame(centerCurrent);
  }catch(err){
    vaultMessage('Ontgrendelen mislukt. Controleer de wachtzin.',true);
  }
}
async function recoverVault(){
  try{
    await window.CreaVault.recover(vaultRecoveryInput.value);
    state=await restoreSemanticStateFromVault();
    vaultRecoveryInput.value='';
    updateVaultUi();
    render();
    requestAnimationFrame(centerCurrent);
    vaultMessage('Toegang hersteld met recovery key. Stel in een volgende versie een nieuwe wachtzin in.');
  }catch(err){
    vaultMessage('Recovery key ongeldig.',true);
  }
}
async function lockVault(){
  try{
    await commitSemanticNow();
  }catch{}
  window.CreaVault.lock();
  state=structuredClone(seed);
  updateVaultUi();
  render();
  requestAnimationFrame(centerCurrent);
}
async function exportVaultSnapshot(){
  try{
    const snapshot=await window.CreaVault.exportEncryptedSnapshot();
    await window.CreaVaultStorage.write('LOCAL_DOWNLOAD',snapshot,{
      privacyClass:'VAULT_HIGH',
      metadata:{filename:'creabundalo-vault-'+new Date().toISOString().slice(0,10)+'.enc.json'}
    });
    vaultMessage('Encrypted snapshot geëxporteerd. De opslagadapter zag alleen ciphertext.');
  }catch(err){
    vaultMessage('Snapshot mislukt: '+err.message,true);
  }
}
function connectScaleway(){
  const token=scalewaySyncToken.value.trim();
  if(token.length<24){
    vaultMessage('Sync-token ontbreekt of is te kort.',true);
    return;
  }
  window.CreaVaultStorage.configureScaleway({token});
  scalewaySyncToken.value='';
  updateVaultUi();
  maybeAutoSemanticCloudSync({force:true}).catch(()=>{});
  vaultMessage('Scaleway geactiveerd voor deze sessie. Event-sync en snapshot-backup gebruiken dezelfde veilige transportlaag.');
}
async function syncToScaleway(){
  try{
    const status=window.CreaVault.status();
    if(!status.initialized) throw new Error('VAULT_NOT_INITIALIZED');
    const snapshot=await window.CreaVault.exportEncryptedSnapshot();
    await window.CreaVaultStorage.write('SCALEWAY_SYNC',snapshot,{privacyClass:'VAULT_HIGH'});
    await window.CreaVaultHealth?.success?.('scaleway');
    vaultMessage('Encrypted Vault naar Scaleway gesynchroniseerd. Alleen ciphertext is geüpload.');
  }catch(err){
    await window.CreaVaultHealth?.error?.('scaleway',err);
    vaultMessage('Scaleway sync mislukt: '+err.message,true);
  }
}
async function restoreFromScaleway(){
  try{
    const snapshot=await window.CreaVaultStorage.read('SCALEWAY_SYNC',{privacyClass:'VAULT_HIGH'});
    if(!snapshot){
      vaultMessage('Nog geen cloudsnapshot gevonden voor dit account.',true);
      return;
    }
    const status=window.CreaVault.status();
    if(status.initialized && !confirm('De cloudsnapshot vervangt de lokale Vault. Doorgaan?')) return;
    const result=await window.CreaVault.importEncryptedSnapshot(snapshot,{overwrite:true});
    localStorage.removeItem(KEY);
    state=structuredClone(seed);
    updateVaultUi();
    render();
    requestAnimationFrame(centerCurrent);
    await window.CreaVaultHealth?.restored?.('SCALEWAY_SYNC');
    vaultMessage('Scaleway-snapshot hersteld ('+result.importedRecords+' encrypted record(s)). Ontgrendel met de oorspronkelijke wachtzin of recovery key.');
  }catch(err){
    await window.CreaVaultHealth?.restoreError?.('SCALEWAY_SYNC',err);
    vaultMessage('Cloudherstel mislukt: '+err.message,true);
  }
}
async function chooseBackupFolder(){
  try{
    await window.CreaVaultStorage.configureIndependentBackup({prompt:true});
    updateVaultUi();
    vaultMessage('Onafhankelijke backupmap gekoppeld. Creabundalo schrijft hier alleen encrypted snapshots.');
  }catch(err){
    if(err.name==='AbortError') return;
    vaultMessage('Backupmap kiezen mislukt: '+err.message,true);
  }
}
async function authorizeBackupFolder(){
  try{
    await window.CreaVaultStorage.authorizeIndependentBackup();
    updateVaultUi();
    vaultMessage('Toegang tot de backupmap bevestigd.');
  }catch(err){
    vaultMessage('Geen toegang tot backupmap: '+err.message,true);
  }
}
async function backupNowIndependent(){
  try{
    const snapshot=await window.CreaVault.exportEncryptedSnapshot();
    const result=await window.CreaVaultStorage.write('INDEPENDENT_BACKUP',snapshot,{privacyClass:'VAULT_HIGH'});
    await window.CreaVaultHealth?.success?.('independent');
    vaultMessage('Onafhankelijke encrypted backup geschreven: '+result.filename);
  }catch(err){
    await window.CreaVaultHealth?.error?.('independent',err);
    vaultMessage('Onafhankelijke backup mislukt: '+err.message,true);
  }
}
async function restoreLatestIndependent(){
  try{
    const snapshot=await window.CreaVaultStorage.read('INDEPENDENT_BACKUP',{privacyClass:'VAULT_HIGH'});
    if(!snapshot){
      vaultMessage('Geen versioned backup gevonden in deze map.',true);
      return;
    }
    const status=window.CreaVault.status();
    if(status.initialized && !confirm('De laatste backup vervangt de lokale Vault. Doorgaan?')) return;
    const result=await window.CreaVault.importEncryptedSnapshot(snapshot,{overwrite:true});
    localStorage.removeItem(KEY);
    state=structuredClone(seed);
    updateVaultUi();
    render();
    requestAnimationFrame(centerCurrent);
    await window.CreaVaultHealth?.restored?.('INDEPENDENT_BACKUP');
    vaultMessage('Laatste onafhankelijke backup hersteld ('+result.importedRecords+' encrypted record(s)). Ontgrendel daarna de Vault.');
  }catch(err){
    await window.CreaVaultHealth?.restoreError?.('INDEPENDENT_BACKUP',err);
    vaultMessage('Backupherstel mislukt: '+err.message,true);
  }
}
async function importVaultSnapshot(file){
  if(!file) return;
  const text=await file.text();
  const status=window.CreaVault.status();
  const overwrite=!status.initialized || confirm('Deze encrypted snapshot vervangt de huidige lokale Vault. Doorgaan?');
  if(!overwrite) return;
  try{
    const result=await window.CreaVault.importEncryptedSnapshot(text,{overwrite:true});
    localStorage.removeItem(KEY);
    state=structuredClone(seed);
    updateVaultUi();
    render();
    requestAnimationFrame(centerCurrent);
    vaultMessage('Snapshot hersteld ('+result.importedRecords+' encrypted record(s)). Ontgrendel met de oorspronkelijke wachtzin of recovery key.');
  }catch(err){
    vaultMessage('Herstel mislukt: '+err.message,true);
  }finally{
    vaultImportInput.value='';
  }
}

$('composer').addEventListener('submit',e=>{
  e.preventDefault();
  const text=input.value;
  input.value='';
  handleCommand(text);
});
input.addEventListener('keydown',e=>{
  if(e.key==='Enter' && !e.shiftKey){
    e.preventDefault();
    $('composer').requestSubmit();
  }
});
$('backButton').onclick=goBack;
$('rootButton').onclick=goRoot;
$('promoteButton').onclick=promote;
$('parkButton').onclick=park;
vaultButton.onclick=()=>{updateVaultUi();vaultDialog.showModal()};
$('vaultCloseButton').onclick=()=>vaultDialog.close();
$('vaultSetupButton').onclick=setupVault;
$('vaultUnlockButton').onclick=unlockVault;
$('vaultRecoverButton').onclick=recoverVault;
$('vaultLockButton').onclick=lockVault;
$('vaultBackupButton').onclick=exportVaultSnapshot;
$('scalewayConnectButton').onclick=connectScaleway;
$('scalewaySyncButton').onclick=syncToScaleway;
$('scalewayRestoreButton').onclick=restoreFromScaleway;
$('backupFolderButton').onclick=chooseBackupFolder;
$('backupAuthorizeButton').onclick=authorizeBackupFolder;
$('backupNowButton').onclick=backupNowIndependent;
$('backupRestoreButton').onclick=restoreLatestIndependent;
$('overlayConnectButton').onclick=connectOverlayBridge;
$('overlayImportButton').onclick=importOverlayContext;
$('verifyContinuityButton').onclick=verifyContinuity;
$('semanticSyncNowButton').onclick=()=>runSemanticCloudSync({manual:true});
$('analyzeRetentionButton').onclick=analyzeRetention;
$('applyRetentionButton').onclick=applyRetention;
$('refreshAuditButton').onclick=renderAudit;
$('verifyReplayButton').onclick=verifySemanticReplay;
$('renameDeviceButton').onclick=renameDevice;
$('exportDeviceBundleButton').onclick=exportDeviceBundle;
$('importDeviceBundleButton').onclick=()=>deviceBundleInput.click();
deviceBundleInput.onchange=()=>importDeviceBundle(deviceBundleInput.files?.[0]);
$('vaultImportButton').onclick=()=>vaultImportInput.click();
vaultImportInput.onchange=()=>importVaultSnapshot(vaultImportInput.files?.[0]);
$('copyRecoveryButton').onclick=async()=>{
  if(vaultRecoveryOutput.value){
    await navigator.clipboard.writeText(vaultRecoveryOutput.value);
    vaultMessage('Recovery key gekopieerd. Bewaar hem buiten deze browser.');
  }
};
document.querySelectorAll('.lens').forEach(b=>b.onclick=()=>setLens(b.dataset.lens));
$('zoomIn').onclick=()=>{zoom=Math.min(1.7,zoom+.1);applyTransform()};
$('zoomOut').onclick=()=>{zoom=Math.max(.45,zoom-.1);applyTransform()};
$('zoomReset').onclick=()=>{zoom=1;centerCurrent()};

viewport.addEventListener('wheel',e=>{
  e.preventDefault();
  const next=Math.max(.45,Math.min(1.7,zoom+(e.deltaY<0?.08:-.08)));
  zoom=next; applyTransform();
},{passive:false});
viewport.addEventListener('pointerdown',e=>{
  if(e.target.closest('.node,.edge-label,.zoom')) return;
  dragging=true; viewport.setPointerCapture(e.pointerId);
  dragStart={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y};
});
viewport.addEventListener('pointermove',e=>{
  if(!dragging||!dragStart) return;
  pan.x=dragStart.px+(e.clientX-dragStart.x);
  pan.y=dragStart.py+(e.clientY-dragStart.y);
  applyTransform();
});
viewport.addEventListener('pointerup',()=>{dragging=false;dragStart=null});
viewport.addEventListener('pointercancel',()=>{dragging=false;dragStart=null});

(async function startCreabundalo(){
  await window.CreaSemanticDevice.init();
  updateDeviceUi();
  await initVaultUI();
  render();
  requestAnimationFrame(centerCurrent);
  refreshOverlayBridgeStatus().catch(()=>{});
  window.CreaVaultPolicy?.start?.();
  window.addEventListener('focus',()=>maybeAutoSemanticCloudSync().catch(()=>{}));
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible') maybeAutoSemanticCloudSync().catch(()=>{});
  });
  setInterval(()=>maybeAutoSemanticCloudSync().catch(()=>{}),AUTO_SEMANTIC_SYNC_MS);
})().catch(err=>{
  console.error('Creabundalo startup failed',err);
});
