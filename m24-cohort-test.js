const fs=require('fs');
const vm=require('vm');

const source=['m24-cases.js','m24-lab.js','m24-primary-lab.js','m24-index-lab.js','m24-housing-lab.js','m24-cross-asset-lab.js','m24-cohort.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
  const check=(condition,message)=>{if(!condition) throw new Error(message)};
  const dayMs=86400000;
  const buildBars=(start,end)=>{
    const s=new Date(start).getTime(),e=new Date(end).getTime(),bars=[];
    for(let t=s,i=0;t<=e;t+=dayMs,i++){
      const date=new Date(t).toISOString().slice(0,10);
      const base=100+(i*0.03)+Math.sin(i/10)*3;
      bars.push({time:Math.floor(t/1000),date,open:base,high:base+2,low:base-2,close:base+0.5,volume:1000+(i%17)*10});
    }
    return bars;
  };
  const shapeCase=(bars,schema)=>{
    const find=window=>bars.filter(b=>b.date>=window.from&&b.date<=window.to);
    const first=find(schema.checkpointWindows.firstTop);const reaction=find(schema.checkpointWindows.automaticReaction);const support=find(schema.checkpointWindows.supportReference);const second=find(schema.checkpointWindows.secondTop);const outcome=find(schema.checkpointWindows.markdownOutcome);
    const mid=a=>a[Math.floor(a.length/2)];
    if(schema.analysis==='TOP_MARKDOWN_CLOSE_ONLY'){
      mid(first).close=200;
      mid(reaction).close=120;
      mid(support).close=120;
      mid(second).close=190;
      mid(outcome).close=70;
    }else{
      mid(first).high=200;mid(first).close=190;mid(first).volume=2000;
      mid(reaction).low=120;mid(reaction).close=125;
      mid(support).low=130;mid(support).close=135;
      mid(second).high=210;mid(second).close=205;mid(second).volume=1000;
      mid(outcome).low=70;mid(outcome).close=75;
    }
    const secondDate=mid(second).date;
    const breakBar=bars.find(b=>b.date>secondDate&&b.date<=schema.checkpointWindows.markdownOutcome.to);
    if(breakBar){breakBar.close=100;if(schema.analysis!=='TOP_MARKDOWN_CLOSE_ONLY')breakBar.low=95;}
    return bars;
  };
  const fakeProvider={getBarsForAsset:async(asset,{start,end})=>{
    const schema=M24Cases.list().find(x=>x.asset===asset&&start.startsWith(x.window.from)&&end.startsWith(x.window.to));
    if(!schema) throw new Error('schema not found for '+asset+' '+start);
    return {asset,bars:shapeCase(buildBars(start,end),schema),provenance:[{sourceId:'TEST-'+schema.id,quality:'TEST'}]};
  }};
  const fakeHousingProvider={fetchMonthly:async({from,end,to})=>{
    const rows=[
      {date:'2021-11-01',publishedAt:'2021-12-28',priceIndex:124,yoyPct:20.1,transactions:18000,transactionYoYPct:-13},
      {date:'2022-01-01',publishedAt:'2022-02-28',priceIndex:127.4,yoyPct:21.1,transactions:14000,transactionYoYPct:-42.7},
      {date:'2022-04-01',publishedAt:'2022-05-28',priceIndex:130.7,yoyPct:19.7,transactions:16000,transactionYoYPct:-15.7},
      {date:'2022-07-01',publishedAt:'2022-08-28',priceIndex:132.9,yoyPct:14.5,transactions:16417,transactionYoYPct:-13.8},
      {date:'2022-12-01',publishedAt:'2023-01-28',priceIndex:126.5,yoyPct:2.7,transactions:15000,transactionYoYPct:-6},
      {date:'2023-05-01',publishedAt:'2023-06-28',priceIndex:124.6,yoyPct:-5.8,transactions:16000,transactionYoYPct:5}
    ];
    return {rows,provenance:[{sourceId:'TEST-CBS-HOUSING',quality:'TEST'}]};
  }};
  const result=await M24Cohort.run({
    provider:fakeProvider,
    providers:{CBS_KADASTER_HOUSING:fakeHousingProvider},
    labs:{TOP_MARKDOWN_CLOSE_ONLY:M24IndexLab,HOUSING_CYCLE:M24HousingLab,CROSS_ASSET_SHOCK:M24CrossAssetLab},
    caseSchemas:M24Cases.list(),
    granularity:86400
  });
  check(result.total>=5,'expected expanded registered case set');
  check(result.measured===result.total,'all test cases should be measured');
  check(result.sourceErrors===0,'unexpected cohort source error');
  check(result.calibrationEligible===0,'price-only cases must not count as calibration samples');
  check(result.cases.every(x=>x.status==='MEASURED_PRICE_LAYER'),'wrong case status');
  check(result.cases.every(x=>x.missingLayers.includes('MEANING_WORLD')),'missing evidence layers should stay explicit');
  const assets=[...new Set(result.cases.map(x=>x.asset))].sort();
  check(['BTC','ETH','SOL','NASDAQ','NL_HOUSING','SPX'].every(x=>assets.includes(x)),'expected BTC/ETH/SOL/NASDAQ/NL_HOUSING/SPX case registry');
  console.log('M24 cohort test OK',JSON.stringify({total:result.total,measured:result.measured,eligible:result.calibrationEligible,assets}));
})()
`;
(async()=>{await vm.runInThisContext(`${source}\n${test}`,{filename:'m24-cohort-test-bundle.js'})})().catch(err=>{console.error(err);process.exit(1)});
