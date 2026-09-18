globalThis.M24CalibrationUI = (() => {
  const $=selector=>document.querySelector(selector);

  function loadScript(src,globalName){
    if(globalThis[globalName]) return Promise.resolve(globalThis[globalName]);
    return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=()=>globalThis[globalName]?resolve(globalThis[globalName]):reject(new Error(`${globalName} did not initialize`));s.onerror=()=>reject(new Error(`Cannot load ${src}`));document.head.append(s)});
  }

  function ensureControls(){
    const lab=$('#labPanel');if(!lab||$('#runCalibrationCheck'))return;
    const wrap=document.createElement('div');
    wrap.innerHTML=`<div class="observation-input"><button id="runCalibrationCheck" class="primary">Controleer forecast-kalibratie</button><span id="calibrationStatus" class="muted">geen kanspercentage zonder voldoende historische samples</span></div><div id="calibrationContext" class="history-list"></div>`;
    lab.append(...wrap.childNodes);
  }

  function pct(value){return value==null?'—':`${Math.round(value*100)}%`}

  function render(table){
    const target=$('#calibrationContext');if(!target)return;
    target.innerHTML=table.map(row=>{
      const h=row.filter.horizon;
      if(row.state==='INSUFFICIENT_SAMPLE') return `<div class="history-item"><span>CALIBRATION / ${h}</span><strong>ONVOLDOENDE DATA · n=${row.sampleSize}/${row.minSamples}</strong><p>Geen betrouwbaar kanspercentage tonen.</p><small>Forecast-balkjes blijven voorlopig een ruwe interne modelschaal, geen gekalibreerde waarschijnlijkheid.</small></div>`;
      return `<div class="history-item"><span>CALIBRATION / ${h}</span><strong>historische hit-rate ${pct(row.historicalHitRate)} · n=${row.sampleSize}</strong><p>95%-interval: ${pct(row.interval95.low)} – ${pct(row.interval95.high)} · ruwe scoregemiddelde ${pct(row.meanRawConfidence)} · calibratiegap ${pct(row.calibrationGap)}</p><small>Historische referentie; marktregimes kunnen veranderen.</small></div>`;
    }).join('');
  }

  async function runCalibrationCheck(){
    const button=$('#runCalibrationCheck'),status=$('#calibrationStatus');if(button)button.disabled=true;if(status)status.textContent='historische forecast/outcome-pairs tellen…';
    try{
      await loadScript('m24-calibration.js','M24Calibration');
      const store=M24?.runtime?.store;if(!store)throw new Error('M24 runtime niet beschikbaar.');
      const forecasts=store.list('FORECAST_INSTANCE');
      const outcomes=store.list('OUTCOME_INSTANCE');
      const table=M24Calibration.horizonTable({forecasts,outcomes,lens:M24.state?.lens||'m24'});
      table.forEach(result=>store.add(M24Core.record('CALIBRATION_RESULT',result,{subjectId:M24.state?.asset||null,resolution:'CALIBRATION',evidenceStatus:M24Core.EVIDENCE.MECHANISM_VISIBLE,confidence:1,provenance:[]})));
      render(table);
      const ready=table.filter(x=>x.state==='CALIBRATED_REFERENCE').length;
      if(status)status.textContent=ready?`${ready} horizon(s) historisch gekalibreerd`:'nog geen horizon boven minimumsteekproef';
      return table;
    }catch(err){console.error(err);if(status)status.textContent=`kalibratie niet gereed: ${err.message}`;throw err}
    finally{if(button)button.disabled=false}
  }

  function wire(){ensureControls();const b=$('#runCalibrationCheck');if(b&&!b.dataset.wired){b.dataset.wired='1';b.addEventListener('click',()=>runCalibrationCheck().catch(()=>{}));}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
  return {runCalibrationCheck,wire};
})();
