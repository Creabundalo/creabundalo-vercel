const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('m24-generated-case.js','utf8');
const test=`
(()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const candidate={
   asset:'ETH',decisionDate:'2023-07-03',episodeGroup:'ETH:DISTRIBUTION_MARKDOWN:2023-07-03',selectorRule:'FAST_DISTRIBUTION_V1',
   firstTop:{date:'2023-04-16',high:2140,close:2100,volume:1000,rsi14:72},
   checkpoint:{date:'2023-07-03',high:1975,close:1950,volume:800,rsi14:59},
   observed:{retestRatio:0.923,volumeRatio:0.8,rsiDelta:-13},
   outcomeStatus:'UNREAD_AT_SELECTION'
 };
 const schema=M24GeneratedCase.fromEpisodeCandidate(candidate);
 check(schema.coverageProfile==='MECHANICS_CORE_DERIVATIVES','coverage profile');
 check(schema.requiredLayers.includes('MEANING_WORLD')===false,'meaning must not be silently required');
 check(schema.requiredLayers.includes('DERIVATIVES')&&schema.requiredLayers.includes('MACRO'),'mechanics layers');
 check(schema.checkpointWindows.firstTop.from==='2023-04-16'&&schema.checkpointWindows.firstTop.to==='2023-04-16','fixed first top');
 check(schema.checkpointWindows.secondTop.from==='2023-07-03'&&schema.checkpointWindows.secondTop.to==='2023-07-03','fixed decision checkpoint');
 check(schema.checkpointWindows.markdownOutcome.to==='2023-10-01','deterministic outcome window');
 check(schema.episodeGroup===candidate.episodeGroup,'episode identity');
 const integrity=M24GeneratedCase.assertNoOutcomeLeak(schema,candidate);
 check(integrity.valid===true,'outcome leak guard');
 let rejected=false;try{M24GeneratedCase.fromEpisodeCandidate({...candidate,outcomeStatus:'KNOWN'})}catch(e){rejected=true}
 check(rejected,'known-outcome candidate must be rejected');
 console.log('M24 generated case contract OK');
})();
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-generated-case-test-bundle.js'});
