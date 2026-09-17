globalThis.M24LabUI = (() => {
  const caseId='BTC-2021-2022-TOP-MARKDOWN';
  const $=selector=>document.querySelector(selector);

  function yesNo(value){return value?'JA':'NEE'}
  function signed(value){return value==null?'—':`${value>=0?'+':''}${Number(value).toFixed(1)}%`}

  function render(primary,comparison){
    const target=$('#sourceComparison');
    if(!target) return;
    const p=primary.result;
    target.innerHTML=`
      <div class="history-item">
        <span>PRIMARY EXCHANGE / ${p.resolution}</span>
        <strong>Coinbase BTC-USD · zelfde case</strong>
        <p>1e top: ${p.firstTop.date} · 2e top: ${p.secondTop.date} · support-break: ${p.support.firstCloseBelow||'geen'}</p>
        <p>2e top prijs: ${signed(p.comparisons.priceHighChangePct)} · volume: ${signed(p.comparisons.volumeChangePct)} · RSI14: ${p.firstTop.rsi14??'—'} → ${p.secondTop.rsi14??'—'}</p>
        <small>${p.provenance?.[0]?.sourceType||'PRIMARY'} / ${p.provenance?.[0]?.quality||'PRIMARY_EXCHANGE'}</small>
      </div>
      <div class="history-item">
        <span>SOURCE / RESOLUTION COMPARISON</span>
        <strong>${comparison.baselineResolution} → ${comparison.candidateResolution}</strong>
        <p>Top-structuur gelijk: ${yesNo(comparison.agreement.secondTop)} · volume-signaal gelijk: ${yesNo(comparison.agreement.volumeDivergence)} · RSI-signaal gelijk: ${yesNo(comparison.agreement.rsiDivergence)} · support-break aanwezig in beide: ${yesNo(comparison.agreement.supportBreak)}</p>
        <p>Datumverschil 1e top: ${comparison.checkpointDateDeltaDays.firstTop??'—'} d · 2e top: ${comparison.checkpointDateDeltaDays.secondTop??'—'} d · support-break: ${comparison.checkpointDateDeltaDays.supportBreak??'—'} d</p>
        <small>Verschillen blijven expliciet Qubus-data; M24 forceert geen consensus tussen bronnen/resoluties.</small>
      </div>`;
  }

  async function runPrimaryComparison(){
    const button=$('#runPrimaryCompare');
    const status=$('#primaryCompareStatus');
    if(button) button.disabled=true;
    if(status) status.textContent='primaire dagdata ophalen…';
    try{
      const baseline=M24?.labResult;
      if(!baseline) throw new Error('Open eerst BTC in Lab mode zodat de regressiebaseline bestaat.');
      const caseSchema=M24Cases.get(caseId);
      const provider=new M24Coinbase.CoinbaseHistoricalProvider();
      const primary=await M24PrimaryLab.runBtcCase({provider,caseSchema,granularity:86400});
      const comparison=M24PrimaryLab.compare({baseline,primary:primary.result});
      const store=M24?.runtime?.store;
      if(store){
        store.add(M24Core.record('LAB_RESULT_PRIMARY',primary.result,{subjectId:'BTC',window:`${caseSchema.window.from}/${caseSchema.window.to}`,resolution:'D',evidenceStatus:M24Core.EVIDENCE.MECHANISM_VISIBLE,confidence:1,provenance:primary.result.provenance||[]}));
        store.add(M24Core.record('SOURCE_COMPARISON',comparison,{subjectId:'BTC',window:`${caseSchema.window.from}/${caseSchema.window.to}`,resolution:'W→D',evidenceStatus:M24Core.EVIDENCE.MECHANISM_VISIBLE,confidence:1,provenance:[...(comparison.baselineProvenance||[]),...(comparison.candidateProvenance||[])]}));
      }
      render(primary,comparison);
      if(status) status.textContent='vergelijking gereed';
      return {primary,comparison};
    } catch(err){
      console.error(err);
      if(status) status.textContent=`primaire bron niet beschikbaar: ${err.message}`;
      throw err;
    } finally {
      if(button) button.disabled=false;
    }
  }

  function loadAuxUI(src,globalName){
    if(globalThis[globalName]) return;
    const script=document.createElement('script');script.src=src;script.async=false;document.head.append(script);
  }

  function wire(){
    const button=$('#runPrimaryCompare');
    if(button) button.addEventListener('click',()=>runPrimaryComparison().catch(()=>{}));
    loadAuxUI('m24-derivatives-ui.js','M24DerivativesUI');
    loadAuxUI('m24-binance-vision-ui.js','M24BinanceVisionUI');
    loadAuxUI('m24-macro-ui.js','M24MacroUI');
    loadAuxUI('m24-meaning-ui.js','M24MeaningUI');
    loadAuxUI('m24-trickster-ui.js','M24TricksterUI');
    loadAuxUI('m24-backtest-ui.js','M24BacktestUI');
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',wire); else wire();
  return {runPrimaryComparison};
})();
