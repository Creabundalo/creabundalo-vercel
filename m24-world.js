(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.M24World=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const TODAY='2026-09-19';
  const FINGERPRINTS=[
    {caseId:'NASDAQ-1999-2002',domain:'EQUITY_INDEX',core:['NARRATIVE_VALUATION_GAP','POLICY_BACKSTOP','MACRO_DAMAGE'],requirements:[]},
    {caseId:'NL-HOUSING-2015-2023',domain:'HOUSING',core:['BORROWING_CAPACITY'],requirements:['BORROWING_CAPACITY']},
    {caseId:'GLOBAL-MAR2020',domain:'CROSS_ASSET',core:['FUNDING_LIQUIDITY_CONSTRAINT','COLLATERAL_LEVERAGE','FORCED_ACTION','PRICE_VOL_FEEDBACK','POLICY_BACKSTOP','MACRO_DAMAGE'],requirements:[]},
    {caseId:'SPX-2007-2009',domain:'EQUITY_CREDIT',core:['CREDIT_BALANCE_DAMAGE','FUNDING_LIQUIDITY_CONSTRAINT','COLLATERAL_LEVERAGE','FORCED_ACTION','PRICE_VOL_FEEDBACK','POLICY_BACKSTOP','MACRO_DAMAGE'],requirements:[]},
    {caseId:'OIL-APR2020',domain:'COMMODITY_FUTURES',core:['FUNDING_LIQUIDITY_CONSTRAINT','PHYSICAL_CONSTRAINT','FORCED_ACTION','PRICE_VOL_FEEDBACK','EXPIRY_CONTRACT'],requirements:['PHYSICAL_CONSTRAINT','EXPIRY_CONTRACT']},
    {caseId:'UK-GILTS-2022',domain:'BONDS_CREDIT',core:['FUNDING_LIQUIDITY_CONSTRAINT','COLLATERAL_LEVERAGE','FORCED_ACTION','PRICE_VOL_FEEDBACK','POLICY_BACKSTOP'],requirements:[]}
  ];

  const LIMITS={CURRENT_D30:45,RECENT_D90:120,STRUCTURAL_D180:240,STALE_FAST_MARKET:0};

  function daysBetween(a,b){
    return Math.floor((new Date(b+'T00:00:00Z')-new Date(a+'T00:00:00Z'))/86400000);
  }

  function assessRecency(world,now=TODAY){
    const base=world.publicationDate||world.asOf;
    const age=daysBetween(base,now);
    const limit=LIMITS[world.recencyClass]??90;
    const usable=world.recencyClass!=='STALE_FAST_MARKET' && age<=limit;
    return {ageDays:age,limitDays:limit,usable,status:usable?'CURRENT_ENOUGH':'STALE_OR_REFERENCE_ONLY'};
  }

  function overlap(a,b){
    const set=new Set(a);
    return b.filter(x=>set.has(x));
  }

  function matchAnalogs(activeMechanisms){
    const active=[...new Set(activeMechanisms||[])];
    return FINGERPRINTS.map(fp=>{
      const matched=overlap(active,fp.core);
      const missingCore=fp.core.filter(x=>!active.includes(x));
      const missingRequirements=fp.requirements.filter(x=>!active.includes(x));
      const inputCoverage=active.length?matched.length/active.length:0;
      const caseCoverage=fp.core.length?matched.length/fp.core.length:0;
      const eligible=matched.length>0 && missingRequirements.length===0;
      const partial=matched.length>0 && !eligible;
      return {
        caseId:fp.caseId,domain:fp.domain,matched,missingCore,missingRequirements,
        inputCoverage,caseCoverage,eligible,partial,
        interpretation:eligible?'STRUCTURAL_ANALOG_ELIGIBLE':partial?'PARTIAL_DOMAIN_ANALOG':'NO_MEANINGFUL_OVERLAP'
      };
    });
  }

  function scenarioBranches(mechanisms){
    const m=new Set(mechanisms||[]);
    const out=[];
    if(m.has('BORROWING_CAPACITY')){
      out.push({id:'AFFORDABILITY_PRESSURE_PERSISTS',type:'CONTINUATION',watch:['mortgage rates','income','transactions','inventory']});
      out.push({id:'AFFORDABILITY_RELIEF',type:'RELIEF',watch:['mortgage rates','income','supply','affordability']});
    }
    if(m.has('PHYSICAL_CONSTRAINT')){
      out.push({id:'PHYSICAL_CONSTRAINT_PERSISTS',type:'CONTINUATION',watch:['capacity','queues','lead times','demand']});
      out.push({id:'PHYSICAL_ADAPTATION',type:'RELIEF',watch:['capex','new capacity','substitution','demand response']});
    }
    if(m.has('FUNDING_LIQUIDITY_CONSTRAINT')||m.has('COLLATERAL_LEVERAGE')){
      out.push({id:'FINANCIAL_STRESS_PERSISTS',type:'CONTINUATION',watch:['funding spreads','market depth','collateral','forced flow']});
      out.push({id:'FINANCIAL_CONSTRAINT_RELIEF',type:'RELIEF',watch:['market depth','funding stress','backstop use','volatility']});
    }
    if(m.has('RULE_CHANGE')||m.has('POLICY_EXPECTATION')){
      out.push({id:'NEW_REGIME_OBSERVATION',type:'COHORT_GAP_OR_RULE_CHANGE',watch:['implementation','flows','positioning','adoption']});
    }
    out.push({id:'NEW_INFORMATION_CHANGES_STATE',type:'REGIME_SHIFT',watch:['SURPRISE_STATE','new constraint','forced action','rule change']});
    return out;
  }

  function evaluateWorld(world,now=TODAY){
    const recency=assessRecency(world,now);
    if(!recency.usable && world.recencyClass==='STALE_FAST_MARKET'){
      return {...world,recency,eligibleAnalogs:[],partialAnalogs:[],cohortGap:true,branches:[],forecastProbability:null,
        guard:'STALE_FAST_MARKET_CANNOT_ACTIVATE_CURRENT_MECHANISM'};
    }
    const matches=matchAnalogs(world.mechanisms);
    const eligibleAnalogs=matches.filter(x=>x.eligible && x.inputCoverage>0);
    const partialAnalogs=matches.filter(x=>x.partial || (!x.eligible && x.inputCoverage>0));
    return {...world,recency,eligibleAnalogs,partialAnalogs,cohortGap:eligibleAnalogs.length===0,
      branches:scenarioBranches(world.mechanisms),forecastProbability:null,
      guard:'STRUCTURAL_RETRIEVAL_NOT_PROBABILITY'};
  }

  function evaluateSnapshot(snapshot,now=TODAY){
    return {schema:'m24.current_world.evaluated.v0.1',asOf:now,safety:'NO_PROBABILITY_NO_AUTO_TRADE',
      worlds:(snapshot.worlds||[]).map(w=>evaluateWorld(w,now))};
  }

  async function loadSnapshot(url='m24-world-snapshot.json'){
    const r=await fetch(url,{cache:'no-store'});
    if(!r.ok) throw new Error('CURRENT_WORLD_SOURCE_'+r.status);
    return r.json();
  }

  function fmtObs(o){
    if(typeof o.value==='number') return o.value+' '+(o.unit||'');
    return String(o.value);
  }

  function render(container,evaluated){
    if(!container) return;
    container.innerHTML=(evaluated.worlds||[]).map(w=>{
      const rec=w.recency.usable?'CURRENT':'REFERENCE/STALE';
      const eligible=w.eligibleAnalogs.map(x=>x.caseId).join(' · ')||'—';
      const partial=w.partialAnalogs.map(x=>x.caseId).join(' · ')||'—';
      const branch=w.branches.map(x=>x.id).join(' · ')||'—';
      const obs=(w.observations||[]).slice(0,3).map(o=>'<li><b>'+o.sensor+'</b>: '+fmtObs(o)+'</li>').join('');
      return '<article class="history-item"><span>'+w.worldId+'</span><strong>'+w.mechanisms.join(' · ')+'</strong>'+
        '<p>Recency: '+rec+' ('+w.recency.ageDays+'d) · eligible analogs: '+eligible+' · partial: '+partial+'</p>'+
        '<ul>'+obs+'</ul><p><b>ψ open:</b> '+branch+'</p><small>'+w.guard+' · probability = OFF</small></article>';
    }).join('');
  }

  async function mount(containerId='m24WorldState',url='m24-world-snapshot.json'){
    const el=document.getElementById(containerId);
    if(!el) return null;
    el.textContent='Strategic World laden…';
    try{
      const snapshot=await loadSnapshot(url);
      const evaluated=evaluateSnapshot(snapshot);
      render(el,evaluated);
      return evaluated;
    }catch(err){
      el.innerHTML='<div class="history-item"><strong>SOURCE_GAP</strong><p>Strategic World snapshot kon niet worden geladen.</p><small>'+String(err.message||err)+'</small></div>';
      return null;
    }
  }

  if(typeof document!=='undefined'){
    document.addEventListener('DOMContentLoaded',()=>mount());
  }

  return {TODAY,FINGERPRINTS,assessRecency,matchAnalogs,scenarioBranches,evaluateWorld,evaluateSnapshot,loadSnapshot,render,mount};
});