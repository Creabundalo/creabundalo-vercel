(() => {
  const LABEL_PREFIX='semantic-event-segment-v1:';
  const SEGMENT_TYPE='CREABUNDALO_SEMANTIC_EVENT_SEGMENT';

  function chunks(items,size){
    const out=[];
    for(let i=0;i<items.length;i+=size) out.push(items.slice(i,i+size));
    return out;
  }

  async function listRemoteSegments({maxPages=20,pageSize=200}={}){
    const vaultId=window.CreaVault.status().vaultId;
    if(!vaultId) throw new Error('VAULT_ID_MISSING');

    const items=[];
    let cursor=null;
    for(let page=0;page<maxPages;page++){
      const result=await window.CreaVaultStorage.syncControl('list-event-segments',{
        vaultId,
        cursor,
        maxKeys:pageSize
      });
      items.push(...(result.items||[]));
      cursor=result.nextCursor||null;
      if(!cursor) return {items,truncated:false,pages:page+1};
    }
    return {items,truncated:!!cursor,pages:maxPages,nextCursor:cursor};
  }

  async function uploadMissing(localEvents,remoteItems){
    const device=window.CreaSemanticDevice.status();
    const vaultId=window.CreaVault.status().vaultId;
    if(!device?.deviceId) throw new Error('DEVICE_IDENTITY_MISSING');

    const remoteIds=new Set(remoteItems.map(x=>x.eventId));
    const own=localEvents.filter(event=>{
      const scope=event.causal?.scope||window.CreaSemanticCore.eventScope(event.type);
      return scope==='shared' && event.causal?.deviceId===device.deviceId;
    });
    const missing=own.filter(event=>!remoteIds.has(event.eventId));
    let uploaded=0;

    for(const batch of chunks(missing,100)){
      const segments=batch.map(event=>({
        deviceId:event.causal.deviceId,
        seq:event.causal.seq,
        eventId:event.eventId
      }));
      const signed=await window.CreaVaultStorage.syncControl('presign-event-put-batch',{
        vaultId,
        segments
      });
      const byId=new Map(batch.map(e=>[e.eventId,e]));

      for(const target of signed.uploads||[]){
        const event=byId.get(target.eventId);
        if(!event) continue;
        const portable=await window.CreaVault.sealJSON(
          LABEL_PREFIX+event.eventId,
          {
            type:SEGMENT_TYPE,
            version:1,
            vaultId,
            event
          }
        );
        const response=await fetch(target.url,{
          method:'PUT',
          headers:{'Content-Type':'application/json',...(target.headers||{})},
          body:JSON.stringify(portable)
        });
        if(response.status===412){
          uploaded++;
          continue;
        }
        if(!response.ok) throw new Error('EVENT_PUT_'+response.status);
        uploaded++;
      }
    }
    return {uploaded,missing:missing.length};
  }

  async function fetchSegment(item){
    const response=await fetch(item.url,{method:'GET',cache:'no-store'});
    if(!response.ok) throw new Error('EVENT_GET_'+response.status);
    const portable=await response.json();
    const opened=await window.CreaVault.openJSON(LABEL_PREFIX+item.eventId,portable);

    const vaultId=window.CreaVault.status().vaultId;
    if(opened?.type!==SEGMENT_TYPE||opened?.version!==1) throw new Error('INVALID_EVENT_SEGMENT_PAYLOAD');
    if(opened.vaultId!==vaultId) throw new Error('VAULT_LINEAGE_MISMATCH');
    const event=opened.event;
    if(!window.CreaSemanticCore.validateEvent(event)) throw new Error('INVALID_REMOTE_EVENT');
    if(event.eventId!==item.eventId) throw new Error('EVENT_ID_MISMATCH');
    if(event.causal?.deviceId!==item.deviceId) throw new Error('DEVICE_ID_MISMATCH');
    if(Number(event.causal?.seq)!==Number(item.seq)) throw new Error('DEVICE_SEQ_MISMATCH');
    if((event.causal?.scope||window.CreaSemanticCore.eventScope(event.type))!=='shared'){
      throw new Error('REMOTE_DEVICE_EVENT_NOT_SHARED');
    }
    return event;
  }

  async function mapLimit(items,limit,fn){
    const results=new Array(items.length);
    let next=0;
    async function worker(){
      while(true){
        const index=next++;
        if(index>=items.length) return;
        results[index]=await fn(items[index],index);
      }
    }
    const count=Math.min(Math.max(1,limit),items.length||1);
    await Promise.all(Array.from({length:count},()=>worker()));
    return results;
  }

  async function downloadUnknown(localEvents,remoteItems){
    const localIds=new Set(localEvents.map(e=>e.eventId));
    const unknown=remoteItems.filter(item=>!localIds.has(item.eventId));
    const events=await mapLimit(unknown,6,fetchSegment);
    return {events,downloaded:events.length};
  }

  async function sync(currentState){
    const vault=window.CreaVault.status();
    if(!vault.initialized||!vault.unlocked) throw new Error('VAULT_UNLOCK_REQUIRED');
    if(window.CreaVaultStorage.get('SCALEWAY_SYNC')?.mode!=='AVAILABLE') throw new Error('SCALEWAY_SYNC_NOT_ACTIVE');

    const before=await window.CreaSemanticEventStore.listEvents();
    const remote=await listRemoteSegments();

    const upload=await uploadMissing(before,remote.items);
    const download=await downloadUnknown(before,remote.items);

    let result={
      state:currentState,
      conflicts:[],
      appended:0,
      incoming:download.events.length,
      deduplicated:0
    };

    if(download.events.length){
      const bundle={
        type:'CREABUNDALO_SEMANTIC_EVENT_BUNDLE',
        version:1,
        createdAt:new Date().toISOString(),
        vaultId:vault.vaultId,
        sourceDeviceId:null,
        events:download.events
      };
      result=await window.CreaSemanticEventStore.mergeBundle(bundle,currentState);
    }

    return {
      state:result.state||currentState,
      uploaded:upload.uploaded,
      downloaded:download.downloaded,
      merged:result.appended||0,
      conflicts:result.conflicts||[],
      deduplicated:result.deduplicated||0,
      remoteObjects:remote.items.length,
      pages:remote.pages,
      remoteTruncated:remote.truncated
    };
  }

  window.CreaSemanticCloudSync={listRemoteSegments,sync};
})();