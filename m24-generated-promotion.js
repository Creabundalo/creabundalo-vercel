globalThis.M24GeneratedPromotion = (() => {
  const clone=v=>structuredClone(v);

  function isDirectional(action){return action==='DOWNSIDE_WATCH'||action==='UPSIDE_WATCH'}

  function promote({caseSchema,enrichment,verification}={}){
    if(!caseSchema?.generated) throw new Error('Generated promotion requires generated case schema.');
    if(caseSchema.coverageProfile!=='MECHANICS_CORE_DERIVATIVES') throw new Error('Generated promotion requires mechanics-core coverage profile.');
    if(caseSchema.selectionEligible!==true||!caseSchema.selectionUniverseId) throw new Error('Generated promotion requires canonical selection eligibility.');
    if(enrichment?.calibrationEligible!==true||enrichment?.state!=='SOURCE_COMPLETE') throw new Error('Generated case is not source-complete.');
    const action=enrichment?.backtest?.candidate?.action;
    if(!isDirectional(action)) throw new Error('Generated source-complete WAIT/non-directional case cannot create a directional calibration snapshot.');
    if(!verification?.workflowRunId||!verification?.artifactDigest||!verification?.headSha) throw new Error('Generated promotion requires pinned verification identity.');

    const decision=enrichment.backtest.snapshot;
    const outcome=enrichment.backtest.outcome;
    return {
      type:'VERIFIED_SOURCE_SNAPSHOT',
      caseId:caseSchema.id,
      asset:caseSchema.asset,
      generated:true,
      generatorRule:caseSchema.generatorRule,
      episodeGroup:caseSchema.episodeGroup,
      selectionEligible:true,
      selectionUniverseId:caseSchema.selectionUniverseId,
      selectionWindow:clone(caseSchema.selectionWindow),
      coverageProfile:caseSchema.coverageProfile,
      horizonProfile:caseSchema.horizonProfile,
      regimeFamily:caseSchema.regimeFamily,
      verification:{
        workflow:verification.workflow||'M24 Source E2E',
        workflowRunId:verification.workflowRunId,
        artifactId:verification.artifactId||null,
        artifactDigest:verification.artifactDigest,
        headSha:verification.headSha,
        verifiedAt:verification.verifiedAt||null,
        sourceComplete:true
      },
      state:'SOURCE_COMPLETE',
      calibrationEligible:true,
      resolvedCheckpoints:{
        firstTop:decision.price.firstTop.date,
        secondTop:decision.price.secondTop.date,
        decisionAsOf:decision.asOf,
        supportBreakDate:outcome.supportBreakDate||null,
        troughDate:outcome.troughDate||null
      },
      actionCandidate:clone(enrichment.backtest.candidate),
      evidenceLayers:Object.fromEntries(Object.entries(enrichment.evidence.layers||{}).map(([k,v])=>[k,{
        state:v.state,
        extensionState:v.extensionState||null,
        note:v.note
      }])),
      sourceNotes:{
        evidenceProfile:caseSchema.coverageProfile,
        meaningWorld:'NOT_REQUIRED_FOR_THIS_COHORT'
      },
      rule:'Pinned generated mechanics-core snapshot. It may enter only the matching coverage/horizon/regime/direction calibration cohort; semantic enrichment later must not rewrite this decision.'
    };
  }

  return {isDirectional,promote};
})();