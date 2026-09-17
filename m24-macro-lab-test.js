const fs=require('fs');
const vm=require('vm');

const source=['m24-macro.js','m24-macro-lab.js'].map(file=>fs.readFileSync(file,'utf8')).join('\n');
const test=`
(async()=>{
  const check=(condition,message)=>{if(!condition) throw new Error(message)};
  const mk=(key,id,label,family,frequency,first,second,source='TEST')=>({key,meta:{id,label,family,units:'x',frequency,source,higherMeaning:'HIGHER_TEST'},records:first?[{date:'2021-04-14',time:Date.parse('2021-04-14T00:00:00Z'),value:first},{date:'2021-11-09',time:Date.parse('2021-11-09T00:00:00Z'),value:second}]:[],provenance:[{sourceId:'TEST-'+id}]});
  const provider={fetchBundle:async()=>({series:{
    FED_FUNDS:mk('FED_FUNDS','EFFR','Fed funds','RATES','daily',0.07,0.08),
    DOLLAR:mk('DOLLAR','DTWEXBGS','Dollar','FX','daily',112,114.5),
    WTI:mk('WTI','DCOILWTICO','WTI','COMMODITY','daily',63.15,84.15),
    FIN_CONDITIONS:mk('FIN_CONDITIONS','NFCI','NFCI','CREDIT','weekly',null,null)
  }})};
  const caseSchema={id:'BTC-2021-2022-TOP-MARKDOWN',asset:'BTC',window:{from:'2021-01-01',to:'2022-06-30'}};
  const labResult={caseId:caseSchema.id,firstTop:{date:'2021-04-14'},secondTop:{date:'2021-11-09'}};
  const result=await M24MacroLab.runCase({provider,caseSchema,labResult,keys:['FED_FUNDS','DOLLAR','WTI','FIN_CONDITIONS']});
  check(result.context.series.length===4,'macro Lab context incomplete');
  check(result.context.gaps.length===1&&result.context.gaps[0].seriesId==='NFCI','macro missing series must become explicit gap');
  const payloads=M24MacroLab.toRecordPayloads(result);
  check(payloads[0].type==='MACRO_CROSS_ASSET_CONTEXT','macro Qubus payload missing');
  check(payloads.some(x=>x.type==='SOURCE_GAP'),'macro source gap payload missing');
  check(payloads[0].provenance.length===4,'macro provenance should survive binding');
  console.log('M24 macro Lab test OK',JSON.stringify({series:result.context.series.length,gaps:result.context.gaps.length,payloads:payloads.map(x=>x.type)}));
})()
`;

(async()=>{
  await vm.runInThisContext(`${source}\n${test}`,{filename:'m24-macro-lab-test-bundle.js'});
})().catch(err=>{console.error(err);process.exit(1)});
