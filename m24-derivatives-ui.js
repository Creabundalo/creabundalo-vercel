globalThis.M24DerivativesUI = (() => {
  const $=selector=>document.querySelector(selector);
  const pct=value=>value==null?'—':`${(Number(value)*100).toFixed(3)}%`;

  function loadScript(src,globalName){
    if(globalThis[globalName]) return Promise.resolve(globalThis[globalName]);
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');s.src=src;s.async=false;
      s.onload=()=>globalThis[globalName]?resolve(globalThis[globalName]):reject(new Error(`${globalName} did not initialize`));
      s.onerror=()=>reject(new Error(`Cannot load ${src}`));
      document.head.append(s);
    });
  }

  async function ensureDependencies(){
    await loadScript('m24-derivatives.js','M24Derivatives');
    await loadScript('m24-derivatives-lab.js','M24DerivativesLab');
  }

  function ensureControls(){
    const lab=$('#labPanel');
    if(!lab||$('#runDerivativesContext')) return;
    const wrap=document.createElement('div');
    wrap.innerHTML=`<div class="observation-input"><button id="runDerivativesContext" class="primary">Laad derivatencontext</button><span id="derivativesStatus" class="muted">read-only funding / open-interest bronstatus</span></div><div id="derivativesContext" class="history-list"></div>`;
    lab.append(...wrap.childNodes);
  }

  function render(result){
    const target=$('#derivativesContext');
    if(!target) return;
    const f=result.fundingContext;
    const gap=result.openInterestGap;
    target.innerHTML=`
      <div class="history-item">
        <span>DERIVATIVES / FUNDING</span>
        <strong>Binance BTCUSDT perpetual</strong>
        <p>1e top: avg ${pct(f.firstTop.avgFundingRate)} · positief ${f.firstTop.positiveShare==null?'—':Math.round(f.firstTop.positiveShare*100)+'%'} · n=${f.firstTop.count}</p>
        <p>2e top: avg ${pct(f.secondTop.avgFundingRate)} · positief ${f.secondTop.positiveShare==null?'—':Math.round(f.secondTop.positiveShare*100)+'%'} · n=${f.secondTop.count}</p>
        <p>Verschuiving: <strong>${f.comparison.crowdingShift}</strong></p>
        <small>Cutoff op opgeloste topdatums · geen bewijs van actorintentie of manipulatie.</small>
      </div>
      ${gap?`<div class="history-item"><span>SOURCE GAP / OPEN INTEREST</span><strong>Historische OI niet beschikbaar via recent-history API</strong><p>Dit is een bronbeperking, niet “open interest = 0”. Aanbevolen bron: ${gap.recommendedSource}.</p><small>${gap.archiveExample||''}</small></div>`:''}`;
  }

  async function runDerivativesContext(){
    const button=$('#runDerivativesContext');
    const status=$('#derivativesStatus');
    if(button) button.disabled=true;
    if(status) status.textContent='funding en broncapaciteit ophalen…';
    try{
      await ensureDependencies();
      const caseSchema=M24Cases.get(M24DerivativesLab.caseId);
      const labResult=M24?.labResult;
      if(!labResult) throw new Error('Open eerst BTC in Lab mode zodat de opgeloste checkpoints bestaan.');
      const provider=new M24Derivatives.BinanceDerivativesProvider();
      const result=await M24DerivativesLab.runCase({provider,caseSchema,labResult});
      const store=M24?.runtime?.store;
      if(store){
        M24DerivativesLab.toRecordPayloads(result).forEach(item=>{
          store.add(M24Core.record(item.type,item.data,{subjectId:caseSchema.asset,window:`${caseSchema.window.from}/${caseSchema.window.to}`,resolution:'DERIVATIVES',evidenceStatus:M24Core.EVIDENCE[item.evidenceStatus]||M24Core.EVIDENCE.MECHANISM_VISIBLE,confidence:item.confidence,provenance:item.provenance||[]}));
        });
      }
      render(result);
      if(status) status.textContent='derivatencontext gereed · checkpoint-cutoff toegepast';
      return result;
    }catch(err){
      console.error(err);
      if(status) status.textContent=`derivatenbron niet beschikbaar: ${err.message}`;
      throw err;
    }finally{
      if(button) button.disabled=false;
    }
  }

  function wire(){
    ensureControls();
    const button=$('#runDerivativesContext');
    if(button&&!button.dataset.wired){button.dataset.wired='1';button.addEventListener('click',()=>runDerivativesContext().catch(()=>{}));}
  }

  function boot(){wire();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  return {runDerivativesContext,wire};
})();
