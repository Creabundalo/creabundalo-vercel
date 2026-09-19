'use strict';

const BINANCE='https://fapi.binance.com';
const ASSETS=Object.freeze({BTC:'BTCUSDT',ETH:'ETHUSDT',SOL:'SOLUSDT'});

const finite=v=>String(v??'').trim()!==''&&Number.isFinite(Number(v));
const round=(n,d=8)=>Number(Number(n).toFixed(d));
const pct=(a,b)=>Number.isFinite(a)&&a!==0&&Number.isFinite(b)?round(((b/a)-1)*100,2):null;

async function json(fetchImpl,url){
  const r=await fetchImpl(url,{headers:{Accept:'application/json'}});
  if(!r?.ok) throw new Error(`BINANCE_${r?.status??'NETWORK'}`);
  return r.json();
}

function summarize({asset,symbol,premium,funding,oi,retrievedAt=new Date().toISOString()}){
  const fundingRows=(Array.isArray(funding)?funding:[])
    .filter(x=>finite(x.fundingRate)&&finite(x.fundingTime))
    .map(x=>({fundingRate:Number(x.fundingRate),fundingTime:Number(x.fundingTime)}))
    .sort((a,b)=>a.fundingTime-b.fundingTime);
  const oiRows=(Array.isArray(oi)?oi:[])
    .filter(x=>finite(x.sumOpenInterest)&&finite(x.timestamp))
    .map(x=>({openInterest:Number(x.sumOpenInterest),timestamp:Number(x.timestamp)}))
    .sort((a,b)=>a.timestamp-b.timestamp);

  const avgFunding=fundingRows.length
    ? round(fundingRows.reduce((s,x)=>s+x.fundingRate,0)/fundingRows.length,8)
    : null;
  const currentFunding=finite(premium?.lastFundingRate)?Number(premium.lastFundingRate):(fundingRows.at(-1)?.fundingRate??null);
  const oiNow=oiRows.at(-1)?.openInterest??null;
  const oiThen=oiRows[0]?.openInterest??null;
  const oiChangePct=pct(oiThen,oiNow);

  let leverageReading='INSUFFICIENT_DATA';
  if(oiChangePct!=null&&currentFunding!=null){
    if(oiChangePct>3&&currentFunding>0.0001) leverageReading='LONG_LEVERAGE_EXPANDING';
    else if(oiChangePct>3&&currentFunding<0) leverageReading='SHORT_LEVERAGE_EXPANDING';
    else if(oiChangePct<-3) leverageReading='LEVERAGE_CONTRACTING';
    else leverageReading='LEVERAGE_STABLE';
  }

  return {
    schema:'m24.derivatives.live.v0.1',
    asset,
    symbol,
    retrievedAt,
    asOf:oiRows.length?new Date(oiRows.at(-1).timestamp).toISOString():retrievedAt,
    sourceStatus:'OK',
    freshness:'LIVE_DERIVATIVES',
    quality:'PRIMARY_EXCHANGE_DERIVATIVES',
    funding:{
      currentRate:currentFunding,
      averageRecentRate:avgFunding,
      observations:fundingRows.length,
      nextFundingTime:finite(premium?.nextFundingTime)?Number(premium.nextFundingTime):null,
      markPrice:finite(premium?.markPrice)?Number(premium.markPrice):null
    },
    openInterest:{
      current:oiNow,
      changeRecentPct:oiChangePct,
      observations:oiRows.length
    },
    interpretation:{
      leverageReading,
      note:'Funding and open interest describe positioning/leverage context. They do not prove actor intent or manipulation.'
    },
    provenance:[
      {sourceId:'BINANCE-USDM-PREMIUM-INDEX',quality:'PRIMARY_EXCHANGE_DERIVATIVES',endpoint:'/fapi/v1/premiumIndex',retrievedAt},
      {sourceId:'BINANCE-USDM-FUNDING-RATE',quality:'PRIMARY_EXCHANGE_DERIVATIVES',endpoint:'/fapi/v1/fundingRate',retrievedAt},
      {sourceId:'BINANCE-USDM-OPEN-INTEREST',quality:'PRIMARY_EXCHANGE_DERIVATIVES_RECENT',endpoint:'/futures/data/openInterestHist',retrievedAt}
    ]
  };
}

function createHandler({fetchImpl=globalThis.fetch}={}){
  return async function handler(req,res){
    res.setHeader('Cache-Control','s-maxage=30, stale-while-revalidate=120');
    const asset=String(req.query?.asset||'BTC').toUpperCase();
    const symbol=ASSETS[asset];
    if(!symbol) return res.status(200).json({
      schema:'m24.derivatives.live.v0.1',
      asset,
      sourceStatus:'NOT_APPLICABLE',
      freshness:'N/A',
      quality:'N/A',
      reason:'NO_SUPPORTED_DERIVATIVES_SOURCE',
      supported:Object.keys(ASSETS)
    });

    const premiumUrl=`${BINANCE}/fapi/v1/premiumIndex?symbol=${symbol}`;
    const fundingUrl=`${BINANCE}/fapi/v1/fundingRate?symbol=${symbol}&limit=24`;
    const oiUrl=`${BINANCE}/futures/data/openInterestHist?symbol=${symbol}&period=1h&limit=48`;

    try{
      const [premium,funding,oi]=await Promise.all([
        json(fetchImpl,premiumUrl),
        json(fetchImpl,fundingUrl),
        json(fetchImpl,oiUrl)
      ]);
      return res.status(200).json(summarize({asset,symbol,premium,funding,oi}));
    }catch(err){
      return res.status(502).json({
        schema:'m24.derivatives.live.v0.1',
        asset,
        symbol,
        sourceStatus:'SOURCE_GAP',
        freshness:'SOURCE_GAP',
        quality:'PRIMARY_EXCHANGE_DERIVATIVES',
        error:String(err.message||err),
        retrievedAt:new Date().toISOString()
      });
    }
  };
}

const handler=createHandler();
module.exports=handler;
module.exports.createHandler=createHandler;
module.exports.summarize=summarize;
module.exports.ASSETS=ASSETS;
