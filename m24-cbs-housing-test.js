const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('m24-cbs-housing.js','utf8');
const test=`
(async()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)};
 const meta={value:[
  {Key:'Prijsindex_1',Title:'Prijsindex bestaande koopwoningen'},
  {Key:'Jaar_2',Title:'Prijsindex bestaande koopwoningen Ontwikkeling ten opzichte van een jaar eerder'},
  {Key:'Aantal_3',Title:'Aantal verkochte woningen'},
  {Key:'AantalJaar_4',Title:'Aantal verkochte woningen Ontwikkeling ten opzichte van een jaar eerder'}
 ]};
 const data={value:[
  {Perioden:'2022MM01',Prijsindex_1:127.4,Jaar_2:20.9,Aantal_3:14000,AantalJaar_4:-42.7},
  {Perioden:'2022MM07',Prijsindex_1:132.9,Jaar_2:14.2,Aantal_3:16417,AantalJaar_4:-13.8}
 ]};
 const p=new M24CbsHousing.Provider({fetchImpl:async url=>({ok:true,json:async()=>url.endsWith('DataProperties')?meta:data})});
 const r=await p.fetchMonthly({from:'2022-01-01',to:'2022-12-31'});
 check(r.rows.length===2,'row count');
 check(r.rows[0].publishedAt==='2022-02-28','conservative publication lag');
 check(r.rows[1].priceIndex===132.9,'price mapping');
 check(r.rows[1].transactionYoYPct===-13.8,'transaction yoy mapping');
 console.log('M24 CBS housing provider contract OK');
})().catch(e=>{console.error(e);process.exit(1)});
`;
vm.runInThisContext(`${source}\n${test}`);
