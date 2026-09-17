const store = {
  contacts: JSON.parse(localStorage.getItem('actio.contacts') || '[]'),
  items: JSON.parse(localStorage.getItem('actio.items') || '[]'),
  log: JSON.parse(localStorage.getItem('actio.log') || '[]'),
  pending: null
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

const providers = {
  contact: { name: 'LOCAL', mode: 'LIVE' },
  calendar: { name: 'CalendarProvider', mode: 'LOCAL_MOCK' },
  alarm: { name: 'AlarmProvider', mode: 'LOCAL_MOCK' }
};

function uid(prefix){
  return `${prefix}_${crypto.randomUUID()}`;
}

function nowIso(){ return new Date().toISOString(); }
function nowLabel(){
  return new Intl.DateTimeFormat('nl-NL',{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date());
}

function persist(){
  localStorage.setItem('actio.contacts', JSON.stringify(store.contacts));
  localStorage.setItem('actio.items', JSON.stringify(store.items));
  localStorage.setItem('actio.log', JSON.stringify(store.log));
}

function addLog(action, detail, txId=null){
  store.log.unshift({id:uid('log'), at:nowIso(), time:nowLabel(), action, detail, txId});
  store.log = store.log.slice(0,100);
  persist();
  renderLog();
}

function parseClock(match){
  if(!match) return null;
  return `${String(match[1]).padStart(2,'0')}:${String(match[2] || '00').padStart(2,'0')}`;
}

function parseCommand(text){
  const raw = text.trim();
  const lower = raw.toLowerCase();
  const alarmMatch = raw.match(/(?:alarm|wek(?:ker)?|waarschuw)\s*(?:me\s*)?(?:om)?\s*(\d{1,2})[:.]?(\d{2})?/i);
  const eventTimeMatch = raw.match(/(?:om\s*)?(\d{1,2})[:.]?(\d{2})?\s*(?:uur)?/i);
  const personMatch = raw.match(/\bmet\s+([A-ZÀ-Ý][\p{L}-]+(?:\s+[A-ZÀ-Ý][\p{L}-]+)?)/u);
  const mailMatch = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = raw.match(/(?:\+31|0)\s?6(?:[\s.-]?\d){8}/);
  const dayWord = (raw.match(/woensdag|donderdag|vrijdag|maandag|dinsdag|zaterdag|zondag|vandaag|morgen/i)||[])[0] || 'datum nog bepalen';
  const durationMatch = raw.match(/(?:voor|duur)\s*(\d+)\s*(minuten?|uur)/i);
  const durationMinutes = durationMatch ? (durationMatch[2].toLowerCase().startsWith('uur') ? Number(durationMatch[1])*60 : Number(durationMatch[1])) : 60;

  let type = 'EVENT';
  if(/nieuw contact|contact aanmaken|voeg .* toe als contact/i.test(raw)) type = 'CONTACT';
  else if(/taak|todo|to-do|onthoud dat ik/i.test(lower)) type = 'TASK';

  const subject = raw
    .replace(/(?:woensdag|donderdag|vrijdag|maandag|dinsdag|zaterdag|zondag|vandaag|morgen)/gi,'')
    .replace(/\bmet\s+[A-ZÀ-Ý][\p{L}-]+(?:\s+[A-ZÀ-Ý][\p{L}-]+)?/gu,'')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig,'')
    .replace(/(?:alarm|wek(?:ker)?|waarschuw).*$/i,'')
    .replace(/(?:om\s*)?\d{1,2}[:.]?\d{0,2}\s*(?:uur)?/i,'')
    .replace(/(?:voor|duur)\s*\d+\s*(?:minuten?|uur)/i,'')
    .replace(/\s+/g,' ')
    .trim() || (type === 'CONTACT' ? (personMatch?.[1] || mailMatch?.[0] || 'Nieuw contact') : 'Nieuwe actie');

  const personName = personMatch ? personMatch[1] : null;
  const person = personName ? resolveContact(personName) : null;

  return {
    txId: uid('tx'),
    raw,
    intent: type,
    title: subject,
    personName,
    personId: person?.id || null,
    email: mailMatch?.[0] || person?.email || null,
    phone: phoneMatch?.[0] || person?.phone || null,
    when: `${dayWord} ${parseClock(eventTimeMatch) || '--:--'}`,
    durationMinutes,
    alarm: parseClock(alarmMatch),
    status: 'PREPARED'
  };
}

function normalize(s){ return (s || '').toLocaleLowerCase('nl-NL').replace(/\s+/g,' ').trim(); }
function resolveContact(name){
  const key = normalize(name);
  return store.contacts.find(c => normalize(c.name) === key || (c.aliases || []).some(a => normalize(a) === key)) || null;
}

function contactPlan(intent){
  if(intent.intent === 'CONTACT'){
    return {needed:true, action:'CREATE', name:intent.personName || intent.title, email:intent.email, phone:intent.phone};
  }
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
  if(intent.intent === 'EVENT') operations.push({kind:'EVENT', op:'CREATE', payload:intent});
  if(intent.intent === 'TASK') operations.push({kind:'TASK', op:'CREATE', payload:intent});
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
    intent.alarm ? `Alarm: ${intent.alarm}` : null,
    '',
    'Wordt uitgevoerd in deze volgorde:'
  ];

  tx.operations.forEach((op, index) => {
    if(op.kind === 'CONTACT' && op.op === 'CREATE') lines.push(`${index+1}. Contact aanmaken: ${op.payload.name}${op.payload.email ? ` · ${op.payload.email}` : ''}`);
    else if(op.kind === 'CONTACT' && op.op === 'RESOLVE') lines.push(`${index+1}. Contact gebruiken: ${op.payload.name}`);
    else if(op.kind === 'EVENT') lines.push(`${index+1}. Afspraak aanmaken via ${providers.calendar.name}`);
    else if(op.kind === 'TASK') lines.push(`${index+1}. Taak lokaal registreren`);
    else if(op.kind === 'ALARM') lines.push(`${index+1}. Alarm ${op.payload.time} klaarzetten via ${providers.alarm.name}`);
    else if(op.kind === 'CONTACT_ONLY') lines.push(`${index+1}. Contactrecord bevestigen`);
  });
  lines.push(`${tx.operations.length+1}. Resultaat teruglezen en loggen`);

  previewContent.textContent = lines.filter(v => v !== null).join('\n');
  previewPanel.classList.remove('hidden');
  addLog('PREPARE', intent.raw, tx.id);
  addLog('PREVIEW', `${tx.operations.length} operatie(s)`, tx.id);
}

