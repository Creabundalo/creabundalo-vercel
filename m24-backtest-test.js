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
    {id:'future',publishedAt:'2021-12-10T10:00:00Z',direction:-1,frames:['FUTURE_FRAME']}
  ]};
  const derivatives={firstTop:{count:2},secondTop:{count:2},comparison:{crowdingShift:'MORE_POSITIVE_AT_SECOND_TOP'}};
  const archive={firstTop:{date:'2021-04-14',summary:{globalLongShort:0.9,takerLongShortVolume:0.9}},secondTop:{date:'2021-11-10',summary:{globalLongShort:1.2,takerLongShortVolume:1.1}},deltas:{globalLongShort:0.3,takerLongShortVolume:0.2,sumOpenInterest:100}};
  const macro={series:[{key:'DOLLAR',status:'COMPARABLE',delta:2.5,secondTop:{date:'2021-11-09',value:114}},{key:'FIN_CONDITIONS',status:'COMPARABLE',delta:0.2,secondTop:{date:'2021-11-05',value:-0.35}}]};

  const run=M24Backtest.run({caseSchema,labResult:baseLab,meaningContext:meaning,derivativesContext:derivatives,archiveDerivativesContext:archive,macroContext:macro});
  const snapshotJson=JSON.stringify(run.snapshot);
  check(!snapshotJson.includes('troughDate')&&!snapshotJson.includes('drawdownFromSecondHighPct')&&!snapshotJson.includes('firstCloseBelow'),'future outcome leaked into decision snapshot');
  check(run.snapshot.meaning.count===1&&!run.snapshot.meaning.sourceIds.includes('future'),'future meaning source leaked into snapshot');
  check(run.candidate.action==='DOWNSIDE_WATCH','expected historical downside watch candidate');
  check(!run.candidate.evidence.some(x=>x.id==='WEAK_RSI'),'rejected RSI divergence must not be scored');
  check(run.outcome.supportBreakAfterDecision===true,'later support break should be outcome-only scoring data');

  const altered=structuredClone(baseLab);altered.outcome={troughDate:'2099-01-01',drawdownFromSecondHighPct:999};altered.support={firstCloseBelow:'2098-01-01'};
  const run2=M24Backtest.run({caseSchema,labResult:altered,meaningContext:meaning,derivativesContext:derivatives,archiveDerivativesContext:archive,macroContext:macro});
  check(JSON.stringify(run.snapshot)===JSON.stringify(run2.snapshot),'changing future outcome must not change decision snapshot');
  check(JSON.stringify(run.candidate)===JSON.stringify(run2.candidate),'changing future outcome must not change candidate');
  check(run.outcome.drawdownFromSecondHighPct!==run2.outcome.drawdownFromSecondHighPct,'outcome test fixture must actually differ');

  const sparse=M24Backtest.run({caseSchema,labResult:baseLab});
  check(sparse.candidate.action==='INSUFFICIENT_CONTEXT','sparse context must not become a directional candidate');
  console.log('M24 no-lookahead backtest test OK',JSON.stringify({action:run.candidate.action,score:run.candidate.score,coverage:run.candidate.coverage,sparse:sparse.candidate.action}));
})();
`;
try{vm.runInThisContext(`${source}\n${test}`,{filename:'m24-backtest-test-bundle.js'})}catch(err){console.error(err);process.exit(1)}
