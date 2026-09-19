(() => {
  const PRIVACY=Object.freeze({
    STANDARD:10,
    PRIVATE:20,
    VAULT_HIGH:30,
    ENTERPRISE_RESTRICTED:40
  });

  const providers=new Map();
  let scalewayToken=null;
  let independentBackupHandle=null;
  const BACKUP_HANDLE_DB='creabundalo-backup-handle-v0';
  const BACKUP_HANDLE_STORE='handles';
  const BACKUP_HANDLE_ID='independent-backup-directory';

  function assertClass(name){
    if(!(name in PRIVACY)) throw new Error('UNKNOWN_PRIVACY_CLASS');
    return PRIVACY[name];
  }
  function register(provider){
    if(!provider?.id||typeof provider.writeSnapshot!=='function') throw new Error('INVALID_STORAGE_PROVIDER');
    const allowed=new Set(provider.allowedPrivacyClasses||[]);
    for(const c of allowed) assertClass(c);
    providers.set(provider.id,{...provider,allowedPrivacyClasses:allowed});
  }
  function get(id){return providers.get(id)||null}
  function list(){
    return [...providers.values()].map(p=>({
      id:p.id,
      label:p.label||p.id,
      mode:p.mode||'AVAILABLE',
      allowedPrivacyClasses:[...p.allowedPrivacyClasses]
    }));
  }
  function assertProvider(providerId,privacyClass){
    assertClass(privacyClass);
    const provider=get(providerId);
    if(!provider) throw new Error('PROVIDER_NOT_FOUND');
    if(provider.mode==='DISABLED') throw new Error('PROVIDER_DISABLED');
    if(provider.mode==='NEEDS_AUTH') throw new Error('PROVIDER_AUTH_REQUIRED');
    if(!provider.allowedPrivacyClasses.has(privacyClass)) throw new Error('PRIVACY_POLICY_BLOCKED');
    return provider;
  }
  async function write(providerId,snapshotText,{privacyClass='PRIVATE',metadata={}}={}){
    const provider=assertProvider(providerId,privacyClass);
    return provider.writeSnapshot(snapshotText,{privacyClass,metadata});
  }
  async function read(providerId,{privacyClass='PRIVATE',metadata={}}={}){
    const provider=assertProvider(providerId,privacyClass);
    if(typeof provider.readSnapshot!=='function') throw new Error('PROVIDER_READ_UNSUPPORTED');
    return provider.readSnapshot({privacyClass,metadata});
  }
  function configureScaleway({token}={}){
    scalewayToken=typeof token==='string' ? token.trim() : null;
    const provider=get('SCALEWAY_SYNC');
    if(provider) provider.mode=scalewayToken ? 'AVAILABLE' : 'NEEDS_AUTH';
    return provider?.mode;
  }

  function openBackupHandleDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(BACKUP_HANDLE_DB,1);
      req.onupgradeneeded=()=>{
        const d=req.result;
        if(!d.objectStoreNames.contains(BACKUP_HANDLE_STORE)) d.createObjectStore(BACKUP_HANDLE_STORE,{keyPath:'id'});
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
  }
  async function saveBackupHandle(handle){
    const db=await openBackupHandleDb();
    await new Promise((resolve,reject)=>{
      const t=db.transaction(BACKUP_HANDLE_STORE,'readwrite');
      t.objectStore(BACKUP_HANDLE_STORE).put({id:BACKUP_HANDLE_ID,handle});
      t.oncomplete=()=>resolve();
      t.onerror=()=>reject(t.error);
    });
    db.close();
  }
  async function loadBackupHandle(){
    const db=await openBackupHandleDb();
    const result=await new Promise((resolve,reject)=>{
      const t=db.transaction(BACKUP_HANDLE_STORE,'readonly');
      const req=t.objectStore(BACKUP_HANDLE_STORE).get(BACKUP_HANDLE_ID);
      req.onsuccess=()=>resolve(req.result?.handle||null);
      req.onerror=()=>reject(req.error);
    });
    db.close();
    return result;
  }
  async function ensureDirectoryPermission(handle,{request=false}={}){
    if(!handle) return false;
    const options={mode:'readwrite'};
    if(typeof handle.queryPermission==='function'){
      const state=await handle.queryPermission(options);
      if(state==='granted') return true;
      if(state==='denied' && !request) return false;
    }
    if(request && typeof handle.requestPermission==='function'){
      return (await handle.requestPermission(options))==='granted';
    }
    return false;
  }
  function backupFilename(date=new Date()){
    return 'creabundalo-vault-'+date.toISOString().replace(/[:.]/g,'-')+'.enc.json';
  }
  async function writeFileToDirectory(handle,name,text){
    const file=await handle.getFileHandle(name,{create:true});
    const writable=await file.createWritable();
    try{
      await writable.write(text);
      await writable.close();
    }catch(err){
      try{await writable.abort()}catch{}
      throw err;
    }
  }
  async function readLatestBackupFromDirectory(handle){
    const names=[];
    for await (const [name,entry] of handle.entries()){
      if(entry.kind==='file' && /^creabundalo-vault-\d{4}-\d{2}-\d{2}T.*\.enc\.json$/.test(name)) names.push(name);
    }
    names.sort();
    const latest=names.at(-1);
    if(!latest) return null;
    const fileHandle=await handle.getFileHandle(latest);
    const file=await fileHandle.getFile();
    return {name:latest,text:await file.text(),lastModified:file.lastModified,size:file.size};
  }
  async function configureIndependentBackup({prompt=true}={}){
    if(!('showDirectoryPicker' in window)) throw new Error('DIRECTORY_PICKER_UNSUPPORTED');
    if(prompt){
      independentBackupHandle=await window.showDirectoryPicker({id:'creabundalo-vault-backup',mode:'readwrite',startIn:'documents'});
      await saveBackupHandle(independentBackupHandle);
    }else if(!independentBackupHandle){
      independentBackupHandle=await loadBackupHandle();
    }
    const provider=get('INDEPENDENT_BACKUP');
    if(!independentBackupHandle){
      if(provider){provider.mode='NEEDS_FOLDER';provider.folderName=null;}
      return 'NEEDS_FOLDER';
    }
    const allowed=await ensureDirectoryPermission(independentBackupHandle,{request:false});
    if(provider){provider.mode=allowed?'AVAILABLE':'NEEDS_AUTH';provider.folderName=independentBackupHandle.name;}
    return provider?.mode;
  }
  async function authorizeIndependentBackup(){
    if(!independentBackupHandle) independentBackupHandle=await loadBackupHandle();
    if(!independentBackupHandle) throw new Error('BACKUP_FOLDER_NOT_CONFIGURED');
    const allowed=await ensureDirectoryPermission(independentBackupHandle,{request:true});
    const provider=get('INDEPENDENT_BACKUP');
    if(provider){provider.mode=allowed?'AVAILABLE':'NEEDS_AUTH';provider.folderName=independentBackupHandle.name;}
    if(!allowed) throw new Error('BACKUP_FOLDER_PERMISSION_DENIED');
    return provider.mode;
  }


  async function listIndependentBackups(){
    if(!independentBackupHandle) independentBackupHandle=await loadBackupHandle();
    if(!independentBackupHandle) throw new Error('BACKUP_FOLDER_NOT_CONFIGURED');
    if(!(await ensureDirectoryPermission(independentBackupHandle,{request:false}))) throw new Error('PROVIDER_AUTH_REQUIRED');
    const items=[];
    for await (const [name,entry] of independentBackupHandle.entries()){
      if(entry.kind!=='file' || !/^creabundalo-vault-.*\.enc\.json$/.test(name)) continue;
      const file=await entry.getFile();
      items.push({name,lastModified:file.lastModified,size:file.size});
    }
    items.sort((a,b)=>b.lastModified-a.lastModified);
    return items;
  }
  async function deleteIndependentBackups(names=[]){
    if(!independentBackupHandle) independentBackupHandle=await loadBackupHandle();
    if(!independentBackupHandle) throw new Error('BACKUP_FOLDER_NOT_CONFIGURED');
    if(!(await ensureDirectoryPermission(independentBackupHandle,{request:false}))) throw new Error('PROVIDER_AUTH_REQUIRED');
    let deleted=0;
    for(const name of names){
      if(!/^creabundalo-vault-.*\.enc\.json$/.test(name)) continue;
      await independentBackupHandle.removeEntry(name);
      deleted++;
    }
    return {deleted};
  }

  async function syncApi(action){
    if(!scalewayToken) throw new Error('PROVIDER_AUTH_REQUIRED');
    const response=await fetch('/api/vault-sync',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer '+scalewayToken
      },
      body:JSON.stringify({action})
    });
    let body={};
    try{body=await response.json()}catch{}
    if(!response.ok) throw new Error(body.error||('SYNC_API_'+response.status));
    if(!body.url) throw new Error('SYNC_URL_MISSING');
    return body;
  }

  register({
    id:'LOCAL_DOWNLOAD',
    label:'Lokale encrypted snapshot',
    mode:'AVAILABLE',
    allowedPrivacyClasses:['STANDARD','PRIVATE','VAULT_HIGH','ENTERPRISE_RESTRICTED'],
    async writeSnapshot(snapshotText,{metadata={}}={}){
      const blob=new Blob([snapshotText],{type:'application/json'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;
      a.download=metadata.filename||('creabundalo-vault-'+new Date().toISOString().slice(0,10)+'.enc.json');
      a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      return {provider:'LOCAL_DOWNLOAD',status:'WRITTEN'};
    }
  });

  register({
    id:'SCALEWAY_SYNC',
    label:'Scaleway encrypted sync',
    mode:'NEEDS_AUTH',
    allowedPrivacyClasses:['STANDARD','PRIVATE','VAULT_HIGH'],
    async writeSnapshot(snapshotText,{metadata={}}={}){
      const signed=await syncApi('presign-put');
      const upload=await fetch(signed.url,{
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:snapshotText
      });
      if(!upload.ok) throw new Error('SCALEWAY_PUT_'+upload.status);
      return {provider:'SCALEWAY_SYNC',status:'WRITTEN',expiresIn:signed.expiresIn};
    },
    async readSnapshot({metadata={}}={}){
      const signed=await syncApi('presign-get');
      const response=await fetch(signed.url,{method:'GET',cache:'no-store'});
      if(response.status===404) return null;
      if(!response.ok) throw new Error('SCALEWAY_GET_'+response.status);
      return response.text();
    }
  });

  register({
    id:'INDEPENDENT_BACKUP',
    label:'Onafhankelijke backupmap (Proton/NAS)',
    mode:('showDirectoryPicker' in window)?'NEEDS_FOLDER':'DISABLED',
    allowedPrivacyClasses:['STANDARD','PRIVATE','VAULT_HIGH','ENTERPRISE_RESTRICTED'],
    async writeSnapshot(snapshotText){
      if(!independentBackupHandle) independentBackupHandle=await loadBackupHandle();
      if(!independentBackupHandle) throw new Error('BACKUP_FOLDER_NOT_CONFIGURED');
      if(!(await ensureDirectoryPermission(independentBackupHandle,{request:false}))) throw new Error('PROVIDER_AUTH_REQUIRED');
      const name=backupFilename();
      await writeFileToDirectory(independentBackupHandle,name,snapshotText);
      return {provider:'INDEPENDENT_BACKUP',status:'WRITTEN',filename:name,folder:independentBackupHandle.name};
    },
    async readSnapshot(){
      if(!independentBackupHandle) independentBackupHandle=await loadBackupHandle();
      if(!independentBackupHandle) throw new Error('BACKUP_FOLDER_NOT_CONFIGURED');
      if(!(await ensureDirectoryPermission(independentBackupHandle,{request:false}))) throw new Error('PROVIDER_AUTH_REQUIRED');
      const latest=await readLatestBackupFromDirectory(independentBackupHandle);
      return latest?.text||null;
    }
  });

  configureIndependentBackup({prompt:false}).catch(()=>{});

  window.CreaVaultStorage={
    PRIVACY,register,get,list,write,read,configureScaleway,
    configureIndependentBackup,authorizeIndependentBackup,
    listIndependentBackups,deleteIndependentBackups
  };
})();