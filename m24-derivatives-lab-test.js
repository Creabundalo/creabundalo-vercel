const fs=require('fs');
const vm=require('vm');

const source=['m24-cases.js','m24-derivatives.js','m24-derivatives-lab.js'].map(file=>fs.readFileSync(file,'utf8')).join('\n');
const test=`
(async()=>{
  const check=(condition,message)=>{if(!condition) throw new Error(message)};
  const fakeProvider={
    fetchFundingHistory:async()=>({
      records:[
        {fundingTime:Date.parse('2021-04-10T00:00:00Z'),fundingRate:0.00005},
        {fundingTime:Date.parse('2021-04-20T00:00:00Z'),fundingRate:0.00090},
        {fundingTime:Date.parse('2021-10-20T00:00:00Z'),fundingRate:0.00020},
        {fundingTime:Date.parse('2021-11-10T00:00:00Z'),fundingRate:0.00025},
        {fundingTime:Date.parse('2021-11-20T00:00:00Z'),fundingRate:-0.00500}
      ],
      provenance:[{sourceId:'TEST-FUNDING',quality:'PRIMARY_EXCHANGE_DERIVATIVES'}]
    }),
    fetchOpenInterestRecent:async()=>{throw new M24Derivatives.DerivativesSourceError('HISTORY_WINDOW_EXCEEDED','recent only',{retentionDays:30,recommendedSource:'BINANCE_VISION_METRICS',archiveExample:'https://example/metrics.zip'})}
  };
  const caseSchema=M24Cases.get('BTC-2021-2022-TOP-MARKDOWN');
  const labResult={firstTop:{date:'2021-04-14'},secondTop:{date:'2021-11-10'}};
  const result=await M24DerivativesLab.runCase({provider:fakeProvider,caseSchema,labResult});
  check(result.fundingContext.comparison.crowdingShift==='MORE_POSITIVE_AT_SECOND_TOP','funding context missing or post-top data leaked');
  check(result.fundingContext.firstTop.count===1,'funding after resolved first top leaked into first checkpoint');
  check(result.fundingContext.secondTop.count===2,'funding after resolved second top leaked into second checkpoint');
  check(result.fundingContext.firstTop.asOf.startsWith('2021-04-14'),'first-top cutoff missing');
  check(result.fundingContext.secondTop.asOf.startsWith('2021-11-10'),'second-top cutoff missing');
  check(result.fundingContext.cutoffPolicy==='RESOLVED_CHECKPOINT_DATE','cutoff policy not recorded');
  check(result.openInterestGap?.type==='SOURCE_GAP','historical OI gap should be first-class data');
  check(result.openInterestGap.interpretation.includes('not a zero'),'source gap must not become a zero value');
  const payloads=M24DerivativesLab.toRecordPayloads(result);
  check(payloads.length===2,'expected derivatives context + source gap record');
  check(payloads[0].type==='DERIVATIVES_CONTEXT','derivatives Qubus payload missing');
  check(payloads[1].type==='SOURCE_GAP','source gap Qubus payload missing');
  check(payloads[0].provenance[0].sourceId==='TEST-FUNDING','derivatives provenance must survive binding');
  console.log('M24 derivatives Lab test OK',JSON.stringify({records:payloads.map(x=>x.type),crowding:result.fundingContext.comparison.crowdingShift,secondTopCount:result.fundingContext.secondTop.count}));
})()
`;

(async()=>{
  await vm.runInThisContext(`${source}\n${test}`,{filename:'m24-derivatives-lab-test-bundle.js'});
})().catch(err=>{console.error(err);process.exit(1)});
