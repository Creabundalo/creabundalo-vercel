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
    rec('m','MEANING_WORLD_CONTEXT',{caseId:caseSchema.id,sources:[{id:'s1',publishedAt:'2021-11-09T10:00:00Z'}],firstTop:{count:1},secondTop:{count:1}}),
    rec('d','DERIVATIVES_CONTEXT',{caseId:caseSchema.id,firstTop:{count:3},secondTop:{count:3},sourceGaps:[]}),
    rec('a','ARCHIVE_DERIVATIVES_CONTEXT',{caseId:caseSchema.id,gaps:[]}),
    rec('x','MACRO_CROSS_ASSET_CONTEXT',{caseId:caseSchema.id,series:[{key:'DOLLAR'}],gaps:[]}),
    rec('s','DECISION_SNAPSHOT',{caseId:caseSchema.id}),
    rec('o','BACKTEST_OUTCOME',{caseId:caseSchema.id})
  ];
  const ok=M24EvidenceGate.assess(complete,caseSchema);
  check(ok.calibrationEligible===true,'source-complete case should be eligible');
  check(ok.coverageProfile==='EXTENDED_DERIVATIVES','complete archive should create extended profile');

  const noSecondMeaning=complete.map(x=>x.id==='m'?rec('m','MEANING_WORLD_CONTEXT',{caseId:caseSchema.id,sources:[{id:'s1'}],firstTop:{count:1},secondTop:{count:0}}):x);
  const meaningIncomplete=M24EvidenceGate.assess(noSecondMeaning,caseSchema);
  check(meaningIncomplete.calibrationEligible===false,'missing second-top meaning evidence must block promotion');

  const noArchive=complete.filter(x=>x.type!=='ARCHIVE_DERIVATIVES_CONTEXT');
  const notAttempted=M24EvidenceGate.assess(noArchive,caseSchema);
  check(notAttempted.calibrationEligible===false,'archive extension must at least be attempted before promotion');
  check(notAttempted.layers.DERIVATIVES.extensionState==='NOT_ATTEMPTED','missing archive attempt should be explicit');

  const noFundingAtSecond=complete.map(x=>x.id==='d'?rec('d','DERIVATIVES_CONTEXT',{caseId:caseSchema.id,firstTop:{count:3},secondTop:{count:0},sourceGaps:[]}):x);
  const missingFunding=M24EvidenceGate.assess(noFundingAtSecond,caseSchema);
  check(missingFunding.calibrationEligible===false,'missing checkpoint funding must block promotion');

  const resolvedRetentionGap=complete.concat(rec('rg','SOURCE_GAP',{
    caseId:caseSchema.id,domain:'DERIVATIVES',metric:'OPEN_INTEREST',reason:'HISTORY_WINDOW_EXCEEDED',recommendedSource:'BINANCE_VISION_METRICS'
  }));
  const resolved=M24EvidenceGate.assess(resolvedRetentionGap,caseSchema);
  check(resolved.calibrationEligible===true,'recent API retention gap should be resolved by complete archive');
  check(resolved.coverageProfile==='EXTENDED_DERIVATIVES','resolved archive case should stay extended');
  check(resolved.layers.DERIVATIVES.resolvedGapIds.includes('rg'),'resolved gap must remain auditable');

  const limitedArchive=complete.map(x=>x.id==='a'?rec('a','ARCHIVE_DERIVATIVES_CONTEXT',{caseId:caseSchema.id,gaps:[{date:'2021-05-12',reason:'ARCHIVE_DAY_MISSING'}]}):x)
    .concat(rec('g','SOURCE_GAP',{caseId:caseSchema.id,domain:'DERIVATIVES_ARCHIVE',metric:'BINANCE_VISION_METRICS',reason:'ARCHIVE_DAY_MISSING'}));
  const core=M24EvidenceGate.assess(limitedArchive,caseSchema);
  check(core.calibrationEligible===true,'source-limited optional positioning must not invalidate the common core');
  check(core.coverageProfile==='CORE_DERIVATIVES','source-limited archive should create core profile');
  check(core.layers.DERIVATIVES.extensionState==='SOURCE_LIMITED','extension limitation must remain explicit');

  const fundingGap=complete.map(x=>x.id==='d'?rec('d','DERIVATIVES_CONTEXT',{caseId:caseSchema.id,firstTop:{count:3},secondTop:{count:3},sourceGaps:[{yearMonth:'2021-05',reason:'ARCHIVE_MONTH_MISSING'}]}):x);
  const blockedCore=M24EvidenceGate.assess(fundingGap,caseSchema);
  check(blockedCore.calibrationEligible===false,'core funding source gaps must block promotion');

  const priceOnly=[rec('p2','LAB_RESULT_PRIMARY',{caseId:caseSchema.id})];
  const sparse=M24EvidenceGate.assess(priceOnly,caseSchema);
  check(sparse.calibrationEligible===false,'price-only case must never calibrate');
  console.log('M24 evidence gate test OK',JSON.stringify({extended:ok.coverageProfile,core:core.coverageProfile,notAttempted:notAttempted.layers.DERIVATIVES.extensionState}));
})();
`;
try{vm.runInThisContext(`${source}\n${test}`,{filename:'m24-evidence-gate-test-bundle.js'})}catch(err){console.error(err);process.exit(1)}
