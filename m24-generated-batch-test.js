const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('m24-generated-batch.js','utf8');
const test=`
(async()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const candidates=[
   {asset:'ETH',selectorRule:'V1',decisionDate:'2023-03-01',episodeGroup:'E3'},
   {asset:'ETH',selectorRule:'V1',decisionDate:'2023-01-01',episodeGroup:'E1'},
   {asset:'SOL',selectorRule:'V1',decisionDate:'2023-02-01',episodeGroup:'E2'},
   {asset:'SOL',selectorRule:'V1',decisionDate:'2023-04-01',episodeGroup:'E4'}
 ];
 const seen=[];
 const result=await M24GeneratedBatch.run({
   candidates,maxCases:3,
   enrichOne:async c=>{
     seen.push(c.decisionDate);
     if(c.decisionDate==='2023-02-01') return {calibrationEligible:true,evidence:{coverageProfile:'MECHANICS_CORE_DERIVATIVES',missingLayers:[]},backtest:{candidate:{action:'WAIT'}}};
     return {calibrationEligible:true,evidence:{coverageProfile:'MECHANICS_CORE_DERIVATIVES',missingLayers:[]},backtest:{candidate:{action:'DOWNSIDE_WATCH'}}};
   }
 });
 check(seen.join(',')==='2023-01-01,2023-02-01,2023-03-01','deterministic order/limit');
 check(result.attempted===3&&result.sourceComplete===3,'batch counts');
 check(result.directionalSourceComplete===2&&result.waitSourceComplete===1,'directional/wait separation');
 console.log('M24 generated enrichment batch contract OK');
})().catch(e=>{console.error(e);process.exit(1)});
`;
vm.runInThisContext(`${source}\n${test}`);
