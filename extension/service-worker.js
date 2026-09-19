const SESSION_KEY='creabundalo.overlay.graph.v01';

function defaultGraph(){
  return {
    version:1,
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
  return result[SESSION_KEY] || defaultGraph();
}
async function setGraph(graph){
  await chrome.storage.session.set({[SESSION_KEY]:graph});
  return graph;
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
      sendResponse({ok:true,graph:await getGraph()});
      return;
    }
    if(message?.type==='CREA_GRAPH_SET'){
      sendResponse({ok:true,graph:await setGraph(message.graph)});
      return;
    }
    if(message?.type==='CREA_GRAPH_RESET'){
      const graph=defaultGraph();
      await setGraph(graph);
      sendResponse({ok:true,graph});
      return;
    }
    sendResponse({ok:false,error:'UNKNOWN_MESSAGE'});
  })().catch(err=>sendResponse({ok:false,error:String(err?.message||err)}));
  return true;
});
