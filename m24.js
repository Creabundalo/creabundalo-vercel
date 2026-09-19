globalThis.M24 = (() => {
  const state = {
    asset:'BTC', lens:'m24', mode:'story', level:'episode', resolution:'D', competence:'analysis',
    overlays:{momentum:true,fibonacci:true,trickster:true,cross:true,patterns:true}
  };
  let runtime=null;
  let snapshot=null;
  let forecasts=[];
  let transactions=[];
  let labResult=null;
  let currentStoryFlag=null;

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const svgNS='http://www.w3.org/2000/svg';

  function binding(name){try{return eval(name)}catch{return null}}
  function loadScript(src, globalName){
    const existing=binding(globalName);
    if (existing) return Promise.resolve(existing);
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');s.src=src;s.async=false;
      s.onload=()=>{const value=binding(globalName);value?resolve(value):reject(new Error(`${globalName} did not initialize`))};
      s.onerror=()=>reject(new Error(`Cannot load ${src}`));document.head.append(s);
    });
  }

  async function initRuntime(){
    await loadScript('m24-core.js','M24Core');
    await loadScript('m24-data.js','M24Data');
    await loadScript('m24-vercel-live.js','M24VercelLive');
    await loadScript('m24-historical.js','M24Historical');
    await loadScript('m24-lab.js','M24Lab');
    const modelFallback=new M24Data.MockProvider();
    const liveProvider=new M24VercelLive.VercelMarketProvider({fallback:modelFallback});
    const provider=new M24Historical.HistoricalProvider({fallback:liveProvider});
    runtime=new M24Core.Runtime({provider});
    transactions=M24Data.paperTransactions.map(spec=>runtime.transactions.create({
      asset:spec.asset,direction:spec.direction,strategy:spec.strategy,entry:spec.entry,size:spec.size,
      userStatus:spec.userStatus,auditStatus:spec.auditStatus,pnl:spec.pnl,why:spec.why,risk:spec.risk,
      target:spec.target,forecast:spec.forecast,trickster:spec.trickster
    }));
  }

  function pointsFor(values){
    const min=Math.min(...values),max=Math.max(...values),w=920,h=300,x0=40,y0=340;
    return values.map((v,i)=>({x:x0+(i/(values.length-1))*w,y:y0-((v-min)/(max-min||1))*h,v}));
  }
  const linePath=pts=>pts.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ');
  const areaPath=pts=>`${linePath(pts)} L ${pts.at(-1).x} 360 L ${pts[0].x} 360 Z`;
  function clear(el){while(el&&el.firstChild)el.removeChild(el.firstChild)}
  function svg(tag,attrs={}){const el=document.createElementNS(svgNS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));return el}

  const EVIDENCE_LABELS=Object.freeze({
    MECHANISM_VISIBLE:'Gemeten mechanisme',
    PLAUSIBLE_INTERPRETATION:'Mogelijke uitleg',
    INTENT_UNKNOWN:'Intentie onbekend',
    SOURCE_GAP:'Bron ontbreekt'
  });
  const ACTION_LABELS=Object.freeze({
    WAIT:'Nog niets doen',
    TEST:'Eerst toetsen',
    'DOWNSIDE WATCH':'Opletten op neerwaartse bevestiging',
    'DOWNSIDE CANDIDATE':'Neerwaartse kandidaat',
    'SHORT CANDIDATE':'Short-kandidaat',
    'LONG CANDIDATE':'Long-kandidaat'
  });

  function competenceProjection(){
    return globalThis.CompetenceProjection
      ? globalThis.CompetenceProjection.projectionFor(state.competence)
      : {label:'Analyse',description:'Vaktaal en mechanismen.',showEvidenceCodes:true,showRawSources:false,showGlossary:false};
  }
  function projectEvidence(code){
    const p=competenceProjection();
    return p.showEvidenceCodes?code:(EVIDENCE_LABELS[code]||String(code||'Onbekend'));
  }
  function projectAction(code){
    const p=competenceProjection();
    return p.showEvidenceCodes?code:(ACTION_LABELS[code]||String(code||'Geen actie'));
  }
  function glossaryText(f){
    const bits=[];
    if(f?.action==='WAIT') bits.push('WAIT = nog geen bevestiging; M24 doet niets.');
    if(String(f?.action||'').includes('WATCH')) bits.push('Watch = patroon volgen, nog geen transactie.');
    if(String(f?.action||'').includes('CANDIDATE')) bits.push('Kandidaat = hypothese is sterker, maar uitvoering blijft apart.');
    if(f?.evidence==='MECHANISM_VISIBLE') bits.push('Gemeten mechanisme = zichtbaar in de gebruikte data.');
    if(f?.evidence==='PLAUSIBLE_INTERPRETATION') bits.push('Mogelijke uitleg = past bij de data, maar is niet bewezen.');
    return bits.join(' ');
  }
  function renderStoryProjection(f){
    if(!f) return;
    const badge=$('#evidenceBadge'),action=$('#actionCandidate');
    $('#storyTitle').textContent=f.title;
    badge.dataset.raw=f.evidence||'';
    badge.textContent=projectEvidence(f.evidence);
    action.dataset.raw=f.action||'';
    action.textContent=projectAction(f.action);
    $('#storyBody').innerHTML=`<p><strong>Wat zie je?</strong> ${f.what}</p><p><strong>Wat speelt eronder?</strong> ${f.why}</p><p><strong>Betekeniswereld:</strong> ${f.meaning}</p><p><strong>M24-lezing:</strong> ${f.reading}</p>`;
    const glossary=$('#competenceGlossary');
    if(glossary) glossary.textContent=glossaryText(f)||'Dezelfde marktbetekenis blijft staan; alleen de hoeveelheid uitleg verandert.';
    const trace=$('#expertTrace');
    if(trace){
      trace.textContent=JSON.stringify({
        evidence:f.evidence,
        action:f.action,
        asset:state.asset,
        lens:state.lens,
        level:state.level,
        resolution:state.resolution,
        mechanisms:snapshot?.market?.mechanisms||[],
        sourceStatus:snapshot?.market?.sourceStatus||'MODEL',
        sourceAsOf:snapshot?.market?.sourceAsOf||null,
        sourceQuality:snapshot?.market?.sourceQuality||null
      },null,2);
    }
  }
  function renderCompetence(){
    const cp=globalThis.CompetenceProjection
      ? globalThis.CompetenceProjection.applyToDocument(document,state.competence)
      : competenceProjection();
    const select=$('#competenceSelect');
    if(select) select.value=state.competence;
    const hint=$('#competenceHint');
    if(hint) hint.textContent=`${cp.label} — ${cp.description} De data en M24-logica veranderen niet.`;
    if(currentStoryFlag) renderStoryProjection(currentStoryFlag);
    else{
      const badge=$('#evidenceBadge'),action=$('#actionCandidate');
      if(badge) badge.textContent=projectEvidence(badge.dataset.raw||'MECHANISM_VISIBLE');
      if(action) action.textContent=projectAction(action.dataset.raw||'WAIT');
    }
  }

  function renderChart(){
    const a=snapshot.market,pts=pointsFor(a.values);
    $('#priceLine').setAttribute('d',linePath(pts));$('#priceArea').setAttribute('d',areaPath(pts));
    $('#assetTitle').textContent=`${a.name} — ${state.level} / ${state.resolution}`;
    $('#priceNow').textContent=a.price;$('#trendNow').textContent=a.trend;
    const badge=$('#marketSourceBadge');
    if(badge){
      const source=a.sourceStatus||'MODEL';
      badge.textContent=source+(a.sourceAsOf?' · '+a.sourceAsOf:'');
      badge.dataset.state=source;
      badge.title=[a.sourceFreshness,a.sourceQuality,a.sourceError].filter(Boolean).join(' · ');
    }
    const liveState=$('#livePriceStatus');
    if(liveState){liveState.textContent=a.sourceStatus||'MODEL';liveState.dataset.state=a.sourceStatus||'MODEL';}
    $('#windowStart').textContent=a.window[0];$('#windowLabel').textContent=a.window[1];$('#windowEnd').textContent=a.window[2];
    renderFlags(pts,a);renderFib(pts);renderMomentum(pts);renderTrickster(pts);
  }

  function fallbackFlag(a,pts){return {i:Math.floor(pts.length*.55),label:'context',title:'Contextpunt',evidence:'PLAUSIBLE_INTERPRETATION',action:'WAIT',what:'Contextpunt in de geselecteerde marktstate.',why:'Deze asset krijgt later echte historische en live signalen.',meaning:snapshot.meaning.narrative,reading:a.mechanism}}
  function renderFlags(pts,a){
    const layer=$('#flagLayer');clear(layer);const flags=a.flags?.length?a.flags:[fallbackFlag(a,pts)];
    flags.forEach((f,idx)=>{const p=pts[Math.min(Math.max(f.i,0),pts.length-1)],g=svg('g',{class:'flag','data-flag':idx,tabindex:'0'});g.append(svg('line',{x1:p.x,y1:p.y-45,x2:p.x,y2:p.y-6}));g.append(svg('circle',{cx:p.x,cy:p.y-49,r:8}));const t=svg('text',{x:p.x+12,y:p.y-45});t.textContent=f.label;g.append(t);g.addEventListener('click',()=>showStory(f));g.addEventListener('keydown',e=>{if(e.key==='Enter')showStory(f)});layer.append(g)});
  }
  function renderFib(){const l=$('#fibLayer');clear(l);l.style.display=state.overlays.fibonacci?'':'none';if(!state.overlays.fibonacci)return;[125,205].forEach((y,i)=>{const label=['1.272','1.618'][i];l.append(svg('line',{x1:620,y1:y,x2:950,y2:y,class:'fib-line'}));const t=svg('text',{x:900,y:y-7,class:'fib-text'});t.textContent=`Fib ${label}`;l.append(t)})}
  function renderMomentum(pts){const l=$('#momentumLayer');clear(l);l.style.display=state.overlays.momentum?'':'none';if(!state.overlays.momentum)return;const a=pts[Math.floor(pts.length*.3)],b=pts[Math.floor(pts.length*.55)];l.append(svg('path',{d:`M ${a.x} ${Math.max(35,a.y-65)} Q ${(a.x+b.x)/2} ${Math.max(25,a.y-95)} ${b.x} ${Math.max(45,b.y-35)}`,class:'momentum-mark'}));const t=svg('text',{x:b.x-40,y:Math.max(35,b.y-50),class:'overlay-text'});t.textContent=state.mode==='lab'?'RSI/volume test':'momentum ↓';l.append(t)}
  function renderTrickster(pts){const l=$('#tricksterLayer');clear(l);l.style.display=state.overlays.trickster?'':'none';if(!state.overlays.trickster)return;const p=pts[Math.floor(pts.length*.5)];l.append(svg('rect',{x:p.x-55,y:45,width:180,height:255,rx:18,class:'trickster-zone'}));const t=svg('text',{x:p.x-42,y:65,class:'overlay-text'});t.textContent='Trickster watch';l.append(t)}

  function showStory(f){
    currentStoryFlag=f;
    renderStoryProjection(f);
  }

  function renderMeaning(){
    const a=snapshot.market,meaning=snapshot.meaning,trick=snapshot.trick;
    const variants={
      legacy:['Legacy: rente, inflatie, groei, werkgelegenheid, krediet en conventionele waardering.','Dezelfde marktstate gelezen via bestaande economische relaties.'],
      m24:[meaning.narrative,a.mechanism],
      ai:['AI-native: welke oude relaties verschuiven als compute/automatisering arbeid en productie herschikken?','Experimentele toekomstlens; nog geen bewezen vervanger van Legacy.']
    };
    const v=variants[state.lens];$('#narrativeText').textContent=v[0];$('#mechanismText').textContent=v[1];
    const cp=competenceProjection();
    if(cp.showEvidenceCodes){
      $('#tricksterResult').textContent=trick.data.directionConflict?'DISCREPANTIE GEVONDEN — intentie onbekend':'GEEN HARDE DISCREPANTIE — monitor';
      $('#tricksterDetail').textContent=`${trick.data.summary} Mechanismen: ${(trick.data.mechanisms||[]).join(', ')||'geen hard patroon'}. Intentie blijft ${trick.data.intentStatus}.`;
    }else{
      $('#tricksterResult').textContent=trick.data.directionConflict?'Verhaal en meting lopen uiteen':'Geen duidelijke tegenstelling';
      $('#tricksterDetail').textContent=trick.data.directionConflict
        ? `${trick.data.summary} M24 ziet verschil tussen het marktverhaal en de meting. Dat zegt niets over de bedoeling van marktpartijen.`
        : `${trick.data.summary} Blijven volgen; er is nu geen harde tegenstelling tussen verhaal en meting.`;
    }
  }

  function renderCross(){
    const g=$('#crossGrid');g.innerHTML=snapshot.cross.map(x=>`<div class="cross-card"><span>${x.name}</span><strong class="${x.className}">${x.direction}</strong><small>${x.state}${x.asOf?' · '+x.asOf:''}</small></div>`).join('');
    const live=$('#liveCrossStatus');
    if(live){
      const hasGap=snapshot.cross.some(x=>x.status==='SOURCE_GAP');
      const hasLive=snapshot.cross.some(x=>x.status==='OK');
      live.textContent=hasLive?(hasGap?'PARTIAL':'DAILY'):'MODEL';
      live.dataset.state=hasLive?(hasGap?'PARTIAL':'DELAYED'):'MODEL';
    }
    $('#crossAssetPanel').classList.toggle('hidden',!state.overlays.cross);
  }

  function renderForecast(){
    const signalScore=snapshot.market.mechanismScore;
    forecasts=runtime.forecast.create({subjectId:state.asset,signalScore,lens:state.lens,conditions:{level:state.level,resolution:state.resolution,mode:state.mode}});
    forecasts.forEach(f=>runtime.store.add(f));
    $('#forecastGrid').innerHTML=forecasts.map(f=>{const c=Math.round((f.confidence||0)*100);const d=f.data.direction==='UP'?'↑':f.data.direction==='DOWN'?'↓':f.data.direction==='NEUTRAL'?'→':'scenario';return `<div class="forecast-item"><span>${f.data.horizon}</span><strong>${d}</strong><div class="confidence"><i style="width:${c}%"></i></div><span>${c}% modelzekerheid*</span></div>`}).join('');
  }

  function money(n){return Number(n).toLocaleString('en-US',{maximumFractionDigits:0})}
  function signed(n){return `${n>=0?'+':''}${Number(n).toFixed(1)}%`}
  function renderHistory(){
    const base=M24Data.historicalCases.map(c=>`<div class="history-item"><span>${c.label}</span><strong>${c.pattern}</strong><p>${c.note}</p><small>${c.status}</small></div>`).join('');
    const measured=labResult?`<div class="history-item"><span>MEASURED / ${labResult.resolution}</span><strong>${labResult.caseId}</strong><p>2e top: ${signed(labResult.comparisons.priceHighChangePct)} · weekvolume: ${signed(labResult.comparisons.volumeChangePct)} · RSI14: ${labResult.firstTop.rsi14} → ${labResult.secondTop.rsi14}</p><p>RSI-divergentie: <strong>${labResult.comparisons.rsiBearishDivergence?'BEVESTIGD':'NIET BEVESTIGD'}</strong> · support-break: ${labResult.support.firstWeeklyCloseBelow||'geen'} · trough: $${money(labResult.outcome.troughLow)} (${signed(labResult.outcome.drawdownFromSecondHighPct)})</p><small>${labResult.provenance?.[0]?.sourceType||'fixture'} / ${labResult.provenance?.[0]?.quality||'unknown quality'}</small></div>`:'';
    $('#historyList').innerHTML=measured+base;
  }

  function statusClass(s){if(s==='OPEN')return'status-open';if(s==='GESLOTEN')return'status-closed';return'status-candidate'}
  function renderTransactions(){
    const g=$('#transactionList');g.innerHTML='';transactions.forEach(tx=>{const t=tx.data;const row=document.createElement('div');row.className='transaction-row row-grid';row.innerHTML=`<div><strong>${t.asset}</strong><span class="sub">${t.mode}</span></div><strong>${t.direction}</strong><span>${t.strategy}</span><span>${t.entry}</span><span><i class="status-tag ${statusClass(t.userStatus)}">${t.userStatus}</i></span><strong class="${String(t.pnl).startsWith('+')?'up':''}">${t.pnl}</strong><button class="row-open" aria-label="Open transactie ${tx.id}">›</button>`;row.addEventListener('click',()=>showTransaction(tx));g.append(row)});
  }
  function showTransaction(tx){
    const t=tx.data,steps=M24Core.AUDIT_STATUS,current=Math.max(0,steps.indexOf(t.auditStatus));const d=$('#transactionDetail');d.classList.remove('hidden');
    d.innerHTML=`<div class="panel-head"><div><p class="eyebrow">${tx.id} / ${t.mode}</p><h2>${t.asset} · ${t.direction} · ${t.userStatus}</h2></div><button class="row-open" id="closeTransaction">×</button></div><div class="detail-grid"><div class="detail-card"><span>Entry</span><strong>${t.entry}</strong></div><div class="detail-card"><span>Size</span><strong>${t.size}</strong></div><div class="detail-card"><span>Risk</span><strong>${t.risk}</strong></div><div class="detail-card"><span>Target</span><strong>${t.target}</strong></div><div class="detail-card"><span>Forecast</span><strong>${t.forecast}</strong></div><div class="detail-card"><span>P/L</span><strong>${t.pnl}</strong></div><div class="detail-card"><span>Trickster</span><strong>${t.trickster}</strong></div><div class="detail-card"><span>Audit</span><strong>${t.auditStatus}</strong></div></div><div class="state-line">${steps.map((s,i)=>`<span class="state-step ${i<=current?'done':''}">${s}</span>`).join('')}</div><p class="transaction-story"><strong>Waarom deze transactie?</strong><br>${t.why}</p>`;
    $('#closeTransaction').addEventListener('click',e=>{e.stopPropagation();d.classList.add('hidden')});
  }

  function readObservations(){try{return JSON.parse(localStorage.getItem('m24-observations')||'[]')}catch{return[]}}
  function renderObservations(){const items=readObservations();$('#observationLog').innerHTML=items.map(x=>`<div class="observation-entry">🚩 ${x.asset} · ${x.level} · ${x.text}</div>`).join('')}
  function addObservation(){const input=$('#observationInput'),text=input.value.trim();if(!text)return;const items=readObservations();const item={id:`OBS-${Date.now()}`,asset:state.asset,level:state.level,resolution:state.resolution,text,at:new Date().toISOString()};items.unshift(item);localStorage.setItem('m24-observations',JSON.stringify(items.slice(0,30)));runtime.store.add(M24Core.record('USER_OBSERVATION',item,{subjectId:state.asset,evidenceStatus:M24Core.EVIDENCE.PLAUSIBLE_INTERPRETATION}));input.value='';renderObservations()}

  function renderBreadcrumb(){$$('.breadcrumb button').forEach(b=>b.classList.toggle('current',b.dataset.level===state.level))}
  function renderMode(){$$('.mode').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));$('#labPanel').classList.toggle('hidden',state.mode!=='lab');$('#overlayStrip').classList.toggle('hidden',state.mode==='story')}
  function renderLens(){$$('.lens').forEach(b=>b.classList.toggle('active',b.dataset.lens===state.lens))}

  function renderDataStatus(){
    const meaning=$('#meaningLayerStatus');if(meaning){meaning.textContent='MODEL';meaning.dataset.state='MODEL';}
    const world=$('#worldLayerStatus');if(world){world.textContent='SNAPSHOT';world.dataset.state='SNAPSHOT';}
    const exec=$('#executionLayerStatus');if(exec){exec.textContent='PAPER';exec.dataset.state='PAPER';}
  }
  function renderAll(){renderChart();renderMeaning();renderCross();renderForecast();renderHistory();renderTransactions();renderObservations();renderBreadcrumb();renderMode();renderLens();renderDataStatus();renderCompetence()}

  async function refresh(){
    snapshot=await runtime.snapshot(state.asset,{window:state.level,resolution:state.resolution,lens:state.lens,mode:state.mode});
    labResult=null;
    if(state.mode==='lab'&&state.asset==='BTC'&&snapshot.market.bars){
      const historicalCase=await runtime.provider.getHistoricalCase('BTC-2021-2022-TOP-MARKDOWN');
      labResult=M24Lab.analyzeTopMarkdown(historicalCase);
      const exists=runtime.store.where(r=>r.type==='LAB_RESULT'&&r.subjectId===state.asset&&r.data?.caseId===labResult.caseId).length>0;
      if(!exists) runtime.store.add(M24Core.record('LAB_RESULT',labResult,{subjectId:state.asset,window:'2021-01/2022-06',resolution:'W',evidenceStatus:M24Core.EVIDENCE.MECHANISM_VISIBLE,confidence:1,provenance:labResult.provenance||[]}));
    }
    renderAll();
  }

  function wire(){
    $('#assetSelect').addEventListener('change',e=>{state.asset=e.target.value;refresh()});
    $('#resolutionSelect').addEventListener('change',e=>{state.resolution=e.target.value;refresh()});
    $('#competenceSelect').addEventListener('change',e=>{
      state.competence=e.target.value;
      if(globalThis.CompetenceProjection) globalThis.CompetenceProjection.setStage('investing',state.competence,localStorage);
      if(state.competence==='guided'&&state.mode!=='story') state.mode='story';
      if(state.competence==='learning'&&state.mode==='lab') state.mode='analysis';
      refresh();
    });
    $$('.lens').forEach(b=>b.addEventListener('click',()=>{state.lens=b.dataset.lens;refresh()}));
    $$('.mode').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mode;if(state.mode==='lab'&&state.asset==='BTC'){state.resolution='W';$('#resolutionSelect').value='W'}refresh()}));
    $$('.breadcrumb button').forEach(b=>b.addEventListener('click',()=>{state.level=b.dataset.level;refresh()}));
    $$('[data-overlay]').forEach(i=>i.addEventListener('change',()=>{state.overlays[i.dataset.overlay]=i.checked;renderAll()}));
    $('#addObservation').addEventListener('click',addObservation);$('#observationInput').addEventListener('keydown',e=>{if(e.key==='Enter')addObservation()});
  }

  async function boot(){
    try{
      await initRuntime();
      if(globalThis.CompetenceProjection) state.competence=globalThis.CompetenceProjection.getStage('investing',localStorage);
      wire();
      await refresh()
    }
    catch(err){console.error(err);$('#storyTitle').textContent='M24 runtime fout';$('#storyBody').innerHTML=`<p>${err.message}</p>`}
  }
  boot();
  return {state,refresh,get runtime(){return runtime},get labResult(){return labResult}};
})();
