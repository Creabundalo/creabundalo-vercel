globalThis.M24FundingArchive = (() => {
  const BASE='https://data.binance.vision/data/futures/um/monthly/fundingRate';
  const ASSET_TO_SYMBOL=Object.freeze({BTC:'BTCUSDT',ETH:'ETHUSDT',SOL:'SOLUSDT'});

  class FundingArchiveError extends Error{
    constructor(code,message,detail={}){super(message);this.name='FundingArchiveError';this.code=code;this.detail=detail}
  }

  const ms=value=>new Date(value).getTime();
  const finite=value=>Number.isFinite(Number(value));
  const day=value=>new Date(Number(value)).toISOString().slice(0,10);

  function monthsBetween(start,end){
    const s=new Date(start),e=new Date(end);
    if(!Number.isFinite(s.getTime())||!Number.isFinite(e.getTime())||e<=s) throw new FundingArchiveError('INVALID_RANGE','Invalid funding archive range.',{start,end});
    const out=[];let y=s.getUTCFullYear(),m=s.getUTCMonth();
    const ey=e.getUTCFullYear(),em=e.getUTCMonth();
    while(y<ey||(y===ey&&m<=em)){
      out.push(`${y}-${String(m+1).padStart(2,'0')}`);
      m+=1;if(m===12){m=0;y+=1;}
    }
    return out;
  }

  function parseCsvLine(line){
    const out=[];let value='',quoted=false;
    for(let i=0;i<line.length;i++){
      const ch=line[i];
      if(ch==='"'){
        if(quoted&&line[i+1]==='"'){value+='"';i+=1}else quoted=!quoted;
      }else if(ch===','&&!quoted){out.push(value);value=''}else value+=ch;
    }
    out.push(value);return out;
  }

  function parseFundingCsv(text,symbol=null){
    const lines=String(text||'').replace(/^\uFEFF/,'').trim().split(/\r?\n/).filter(Boolean);
    if(!lines.length) return [];
    const first=parseCsvLine(lines[0]).map(x=>x.trim());
    const hasHeader=first.some(x=>/[A-Za-z_]/.test(x));
    let rows=lines.map(parseCsvLine),timeIndex=0,rateIndex=null,symbolIndex=null;
    if(hasHeader){
      const header=first.map(x=>x.trim().toLowerCase());
      const find=(...names)=>header.findIndex(x=>names.includes(x));
      timeIndex=find('calc_time','fundingtime','funding_time','time','timestamp');
      rateIndex=find('last_funding_rate','fundingrate','funding_rate','rate');
      symbolIndex=find('symbol');
      if(timeIndex<0||rateIndex<0) throw new FundingArchiveError('CSV_SCHEMA_INVALID','Funding archive CSV missing time/rate columns.',{header});
      rows=rows.slice(1);
    }else{
      rateIndex=first.length-1;
    }
    return rows.map(cols=>{
      const rawTime=(cols[timeIndex]||'').trim();
      const timestamp=/^\d{10,13}$/.test(rawTime)?Number(rawTime)*(rawTime.length===10?1000:1):Date.parse(rawTime);
      const rawRate=(cols[rateIndex]||'').trim();
      if(!Number.isFinite(timestamp)||!finite(rawRate)) return null;
      return {
        symbol:symbolIndex>=0?String(cols[symbolIndex]||symbol||'').trim():(symbol||''),
        fundingTime:timestamp,
        date:day(timestamp),
        fundingRate:Number(rawRate),
        markPrice:null,
        rateType:'ARCHIVE'
      };
    }).filter(Boolean).sort((a,b)=>a.fundingTime-b.fundingTime);
  }

  class BinanceVisionFundingProvider{
    constructor({fetchImpl=globalThis.fetch,baseUrl=BASE,nowFn=()=>Date.now(),archiveTools=globalThis.M24BinanceVision}={}){
      if(typeof fetchImpl!=='function') throw new Error('BinanceVisionFundingProvider requires fetch.');
      if(!archiveTools?.unzipCsvEntries||!archiveTools?.sha256Hex||!archiveTools?.checksumHash) throw new Error('BinanceVisionFundingProvider requires M24BinanceVision archive tools.');
      this.fetchImpl=fetchImpl;this.baseUrl=String(baseUrl).replace(/\/$/,'');this.nowFn=nowFn;this.archiveTools=archiveTools;
    }
    symbolForAsset(asset){const symbol=ASSET_TO_SYMBOL[asset];if(!symbol)throw new FundingArchiveError('UNSUPPORTED_ASSET',`No Binance Vision funding mapping for ${asset}.`,{asset});return symbol}
    url(asset,yearMonth){const symbol=this.symbolForAsset(asset);return `${this.baseUrl}/${symbol}/${symbol}-fundingRate-${yearMonth}.zip`}
    async fetchMonth(asset,yearMonth){
      const symbol=this.symbolForAsset(asset),url=this.url(asset,yearMonth),checksumUrl=`${url}.CHECKSUM`;
      const [zipResponse,checksumResponse]=await Promise.all([
        this.fetchImpl(url,{method:'GET'}),
        this.fetchImpl(checksumUrl,{method:'GET',headers:{Accept:'text/plain'}})
      ]);
      if(!zipResponse?.ok){
        if(zipResponse?.status===404) return {asset,symbol,yearMonth,status:'SOURCE_GAP',records:[],reason:'ARCHIVE_MONTH_MISSING',url};
        throw new FundingArchiveError('ARCHIVE_REQUEST_FAILED',`Funding archive request failed: ${zipResponse?.status??'NETWORK'}.`,{url,status:zipResponse?.status??null});
      }
      if(!checksumResponse?.ok) throw new FundingArchiveError('CHECKSUM_REQUEST_FAILED',`Funding checksum request failed: ${checksumResponse?.status??'NETWORK'}.`,{checksumUrl,status:checksumResponse?.status??null});
      const [arrayBuffer,checksumText]=await Promise.all([zipResponse.arrayBuffer(),checksumResponse.text()]);
      const actual=await this.archiveTools.sha256Hex(arrayBuffer),expected=this.archiveTools.checksumHash(checksumText);
      if(actual!==expected) throw new FundingArchiveError('CHECKSUM_MISMATCH','Funding archive checksum mismatch.',{url,expected,actual});
      const entries=await this.archiveTools.unzipCsvEntries(arrayBuffer);
      const records=entries.flatMap(entry=>parseFundingCsv(entry.text,symbol));
      return {asset,symbol,yearMonth,status:records.length?'OK':'SOURCE_GAP',records,reason:records.length?null:'NO_FUNDING_ROWS',provenance:[{sourceId:'BINANCE-VISION-USDM-FUNDING',sourceType:'AUTHORITATIVE_PUBLIC_ARCHIVE',quality:'PRIMARY_EXCHANGE_DERIVATIVES_ARCHIVE',url,checksumUrl,sha256:actual,retrievedAt:new Date(this.nowFn()).toISOString()}]};
    }
    async fetchFundingHistory({asset,start,end}={}){
      const startMs=ms(start),endMs=ms(end);const months=monthsBetween(start,end);
      const chunks=[];
      for(const month of months) chunks.push(await this.fetchMonth(asset,month));
      const records=chunks.flatMap(x=>x.records||[]).filter(x=>x.fundingTime>=startMs&&x.fundingTime<=endMs).sort((a,b)=>a.fundingTime-b.fundingTime);
      const gaps=chunks.filter(x=>x.status!=='OK').map(x=>({yearMonth:x.yearMonth,reason:x.reason,url:x.url}));
      return {asset,symbol:this.symbolForAsset(asset),records,gaps,provenance:chunks.flatMap(x=>x.provenance||[]),sourceMode:'BINANCE_VISION_MONTHLY_FUNDING'};
    }
  }

  class BinanceHistoricalDerivativesProvider{
    constructor({fundingProvider=null,recentProvider=null}={}){
      this.fundingProvider=fundingProvider||new BinanceVisionFundingProvider();
      this.recentProvider=recentProvider||new M24Derivatives.BinanceDerivativesProvider();
    }
    fetchFundingHistory(args){return this.fundingProvider.fetchFundingHistory(args)}
    fetchOpenInterestRecent(args){return this.recentProvider.fetchOpenInterestRecent(args)}
    capabilities(){return {fundingHistory:{source:'BINANCE_VISION_FUNDING',historical:true},openInterestRecent:this.recentProvider.capabilities?.().openInterestRecent||null}}
  }

  return {BASE,ASSET_TO_SYMBOL,FundingArchiveError,monthsBetween,parseCsvLine,parseFundingCsv,BinanceVisionFundingProvider,BinanceHistoricalDerivativesProvider};
})();
