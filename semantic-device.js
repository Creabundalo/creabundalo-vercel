(() => {
  const DB_NAME='creabundalo-semantic-device-v1';
  const STORE='device';
  const ID='identity';
  let db=null;
  let identity=null;

  function randomId(){
    const bytes=new Uint8Array(18);
    crypto.getRandomValues(bytes);
    let raw='';
    for(const b of bytes) raw+=String.fromCharCode(b);
    return 'dev_'+btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
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
  function getRecord(){
    return new Promise((resolve,reject)=>{
      const req=db.transaction(STORE,'readonly').objectStore(STORE).get(ID);
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error);
    });
  }
  function putRecord(value){
    return new Promise((resolve,reject)=>{
      const req=db.transaction(STORE,'readwrite').objectStore(STORE).put(value);
      req.onsuccess=()=>resolve(value);
      req.onerror=()=>reject(req.error);
    });
  }
  async function init(){
    if(identity) return status();
    db=await openDb();
    identity=await getRecord();
    if(!identity){
      identity={
        id:ID,
        deviceId:randomId(),
        label:'Dit apparaat',
        seq:0,
        lamport:0,
        vector:{},
        createdAt:new Date().toISOString(),
        updatedAt:new Date().toISOString()
      };
      identity.vector[identity.deviceId]=0;
      await putRecord(identity);
    }
    identity.vector ||= {};
    identity.vector[identity.deviceId]=Math.max(Number(identity.vector[identity.deviceId])||0,Number(identity.seq)||0);
    return status();
  }
  function ensure(){
    if(!identity) throw new Error('DEVICE_IDENTITY_NOT_INITIALIZED');
    return identity;
  }
  function status(){
    if(!identity) return {initialized:false};
    return {
      initialized:true,
      deviceId:identity.deviceId,
      label:identity.label,
      seq:identity.seq,
      lamport:identity.lamport,
      vector:{...identity.vector},
      createdAt:identity.createdAt
    };
  }
  function stamp(event,{scope='shared'}={}){
    const i=ensure();
    i.seq=(Number(i.seq)||0)+1;
    i.lamport=(Number(i.lamport)||0)+1;
    i.vector[i.deviceId]=i.seq;
    event.causal={
      deviceId:i.deviceId,
      seq:i.seq,
      lamport:i.lamport,
      vector:{...i.vector},
      scope
    };
    i.updatedAt=new Date().toISOString();
    putRecord(identity).catch(()=>{});
    return event;
  }
  function observe(event){
    const i=ensure();
    const c=event?.causal;
    if(!c?.deviceId) return status();
    const seq=Number(c.seq)||0;
    const remoteLamport=Number(c.lamport)||0;
    i.vector[c.deviceId]=Math.max(Number(i.vector[c.deviceId])||0,seq);
    for(const [deviceId,value] of Object.entries(c.vector||{})){
      i.vector[deviceId]=Math.max(Number(i.vector[deviceId])||0,Number(value)||0);
    }
    i.lamport=Math.max(Number(i.lamport)||0,remoteLamport)+1;
    i.updatedAt=new Date().toISOString();
    putRecord(identity).catch(()=>{});
    return status();
  }
  function relation(a,b){
    const av=a?.causal?.vector||{};
    const bv=b?.causal?.vector||{};
    const keys=new Set([...Object.keys(av),...Object.keys(bv)]);
    let aGreater=false,bGreater=false;
    for(const key of keys){
      const x=Number(av[key])||0,y=Number(bv[key])||0;
      if(x>y)aGreater=true;
      if(y>x)bGreater=true;
    }
    if(!aGreater&&!bGreater) return 'equal';
    if(aGreater&&!bGreater) return 'after';
    if(!aGreater&&bGreater) return 'before';
    return 'concurrent';
  }
  async function setLabel(label){
    const i=ensure();
    i.label=String(label||'').trim().slice(0,80)||'Dit apparaat';
    i.updatedAt=new Date().toISOString();
    await putRecord(i);
    return status();
  }

  window.CreaSemanticDevice={init,status,stamp,observe,relation,setLabel};
})();