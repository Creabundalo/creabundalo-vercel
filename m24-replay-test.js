const fs=require('fs');
const vm=require('vm');
const source=['m24-core.js','m24-replay.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
  const check=(condition,message)=>{if(!condition)throw new Error(message)};
  const caseSchema={id:'BTC-2021-2022-TOP-MARKDOWN',asset:'BTC'};
  const snapshot={
    type:'VERIFIED_SOURCE_SNAPSHOT',caseId:caseSchema.id,asset:'BTC',coverageProfile:'EXTENDED_DERIVATIVES',calibrationEligible:true,
    verification:{sourceComplete:true,workflowRunId:1,artifactDigest:'sha256:test'},
    resolvedCheckpoints:{decisionAsOf:'2021-11-10T23:59:59.999Z'},
    actionCandidate:{action:'DOWNSIDE_WATCH'}
  };
  const closes={'2021-11-10':100,'2021-11-13':95,'2021-11-24':90,'2021-12-10':80,'2022-01-09':70};
  const bars=[];
  for(let t=new Date('2021-11-10T00:00:00Z').getTime();t<=new Date('2022-01-15T00:00:00Z').getTime();t+=86400000){
    const date=new Date(t).toISOString().slice(0,10);let close=99;
    if(closes[date]!=null) close=closes[date];
    bars.push({date,time:Math.floor(t/1000),open:close,high:close,low:close,close,volume:1});
  }
  const provider={getBarsForAsset:async()=>({bars,provenance:[{sourceId:'TEST-PRICE'}]})};
  const result=await M24Replay.run({snapshot,caseSchema,priceProvider:provider});
  check(result.pairs.length===4,'expected four horizon samples');
  check(result.direction==='DOWN','expected downside replay direction');
  check(result.pairs.every(x=>x.forecast.data.direction==='DOWN'),'forecast direction mismatch');
  check(result.pairs.every(x=>x.forecast.data.conditions.coverageProfile==='EXTENDED_DERIVATIVES'),'coverage profile must propagate into every replay forecast');
  check(result.pairs.every(x=>x.outcome.data.directionCorrect===true),'all synthetic outcomes should be direction-correct');
  check(result.pairs.map(x=>x.horizon).join(',')==='3D,2W,1M,2M','unexpected horizon order');
  const store=new M24Core.QubusStore();M24Replay.addToStore(store,result);
  check(store.list('FORECAST_INSTANCE').length===4&&store.list('OUTCOME_INSTANCE').length===4,'replay records not stored');
  const invalid={...snapshot,verification:{...snapshot.verification,sourceComplete:false}};
  let rejected=false;try{await M24Replay.run({snapshot:invalid,caseSchema,priceProvider:provider})}catch(err){rejected=true}
  check(rejected,'unverified snapshot must be rejected');
  console.log('M24 replay test OK',JSON.stringify({samples:result.pairs.length,direction:result.direction}));
})().catch(err=>{console.error(err);process.exit(1)});
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-replay-test-bundle.js'});
