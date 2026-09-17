globalThis.M24BacktestUI = (() => {
  const $=selector=>document.querySelector(selector);
  const latest=(store,type)=>{const items=store?.list?.(type)||[];return items.at(-1)?.data||null};

  function loadScript(src,globalName){
    if(globalThis[globalName]) return Promise.resolve(globalThis[globalName]);
    return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=()=>globalThis[globalName]?resolve(globalThis[globalName]):reject(new Error(`${globalName} did not initialize`));s.onerror=()=>reject(new Error(`Cannot load ${src}`));document.head.append(s)});
  }

  function ensureControls(){
    const lab=$('#labPanel');if(!lab||$('#runNoLookaheadBacktest'))return;
    const wrap=document.createElement('div');
    wrap.innerHTML=`<div class="observation-input"><button id="runNoLookaheadBacktest" class="primary">Draai no-lookahead backtest</button><span id="backtestStatus" class="muted">beslissen op T · uitkomst pas daarna</span></div><div id="backtestContext" class="history-list"></div>`;
    lab.append(...wrap.childNodes);
  }

  function render(run){
    const target=$('#backtestContext');if(!target)return;
    const c=run.candidate,o=run.outcome,s=run.snapshot;
    target.innerHTML=`<div class="history-item"><span>DECISION SNAPSHOT / ${s.asOf.slice(0,10)}</span><strong>${c.action} · score ${c.score.toFixed(1)} · coverage ${Math.round(c.coverage*100)}%</strong><p>${c.evidence.map(x=>x.id).join(' · ')||'geen downside evidence'}${c.confirmations.length?`<br>bevestiging: ${c.confirmations.map(x=>x.id).join(' · ')}`:''}</p><small>Uitgesloten toekomstvelden: ${s.excludedFutureFields.join(' · ')}</small></div><div class="history-item"><span>OUTCOME / LATER</span><strong>${o.supportBreakAfterDecision?'latere support-break bevestigd':'geen latere support-break'}</strong><p>break: ${o.supportBreakDate||'—'} · trough: ${o.troughDate||'—'} · drawdown: ${o.drawdownFromSecondHighPct==null?'—':o.drawdownFromSecondHighPct.toFixed(1)+'%'}</p><small>Dit blok scoort de eerdere beslissing; het zat niet in de input.</small></div>`;
  }

  async function runNoLookaheadBacktest(){
    const button=$('#runNoLookaheadBacktest'),status=$('#backtestStatus');if(button)button.disabled=true;if(status)status.textContent='decision snapshot bouwen…';
    try{
      await loadScript('m24-backtest.js','M24Backtest');
      const store=M24?.runtime?.store,labResult=M24?.labResult;if(!store||!labResult)throw new Error('Open eerst BTC in Lab mode.');
      const caseSchema=M24Cases.get('BTC-2021-2022-TOP-MARKDOWN');
      const run=M24Backtest.run({
        caseSchema,labResult,
        meaningContext:latest(store,'MEANING_WORLD_CONTEXT'),
        derivativesContext:latest(store,'DERIVATIVES_CONTEXT'),
        archiveDerivativesContext:latest(store,'ARCHIVE_DERIVATIVES_CONTEXT'),
        macroContext:latest(store,'MACRO_CROSS_ASSET_CONTEXT')
      });
      const common={subjectId:caseSchema.asset,window:`${caseSchema.window.from}/${caseSchema.window.to}`,resolution:'BACKTEST',confidence:1,provenance:[]};
      store.add(M24Core.record('DECISION_SNAPSHOT',run.snapshot,{...common,evidenceStatus:M24Core.EVIDENCE.MECHANISM_VISIBLE}));
      store.add(M24Core.record('ACTION_CANDIDATE',run.candidate,{...common,evidenceStatus:M24Core.EVIDENCE.PLAUSIBLE_INTERPRETATION}));
      store.add(M24Core.record('BACKTEST_OUTCOME',run.outcome,{...common,evidenceStatus:M24Core.EVIDENCE.MECHANISM_VISIBLE}));
      render(run);if(status)status.textContent='backtest gereed zonder voorkennis';return run;
    }catch(err){console.error(err);if(status)status.textContent=`backtest niet gereed: ${err.message}`;throw err}
    finally{if(button)button.disabled=false}
  }

  function wire(){ensureControls();const b=$('#runNoLookaheadBacktest');if(b&&!b.dataset.wired){b.dataset.wired='1';b.addEventListener('click',()=>runNoLookaheadBacktest().catch(()=>{}));}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
  return {runNoLookaheadBacktest,wire};
})();
