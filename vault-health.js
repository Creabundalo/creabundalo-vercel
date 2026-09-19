(() => {
  const DB_NAME='creabundalo-vault-health-v0';
  const STORE='health';
  const ID='continuity';
  let db=null;

  function openDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{
        const d=req.result;
        if(!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE,{keyPath:'id'});
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
  }
  async function ensureDb(){
    if(!db) db=await openDb();
    return db;
  }
  async function getState(){
    await ensureDb();
    return new Promise((resolve,reject)=>{
      const req=db.transaction(STORE,'readonly').objectStore(STORE).get(ID);
      req.onsuccess=()=>resolve(req.result||{
        id:ID,
        updatedAt:null,
        local:{status:'UNKNOWN',lastSuccess:null,lastError:null},
        scaleway:{status:'UNKNOWN',lastSuccess:null,lastVerified:null,lastError:null},
        independent:{status:'UNKNOWN',lastSuccess:null,lastVerified:null,lastError:null},
        restore:{lastSuccess:null,lastSource:null,lastError:null}
      });
      req.onerror=()=>reject(req.error);
    });
  }
  async function putState(state){
    await ensureDb();
    state.updatedAt=new Date().toISOString();
    return new Promise((resolve,reject)=>{
      const req=db.transaction(STORE,'readwrite').objectStore(STORE).put(state);
      req.onsuccess=()=>resolve(state);
      req.onerror=()=>reject(req.error);
    });
  }
  async function patch(path,values){
    const state=await getState();
    const target=state[path]||(state[path]={});
    Object.assign(target,values);
    return putState(state);
  }
  async function success(path,extra={}){
    return patch(path,{status:'OK',lastSuccess:new Date().toISOString(),lastError:null,...extra});
  }
  async function error(path,error){
    return patch(path,{status:'ERROR',lastError:String(error?.message||error),lastErrorAt:new Date().toISOString()});
  }
  async function verified(path,extra={}){
    return patch(path,{status:'OK',lastVerified:new Date().toISOString(),lastError:null,...extra});
  }
  async function restored(source){
    const state=await getState();
    state.restore={lastSuccess:new Date().toISOString(),lastSource:source,lastError:null};
    return putState(state);
  }
  async function restoreError(source,errorValue){
    const state=await getState();
    state.restore={
      ...state.restore,
      lastSource:source,
      lastError:String(errorValue?.message||errorValue),
      lastErrorAt:new Date().toISOString()
    };
    return putState(state);
  }
  function fmt(iso){
    if(!iso) return 'nog nooit';
    try{
      return new Intl.DateTimeFormat('nl-NL',{
        day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'
      }).format(new Date(iso));
    }catch{return iso}
  }
  async function summary(){
    const s=await getState();
    return {
      ...s,
      labels:{
        local:fmt(s.local?.lastSuccess),
        scaleway:fmt(s.scaleway?.lastSuccess),
        scalewayVerified:fmt(s.scaleway?.lastVerified),
        independent:fmt(s.independent?.lastSuccess),
        independentVerified:fmt(s.independent?.lastVerified),
        restore:fmt(s.restore?.lastSuccess)
      }
    };
  }

  window.CreaVaultHealth={getState,success,error,verified,restored,restoreError,summary,fmt};
})();