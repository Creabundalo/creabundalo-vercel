const APP_VERSION = '0.2';

const store = {
  contacts: JSON.parse(localStorage.getItem('actio.contacts') || '[]'),
  items: JSON.parse(localStorage.getItem('actio.items') || '[]'),
  log: JSON.parse(localStorage.getItem('actio.log') || '[]'),
  pending: null,
  currentAttachment: null
};

const $ = (id) => document.getElementById(id);
const input = $('commandInput');
const previewPanel = $('previewPanel');
const previewContent = $('previewContent');
const txLabel = $('txLabel');
const todayList = $('todayList');
const logList = $('logList');
const todayCount = $('todayCount');
const micButton = $('micButton');
const cameraButton = $('cameraButton');
const cameraInput = $('cameraInput');
const attachmentStrip = $('attachmentStrip');
const wakeButton = $('wakeButton');
const installButton = $('installButton');
const connectionState = $('connectionState');

const providers = {
  contact: { name: 'LOCAL', mode: 'LIVE' },
  calendar: { name: 'CalendarProvider', mode: 'LOCAL_MOCK' },
  alarm: { name: 'AlarmProvider', mode: 'LOCAL_MOCK' },
  attachment: { name: 'IndexedDB', mode: 'LIVE' }
};

let wakeLock = null;
let deferredInstallPrompt = null;
let recognition = null;

