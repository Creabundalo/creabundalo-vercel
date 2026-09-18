const fs=require('fs'),vm=require('vm');
const source=['m24-cases.js','m24-meaning.js','m24-trickster-lab.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const files=[
   'm24-verified-btc-2019.json',
   'm24-verified-btc-2021.json',
   'm24-verified-eth-2021.json',
   'm24-verified-sol-2021.json',
   'm24-verified-nasdaq-2000.json',
   'm24-verified-nl-housing-2015-2023.json',
   'm24-verified-global-mar2020.json'
 ];
 const assessments=[];
 for(const file of files){
   const snapshot=JSON.parse(fs.readFileSync(file,'utf8'));
   const schema=M24Cases.get(snapshot.caseId);
   check(schema,'missing case schema '+snapshot.caseId);
   const meaning=M24Meaning.analyzeCase(schema);
   const result=M24TricksterLab.assessVerifiedSnapshot({caseSchema:schema,snapshot,meaningContext:meaning});
   assessments.push(result);
   check(result.intentStatus==='INTENT_UNKNOWN','intent guard '+snapshot.caseId);
   check(result.actorAttribution==='NONE','actor guard '+snapshot.caseId);
   check(result.manipulationStatus==='NOT_ESTABLISHED','manipulation guard '+snapshot.caseId);
   check(result.predictiveStatus==='NOT_CALIBRATED','predictive guard '+snapshot.caseId);
 }
 const byCase=Object.fromEntries(assessments.map(x=>[x.caseId,x]));
 const counts=assessments.reduce((acc,x)=>(acc[x.state]=(acc[x.state]||0)+1,acc),{});
 check(byCase['BTC-2021-2022-TOP-MARKDOWN'].state==='DIVERGENCE_VISIBLE','BTC 2021 expected divergence');
 check(byCase['ETH-2021-2022-TOP-MARKDOWN'].state==='DIVERGENCE_VISIBLE','ETH 2021 expected divergence');
 check(byCase['SOL-2021-2022-TOP-MARKDOWN'].state==='DIVERGENCE_VISIBLE','SOL 2021 expected divergence');
 check(byCase['NL-HOUSING-2015-2023'].state==='ALIGNMENT_VISIBLE','housing expected alignment');
 check(byCase['GLOBAL-MAR2020'].state==='ALIGNMENT_VISIBLE','March 2020 expected alignment');
 check(byCase['BTC-2019-TOP-MARKDOWN'].action==='WAIT','BTC 2019 negative control must remain WAIT');
 check(byCase['NASDAQ-1999-2002'].action==='WAIT','NASDAQ negative control must remain WAIT');
 const summary={
   type:'M24_TRICKSTER_VERIFIED_CROSSCASE_SUMMARY',
   sampleSize:assessments.length,
   stateCounts:counts,
   assessments:Object.fromEntries(assessments.map(x=>[x.caseId,{
     asset:x.asset,action:x.action,coverageProfile:x.coverageProfile,state:x.state,
     meaning:x.meaning,mechanism:x.mechanism,discrepancyMagnitude:x.discrepancyMagnitude,
     intentStatus:x.intentStatus,actorAttribution:x.actorAttribution,
     manipulationStatus:x.manipulationStatus,predictiveStatus:x.predictiveStatus
   }])),
   negativeControls:['BTC-2019-TOP-MARKDOWN','NASDAQ-1999-2002'],
   conclusion:'The Trickster classifier discriminates descriptive meaning/mechanism states across verified cases while preserving WAIT negative controls. This validates the comparison method, not predictive edge.',
   rule:'Divergence/alignment is descriptive. Manipulation, actor intent, causality and predictive value remain unestablished.'
 };
 fs.writeFileSync('m24-trickster-verified-crosscase-snapshot.json',JSON.stringify(summary,null,2));
 console.log('M24 verified Trickster cross-case validation OK');
 console.log(JSON.stringify(summary));
})();
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-trickster-verified-crosscase-bundle.js'});
