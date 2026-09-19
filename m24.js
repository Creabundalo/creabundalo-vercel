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

  function fundingPct(value){
    return Number.isFinite(Number(value))?`${(Number(value)*100).toFixed(4)}%`:'—';
  }
  function derivativesReadingText(code){
    const map={
      LONG_LEVERAGE_EXPANDING:'Open interest loopt op en funding is positief: long-leverage neemt toe.',
      SHORT_LEVERAGE_EXPANDING:'Open interest loopt op en funding is negatief: short-leverage neemt toe.',
      LEVERAGE_CONTRACTING:'Open interest neemt af: leverage wordt afgebouwd.',
      LEVERAGE_STABLE:'Funding en open interest tonen geen sterke leverage-uitbreiding.',
      INSUFFICIENT_DATA:'Nog onvoldoende derivatendata voor een betekenisvolle leverage-lezing.'
    };
    return map[code]||String(code||'Geen lezing');
  }
  function renderDerivatives(){
    const d=snapshot.derivatives||{};
    const grid=$('#derivativesGrid');
    const status=$('#liveDerivativesStatus');
    const badge=$('#derivativesSourceBadge');
    const meaning=$('#derivativesMeaning');

    if(d.sourceStatus==='NOT_APPLICABLE'||d.sourceStatus==='NOT_AVAILABLE'){
      if(grid) grid.innerHTML=`<div class="derivatives-na"><strong>Niet van toepassing</strong><span>Voor ${state.asset} is in deze bronset geen ondersteunde perpetual-derivatenlaag gekoppeld.</span></div>`;
      if(status){status.textContent='N/A';status.dataset.state='MODEL';}
      if(badge){badge.textContent='N/A';badge.dataset.state='FALLBACK';}
      if(meaning) meaning.textContent='M24 verzint hier geen derivatendata; deze laag blijft expliciet niet van toepassing.';
      return;
    }

    if(d.sourceStatus!=='OK'){
      if(grid) grid.innerHTML=`<div class="derivatives-na"><strong>Source gap</strong><span>${d.error||'Derivatenbron tijdelijk niet beschikbaar.'}</span></div>`;
      if(status){status.textContent='SOURCE GAP';status.dataset.state='PARTIAL';}
      if(badge){badge.textContent='SOURCE GAP';badge.dataset.state='FALLBACK';}
      if(meaning) meaning.textContent='Geen live derivatencontext gebruikt zolang de bron niet aantoonbaar beschikbaar is.';
      return;
    }

    const funding=d.funding||{},oi=d.openInterest||{},reading=d.interpretation?.leverageReading;
    if(grid){
      grid.innerHTML=`
        <div class="derivative-card"><span>Funding nu</span><strong>${fundingPct(funding.currentRate)}</strong><small>avg recent ${fundingPct(funding.averageRecentRate)} · n=${funding.observations??'—'}</small></div>
        <div class="derivative-card"><span>Open interest</span><strong>${Number.isFinite(Number(oi.changeRecentPct))?(Number(oi.changeRecentPct)>=0?'+':'')+Number(oi.changeRecentPct).toFixed(2)+'%':'—'}</strong><small>recent venster · n=${oi.observations??'—'}</small></div>
        <div class="derivative-card"><span>M24 betekenis</span><strong class="derivatives-reading">${reading||'INSUFFICIENT_DATA'}</strong><small>${d.asOf?'as-of '+d.asOf:'live derivatives'}</small></div>`;
    }
    if(status){status.textContent='LIVE';status.dataset.state='LIVE';}
    if(badge){badge.textContent='BINANCE USD-M · LIVE';badge.dataset.state='LIVE';}
    if(meaning) meaning.textContent=derivativesReadingText(reading)+' Dit is positioneringscontext, geen zelfstandig trade-signaal.';
  }

  function optionPct(value){
    return Number.isFinite(Number(value))?`${Number(value).toFixed(2)}%`:'—';
  }
  function optionsMeaningText(o){
    const i=o?.interpretation||{};
    const parts=[];
    if(i.skew==='PUT_IV_RICH') parts.push('puts zijn rond ATM duurder in implied volatility dan calls');
    else if(i.skew==='CALL_IV_RICH') parts.push('calls zijn rond ATM duurder in implied volatility dan puts');
    else if(i.skew==='ATM_SKEW_BALANCED') parts.push('ATM put/call IV is ongeveer in balans');

    if(i.termStructure==='FRONT_IV_HIGHER') parts.push('korte looptijd-IV ligt hoger dan verder weg: voorste expiratie draagt extra onzekerheid');
    else if(i.termStructure==='BACK_IV_HIGHER') parts.push('langere looptijd-IV ligt hoger dan de voorste expiratie');
    else if(i.termStructure==='IV_CURVE_FLAT') parts.push('de gemeten IV-term structure is vrij vlak');

    if(i.positioning==='PUT_OI_HEAVY') parts.push('put open interest is zwaarder dan call open interest');
    else if(i.positioning==='CALL_OI_HEAVY') parts.push('call open interest is zwaarder dan put open interest');
    else if(i.positioning==='PUT_CALL_OI_BALANCED') parts.push('put/call open interest is ongeveer in balans');

    return parts.length?parts.join('. ')+'.':'Nog onvoldoende optiedata voor een volledige betekenislezing.';
  }
  function renderOptions(){
    const o=snapshot.options||{};
    const grid=$('#optionsGrid');
    const status=$('#liveOptionsStatus');
    const badge=$('#optionsSourceBadge');
    const meaning=$('#optionsMeaning');

    if(o.sourceStatus==='NOT_APPLICABLE'||o.sourceStatus==='NOT_AVAILABLE'){
      if(grid) grid.innerHTML=`<div class="options-na"><strong>Niet van toepassing</strong><span>Voor ${state.asset} is in deze bronset nog geen ondersteunde live-optiebron aangesloten.</span></div>`;
      if(status){status.textContent='N/A';status.dataset.state='MODEL';}
      if(badge){badge.textContent='N/A';badge.dataset.state='FALLBACK';}
      if(meaning) meaning.textContent='M24 vult ontbrekende optiedata niet synthetisch in.';
      return;
    }

    if(o.sourceStatus!=='OK'){
      if(grid) grid.innerHTML=`<div class="options-na"><strong>Source gap</strong><span>${o.error||'Optiebron tijdelijk niet beschikbaar.'}</span></div>`;
      if(status){status.textContent='SOURCE GAP';status.dataset.state='PARTIAL';}
      if(badge){badge.textContent='SOURCE GAP';badge.dataset.state='FALLBACK';}
      if(meaning) meaning.textContent='Geen optiebetekenis gebruikt zolang de live bron niet aantoonbaar beschikbaar is.';
      return;
    }

    const f=o.front||{},b=o.back||{},i=o.interpretation||{};
    if(grid){
      grid.innerHTML=`
        <div class="option-card"><span>ATM IV</span><strong>${optionPct(f.atmIv)}</strong><small>${f.expiryDate||'—'} · strike ${f.atmStrike??'—'}</small></div>
        <div class="option-card"><span>ATM put-call IV skew</span><strong>${Number.isFinite(Number(f.atmPutCallIvSkew))?(Number(f.atmPutCallIvSkew)>=0?'+':'')+Number(f.atmPutCallIvSkew).toFixed(2)+' vol':'—'}</strong><small>put IV − call IV · geen 25-delta skew</small></div>
        <div class="option-card"><span>Put / Call OI</span><strong>${Number.isFinite(Number(f.putCallOiRatio))?Number(f.putCallOiRatio).toFixed(2):'—'}</strong><small>front expiry · totaal OI ${f.totalOpenInterest??'—'}</small></div>
        <div class="option-card"><span>Term structure</span><strong>${i.termSpreadVolPoints==null?'—':(i.termSpreadVolPoints>=0?'+':'')+Number(i.termSpreadVolPoints).toFixed(2)+' vol'}</strong><small>${f.expiryDate||'front'} → ${b.expiryDate||'geen back expiry'}</small></div>`;
    }
    if(status){status.textContent='LIVE';status.dataset.state='LIVE';}
    if(badge){badge.textContent='DERIBIT · LIVE';badge.dataset.state='LIVE';}
    if(meaning) meaning.textContent=optionsMeaningText(o)+' Context, geen zelfstandig trade-signaal.';
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

  function sourceStateClass(value){
    const v=String(value||'').toUpperCase();
    if(['OK','STORED','ACTIVE','LIVE','DAILY'].includes(v)) return 'ok';
    if(['DELAYED','PARTIAL','MODEL','SNAPSHOT','PAPER','AUDIT','SEPARATE','SIMULATED_ONLY','NO_BROKER','N/A'].includes(v)) return 'warn';
    if(['GAP','SOURCE_GAP','FALLBACK'].includes(v)) return 'gap';
    return 'neutral';
  }
  function sourceCell(value){
    const text=String(value??'—');
    return `<span class="source-health-state ${sourceStateClass(text)}">${text}</span>`;
  }
  function renderSourceHealth(){
    const g=$('#sourceHealthGrid');
    if(!g||!globalThis.M24SourceHealth||!snapshot) return;
    const rows=globalThis.M24SourceHealth.build(snapshot);
    g.innerHTML=rows.map(row=>`
      <div class="source-health-row source-health-grid" data-source-layer="${row.id}">
        <strong>${row.label}</strong>
        <span title="${row.quality||''}">${row.source}</span>
        ${sourceCell(row.api)}
        ${sourceCell(row.normalize)}
        ${sourceCell(row.qubus)}
        ${sourceCell(row.m24)}
        <span class="source-health-freshness">${row.freshness}${row.asOf?' · '+row.asOf:''}</span>
        ${sourceCell(row.overall)}
      </div>
    `).join('');
  }

  function renderAll(){renderChart();renderMeaning();renderDerivatives();renderOptions();renderCross();renderForecast();renderHistory();renderTransactions();renderObservations();renderBreadcrumb();renderMode();renderLens();renderDataStatus();renderSourceHealth();renderCompetence()}

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
