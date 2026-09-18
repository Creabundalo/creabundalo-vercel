const fs=require('fs'),vm=require('vm');
globalThis.__m24fs=fs;
const files=['m24-fred-market.js','m24-macro.js','m24-relations.js','m24-relation-stability.js'];
const source=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const market=new M24FredMarket.FredMarketProvider();
 const macro=new M24Macro.FredCsvProvider();
 const start='2020-01-02T00:00:00Z',end='2020-04-30T23:59:59Z';
 const spx=await market.getBarsForAsset('SPX',{start,end});
 const bundle=await macro.fetchBundle(['VIX','DOLLAR'],{start,end});
 const windows={
   PRE_SHOCK:{from:'2020-01-02',to:'2020-02-19'},
   STRESS:{from:'2020-02-20',to:'2020-03-23'},
   EARLY_RECOVERY:{from:'2020-03-24',to:'2020-04-30'}
 };
 const slice=(rows,w)=>rows.filter(x=>x.date>=w.from&&x.date<=w.to);
 const spxRows=spx.bars.map(x=>({date:x.date,value:x.close}));
 const out={};
 for(const key of ['VIX','DOLLAR']){
   const right=bundle.series[key].records.map(x=>({date:x.date,value:x.value}));
   const rel={};
   for(const [name,w] of Object.entries(windows)){
     rel[name]=M24Relations.discoverPair({
       leftId:'SPX',rightId:key,leftRecords:slice(spxRows,w),rightRecords:slice(right,w),
       leftTransform:'RETURN_PCT',rightTransform:'RETURN_PCT',maxLag:2,minObs:12,
       window:w,regime:name
     });
     check(rel[name].state==='MEASURED_ASSOCIATION',key+' '+name+' insufficient');
   }
   out[key]={
     relations:rel,
     preToStress:M24RelationStability.compare({relationA:rel.PRE_SHOCK,relationB:rel.STRESS,labelA:'PRE_SHOCK',labelB:'STRESS'}),
     stressToRecovery:M24RelationStability.compare({relationA:rel.STRESS,relationB:rel.EARLY_RECOVERY,labelA:'STRESS',labelB:'EARLY_RECOVERY'})
   };
   check(out[key].preToStress.state!=='INSUFFICIENT_SAMPLE',key+' pre/stress stability missing');
   check(out[key].stressToRecovery.state!=='INSUFFICIENT_SAMPLE',key+' stress/recovery stability missing');
 }
 const compact={};
 for(const [key,v] of Object.entries(out)){
   compact[key]={
     correlations:Object.fromEntries(Object.entries(v.relations).map(([n,r])=>[n,{sampleSize:r.sampleSize,correlation:r.contemporaneous.correlation,strength:r.contemporaneous.strength,bestLag:r.bestLag}])),
     preToStress:v.preToStress,
     stressToRecovery:v.stressToRecovery
   };
 }
 const snapshot={
   type:'M24_RELATION_REGIME_STABILITY_SNAPSHOT',caseId:'GLOBAL-MAR2020',
   windows,relations:compact,
   rule:'Association stability is regime/window specific. Changes and sign flips do not establish causal reversal.'
 };
 globalThis.__m24fs.writeFileSync('m24-relations-regime-stability-snapshot.json',JSON.stringify(snapshot,null,2));
 console.log('M24 real-source relation stability E2E OK');
 console.log(JSON.stringify(snapshot));
})().catch(e=>{globalThis.__m24fs.writeFileSync('m24-relations-regime-stability-snapshot.json',JSON.stringify({failure:{message:String(e?.message||e),stack:String(e?.stack||'')}},null,2));console.error(e);process.exit(1)});
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-relations-regime-stability-e2e-bundle.js'});
