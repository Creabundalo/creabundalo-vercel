const state={data:null,asset:'BTC',mode:'story',lens:'m24',resolution:'day',level:0,layers:new Set(['momentum','flow','structure','trickster']),observations:[]};
const levels=['LIFE CYCLE','CYCLE','REGIME','EPISODE','EVENT','MICRO'];
const $=sel=>document.querySelector(sel);
const $$=sel=>[...document.querySelectorAll(sel)];

async function boot(){
  const res=await fetch('m24-mock-data.json',{cache:'no-store'});
  state.data=await res.json();
  bind();
  render();
}

function bind(){
  $('#assetSelect').addEventListener('change',e=>{state.asset=e.target.value;state.level=0;render();});
  $('#modeTabs').addEventListener('click',e=>{
    const b=e.target.closest('button[data-mode]'); if(!b)return;
    state.mode=b.dataset.mode; renderModes();
  });
  $('#lensTabs').addEventListener('click',e=>{
    const b=e.target.closest('button[data-lens]'); if(!b)return;
    state.lens=b.dataset.lens; renderLens();
  });
  $('#resolutionTabs').addEventListener('click',e=>{
    const b=e.target.closest('button[data-resolution]'); if(!b)return;
    state.resolution=b.dataset.resolution;
    $$('#resolutionTabs button').forEach(x=>x.classList.toggle('active',x===b));
    renderChart();
  });
  $('#layerToggles').addEventListener('click',e=>{
    const b=e.target.closest('button[data-layer]'); if(!b)return;
    const k=b.dataset.layer;
    state.layers.has(k)?state.layers.delete(k):state.layers.add(k);
    b.classList.toggle('on',state.layers.has(k));
    renderChart();
  });
  $('#crumbs').addEventListener('click',e=>{
    const b=e.target.closest('button[data-level]'); if(!b)return;
    state.level=Number(b.dataset.level); renderCrumbs(); renderChart();
  });
  $('#addObservation').addEventListener('click',()=>{
    const a=current();
    const note=`OBS-${String(state.observations.length+1).padStart(3,'0')} · ${a.name} · ${levels[state.level]} · eigen observatie opgeslagen als lokale mock-instance.`;
    state.observations.push({asset:state.asset,level:state.level,at:new Date().toISOString(),note});
    $('#observationNote').textContent=note;
  });
}

function current(){return state.data.assets[state.asset];}
function render(){renderHeader();renderCrumbs();renderChart();renderStory();renderMeaning();renderTrickster();renderForecast();renderCross();renderMatches();renderLens();renderModes();}

function renderHeader(){
  const a=current();
  $('#assetName').textContent=a.name;
  $('#priceValue').textContent=a.price?new Intl.NumberFormat('en-US',{style:'currency',currency:a.unit||'USD',maximumFractionDigits:0}).format(a.price):'mock';
  $('#trendValue').textContent=a.trend;
  $('#regimeValue').textContent=a.regime;
}

function renderCrumbs(){
  const wrap=$('#crumbs'); wrap.innerHTML='';
  for(let i=0;i<=state.level;i++){
    const b=document.createElement('button');b.dataset.level=String(i);b.textContent=levels[i];wrap.appendChild(b);
    if(i<state.level){const s=document.createElement('span');s.textContent='›';wrap.appendChild(s);}
  }
  if(state.level<levels.length-1){
    const s=document.createElement('span');s.textContent='›';wrap.appendChild(s);
    const b=document.createElement('button');b.dataset.level=String(state.level+1);b.textContent=`+ ${levels[state.level+1]}`;wrap.appendChild(b);
  }
}