function executeContact(op, txId){
  if(op.op === 'RESOLVE') return op.payload.id;
  const existingByEmail = op.payload.email ? store.contacts.find(c => normalize(c.email) === normalize(op.payload.email)) : null;
  if(existingByEmail) return existingByEmail.id;
  const contact = {
    id: uid('person'),
    type:'CONTACT',
    name:op.payload.name || op.payload.email || 'Onbekend',
    email:op.payload.email || null,
    phone:op.payload.phone || null,
    aliases:[],
    createdAt:nowIso(),
    txId
  };
  store.contacts.push(contact);
  addLog('COMMIT_CONTACT', `${contact.name}${contact.email ? ` · ${contact.email}` : ''}`, txId);
  return contact.id;
}

function executeEvent(op, contactId, txId){
  const item = {
    id:uid('event'), type:'EVENT', title:op.payload.title, when:op.payload.when,
    durationMinutes:op.payload.durationMinutes, personId:contactId || op.payload.personId || null,
    personName:op.payload.personName || null, alarm:op.payload.alarm || null,
    provider:providers.calendar.name, providerMode:providers.calendar.mode,
    status:'COMMITTED', done:false, createdAt:nowIso(), txId
  };
  store.items.unshift(item);
  addLog('COMMIT_EVENT', `${item.title} · ${item.providerMode}`, txId);
  return item.id;
}

