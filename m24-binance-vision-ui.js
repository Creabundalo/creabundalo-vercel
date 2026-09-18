globalThis.M24BinanceVisionUI = (() => {
  const $=selector=>document.querySelector(selector);
  const number=value=>value==null?'—':Number(value).toLocaleString('en-US',{maximumFractionDigits:4});

  function loadScript(src,globalName){
    if(globalThis[globalName]) return Promise.resolve(globalThis[globalName]);
    return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=()=>globalThis[globalName]?resolve(globalThis[globalName]):reject(new Error(`${globalName} did not initialize`));s.onerror=()=>reject(new Error(`Cannot load ${src}`));document.head.append(s)});
  }

  async function ensureDependencies(){
    await loadScript('m24-binance-vision.js','M24BinanceVision');
    await loadScript('m24-binance-vision-lab.js','M24BinanceVisionLab');
  }

  function ensureControls(){
    const lab=$('#labPanel');if(!lab||$('#runArchiveMetrics'))return;
    const wrap=document.createElement('div');
    wrap.innerHTML=`<div class="observation-input"><button id="runArchiveMetrics" class="primary">Laad 2021 OI/ratio archief</button><span id="archiveMetricsStatus" class="muted">Binance Vision · checksum-geverifieerd · read-only</span></div><div id="archiveMetricsContext" class="history-list"></div>`;
    lab.append(...wrap.childNodes);
  }

  function summaryCard(label,point){
    if(point.status!=='OK') return `<div class="history-item"><span>${label}</span><strong>SOURCE GAP</strong><p>Geen geldige metrics-observatie voor ${point.date}.</p></div>`;
    const s=point.summary;
    return `<div class="history-item"><span>${label} / ${point.date}</span><strong>Open interest ${number(s.sumOpenInterest)}</strong><p>OI value: ${number(s.sumOpenInterestValue)} · top account L/S: ${number(s.topTraderAccountLongShort)} · top position L/S: ${number(s.topTraderPositionLongShort)}</p><p>global L/S: ${number(s.globalLongShort)} · taker L/S vol: ${number(s.takerLongShortVolume)}</p><small>${point.provenance?.[0]?.quality||'archive'} · sha256 ${point.provenance?.[0]?.sha256?.slice(0,12)||'—'}…</small></div>`;
  }

  function render(result){
    const target=$('#archiveMetricsContext');if(!target)return;
    const deltas=result.deltas||{};
    target.innerHTML=summaryCard('ARCHIVE / FIRST TOP',result.firstTop)+summaryCard('ARCHIVE / SECOND TOP',result.secondTop)+`<div class="history-item"><span>ARCHIVE DELTAS</span><strong>2e top minus 1e top</strong><p>OI: ${number(deltas.sumOpenInterest)} · OI value: ${number(deltas.sumOpenInterestValue)} · top account L/S: ${number(deltas.topTraderAccountLongShort)} · top position L/S: ${number(deltas.topTraderPositionLongShort)} · global L/S: ${number(deltas.globalLongShort)} · taker L/S: ${number(deltas.takerLongShortVolume)}</p><small>Meetcontext; geen actor- of manipulatiebewijs.</small></div>`;
  }

  async function runArchiveMetrics(){
    const button=$('#runArchiveMetrics'),status=$('#archiveMetricsStatus');if(button)button.disabled=true;if(status)status.textContent='ZIP + checksum + metrics ophalen…';
    try{
      await ensureDependencies();
      const labResult=M24?.labResult;if(!labResult)throw new Error('Open eerst BTC in Lab mode.');
      const caseSchema=M24Cases.get('BTC-2021-2022-TOP-MARKDOWN');
      const provider=new M24BinanceVision.BinanceVisionMetricsProvider();
      const result=await M24BinanceVisionLab.runCase({provider,caseSchema,labResult});
      const store=M24?.runtime?.store;
      if(store) M24BinanceVisionLab.toRecordPayloads(result).forEach(item=>store.add(M24Core.record(item.type,item.data,{subjectId:caseSchema.asset,window:`${caseSchema.window?.from||''}/${caseSchema.window?.to||''}`,resolution:'ARCHIVE_DAY',evidenceStatus:M24Core.EVIDENCE[item.evidenceStatus]||M24Core.EVIDENCE.MECHANISM_VISIBLE,confidence:item.confidence,provenance:item.provenance||[]})));
      render(result);if(status)status.textContent='archive metrics gereed';return result;
    }catch(err){console.error(err);if(status)status.textContent=`archive niet beschikbaar: ${err.message}`;throw err}
    finally{if(button)button.disabled=false}
  }

  function wire(){ensureControls();const b=$('#runArchiveMetrics');if(b&&!b.dataset.wired){b.dataset.wired='1';b.addEventListener('click',()=>runArchiveMetrics().catch(()=>{}));}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
  return {runArchiveMetrics,wire};
})();
