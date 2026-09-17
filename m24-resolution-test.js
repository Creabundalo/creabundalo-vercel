const fs=require('fs');
const vm=require('vm');

const source=['m24-cases.js','m24-historical.js','m24-lab.js','m24-primary-lab.js']
  .map(file=>fs.readFileSync(file,'utf8'))
  .join('\n');

const test=`
(async()=>{
  const check=(condition,message)=>{if(!condition) throw new Error(message)};
  const schema=M24Cases.get('BTC-2021-2022-TOP-MARKDOWN');
  const weekly={...structuredClone(M24Historical.btc2021Case),bars:structuredClone(M24Historical.btcWeeklyBars)};
  const baseline=M24Lab.analyzeTopMarkdown(weekly,schema);

  const daily=[];
  for(const week of M24Historical.btcWeeklyBars){
    const start=new Date(week.date+'T00:00:00Z');
    for(let offset=0;offset<7;offset++){
      const date=new Date(start.getTime()+offset*86400000).toISOString().slice(0,10);
      const peakDay=offset===2;
      daily.push({
        date,
        time:Math.floor(new Date(date+'T00:00:00Z').getTime()/1000),
        open:week.open,
        high:peakDay?week.high:Math.max(week.open,week.close)*0.999,
        low:peakDay?week.low:Math.min(week.open,week.close)*1.001,
        close:week.close,
        volume:week.volume/7
      });
    }
  }

  const fakeProvider={
    async getBarsForAsset(asset){
      return {asset,productId:'BTC-USD',resolutionSeconds:86400,bars:structuredClone(daily),provenance:[{sourceId:'FAKE-PRIMARY-DAILY',sourceType:'AUTHORITATIVE_EXCHANGE_API',quality:'PRIMARY_EXCHANGE'}]};
    }
  };
  const primary=await M24PrimaryLab.runBtcCase({provider:fakeProvider,caseSchema:schema,granularity:86400});
  const comparison=M24PrimaryLab.compare({baseline,primary:primary.result});

  check(primary.result.resolution==='D','primary case must be daily');
  check(primary.result.checkpointMode==='WINDOW_RESOLVED','daily case must use semantic windows');
  check(primary.result.firstTop.date>='2021-04-01'&&primary.result.firstTop.date<='2021-05-09','daily first top resolved outside window');
  check(primary.result.secondTop.date>='2021-10-01'&&primary.result.secondTop.date<='2021-11-30','daily second top resolved outside window');
  check(primary.result.support.referenceDate>='2021-09-01'&&primary.result.support.referenceDate<='2021-09-30','daily support resolved outside window');
  check(primary.result.provenance[0].quality==='PRIMARY_EXCHANGE','primary provenance lost');
  check(Math.abs(comparison.checkpointDateDeltaDays.firstTop)<=6,'first-top resolution drift too large');
  check(Math.abs(comparison.checkpointDateDeltaDays.secondTop)<=6,'second-top resolution drift too large');
  check(comparison.agreement.secondTop===true,'second-top structural verdict must agree');
  check(comparison.agreement.volumeDivergence===true,'volume-divergence verdict must agree in generated daily fixture');
  console.log('M24 resolution contract OK',JSON.stringify({baseline:baseline.checkpoints,primary:primary.result.checkpoints,comparison}));
})()
`;

(async()=>{
  await vm.runInThisContext(`${source}\n${test}`,{filename:'m24-resolution-test-bundle.js'});
})().catch(err=>{console.error(err);process.exit(1)});
