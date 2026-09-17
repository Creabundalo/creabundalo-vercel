globalThis.M24EnrichmentUI = (() => {
  const $=selector=>document.querySelector(selector);
  function loadScript(src,globalName){
    if(globalThis[globalName]) return Promise.resolve(globalThis[globalName]);
    return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=()=>globalThis[globalName]?resolve(globalThis[globalName]):reject(new Error(`${globalName} did not initialize`));s.onerror=()=>reject(new Error(`Cannot load ${src}`));document.head.append(s)});
  }
  async function dependencies(){
    await loadScript('m24-coinbase.js','M24Coinbase');
    await loadScript('m24-primary-lab.js','M24PrimaryLab');
    await loadScript('m24-meaning.js','M24Meaning');
    await loadScript('m24-derivatives.js','M24Derivatives');
    await loadScript('m24-derivatives-lab.js','M24DerivativesLab');
    await loadScript('m24-binance-vision.js','M24BinanceVision');
    await loadScript('m24-funding-archive.js','M24FundingArchive');
    await loadScript('m24-binance-vision-lab.js','M24BinanceVisionLab');
    await loadScript('m24-macro.js','M24Macro');
    await loadScript('m24-macro-lab.js','M24MacroLab');
    await loadScript('m24-backtest.js','M24Backtest');
    await loadScript('m24-evidence-gate.js','M24EvidenceGate');
    await loadScript('m24-enrichment.js','M24Enrichment');
  }
  function ensureControls(){
    const lab=$('#labPanel');if(!lab||$('#runCaseEnrichment'))return;
    const wrap=document.createElement('div');
    wrap.innerHTML=`<div class="observation-input"><button id="runCaseEnrichment" class="primary">Vul BTC 2021 bewijs aan</button><span id="enrichmentStatus" class="muted">prijs → betekenis → funding-archief → OI/ratio-archief → macro → backtest → gate</span></div><div id="enrichmentContext" class="history-list"></div>`;
    lab.append(...wrap.childNodes);
  }
  function render(result){
    const target=$('#enrichmentContext');if(!target)return;
    const rows=Object.entries(result.evidence.layers).map(([name,layer])=>`<div class="history-item"><span>${name}</span><strong>${layer.state}</strong><p>${layer.note}</p></div>`).join('');
    target.innerHTML=`<div class="history-item"><span>CASE ENRICHMENT / ${result.caseId}</span><strong>${result.calibrationEligible?'SOURCE_COMPLETE — 1 SAMPLE GEREED':'INCOMPLETE — NOG NIET TELLEN'}</strong><p>${result.rule}</p><small>${result.calibrationEligible?'Alle vereiste lagen zijn aanwezig.':'Ontbreekt/blokkeert: '+result.evidence.missingLayers.join(' · ')}</small></div>${rows}`;
  }
  async function runCaseEnrichment(){
    const button=$('#runCaseEnrichment'),status=$('#enrichmentStatus');if(button)button.disabled=true;if(status)status.textContent='bronketen uitvoeren…';
    try{
      await dependencies();
      const store=M24?.runtime?.store;if(!store)throw new Error('M24 runtime niet beschikbaar.');
      const caseSchema=M24Cases.get('BTC-2021-2022-TOP-MARKDOWN');
      const providers={
        price:new M24Coinbase.CoinbaseHistoricalProvider(),
        derivatives:new M24FundingArchive.BinanceHistoricalDerivativesProvider(),
        archive:new M24BinanceVision.BinanceVisionMetricsProvider(),
        macro:new M24Macro.FredCsvProvider()
      };
      const result=await M24Enrichment.runCase({store,caseSchema,providers,granularity:86400});
      store.add(M24Core.record('CASE_ENRICHMENT_RESULT',result,{subjectId:caseSchema.asset,resolution:'SOURCE_COMPLETE_PIPELINE',evidenceStatus:M24Core.EVIDENCE.MECHANISM_VISIBLE,confidence:1,provenance:[]}));
      render(result);
      if(status)status.textContent=result.calibrationEligible?'BTC 2021 broncompleet — mag meetellen':'BTC 2021 blijft buiten kalibratie';
      return result;
    }catch(err){console.error(err);if(status)status.textContent=`verrijking niet gereed: ${err.message}`;throw err}
    finally{if(button)button.disabled=false}
  }
  function wire(){ensureControls();const b=$('#runCaseEnrichment');if(b&&!b.dataset.wired){b.dataset.wired='1';b.addEventListener('click',()=>runCaseEnrichment().catch(()=>{}));}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
  return {runCaseEnrichment,wire};
})();
