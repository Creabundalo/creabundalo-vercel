const SESSION_KEY='creabundalo.overlay.graph.v02';
const EVENT_KEY='creabundalo.overlay.events.v01';

function id(){
  return globalThis.crypto?.randomUUID?.() || ('id_'+Date.now()+'_'+Math.random().toString(16).slice(2));
}
function defaultGraph(){
  return {
    version:2,
    sessionId:id(),
    currentId:'root',
    nodes:[{
      id:'root',
      parentId:null,
      title:'Huidige sessie',
      edgeLabel:null,
      kind:'root',
      status:'active',
      createdAt:Date.now()
    }],
    seenTurnKeys:[]
  };
}
async function getGraph(){
  const result=await chrome.storage.session.get(SESSION_KEY);
  if(result[SESSION_KEY]) return result[SESSION_KEY];
  const graph=defaultGraph();
  await chrome.storage.session.set({[SESSION_KEY]:graph});
  return graph;
}
async function setGraph(graph){
  await chrome.storage.session.set({[SESSION_KEY]:graph});
  return graph;
}
async function getEvents(){
  const result=await chrome.storage.session.get(EVENT_KEY);
  return Array.isArray(result[EVENT_KEY]) ? result[EVENT_KEY] : [];
}
async function setEvents(events){
  await chrome.storage.session.set({[EVENT_KEY]:events.slice(-1000)});
  return events;
}
async function appendEvent(event){
  const graph=await getGraph();
  const events=await getEvents();
  const normalized={
    schema:'creabundalo.semantic-event.v1',
    eventId:event?.eventId||id(),
    sessionId:event?.sessionId||graph.sessionId,
    type:String(event?.type||'UNKNOWN'),
    occurredAt:event?.occurredAt||new Date().toISOString(),
    source:{
      surface:'browser-extension',
      adapter:String(event?.source?.adapter||'unknown'),
      host:String(event?.source?.host||'')
    },
    payload:event?.payload||{}
  };
  events.push(normalized);
  await setEvents(events);
  return {event:normalized,pending:events.length};
}
async function ackEvents(ids=[]){
  const remove=new Set(ids);
  const events=(await getEvents()).filter(e=>!remove.has(e.eventId));
  await setEvents(events);
  return events.length;
}
function externalSenderAllowed(sender){
  const url=sender?.url||'';
  return /^https:\/\/([a-z0-9-]+\.)?creabundalo\.com\//i.test(url)
    || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(url);
}

chrome.runtime.onInstalled.addListener(async()=>{
  await chrome.storage.session.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});
});

chrome.action.onClicked.addListener(async tab=>{
  if(!tab.id || !tab.url || !/^https?:\/\//.test(tab.url)) return;
  try{
    await chrome.scripting.executeScript({
      target:{tabId:tab.id},
      files:['adapters.js','content-script.js']
    });
  }catch(err){
    console.warn('Creabundalo injection failed',err);
  }
});

chrome.runtime.onMessage.addListener((message,_sender,sendResponse)=>{
  (async()=>{
    if(message?.type==='CREA_GRAPH_GET'){
      sendResponse({ok:true,graph:await getGraph(),pending:(await getEvents()).length});
      return;
    }
    if(message?.type==='CREA_GRAPH_SET'){
      sendResponse({ok:true,graph:await setGraph(message.graph),pending:(await getEvents()).length});
      return;
    }
    if(message?.type==='CREA_EVENT_APPEND'){
      sendResponse({ok:true,...await appendEvent(message.event)});
      return;
    }
    if(message?.type==='CREA_GRAPH_RESET'){
      const graph=defaultGraph();
      await setGraph(graph);
      await setEvents([]);
      sendResponse({ok:true,graph,pending:0});
      return;
    }
    sendResponse({ok:false,error:'UNKNOWN_MESSAGE'});
  })().catch(err=>sendResponse({ok:false,error:String(err?.message||err)}));
  return true;
});

chrome.runtime.onMessageExternal.addListener((message,sender,sendResponse)=>{
  (async()=>{
    if(!externalSenderAllowed(sender)){
      sendResponse({ok:false,error:'ORIGIN_NOT_ALLOWED'});
      return;
    }
    if(message?.type==='CREA_BRIDGE_STATUS'){
      const graph=await getGraph();
      const events=await getEvents();
      sendResponse({
        ok:true,
        version:1,
        sessionId:graph.sessionId,
        pending:events.length
      });
      return;
    }
    if(message?.type==='CREA_BRIDGE_PULL'){
      const events=await getEvents();
      sendResponse({ok:true,events});
      return;
    }
    if(message?.type==='CREA_BRIDGE_ACK'){
      const pending=await ackEvents(Array.isArray(message.eventIds)?message.eventIds:[]);
      sendResponse({ok:true,pending});
      return;
    }
    sendResponse({ok:false,error:'UNKNOWN_EXTERNAL_MESSAGE'});
  })().catch(err=>sendResponse({ok:false,error:String(err?.message||err)}));
  return true;
});
