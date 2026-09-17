const M24 = (() => {
  const state = {
    asset: 'BTC', lens: 'm24', mode: 'story', level: 'episode', resolution: 'D',
    overlays: {momentum:true,fibonacci:true,trickster:true,cross:true,patterns:true}
  };

  const assets = {
    BTC:{name:'Bitcoin',price:'76.2k',trend:'↘ zwak',window:['2019','2021–2022 episode','2026'],values:[18,22,30,45,68,84,58,72,91,78,60,46,51,38,44,34,42,39],
      flags:[
        {i:5,label:'1e top',title:'Eerste top',evidence:'MECHANISM_VISIBLE',action:'WAIT',what:'Sterke stijging eindigt in een eerste scherpe reactie.',why:'Momentum en deelname zijn hoog; eerste winstneming en liquidaties verschijnen.',meaning:'Het dominante verhaal blijft bullish.',reading:'Nog geen trendbreuk. Dit wordt een referentiepunt voor de volgende top.'},
        {i:8,label:'2e top',title:'Tweede piek / divergentie',evidence:'PLAUSIBLE_INTERPRETATION',action:'DOWNSIDE WATCH',what:'Prijs bereikt opnieuw een hoge zone.',why:'De mock-momentumlaag is zwakker dan bij de eerste piek en cross-asset bevestiging neemt af.',meaning:'Het verhaal zegt voortzetting; de onderliggende kracht bevestigt minder.',reading:'Trickster-vraag: is dit een echte breakout of een lokbeweging? Wacht op steunbreuk.'},
        {i:11,label:'break',title:'Steunbreuk',evidence:'MECHANISM_VISIBLE',action:'SHORT CANDIDATE',what:'De geselecteerde steunzone breekt.',why:'Verkoopdruk en gedwongen afbouw kunnen elkaar versterken.',meaning:'Het bullish verhaal verliest geloofwaardigheid.',reading:'Pas hier ontstaat structurele downside-bevestiging; uitvoering blijft PAPER in v0.1.'}
      ],
      narrative:'“Dip kopen; macrotrend blijft omhoog.”',mechanism:'Tweede top kwetsbaar; momentum en bevestiging lopen terug.',trick:'DISCREPANTIE GEVONDEN — intentie onbekend',trickDetail:'Prijsverhaal en gemeten kracht lopen uiteen. Geen actor toeschrijven zonder bewijs.'},
    TSLA:{name:'Tesla',price:'421',trend:'→ gemengd',window:['2018','selected cycle','2026'],values:[22,31,26,43,55,48,69,81,74,89,82,70,65,72,61,67,58,63],flags:[],narrative:'“AI/robotica rechtvaardigt langdurige groei.”',mechanism:'Hoge verwachting kan samengaan met gevoelige waardering en flow.',trick:'GEEN HARDE DISCREPANTIE — monitor',trickDetail:'Narratief en prijs zijn nog niet voldoende uit elkaar gelopen.'},
    OIL:{name:'WTI Oil',price:'101',trend:'↘ afkoelend',window:['2006','2008 peak analogue','2026'],values:[30,37,48,67,86,95,73,52,34,42,58,62,55,71,82,75,69,73],flags:[],narrative:'“Aanbodstress houdt olie structureel hoog.”',mechanism:'Aanbod, vraag, geopolitiek en liquiditeit kunnen tegelijk draaien.',trick:'NARRATIEF/MECHANISME TE TOETSEN',trickDetail:'Controleer of prijsstijging door fysiek tekort of positionering wordt gedragen.'},
    SOL:{name:'Solana',price:'184',trend:'↑ volatiel',window:['2020','current lifecycle','2026'],values:[12,20,36,68,86,54,33,46,64,79,62,71,88,76,84,69,77,73],flags:[],narrative:'“Netwerkgebruik en crypto-beta blijven groeien.”',mechanism:'Hoge beta maakt leverage/liquidaties extra belangrijk.',trick:'LIQUIDITY-SWEEP RISICO',trickDetail:'Snelle breaks rond steun/weerstand moeten tegen liquidaties en funding worden gelegd.'}
  };

  const crossAsset = [
    ['Goud','↑','sterk','up'],['WTI olie','↘','afkoelend','down'],['Nasdaq','→','gemengd','flat'],['Credit','↗','krapper','down'],['Dollar','→','neutraal','flat']
  ];
  const forecasts = [
    ['NOW','→',72],['3D','↘/→',61],['2W','scenario',47],['1M','scenario',34],['2M','breed',22]
  ];
  const history = [
    ['BTC 2021','Tweede top + distributie','Te toetsen tegen momentum, leverage, narratief en cross-asset.'],
    ['Nasdaq 2000','Lifecycle saturation','Narratief bleef lang sterk terwijl internals verzwakten.'],
    ['Oil 2008','Blow-off / reversal','Toets fysieke vraag/aanbod versus positionering en liquiditeit.']
  ];
  const transactions = [
    {id:'T-001',asset:'BTC',direction:'SHORT',strategy:'Put spread',entry:'76.4k',size:'0.5R',status:'KANDIDAAT',pnl:'—',mode:'PAPER',stateIndex:1,why:'Tweede top + afnemend momentum; wacht nog op bevestigde steunbreuk.',risk:'Max 0.5R',target:'Fib/structure zone',forecast:'F-0002',trickster:'Discrepantie; intentie onbekend'},
    {id:'T-002',asset:'TSLA',direction:'HEDGE',strategy:'Protective put',entry:'418',size:'0.3R',status:'OPEN',pnl:'+0.12R',mode:'PAPER',stateIndex:4,why:'Bescherming rond hoge volatiliteit; geen directionele short-call.',risk:'Premie begrensd',target:'Protectie tijdens event',forecast:'F-0011',trickster:'Geen hard trickster-signaal'},
    {id:'T-003',asset:'OIL',direction:'LONG',strategy:'Call spread',entry:'94.2',size:'0.4R',status:'GESLOTEN',pnl:'+0.61R',mode:'PAPER',stateIndex:5,why:'Momentum + aanbodstress + cross-asset bevestiging in mockcase.',risk:'0.4R',target:'1.272 extension',forecast:'F-0007',trickster:'Narratief/mechanisme bevestigden elkaar'}
  ];

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const svgNS = 'http://www.w3.org/2000/svg';

  function pointsFor(values){
    const min=Math.min(...values),max=Math.max(...values),w=920,h=300,x0=40,y0=340;
    return values.map((v,i)=>({x:x0+(i/(values.length-1))*w,y:y0-((v-min)/(max-min||1))*h,v}));
  }
  function linePath(points){return points.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ')}
  function areaPath(points){return `${linePath(points)} L ${points.at(-1).x} 360 L ${points[0].x} 360 Z`}
  function clear(el){while(el.firstChild)el.removeChild(el.firstChild)}
  function svg(tag,attrs={}){const el=document.createElementNS(svgNS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));return el}

  function renderChart(){
    const a=assets[state.asset],pts=pointsFor(a.values);
    $('#priceLine').setAttribute('d',linePath(pts));$('#priceArea').setAttribute('d',areaPath(pts));
    $('#assetTitle').textContent=`${a.name} — ${state.level} / ${state.resolution}`;$('#priceNow').textContent=a.price;$('#trendNow').textContent=a.trend;
    $('#windowStart').textContent=a.window[0];$('#windowLabel').textContent=a.window[1];$('#windowEnd').textContent=a.window[2];
    renderFlags(pts,a);renderFib(pts);renderMomentum(pts);renderTrickster(pts);
  }
  function renderFlags(pts,a){
    const layer=$('#flagLayer');clear(layer);const flags=a.flags.length?a.flags:[{i:Math.floor(pts.length*.55),label:'context',title:'Contextpunt',evidence:'PLAUSIBLE_INTERPRETATION',action:'WAIT',what:'Mock contextpunt.',why:'Deze asset krijgt later echte signalen en historie.',meaning:a.narrative,reading:a.mechanism}];
    flags.forEach((f,idx)=>{const p=pts[Math.min(f.i,pts.length-1)],g=svg('g',{class:'flag','data-flag':idx,tabindex:'0'});g.append(svg('line',{x1:p.x,y1:p.y-45,x2:p.x,y2:p.y-6}));g.append(svg('circle',{cx:p.x,cy:p.y-49,r:8}));const t=svg('text',{x:p.x+12,y:p.y-45});t.textContent=f.label;g.append(t);g.addEventListener('click',()=>showStory(f));g.addEventListener('keydown',e=>{if(e.key==='Enter')showStory(f)});layer.append(g)});
  }
  function renderFib(pts){const l=$('#fibLayer');clear(l);l.style.display=state.overlays.fibonacci?'':'none';if(!state.overlays.fibonacci)return;const ys=[125,205];['1.272','1.618'].forEach((label,i)=>{l.append(svg('line',{x1:620,y1:ys[i],x2:950,y2:ys[i],class:'fib-line'}));const t=svg('text',{x:900,y:ys[i]-7,class:'fib-text'});t.textContent=`Fib ${label}`;l.append(t)})}
  function renderMomentum(pts){const l=$('#momentumLayer');clear(l);l.style.display=state.overlays.momentum?'':'none';if(!state.overlays.momentum)return;const a=pts[Math.floor(pts.length*.3)],b=pts[Math.floor(pts.length*.55)];l.append(svg('path',{d:`M ${a.x} ${Math.max(35,a.y-65)} Q ${(a.x+b.x)/2} ${Math.max(25,a.y-95)} ${b.x} ${Math.max(45,b.y-35)}`,class:'momentum-mark'}));const t=svg('text',{x:b.x-40,y:Math.max(35,b.y-50),class:'overlay-text'});t.textContent='momentum ↓';l.append(t)}
  function renderTrickster(pts){const l=$('#tricksterLayer');clear(l);l.style.display=state.overlays.trickster?'':'none';if(!state.overlays.trickster)return;const p=pts[Math.floor(pts.length*.5)];l.append(svg('rect',{x:p.x-55,y:45,width:180,height:255,rx:18,class:'trickster-zone'}));const t=svg('text',{x:p.x-42,y:65,class:'overlay-text'});t.textContent='Trickster watch';l.append(t)}

  function showStory(f){$('#storyTitle').textContent=f.title;$('#evidenceBadge').textContent=f.evidence;$('#actionCandidate').textContent=f.action;$('#storyBody').innerHTML=`<p><strong>Wat zie je?</strong> ${f.what}</p><p><strong>Wat speelt eronder?</strong> ${f.why}</p><p><strong>Betekeniswereld:</strong> ${f.meaning}</p><p><strong>M24-lezing:</strong> ${f.reading}</p>`}
  function renderMeaning(){const a=assets[state.asset];const variants={legacy:['Legacy leest vooral rente, inflatie, groei, werkgelegenheid en conventionele waardering.','Interpretatie blijft dicht bij bestaande economische relaties.'],m24:[a.narrative,a.mechanism],ai:['AI-native vraagt welke oude relaties veranderen als compute en automatisering arbeid/productie herschikken.','Experimentele lens; nog geen bewezen vervanger van Legacy.']};const v=variants[state.lens];$('#narrativeText').textContent=v[0];$('#mechanismText').textContent=v[1];$('#tricksterResult').textContent=a.trick;$('#tricksterDetail').textContent=a.trickDetail}
  function renderCross(){const g=$('#crossGrid');g.innerHTML=crossAsset.map(([n,d,s,c])=>`<div class="cross-card"><span>${n}</span><strong class="${c}">${d}</strong><small>${s}</small></div>`).join('');$('#crossAssetPanel').classList.toggle('hidden',!state.overlays.cross)}
  function renderForecast(){const g=$('#forecastGrid');g.innerHTML=forecasts.map(([h,d,c])=>`<div class="forecast-item"><span>${h}</span><strong>${d}</strong><div class="confidence"><i style="width:${c}%"></i></div><span>${c}% modelzekerheid*</span></div>`).join('')}
  function renderHistory(){const g=$('#historyList');g.innerHTML=history.map(([a,p,n])=>`<div class="history-item"><span>${a}</span><strong>${p}</strong><p>${n}</p></div>`).join('')}

  function statusClass(s){if(s==='OPEN')return'status-open';if(s==='GESLOTEN')return'status-closed';return'status-candidate'}
  function renderTransactions(){
    const g=$('#transactionList');g.innerHTML='';transactions.forEach(t=>{const row=document.createElement('div');row.className='transaction-row row-grid';row.innerHTML=`<div><strong>${t.asset}</strong><span class="sub">${t.mode}</span></div><strong>${t.direction}</strong><span>${t.strategy}</span><span>${t.entry}</span><span><i class="status-tag ${statusClass(t.status)}">${t.status}</i></span><strong class="${t.pnl.startsWith('+')?'up':''}">${t.pnl}</strong><button class="row-open" aria-label="Open transactie ${t.id}">›</button>`;row.addEventListener('click',()=>showTransaction(t));g.append(row)})
  }
  function showTransaction(t){
    const steps=['PREPARE','PREVIEW','APPROVE','COMMIT','VERIFY'];const d=$('#transactionDetail');d.classList.remove('hidden');d.innerHTML=`<div class="panel-head"><div><p class="eyebrow">${t.id} / ${t.mode}</p><h2>${t.asset} · ${t.direction} · ${t.status}</h2></div><button class="row-open" id="closeTransaction">×</button></div><div class="detail-grid"><div class="detail-card"><span>Entry</span><strong>${t.entry}</strong></div><div class="detail-card"><span>Size</span><strong>${t.size}</strong></div><div class="detail-card"><span>Risk</span><strong>${t.risk}</strong></div><div class="detail-card"><span>Target</span><strong>${t.target}</strong></div><div class="detail-card"><span>Forecast</span><strong>${t.forecast}</strong></div><div class="detail-card"><span>P/L</span><strong>${t.pnl}</strong></div><div class="detail-card"><span>Trickster</span><strong>${t.trickster}</strong></div><div class="detail-card"><span>Status</span><strong>${t.status}</strong></div></div><div class="state-line">${steps.map((s,i)=>`<span class="state-step ${i<t.stateIndex?'done':''}">${s}</span>`).join('')}</div><p class="transaction-story"><strong>Waarom deze transactie?</strong><br>${t.why}</p>`;$('#closeTransaction').addEventListener('click',e=>{e.stopPropagation();d.classList.add('hidden')})
  }

  function renderObservations(){const items=JSON.parse(localStorage.getItem('m24-observations')||'[]');$('#observationLog').innerHTML=items.map(x=>`<div class="observation-entry">🚩 ${x.asset} · ${x.level} · ${x.text}</div>`).join('')}
  function addObservation(){const input=$('#observationInput'),text=input.value.trim();if(!text)return;const items=JSON.parse(localStorage.getItem('m24-observations')||'[]');items.unshift({asset:state.asset,level:state.level,text,time:new Date().toISOString()});localStorage.setItem('m24-observations',JSON.stringify(items.slice(0,20)));input.value='';renderObservations()}

  function bind(){
    $('#assetSelect').addEventListener('change',e=>{state.asset=e.target.value;renderAll()});$('#resolutionSelect').addEventListener('change',e=>{state.resolution=e.target.value;renderChart()});
    $$('.lens').forEach(b=>b.addEventListener('click',()=>{$$('.lens').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.lens=b.dataset.lens;renderMeaning()}));
    $$('.mode').forEach(b=>b.addEventListener('click',()=>{$$('.mode').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.mode=b.dataset.mode;$('#labPanel').classList.toggle('hidden',state.mode!=='lab');$('#overlayStrip').style.opacity=state.mode==='story'?'.72':'1'}));
    $$('.breadcrumb button').forEach(b=>b.addEventListener('click',()=>{$$('.breadcrumb button').forEach(x=>x.classList.remove('current'));b.classList.add('current');state.level=b.dataset.level;renderChart()}));
    $$('#overlayStrip input').forEach(i=>i.addEventListener('change',()=>{state.overlays[i.dataset.overlay]=i.checked;renderChart();renderCross()}));
    $('#addObservation').addEventListener('click',addObservation);$('#observationInput').addEventListener('keydown',e=>{if(e.key==='Enter')addObservation()});
  }
  function renderAll(){renderChart();renderMeaning();renderCross();renderForecast();renderHistory();renderTransactions();renderObservations()}
  function init(){bind();renderAll()}
  return {init};
})();

document.addEventListener('DOMContentLoaded',M24.init);
