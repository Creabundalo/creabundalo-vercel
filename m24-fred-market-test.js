const fs=require('fs');const vm=require('vm');
const source=fs.readFileSync('m24-fred-market.js','utf8');
const test=`
(async()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const csv='observation_date,NASDAQCOM\\n2000-03-09,5046.86\\n2000-03-10,5048.62\\n2000-03-13,4907.24\\n';
 const provider=new M24FredMarket.FredMarketProvider({fetchImpl:async()=>({ok:true,text:async()=>csv}),nowFn:()=>Date.parse('2026-09-18T00:00:00Z')});
 const r=await provider.getBarsForAsset('NASDAQ',{start:'2000-03-09T00:00:00Z',end:'2000-03-14T00:00:00Z'});
 check(r.bars.length===3,'expected three close observations');
 check(r.bars[1].close===5048.62,'close parse mismatch');
 check(!('high' in r.bars[1])&&!('volume' in r.bars[1]),'provider must not synthesize OHLC/volume');
 check(r.priceBasis==='CLOSE_ONLY','price basis missing');
 console.log('M24 FRED market provider contract OK');
})().catch(e=>{console.error(e);process.exit(1)});
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-fred-market-test-bundle.js'});