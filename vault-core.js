(() => {
  const DB_NAME='creabundalo-vault-v0';
  const DB_VERSION=1;
  const META_KEY='vault-meta';
  const ITERATIONS=600000;
  const enc=new TextEncoder();
  const dec=new TextDecoder();
  let db=null, dataKey=null, meta=null;

  const randomBytes=n=>{const out=new Uint8Array(n);crypto.getRandomValues(out);return out};
  const bytesToB64=bytes=>{let s='';const a=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);for(const b of a)s+=String.fromCharCode(b);return btoa(s)};
  const b64ToBytes=str=>{const s=atob(str),a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a};
  const bytesToB64Url=bytes=>bytesToB64(bytes).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const b64UrlToBytes=str=>b64ToBytes(str.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((str.length+3)%4));

  function openDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{
        const d=req.result;
        if(!d.objectStoreNames.contains('meta'))d.createObjectStore('meta',{keyPath:'id'});
        if(!d.objectStoreNames.contains('records'))d.createObjectStore('records',{keyPath:'id'});
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
  }
  function store(name,mode='readonly'){return db.transaction(name,mode).objectStore(name)}
  function get(name,id){return new Promise((resolve,reject)=>{const r=store(name).get(id);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)})}
  function put(name,value){return new Promise((resolve,reject)=>{const r=store(name,'readwrite').put(value);r.onsuccess=()=>resolve(value);r.onerror=()=>reject(r.error)})}
  function getAll(name){return new Promise((resolve,reject)=>{const r=store(name).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)})}

  async function derivePassphraseKey(passphrase,salt,iterations=ITERATIONS){
    const base=await crypto.subtle.importKey('raw',enc.encode(passphrase),'PBKDF2',false,['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  }
  async function importRecoveryKey(secret){
    return crypto.subtle.importKey('raw',b64UrlToBytes(secret),'AES-GCM',false,['encrypt','decrypt']);
  }
  async function wrapRawKey(raw,kek,label){
    const iv=randomBytes(12),aad=enc.encode('creabundalo:vault-wrap:v1:'+label);
    const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},kek,raw);
    return {iv:bytesToB64(iv),ciphertext:bytesToB64(ciphertext)};
  }
  async function unwrapRawKey(wrapper,kek,label){
    const aad=enc.encode('creabundalo:vault-wrap:v1:'+label);
    return crypto.subtle.decrypt({name:'AES-GCM',iv:b64ToBytes(wrapper.iv),additionalData:aad},kek,b64ToBytes(wrapper.ciphertext));
  }
  async function importDataKey(raw){return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt'])}
  async function encryptRecord(id,value){
    if(!dataKey)throw new Error('VAULT_LOCKED');
    const iv=randomBytes(12),aad=enc.encode('creabundalo:record:v1:'+id);
    const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},dataKey,enc.encode(JSON.stringify(value)));
    return {iv:bytesToB64(iv),ciphertext:bytesToB64(ciphertext)};
  }
  async function decryptRecord(record){
    if(!dataKey)throw new Error('VAULT_LOCKED');
    const aad=enc.encode('creabundalo:record:v1:'+record.id);
    const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64ToBytes(record.iv),additionalData:aad},dataKey,b64ToBytes(record.ciphertext));
    return JSON.parse(dec.decode(plaintext));
  }

  const api={
    async init(){
      if(!globalThis.crypto?.subtle||!globalThis.indexedDB)throw new Error('VAULT_UNSUPPORTED');
      db=await openDb();
      meta=await get('meta',META_KEY);
      return api.status();
    },
    status(){return {initialized:!!meta,unlocked:!!dataKey,mode:meta?(dataKey?'UNLOCKED':'LOCKED'):'UNINITIALIZED',version:meta?.version||1,createdAt:meta?.createdAt||null,vaultId:meta?.vaultId||null}},
    async setup(passphrase){
      if(!db)await api.init();
      if(meta)throw new Error('VAULT_ALREADY_EXISTS');
      if(typeof passphrase!=='string'||passphrase.length<12)throw new Error('PASSPHRASE_TOO_SHORT');
      const rawDataKey=randomBytes(32),salt=randomBytes(16);
      const passKey=await derivePassphraseKey(passphrase,salt);
      const recoverySecret=bytesToB64Url(randomBytes(32));
      const recoveryKey=await importRecoveryKey(recoverySecret);
      meta={
        id:META_KEY,vaultId:'vault_'+bytesToB64Url(randomBytes(18)),version:1,algorithm:'AES-GCM-256',kdf:'PBKDF2-SHA256',iterations:ITERATIONS,salt:bytesToB64(salt),
        wrappedByPassphrase:await wrapRawKey(rawDataKey,passKey,'passphrase'),
        wrappedByRecovery:await wrapRawKey(rawDataKey,recoveryKey,'recovery'),
        createdAt:new Date().toISOString()
      };
      await put('meta',meta);
      dataKey=await importDataKey(rawDataKey);
      rawDataKey.fill(0);
      return {recoveryKey:recoverySecret,status:api.status()};
    },
    async unlock(passphrase){
      if(!db)await api.init();
      if(!meta)throw new Error('VAULT_NOT_INITIALIZED');
      try{
        const kek=await derivePassphraseKey(passphrase,b64ToBytes(meta.salt),meta.iterations);
        const raw=await unwrapRawKey(meta.wrappedByPassphrase,kek,'passphrase');
        dataKey=await importDataKey(raw);
        return api.status();
      }catch{dataKey=null;throw new Error('INVALID_PASSPHRASE')}
    },
    async recover(secret){
      if(!db)await api.init();
      if(!meta)throw new Error('VAULT_NOT_INITIALIZED');
      try{
        const kek=await importRecoveryKey(secret.trim());
        const raw=await unwrapRawKey(meta.wrappedByRecovery,kek,'recovery');
        dataKey=await importDataKey(raw);
        return api.status();
      }catch{dataKey=null;throw new Error('INVALID_RECOVERY_KEY')}
    },
    lock(){dataKey=null;return api.status()},
    async saveJSON(id,value,{privacyClass='PRIVATE'}={}){
      if(!db)await api.init();
      const encrypted=await encryptRecord(id,value);
      const record={id,format:'json',privacyClass,updatedAt:new Date().toISOString(),...encrypted};
      await put('records',record);
      return {id,privacyClass,updatedAt:record.updatedAt};
    },
    async loadJSON(id){
      if(!db)await api.init();
      const record=await get('records',id);
      return record?decryptRecord(record):null;
    },
    async sealJSON(label,value){
      if(!dataKey)throw new Error('VAULT_LOCKED');
      const iv=randomBytes(12);
      const aad=enc.encode('creabundalo:portable:v1:'+String(label||'bundle'));
      const plaintext=enc.encode(JSON.stringify(value));
      const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},dataKey,plaintext);
      return {
        type:'CREABUNDALO_ENCRYPTED_PORTABLE',
        version:1,
        label:String(label||'bundle'),
        algorithm:'AES-GCM-256',
        iv:bytesToB64(iv),
        ciphertext:bytesToB64(ciphertext)
      };
    },
    async openJSON(label,envelope){
      if(!dataKey)throw new Error('VAULT_LOCKED');
      if(envelope?.type!=='CREABUNDALO_ENCRYPTED_PORTABLE'||envelope?.version!==1)throw new Error('INVALID_PORTABLE_ENVELOPE');
      if(String(envelope.label)!==String(label||'bundle'))throw new Error('PORTABLE_LABEL_MISMATCH');
      const aad=enc.encode('creabundalo:portable:v1:'+String(label||'bundle'));
      try{
        const plaintext=await crypto.subtle.decrypt(
          {name:'AES-GCM',iv:b64ToBytes(envelope.iv),additionalData:aad},
          dataKey,
          b64ToBytes(envelope.ciphertext)
        );
        return JSON.parse(dec.decode(plaintext));
      }catch{
        throw new Error('PORTABLE_DECRYPT_FAILED');
      }
    },
    async listRecordMetadata(prefix=''){
      if(!db)await api.init();
      const records=await getAll('records');
      return records
        .filter(r=>!prefix||r.id.startsWith(prefix))
        .map(r=>({id:r.id,privacyClass:r.privacyClass,updatedAt:r.updatedAt}))
        .sort((a,b)=>a.id.localeCompare(b.id));
    },
    async listJSON(prefix=''){
      if(!db)await api.init();
      const records=await getAll('records');
      const selected=records.filter(r=>!prefix||r.id.startsWith(prefix)).sort((a,b)=>a.id.localeCompare(b.id));
      const out=[];
      for(const record of selected){
        out.push({
          id:record.id,
          privacyClass:record.privacyClass,
          updatedAt:record.updatedAt,
          value:await decryptRecord(record)
        });
      }
      return out;
    },
    async commitJSONBatch({append=[],upsert=[]}={}){
      if(!db)await api.init();
      if(!dataKey)throw new Error('VAULT_LOCKED');
      const preparedAppend=[];
      const preparedUpsert=[];
      for(const item of append){
        if(!item?.id)throw new Error('BATCH_ID_REQUIRED');
        const encrypted=await encryptRecord(item.id,item.value);
        preparedAppend.push({
          id:item.id,format:'json',privacyClass:item.privacyClass||'PRIVATE',
          updatedAt:new Date().toISOString(),...encrypted
        });
      }
      for(const item of upsert){
        if(!item?.id)throw new Error('BATCH_ID_REQUIRED');
        const encrypted=await encryptRecord(item.id,item.value);
        preparedUpsert.push({
          id:item.id,format:'json',privacyClass:item.privacyClass||'PRIVATE',
          updatedAt:new Date().toISOString(),...encrypted
        });
      }
      await new Promise((resolve,reject)=>{
        const t=db.transaction('records','readwrite');
        const r=t.objectStore('records');
        for(const record of preparedAppend)r.add(record);
        for(const record of preparedUpsert)r.put(record);
        t.oncomplete=()=>resolve();
        t.onerror=()=>reject(t.error);
        t.onabort=()=>reject(t.error||new Error('BATCH_COMMIT_ABORTED'));
      });
      return {appended:preparedAppend.length,upserted:preparedUpsert.length};
    },
    async exportEncryptedSnapshot(){
      if(!db)await api.init();
      if(!meta)throw new Error('VAULT_NOT_INITIALIZED');
      return JSON.stringify({type:'CREABUNDALO_ENCRYPTED_VAULT_SNAPSHOT',version:1,exportedAt:new Date().toISOString(),meta,records:await getAll('records')},null,2);
    },
    async importEncryptedSnapshot(snapshotText,{overwrite=false}={}){
      if(!db)await api.init();
      let snapshot;
      try{snapshot=typeof snapshotText==='string'?JSON.parse(snapshotText):snapshotText}catch{throw new Error('INVALID_SNAPSHOT_JSON')}
      if(snapshot?.type!=='CREABUNDALO_ENCRYPTED_VAULT_SNAPSHOT'||snapshot?.version!==1)throw new Error('INVALID_SNAPSHOT_FORMAT');
      if(!snapshot.meta||snapshot.meta.id!==META_KEY||!Array.isArray(snapshot.records))throw new Error('INVALID_SNAPSHOT_CONTENT');
      if(!snapshot.meta.vaultId) snapshot.meta.vaultId='vault_'+bytesToB64Url(randomBytes(18));
      if(meta&&!overwrite)throw new Error('VAULT_ALREADY_EXISTS');
      const ids=new Set();
      for(const r of snapshot.records){
        if(!r||typeof r.id!=='string'||typeof r.iv!=='string'||typeof r.ciphertext!=='string')throw new Error('INVALID_SNAPSHOT_RECORD');
        if(ids.has(r.id))throw new Error('DUPLICATE_SNAPSHOT_RECORD');
        ids.add(r.id);
      }
      await new Promise((resolve,reject)=>{
        const t=db.transaction(['meta','records'],'readwrite');
        const m=t.objectStore('meta'),r=t.objectStore('records');
        m.clear();r.clear();
        m.put(snapshot.meta);
        for(const record of snapshot.records)r.put(record);
        t.oncomplete=()=>resolve();
        t.onerror=()=>reject(t.error);
        t.onabort=()=>reject(t.error||new Error('SNAPSHOT_IMPORT_ABORTED'));
      });
      meta=snapshot.meta;
      dataKey=null;
      return {importedRecords:snapshot.records.length,status:api.status(),exportedAt:snapshot.exportedAt||null};
    },
    async downloadEncryptedSnapshot(){
      const json=await api.exportEncryptedSnapshot();
      const blob=new Blob([json],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='creabundalo-vault-'+new Date().toISOString().slice(0,10)+'.enc.json';a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
  };
  window.CreaVault=api;
})();