(() => {
  const PRIVACY=Object.freeze({
    STANDARD:10,
    PRIVATE:20,
    VAULT_HIGH:30,
    ENTERPRISE_RESTRICTED:40
  });

  const providers=new Map();
  let scalewayToken=null;

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
  async function syncApi(action,vaultId){
    if(!scalewayToken) throw new Error('PROVIDER_AUTH_REQUIRED');
    if(!/^[A-Za-z0-9_-]{16,100}$/.test(vaultId||'')) throw new Error('INVALID_VAULT_ID');
    const response=await fetch('/api/vault-sync',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer '+scalewayToken
      },
      body:JSON.stringify({action,vaultId})
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
      const signed=await syncApi('presign-put',metadata.vaultId);
      const upload=await fetch(signed.url,{
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:snapshotText
      });
      if(!upload.ok) throw new Error('SCALEWAY_PUT_'+upload.status);
      return {provider:'SCALEWAY_SYNC',status:'WRITTEN',expiresIn:signed.expiresIn};
    },
    async readSnapshot({metadata={}}={}){
      const signed=await syncApi('presign-get',metadata.vaultId);
      const response=await fetch(signed.url,{method:'GET',cache:'no-store'});
      if(response.status===404) return null;
      if(!response.ok) throw new Error('SCALEWAY_GET_'+response.status);
      return response.text();
    }
  });

  register({
    id:'INDEPENDENT_BACKUP',
    label:'Onafhankelijke backup (Proton/NAS)',
    mode:'DISABLED',
    allowedPrivacyClasses:['STANDARD','PRIVATE','VAULT_HIGH','ENTERPRISE_RESTRICTED'],
    async writeSnapshot(){
      throw new Error('BACKUP_ADAPTER_NOT_CONFIGURED');
    }
  });

  window.CreaVaultStorage={PRIVACY,register,get,list,write,read,configureScaleway};
})();