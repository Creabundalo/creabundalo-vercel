const fs=require('fs');
const vm=require('vm');
const source=['m24-derivatives.js','m24-funding-archive.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
  const check=(condition,message)=>{if(!condition)throw new Error(message)};
  const csv='calc_time,funding_interval_hours,last_funding_rate\\n1617235200000,8,0.00010\\n1617264000000,8,-0.00005\\n';
  const parsed=M24FundingArchive.parseFundingCsv(csv,'BTCUSDT');
  check(parsed.length===2,'expected two funding rows');
  check(parsed[0].fundingTime===1617235200000,'funding time parse failed');
  check(parsed[1].fundingRate===-0.00005,'funding rate parse failed');
  check(JSON.stringify(M24FundingArchive.monthsBetween('2021-04-01','2021-06-01'))===JSON.stringify(['2021-04','2021-05','2021-06']),'month enumeration failed');

  const tools={
    sha256Hex:async()=> 'a'.repeat(64),
    checksumHash:()=> 'a'.repeat(64),
    unzipCsvEntries:async()=>[{name:'funding.csv',text:csv}]
  };
  const fetchImpl=async url=>({
    ok:true,status:200,
    arrayBuffer:async()=>new ArrayBuffer(8),
    text:async()=> 'a'.repeat(64)+'  file.zip'
  });
  const provider=new M24FundingArchive.BinanceVisionFundingProvider({fetchImpl,archiveTools:tools,nowFn:()=>0});
  const result=await provider.fetchFundingHistory({asset:'BTC',start:'2021-04-01T00:00:00Z',end:'2021-04-30T23:59:59Z'});
  check(result.records.length===2,'archive provider did not return funding rows');
  check(result.sourceMode==='BINANCE_VISION_MONTHLY_FUNDING','wrong historical funding source mode');
  check(result.gaps.length===0,'unexpected archive gap');

  let recentCalls=0;
  const composite=new M24FundingArchive.BinanceHistoricalDerivativesProvider({
    fundingProvider:provider,
    recentProvider:{fetchOpenInterestRecent:async()=>{recentCalls+=1;throw Object.assign(new Error('old range'),{code:'HISTORY_WINDOW_EXCEEDED'})},capabilities:()=>({openInterestRecent:{historical:'RECENT_ONLY'}})}
  });
  const hist=await composite.fetchFundingHistory({asset:'BTC',start:'2021-04-01T00:00:00Z',end:'2021-04-30T23:59:59Z'});
  check(hist.sourceMode==='BINANCE_VISION_MONTHLY_FUNDING','composite must route funding to archive');
  try{await composite.fetchOpenInterestRecent({asset:'BTC',start:'2021-04-01',end:'2021-04-02'})}catch(err){check(err.code==='HISTORY_WINDOW_EXCEEDED','recent OI error should pass through')}
  check(recentCalls===1,'recent OI provider not called');
  console.log('M24 funding archive test OK',JSON.stringify({rows:result.records.length,sourceMode:result.sourceMode}));
})().catch(err=>{console.error(err);process.exit(1)});
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-funding-archive-test-bundle.js'});
