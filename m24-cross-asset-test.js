const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('m24-cross-asset-lab.js','utf8');
const test=`
(async()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const caseSchema={id:'GLOBAL-MAR2020',asset:'SPX',checkpointWindows:{
   firstTop:{from:'2020-02-17',to:'2020-02-21',select:'MAX_CLOSE'},
   secondTop:{from:'2020-03-12',to:'2020-03-16',select:'MIN_CLOSE'},
   supportReference:{from:'2020-03-12',to:'2020-03-16',select:'MIN_CLOSE'},
   markdownOutcome:{from:'2020-03-17',to:'2020-03-31',select:'MIN_CLOSE'}
 }};
 const bars=[
  {date:'2020-02-19',close:3386.15},{date:'2020-03-12',close:2480.64},
  {date:'2020-03-16',close:2386.13},{date:'2020-03-20',close:2304.92},{date:'2020-03-23',close:2237.40}
 ];
 const r=M24CrossAssetLab.analyze({id:caseSchema.id,asset:'SPX',bars,source:null},caseSchema);
 check(r.firstTop.date==='2020-02-19','baseline');
 check(r.secondTop.date==='2020-03-16','stress checkpoint');
 check(r.outcome.troughDate==='2020-03-23','trough');
 check(r.comparisons.priceReferenceChangePct<-29,'stress drawdown');
 console.log('M24 cross-asset lab contract OK');
})().catch(e=>{console.error(e);process.exit(1)});
`;
vm.runInThisContext(`${source}\n${test}`);
