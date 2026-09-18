globalThis.M24MacroUI = (() => {
  const $=selector=>document.querySelector(selector);
  const value=(x,units)=>x==null?'—':`${Number(x).toLocaleString('en-US',{maximumFractionDigits:2})}${units==='percent'?'%':''}`;

  function loadScript(src,globalName){
    if(globalThis[globalName]) return Promise.resolve(globalThis[globalName]);
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');s.src=src;s.async=false;
      s.onload=()=>globalThis[globalName]?resolve(globalThis[globalName]):reject(new Error(`${globalName} did not initialize`));
      s.onerror=()=>reject(new Error(`Cannot load ${src}`));document.head.append(s);
    });
  }

  async function ensureDependencies(){
    await loadScript('m24-macro.js','M24Macro');
    await loadScript('m24-macro-lab.js','M24MacroLab');
  }

  function ensureControls(){
    const lab=$('#labPanel');if(!lab||$('#runMacroContext')) return;
    const wrap=document.createElement('div');
    wrap.innerHTML=`<div class="observation-input"><button id="runMacroContext" class="primary">Laad macro/cross-asset</button><span id="macroStatus" class="muted">read-only officiële historische reeksen</span></div><div id="macroContext" class="history-list"></div>`;
    lab.append(...wrap.childNodes);
  }

  function render(result){
    const target=$('#macroContext');if(!target) return;
    target.innerHTML=result.context.series.map(x=>`<div class="history-item"><span>${x.family} / ${x.seriesId}</span><strong>${x.label}</strong><p>1e top: ${value(x.firstTop?.value,x.units)} · 2e top: ${value(x.secondTop?.value,x.units)} · Δ ${x.delta==null?'—':Number(x.delta).toLocaleString('en-US',{maximumFractionDigits:2})}</p><small>${x.higherMeaning} · ${x.status}</small></div>`).join('')+
      result.context.gaps.map(g=>`<div class="history-item"><span>SOURCE GAP</span><strong>${g.label}</strong><p>Geen geldige observatie binnen de toegestane afstand tot het checkpoint.</p><small>${g.reason}</small></div>`).join('')+
      `<div class="history-item"><span>M24 LEZING</span><strong>Context, geen automatische richting</strong><p>Rente, dollar, liquiditeit, financiële condities en olie blijven afzonderlijke factoren. Trickster vergelijkt ze later met prijs, funding en betekeniswereld.</p></div>`;
  }

  async function runMacroContext(){
    const button=$('#runMacroContext'),status=$('#macroStatus');
    if(button) button.disabled=true;if(status) status.textContent='macro/cross-asset reeksen ophalen…';
    try{
      await ensureDependencies();
      const labResult=M24?.labResult;if(!labResult) throw new Error('Open eerst BTC in Lab mode zodat de historische checkpoints bestaan.');
      const caseSchema=M24Cases.get('BTC-2021-2022-TOP-MARKDOWN');
      const provider=new M24Macro.FredCsvProvider();
      const result=await M24MacroLab.runCase({provider,caseSchema,labResult});
      const store=M24?.runtime?.store;
      if(store) M24MacroLab.toRecordPayloads(result).forEach(item=>store.add(M24Core.record(item.type,item.data,{subjectId:caseSchema.asset,window:`${caseSchema.window.from}/${caseSchema.window.to}`,resolution:'MACRO',evidenceStatus:M24Core.EVIDENCE[item.evidenceStatus]||M24Core.EVIDENCE.MECHANISM_VISIBLE,confidence:item.confidence,provenance:item.provenance||[]})));
      render(result);if(status) status.textContent='macro/cross-asset context gereed';return result;
    }catch(err){console.error(err);if(status)status.textContent=`macrobron niet beschikbaar: ${err.message}`;throw err}
    finally{if(button)button.disabled=false}
  }

  function wire(){ensureControls();const button=$('#runMacroContext');if(button&&!button.dataset.wired){button.dataset.wired='1';button.addEventListener('click',()=>runMacroContext().catch(()=>{}));}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
  return {runMacroContext,wire};
})();
