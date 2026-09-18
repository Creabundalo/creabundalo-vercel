const fs=require('fs'),vm=require('vm');
globalThis.__m24fs=fs;
const files=[
 'm24-core.js','m24-cases.js','m24-lab.js','m24-fred-market.js','m24-cross-asset-lab.js',
 'm24-meaning.js','m24-macro.js','m24-macro-lab.js','m24-backtest.js','m24-evidence-gate.js','m24-enrichment.js'
];
const source=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const caseSchema=M24Cases.get('GLOBAL-MAR2020');
 const store=new M24Core.QubusStore();
 const providers={
   price:new M24FredMarket.FredMarketProvider(),
   priceLab:M24CrossAssetLab,
   macro:new M24Macro.FredCsvProvider(),
   macroKeys:caseSchema.macroKeys
 };
 const result=await M24Enrichment.runCase({store,caseSchema,providers});
 const macro=Object.fromEntries((result.macro.series||[]).map(x=>[x.key,x]));
 const snapshot={
   type:'M24_REAL_SOURCE_ENRICHMENT_SNAPSHOT',caseId:caseSchema.id,asset:caseSchema.asset,
   state:result.state,calibrationEligible:result.calibrationEligible,coverageProfile:result.evidence.coverageProfile,
   baseline:result.backtest.snapshot.price.firstTop,
   stressCheckpoint:result.backtest.snapshot.price.secondTop,
   decisionAsOf:result.backtest.snapshot.asOf,
   supportBreakDate:result.backtest.outcome.supportBreakDate,
   troughDate:result.backtest.outcome.troughDate,
   macroSeries:Object.fromEntries(Object.entries(macro).map(([k,x])=>[k,{firstTop:x.firstTop,secondTop:x.secondTop,delta:x.delta,pctDelta:x.pctDelta,status:x.status}])),
   meaningScope:result.meaning.sourceScope,
   actionCandidate:result.backtest.candidate,
   evidenceLayers:Object.fromEntries(Object.entries(result.evidence.layers).map(([k,v])=>[k,{state:v.state,note:v.note}])),
   rule:'March 2020 is modeled as a cross-asset liquidity shock. No double-top, actor-intent or single-indicator causality is inferred.'
 };
 globalThis.__m24fs.writeFileSync('m24-global-mar2020-source-snapshot.json',JSON.stringify(snapshot,null,2));
 check(result.backtest.snapshot.price.firstTop.date==='2020-02-19','SPX baseline checkpoint mismatch');
 check(result.backtest.snapshot.price.secondTop.date==='2020-03-16','SPX stress checkpoint mismatch');
 check(result.backtest.outcome.troughDate==='2020-03-23','SPX stress trough mismatch');
 check(Number(result.backtest.snapshot.price.comparisons.priceReferenceChangePct)<-25,'equity stress move too small');
 check(Number(macro.VIX?.delta)>20,'VIX stress signal missing');
 check(Number(macro.FIN_CONDITIONS?.delta)>0,'financial-conditions stress missing');
 check(Number(macro.WTI?.pctDelta)<-20,'oil stress signal missing');
 check(result.meaning.firstTop.count>=1&&result.meaning.secondTop.count>=1,'March 2020 meaning coverage incomplete');
 check(result.evidence.requiredLayers.includes('DERIVATIVES')===false,'cross-asset profile must not force derivatives');
 check(result.evidence.coverageProfile==='CROSS_ASSET_LIQUIDITY','cross-asset coverage profile mismatch');
 check(result.backtest.candidate.action==='DOWNSIDE_WATCH','expected cross-asset historical downside watch');
 check(result.calibrationEligible===true,'March 2020 source chain incomplete: '+JSON.stringify(result.evidence));
 console.log('M24 real-source GLOBAL March 2020 E2E OK');
 console.log(JSON.stringify(snapshot));
})().catch(err=>{globalThis.__m24fs.writeFileSync('m24-global-mar2020-source-snapshot.json',JSON.stringify({failure:{message:String(err?.message||err),stack:String(err?.stack||'')}},null,2));console.error(err);process.exit(1)});
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-global-mar2020-e2e-bundle.js'});
