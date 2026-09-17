const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('m24-macro.js','utf8');
const test=`
(async()=>{
  const check=(condition,message)=>{if(!condition) throw new Error(message)};
  const calls=[];
  const fakeFetch=async url=>{
    calls.push(url);
    const parsed=new URL(url);
    const id=parsed.searchParams.get('id');
    const rows={
      EFFR:['2021-04-14,0.07','2021-11-09,0.08'],
      DGS10:['2021-04-14,1.63','2021-11-09,1.49'],
      DTWEXBGS:['2021-04-14,112.0','2021-11-09,114.5'],
      RRPONTSYD:['2021-04-14,0.2','2021-11-09,1045.0'],
      WALCL:['2021-04-14,7793000','2021-11-03,8574000'],
      NFCI:['2021-04-09,-0.55','2021-11-05,-0.35'],
      DCOILWTICO:['2021-04-14,63.15','2021-11-09,84.15']
    }[id];
    if(!rows) return {ok:false,status:404,text:async()=>''};
    return {ok:true,status:200,text:async()=>('DATE,'+id+'\\n'+rows.join('\\n')+'\\n2021-11-10,.')};
  };
  const provider=new M24Macro.FredCsvProvider({fetchImpl:fakeFetch,nowFn:()=>Date.parse('2026-09-17T20:00:00Z')});
  const keys=['FED_FUNDS','TEN_YEAR','DOLLAR','RRP','FED_ASSETS','FIN_CONDITIONS','WTI'];
  const bundle=await provider.fetchBundle(keys,{start:'2021-01-01T00:00:00Z',end:'2021-12-31T23:59:59Z'});
  check(Object.keys(bundle.series).length===7,'macro bundle incomplete');
  check(bundle.series.FED_FUNDS.records.length===2,'missing values must be dropped rather than coerced');
  check(bundle.series.FED_FUNDS.provenance[0].upstreamSource==='Federal Reserve Bank of New York','upstream source provenance missing');
  check(calls.every(x=>x.includes('cosd=2021-01-01')&&x.includes('coed=2021-12-31')),'FRED range parameters missing');

  const lab={caseId:'BTC-2021-2022-TOP-MARKDOWN',firstTop:{date:'2021-04-14'},secondTop:{date:'2021-11-09'}};
  const context=M24Macro.analyzeBundleAtCheckpoints(bundle,lab);
  check(context.series.length===7,'macro checkpoint comparison incomplete');
  check(context.series.find(x=>x.key==='DOLLAR').delta===2.5,'dollar delta incorrect');
  check(context.series.find(x=>x.key==='FIN_CONDITIONS').status==='COMPARABLE','weekly nearest observation should resolve');
  check(context.gaps.length===0,'unexpected macro source gaps');

  const parsed=M24Macro.parseFredCsv('observation_date,EFFR\\n2021-01-01,0.09\\n2021-01-02,.','EFFR');
  check(parsed.length===1&&parsed[0].value===0.09,'observation_date header/missing value parsing failed');

  let rejected=false;
  try{await provider.fetchSeries('NOPE',{start:'2021-01-01',end:'2021-02-01'})}catch(err){rejected=err.code==='UNKNOWN_SERIES'}
  check(rejected,'unknown macro series must be rejected');
  console.log('M24 macro provider test OK',JSON.stringify({series:context.series.length,dollarDelta:context.series.find(x=>x.key==='DOLLAR').delta}));
})()
`;

(async()=>{
  await vm.runInThisContext(`${source}\n${test}`,{filename:'m24-macro-test-bundle.js'});
})().catch(err=>{console.error(err);process.exit(1)});