function uid(prefix){
  if(globalThis.crypto?.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
function nowIso(){ return new Date().toISOString(); }
function nowLabel(){
  return new Intl.DateTimeFormat('nl-NL',{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date());
}
function normalize(value){ return (value || '').toLocaleLowerCase('nl-NL').replace(/\s+/g,' ').trim(); }
function escapeHtml(value){
  const d=document.createElement('div');
  d.textContent=value ?? '';
  return d.innerHTML;
}

function persist(){
  localStorage.setItem('actio.contacts', JSON.stringify(store.contacts));
  localStorage.setItem('actio.items', JSON.stringify(store.items));
  localStorage.setItem('actio.log', JSON.stringify(store.log));
}

function addLog(action, detail, txId=null){
  store.log.unshift({id:uid('log'), at:nowIso(), time:nowLabel(), action, detail, txId});
  store.log = store.log.slice(0,150);
  persist();
  renderLog();
}

function parseClock(match){
  if(!match) return null;
  return `${String(match[1]).padStart(2,'0')}:${String(match[2] || '00').padStart(2,'0')}`;
}

function resolveContact(name){
  const key = normalize(name);
  return store.contacts.find(c => normalize(c.name) === key || (c.aliases || []).some(a => normalize(a) === key)) || null;
}

function parseCommand(text){
  const raw = text.trim();
  const lower = raw.toLowerCase();
  const alarmMatch = raw.match(/(?:alarm|wek(?:ker)?|waarschuw)\s*(?:me\s*)?(?:om)?\s*(\d{1,2})[:.]?(\d{2})?/i);
  const withoutAlarm = raw.replace(/(?:alarm|wek(?:ker)?|waarschuw).*$/i,'');
  const eventTimeMatch = withoutAlarm.match(/(?:om\s*)?(\d{1,2})[:.]?(\d{2})?\s*(?:uur)?/i);
  const mailMatch = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = raw.match(/(?:\+31|0)\s?6(?:[\s.-]?\d){8}/);
  const dayWord = (raw.match(/woensdag|donderdag|vrijdag|maandag|dinsdag|zaterdag|zondag|vandaag|morgen/i)||[])[0] || 'datum nog bepalen';
  const durationMatch = raw.match(/(?:voor|duur)\s*(\d+)\s*(minuten?|uur)/i);
  const durationMinutes = durationMatch ? (durationMatch[2].toLowerCase().startsWith('uur') ? Number(durationMatch[1])*60 : Number(durationMatch[1])) : 60;

  let personName = null;
  const personRaw = raw.match(/\bmet\s+([^,;.]+?)(?=\s+(?:over|om|alarm|wekker|waarschuw|voor|duur)\b|[,;.]|$)/i);
  if(personRaw) personName = personRaw[1].trim().replace(/\s+/g,' ');

  let intent = 'EVENT';
  if(/nieuw contact|contact aanmaken|voeg .* toe als contact/i.test(raw)) intent = 'CONTACT';
  else if(/\b(taak|todo|to-do)\b|onthoud dat ik/i.test(lower)) intent = 'TASK';
  else if(!eventTimeMatch && store.currentAttachment && !/afspraak|agenda|meeting|vergadering/i.test(lower)) intent = 'NOTE';

  const subject = raw
    .replace(/(?:woensdag|donderdag|vrijdag|maandag|dinsdag|zaterdag|zondag|vandaag|morgen)/gi,'')
    .replace(/\bmet\s+([^,;.]+?)(?=\s+(?:over|om|alarm|wekker|waarschuw|voor|duur)\b|[,;.]|$)/gi,'')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig,'')
    .replace(/(?:alarm|wek(?:ker)?|waarschuw).*$/i,'')
    .replace(/(?:om\s*)?\d{1,2}[:.]?\d{0,2}\s*(?:uur)?/i,'')
    .replace(/(?:voor|duur)\s*\d+\s*(?:minuten?|uur)/i,'')
    .replace(/\s+/g,' ')
    .trim() || (intent === 'CONTACT' ? (personName || mailMatch?.[0] || 'Nieuw contact') : intent === 'NOTE' ? 'Nieuwe notitie' : 'Nieuwe actie');

  const person = personName ? resolveContact(personName) : null;
  return {
    txId: uid('tx'),
    raw,
    intent,
    title: subject,
    personName,
    personId: person?.id || null,
    email: mailMatch?.[0] || person?.email || null,
    phone: phoneMatch?.[0] || person?.phone || null,
    when: `${dayWord} ${parseClock(eventTimeMatch) || '--:--'}`,
    durationMinutes,
    alarm: parseClock(alarmMatch),
    attachment: store.currentAttachment ? {
      id: store.currentAttachment.id,
      name: store.currentAttachment.file.name || 'camera.jpg',
      type: store.currentAttachment.file.type || 'image/jpeg',
      size: store.currentAttachment.file.size
    } : null,
    status: 'PREPARED'
  };
}

function contactPlan(intent){
  if(intent.intent === 'CONTACT') return {needed:true, action:'CREATE', name:intent.personName || intent.title, email:intent.email, phone:intent.phone};
  if(!intent.personName) return {needed:false, action:'NONE'};
  const existing = resolveContact(intent.personName);
  return existing
    ? {needed:true, action:'USE', contact:existing}
    : {needed:true, action:'CREATE', name:intent.personName, email:intent.email, phone:intent.phone};
}

function buildTransaction(intent){
  const cp = contactPlan(intent);
  const operations = [];
  if(cp.action === 'CREATE') operations.push({kind:'CONTACT', op:'CREATE', payload:cp});
  if(cp.action === 'USE') operations.push({kind:'CONTACT', op:'RESOLVE', payload:{id:cp.contact.id,name:cp.contact.name,email:cp.contact.email}});
  if(intent.attachment) operations.push({kind:'ATTACHMENT', op:'STORE', payload:intent.attachment});
  if(intent.intent === 'EVENT') operations.push({kind:'EVENT', op:'CREATE', payload:intent});
  if(intent.intent === 'TASK') operations.push({kind:'TASK', op:'CREATE', payload:intent});
  if(intent.intent === 'NOTE') operations.push({kind:'NOTE', op:'CREATE', payload:intent});
  if(intent.intent === 'CONTACT') operations.push({kind:'CONTACT_ONLY', op:'FINALIZE', payload:intent});
  if(intent.alarm) operations.push({kind:'ALARM', op:'CREATE', payload:{time:intent.alarm,label:intent.title}});
  return {id:intent.txId, createdAt:nowIso(), intent, operations, status:'PREVIEW'};
}

function showPreview(intent){
  const tx = buildTransaction(intent);
  store.pending = tx;
  txLabel.textContent = tx.id;
  const lines = [
    intent.title,
    intent.intent === 'EVENT' ? `${intent.when} · ${intent.durationMinutes} min` : null,
    intent.personName ? `Persoon: ${intent.personName}${intent.email ? ` <${intent.email}>` : ''}` : null,
    intent.attachment ? `Foto: ${intent.attachment.name}` : null,
    intent.alarm ? `Alarm: ${intent.alarm}` : null,
    '',
    'Wordt uitgevoerd in deze volgorde:'
  ];
  tx.operations.forEach((op, index) => {
    if(op.kind === 'CONTACT' && op.op === 'CREATE') lines.push(`${index+1}. Contact aanmaken: ${op.payload.name}${op.payload.email ? ` · ${op.payload.email}` : ''}`);
    else if(op.kind === 'CONTACT' && op.op === 'RESOLVE') lines.push(`${index+1}. Contact gebruiken: ${op.payload.name}`);
    else if(op.kind === 'ATTACHMENT') lines.push(`${index+1}. Foto lokaal opslaan`);
    else if(op.kind === 'EVENT') lines.push(`${index+1}. Afspraak aanmaken via ${providers.calendar.name}`);
    else if(op.kind === 'TASK') lines.push(`${index+1}. Taak lokaal registreren`);
    else if(op.kind === 'NOTE') lines.push(`${index+1}. Notitie lokaal registreren`);
    else if(op.kind === 'ALARM') lines.push(`${index+1}. Alarm ${op.payload.time} klaarzetten via ${providers.alarm.name}`);
    else if(op.kind === 'CONTACT_ONLY') lines.push(`${index+1}. Contactrecord bevestigen`);
  });
  lines.push(`${tx.operations.length+1}. Resultaat teruglezen en loggen`);
  previewContent.textContent = lines.filter(v => v !== null).join('\n');
  previewPanel.classList.remove('hidden');
  addLog('PREPARE', intent.raw || intent.title, tx.id);
  addLog('PREVIEW', `${tx.operations.length} operatie(s)`, tx.id);
}

function executeContact(op, txId){
  if(op.op === 'RESOLVE') return op.payload.id;
  const existingByEmail = op.payload.email ? store.contacts.find(c => normalize(c.email) === normalize(op.payload.email)) : null;
  if(existingByEmail) return existingByEmail.id;
  const contact = {
    id:uid('person'), type:'CONTACT', name:op.payload.name || op.payload.email || 'Onbekend',
    email:op.payload.email || null, phone:op.payload.phone || null, aliases:[],
    createdAt:nowIso(), txId
  };
  store.contacts.push(contact);
  addLog('COMMIT_CONTACT', `${contact.name}${contact.email ? ` · ${contact.email}` : ''}`, txId);
  return contact.id;
}

function createItem(type, payload, txId, extra={}){
  const item = {
    id:uid(type.toLowerCase()), type, title:payload.title, when:payload.when,
    status:'COMMITTED', done:false, createdAt:nowIso(), txId,
    attachmentId: payload.attachment?.id || null,
    ...extra
  };
  store.items.unshift(item);
  return item.id;
}

function executeEvent(op, contactId, txId){
  const id = createItem('EVENT', op.payload, txId, {
    durationMinutes:op.payload.durationMinutes,
    personId:contactId || op.payload.personId || null,
    personName:op.payload.personName || null,
    alarm:op.payload.alarm || null,
    provider:providers.calendar.name,
    providerMode:providers.calendar.mode
  });
  addLog('COMMIT_EVENT', `${op.payload.title} · ${providers.calendar.mode}`, txId);
  return id;
}
function executeTask(op, txId){
  const id = createItem('TASK', op.payload, txId);
  addLog('COMMIT_TASK', op.payload.title, txId);
  return id;
}
function executeNote(op, txId){
  const id = createItem('NOTE', op.payload, txId);
  addLog('COMMIT_NOTE', op.payload.title, txId);
  return id;
}
function executeAlarm(op, parentId, txId){
  const payload = {title:op.payload.label, when:op.payload.time};
  const id = createItem('ALARM', payload, txId, {
    parentId, provider:providers.alarm.name, providerMode:providers.alarm.mode
  });
  addLog('COMMIT_ALARM', `${payload.when} · ${providers.alarm.mode}`, txId);
  return id;
}

function verifyTransaction(txId, expectedIds){
  const unique = [...new Set(expectedIds)];
  const found = unique.every(id => store.items.some(i => i.id === id) || store.contacts.some(c => c.id === id));
  addLog(found ? 'VERIFY_OK' : 'VERIFY_FAIL', found ? `${unique.length} record(s) teruggelezen` : 'record ontbreekt', txId);
  return found;
}

async function approvePending(){
  const tx = store.pending;
  if(!tx) return;
  tx.status = 'APPROVED';
  addLog('APPROVE', tx.intent.title, tx.id);

  let contactId = tx.intent.personId || null;
  let parentId = null;
  const writtenIds = [];

  for(const op of tx.operations){
    if(op.kind === 'CONTACT'){
      contactId = executeContact(op, tx.id);
      writtenIds.push(contactId);
    } else if(op.kind === 'ATTACHMENT'){
      if(store.currentAttachment?.id === op.payload.id){
        await saveAttachment(store.currentAttachment.id, store.currentAttachment.file, tx.id);
        addLog('COMMIT_ATTACHMENT', op.payload.name, tx.id);
      }
    } else if(op.kind === 'EVENT'){
      parentId = executeEvent(op, contactId, tx.id); writtenIds.push(parentId);
    } else if(op.kind === 'TASK'){
      parentId = executeTask(op, tx.id); writtenIds.push(parentId);
    } else if(op.kind === 'NOTE'){
      parentId = executeNote(op, tx.id); writtenIds.push(parentId);
    } else if(op.kind === 'CONTACT_ONLY'){
      if(!contactId){
        contactId = executeContact({op:'CREATE',payload:{name:tx.intent.personName || tx.intent.title,email:tx.intent.email,phone:tx.intent.phone}}, tx.id);
        writtenIds.push(contactId);
      }
    } else if(op.kind === 'ALARM'){
      const alarmId = executeAlarm(op, parentId, tx.id); writtenIds.push(alarmId);
    }
  }

  persist();
  verifyTransaction(tx.id, writtenIds);
  store.pending = null;
  clearAttachment();
  previewPanel.classList.add('hidden');
  input.value='';
  persist();
  renderItems();
}

function rejectPending(){
  if(store.pending) addLog('RETURN', store.pending.intent.title, store.pending.id);
  previewPanel.classList.add('hidden');
  store.pending = null;
  input.focus();
}

function renderItems(){
  todayList.innerHTML='';
  const open = store.items.filter(i=>!i.done).length;
  todayCount.textContent = `${open} open`;
  if(!store.items.length){
    todayList.innerHTML='<div class="empty">Nog niets. Spreek, fotografeer of typ hierboven.</div>';
    return;
  }
  store.items.forEach(item=>{
    const row=document.createElement('div');
    row.className='row'+(item.done?' done':'');
    const check=document.createElement('button');
    check.className='check';
    check.textContent=item.done?'✓':'';
    check.setAttribute('aria-label', item.done ? 'Heropen' : 'Markeer gereed');
    check.onclick=()=>{
      item.done=!item.done;
      addLog(item.done?'DONE':'REOPEN',`${item.type} · ${item.title}`,item.txId);
      persist(); renderItems();
    };
    const main=document.createElement('div');
    main.className='row-main';
    const meta = [item.type, item.personName ? `met ${item.personName}` : null, item.attachmentId ? '📷' : null, item.providerMode === 'LOCAL_MOCK' ? 'lokale preview' : null].filter(Boolean).join(' · ');
    main.innerHTML=`<strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(meta)}</span>`;
    const time=document.createElement('div');
    time.className='row-time';
    time.textContent=item.when || '';
    row.append(check,main,time);
    todayList.appendChild(row);
  });
}

function renderLog(){
  logList.innerHTML='';
  if(!store.log.length){
    logList.innerHTML='<div class="empty">Nog geen acties gelogd.</div>';
    return;
  }
  store.log.forEach(entry=>{
    const el=document.createElement('div');
    el.className='log-item';
    el.innerHTML=`<b>${escapeHtml(entry.time)} · ${escapeHtml(entry.action)}</b> — ${escapeHtml(entry.detail)}${entry.txId?`<small>${escapeHtml(entry.txId)}</small>`:''}`;
    logList.appendChild(el);
  });
}

function clearAttachment(){
  if(store.currentAttachment?.url) URL.revokeObjectURL(store.currentAttachment.url);
  store.currentAttachment = null;
  cameraInput.value='';
  attachmentStrip.innerHTML='';
  attachmentStrip.classList.add('hidden');
}

function renderAttachment(){
  const attachment = store.currentAttachment;
  if(!attachment){ clearAttachment(); return; }
  attachmentStrip.innerHTML = `
    <img src="${attachment.url}" alt="Nieuwe foto" />
    <div class="attachment-copy">
      <strong>Foto gekoppeld</strong>
      <span>${escapeHtml(attachment.file.name || 'camera.jpg')} · ${Math.max(1,Math.round(attachment.file.size/1024))} KB</span>
    </div>
    <button id="removeAttachment" class="attachment-remove" aria-label="Verwijder foto">×</button>`;
  attachmentStrip.classList.remove('hidden');
  $('removeAttachment').onclick=clearAttachment;
}

function openAttachmentDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open('actio.db',1);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains('attachments')) db.createObjectStore('attachments',{keyPath:'id'});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}

