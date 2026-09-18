const fs=require('fs'),vm=require('vm');
globalThis.__m24fs=fs;
const source=['m24-lab.js','m24-coinbase.js','m24-episode-generator.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const provider=new M24Coinbase.CoinbaseHistoricalProvider();
 const specs=[
   {asset:'ETH',from:'2020-01-01',to:'2025-12-31'},
   {asset:'SOL',from:'2021-08-01',to:'2025-12-31'}
 ];
 const scans={};
 for(const spec of specs){
   const sourceResult=await provider.getBarsForAsset(spec.asset,{start:spec.from+'T00:00:00Z',end:spec.to+'T23:59:59Z',granularity:86400});
   const scan=M24EpisodeGenerator.scanFastMarket({asset:spec.asset,bars:sourceResult.bars});
   check(scan.sourceCount>500,spec.asset+' historical coverage too small');
   check(scan.selectedCount>=1,spec.asset+' expected at least one price-only candidate');
   check(scan.candidates.every(x=>x.outcomeStatus==='UNREAD_AT_SELECTION'),spec.asset+' future-outcome guard');
   scans[spec.asset]={
     window:{from:spec.from,to:spec.to},
     sourceCount:scan.sourceCount,
     rawCandidateCount:scan.rawCandidateCount,
     selectedCount:scan.selectedCount,
     selected:scan.candidates.map(x=>({
       decisionDate:x.decisionDate,episodeGroup:x.episodeGroup,
       firstTopDate:x.firstTop.date,retestRatio:x.observed.retestRatio,
       volumeRatio:x.observed.volumeRatio,rsiDelta:x.observed.rsiDelta,
       volumeWeak:x.observed.volumeWeak,rsiWeak:x.observed.rsiWeak
     })),
     suppressedCount:scan.suppressed.length,
     provenance:sourceResult.provenance
   };
 }
 const snapshot={
   type:'M24_REAL_SOURCE_EPISODE_CANDIDATE_SCAN',
   rule:M24EpisodeGenerator.DEFAULT_RULE,
   scans,
   status:'PRICE_CANDIDATES_ONLY',
   calibrationSamplesCreated:0,
   ruleText:'Candidates are selected using price/volume/momentum data available by decisionDate. They must still pass source-complete enrichment and the existing decision engine before any directional calibration sample can be created.'
 };
 globalThis.__m24fs.writeFileSync('m24-episode-candidate-scan.json',JSON.stringify(snapshot,null,2));
 console.log('M24 real-source rolling episode scan OK');
 console.log(JSON.stringify(snapshot));
})().catch(e=>{globalThis.__m24fs.writeFileSync('m24-episode-candidate-scan.json',JSON.stringify({failure:{message:String(e?.message||e),stack:String(e?.stack||'')}},null,2));console.error(e);process.exit(1)});
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-episode-generator-e2e-bundle.js'});