function renderChart(){
  const a=current(), svg=$('#priceChart'); svg.innerHTML='';
  const W=1000,H=430,pad={l:45,r:30,t:32,b:42};
  const values=a.prices||[]; if(!values.length)return;
  const min=Math.min(...values),max=Math.max(...values),range=Math.max(1,max-min);
  const density={week:.55,day:1,'4h':1.35,'1h':1.65}[state.resolution]||1;
  const view=values.map((v,i)=>v+Math.sin(i*1.7)*Math.max(0,density-1)*1.4);
  const x=i=>pad.l+(i/(view.length-1))*(W-pad.l-pad.r);
  const y=v=>pad.t+(max-v)/range*(H-pad.t-pad.b);

  for(let g=0;g<5;g++){
    const yy=pad.t+g*(H-pad.t-pad.b)/4;
    svg.appendChild(line(pad.l,yy,W-pad.r,yy,'#293029',1,'4 8'));
  }
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('d',view.map((v,i)=>`${i?'L':'M'} ${x(i)} ${y(v)}`).join(' '));
  path.setAttribute('fill','none');path.setAttribute('stroke','#d7ff64');path.setAttribute('stroke-width','4');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');svg.appendChild(path);

  const area=document.createElementNS('http://www.w3.org/2000/svg','path');
  area.setAttribute('d',`${view.map((v,i)=>`${i?'L':'M'} ${x(i)} ${y(v)}`).join(' ')} L ${x(view.length-1)} ${H-pad.b} L ${x(0)} ${H-pad.b} Z`);
  area.setAttribute('fill','rgba(215,255,100,.055)');svg.insertBefore(area,path);

  (a.flags||[]).forEach((f,idx)=>{
    if(!state.layers.has(f.type) && !(f.type==='trickster'&&state.layers.has('trickster')))return;
    const cx=x(f.i),cy=y(view[f.i]);
    const group=document.createElementNS('http://www.w3.org/2000/svg','g');group.style.cursor='pointer';
    const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('cx',cx);c.setAttribute('cy',cy);c.setAttribute('r','10');c.setAttribute('fill',flagColor(f.type));c.setAttribute('stroke','#0d0f0d');c.setAttribute('stroke-width','4');
    const t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x',cx+14);t.setAttribute('y',cy-13);t.setAttribute('fill','#eef4ea');t.setAttribute('font-size','15');t.textContent=f.label;
    group.append(c,t); group.addEventListener('click',()=>showFlag(f,cx,cy));svg.appendChild(group);
  });

  const labels=[['START',pad.l],['NOW',W-pad.r-30]];
  labels.forEach(([txt,xx])=>{const t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x',xx);t.setAttribute('y',H-14);t.setAttribute('fill','#718071');t.setAttribute('font-size','12');t.textContent=txt;svg.appendChild(t);});
  const level=document.createElementNS('http://www.w3.org/2000/svg','text');level.setAttribute('x',W/2);level.setAttribute('y',20);level.setAttribute('text-anchor','middle');level.setAttribute('fill','#7f8a7f');level.setAttribute('font-size','12');level.textContent=`${levels[state.level]} · resolution ${state.resolution} · same selected window`;svg.appendChild(level);
}

function line(x1,y1,x2,y2,stroke,width,dash){const l=document.createElementNS('http://www.w3.org/2000/svg','line');Object.entries({x1,y1,x2,y2,stroke,'stroke-width':width,'stroke-dasharray':dash||''}).forEach(([k,v])=>l.setAttribute(k,v));return l;}
function flagColor(type){return({momentum:'#8dd0ff',flow:'#ffd36a',structure:'#d7ff64',trickster:'#d5a7ff',pattern:'#ff9c8f'}[type]||'#d7ff64');}
function showFlag(f,x,y){const p=$('#flagPopover');p.innerHTML=`<strong>${escapeHtml(f.label)}</strong>${escapeHtml(f.detail)}<br><span class="muted">type: ${escapeHtml(f.type)} · evidence: mock</span>`;p.style.left=`${Math.min(72,x/10)}%`;p.style.top=`${Math.min(72,y/4.3)}%`;p.classList.remove('hidden');}

function renderStory(){const s=current().story;$('#storyWhat').textContent=s.what;$('#storyWhy').textContent=s.why;$('#storyMeaning').textContent=s.meaning;}
function renderMeaning(){const a=current();$('#meaningWorld').textContent=a.meaningWorld;$('#mechanism').textContent=a.mechanism;}
function renderTrickster(){const t=current().trickster;$('#trickStatus').textContent=t.status;$('#trickIntent').textContent=t.intent;$('#trickPattern').textContent=t.pattern;$('#trickNote').textContent=t.note;}
function renderForecast(){const wrap=$('#forecastStrip');wrap.innerHTML='';(current().forecast||[]).forEach(f=>{const d=document.createElement('div');d.className='forecast-item';d.innerHTML=`<span class="mini">${escapeHtml(f.horizon)}</span><strong>${escapeHtml(f.direction)}</strong><span class="muted">zekerheid ${f.confidence}%</span><div class="confidence"><i style="width:${Math.max(0,Math.min(100,f.confidence))}%"></i></div><p class="muted">${escapeHtml(f.note)}</p>`;wrap.appendChild(d);});}
function renderCross(){const wrap=$('#crossAsset');wrap.innerHTML='';(current().crossAsset||[]).forEach(x=>{const d=document.createElement('div');d.className='cross-item';d.innerHTML=`<b>${escapeHtml(x.name)}</b><span>${escapeHtml(x.state)}</span><span>${escapeHtml(x.note)}</span>`;wrap.appendChild(d);});if(!wrap.children.length)wrap.innerHTML='<p class="muted">Geen cross-asset mockdata voor deze demo-asset.</p>';}
function renderMatches(){const wrap=$('#historicalMatches');wrap.innerHTML='';(current().historicalMatches||[]).forEach(x=>{const d=document.createElement('button');d.className='match';d.innerHTML=`<span class="score">${x.score}%</span><strong>${escapeHtml(x.label)}</strong><span class="muted">${escapeHtml(x.status)}</span>`;d.addEventListener('click',()=>{state.level=Math.min(3,state.level+1);renderCrumbs();renderChart();});wrap.appendChild(d);});if(!wrap.children.length)wrap.innerHTML='<p class="muted">Nog geen historische matches geladen.</p>';}

function renderLens(){
  $$('#lensTabs button').forEach(b=>b.classList.toggle('active',b.dataset.lens===state.lens));
  const text={
    legacy:'Legacy-lens: kijk primair naar inflatie, werkgelegenheid, rente, groei, krediet en financiële condities.',
    m24:'M24-lens: combineer oorzaak, regime, positionering, flow, betekeniswereld, Trickster, patroon en historische uitkomst.',
    ai:'AI-native lens: test of klassieke relaties verschuiven door compute, AI-adoptie, kapitaal/arbeid-substitutie, energie en output per mensuur.'
  };
  $('#lensExplanation').textContent=text[state.lens];
}
function renderModes(){
  $$('#modeTabs button').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));
  $$('[data-panel]').forEach(p=>p.classList.remove('visible'));
  if(state.mode==='analysis'){$$('[data-panel="analysis"]').forEach(p=>p.classList.add('visible'));}
  if(state.mode==='lab'){$$('[data-panel="lab"]').forEach(p=>p.classList.add('visible'));}
}
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

boot().catch(err=>{console.error(err);document.body.insertAdjacentHTML('beforeend','<pre style="color:#ff9c8f;padding:20px">M24 mock data kon niet laden.</pre>');});