function executeTask(op, txId){
  const item = {id:uid('task'), type:'TASK', title:op.payload.title, when:op.payload.when, status:'COMMITTED', done:false, createdAt:nowIso(), txId};
  store.items.unshift(item);
  addLog('COMMIT_TASK', item.title, txId);
  return item.id;
}

function executeAlarm(op, parentId, txId){
  const item = {id:uid('alarm'), type:'ALARM', title:op.payload.label, when:op.payload.time, parentId, provider:providers.alarm.name, providerMode:providers.alarm.mode, status:'COMMITTED', done:false, createdAt:nowIso(), txId};
  store.items.unshift(item);
  addLog('COMMIT_ALARM', `${item.when} · ${item.providerMode}`, txId);
  return item.id;
}

function verifyTransaction(txId, expectedIds){
  const found = expectedIds.every(id => store.items.some(i => i.id === id) || store.contacts.some(c => c.id === id));
  addLog(found ? 'VERIFY_OK' : 'VERIFY_FAIL', found ? `${expectedIds.length} record(s) teruggelezen` : 'record ontbreekt', txId);
  return found;
}

function approvePending(){
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
    } else if(op.kind === 'EVENT'){
      parentId = executeEvent(op, contactId, tx.id);
      writtenIds.push(parentId);
    } else if(op.kind === 'TASK'){
      parentId = executeTask(op, tx.id);
      writtenIds.push(parentId);
    } else if(op.kind === 'CONTACT_ONLY'){
      if(!contactId){
        contactId = executeContact({op:'CREATE',payload:{name:tx.intent.personName || tx.intent.title,email:tx.intent.email,phone:tx.intent.phone}}, tx.id);
        writtenIds.push(contactId);
      }
    } else if(op.kind === 'ALARM'){
      const alarmId = executeAlarm(op, parentId, tx.id);
      writtenIds.push(alarmId);
    }
  }

  persist();
  verifyTransaction(tx.id, [...new Set(writtenIds)]);
  store.pending = null;
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
    todayList.innerHTML='<div class="empty">Nog niets. Spreek of typ hierboven een actie in.</div>';
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
    const meta = [item.type, item.personName ? `met ${item.personName}` : null, item.providerMode === 'LOCAL_MOCK' ? 'preview-uitvoer' : null].filter(Boolean).join(' · ');
    main.innerHTML=`<strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(meta)}</span>`;
    const time=document.createElement('div');
    time.className='row-time';
    time.textContent=item.when || '';
    row.append(check,main,time);
    todayList.appendChild(row);
  });
}

function escapeHtml(value){
  const d=document.createElement('div'); d.textContent=value ?? ''; return d.innerHTML;
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

$('prepareButton').onclick=()=>{
  if(!input.value.trim()) return input.focus();
  showPreview(parseCommand(input.value));
};
$('approveButton').onclick=approvePending;
$('rejectButton').onclick=rejectPending;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if(SpeechRecognition){
  const recognition = new SpeechRecognition();
  recognition.lang='nl-NL';
  recognition.interimResults=false;
  recognition.continuous=false;
  micButton.onclick=()=>{ micButton.classList.add('listening'); recognition.start(); };
  recognition.onresult=(event)=>{ input.value=event.results[0][0].transcript; micButton.classList.remove('listening'); showPreview(parseCommand(input.value)); };
  recognition.onerror=()=>micButton.classList.remove('listening');
  recognition.onend=()=>micButton.classList.remove('listening');
}else{
  micButton.onclick=()=>{ input.focus(); addLog('VOICE','spraakherkenning niet beschikbaar in deze browser'); };
}

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./actio-sw.js').catch(()=>{}));
}

renderItems();
renderLog();
