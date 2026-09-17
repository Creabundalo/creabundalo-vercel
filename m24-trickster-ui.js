globalThis.M24TricksterUI = (() => {
  const $=selector=>document.querySelector(selector);
  function loadScript(src,globalName){
    if(globalThis[globalName]) return Promise.resolve(globalThis[globalName]);
    return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=()=>globalThis[globalName]?resolve(globalThis[globalName]):reject(new Error(`${globalName} did not initialize`));s.onerror=()=>reject(new Error(`Cannot load ${src}`));document.head.append(s)});
  }
  function ensureControls(){
    const lab=$('#labPanel');if(!lab||$('#runHistoricalTrickster'))return;
    const wrap=document.createElement('div');
    wrap.innerHTML=`<div class="observation-input"><button id="runHistoricalTrickster" class="primary">Draai Trickster over geladen lagen</button><span id="historicalTricksterStatus" class="muted">prijs + betekeniswereld; derivaten/macro indien geladen</span></div><div id="historicalTricksterContext" class="history-list"></div>`;
    lab.append(...wrap.childNodes);
  }
  function render(result){
    const target=$('#historicalTricksterContext');if(!target)return;
    const contrastCards=result.contrasts.map(c=>`<div class="history-item"><span>${c.layerA} ↔ ${c.layerB}</span><strong>${c.id}</strong><p>${c.statement}</p><small>${c.evidence}</small></div>`).join('');
    target.innerHTML=`<div class="history-item"><span>HISTORICAL TRICKSTER</span><strong>${result.discrepancyCount} discrepantie-hypothesen</strong><p>${result.conclusion}</p><p>Geladen: ${Object.entries(result.inputs).filter(([,v])=>v).map(([k])=>k).join(' · ')} · ontbreekt: ${result.missingLayers.join(' · ')||'niets'}</p><small>${result.evidenceStatus} · intentie ${result.intentStatus} · actor ${result.actorAttribution}</small></div>${contrastCards}`;
  }
  async function runHistoricalTrickster(){
    const button=$('#runHistoricalTrickster'),status=$('#historicalTricksterStatus');if(button)button.disabled=true;if(status)status.textContent='lagen vergelijken…';
    try{
      await loadScript('m24-trickster-lab.js','M24TricksterLab');
      const labResult=M24?.labResult;if(!labResult)throw new Error('Open eerst BTC in Lab mode.');
      const store=M24?.runtime?.store;if(!store)throw new Error('QubusStore niet beschikbaar.');
      const result=M24TricksterLab.assessFromStore({store,labResult});
      store.add(M24Core.record('HISTORICAL_TRICKSTER_ASSESSMENT',result,{subjectId:'BTC',window:'2021-01/2022-06',resolution:'MULTI_LAYER',evidenceStatus:M24Core.EVIDENCE.PLAUSIBLE_INTERPRETATION,confidence:Math.min(0.9,0.45+(result.discrepancyCount*0.08)),provenance:[]}));
      render(result);if(status)status.textContent='Trickster-vergelijking gereed';return result;
    }catch(err){console.error(err);if(status)status.textContent=`Trickster kan nog niet draaien: ${err.message}`;throw err}
    finally{if(button)button.disabled=false}
  }
  function wire(){ensureControls();const b=$('#runHistoricalTrickster');if(b&&!b.dataset.wired){b.dataset.wired='1';b.addEventListener('click',()=>runHistoricalTrickster().catch(()=>{}));}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
  return {runHistoricalTrickster,wire};
})();
