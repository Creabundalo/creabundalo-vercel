const fs=require('fs');
const vm=require('vm');
const source=['m24-core.js','m24-evidence-gate.js','m24-enrichment.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
  const check=(condition,message)=>{if(!condition)throw new Error(message)};
  const caseSchema={id:'BTC-2021-2022-TOP-MARKDOWN',asset:'BTC',window:{from:'2021-01-01',to:'2022-06-30'}};
  const labResult={caseId:caseSchema.id,firstTop:{date:'2021-04-14'},secondTop:{date:'2021-11-10'},comparisons:{},support:{firstCloseBelow:'2022-01-17'},outcome:{troughDate:'2022-06-18',drawdownFromSecondHighPct:-70},provenance:[{sourceId:'TEST-PRICE'}]};

  globalThis.M24PrimaryLab={runCase:async()=>({result:labResult})};
  globalThis.M24Meaning={
    analyzeCase:()=>({type:'MEANING_WORLD_CONTEXT',caseId:caseSchema.id,asset:'BTC',sources:[{id:'s1',publishedAt:'2021-11-09T10:00:00Z'}]}),
    toProvenance:s=>({sourceId:s.id})
  };
  globalThis.M24DerivativesLab={
    runCase:async()=>({caseId:caseSchema.id,asset:'BTC',fundingContext:{caseId:caseSchema.id,firstTop:{count:3,asOf:'2021-04-14T23:59:59.999Z'},secondTop:{count:3,asOf:'2021-11-10T23:59:59.999Z'},comparison:{crowdingShift:'MORE_POSITIVE_AT_SECOND_TOP'}},openInterestGap:{caseId:caseSchema.id,domain:'DERIVATIVES',metric:'OPEN_INTEREST',reason:'HISTORY_WINDOW_EXCEEDED',recommendedSource:'BINANCE_VISION_METRICS'}}),
    toRecordPayloads:r=>[
      {type:'DERIVATIVES_CONTEXT',data:r.fundingContext,evidenceStatus:'MECHANISM_VISIBLE',confidence:1,provenance:[]},
      {type:'SOURCE_GAP',data:r.openInterestGap,evidenceStatus:'MECHANISM_VISIBLE',confidence:1,provenance:[]}
    ]
  };
  globalThis.M24BinanceVisionLab={
    runCase:async()=>({type:'ARCHIVE_DERIVATIVES_CONTEXT',caseId:caseSchema.id,asset:'BTC',firstTop:{date:'2021-04-14'},secondTop:{date:'2021-11-10'},deltas:{},gaps:[]}),
    toRecordPayloads:r=>[{type:'ARCHIVE_DERIVATIVES_CONTEXT',data:r,evidenceStatus:'MECHANISM_VISIBLE',confidence:1,provenance:[]}]
  };
  globalThis.M24MacroLab={
    runCase:async()=>({caseId:caseSchema.id,asset:'BTC',context:{caseId:caseSchema.id,series:[{key:'DOLLAR',status:'COMPARABLE'}],gaps:[]}}),
    toRecordPayloads:r=>[{type:'MACRO_CROSS_ASSET_CONTEXT',data:r.context,evidenceStatus:'MECHANISM_VISIBLE',confidence:1,provenance:[]}]
  };
  globalThis.M24Backtest={run:()=>({
    snapshot:{type:'DECISION_SNAPSHOT',caseId:caseSchema.id,asset:'BTC',asOf:'2021-11-10T23:59:59.999Z'},
    candidate:{type:'ACTION_CANDIDATE',caseId:caseSchema.id,action:'WAIT'},
    outcome:{type:'BACKTEST_OUTCOME',caseId:caseSchema.id,supportBreakAfterDecision:true}
  })};

  const store=new M24Core.QubusStore();
  const result=await M24Enrichment.runCase({store,caseSchema,providers:{price:{},derivatives:{},archive:{},macro:{}}});
  check(result.calibrationEligible===true,'source-complete enrichment should promote case');
  check(result.state==='SOURCE_COMPLETE','expected source-complete state');
  check(store.list('LAB_RESULT_PRIMARY').length===1,'price record missing');
  check(store.list('MEANING_WORLD_CONTEXT').length===1,'meaning record missing');
  check(store.list('DERIVATIVES_CONTEXT').length===1,'derivatives record missing');
  check(store.list('ARCHIVE_DERIVATIVES_CONTEXT').length===1,'archive record missing');
  check(store.list('MACRO_CROSS_ASSET_CONTEXT').length===1,'macro record missing');
  check(store.list('DECISION_SNAPSHOT').length===1&&store.list('BACKTEST_OUTCOME').length===1,'backtest split missing');
  const evidence=store.list('CASE_EVIDENCE_STATUS').at(-1).data;
  check(evidence.layers.DERIVATIVES.state==='COMPLETE','archive should resolve recent API retention gap');
  check(evidence.layers.DERIVATIVES.resolvedGapIds.length===1,'resolved source gap must remain auditable');
  console.log('M24 enrichment test OK',JSON.stringify({state:result.state,eligible:result.calibrationEligible,records:store.records.length}));
})().catch(err=>{console.error(err);process.exit(1)});
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-enrichment-test-bundle.js'});
