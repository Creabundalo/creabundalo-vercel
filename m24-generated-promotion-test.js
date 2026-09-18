const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('m24-generated-promotion.js','utf8');
const test=`
(()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const schema={id:'GEN-ETH-X',asset:'ETH',generated:true,generatorRule:'FAST_DISTRIBUTION_V1',episodeGroup:'ETH:X',coverageProfile:'MECHANICS_CORE_DERIVATIVES',horizonProfile:'FAST_MARKET',regimeFamily:'DISTRIBUTION_MARKDOWN'};
 const enrichment={
   state:'SOURCE_COMPLETE',calibrationEligible:true,
   backtest:{
     snapshot:{asOf:'2023-11-24T23:59:59.999Z',price:{firstTop:{date:'2023-04-16'},secondTop:{date:'2023-11-24'}}},
     candidate:{action:'DOWNSIDE_WATCH',score:2,coverage:1,evidence:[]},
     outcome:{supportBreakDate:'2023-12-01',troughDate:'2024-01-01'}
   },
   evidence:{layers:{PRICE:{state:'COMPLETE',note:'ok'},DERIVATIVES:{state:'COMPLETE',note:'ok'},MACRO:{state:'COMPLETE',note:'ok'},DECISION_SNAPSHOT:{state:'COMPLETE',note:'ok'},BACKTEST_OUTCOME:{state:'COMPLETE',note:'ok'},MEANING_WORLD:{state:'INCOMPLETE',note:'not required'}}}
 };
 const verification={workflowRunId:123,artifactDigest:'sha256:test',headSha:'abc',artifactId:5,verifiedAt:'2026-09-18T00:00:00Z'};
 const snapshot=M24GeneratedPromotion.promote({caseSchema:schema,enrichment,verification});
 check(snapshot.type==='VERIFIED_SOURCE_SNAPSHOT','snapshot type');
 check(snapshot.coverageProfile==='MECHANICS_CORE_DERIVATIVES','coverage');
 check(snapshot.actionCandidate.action==='DOWNSIDE_WATCH','action');
 check(snapshot.sourceNotes.meaningWorld==='NOT_REQUIRED_FOR_THIS_COHORT','meaning separation');
 let rejected=false;try{M24GeneratedPromotion.promote({caseSchema:schema,enrichment:{...enrichment,backtest:{...enrichment.backtest,candidate:{action:'WAIT'}}},verification})}catch(e){rejected=true}
 check(rejected,'WAIT generated case must not promote');
 console.log('M24 generated promotion contract OK');
})();
`;
vm.runInThisContext(`${source}\n${test}`);
