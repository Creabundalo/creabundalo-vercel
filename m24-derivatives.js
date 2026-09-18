globalThis.M24Derivatives = (() => {
  const USD_M_BASE='https://fapi.binance.com';
  const ARCHIVE_BASE='https://data.binance.vision/data/futures/um';
  const FUNDING_LIMIT=1000;
  const OPEN_INTEREST_RECENT_DAYS=30;
  const DAY_MS=86400000;
  const ASSET_TO_SYMBOL=Object.freeze({BTC:'BTCUSDT',ETH:'ETHUSDT',SOL:'SOLUSDT'});
  const OI_PERIODS=Object.freeze(['5m','15m','30m','1h','2h','4h','6h','12h','1d']);

  const SOURCE_CAPABILITIES=Object.freeze({
    fundingHistory:{source:'BINANCE_USDM_FUNDING_API',historical:true,endpoint:'/fapi/v1/fundingRate',maxRecords:FUNDING_LIMIT},
    openInterestRecent:{source:'BINANCE_USDM_OPEN_INTEREST_API',historical:'RECENT_ONLY',retentionDays:OPEN_INTEREST_RECENT_DAYS,endpoint:'/futures/data/openInterestHist'},
    openInterestArchive:{source:'BINANCE_VISION_METRICS',historical:true,transport:'ZIP_CSV',path:'daily/metrics'},
    fundingArchive:{source:'BINANCE_VISION_FUNDING',historical:true,transport:'ZIP_CSV',path:'monthly/fundingRate'}
  });

  class DerivativesSourceError extends Error {
    constructor(code,message,detail={}){super(message);this.name='DerivativesSourceError';this.code=code;this.detail=detail}
  }

  const number=value=>Number(value);
  const isFiniteNumber=value=>Number.isFinite(number(value));
  const ms=value=>new Date(value).getTime();
  const isoDate=value=>new Date(value).toISOString().slice(0,10);
  const round=(n,d=8)=>Number(Number(n).toFixed(d));

  function validateRange(start,end){
    const startMs=ms(start),endMs=ms(end);
    if(!Number.isFinite(startMs)||!Number.isFinite(endMs)||endMs<=startMs) throw new DerivativesSourceError('INVALID_RANGE','Invalid derivatives time range.',{start,end});
    return {startMs,endMs};
  }

  function summarizeWindow(records,window){
    const from=ms(window.from),to=ms(`${window.to}T23:59:59.999Z`);
    const selected=records.filter(x=>x.fundingTime>=from&&x.fundingTime<=to);
    if(!selected.length) return {count:0,avgFundingRate:null,positiveShare:null,maxFundingRate:null,minFundingRate:null};
    const rates=selected.map(x=>x.fundingRate);
    return {
      count:selected.length,
      avgFundingRate:round(rates.reduce((a,b)=>a+b,0)/rates.length),
      positiveShare:round(selected.filter(x=>x.fundingRate>0).length/selected.length,4),
      maxFundingRate:Math.max(...rates),
      minFundingRate:Math.min(...rates)
    };
  }

  function analyzeFundingAroundCase(records,caseDef){
    if(!caseDef?.checkpointWindows?.firstTop||!caseDef?.checkpointWindows?.secondTop) throw new DerivativesSourceError('CASE_WINDOWS_MISSING','Case needs firstTop and secondTop windows.');
    const firstTop=summarizeWindow(records,caseDef.checkpointWindows.firstTop);
    const secondTop=summarizeWindow(records,caseDef.checkpointWindows.secondTop);
    const comparable=firstTop.count>0&&secondTop.count>0;
    const delta=comparable?round(secondTop.avgFundingRate-firstTop.avgFundingRate):null;
    let crowdingShift='INSUFFICIENT_DATA';
    if(comparable) crowdingShift=delta>0?'MORE_POSITIVE_AT_SECOND_TOP':delta<0?'LESS_POSITIVE_AT_SECOND_TOP':'UNCHANGED';
    return {
      type:'DERIVATIVES_FUNDING_CONTEXT',
      caseId:caseDef.id,
      asset:caseDef.asset,
      firstTop,
      secondTop,
      comparison:{avgFundingDelta:delta,crowdingShift},
      interpretation:'Funding is positioning/leverage context, not proof of actor intent or manipulation.'
    };
  }

  class BinanceDerivativesProvider {
    constructor({fetchImpl=globalThis.fetch,baseUrl=USD_M_BASE,archiveBase=ARCHIVE_BASE,nowFn=()=>Date.now()}={}){
      if(typeof fetchImpl!=='function') throw new Error('BinanceDerivativesProvider requires fetch.');
      this.fetchImpl=fetchImpl;this.baseUrl=String(baseUrl).replace(/\/$/,'');this.archiveBase=String(archiveBase).replace(/\/$/,'');this.nowFn=nowFn;
    }

    symbolForAsset(asset){
      const symbol=ASSET_TO_SYMBOL[asset];
      if(!symbol) throw new DerivativesSourceError('UNSUPPORTED_ASSET',`No Binance USD-M mapping for ${asset}.`,{asset});
      return symbol;
    }

    async requestJson(url){
      const response=await this.fetchImpl(url,{method:'GET',headers:{Accept:'application/json'}});
      if(!response||!response.ok) throw new DerivativesSourceError('SOURCE_REQUEST_FAILED',`Binance derivatives request failed: ${response?.status??'NETWORK'}.`,{url,status:response?.status??null});
      const payload=await response.json();
      if(!Array.isArray(payload)) throw new DerivativesSourceError('SOURCE_SHAPE_INVALID','Expected an array from Binance derivatives source.',{url});
      return payload;
    }

    async fetchFundingHistory({asset,start,end,limit=FUNDING_LIMIT}={}){
      const symbol=this.symbolForAsset(asset);
      const {startMs,endMs}=validateRange(start,end);
      const pageLimit=Math.min(FUNDING_LIMIT,Math.max(1,Number(limit)||FUNDING_LIMIT));
      const byTime=new Map();
      let cursor=startMs,calls=0;
      while(cursor<=endMs){
        const params=new URLSearchParams({symbol,startTime:String(cursor),endTime:String(endMs),limit:String(pageLimit)});
        const url=`${this.baseUrl}/fapi/v1/fundingRate?${params.toString()}`;
        const payload=await this.requestJson(url);calls+=1;
        const rows=payload
          .filter(x=>isFiniteNumber(x.fundingTime)&&isFiniteNumber(x.fundingRate))
          .map(x=>({symbol:String(x.symbol||symbol),fundingTime:number(x.fundingTime),date:isoDate(number(x.fundingTime)),fundingRate:number(x.fundingRate),markPrice:isFiniteNumber(x.markPrice)?number(x.markPrice):null,rateType:x.rateType||null}))
          .sort((a,b)=>a.fundingTime-b.fundingTime);
        rows.forEach(x=>byTime.set(x.fundingTime,x));
        if(rows.length<pageLimit) break;
        const next=rows.at(-1).fundingTime+1;
        if(next<=cursor) throw new DerivativesSourceError('PAGINATION_STALLED','Funding pagination did not advance.',{cursor,next});
        cursor=next;
        if(calls>1000) throw new DerivativesSourceError('PAGINATION_GUARD','Funding pagination exceeded safety guard.');
      }
      return {
        asset,symbol,records:[...byTime.values()].filter(x=>x.fundingTime>=startMs&&x.fundingTime<=endMs).sort((a,b)=>a.fundingTime-b.fundingTime),
        provenance:[{sourceId:'BINANCE-USDM-FUNDING-RATE',sourceType:'AUTHORITATIVE_DERIVATIVES_API',quality:'PRIMARY_EXCHANGE_DERIVATIVES',endpoint:'/fapi/v1/fundingRate',retrievedAt:new Date(this.nowFn()).toISOString(),note:'Public USD-M perpetual funding history; read-only market data.'}]
      };
    }

    async fetchOpenInterestRecent({asset,start,end,period='1d',limit=500}={}){
      const symbol=this.symbolForAsset(asset);
      const {startMs,endMs}=validateRange(start,end);
      if(!OI_PERIODS.includes(period)) throw new DerivativesSourceError('UNSUPPORTED_PERIOD',`Unsupported open-interest period ${period}.`,{period});
      const oldestAllowed=this.nowFn()-(OPEN_INTEREST_RECENT_DAYS*DAY_MS);
      if(startMs<oldestAllowed) throw new DerivativesSourceError('HISTORY_WINDOW_EXCEEDED','Binance open-interest history API only exposes the recent retention window; use the Binance Vision metrics archive for older cases.',{retentionDays:OPEN_INTEREST_RECENT_DAYS,recommendedSource:'BINANCE_VISION_METRICS',archiveExample:this.metricsArchiveUrl(asset,isoDate(startMs))});
      const params=new URLSearchParams({symbol,period,startTime:String(startMs),endTime:String(endMs),limit:String(Math.min(500,Math.max(1,Number(limit)||500)))});
      const url=`${this.baseUrl}/futures/data/openInterestHist?${params.toString()}`;
      const payload=await this.requestJson(url);
      const records=payload.filter(x=>isFiniteNumber(x.timestamp)&&isFiniteNumber(x.sumOpenInterest)).map(x=>({
        symbol:String(x.symbol||symbol),timestamp:number(x.timestamp),date:isoDate(number(x.timestamp)),sumOpenInterest:number(x.sumOpenInterest),sumOpenInterestValue:isFiniteNumber(x.sumOpenInterestValue)?number(x.sumOpenInterestValue):null
      })).sort((a,b)=>a.timestamp-b.timestamp);
      return {asset,symbol,period,records,provenance:[{sourceId:'BINANCE-USDM-OPEN-INTEREST',sourceType:'AUTHORITATIVE_DERIVATIVES_API',quality:'PRIMARY_EXCHANGE_DERIVATIVES_RECENT',endpoint:'/futures/data/openInterestHist',retentionDays:OPEN_INTEREST_RECENT_DAYS,retrievedAt:new Date(this.nowFn()).toISOString()}]};
    }

    metricsArchiveUrl(asset,date){
      const symbol=this.symbolForAsset(asset);const stamp=isoDate(`${date}T00:00:00Z`);
      return `${this.archiveBase}/daily/metrics/${symbol}/${symbol}-metrics-${stamp}.zip`;
    }

    fundingArchiveUrl(asset,yearMonth){
      const symbol=this.symbolForAsset(asset);
      if(!/^\d{4}-\d{2}$/.test(String(yearMonth))) throw new DerivativesSourceError('INVALID_MONTH','Funding archive month must be YYYY-MM.',{yearMonth});
      return `${this.archiveBase}/monthly/fundingRate/${symbol}/${symbol}-fundingRate-${yearMonth}.zip`;
    }

    capabilities(){return structuredClone(SOURCE_CAPABILITIES)}
  }

  return {USD_M_BASE,ARCHIVE_BASE,FUNDING_LIMIT,OPEN_INTEREST_RECENT_DAYS,ASSET_TO_SYMBOL,OI_PERIODS,SOURCE_CAPABILITIES,DerivativesSourceError,BinanceDerivativesProvider,analyzeFundingAroundCase};
})();
