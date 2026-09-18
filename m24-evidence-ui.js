globalThis.M24EvidenceUI = (() => {
  const $=selector=>document.querySelector(selector);
  function loadScript(src,globalName){
    if(globalThis[globalName]) return Promise.resolve(globalThis[globalName]);
    return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=()=>globalThis[globalName]?resolve(globalThis[globalName]):reject(new Error(`${globalName} did not initialize`));s.onerror=()=>reject(new Error(`Cannot load ${src}`));document.head.append(s)});
  }
  function ensureControls(){
    const lab=$('#labPanel');if(!lab||$('#runEvidenceGate'))return;
    const wrap=document.createElement('div');
    wrap.innerHTML=`<div class="observation-input"><button id="runEvidenceGate" class="primary">Controleer broncompleetheid</button><span id="evidenceGateStatus" class="muted">geen kalibratiesample zonder complete bronlagen</span></div><div id="evidenceGateContext" class="history-list"></div>`;
    lab.append(...wrap.childNodes);
  }
  function render(result){
    const target=$('#evidenceGateContext');if(!target)return;
    const rows=Object.entries(result.layers).map(([key,value])=>`<div class="history-item"><span>${key}</span><strong>${value.state}</strong><p>${value.note}</p><small>${value.recordIds.length?value.recordIds.join(' · '):'geen record'}</small></div>`).join('');
    target.innerHTML=`<div class="history-item"><span>CASE PROMOTION / ${result.caseId}</span><strong>${result.calibrationEligible?'SOURCE_COMPLETE — MAG TELLEN':'INCOMPLETE — TELT NIET MEE'}</strong><p>${result.calibrationEligible?'Alle vereiste lagen zijn compleet.':'Ontbreekt/blokkeert: '+result.missingLayers.join(' · ')}</p><small>${result.rule}</small></div>${rows}`;
  }
  async function runEvidenceGate(){
    const button=$('#runEvidenceGate'),status=$('#evidenceGateStatus');if(button)button.disabled=true;if(status)status.textContent='Qubus-bronlagen controleren…';
    try{
      await loadScript('m24-evidence-gate.js','M24EvidenceGate');
      const store=M24?.runtime?.store;if(!store)throw new Error('M24 runtime niet beschikbaar.');
      const caseSchema=M24Cases.get('BTC-2021-2022-TOP-MARKDOWN');
      const result=M24EvidenceGate.assess(store,caseSchema);
      store.add(M24Core.record('CASE_EVIDENCE_STATUS',result,{subjectId:caseSchema.asset,resolution:'EVIDENCE_GATE',evidenceStatus:M24Core.EVIDENCE.MECHANISM_VISIBLE,confidence:1,provenance:[]}));
      render(result);if(status)status.textContent=result.calibrationEligible?'case broncompleet':'case blijft buiten kalibratie';return result;
    }catch(err){console.error(err);if(status)status.textContent=`broncontrole niet gereed: ${err.message}`;throw err}
    finally{if(button)button.disabled=false}
  }
  function wire(){ensureControls();const b=$('#runEvidenceGate');if(b&&!b.dataset.wired){b.dataset.wired='1';b.addEventListener('click',()=>runEvidenceGate().catch(()=>{}));}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
  return {runEvidenceGate,wire};
})();
