const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('m24-trickster-lab.js','utf8');
const test=`
(()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const schema={id:'X',asset:'X'};
 const meaning={firstTop:{direction:0.6},secondTop:{direction:0.8},sourceScope:{totalScopedSources:2}};
 const snapshot={verification:{sourceComplete:true},coverageProfile:'TEST',actionCandidate:{action:'DOWNSIDE_WATCH',score:3,evidence:[{id:'WEAK_RSI',weight:1}]}};
 const r=M24TricksterLab.assessVerifiedSnapshot({caseSchema:schema,snapshot,meaningContext:meaning});
 check(r.state==='DIVERGENCE_VISIBLE','expected divergence');
 check(r.mechanism.stressScore===0.75,'stress normalization');
 check(r.intentStatus==='INTENT_UNKNOWN'&&r.actorAttribution==='NONE','intent/actor guard');
 check(r.manipulationStatus==='NOT_ESTABLISHED','manipulation guard');
 check(r.predictiveStatus==='NOT_CALIBRATED','predictive guard');
 const align=M24TricksterLab.assessVerifiedSnapshot({caseSchema:{id:'Y',asset:'Y',scoreProfile:'HOUSING_SLOW_MARKET'},snapshot:{verification:{sourceComplete:true},actionCandidate:{action:'DOWNSIDE_WATCH',score:2,evidence:['HOUSING_GROWTH_DECELERATION']}},meaningContext:{firstTop:{direction:0.8},secondTop:{direction:-0.5},sourceScope:{totalScopedSources:3}}});
 check(align.state==='ALIGNMENT_VISIBLE','expected alignment');
 check(align.observations.some(x=>x.id==='NARRATIVE_REGIME_SHIFT'),'narrative shift missing');
 console.log('M24 Trickster cross-case contract OK');
})();
`;
vm.runInThisContext(`${source}\n${test}`);
