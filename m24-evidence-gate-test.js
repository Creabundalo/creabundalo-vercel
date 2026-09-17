const fs=require('fs');
const vm=require('vm');
const source=fs.readFileSync('m24-evidence-gate.js','utf8');
const test=`
(()=>{
  const check=(condition,message)=>{if(!condition) throw new Error(message)};
  const caseSchema={id:'BTC-2021-2022-TOP-MARKDOWN',asset:'BTC'};
  const rec=(id,type,data)=>({id,type,data});
  const complete=[
    rec('p','LAB_RESULT_PRIMARY',{caseId:caseSchema.id}),
    rec('m','MEANING_WORLD_CONTEXT',{caseId:caseSchema.id,sources:[{id:'s1',publishedAt:'2021-11-09T10:00:00Z'}]}),
    rec('d','DERIVATIVES_CONTEXT',{caseId:caseSchema.id}),
    rec('a','ARCHIVE_DERIVATIVES_CONTEXT',{caseId:caseSchema.id,gaps:[]}),
    rec('x','MACRO_CROSS_ASSET_CONTEXT',{caseId:caseSchema.id,series:[{key:'DOLLAR'}],gaps:[]}),
    rec('s','DECISION_SNAPSHOT',{caseId:caseSchema.id}),
    rec('o','BACKTEST_OUTCOME',{caseId:caseSchema.id})
  ];
  const ok=M24EvidenceGate.assess(complete,caseSchema);
  check(ok.calibrationEligible===true,'source-complete case should be eligible');
  check(ok.missingLayers.length===0,'complete case should have no missing layers');

  const noArchive=complete.filter(x=>x.type!=='ARCHIVE_DERIVATIVES_CONTEXT');
  const incomplete=M24EvidenceGate.assess(noArchive,caseSchema);
  check(incomplete.calibrationEligible===false,'funding-only derivatives must not promote');
  check(incomplete.layers.DERIVATIVES.state==='INCOMPLETE','missing archive should be explicit');

  const withGap=complete.concat(rec('g','SOURCE_GAP',{caseId:caseSchema.id,domain:'DERIVATIVES_ARCHIVE',metric:'OPEN_INTEREST'}));
  const blocked=M24EvidenceGate.assess(withGap,caseSchema);
  check(blocked.calibrationEligible===false,'source gap must block promotion');
  check(blocked.layers.DERIVATIVES.state==='BLOCKED_BY_SOURCE_GAP','gap state missing');

  const priceOnly=[rec('p2','LAB_RESULT_PRIMARY',{caseId:caseSchema.id})];
  const sparse=M24EvidenceGate.assess(priceOnly,caseSchema);
  check(sparse.calibrationEligible===false,'price-only case must never calibrate');
  check(sparse.missingLayers.includes('MEANING_WORLD')&&sparse.missingLayers.includes('MACRO'),'missing layers not explicit');
  console.log('M24 evidence gate test OK',JSON.stringify({complete:ok.state,priceOnly:sparse.state,blocked:blocked.layers.DERIVATIVES.state}));
})();
`;
try{vm.runInThisContext(`${source}\n${test}`,{filename:'m24-evidence-gate-test-bundle.js'})}catch(err){console.error(err);process.exit(1)}
