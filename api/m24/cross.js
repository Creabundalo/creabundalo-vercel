'use strict';
const FRED='https://fred.stlouisfed.org/graph/fredgraph.csv';
const SERIES=Object.freeze([
  {key:'GOLD',name:'Goud',id:'GOLDAMGBD228NLBM',units:'USD/oz'},
  {key:'OIL',name:'WTI olie',id:'DCOILWTICO',units:'USD/bbl'},
  {key:'NASDAQ',name:'Nasdaq',id:'NASDAQCOM',units:'index'},
  {key:'CREDIT',name:'Credit',id:'BAMLH0A0HYM2',units:'spread_pct'},
  {key:'DOLLAR',name:'Dollar',id:'DTWEXBGS',units:'index'}
]);
function finite(v){return String(v??'').trim()!==''&&String(v).trim()!=='.'&&Number.isFinite(Number(v))}
function parseCsv(text,id){
  const lines=String(text||'').trim().split(/\r?\n/).filter(Boolean);if(lines.length<2)return[];
  const h=lines[0].split(',').map(x=>x.trim());const d=h.findIndex(x=>x==='DATE'||x==='observation_date'),v=h.findIndex(x=>x===id);
  return lines.slice(1).map(x=>x.split(',')).filter(r=>r.length>Math.max(d,v)&&finite(r[v])).map(r=>({date:r[d],value:Number(r[v])}));
}
function direction(records,key){
  if(records.length<2)return{direction:'→',state:'source gap',className:'flat',changePct:null};
  const last=records.at(-1),anchor=records[Math.max(0,records.length-6)];
  const p=anchor.value?((last.value/anchor.value)-1)*100:0;
  let dir=p>0.5?'↑':p<-0.5?'↘':'→',cls=p>0.5?'up':p<-0.5?'down':'flat';
  if(key==='CREDIT'){cls=p>0.05?'down':p<-0.05?'up':'flat';dir=p>0.05?'↗':p<-0.05?'↘':'→'}
  return{direction:dir,state:`${p>=0?'+':''}${p.toFixed(2)}% / 5 obs`,className:cls,changePct:Number(p.toFixed(2)),asOf:last.date,value:last.value};
}
function createHandler({fetchImpl=globalThis.fetch}={}){
  return async function handler(req,res){
    res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate=300');
    const end=new Date(),start=new Date(end.getTime()-60*86400000);
    const cosd=start.toISOString().slice(0,10),coed=end.toISOString().slice(0,10);
    const results=await Promise.all(SERIES.map(async s=>{
      const url=`${FRED}?id=${s.id}&cosd=${cosd}&coed=${coed}`;
      try{
        const r=await fetchImpl(url,{headers:{Accept:'text/csv'}});if(!r?.ok)throw new Error(`HTTP_${r?.status??'NETWORK'}`);
        const records=parseCsv(await r.text(),s.id);return{...s,...direction(records,s.key),status:'OK',quality:'OFFICIAL_OR_OFFICIAL_UPSTREAM',source:url};
      }catch(err){return{...s,direction:'?',state:'SOURCE GAP',className:'flat',status:'SOURCE_GAP',error:String(err.message||err)}}
    }));
    res.status(200).json({schema:'m24.cross.live.v0.1',retrievedAt:new Date().toISOString(),freshness:'DAILY_DELAYED',items:results});
  }
}
const handler=createHandler();module.exports=handler;module.exports.createHandler=createHandler;module.exports.parseCsv=parseCsv;module.exports.direction=direction;
