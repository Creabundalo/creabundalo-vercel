const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('m24-binance-vision-lab.js','utf8');
const test=`
(async()=>{
  const check=(condition,message)=>{if(!condition) throw new Error(message)};
  const firstSummary={count:1,sumOpenInterest:100,sumOpenInterestValue:5000,topTraderAccountLongShort:1.1,topTraderPositionLongShort:1.2,globalLongShort:0.95,takerLongShortVolume:0.9};
  const secondSummary={count:1,sumOpenInterest:140,sumOpenInterestValue:8000,topTraderAccountLongShort:1.3,topTraderPositionLongShort:1.5,globalLongShort:1.15,takerLongShortVolume:1.1};
  const provider={fetchDates:async(asset,dates)=>[
    {asset,date:dates[0],status:'OK',summary:firstSummary,provenance:[{sourceId:'ARCHIVE-A'}]},
    {asset,date:dates[1],status:'OK',summary:secondSummary,provenance:[{sourceId:'ARCHIVE-B'}]}
  ]};
  const caseSchema={id:'BTC-2021-2022-TOP-MARKDOWN',asset:'BTC'};
  const labResult={firstTop:{date:'2021-04-14'},secondTop:{date:'2021-11-10'}};
  const result=await M24BinanceVisionLab.runCase({provider,caseSchema,labResult});
  check(result.deltas.sumOpenInterest===40,'OI delta wrong');
  check(result.deltas.globalLongShort===0.2,'global long/short delta wrong');
  check(result.gaps.length===0,'unexpected archive gap');
  const payloads=M24BinanceVisionLab.toRecordPayloads(result);
  check(payloads.length===1&&payloads[0].type==='ARCHIVE_DERIVATIVES_CONTEXT','archive derivatives Qubus payload missing');
  check(payloads[0].provenance.length===2,'archive provenance must survive binding');

  const gapProvider={fetchDates:async(asset,dates)=>[
    {asset,date:dates[0],status:'OK',summary:firstSummary,provenance:[]},
    {asset,date:dates[1],status:'SOURCE_GAP',reason:'ARCHIVE_DAY_MISSING',url:'https://example/missing.zip'}
  ]};
  const gapResult=await M24BinanceVisionLab.runCase({provider:gapProvider,caseSchema,labResult});
  const gapPayloads=M24BinanceVisionLab.toRecordPayloads(gapResult);
  check(gapResult.gaps.length===1,'archive missing day must become explicit gap');
  check(gapPayloads.some(x=>x.type==='SOURCE_GAP'),'archive gap Qubus payload missing');
  console.log('M24 Binance Vision Lab test OK',JSON.stringify({oiDelta:result.deltas.sumOpenInterest,gaps:gapResult.gaps.length}));
})()
`;
(async()=>{await vm.runInThisContext(`${source}\n${test}`,{filename:'m24-binance-vision-lab-test-bundle.js'})})().catch(err=>{console.error(err);process.exit(1)});
