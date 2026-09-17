globalThis.M24DerivativesUI = (() => {
  const $=selector=>document.querySelector(selector);
  const pct=value=>value==null?'—':`${(Number(value)*100).toFixed(3)}%`;

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
        <small>Positionering/leverage-context; geen bewijs van actorintentie of manipulatie.</small>
      </div>
      ${gap?`<div class="history-item"><span>SOURCE GAP / OPEN INTEREST</span><strong>Historische OI niet beschikbaar via recent-history API</strong><p>Dit is een bronbeperking, niet “open interest = 0”. Aanbevolen bron: ${gap.recommendedSource}.</p><small>${gap.archiveExample||''}</small></div>`:''}`;
  }

  async function runDerivativesContext(){
    const button=$('#runDerivativesContext');
    const status=$('#derivativesStatus');
    if(button) button.disabled=true;
    if(status) status.textContent='funding en broncapaciteit ophalen…';
    try{
      const caseSchema=M24Cases.get(M24DerivativesLab.caseId);
      const provider=new M24Derivatives.BinanceDerivativesProvider();
      const result=await M24DerivativesLab.runCase({provider,caseSchema});
      const store=M24?.runtime?.store;
      if(store){
        M24DerivativesLab.toRecordPayloads(result).forEach(item=>{
          store.add(M24Core.record(item.type,item.data,{subjectId:caseSchema.asset,window:`${caseSchema.window.from}/${caseSchema.window.to}`,resolution:'DERIVATIVES',evidenceStatus:M24Core.EVIDENCE[item.evidenceStatus]||M24Core.EVIDENCE.MECHANISM_VISIBLE,confidence:item.confidence,provenance:item.provenance||[]}));
        });
      }
      render(result);
      if(status) status.textContent='derivatencontext gereed';
      return result;
    }catch(err){
      console.error(err);
      if(status) status.textContent=`derivatenbron niet beschikbaar: ${err.message}`;
      throw err;
    }finally{
      if(button) button.disabled=false;
    }
  }

  function wire(){const button=$('#runDerivativesContext');if(button)button.addEventListener('click',()=>runDerivativesContext().catch(()=>{}));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
  return {runDerivativesContext};
})();
