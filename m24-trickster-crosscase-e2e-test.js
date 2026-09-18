const fs=require('fs'),vm=require('vm');
globalThis.__m24fs=fs;
const files=['m24-cases.js','m24-meaning.js','m24-trickster-lab.js'];
const source=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(()=>{
 const map={
  'BTC-2019-TOP-MARKDOWN':'m24-verified-btc-2019.json',
  'BTC-2021-2022-TOP-MARKDOWN':'m24-verified-btc-2021.json',
  'ETH-2021-2022-TOP-MARKDOWN':'m24-verified-eth-2021.json',
  'SOL-2021-2022-TOP-MARKDOWN':'m24-verified-sol-2021.json',
  'NASDAQ-1999-2002':'m24-verified-nasdaq-2000.json',
  'NL-HOUSING-2015-2023':'m24-verified-nl-housing-2015-2023.json',
  'GLOBAL-MAR2020':'m24-verified-global-mar2020.json'
 };
 const results={};
 for(const [caseId,file] of Object.entries(map)){
   const schema=M24Cases.get(caseId);
   const snapshot=JSON.parse(globalThis.__m24fs.readFileSync(file,'utf8'));
   const meaning=M24Meaning.analyzeCase(schema);
   results[caseId]=M24TricksterLab.assessVerifiedSnapshot({caseSchema:schema,snapshot,meaningContext:meaning});
   if(results[caseId].intentStatus!=='INTENT_UNKNOWN'||results[caseId].actorAttribution!=='NONE'||results[caseId].manipulationStatus!=='NOT_ESTABLISHED') throw new Error(caseId+' intent/actor/manipulation guard failed');
 }
 const expected={
   'BTC-2019-TOP-MARKDOWN':'MEANING_AHEAD_OF_MECHANISM',
   'BTC-2021-2022-TOP-MARKDOWN':'DIVERGENCE_VISIBLE',
   'ETH-2021-2022-TOP-MARKDOWN':'DIVERGENCE_VISIBLE',
   'SOL-2021-2022-TOP-MARKDOWN':'DIVERGENCE_VISIBLE',
   'NASDAQ-1999-2002':'MEANING_AHEAD_OF_MECHANISM',
   'NL-HOUSING-2015-2023':'ALIGNMENT_VISIBLE',
   'GLOBAL-MAR2020':'ALIGNMENT_VISIBLE'
 };
 for(const [caseId,state] of Object.entries(expected)) if(results[caseId].state!==state) throw new Error(caseId+' expected '+state+' got '+results[caseId].state);
 const groups={};
 for(const [caseId,r] of Object.entries(results)) (groups[r.state]??=[]).push(caseId);
 const snapshot={
   type:'M24_TRICKSTER_CROSS_CASE_VALIDATION',
   sampleSize:Object.keys(results).length,
   states:groups,
   cases:Object.fromEntries(Object.entries(results).map(([id,r])=>[id,{
     action:r.action,state:r.state,
     meaning:r.meaning,mechanism:r.mechanism,
     discrepancyMagnitude:r.discrepancyMagnitude,
     contrastIds:r.contrasts.map(x=>x.id),
     confirmationIds:r.confirmations.map(x=>x.id),
     observationIds:r.observations.map(x=>x.id),
     intentStatus:r.intentStatus,actorAttribution:r.actorAttribution,manipulationStatus:r.manipulationStatus,predictiveStatus:r.predictiveStatus
   }])),
   rule:'Trickster validates meaning↔mechanism relationship type. State is not a trading direction, manipulation claim or calibrated probability.'
 };
 globalThis.__m24fs.writeFileSync('m24-trickster-crosscase-snapshot.json',JSON.stringify(snapshot,null,2));
 console.log('M24 Trickster cross-case validation E2E OK');
 console.log(JSON.stringify(snapshot));
})();
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-trickster-crosscase-e2e-bundle.js'});
