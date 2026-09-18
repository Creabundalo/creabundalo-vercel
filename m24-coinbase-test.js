const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('m24-coinbase.js','utf8');
const test=`
(async()=>{
  const check=(condition,message)=>{if(!condition) throw new Error(message)};
  const calls=[];
  const day=86400;
  const fakeFetch=async url=>{
    calls.push(url);
    const parsed=new URL(url);
    const start=Math.floor(new Date(parsed.searchParams.get('start')).getTime()/1000);
    const end=Math.floor(new Date(parsed.searchParams.get('end')).getTime()/1000);
    return {
      ok:true,status:200,
      json:async()=>[
        [Math.min(start+day,end),90,110,100,105,12],
        [start,80,100,90,95,10]
      ]
    };
  };
  const provider=new M24Coinbase.CoinbaseHistoricalProvider({fetchImpl:fakeFetch});
  const result=await provider.getBarsForAsset('BTC',{start:'2021-01-01T00:00:00Z',end:'2022-02-05T00:00:00Z',granularity:86400});
  check(calls.length===2,'range larger than 300 daily candles must be chunked');
  check(calls.every(url=>url.includes('granularity=86400')),'daily granularity missing');
  check(result.productId==='BTC-USD','BTC product mapping failed');
  check(result.provenance[0].quality==='PRIMARY_EXCHANGE','primary source provenance missing');
  check(result.bars.length===4,'unexpected normalized bar count');
  check(result.bars[0].time<result.bars.at(-1).time,'bars must be ascending');
  check(result.bars[0].open===90 && result.bars[0].close===95,'Coinbase candle field mapping is wrong');
  let rejected=false;
  try{await provider.fetchBars({productId:'BTC-USD',start:'2021-01-01',end:'2021-01-02',granularity:123})}catch{rejected=true}
  check(rejected,'invalid Coinbase granularity must be rejected');
  console.log('M24 Coinbase adapter test OK',JSON.stringify({calls:calls.length,bars:result.bars.length,source:result.provenance[0].sourceType}));
})()
`;

(async()=>{
  await vm.runInThisContext(`${source}\n${test}`,{filename:'m24-coinbase-test-bundle.js'});
})().catch(err=>{console.error(err);process.exit(1)});
