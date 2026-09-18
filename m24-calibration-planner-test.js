const fs=require('fs'),vm=require('vm');
globalThis.__m24CalibrationSnapshots=[
 'm24-verified-btc-2019.json','m24-verified-btc-2021.json','m24-verified-eth-2021.json','m24-verified-sol-2021.json',
 'm24-verified-nasdaq-2000.json','m24-verified-nl-housing-2015-2023.json','m24-verified-global-mar2020.json'
].map(f=>JSON.parse(fs.readFileSync(f,'utf8')));
const source=['m24-cases.js','m24-replay.js','m24-calibration-planner.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const plan=M24CalibrationPlanner.buildInventory({
   snapshots:globalThis.__m24CalibrationSnapshots,
   caseResolver:id=>M24Cases.get(id),
   profileResolver:schema=>M24Replay.profileForCase(schema),
   minSamples:30
 });
 const byKey=Object.fromEntries(plan.cohortGroups.map(g=>[M24CalibrationPlanner.groupKey(g),g]));
 const core=byKey['CORE_DERIVATIVES|FAST_MARKET|DISTRIBUTION_MARKDOWN|DOWN'];
 const ext=byKey['EXTENDED_DERIVATIVES|FAST_MARKET|DISTRIBUTION_MARKDOWN|DOWN'];
 const housing=byKey['HOUSING_PRICE_RATE_MEANING|SLOW_MARKET|HOUSING_CYCLE_ROLLOVER|DOWN'];
 const shock=byKey['CROSS_ASSET_LIQUIDITY|SHOCK|LIQUIDITY_SHOCK|DOWN'];
 check(core?.currentCases===2&&core.episodeDeficit===28,'CORE crypto deficit');
 check(ext?.currentCases===1&&ext.episodeDeficit===29,'EXTENDED crypto deficit');
 check(housing?.currentCases===1&&housing.episodeDeficit===29,'housing deficit');
 check(shock?.currentCases===1&&shock.episodeDeficit===29,'shock deficit');
 check(plan.skipped.filter(x=>x.reason==='NON_DIRECTIONAL').length===2,'WAIT controls should be skipped');
 check(plan.cohortGroups.every(g=>g.probabilityAllowed===false),'no current cohort should allow probability');
 const queue=M24CalibrationPlanner.expansionQueue(plan);
 check(queue[0].coverageProfile==='CORE_DERIVATIVES','largest existing compatible cohort should be first P0');
 fs.writeFileSync('m24-calibration-plan-snapshot.json',JSON.stringify({...plan,expansionQueue:queue},null,2));
 console.log('M24 calibration expansion planner OK');
 console.log(JSON.stringify({groups:plan.cohortGroups.map(g=>({coverage:g.coverageProfile,horizonProfile:g.horizonProfile,regime:g.regime,n:g.currentCases,deficit:g.episodeDeficit})),skipped:plan.skipped}));
})();
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-calibration-planner-test-bundle.js'});
