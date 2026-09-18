const fs=require('fs'),vm=require('vm');
globalThis.__m24fs=fs;
const files=['m24-fred-market.js','m24-macro.js','m24-relations.js'];
const source=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const start='2020-01-02T00:00:00Z',end='2020-04-30T23:59:59Z';
 const market=new M24FredMarket.FredMarketProvider();
 const macro=new M24Macro.FredCsvProvider();
 const spx=await market.getBarsForAsset('SPX',{start,end});
 const bundle=await macro.fetchBundle(['VIX','DOLLAR','WTI','TEN_YEAR'],{start,end});
 const left=spx.bars.map(x=>({date:x.date,value:x.close}));
 const defs=[
   ['VIX','RETURN_PCT'],['DOLLAR','RETURN_PCT'],['WTI','RETURN_PCT'],['TEN_YEAR','DELTA']
 ];
 const relations={};
 for(const [key,transform] of defs){
   const right=bundle.series[key].records.map(x=>({date:x.date,value:x.value}));
   relations[key]=M24Relations.discoverPair({
     leftId:'SPX',rightId:key,leftRecords:left,rightRecords:right,
     leftTransform:'RETURN_PCT',rightTransform:transform,maxLag:3,minObs:35,
     window:{from:'2020-01-02',to:'2020-04-30'},regime:'GLOBAL_MAR2020'
   });
   check(relations[key].state==='MEASURED_ASSOCIATION',key+' relation insufficient');
 }
 check(relations.VIX.contemporaneous.correlation<-0.4,'SPX/VIX inverse association unexpectedly weak');
 const snapshot={
   type:'M24_CROSS_ASSET_RELATION_SNAPSHOT',caseId:'GLOBAL-MAR2020',
   window:{from:'2020-01-02',to:'2020-04-30'},
   relations:Object.fromEntries(Object.entries(relations).map(([k,v])=>[k,{
     sampleSize:v.sampleSize,contemporaneous:v.contemporaneous,bestLag:v.bestLag,
     causalityStatus:v.causalityStatus
   }])),
   provenance:[...(spx.provenance||[]),...Object.values(bundle.series).flatMap(x=>x.provenance||[])],
   rule:'Measured relation discovery only. Correlation/lead-lag does not establish causality.'
 };
 globalThis.__m24fs.writeFileSync('m24-relations-mar2020-snapshot.json',JSON.stringify(snapshot,null,2));
 console.log('M24 real-source March 2020 relation E2E OK');
 console.log(JSON.stringify(snapshot));
})().catch(e=>{fs.writeFileSync('m24-relations-mar2020-snapshot.json',JSON.stringify({failure:{message:String(e?.message||e),stack:String(e?.stack||'')}},null,2));console.error(e);process.exit(1)});
`;
vm.runInThisContext(`${source}\n${test}`);
