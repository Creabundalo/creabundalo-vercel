(() => {
  if(globalThis.__creabundaloOverlay){
    globalThis.__creabundaloOverlay.toggle();
    return;
  }

  const adapter=globalThis.CreaOverlayAdapters.resolve(location);
  const host=document.createElement('div');
  host.id='creabundalo-semantic-overlay-host';
  host.style.all='initial';
  host.style.position='fixed';
  host.style.left='0';
  host.style.top='0';
  host.style.zIndex='2147483647';
  document.documentElement.appendChild(host);

  const root=host.attachShadow({mode:'closed'});
  root.innerHTML=`
    <style>
      :host{all:initial}
      *{box-sizing:border-box}
      .rail{
        position:fixed;left:14px;top:14px;width:300px;max-height:calc(100vh - 28px);
        overflow:auto;background:rgba(249,248,244,.97);color:#171714;
        border:1px solid #d8d6cd;border-radius:18px;box-shadow:0 18px 50px rgba(20,20,15,.15);
        font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
        transition:transform .18s ease,opacity .18s ease;
      }
      .rail.hidden{transform:translateX(calc(-100% - 22px));opacity:.3}
      .head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;padding:14px;border-bottom:1px solid #dfddd5}
      .brand{font-size:12px;font-weight:800;letter-spacing:.08em}
      .sub{font-size:10px;color:#77766f;margin-top:3px}
      button{font:inherit;cursor:pointer}
      .icon,.ghost,.primary{border:1px solid #d8d6cd;background:transparent;color:#171714;border-radius:999px;padding:7px 9px;font-size:11px}
      .primary{background:#171714;color:#fff;border-color:#171714}
      .body{padding:13px}
      .label{font-size:9px;letter-spacing:.12em;color:#77766f;text-transform:uppercase;margin-bottom:5px}
      .crumbs{font-size:12px;font-weight:700;line-height:1.35;margin-bottom:13px}
      .current{border:1px solid #d8d6cd;background:#fff;border-radius:14px;padding:11px;margin-bottom:10px}
      .current strong{font-size:13px;line-height:1.25;display:block}
      .meta{display:flex;justify-content:space-between;gap:8px;margin-top:8px;font-size:10px;color:#77766f}
      .meter{height:5px;background:#e5e3db;border-radius:99px;overflow:hidden;margin-top:8px}
      .meter>span{display:block;height:100%;background:#171714;width:0}
      .actions{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 12px}
      .tree{display:grid;gap:6px}
      .node{border:1px solid #e0ded6;background:#fff;border-radius:11px;padding:8px;text-align:left;width:100%}
      .node.active{border-color:#171714}
      .node small{display:block;color:#77766f;margin-top:3px}
      .manual{display:grid;gap:6px;border-top:1px solid #dfddd5;padding-top:12px;margin-top:12px}
      textarea{width:100%;min-height:58px;resize:vertical;border:1px solid #d8d6cd;border-radius:11px;padding:9px;background:#fff;color:#171714;font:inherit;font-size:12px}
      .foot{display:flex;justify-content:space-between;gap:8px;padding:10px 13px;border-top:1px solid #dfddd5;color:#77766f;font-size:9px}
      .toggle{
        position:fixed;left:14px;bottom:14px;width:42px;height:42px;border-radius:50%;
        border:1px solid #171714;background:#171714;color:#fff;font-weight:800;
        box-shadow:0 10px 30px rgba(0,0,0,.18);display:none
      }
      .rail.hidden + .toggle{display:block}
    </style>
    <section class="rail">
      <div class="head">
        <div>
          <div class="brand">CREABUNDALO</div>
          <div class="sub">Semantic Overlay · <span data-adapter></span></div>
        </div>
        <button class="icon" data-hide>×</button>
      </div>
      <div class="body">
        <div class="label">ROOT → CURRENT</div>
        <div class="crumbs" data-crumbs></div>

        <article class="current">
          <div class="label">CURRENT</div>
          <strong data-current-title></strong>
          <div class="meta"><span data-kind></span><span data-depth></span></div>
          <div class="meter"><span data-meter></span></div>
          <div class="meta"><span>patroonstatus</span><span data-pattern></span></div>
        </article>

        <div class="actions">
          <button class="ghost" data-back>← terug</button>
          <button class="ghost" data-root>⌂ root</button>
          <button class="ghost" data-loose>los</button>
          <button class="primary" data-project>maak project</button>
        </div>

        <div class="label">BRANCHES HIER</div>
        <div class="tree" data-tree></div>

        <div class="manual">
          <div class="label">HANDMATIG / CORPORATE AI</div>
          <textarea data-input placeholder="Vraag of geselecteerde tekst…"></textarea>
          <div class="actions">
            <button class="ghost" data-selection>Neem selectie</button>
            <button class="primary" data-add>Maak branch</button>
          </div>
        </div>
      </div>
      <div class="foot">
        <span>SESSION ONLY</span>
        <span>geen host-dataopslag</span>
      </div>
    </section>
    <button class="toggle" data-show>C</button>
  `;

  const $=sel=>root.querySelector(sel);
  const rail=$('.rail');
  $('[data-adapter]').textContent=adapter.label;

  let graph=null;
  let observer=null;
  let scanTimer=null;

  const send=message=>new Promise(resolve=>{
    chrome.runtime.sendMessage(message,response=>resolve(response||{ok:false,error:'NO_RESPONSE'}));
  });
  const byId=id=>graph.nodes.find(n=>n.id===id);
  const current=()=>byId(graph.currentId)||graph.nodes[0];
  const children=id=>graph.nodes.filter(n=>n.parentId===id);
  const ancestors=id=>{
    const list=[]; let node=byId(id);
    while(node){list.unshift(node);node=node.parentId?byId(node.parentId):null;}
    return list;
  };
  const depth=id=>Math.max(0,ancestors(id).length-1);
  const uid=()=>globalThis.crypto?.randomUUID?.()||('n_'+Date.now()+'_'+Math.random().toString(16).slice(2));
  const title=text=>{
    const t=text.replace(/\s+/g,' ').trim();
    return t.length>62?t.slice(0,59)+'…':t;
  };
  const save=async()=>{
    await send({type:'CREA_GRAPH_SET',graph});
  };

  function patternState(){
    const d=depth(graph.currentId);
    const sinceProject=ancestors(graph.currentId).reverse().findIndex(n=>n.kind==='project'||n.kind==='root');
    const steps=sinceProject<0?d:sinceProject;
    const score=Math.min(.88,.12+steps*.11);
    const label=score<.35?'open':score<.68?'forming':'dense';
    return {score,label};
  }

  function render(){
    const c=current();
    const chain=ancestors(c.id);
    $('[data-crumbs]').textContent=chain.map(n=>n.title).join(' › ');
    $('[data-current-title]').textContent=c.title;
    $('[data-kind]').textContent=(c.kind||'branch').toUpperCase();
    $('[data-depth]').textContent='DEPTH '+depth(c.id);
    const p=patternState();
    $('[data-meter]').style.width=Math.round(p.score*100)+'%';
    $('[data-pattern]').textContent=p.label+' · '+Math.round(p.score*100)+'%';

    const tree=$('[data-tree]');
    tree.innerHTML='';
    const siblings=c.parentId?children(c.parentId):[c];
    const next=children(c.id);
    const visible=[...siblings,...next.filter(n=>!siblings.some(s=>s.id===n.id))].slice(-10);
    for(const n of visible){
      const b=document.createElement('button');
      b.className='node'+(n.id===c.id?' active':'');
      b.innerHTML='<strong></strong><small></small>';
      b.querySelector('strong').textContent=n.title;
      b.querySelector('small').textContent=(n.kind||'branch')+(n.status==='paused'?' · parked':'');
      b.onclick=()=>{graph.currentId=n.id;save().then(render);};
      tree.appendChild(b);
    }
  }

  async function addBranch(text,{edgeLabel=text,source='manual'}={}){
    const value=(text||'').replace(/\s+/g,' ').trim();
    if(!value) return;
    const parent=current();
    const node={
      id:uid(),
      parentId:parent.id,
      title:title(value),
      edgeLabel:title(edgeLabel||value),
      kind:'branch',
      status:'active',
      source,
      createdAt:Date.now()
    };
    graph.nodes.push(node);
    graph.currentId=node.id;
    await save();
    render();
  }

  async function scanTurns(){
    const turns=adapter.getTurns();
    for(const turn of turns){
      if(turn.role!=='user'||graph.seenTurnKeys.includes(turn.key)) continue;
      graph.seenTurnKeys.push(turn.key);
      if(graph.seenTurnKeys.length>250) graph.seenTurnKeys=graph.seenTurnKeys.slice(-250);
      await addBranch(turn.text,{source:adapter.id});
    }
    await save();
  }

  $('[data-hide]').onclick=()=>rail.classList.add('hidden');
  $('[data-show]').onclick=()=>rail.classList.remove('hidden');
  $('[data-back]').onclick=async()=>{
    const c=current();
    if(c.parentId){graph.currentId=c.parentId;await save();render();}
  };
  $('[data-root]').onclick=async()=>{
    graph.currentId=ancestors(graph.currentId)[0]?.id||'root';
    await save();render();
  };
  $('[data-project]').onclick=async()=>{
    const c=current();c.kind='project';c.status='active';await save();render();
  };
  $('[data-loose]').onclick=async()=>{
    const c=current();
    if(c.id!=='root'){c.parentId='root';c.kind='branch';await save();render();}
  };
  $('[data-selection]').onclick=()=>{
    const text=globalThis.CreaOverlayAdapters.selection();
    if(text) $('[data-input]').value=text;
  };
  $('[data-add]').onclick=async()=>{
    const input=$('[data-input]');
    await addBranch(input.value,{source:'manual'});
    input.value='';
  };

  async function init(){
    const response=await send({type:'CREA_GRAPH_GET'});
    graph=response?.graph||{
      version:1,currentId:'root',
      nodes:[{id:'root',parentId:null,title:'Huidige sessie',kind:'root',status:'active',createdAt:Date.now()}],
      seenTurnKeys:[]
    };
    render();
    await scanTurns();

    observer=new MutationObserver(()=>{
      clearTimeout(scanTimer);
      scanTimer=setTimeout(()=>scanTurns().catch(()=>{}),500);
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:false});
  }

  globalThis.__creabundaloOverlay={
    toggle(){rail.classList.toggle('hidden');},
    destroy(){
      observer?.disconnect();
      clearTimeout(scanTimer);
      host.remove();
      delete globalThis.__creabundaloOverlay;
    }
  };

  init().catch(err=>{
    console.warn('Creabundalo overlay init failed',err);
  });
})();
