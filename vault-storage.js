(() => {
  const PRIVACY = Object.freeze({
    STANDARD: 10,
    PRIVATE: 20,
    VAULT_HIGH: 30,
    ENTERPRISE_RESTRICTED: 40
  });

  const providers = new Map();

  function assertClass(name){
    if(!(name in PRIVACY)) throw new Error('UNKNOWN_PRIVACY_CLASS');
    return PRIVACY[name];
  }

  function register(provider){
    if(!provider?.id || typeof provider.writeSnapshot!=='function') throw new Error('INVALID_STORAGE_PROVIDER');
    const allowed = new Set(provider.allowedPrivacyClasses || []);
    for(const c of allowed) assertClass(c);
    providers.set(provider.id,{...provider,allowedPrivacyClasses:allowed});
  }

  function get(id){ return providers.get(id) || null; }

  function list(){
    return [...providers.values()].map(p=>({
      id:p.id,
      label:p.label || p.id,
      mode:p.mode || 'AVAILABLE',
      allowedPrivacyClasses:[...p.allowedPrivacyClasses]
    }));
  }

  async function write(providerId,snapshotText,{privacyClass='PRIVATE',metadata={}}={}){
    assertClass(privacyClass);
    const provider=get(providerId);
    if(!provider) throw new Error('PROVIDER_NOT_FOUND');
    if(provider.mode==='DISABLED') throw new Error('PROVIDER_DISABLED');
    if(!provider.allowedPrivacyClasses.has(privacyClass)) throw new Error('PRIVACY_POLICY_BLOCKED');
    return provider.writeSnapshot(snapshotText,{privacyClass,metadata});
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
      a.download=metadata.filename || ('creabundalo-vault-'+new Date().toISOString().slice(0,10)+'.enc.json');
      a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      return {provider:'LOCAL_DOWNLOAD',status:'WRITTEN'};
    }
  });

  register({
    id:'SCALEWAY_SYNC',
    label:'Scaleway encrypted sync',
    mode:'DISABLED',
    allowedPrivacyClasses:['STANDARD','PRIVATE','VAULT_HIGH'],
    async writeSnapshot(){
      throw new Error('SCALEWAY_BACKEND_NOT_CONFIGURED');
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

  window.CreaVaultStorage={PRIVACY,register,get,list,write};
})();