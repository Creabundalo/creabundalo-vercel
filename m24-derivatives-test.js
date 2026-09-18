const fs=require('fs');
const vm=require('vm');

const source=['m24-cases.js','m24-derivatives.js'].map(file=>fs.readFileSync(file,'utf8')).join('\n');
const test=`
(async()=>{
  const check=(condition,message)=>{if(!condition) throw new Error(message)};
  const calls=[];
  let fundingPage=0;
  const now=Date.parse('2026-09-17T20:00:00Z');
  const fakeFetch=async url=>{
    calls.push(url);
    const parsed=new URL(url);
    if(parsed.pathname==='/fapi/v1/fundingRate'){
      fundingPage+=1;
      const start=Number(parsed.searchParams.get('startTime'));
      const n=fundingPage===1?1000:4;
      return {ok:true,status:200,json:async()=>Array.from({length:n},(_,i)=>({
        symbol:'BTCUSDT',fundingTime:start+(i*8*3600*1000),fundingRate:String(i%2===0?0.0001:0.0002),markPrice:'60000',rateType:'Regular'
      }))};
    }
    if(parsed.pathname==='/futures/data/openInterestHist'){
      return {ok:true,status:200,json:async()=>[
        {symbol:'BTCUSDT',sumOpenInterest:'100000',sumOpenInterestValue:'6000000000',timestamp:Date.parse('2026-09-10T00:00:00Z')},
        {symbol:'BTCUSDT',sumOpenInterest:'110000',sumOpenInterestValue:'6500000000',timestamp:Date.parse('2026-09-11T00:00:00Z')}
      ]};
    }
    throw new Error('Unexpected URL '+url);
  };

  const provider=new M24Derivatives.BinanceDerivativesProvider({fetchImpl:fakeFetch,nowFn:()=>now});
  const funding=await provider.fetchFundingHistory({asset:'BTC',start:'2021-01-01T00:00:00Z',end:'2022-01-01T00:00:00Z'});
  check(funding.symbol==='BTCUSDT','BTC derivatives mapping failed');
  check(calls.filter(x=>x.includes('/fapi/v1/fundingRate')).length===2,'funding history must paginate after 1000 rows');
  check(funding.records.length===1004,'unexpected normalized funding count');
  check(funding.provenance[0].quality==='PRIMARY_EXCHANGE_DERIVATIVES','funding provenance missing');
  check(funding.records[0].rateType==='Regular','2026 funding rate type field should be preserved');

  const oi=await provider.fetchOpenInterestRecent({asset:'BTC',start:'2026-09-01T00:00:00Z',end:'2026-09-12T00:00:00Z',period:'1d'});
  check(oi.records.length===2,'recent open interest normalization failed');
  check(oi.records[1].sumOpenInterest===110000,'open interest numeric mapping failed');

  let gap=null;
  try{await provider.fetchOpenInterestRecent({asset:'BTC',start:'2021-11-01T00:00:00Z',end:'2021-11-30T00:00:00Z',period:'1d'})}catch(err){gap=err}
  check(gap&&gap.code==='HISTORY_WINDOW_EXCEEDED','old open interest must become an explicit source-gap error');
  check(gap.detail.recommendedSource==='BINANCE_VISION_METRICS','historical OI must point to archive source');
  check(provider.metricsArchiveUrl('BTC','2021-11-08')==='https://data.binance.vision/data/futures/um/daily/metrics/BTCUSDT/BTCUSDT-metrics-2021-11-08.zip','metrics archive URL wrong');
  check(provider.fundingArchiveUrl('BTC','2021-11')==='https://data.binance.vision/data/futures/um/monthly/fundingRate/BTCUSDT/BTCUSDT-fundingRate-2021-11.zip','funding archive URL wrong');

  const caseDef=M24Cases.get('BTC-2021-2022-TOP-MARKDOWN');
  const synthetic=[
    {fundingTime:Date.parse('2021-04-10T00:00:00Z'),fundingRate:0.00005},
    {fundingTime:Date.parse('2021-04-20T00:00:00Z'),fundingRate:0.00008},
    {fundingTime:Date.parse('2021-10-20T00:00:00Z'),fundingRate:0.00020},
    {fundingTime:Date.parse('2021-11-10T00:00:00Z'),fundingRate:0.00025}
  ];
  const context=M24Derivatives.analyzeFundingAroundCase(synthetic,caseDef);
  check(context.firstTop.count===2&&context.secondTop.count===2,'funding windows should resolve semantically from the case');
  check(context.comparison.crowdingShift==='MORE_POSITIVE_AT_SECOND_TOP','funding comparison should detect more-positive second-top context');
  check(context.interpretation.includes('not proof'),'funding interpretation must preserve evidence discipline');

  console.log('M24 derivatives adapter test OK',JSON.stringify({fundingRows:funding.records.length,oiRows:oi.records.length,gap:gap.code,crowding:context.comparison.crowdingShift}));
})()
`;

(async()=>{
  await vm.runInThisContext(`${source}\n${test}`,{filename:'m24-derivatives-test-bundle.js'});
})().catch(err=>{console.error(err);process.exit(1)});
