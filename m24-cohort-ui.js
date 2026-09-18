globalThis.M24CohortUI = (() => {
  const $=selector=>document.querySelector(selector);

  function loadScript(src,globalName){
    if(globalThis[globalName]) return Promise.resolve(globalThis[globalName]);
    return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=()=>globalThis[globalName]?resolve(globalThis[globalName]):reject(new Error(`${globalName} did not initialize`));s.onerror=()=>reject(new Error(`Cannot load ${src}`));document.head.append(s)});
  }

  async function ensureDependencies(){
    await loadScript('m24-coinbase.js','M24Coinbase');
    await loadScript('m24-primary-lab.js','M24PrimaryLab');
    await loadScript('m24-cohort.js','M24Cohort');
  }

  function ensureControls(){
    const lab=$('#labPanel');if(!lab||$('#runCaseCohort'))return;
    const wrap=document.createElement('div');
    wrap.innerHTML=`<div class="observation-input"><button id="runCaseCohort" class="primary">Laad historische case-batch</button><span id="cohortStatus" class="muted">BTC 2019 · BTC 2021 · ETH 2021 · SOL 2021</span></div><div id="cohortContext" class="history-list"></div>`;
    lab.append(...wrap.childNodes);
  }

  const signed=value=>value==null?'—':`${value>=0?'+':''}${Number(value).toFixed(1)}%`;

  function render(result){
    const target=$('#cohortContext');if(!target)return;
    const header=`<div class="history-item"><span>CASE COHORT</span><strong>${result.measured}/${result.total} prijsepisodes gemeten · ${result.calibrationEligible} kalibratiegeschikt</strong><p>Prijsmeting alleen telt niet als forecastsampel. Betekeniswereld, derivaten, macro en no-lookahead outcome moeten compleet zijn.</p><small>${result.rule}</small></div>`;
    const rows=result.cases.map(c=>c.status==='MEASURED_PRICE_LAYER'
      ? `<div class="history-item"><span>${c.asset} / ${c.caseId}</span><strong>1e top ${c.firstTop.date} → 2e top ${c.secondTop.date}</strong><p>prijs ${signed(c.comparisons.priceHighChangePct)} · volume ${signed(c.comparisons.volumeChangePct)} · drawdown ${signed(c.outcome.drawdownFromSecondHighPct)}</p><small>${c.calibrationEligible?'KALIBRATIEGESCHIKT':'nog niet kalibratiegeschikt · ontbreekt: '+c.missingLayers.join(', ')}</small></div>`
      : `<div class="history-item"><span>${c.asset} / ${c.caseId}</span><strong>BRON NIET BESCHIKBAAR</strong><p>${c.error||'onbekende fout'}</p><small>Niet meetellen.</small></div>`).join('');
    target.innerHTML=header+rows;
  }

  async function runCaseCohort(){
    const button=$('#runCaseCohort'),status=$('#cohortStatus');if(button)button.disabled=true;if(status)status.textContent='historische primary bars ophalen…';
    try{
      await ensureDependencies();
      const provider=new M24Coinbase.CoinbaseHistoricalProvider();
      const schemas=M24Cases.list({status:'EXECUTABLE_PRIMARY'});
      const result=await M24Cohort.run({provider,caseSchemas:schemas,granularity:86400,onProgress:p=>{if(status)status.textContent=`case ${p.index}/${p.total}: ${p.caseId}`}});
      const store=M24?.runtime?.store;
      if(store){
        result.cases.filter(x=>x.status==='MEASURED_PRICE_LAYER').forEach(c=>{
          const exists=store.where(r=>r.type==='LAB_RESULT_PRIMARY'&&r.data?.caseId===c.caseId).length>0;
          if(!exists) store.add(M24Core.record('LAB_RESULT_PRIMARY',c.labResult,{subjectId:c.asset,resolution:'D',evidenceStatus:M24Core.EVIDENCE.MECHANISM_VISIBLE,confidence:1,provenance:c.provenance||[]}));
        });
        store.add(M24Core.record('CASE_COHORT_RESULT',result,{subjectId:'MULTI',resolution:'D-COHORT',evidenceStatus:M24Core.EVIDENCE.MECHANISM_VISIBLE,confidence:1,provenance:[]}));
      }
      render(result);if(status)status.textContent=`${result.measured}/${result.total} cases gemeten · ${result.calibrationEligible} geschikt voor kalibratie`;return result;
    }catch(err){console.error(err);if(status)status.textContent=`case-batch niet gereed: ${err.message}`;throw err}
    finally{if(button)button.disabled=false}
  }

  function wire(){ensureControls();const b=$('#runCaseCohort');if(b&&!b.dataset.wired){b.dataset.wired='1';b.addEventListener('click',()=>runCaseCohort().catch(()=>{}));}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
  return {runCaseCohort,wire};
})();
