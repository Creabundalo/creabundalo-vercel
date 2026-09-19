(() => {
  if(globalThis.CreaOverlayAdapters) return;

  const cleanText=value=>(value||'').replace(/\s+/g,' ').trim();
  const hash=text=>{
    let h=2166136261;
    for(let i=0;i<text.length;i++){
      h^=text.charCodeAt(i);
      h=Math.imul(h,16777619);
    }
    return (h>>>0).toString(16);
  };

  const chatgpt={
    id:'chatgpt',
    label:'ChatGPT',
    matches:loc=>/^(chatgpt\.com|chat\.openai\.com)$/.test(loc.hostname),
    getTurns(){
      const selectors=[
        '[data-message-author-role="user"]',
        '[data-message-author-role="assistant"]'
      ];
      const nodes=[...document.querySelectorAll(selectors.join(','))];
      return nodes.map((node,index)=>{
        const role=node.getAttribute('data-message-author-role');
        const text=cleanText(node.innerText||node.textContent);
        return text ? {role,text,key:role+':'+index+':'+hash(text)} : null;
      }).filter(Boolean);
    }
  };

  const generic={
    id:'generic',
    label:'Handmatig',
    matches:()=>true,
    getTurns(){ return []; }
  };

  const adapters=[chatgpt,generic];

  globalThis.CreaOverlayAdapters={
    resolve(loc=location){ return adapters.find(a=>a.matches(loc)) || generic; },
    selection(){
      return cleanText(globalThis.getSelection?.().toString()||'');
    }
  };
})();
