const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('m24-backtest.js','utf8');
const test=`
(()=>{
  const check=(condition,message)=>{if(!condition) throw new Error(message)};
  const caseSchema={id:'BTC-2021-2022-TOP-MARKDOWN',asset:'BTC',checkpointWindows:{secondTop:{to:'2021-11-30'}}};
  const baseLab={
    firstTop:{date:'2021-04-14',high:64000,rsi14:75,volume:100},
    secondTop:{date:'2021-11-10',high:69000,rsi14:74,volume:50},
    comparisons:{priceHighChangePct:7.8,volumeChangePct:-50,rsiChange:-1,rsiBearishDivergence:false,volumeBearishDivergence:true},
    support:{firstCloseBelow:'2022-01-17'},
    outcome:{troughDate:'2022-06-18',troughLow:17600,drawdownFromSecondHighPct:-74.5}
  };
  const meaning={sources:[
    {id:'a',publishedAt:'2021-11-09T10:00:00Z',direction:0.8,frames:['INFLATION_HEDGE']},
    {id:'post-top-window',publishedAt:'2021-11-20T10:00:00Z',direction:-0.9,frames:['POST_TOP_FRAME']},
    {id:'future',publishedAt:'2021-12-10T10:00:00Z',direction:-1,frames:['FUTURE_FRAME']}
  ]};
  const derivatives={
    firstTop:{count:2,asOf:'2021-04-14T23:59:59.999Z'},
    secondTop:{count:2,asOf:'2021-11-10T23:59:59.999Z'},
    comparison:{crowdingShift:'MORE_POSITIVE_AT_SECOND_TOP'},
    cutoffPolicy:'RESOLVED_CHECKPOINT_DATE'
  };
  const archive={
    firstTop:{date:'2021-04-14',status:'OK',summary:{globalLongShort:0.9,takerLongShortVolume:0.9}},
    secondTop:{date:'2021-11-10',status:'OK',summary:{globalLongShort:1.2,takerLongShortVolume:1.1}},
    deltas:{globalLongShort:0.3,takerLongShortVolume:0.2,sumOpenInterest:100},gaps:[]
  };
  const macro={series:[
    {key:'DOLLAR',status:'COMPARABLE',delta:2.5,secondTop:{date:'2021-11-09',value:114}},
    {key:'FIN_CONDITIONS',status:'COMPARABLE',delta:0.2,secondTop:{date:'2021-11-05',value:-0.35}},
    {key:'FUTURE_MACRO',status:'COMPARABLE',delta:99,secondTop:{date:'2021-11-20',value:999}}
  ]};

  const run=M24Backtest.run({caseSchema,labResult:baseLab,meaningContext:meaning,derivativesContext:derivatives,archiveDerivativesContext:archive,macroContext:macro});
  check(run.snapshot.asOf.startsWith('2021-11-10'),'default decision cutoff must be resolved second-top date, not window end');
  check(!('support' in run.snapshot)&&!('outcome' in run.snapshot),'future outcome container leaked into decision snapshot');
  check(run.snapshot.meaning.count===1&&run.snapshot.meaning.sourceIds[0]==='a','post-top meaning source leaked into snapshot');
  check(!(run.snapshot.macro||[]).some(x=>x.key==='FUTURE_MACRO'),'post-top macro source leaked into snapshot');
  check(run.snapshot.coverage.funding===true&&run.snapshot.coverage.archiveDerivatives===true,'verified source-backed derivatives should be admitted');
  check(run.candidate.action==='DOWNSIDE_WATCH','expected historical downside watch candidate');
  check(!run.candidate.evidence.some(x=>x.id==='WEAK_RSI'),'rejected RSI divergence must not be scored');
  check(run.outcome.supportBreakAfterDecision===true,'later support break should be outcome-only scoring data');

  const altered=structuredClone(baseLab);altered.outcome={troughDate:'2099-01-01',drawdownFromSecondHighPct:999};altered.support={firstCloseBelow:'2098-01-01'};
  const run2=M24Backtest.run({caseSchema,labResult:altered,meaningContext:meaning,derivativesContext:derivatives,archiveDerivativesContext:archive,macroContext:macro});
  check(JSON.stringify(run.snapshot)===JSON.stringify(run2.snapshot),'changing future outcome must not change decision snapshot');
  check(JSON.stringify(run.candidate)===JSON.stringify(run2.candidate),'changing future outcome must not change candidate');

  const unverifiableFunding={firstTop:{count:2},secondTop:{count:2},comparison:{crowdingShift:'MORE_POSITIVE_AT_SECOND_TOP'}};
  const run3=M24Backtest.run({caseSchema,labResult:baseLab,meaningContext:meaning,derivativesContext:unverifiableFunding,archiveDerivativesContext:archive,macroContext:macro});
  check(run3.snapshot.coverage.funding===false,'unverifiable aggregated funding must be rejected');
  check(run3.snapshot.rejectedUnverifiableAggregates.funding===true,'rejected funding aggregate must be visible');

  const limitedArchive={firstTop:{date:'2021-04-14',status:'SOURCE_GAP',summary:null},secondTop:{date:'2021-11-10',status:'SOURCE_GAP',summary:null},deltas:{},gaps:[{reason:'ARCHIVE_DAY_MISSING'}]};
  const run4=M24Backtest.run({caseSchema,labResult:baseLab,meaningContext:meaning,derivativesContext:derivatives,archiveDerivativesContext:limitedArchive,macroContext:macro});
  check(run4.snapshot.coverage.archiveDerivatives===false,'source-gap archive object must not inflate coverage');
  check(run4.snapshot.archiveDerivatives===null,'source-gap archive must not enter decision evidence');
  check(run4.snapshot.rejectedUnverifiableAggregates.archiveDerivatives===true,'archive rejection must remain visible');
  check(run4.candidate.coverage===0.8,'core-only decision coverage should be 4/5');

  const sparse=M24Backtest.run({caseSchema,labResult:baseLab});
  check(sparse.candidate.action==='INSUFFICIENT_CONTEXT','sparse context must not become a directional candidate');
  console.log('M24 no-lookahead backtest test OK',JSON.stringify({asOf:run.snapshot.asOf,action:run.candidate.action,extendedCoverage:run.candidate.coverage,coreCoverage:run4.candidate.coverage,sparse:sparse.candidate.action}));
})();
`;
try{vm.runInThisContext(`${source}\n${test}`,{filename:'m24-backtest-test-bundle.js'})}catch(err){console.error(err);process.exit(1)}
