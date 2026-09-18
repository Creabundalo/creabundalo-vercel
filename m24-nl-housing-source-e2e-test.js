const fs=require('fs'),vm=require('vm');
globalThis.__m24fs=fs;
const files=[
 'm24-core.js','m24-cases.js','m24-lab.js','m24-cbs-housing.js','m24-housing-lab.js',
 'm24-meaning.js','m24-macro.js','m24-macro-lab.js','m24-backtest.js','m24-evidence-gate.js','m24-enrichment.js'
];
const source=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const caseSchema=M24Cases.get('NL-HOUSING-2015-2023');
 const store=new M24Core.QubusStore();
 const providers={
   price:new M24CbsHousing.Provider(),
   priceLab:M24HousingLab,
   macro:new M24Macro.FredCsvProvider(),
   macroKeys:caseSchema.macroKeys
 };
 const result=await M24Enrichment.runCase({store,caseSchema,providers});
 const snap={
   type:'M24_REAL_SOURCE_ENRICHMENT_SNAPSHOT',caseId:caseSchema.id,asset:caseSchema.asset,
   state:result.state,calibrationEligible:result.calibrationEligible,coverageProfile:result.evidence.coverageProfile,
   firstCheckpoint:result.backtest.snapshot.price.firstTop,
   secondCheckpoint:result.backtest.snapshot.price.secondTop,
   decisionAsOf:result.backtest.snapshot.asOf,
   supportBreakDate:result.backtest.outcome.supportBreakDate,
   troughDate:result.backtest.outcome.troughDate,
   macroSeries:(result.macro.series||[]).map(x=>({key:x.key,firstTop:x.firstTop,secondTop:x.secondTop,delta:x.delta,status:x.status})),
   meaningScope:result.meaning.sourceScope,
   actionCandidate:result.backtest.candidate,
   evidenceLayers:Object.fromEntries(Object.entries(result.evidence.layers).map(([k,v])=>[k,{state:v.state,note:v.note}])),
   rule:'Housing is a slow-market case: publication availability governs no-lookahead. No daily-market or crypto-derivatives fields are synthesized.'
 };
 globalThis.__m24fs.writeFileSync('m24-nl-housing-source-snapshot.json',JSON.stringify(snap,null,2));
 check(result.backtest.snapshot.asOf.startsWith('2022-08'),'housing decision must use publication lag after July 2022');
 check(result.backtest.snapshot.price.firstTop.yoyPct>=20,'expected housing YoY momentum peak');
 check(result.backtest.snapshot.price.secondTop.yoyPct<result.backtest.snapshot.price.firstTop.yoyPct,'housing growth should decelerate by second checkpoint');
 check(result.backtest.snapshot.price.secondTop.transactionYoYPct<=-10,'housing transaction contraction missing');
 check(result.backtest.candidate.evidence.some(x=>x.id==='HOUSING_GROWTH_DECELERATION'),'growth deceleration not scored');
 check(result.backtest.candidate.evidence.some(x=>x.id==='HOUSING_TRANSACTION_WEAKNESS'),'transaction weakness not scored');
 check(result.evidence.requiredLayers.includes('DERIVATIVES')===false,'housing profile must not force derivatives');
 check(result.evidence.coverageProfile==='HOUSING_PRICE_RATE_MEANING','housing coverage profile mismatch');
 check(result.calibrationEligible===true,'housing chain incomplete: '+JSON.stringify(result.evidence));
 console.log('M24 real-source NL housing 2015-2023 E2E OK');
 console.log(JSON.stringify(snap));
})().catch(err=>{fs.writeFileSync('m24-nl-housing-source-snapshot.json',JSON.stringify({failure:{message:String(err?.message||err),stack:String(err?.stack||'')}},null,2));console.error(err);process.exit(1)});
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-nl-housing-e2e-bundle.js'});
