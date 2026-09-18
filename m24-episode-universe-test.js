const fs=require('fs'),vm=require('vm');
const source=['m24-lab.js','m24-episode-generator.js','m24-episode-universe.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const w=M24EpisodeUniverse.assetWindow('ETH');
 check(w.from==='2020-01-01'&&w.to==='2025-12-31','canonical ETH window');
 const start=new Date('2020-01-01T00:00:00Z').getTime(),bars=[];
 for(let i=0;i<400;i++){
   const date=new Date(start+i*86400000).toISOString().slice(0,10),close=100+Math.sin(i/20)*10+i*.02;
   bars.push({date,high:close+1,low:close-1,open:close,close,volume:1000});
 }
 bars[80]={...bars[80],high:150,close:148,volume:2000};
 bars[120]={...bars[120],high:145,close:142,volume:700};
 const scan=M24EpisodeUniverse.scanCanonical({asset:'ETH',bars,rule:{minRetestRatio:.9,maxRetestRatio:1.1,minRsiWeakeningPoints:999}});
 check(scan.selectionUniverseId==='FAST_DISTRIBUTION_V1','universe id');
 if(scan.candidates.length){
   const v=M24EpisodeUniverse.verifyCandidate(scan.candidates[0]);
   check(v.eligible===true,'canonical candidate eligibility');
 }
 const bad={asset:'ETH',decisionDate:'2023-01-01',selectionEligible:true,selectionUniverseId:'FAST_DISTRIBUTION_V1',selectionWindow:{from:'2023-01-01',to:'2023-12-31'}};
 check(M24EpisodeUniverse.verifyCandidate(bad).eligible===false,'noncanonical window must fail');
 console.log('M24 canonical episode universe contract OK');
})();
`;
vm.runInThisContext(`${source}\n${test}`);
