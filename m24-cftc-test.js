const fs=require('fs');const vm=require('vm');
const source=['m24-cftc.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const test=`
(async()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const rows=[
  {report_date_as_yyyy_mm_dd:'2019-06-18T00:00:00.000',market_and_exchange_names:'BITCOIN - CHICAGO MERCANTILE EXCHANGE',cftc_contract_market_code:'133741',open_interest_all:'5000',dealer_positions_long_all:'1000',dealer_positions_short_all:'500',asset_mgr_positions_long:'700',asset_mgr_positions_short:'300',lev_money_positions_long:'900',lev_money_positions_short:'1500',other_rept_positions_long:'200',other_rept_positions_short:'250',nonrept_positions_long_all:'400',nonrept_positions_short_all:'350'},
  {report_date_as_yyyy_mm_dd:'2019-06-25T00:00:00.000',market_and_exchange_names:'BITCOIN - CHICAGO MERCANTILE EXCHANGE',cftc_contract_market_code:'133741',open_interest_all:'6000',dealer_positions_long_all:'1100',dealer_positions_short_all:'600',asset_mgr_positions_long:'800',asset_mgr_positions_short:'350',lev_money_positions_long:'1000',lev_money_positions_short:'1800',other_rept_positions_long:'220',other_rept_positions_short:'260',nonrept_positions_long_all:'420',nonrept_positions_short_all:'370'},
  {report_date_as_yyyy_mm_dd:'2019-07-02T00:00:00.000',market_and_exchange_names:'BITCOIN - CHICAGO MERCANTILE EXCHANGE',cftc_contract_market_code:'133741',open_interest_all:'7000',dealer_positions_long_all:'1200',dealer_positions_short_all:'700',asset_mgr_positions_long:'900',asset_mgr_positions_short:'400',lev_money_positions_long:'1100',lev_money_positions_short:'2100',other_rept_positions_long:'240',other_rept_positions_short:'270',nonrept_positions_long_all:'450',nonrept_positions_short_all:'390'}
 ];
 const provider=new M24Cftc.TffProvider({fetchImpl:async()=>({ok:true,json:async()=>rows}),nowFn:()=>Date.parse('2026-09-18T00:00:00Z')});
 const history=await provider.fetchHistory({asset:'BTC',start:'2019-05-01',end:'2019-07-15'});
 check(history.records.length===3,'expected 3 rows');
 check(history.records[0].leveragedMoney.net===-600,'net normalization');
 const lab={firstTop:{date:'2019-06-26'},secondTop:{date:'2019-07-10'}};
 const ctx=M24Cftc.analyzeAtCheckpoints(history.records,{id:'BTC-2019-TOP-MARKDOWN',asset:'BTC'},lab);
 check(ctx.firstTop.reportDate==='2019-06-18','June 25 report must not leak before Friday publication');
 check(ctx.secondTop.reportDate==='2019-07-02','July 9 report must not leak before Friday publication');
 check(ctx.evidenceFamily==='FUTURES_POSITIONING','wrong evidence family');
 check(ctx.sourceGaps.length===0,'unexpected gaps');
 console.log('M24 CFTC provider contract OK');
})().catch(e=>{console.error(e);process.exit(1)});
`;
vm.runInThisContext(`${source}\n${test}`,{filename:'m24-cftc-test-bundle.js'});