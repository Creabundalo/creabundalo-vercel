const fs=require('fs');const vm=require('vm');
const source=['m24-lab.js','m24-index-lab.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const closes=[
 ['2000-03-01',4784.08],['2000-03-02',4754.51],['2000-03-03',4914.79],['2000-03-06',4904.85],['2000-03-07',4847.84],['2000-03-08',4897.26],['2000-03-09',5046.86],['2000-03-10',5048.62],['2000-03-13',4907.24],['2000-03-14',4706.63],['2000-03-15',4582.62],['2000-03-16',4717.39],['2000-03-17',4798.13],['2000-03-20',4610.00],['2000-03-21',4711.68],['2000-03-22',4864.75],['2000-03-23',4940.61],['2000-03-24',4963.03],['2000-03-27',4958.56],['2000-03-28',4833.89],['2000-03-29',4644.67],['2000-03-30',4457.89],['2000-03-31',4572.83],['2000-04-03',4223.68]
 ];
 const bars=closes.map(([date,close],i)=>({date,close,time:i}));
 const schema={id:'NASDAQ-1999-2002',asset:'NASDAQ',checkpointWindows:{
   firstTop:{from:'2000-03-06',to:'2000-03-13',select:'MAX_CLOSE'},
   automaticReaction:{from:'2000-03-14',to:'2000-03-20',select:'MIN_CLOSE'},
   supportReference:{from:'2000-03-14',to:'2000-03-20',select:'MIN_CLOSE'},
   secondTop:{from:'2000-03-21',to:'2000-03-28',select:'MAX_CLOSE'},
   markdownOutcome:{from:'2000-03-29',to:'2000-04-03',select:'MIN_CLOSE'}
 }};
 const result=M24IndexLab.analyze({id:schema.id,asset:schema.asset,resolution:'D',bars,source:{sourceId:'TEST'}},schema);
 check(result.firstTop.date==='2000-03-10','first top mismatch');
 check(result.secondTop.date==='2000-03-24','second top mismatch');
 check(result.support.referenceDate==='2000-03-15','support mismatch');
 check(result.support.firstCloseBelow==='2000-03-30','support break mismatch');
 check(result.firstTop.high===null&&result.firstTop.volume===null,'must not synthesize high/volume');
 check(result.priceBasis==='CLOSE_ONLY','wrong price basis');
 console.log('M24 close-only index Lab contract OK');
})();
`;
try{vm.runInThisContext(`${source}\\n${test}`,{filename:'m24-index-lab-test-bundle.js'})}catch(e){console.error(e);process.exit(1)}