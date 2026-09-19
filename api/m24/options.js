'use strict';

const DERIBIT='https://www.deribit.com/api/v2';
const SUPPORTED=Object.freeze({BTC:'BTC',ETH:'ETH',SOL:'SOL'});
const DAY_MS=86400000;
const MONTHS=Object.freeze({JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11});

const finite=v=>String(v??'').trim()!==''&&Number.isFinite(Number(v));
const round=(n,d=2)=>Number(Number(n).toFixed(d));

function parseExpiry(code){
  const m=String(code||'').toUpperCase().match(/^(\d{1,2})([A-Z]{3})(\d{2})$/);
  if(!m||MONTHS[m[2]]==null) return null;
  const year=2000+Number(m[3]);
  return Date.UTC(year,MONTHS[m[2]],Number(m[1]),8,0,0,0);
}

function parseInstrument(name){
  const p=String(name||'').split('-');
  if(p.length<4) return null;
  const expiryMs=parseExpiry(p[1]);
  const strike=Number(p[2]);
  const side=String(p[3]||'').toUpperCase();
  if(!expiryMs||!Number.isFinite(strike)||!['C','P'].includes(side)) return null;
  return {instrumentName:String(name),base:p[0],expiryMs,strike,side};
}

function median(values){
  const x=values.filter(Number.isFinite).sort((a,b)=>a-b);
  if(!x.length) return null;
  const mid=Math.floor(x.length/2);
  return x.length%2?x[mid]:(x[mid-1]+x[mid])/2;
}

function normalizeRows(raw){
  return (Array.isArray(raw)?raw:[]).map(item=>{
    const parsed=parseInstrument(item.instrument_name);
    if(!parsed) return null;
    return {
      ...parsed,
      markIv:finite(item.mark_iv)?Number(item.mark_iv):null,
      openInterest:finite(item.open_interest)?Number(item.open_interest):0,
      volume:finite(item.volume)?Number(item.volume):0,
      volumeUsd:finite(item.volume_usd)?Number(item.volume_usd):null,
      underlyingPrice:finite(item.underlying_price)?Number(item.underlying_price):null
    };
  }).filter(Boolean);
}

function expiryMetrics(rows,expiryMs){
  const selected=rows.filter(x=>x.expiryMs===expiryMs);
  if(!selected.length) return null;
  const underlying=median(selected.map(x=>x.underlyingPrice));
  const strikes=[...new Set(selected.map(x=>x.strike))].sort((a,b)=>a-b);
  const nearestStrike=underlying==null?strikes[Math.floor(strikes.length/2)]:strikes.reduce((best,s)=>Math.abs(s-underlying)<Math.abs(best-underlying)?s:best,strikes[0]);
  const atStrike=selected.filter(x=>x.strike===nearestStrike);
  const call=atStrike.find(x=>x.side==='C'&&x.markIv!=null) || selected.filter(x=>x.side==='C'&&x.markIv!=null).sort((a,b)=>Math.abs(a.strike-nearestStrike)-Math.abs(b.strike-nearestStrike))[0] || null;
  const put=atStrike.find(x=>x.side==='P'&&x.markIv!=null) || selected.filter(x=>x.side==='P'&&x.markIv!=null).sort((a,b)=>Math.abs(a.strike-nearestStrike)-Math.abs(b.strike-nearestStrike))[0] || null;
  const ivs=[call?.markIv,put?.markIv].filter(Number.isFinite);
  const atmIv=ivs.length?round(ivs.reduce((a,b)=>a+b,0)/ivs.length,2):null;
  const atmSkew=call?.markIv!=null&&put?.markIv!=null?round(put.markIv-call.markIv,2):null;
  const putOi=selected.filter(x=>x.side==='P').reduce((a,b)=>a+b.openInterest,0);
  const callOi=selected.filter(x=>x.side==='C').reduce((a,b)=>a+b.openInterest,0);
  const putCallOiRatio=callOi>0?round(putOi/callOi,3):null;
  return {
    expiry:new Date(expiryMs).toISOString(),
    expiryDate:new Date(expiryMs).toISOString().slice(0,10),
    underlyingPrice:underlying==null?null:round(underlying,2),
    atmStrike:nearestStrike,
    atmIv,
    atmCallIv:call?.markIv??null,
    atmPutIv:put?.markIv??null,
    atmPutCallIvSkew:atmSkew,
    putOpenInterest:round(putOi,4),
    callOpenInterest:round(callOi,4),
    totalOpenInterest:round(putOi+callOi,4),
    putCallOiRatio,
    optionCount:selected.length
  };
}

function chooseExpiries(rows,nowMs=Date.now()){
  const expiries=[...new Set(rows.map(x=>x.expiryMs))].filter(x=>x>nowMs).sort((a,b)=>a-b);
  if(!expiries.length) return {front:null,back:null};
  const days=x=>(x-nowMs)/DAY_MS;
  const front=expiries.find(x=>days(x)>=5) ?? expiries[0];
  const back=expiries.find(x=>x>front&&days(x)>=30) ?? expiries.find(x=>x>front) ?? null;
  return {front,back};
}

