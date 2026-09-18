globalThis.M24CalibrationPlanner = (() => {
  const clone=v=>structuredClone(v);

  function directionFromAction(action){
    if(action==='DOWNSIDE_WATCH') return 'DOWN';
    if(action==='UPSIDE_WATCH') return 'UP';
    return null;
  }

  function groupKey(x){
    return [x.coverageProfile,x.horizonProfile,x.regime,x.direction].join('|');
  }

  function buildInventory({snapshots=[],caseResolver,profileResolver,minSamples=30}={}){
    if(typeof caseResolver!=='function'||typeof profileResolver!=='function') throw new Error('Calibration planner requires case/profile resolvers.');
    const groups=new Map(),skipped=[];
    for(const snapshot of snapshots){
      if(snapshot.generated&&snapshot.selectionEligible!==true){
        skipped.push({caseId:snapshot.caseId,reason:'NON_CANONICAL_SELECTION'});
        continue;
      }
      const schema=caseResolver(snapshot.caseId)||(snapshot.generated?{
        id:snapshot.caseId,asset:snapshot.asset,
        horizonProfile:snapshot.horizonProfile,
        regimeFamily:snapshot.regimeFamily,
        analysis:'GENERATED_MECHANICS_CORE'
      }:null);
      if(!schema){skipped.push({caseId:snapshot.caseId,reason:'CASE_SCHEMA_MISSING'});continue}
      if(snapshot.verification?.sourceComplete!==true){skipped.push({caseId:snapshot.caseId,reason:'NOT_SOURCE_COMPLETE'});continue}
      const direction=directionFromAction(snapshot.actionCandidate?.action);
      if(!direction){skipped.push({caseId:snapshot.caseId,reason:'NON_DIRECTIONAL',action:snapshot.actionCandidate?.action||null});continue}
      const profile=profileResolver(schema);
      const identity={
        coverageProfile:snapshot.coverageProfile||schema.coverageProfile||'UNSPECIFIED',
        horizonProfile:profile.name,
        regime:schema.regimeFamily||schema.analysis||'UNSPECIFIED',
        direction
      };
      const key=groupKey(identity);
      if(!groups.has(key)){
        groups.set(key,{...identity,caseIds:[],horizons:Object.fromEntries(Object.keys(profile.horizons).map(h=>[h,{sampleSize:0,minSamples,deficit:minSamples,state:'INSUFFICIENT_SAMPLE'}]))});
      }
      const g=groups.get(key);
      if(!g.caseIds.includes(snapshot.caseId)) g.caseIds.push(snapshot.caseId);
      for(const h of Object.keys(g.horizons)) g.horizons[h].sampleSize+=1;
    }
    const cohortGroups=[...groups.values()].map(g=>{
      for(const h of Object.keys(g.horizons)){
        const n=g.horizons[h].sampleSize;
        g.horizons[h].deficit=Math.max(0,minSamples-n);
        g.horizons[h].state=n>=minSamples?'CALIBRATED_REFERENCE':'INSUFFICIENT_SAMPLE';
      }
      const minimumAcrossHorizons=Math.min(...Object.values(g.horizons).map(x=>x.sampleSize));
      return {
        ...g,
        currentCases:g.caseIds.length,
        minimumAcrossHorizons,
        episodeDeficit:Math.max(0,minSamples-minimumAcrossHorizons),
        probabilityAllowed:minimumAcrossHorizons>=minSamples
      };
    }).sort((a,b)=>a.episodeDeficit-b.episodeDeficit||a.coverageProfile.localeCompare(b.coverageProfile));

    return {
      type:'CALIBRATION_COHORT_PLAN',
      minSamples,
      directionalCases:cohortGroups.reduce((n,g)=>n+g.currentCases,0),
      cohortGroups,
      skipped,
      probabilityAllowed:cohortGroups.some(g=>g.probabilityAllowed),
      rule:'Calibration identity includes coverage profile, horizon profile, regime family and direction. Non-directional cases create no forecast sample. Probability remains hidden below the minimum compatible sample threshold.'
    };
  }

  function expansionQueue(plan){
    return plan.cohortGroups.map((g,index)=>({
      queueId:`CAL-${String(index+1).padStart(2,'0')}`,
      priority:g.currentCases>1?'P0':'P1',
      coverageProfile:g.coverageProfile,
      horizonProfile:g.horizonProfile,
      regime:g.regime,
      direction:g.direction,
      currentCases:g.currentCases,
      targetCases:plan.minSamples,
      episodeDeficit:g.episodeDeficit,
      status:g.episodeDeficit===0?'TARGET_REACHED':'EXPAND',
      rule:'One independent source-complete directional episode contributes at most one sample per horizon in this cohort.'
    })).sort((a,b)=>(a.priority==='P0'?-1:1)-(b.priority==='P0'?-1:1)||a.episodeDeficit-b.episodeDeficit);
  }

  return {directionFromAction,groupKey,buildInventory,expansionQueue,clone};
})();