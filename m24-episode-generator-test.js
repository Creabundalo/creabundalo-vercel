const fs=require('fs'),vm=require('vm');
const source=['m24-lab.js','m24-episode-generator.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const start=new Date('2020-01-01T00:00:00Z').getTime();
 const bars=[];
 for(let i=0;i<320;i++){
   const date=new Date(start+i*86400000).toISOString().slice(0,10);
   const close=100+(i*0.08)+Math.sin(i/13)*2;
   bars.push({date,time:Math.floor((start+i*86400000)/1000),open:close,high:close+1,low:close-1,close,volume:1000});
 }
 bars[100]={...bars[100],high:200,close:195,volume:2200};
 bars[180]={...bars[180],high:202,close:190,volume:900};
 bars[181]={...bars[181],high:201,close:188,volume:850};
 bars[250]={...bars[250],high:201,close:189,volume:800};

 const rule={minRetestRatio:0.95,maxRetestRatio:1.05,cooldownDays:75,minRsiWeakeningPoints:999};
 const prefix=M24EpisodeGenerator.scanFastMarket({asset:'TEST',bars:bars.slice(0,210),rule});
 const full=M24EpisodeGenerator.scanFastMarket({asset:'TEST',bars,rule});
 check(prefix.candidates.length>=1,'expected prefix candidate');
 check(prefix.candidates[0].decisionDate===bars[180].date,'expected first qualifying second-top checkpoint');
 check(full.candidates[0].decisionDate===prefix.candidates[0].decisionDate,'future bars changed an earlier candidate');
 check(full.suppressed.some(x=>x.decisionDate===bars[181].date),'near duplicate should be suppressed');

 const mutated=bars.map(x=>({...x}));
 for(let i=211;i<mutated.length;i++){mutated[i].close*=0.2;mutated[i].high*=0.2;mutated[i].low*=0.2}
 const mutatedRun=M24EpisodeGenerator.scanFastMarket({asset:'TEST',bars:mutated,rule});
 check(mutatedRun.candidates[0].decisionDate===prefix.candidates[0].decisionDate,'future outcome mutation leaked into selection');
 check(mutatedRun.candidates[0].outcomeStatus==='UNREAD_AT_SELECTION','outcome status guard');
 console.log('M24 deterministic episode generator contract OK');
})();
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-episode-generator-test-bundle.js'});