function interpret(front,back){
  if(!front) return {skew:'INSUFFICIENT_DATA',termStructure:'INSUFFICIENT_DATA',positioning:'INSUFFICIENT_DATA'};
  const skew=front.atmPutCallIvSkew==null?'INSUFFICIENT_DATA':front.atmPutCallIvSkew>3?'PUT_IV_RICH':front.atmPutCallIvSkew<-3?'CALL_IV_RICH':'ATM_SKEW_BALANCED';
  const ratio=front.putCallOiRatio;
  const positioning=ratio==null?'INSUFFICIENT_DATA':ratio>1.25?'PUT_OI_HEAVY':ratio<0.8?'CALL_OI_HEAVY':'PUT_CALL_OI_BALANCED';
  let termStructure='INSUFFICIENT_DATA';
  let termSpread=null;
  if(back?.atmIv!=null&&front.atmIv!=null){
    termSpread=round(back.atmIv-front.atmIv,2);
    termStructure=termSpread>3?'BACK_IV_HIGHER':termSpread<-3?'FRONT_IV_HIGHER':'IV_CURVE_FLAT';
  }
  return {skew,termStructure,termSpreadVolPoints:termSpread,positioning};
}

function summarize(raw,{asset,nowMs=Date.now(),retrievedAt=new Date().toISOString()}={}){
  const rows=normalizeRows(raw);
  const {front,back}=chooseExpiries(rows,nowMs);
  const frontMetrics=front?expiryMetrics(rows,front):null;
  const backMetrics=back?expiryMetrics(rows,back):null;
  if(!frontMetrics) throw new Error('SOURCE_GAP_NO_USABLE_OPTIONS');
  const interpretation=interpret(frontMetrics,backMetrics);
  return {
    schema:'m24.options.live.v0.1',
    asset,
    sourceStatus:'OK',
    freshness:'LIVE_OPTIONS',
    quality:'PRIMARY_OPTIONS_EXCHANGE',
    retrievedAt,
    asOf:retrievedAt,
    front:frontMetrics,
    back:backMetrics,
    interpretation:{
      ...interpretation,
      note:'ATM IV, ATM put-call IV skew and put/call open interest are options-market context. They are not calibrated probabilities or standalone trade signals.'
    },
    provenance:[{
      sourceId:'DERIBIT-OPTIONS-BOOK-SUMMARY',
      sourceType:'PRIMARY_OPTIONS_EXCHANGE_API',
      quality:'PRIMARY_OPTIONS_EXCHANGE',
      endpoint:'/public/get_book_summary_by_currency',
      retrievedAt
    }]
  };
}

function createHandler({fetchImpl=globalThis.fetch,nowFn=()=>Date.now()}={}){
  return async function handler(req,res){
    res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate=180');
    const asset=String(req.query?.asset||'BTC').toUpperCase();
    const currency=SUPPORTED[asset];
    if(!currency) return res.status(200).json({
      schema:'m24.options.live.v0.1',
      asset,
      sourceStatus:'NOT_APPLICABLE',
      freshness:'N/A',
      quality:'N/A',
      reason:'NO_SUPPORTED_OPTIONS_SOURCE',
      supported:Object.keys(SUPPORTED)
    });
    const url=`${DERIBIT}/public/get_book_summary_by_currency?currency=${encodeURIComponent(currency)}&kind=option`;
    try{
      const r=await fetchImpl(url,{headers:{Accept:'application/json'}});
      if(!r?.ok) throw new Error(`DERIBIT_${r?.status??'NETWORK'}`);
      const payload=await r.json();
      if(!Array.isArray(payload?.result)) throw new Error('DERIBIT_SHAPE_INVALID');
      return res.status(200).json(summarize(payload.result,{asset,nowMs:nowFn()}));
    }catch(err){
      return res.status(502).json({
        schema:'m24.options.live.v0.1',
        asset,
        sourceStatus:'SOURCE_GAP',
        freshness:'SOURCE_GAP',
        quality:'PRIMARY_OPTIONS_EXCHANGE',
        error:String(err.message||err),
        retrievedAt:new Date().toISOString()
      });
    }
  };
}

const handler=createHandler();
module.exports=handler;
module.exports.createHandler=createHandler;
module.exports.parseExpiry=parseExpiry;
module.exports.parseInstrument=parseInstrument;
module.exports.normalizeRows=normalizeRows;
module.exports.expiryMetrics=expiryMetrics;
module.exports.chooseExpiries=chooseExpiries;
module.exports.interpret=interpret;
module.exports.summarize=summarize;
module.exports.SUPPORTED=SUPPORTED;
