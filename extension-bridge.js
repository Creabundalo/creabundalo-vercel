(() => {
  const ID_KEY='creabundalo.overlay.extension-id.v01';
  let extensionId=localStorage.getItem(ID_KEY)||'';

  function validateId(id){
    return /^[a-p]{32}$/.test(id||'');
  }
  function configure({id,remember=true}={}){
    const value=String(id||'').trim();
    if(!validateId(value)) throw new Error('INVALID_EXTENSION_ID');
    extensionId=value;
    if(remember) localStorage.setItem(ID_KEY,value);
    return extensionId;
  }
  function getId(){return extensionId}
  function supported(){
    return !!globalThis.chrome?.runtime?.sendMessage;
  }
  function send(message){
    return new Promise((resolve,reject)=>{
      if(!supported()) return reject(new Error('CHROME_EXTERNAL_MESSAGING_UNAVAILABLE'));
      if(!validateId(extensionId)) return reject(new Error('EXTENSION_NOT_CONFIGURED'));
      try{
        chrome.runtime.sendMessage(extensionId,message,response=>{
          const error=chrome.runtime.lastError;
          if(error) return reject(new Error(error.message||'EXTENSION_MESSAGE_FAILED'));
          if(!response?.ok) return reject(new Error(response?.error||'EXTENSION_MESSAGE_FAILED'));
          resolve(response);
        });
      }catch(err){reject(err)}
    });
  }
  async function status(){return send({type:'CREA_BRIDGE_STATUS'})}
  async function pull(){return send({type:'CREA_BRIDGE_PULL'})}
  async function ack(eventIds){return send({type:'CREA_BRIDGE_ACK',eventIds})}

  window.CreaOverlayBridge={configure,getId,supported,status,pull,ack,validateId};
})();