async function saveAttachment(id, blob, txId){
  const db=await openAttachmentDb();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction('attachments','readwrite');
    tx.objectStore('attachments').put({id,blob,txId,createdAt:nowIso()});
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error);
  });
  db.close();
}

async function requestWakeLock(){
  if(!('wakeLock' in navigator)){
    addLog('WAKE_LOCK','niet ondersteund op dit toestel');
    wakeButton.textContent='○ Wakker-modus niet ondersteund';
    return false;
  }
  try{
    wakeLock = await navigator.wakeLock.request('screen');
    localStorage.setItem('actio.keepAwake','true');
    wakeButton.classList.add('active');
    wakeButton.setAttribute('aria-pressed','true');
    wakeButton.textContent='● Blijf wakker';
    wakeLock.addEventListener('release',()=>{
      wakeLock=null;
      wakeButton.classList.remove('active');
      wakeButton.setAttribute('aria-pressed','false');
      wakeButton.textContent='○ Blijf wakker';
    });
    addLog('WAKE_LOCK','scherm blijft wakker');
    return true;
  }catch(err){
    addLog('WAKE_LOCK_FAIL',err?.message || 'mislukt');
    return false;
  }
}

async function releaseWakeLock(){
  localStorage.setItem('actio.keepAwake','false');
  if(wakeLock) await wakeLock.release();
  wakeLock=null;
  wakeButton.classList.remove('active');
  wakeButton.setAttribute('aria-pressed','false');
  wakeButton.textContent='○ Blijf wakker';
}

