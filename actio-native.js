(()=>{
  const native = window.P24Native;
  if(!native) return;

  const parseNative = (value)=>{
    try{return typeof value === 'string' ? JSON.parse(value) : value;}
    catch(_){return {ok:false,error:'INVALID_NATIVE_RESPONSE'};}
  };

  const callNative = (method,payload={})=>{
    try{
      if(typeof native[method] !== 'function') return {ok:false,error:`NATIVE_METHOD_MISSING:${method}`};
      return parseNative(native[method](JSON.stringify(payload)));
    }catch(err){
      return {ok:false,error:err?.message || String(err)};
    }
  };

  function resolveWhen(when){
    const m=String(when||'').match(/^(vandaag|morgen|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\s+(\d{2}):(\d{2})$/i);
    if(!m || m[2]==='--') return null;
    const day=m[1].toLowerCase();
    const hour=Number(m[2]);
    const minute=Number(m[3]);
    const target=new Date();
    target.setSeconds(0,0);
    target.setHours(hour,minute,0,0);
    if(day==='morgen') target.setDate(target.getDate()+1);
    else if(day!=='vandaag'){
      const days={zondag:0,maandag:1,dinsdag:2,woensdag:3,donderdag:4,vrijdag:5,zaterdag:6};
      let delta=(days[day]-target.getDay()+7)%7;
      if(delta===0 && target.getTime()<=Date.now()) delta=7;
      target.setDate(target.getDate()+delta);
    }
    return target.getTime();
  }

  function resolveAlarmEpoch(intent,alarmTime){
    const start=resolveWhen(intent.when);
    const m=String(alarmTime||'').match(/^(\d{2}):(\d{2})$/);
    if(!start || !m) return null;
    const d=new Date(start);
    d.setHours(Number(m[1]),Number(m[2]),0,0);
    return d.getTime();
  }

  function failTx(tx,code,detail){
    addLog('ANDROID_ABORT',`${code}${detail?` · ${detail}`:''}`,tx.id);
    connectionState.textContent='ACTIE GESTOPT';
  }

  async function approveAndroid(){
    const tx=store.pending;
    if(!tx) return;

    const needsContacts=tx.operations.some(op=>op.kind==='CONTACT' || op.kind==='CONTACT_ONLY');
    const needsCalendar=tx.operations.some(op=>op.kind==='EVENT');
    const preflight=callNative('preflight',{contacts:needsContacts,calendar:needsCalendar});
    if(!preflight.ok){
      addLog('ANDROID_PERMISSION',preflight.error || 'toestemming nodig',tx.id);
      try{native.requestPermissions(JSON.stringify({contacts:needsContacts,calendar:needsCalendar}));}catch(_){ }
      connectionState.textContent='GEEF TOESTEMMING';
      return;
    }

    tx.status='APPROVED';
    addLog('APPROVE',tx.intent.title,tx.id);
    let contactId=tx.intent.personId || null;
    let parentId=null;
    const writtenIds=[];
    const nativeChecks=[];

    try{
      for(const op of tx.operations){
        if(op.kind==='CONTACT'){
          const payload=op.op==='RESOLVE'
            ? {name:op.payload.name,email:op.payload.email,txId:tx.id}
            : {name:op.payload.name,email:op.payload.email,phone:op.payload.phone,txId:tx.id};
          const result=callNative('createContact',payload);
          if(!result.ok) throw new Error(`CONTACT:${result.error||'failed'}`);
          nativeChecks.push(Boolean(result.verified));
          addLog('ANDROID_CONTACT_OK',`${result.storage||'ANDROID'} · ${result.id||''}`,tx.id);
          contactId=executeContact(op,tx.id);
          writtenIds.push(contactId);
        } else if(op.kind==='ATTACHMENT'){
          if(store.currentAttachment?.id===op.payload.id){
            await saveAttachment(store.currentAttachment.id,store.currentAttachment.file,tx.id);
            addLog('COMMIT_ATTACHMENT',op.payload.name,tx.id);
          }
        } else if(op.kind==='EVENT'){
          const startMillis=resolveWhen(op.payload.when);
          if(!startMillis) throw new Error('EVENT:DATUM_OF_TIJD_ONVOLLEDIG');
          const result=callNative('createEvent',{
            title:op.payload.title,
            startMillis,
            endMillis:startMillis+(op.payload.durationMinutes||60)*60000,
            timezone:Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Amsterdam',
            personName:op.payload.personName,
            email:op.payload.email,
            txId:tx.id
          });
          if(!result.ok) throw new Error(`EVENT:${result.error||'failed'}`);
          nativeChecks.push(Boolean(result.verified));
          addLog('ANDROID_EVENT_OK',`${result.calendar||'agenda'} · ${result.id||''}`,tx.id);
          parentId=executeEvent(op,contactId,tx.id);
          writtenIds.push(parentId);
        } else if(op.kind==='TASK'){
          parentId=executeTask(op,tx.id); writtenIds.push(parentId);
        } else if(op.kind==='NOTE'){
          parentId=executeNote(op,tx.id); writtenIds.push(parentId);
        } else if(op.kind==='CONTACT_ONLY'){
          if(!contactId){
            const payload={name:tx.intent.personName||tx.intent.title,email:tx.intent.email,phone:tx.intent.phone,txId:tx.id};
            const result=callNative('createContact',payload);
            if(!result.ok) throw new Error(`CONTACT:${result.error||'failed'}`);
            nativeChecks.push(Boolean(result.verified));
            addLog('ANDROID_CONTACT_OK',`${result.storage||'ANDROID'} · ${result.id||''}`,tx.id);
            contactId=executeContact({op:'CREATE',payload},tx.id);
            writtenIds.push(contactId);
          }
        } else if(op.kind==='ALARM'){
          const alarmEpoch=resolveAlarmEpoch(tx.intent,op.payload.time);
          const result=callNative('createAlarm',{
            time:op.payload.time,
            targetMillis:alarmEpoch,
            label:op.payload.label,
            txId:tx.id
          });
          if(!result.ok) throw new Error(`ALARM:${result.error||'failed'}`);
          nativeChecks.push(result.dispatched===true);
          addLog('ANDROID_ALARM_OK',`${result.provider||'clock'} · ${result.verification||'DISPATCHED'}`,tx.id);
          const alarmId=executeAlarm(op,parentId,tx.id); writtenIds.push(alarmId);
        }
      }
    }catch(err){
      failTx(tx,'COMMIT_FAIL',err?.message || String(err));
      persist(); renderItems(); renderLog();
      return;
    }

    persist();
    const localOk=verifyTransaction(tx.id,writtenIds);
    const nativeOk=nativeChecks.every(Boolean);
    addLog(nativeOk?'VERIFY_ANDROID_OK':'VERIFY_ANDROID_PARTIAL',nativeOk?'native records/dispatch bevestigd':'minstens één native verificatie ontbreekt',tx.id);
    connectionState.textContent=localOk&&nativeOk?'ANDROID LIVE':'CONTROLEER LOG';
    store.pending=null;
    clearAttachment();
    previewPanel.classList.add('hidden');
    input.value='';
    persist();
    renderItems();
  }

  try{
    const caps=callNative('capabilities');
    providers.contact={name:'Android Contacts',mode:'ANDROID_LIVE'};
    providers.calendar={name:'Android Calendar',mode:'ANDROID_LIVE'};
    providers.alarm={name:'Android Clock',mode:'ANDROID_LIVE'};
    connectionState.textContent='ANDROID LIVE';
    addLog('ANDROID_BRIDGE',caps.ok?`v${caps.version||'?'} · live`:'bridge gevonden',null);
  }catch(_){ }

  $('approveButton').onclick=approveAndroid;

  if(typeof native.startVoiceCapture==='function'){
    micButton.onclick=()=>{
      micButton.classList.add('listening');
      native.startVoiceCapture();
    };
  }

  window.P24NativeVoiceResult=(text)=>{
    micButton.classList.remove('listening');
    if(!text) return;
    input.value=text;
    showPreview(parseCommand(text));
  };

  window.P24NativeVoiceError=(message)=>{
    micButton.classList.remove('listening');
    addLog('VOICE_FAIL',message||'native spraakherkenning mislukt');
  };
})();
