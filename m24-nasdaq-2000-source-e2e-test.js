const fs=require('fs');const vm=require('vm');
globalThis.__m24fs=fs;
const files=[
 'm24-core.js','m24-cases.js','m24-lab.js','m24-fred-market.js','m24-index-lab.js',
 'm24-meaning.js','m24-macro.js','m24-macro-lab.js','m24-backtest.js','m24-evidence-gate.js','m24-enrichment.js'
];
const source=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const caseSchema=M24Cases.get('NASDAQ-1999-2002');
 const store=new M24Core.QubusStore();
 const providers={
   price:new M24FredMarket.FredMarketProvider(),
   priceLab:M24IndexLab,
   macro:new M24Macro.FredCsvProvider(),
   macroKeys:caseSchema.macroKeys
 };
 const raw=await providers.price.getBarsForAsset(caseSchema.asset,{start:`${caseSchema.window.from}T00:00:00Z`,end:`${caseSchema.window.to}T23:59:59Z`});
 const result=await M24Enrichment.runCase({store,caseSchema,providers});
 const minBar=raw.bars.reduce((a,b)=>!a||b.close<a.close?b:a,null);
 const snapshot={
   type:'M24_REAL_SOURCE_ENRICHMENT_SNAPSHOT',caseId:caseSchema.id,asset:caseSchema.asset,
   state:result.state,calibrationEligible:result.calibrationEligible,coverageProfile:result.evidence.coverageProfile,
   rawCoverage:{count:raw.bars.length,firstDate:raw.bars[0]?.date||null,lastDate:raw.bars.at(-1)?.date||null,minDate:minBar?.date||null,minClose:minBar?.close??null},
   resolvedCheckpoints:{
     firstTop:result.backtest.snapshot.price.firstTop.date,
     secondTop:result.backtest.snapshot.price.secondTop.date,
     supportBreakDate:result.backtest.outcome.supportBreakDate,
     troughDate:result.backtest.outcome.troughDate
   },
   priceBasis:result.backtest.snapshot.price.firstTop.priceBasis,
   meaningScope:result.meaning.sourceScope,
   macroSeries:(result.macro.series||[]).map(x=>({key:x.key,seriesId:x.seriesId,status:x.status,firstTop:x.firstTop,secondTop:x.secondTop,delta:x.delta})),
   evidenceLayers:Object.fromEntries(Object.entries(result.evidence.layers).map(([k,v])=>[k,{state:v.state,note:v.note}])),
   missingLayers:result.evidence.missingLayers,
   actionCandidate:result.backtest.candidate,
   rule:'Close-only NASDAQ case uses case-specific evidence requirements. No OHLC, volume or derivatives evidence is fabricated.'
 };
 globalThis.__m24fs.writeFileSync('m24-nasdaq-2000-source-snapshot.json',JSON.stringify(snapshot,null,2));
 check(raw.bars.at(-1)?.date>='2002-12-30','NASDAQ raw source did not cover the requested 1999-2002 window');
 check(minBar?.date==='2002-10-09'&&Math.abs(minBar.close-1114.11)<0.01,'NASDAQ long-window minimum mismatch');
 check(result.backtest.outcome.troughDate==='2002-10-09','NASDAQ markdown outcome must resolve from full 2002 history');
 check(result.backtest.snapshot.price.firstTop.high===null,'NASDAQ source must remain close-only');
 check(result.backtest.snapshot.price.firstTop.volume===null,'NASDAQ volume must not be synthesized');
 check(result.meaning.firstTop.count>=1&&result.meaning.secondTop.count>=1,'NASDAQ meaning-world top coverage incomplete');
 check(result.evidence.requiredLayers.includes('DERIVATIVES')===false,'NASDAQ profile must not force derivatives');
 check(result.evidence.coverageProfile==='INDEX_CLOSE_MACRO_MEANING','NASDAQ coverage profile mismatch');
 check(result.backtest.snapshot.decisionCoverage===1,'case-profile input coverage should be complete');
 check(result.calibrationEligible===true,'NASDAQ source chain incomplete: '+JSON.stringify(result.evidence));
 console.log('M24 real-source NASDAQ 1999-2002 E2E OK');
 console.log(JSON.stringify(snapshot));
})().catch(err=>{
 globalThis.__m24fs.writeFileSync('m24-nasdaq-2000-source-snapshot.json',JSON.stringify({failure:{message:String(err?.message||err),stack:String(err?.stack||'')}},null,2));
 console.error(err);process.exit(1);
});
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-nasdaq-2000-source-e2e-bundle.js'});