function updateConnectionState(){
  connectionState.textContent = navigator.onLine ? 'LOCAL FIRST' : 'OFFLINE';
}

function prepareCurrentInput(){
  const text=input.value.trim();
  if(!text && store.currentAttachment) input.value='Nieuwe foto';
  if(!input.value.trim()) return input.focus();
  showPreview(parseCommand(input.value));
}

$('prepareButton').onclick=prepareCurrentInput;
$('approveButton').onclick=approvePending;
$('rejectButton').onclick=rejectPending;
cameraButton.onclick=()=>cameraInput.click();
cameraInput.onchange=()=>{
  const file=cameraInput.files?.[0];
  if(!file) return;
  clearAttachment();
  store.currentAttachment={id:uid('attachment'),file,url:URL.createObjectURL(file)};
  renderAttachment();
  addLog('CAPTURE_PHOTO',file.name || 'camera.jpg');
};
wakeButton.onclick=()=>wakeLock ? releaseWakeLock() : requestWakeLock();

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if(SpeechRecognition){
  recognition = new SpeechRecognition();
  recognition.lang='nl-NL';
  recognition.interimResults=false;
  recognition.continuous=false;
  micButton.onclick=()=>{
    try{
      micButton.classList.add('listening');
      recognition.start();
    }catch(_){ /* already listening */ }
  };
  recognition.onresult=(event)=>{
    input.value=event.results[0][0].transcript;
    micButton.classList.remove('listening');
    showPreview(parseCommand(input.value));
  };
  recognition.onerror=(event)=>{
    micButton.classList.remove('listening');
    addLog('VOICE_FAIL',event.error || 'spraakherkenning mislukt');
  };
  recognition.onend=()=>micButton.classList.remove('listening');
}else{
  micButton.onclick=()=>{
    input.focus();
    addLog('VOICE','spraakherkenning niet beschikbaar in deze browser');
  };
}

