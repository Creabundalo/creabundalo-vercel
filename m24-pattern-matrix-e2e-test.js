const fs=require('fs'),vm=require('vm');
globalThis.__m24fs=fs;
const files=['m24-lab.js','m24-cases.js','m24-coinbase.js','m24-primary-lab.js','m24-fred-market.js','m24-index-lab.js','m24-patterns.js'];
const source=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const coinbase=new M24Coinbase.CoinbaseHistoricalProvider();
 const fred=new M24FredMarket.FredMarketProvider();
 const specs=[
   {id:'BTC-2019-TOP-MARKDOWN',provider:coinbase,lab:M24PrimaryLab,thresholdPct:8},
   {id:'BTC-2021-2022-TOP-MARKDOWN',provider:coinbase,lab:M24PrimaryLab,thresholdPct:8},
   {id:'ETH-2021-2022-TOP-MARKDOWN',provider:coinbase,lab:M24PrimaryLab,thresholdPct:8},
   {id:'SOL-2021-2022-TOP-MARKDOWN',provider:coinbase,lab:M24PrimaryLab,thresholdPct:10},
   {id:'NASDAQ-1999-2002',provider:fred,lab:M24IndexLab,thresholdPct:5}
 ];
 const cases={};
 for(const spec of specs){
   const schema=M24Cases.get(spec.id);
   const measured=await spec.lab.runCase({provider:spec.provider,caseSchema:schema,granularity:86400});
   const lab=measured.result;
   const reaction=lab.checkpoints?.automaticReaction||null;
   const trough=lab.checkpoints?.markdownOutcome||lab.outcome||null;
   const bars=(measured.sourceResult?.bars||[]).map(b=>({date:b.date,value:b.close}));
   const rsi=M24Patterns.rsiDivergence(lab);
   const structure=M24Patterns.structuralDistribution(lab);
   const fib=M24Patterns.fibGeometry({firstTop:lab.firstTop,reaction,secondTop:lab.secondTop,trough});
   const elliott=M24Patterns.elliottCandidate(bars,{thresholdPct:spec.thresholdPct});
   cases[spec.id]={
     asset:schema.asset,
     sourceCount:bars.length,
     patterns:{rsi,structure,fib,elliott},
     rule:'Pattern observations are descriptive and causalStatus remains NOT_ESTABLISHED.'
   };
   check(structure.status!=='INSUFFICIENT',spec.id+' structure insufficient');
   check(fib.status!=='INSUFFICIENT',spec.id+' fib geometry insufficient');
   check(['OBSERVED','NOT_OBSERVED','INSUFFICIENT'].includes(rsi.status),spec.id+' RSI invalid');
   check(['CANDIDATE_ONLY','NOT_OBSERVED','INSUFFICIENT'].includes(elliott.status),spec.id+' Elliott invalid');
 }
 const snapshot={
   type:'M24_VERIFIED_PATTERN_MATRIX',
   cases,
   summary:{
     rsiObserved:Object.entries(cases).filter(([,v])=>v.patterns.rsi.status==='OBSERVED').map(([k])=>k),
     structureObserved:Object.entries(cases).filter(([,v])=>v.patterns.structure.status==='OBSERVED').map(([k])=>k),
     elliottCandidates:Object.entries(cases).filter(([,v])=>v.patterns.elliott.status==='CANDIDATE_ONLY').map(([k])=>k),
     fibSecondLegMatches:Object.entries(cases).filter(([,v])=>v.patterns.fib.secondLegReferenceMatch===true).map(([k])=>k),
     fibMarkdownMatches:Object.entries(cases).filter(([,v])=>v.patterns.fib.markdownReferenceMatch===true).map(([k])=>k)
   },
   rule:'Cross-case pattern matrix. Geometry does not establish mechanism, causality or predictive edge.'
 };
 globalThis.__m24fs.writeFileSync('m24-pattern-matrix-snapshot.json',JSON.stringify(snapshot,null,2));
 console.log('M24 real-source pattern matrix E2E OK');
 console.log(JSON.stringify(snapshot));
})().catch(e=>{globalThis.__m24fs.writeFileSync('m24-pattern-matrix-snapshot.json',JSON.stringify({failure:{message:String(e?.message||e),stack:String(e?.stack||'')}},null,2));console.error(e);process.exit(1)});
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-pattern-matrix-e2e-bundle.js'});
