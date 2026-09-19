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

let state = load();
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

function uid(prefix='n'){
  return globalThis.crypto?.randomUUID ? prefix+'_'+crypto.randomUUID() : prefix+'_'+Date.now()+'_'+Math.random().toString(16).slice(2);
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
      window.CreaVault.saveJSON(KEY,state,{privacyClass:'PRIVATE'}).catch(err=>console.error('Vault save failed',err));
    }
    return;
  }
  localStorage.setItem(KEY, JSON.stringify(state));
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
  applyTransform();
  save();
}
function applyTransform(){
  stage.style.transform=`translate(${pan.x}px,${pan.y}px) scale(${zoom})`;
  $('zoomReset').textContent=Math.round(zoom*100)+'%';
}
function focusNode(id){
  if(!byId(id)) return;
  state.currentId=id;
  state.lens='all';
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
  c.kind='project';
  c.status='active';
  render();
}
function park(){
  const c=current();
  if(!c) return;
  c.status='paused';
  const p=c.parentId;
  render();
  if(p) focusNode(p);
}
function setLens(lens){
  state.lens=lens;
  render();
}
function titleFrom(text){
  const clean=text.replace(/\s+/g,' ').trim();
  return clean.length>52 ? clean.slice(0,49)+'…' : clean;
}
function addQuestion(text){
  const parent=current();
  const node={
    id:uid(),
    title:titleFrom(text),
    parentId:parent.id,
    edgeLabel:text,
    kind:'branch',
    scope:parent.scope || 'work',
    status:'active',
    createdAt:Date.now()
  };
  state.nodes.push(node);
  state.currentId=node.id;
  state.lens='all';
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
  if(status.mode==='UNINITIALIZED') vaultMessage('Nog geen kluis. Tot setup gebruikt deze v0 alleen lokale prototype-opslag.');
  if(status.mode==='LOCKED') vaultMessage('Kluis bestaat en is vergrendeld. Er wordt geen plaintext state naar localStorage geschreven.');
  if(status.mode==='UNLOCKED') vaultMessage('Kluis ontgrendeld. Branch-state wordt encrypted in IndexedDB opgeslagen.');
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
async function setupVault(){
  const pass=vaultPassphrase.value;
  try{
    const result=await window.CreaVault.setup(pass);
    await window.CreaVault.saveJSON(KEY,state,{privacyClass:'PRIVATE'});
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
    const restored=await window.CreaVault.loadJSON(KEY);
    if(restored) state=restored;
    else await window.CreaVault.saveJSON(KEY,state,{privacyClass:'PRIVATE'});
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
    const restored=await window.CreaVault.loadJSON(KEY);
    if(restored) state=restored;
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
    await window.CreaVault.saveJSON(KEY,state,{privacyClass:'PRIVATE'});
  }catch{}
  window.CreaVault.lock();
  state=structuredClone(seed);
  updateVaultUi();
  render();
  requestAnimationFrame(centerCurrent);
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
$('vaultBackupButton').onclick=()=>window.CreaVault.downloadEncryptedSnapshot().catch(err=>vaultMessage('Snapshot mislukt: '+err.message,true));
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

render();
requestAnimationFrame(centerCurrent);
initVaultUI();