window.addEventListener('beforeinstallprompt',(event)=>{
  event.preventDefault();
  deferredInstallPrompt=event;
  installButton.classList.remove('hidden');
});
installButton.onclick=async()=>{
  if(!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const choice=await deferredInstallPrompt.userChoice;
  addLog('INSTALL',choice.outcome);
  deferredInstallPrompt=null;
  installButton.classList.add('hidden');
};
window.addEventListener('appinstalled',()=>addLog('INSTALL','ACTIO geïnstalleerd'));
window.addEventListener('online',updateConnectionState);
window.addEventListener('offline',updateConnectionState);
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible' && localStorage.getItem('actio.keepAwake')==='true' && !wakeLock) requestWakeLock();
});

async function init(){
  updateConnectionState();
  renderItems();
  renderLog();
  if('serviceWorker' in navigator){
    try{ await navigator.serviceWorker.register('./actio-sw.js'); }
    catch(err){ addLog('PWA_FAIL',err?.message || 'service worker'); }
  }
  if(navigator.storage?.persist){
    try{
      const persisted=await navigator.storage.persist();
      localStorage.setItem('actio.storagePersisted',String(persisted));
    }catch(_){ }
  }
  if(localStorage.getItem('actio.keepAwake')==='true'){
    wakeButton.textContent='○ Tik om wakker te houden';
  }
  $('versionLabel').textContent=`P24 · ACTIO v${APP_VERSION}`;
}

init();
