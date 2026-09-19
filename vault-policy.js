(() => {
  const POLICY=Object.freeze({
    autoSyncMinMs:15*60*1000,
    autoBackupMinMs:6*60*60*1000,
    verifyWarnMs:7*24*60*60*1000,
    syncWarnMs:24*60*60*1000,
    backupWarnMs:7*24*60*60*1000,
    retention:{daily:14,weekly:12,monthly:24}
  });

  let syncTimer=null;
  let running=false;

  function ageMs(iso){
    if(!iso) return Infinity;
    const t=new Date(iso).getTime();
    return Number.isFinite(t)?Date.now()-t:Infinity;
  }
  function isoWeekKey(date){
    const d=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()));
    const day=d.getUTCDay()||7;
    d.setUTCDate(d.getUTCDate()+4-day);
    const yearStart=new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const week=Math.ceil((((d-yearStart)/86400000)+1)/7);
    return d.getUTCFullYear()+'-W'+String(week).padStart(2,'0');
  }
  function dayKey(date){
    return date.toISOString().slice(0,10);
  }
  function monthKey(date){
    return date.toISOString().slice(0,7);
  }

  function analyzeRetention(items,policy=POLICY.retention){
    const sorted=[...items].sort((a,b)=>b.lastModified-a.lastModified);
    const keep=new Set();
    const now=Date.now();

    const dayBuckets=new Set(),weekBuckets=new Set(),monthBuckets=new Set();

    for(const item of sorted){
      const d=new Date(item.lastModified);
      const ageDays=(now-item.lastModified)/86400000;

      if(ageDays<=policy.daily){
        const key=dayKey(d);
        if(!dayBuckets.has(key)){dayBuckets.add(key);keep.add(item.name);}
        continue;
      }

      if(ageDays<=policy.weekly*7){
        const key=isoWeekKey(d);
        if(!weekBuckets.has(key)){weekBuckets.add(key);keep.add(item.name);}
        continue;
      }

      if(ageDays<=policy.monthly*31){
        const key=monthKey(d);
        if(!monthBuckets.has(key)){monthBuckets.add(key);keep.add(item.name);}
        continue;
      }
    }

    if(sorted[0]) keep.add(sorted[0].name);

    const keepItems=sorted.filter(i=>keep.has(i.name));
    const deleteItems=sorted.filter(i=>!keep.has(i.name));
    return {
      total:sorted.length,
      keep:keepItems,
      delete:deleteItems,
      policy
    };
  }

  async function maybeAutoContinuity(){
    if(running) return {skipped:'BUSY'};
    running=true;
    try{
      const vault=window.CreaVault?.status?.();
      if(!vault?.initialized || !vault?.unlocked) return {skipped:'VAULT_LOCKED'};
      const health=await window.CreaVaultHealth.getState();
      const snapshot=await window.CreaVault.exportEncryptedSnapshot();
      const results=[];

      const sync=window.CreaVaultStorage.get('SCALEWAY_SYNC');
      if(sync?.mode==='AVAILABLE' && ageMs(health.scaleway?.lastSuccess)>=POLICY.autoSyncMinMs){
        try{
          await window.CreaVaultStorage.write('SCALEWAY_SYNC',snapshot,{privacyClass:'VAULT_HIGH'});
          await window.CreaVaultHealth.success('scaleway');
          results.push('AUTO_SYNC_OK');
        }catch(err){
          await window.CreaVaultHealth.error('scaleway',err);
          results.push('AUTO_SYNC_ERROR');
        }
      }

      const backup=window.CreaVaultStorage.get('INDEPENDENT_BACKUP');
      if(backup?.mode==='AVAILABLE' && ageMs(health.independent?.lastSuccess)>=POLICY.autoBackupMinMs){
        try{
          await window.CreaVaultStorage.write('INDEPENDENT_BACKUP',snapshot,{privacyClass:'VAULT_HIGH'});
          await window.CreaVaultHealth.success('independent');
          results.push('AUTO_BACKUP_OK');
        }catch(err){
          await window.CreaVaultHealth.error('independent',err);
          results.push('AUTO_BACKUP_ERROR');
        }
      }
      return {results};
    }finally{
      running=false;
    }
  }

  function continuityWarnings(health,{syncEnabled=false,backupEnabled=false}={}){
    const out=[];
    if(syncEnabled && ageMs(health.scaleway?.lastSuccess)>POLICY.syncWarnMs) out.push('Scaleway sync ouder dan 24 uur');
    if(backupEnabled && ageMs(health.independent?.lastSuccess)>POLICY.backupWarnMs) out.push('Onafhankelijke backup ouder dan 7 dagen');
    if(
      syncEnabled && health.scaleway?.lastSuccess &&
      ageMs(health.scaleway?.lastVerified)>POLICY.verifyWarnMs
    ) out.push('Scaleway herstelbaarheid langer dan 7 dagen niet geverifieerd');
    if(
      backupEnabled && health.independent?.lastSuccess &&
      ageMs(health.independent?.lastVerified)>POLICY.verifyWarnMs
    ) out.push('Backup herstelbaarheid langer dan 7 dagen niet geverifieerd');
    return out;
  }

  async function retentionPreview(){
    const items=await window.CreaVaultStorage.listIndependentBackups();
    return analyzeRetention(items);
  }

  async function applyRetention(){
    const preview=await retentionPreview();
    if(!preview.delete.length) return {deleted:0,preview};
    const result=await window.CreaVaultStorage.deleteIndependentBackups(preview.delete.map(i=>i.name));
    return {...result,preview};
  }

  function start(){
    if(syncTimer) return;
    syncTimer=setInterval(()=>maybeAutoContinuity().catch(()=>{}),5*60*1000);
    window.addEventListener('focus',()=>maybeAutoContinuity().catch(()=>{}));
    document.addEventListener('visibilitychange',()=>{
      if(document.visibilityState==='visible') maybeAutoContinuity().catch(()=>{});
    });
    setTimeout(()=>maybeAutoContinuity().catch(()=>{}),5000);
  }

  window.CreaVaultPolicy={
    POLICY,ageMs,analyzeRetention,retentionPreview,applyRetention,
    continuityWarnings,maybeAutoContinuity,start
  };
})();