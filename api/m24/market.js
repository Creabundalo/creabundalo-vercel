'use strict';

const COINBASE='https://api.exchange.coinbase.com';
const FRED='https://fred.stlouisfed.org/graph/fredgraph.csv';
const STOOQ='https://stooq.com/q/d/l/';
const ASSETS=Object.freeze({
  BTC:{kind:'coinbase',product:'BTC-USD',label:'Bitcoin',quality:'PRIMARY_EXCHANGE',freshness:'LIVE_MARKET'},
  SOL:{kind:'coinbase',product:'SOL-USD',label:'Solana',quality:'PRIMARY_EXCHANGE',freshness:'LIVE_MARKET'},
  ETH:{kind:'coinbase',product:'ETH-USD',label:'Ethereum',quality:'PRIMARY_EXCHANGE',freshness:'LIVE_MARKET'},
  TSLA:{kind:'stooq',symbol:'tsla.us',label:'Tesla',quality:'SECONDARY_MARKET',freshness:'DELAYED_DAILY'},
  OIL:{kind:'fred',series:'DCOILWTICO',label:'WTI Oil',quality:'OFFICIAL_UPSTREAM_VIA_FRED',freshness:'OFFICIAL_DAILY_DELAYED'}
});

function finite(v){return String(v??'').trim()!==''&&String(v).trim()!=='.'&&Number.isFinite(Number(v))}
function pct(a,b){return a&&Number.isFinite(a)&&Number.isFinite(b)?Number((((b/a)-1)*100).toFixed(2)):null}
function parseSimpleCsv(text){
  const lines=String(text||'').trim().split(/\r?\n/).filter(Boolean);
  if(lines.length<2)return {header:[],rows:[]};
  const header=lines[0].split(',').map(x=>x.trim());
  const rows=lines.slice(1).map(line=>line.split(',').map(x=>x.trim()));
  return {header,rows};
}
function aggregateWeekly(bars){
  const groups=new Map();
  for(const bar of bars){
    const d=new Date(bar.date+'T00:00:00Z');
    const day=d.getUTCDay()||7;
    d.setUTCDate(d.getUTCDate()-day+1);
    const key=d.toISOString().slice(0,10);
    const list=groups.get(key)||[];list.push(bar);groups.set(key,list);
  }
  return [...groups.entries()].map(([date,list])=>({
    date,
    open:list[0].open,
    high:Math.max(...list.map(x=>x.high)),
    low:Math.min(...list.map(x=>x.low)),
    close:list.at(-1).close,
    volume:list.reduce((a,b)=>a+(Number(b.volume)||0),0)
  }));
}
function normalize(asset,meta,bars,{price=null,retrievedAt=new Date().toISOString(),sourceUrl=null}={}){
  if(!bars.length) throw new Error('SOURCE_GAP_NO_BARS');
  const clean=bars.filter(x=>[x.open,x.high,x.low,x.close].every(Number.isFinite)).sort((a,b)=>a.date.localeCompare(b.date));
  if(!clean.length) throw new Error('SOURCE_GAP_NO_VALID_BARS');
  const latest=clean.at(-1);
  const anchor=clean[Math.max(0,clean.length-6)];
  return {
    schema:'m24.market.live.v0.1',
    asset,
    name:meta.label,
    retrievedAt,
    asOf:latest.date,
    sourceStatus:'OK',
    freshness:meta.freshness,
    quality:meta.quality,
    price:Number(price??latest.close),
    change5Pct:pct(anchor.close,latest.close),
    window:[clean[0].date,meta.freshness,latest.date],
    bars:clean,
    values:clean.map(x=>x.close),
    provenance:[{sourceId:meta.kind==='coinbase'?'COINBASE-EXCHANGE':meta.kind==='fred'?'FRED-OFFICIAL-UPSTREAM':'STOOQ-MARKET-FEED',quality:meta.quality,url:sourceUrl,retrievedAt}]
  };
}
async function fetchCoinbase(fetchImpl,asset,meta,resolution='D',level='episode'){
  const granularity=resolution==='1H'?3600:resolution==='4H'?21600:86400;
  const count=level==='life'?280:level==='cycle'?240:level==='regime'?160:90;
  const end=new Date();const start=new Date(end.getTime()-count*granularity*1000);
  const q=new URLSearchParams({start:start.toISOString(),end:end.toISOString(),granularity:String(granularity)});
  const candlesUrl=`${COINBASE}/products/${meta.product}/candles?${q}`;
  const tickerUrl=`${COINBASE}/products/${meta.product}/ticker`;
  const [candlesResp,tickerResp]=await Promise.all([fetchImpl(candlesUrl,{headers:{Accept:'application/json'}}),fetchImpl(tickerUrl,{headers:{Accept:'application/json'}})]);
  if(!candlesResp?.ok) throw new Error(`COINBASE_CANDLES_${candlesResp?.status??'NETWORK'}`);
  const payload=await candlesResp.json();
  const bars=(Array.isArray(payload)?payload:[]).map(row=>({
    date:new Date(Number(row[0])*1000).toISOString().slice(0,10),
    open:Number(row[3]),high:Number(row[2]),low:Number(row[1]),close:Number(row[4]),volume:Number(row[5])
  })).sort((a,b)=>a.date.localeCompare(b.date));
  let price=null;
  if(tickerResp?.ok){const t=await tickerResp.json();if(finite(t.price))price=Number(t.price)}
  return normalize(asset,meta,resolution==='W'?aggregateWeekly(bars):bars,{price,sourceUrl:candlesUrl});
}
async function fetchStooq(fetchImpl,asset,meta,resolution='D',level='episode'){
  const days=level==='life'?900:level==='cycle'?500:level==='regime'?260:140;
  const end=new Date();const start=new Date(end.getTime()-days*86400000);
  const fmt=d=>d.toISOString().slice(0,10).replaceAll('-','');
  const url=`${STOOQ}?s=${encodeURIComponent(meta.symbol)}&d1=${fmt(start)}&d2=${fmt(end)}&i=d`;
  const r=await fetchImpl(url,{headers:{Accept:'text/csv','User-Agent':'Mozilla/5.0 M24/0.11.11'}});
  if(!r?.ok) throw new Error(`STOOQ_${r?.status??'NETWORK'}`);
  const {header,rows}=parseSimpleCsv(await r.text());
  const idx=n=>header.findIndex(x=>x.toLowerCase()===n);
  const di=idx('date'),oi=idx('open'),hi=idx('high'),li=idx('low'),ci=idx('close'),vi=idx('volume');
  const bars=rows.filter(row=>row.length>=5&&finite(row[ci])).map(row=>({date:row[di],open:Number(row[oi]),high:Number(row[hi]),low:Number(row[li]),close:Number(row[ci]),volume:finite(row[vi])?Number(row[vi]):0}));
  return normalize(asset,meta,resolution==='W'?aggregateWeekly(bars):bars,{sourceUrl:url});
}
async function fetchFred(fetchImpl,asset,meta,resolution='D',level='episode'){
  const days=level==='life'?1200:level==='cycle'?700:level==='regime'?360:180;
  const end=new Date();const start=new Date(end.getTime()-days*86400000);
  const cosd=start.toISOString().slice(0,10),coed=end.toISOString().slice(0,10);
  const url=`${FRED}?id=${meta.series}&cosd=${cosd}&coed=${coed}`;
  const r=await fetchImpl(url,{headers:{Accept:'text/csv'}});
  if(!r?.ok) throw new Error(`FRED_${r?.status??'NETWORK'}`);
  const {header,rows}=parseSimpleCsv(await r.text());
  const di=header.findIndex(x=>x==='DATE'||x==='observation_date'),vi=header.findIndex(x=>x===meta.series);
  const series=rows.filter(row=>row.length>Math.max(di,vi)&&finite(row[vi])).map(row=>({date:row[di],value:Number(row[vi])}));
  const bars=series.map((x,i)=>{const prev=series[Math.max(0,i-1)].value;return {date:x.date,open:prev,high:Math.max(prev,x.value),low:Math.min(prev,x.value),close:x.value,volume:0}});
  return normalize(asset,meta,resolution==='W'?aggregateWeekly(bars):bars,{sourceUrl:url});
}
function createHandler({fetchImpl=globalThis.fetch}={}){
  return async function handler(req,res){
    res.setHeader('Cache-Control','s-maxage=30, stale-while-revalidate=120');
    const asset=String(req.query?.asset||'BTC').toUpperCase();
    const resolution=String(req.query?.resolution||'D').toUpperCase();
    const level=String(req.query?.level||'episode').toLowerCase();
    const meta=ASSETS[asset];
    if(!meta)return res.status(400).json({schema:'m24.market.live.v0.1',asset,status:'SOURCE_GAP',error:'UNSUPPORTED_ASSET',supported:Object.keys(ASSETS)});
    try{
      const out=meta.kind==='coinbase'?await fetchCoinbase(fetchImpl,asset,meta,resolution,level):meta.kind==='stooq'?await fetchStooq(fetchImpl,asset,meta,resolution,level):await fetchFred(fetchImpl,asset,meta,resolution,level);
      return res.status(200).json(out);
    }catch(err){
      return res.status(502).json({schema:'m24.market.live.v0.1',asset,status:'SOURCE_GAP',error:String(err.message||err),retrievedAt:new Date().toISOString(),freshness:meta.freshness,quality:meta.quality});
    }
  }
}
const handler=createHandler();
module.exports=handler;
module.exports.createHandler=createHandler;
module.exports.parseSimpleCsv=parseSimpleCsv;
module.exports.aggregateWeekly=aggregateWeekly;
module.exports.ASSETS=ASSETS;
