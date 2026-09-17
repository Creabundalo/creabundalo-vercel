const state = {
  pending: null,
  items: JSON.parse(localStorage.getItem('actio.items') || '[]'),
  log: JSON.parse(localStorage.getItem('actio.log') || '[]')
};

const $ = (id) => document.getElementById(id);
const input = $('commandInput');
const previewPanel = $('previewPanel');
const previewContent = $('previewContent');
const todayList = $('todayList');
const logList = $('logList');
const todayCount = $('todayCount');
const micButton = $('micButton');

function nowLabel(){
  return new Intl.DateTimeFormat('nl-NL',{hour:'2-digit',minute:'2-digit'}).format(new Date());
}

function save(){
  localStorage.setItem('actio.items', JSON.stringify(state.items));
  localStorage.setItem('actio.log', JSON.stringify(state.log));
}

function addLog(action, detail){
  state.log.unshift({time:nowLabel(),action,detail});
  state.log = state.log.slice(0,50);
  save();
  renderLog();
}

function parseCommand(text){
  const clean = text.trim();
  const alarmMatch = clean.match(/(?:alarm|wek(?:ker)?|waarschuw)\s*(?:om)?\s*(\d{1,2})[:.]?(\d{2})?/i);
  const timeMatch = clean.match(/(?:om\s*)?(\d{1,2})[:.]?(\d{2})?\s*(?:uur)?/i);
  const personMatch = clean.match(/\bmet\s+([A-ZÀ-Ý][\p{L}-]+(?:\s+[A-ZÀ-Ý][\p{L}-]+)?)/u);
  const subject = clean
    .replace(/(?:woensdag|donderdag|vrijdag|maandag|dinsdag|zaterdag|zondag|vandaag|morgen)/gi,'')
    .replace(/\bmet\s+[A-ZÀ-Ý][\p{L}-]+(?:\s+[A-ZÀ-Ý][\p{L}-]+)?/gu,'')
    .replace(/(?:alarm|wek(?:ker)?|waarschuw).*$/i,'')
    .replace(/(?:om\s*)?\d{1,2}[:.]?\d{0,2}\s*(?:uur)?/i,'')
    .replace(/\s+/g,' ')
    .trim() || 'Nieuwe actie';

  const dayWord = (clean.match(/woensdag|donderdag|vrijdag|maandag|dinsdag|zaterdag|zondag|vandaag|morgen/i)||[])[0] || 'datum nog bepalen';
  const hour = timeMatch ? String(timeMatch[1]).padStart(2,'0') : '--';
  const mins = timeMatch ? String(timeMatch[2] || '00').padStart(2,'0') : '--';
  const alarm = alarmMatch ? `${String(alarmMatch[1]).padStart(2,'0')}:${String(alarmMatch[2]||'00').padStart(2,'0')}` : null;

  return {
    raw: clean,
    type: 'EVENT',
    title: subject,
    person: personMatch ? personMatch[1] : null,
    when: `${dayWord} ${hour}:${mins}`,
    alarm,
    status: 'PREVIEW'
  };
}

function showPreview(item){
  state.pending = item;
  previewContent.textContent = [
    item.title,
    item.when,
    item.person ? `Met: ${item.person}` : null,
    item.alarm ? `Alarm: ${item.alarm}` : null,
    '',
    'Bij akkoord:',
    '• contact resolven / aanmaken indien nodig',
    '• afspraak klaarzetten voor CalendarProvider',
    item.alarm ? '• alarm klaarzetten voor AlarmProvider' : null,
    '• resultaat teruglezen en loggen'
  ].filter(Boolean).join('\n');
  previewPanel.classList.remove('hidden');
  addLog('PREPARE', item.raw);
}

function approvePending(){
  if(!state.pending) return;
  const item = {...state.pending, id:crypto.randomUUID(), status:'COMMITTED', done:false};
  state.items.unshift(item);
  addLog('APPROVE', item.title);
  // MVP adapter is deliberately local-only. External providers are wired next.
  addLog('COMMIT', `${item.title} · LOCAL_MOCK`);
  addLog('VERIFY', 'lokale queue teruggelezen');
  state.pending = null;
  previewPanel.classList.add('hidden');
  input.value='';
  save();
  renderItems();
}

function rejectPending(){
  if(state.pending) addLog('RETURN', state.pending.title);
  previewPanel.classList.add('hidden');
  state.pending = null;
  input.focus();
}

function renderItems(){
  todayList.innerHTML='';
  const open = state.items.filter(i=>!i.done).length;
  todayCount.textContent = `${open} open`;
  if(!state.items.length){
    todayList.innerHTML='<div class="empty">Nog niets. Spreek of typ hierboven een actie in.</div>';
    return;
  }
  state.items.forEach(item=>{
    const row=document.createElement('div');
    row.className='row'+(item.done?' done':'');
    const check=document.createElement('button');
    check.className='check';
    check.textContent=item.done?'✓':'';
    check.onclick=()=>{
      item.done=!item.done;
      addLog(item.done?'DONE':'REOPEN',item.title);
      save(); renderItems();
    };
    const main=document.createElement('div');
    main.className='row-main';
    main.innerHTML=`<strong>${item.title}</strong><span>${item.person?`met ${item.person} · `:''}${item.alarm?`alarm ${item.alarm}`:'geen alarm'}</span>`;
    const time=document.createElement('div');
    time.className='row-time';
    time.textContent=item.when;
    row.append(check,main,time);
    todayList.appendChild(row);
  });
}

function renderLog(){
  logList.innerHTML='';
  if(!state.log.length){
    logList.innerHTML='<div class="empty">Nog geen acties gelogd.</div>';
    return;
  }
  state.log.forEach(entry=>{
    const el=document.createElement('div');
    el.className='log-item';
    el.innerHTML=`<b>${entry.time} · ${entry.action}</b> — ${entry.detail}`;
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

renderItems();
renderLog();
