globalThis.M24MeaningUI = (() => {
  const $=selector=>document.querySelector(selector);
  function loadScript(src,globalName){
    if(globalThis[globalName]) return Promise.resolve(globalThis[globalName]);
    return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=()=>globalThis[globalName]?resolve(globalThis[globalName]):reject(new Error(`${globalName} did not initialize`));s.onerror=()=>reject(new Error(`Cannot load ${src}`));document.head.append(s)});
  }
  function ensureControls(){
    const lab=$('#labPanel');if(!lab||$('#runMeaningWorld'))return;
    const wrap=document.createElement('div');
    wrap.innerHTML=`<div class="observation-input"><button id="runMeaningWorld" class="primary">Laad betekeniswereld</button><span id="meaningStatus" class="muted">timestamped historische bronclaims</span></div><div id="meaningContext" class="history-list"></div>`;
    lab.append(...wrap.childNodes);
  }
  const frames=x=>(x.dominantFrames||[]).slice(0,5).map(f=>`${f.frame} (${f.count})`).join(' · ')||'—';
  function render(result){
    const target=$('#meaningContext');if(!target)return;
    const sourceCards=result.sources.map(s=>`<div class="history-item"><span>${s.publishedAt.slice(0,10)} / ${s.publisher}</span><strong>${s.title}</strong><p>${s.summary}</p><small>${s.frames.join(' · ')} · coded direction ${s.direction>=0?'+':''}${s.direction.toFixed(2)}</small></div>`).join('');
    target.innerHTML=`<div class="history-item"><span>MEANING WORLD / FIRST TOP</span><strong>${frames(result.firstTop)}</strong><p>Bronnen: ${result.firstTop.count} · coded direction ${result.firstTop.direction??'—'}</p></div><div class="history-item"><span>MEANING WORLD / SECOND TOP</span><strong>${frames(result.secondTop)}</strong><p>Bronnen: ${result.secondTop.count} · coded direction ${result.secondTop.direction??'—'} · Δ ${result.comparison.directionDelta??'—'}</p><small>Dit is frame-codering, geen waarheidsscore of koersvoorspelling.</small></div>${sourceCards}`;
  }
  async function runMeaningWorld(){
    const button=$('#runMeaningWorld'),status=$('#meaningStatus');if(button)button.disabled=true;if(status)status.textContent='historische bronclaims laden…';
    try{
      await loadScript('m24-meaning.js','M24Meaning');
      const caseSchema=M24Cases.get('BTC-2021-2022-TOP-MARKDOWN');
      const result=M24Meaning.analyzeCase(caseSchema);
      const store=M24?.runtime?.store;
      if(store) store.add(M24Core.record('MEANING_WORLD_CONTEXT',result,{subjectId:caseSchema.asset,window:`${caseSchema.window.from}/${caseSchema.window.to}`,resolution:'SOURCE_TIMESTAMPS',evidenceStatus:M24Core.EVIDENCE.PLAUSIBLE_INTERPRETATION,confidence:0.75,provenance:result.sources.map(M24Meaning.toProvenance)}));
      render(result);if(status)status.textContent='betekeniswereld gereed';return result;
    }catch(err){console.error(err);if(status)status.textContent=`betekeniswereld fout: ${err.message}`;throw err}
    finally{if(button)button.disabled=false}
  }
  function wire(){ensureControls();const b=$('#runMeaningWorld');if(b&&!b.dataset.wired){b.dataset.wired='1';b.addEventListener('click',()=>runMeaningWorld().catch(()=>{}));}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
  return {runMeaningWorld,wire};
})();
