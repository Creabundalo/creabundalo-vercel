globalThis.M24FredMarket = (() => {
  const FRED_CSV='https://fred.stlouisfed.org/graph/fredgraph.csv';
  const DAY_MS=86400000;
  const CHUNK_DAYS=365;
  const SERIES=Object.freeze({
    SPX:Object.freeze({id:'SP500',label:'S&P 500',source:'S&P Dow Jones Indices via FRED',priceBasis:'CLOSE_ONLY'}),
    NASDAQ:Object.freeze({id:'NASDAQCOM',label:'NASDAQ Composite',source:'Nasdaq via FRED',priceBasis:'CLOSE_ONLY'})
  });
  const ms=value=>new Date(value).getTime();
  const finite=value=>{const s=String(value??'').trim();return s!==''&&s!=='.'&&Number.isFinite(Number(s))};

  class FredMarketError extends Error{
    constructor(code,message,detail={}){super(message);this.name='FredMarketError';this.code=code;this.detail=detail}
  }

  function parseCsv(text,seriesId){
    const lines=String(text||'').trim().split(/\r?\n/);
    if(lines.length<2) return [];
    const header=lines[0].split(',').map(x=>x.trim());
    const dateIndex=header.findIndex(x=>x==='DATE'||x==='observation_date');
    const valueIndex=header.findIndex(x=>x===seriesId);
    if(dateIndex<0||valueIndex<0) throw new FredMarketError('CSV_SHAPE_INVALID',`FRED CSV missing DATE/${seriesId} columns.`,{header});
    return lines.slice(1).map(line=>line.split(',')).filter(cols=>cols.length>Math.max(dateIndex,valueIndex)).map(cols=>({
      date:cols[dateIndex].trim(),value:cols[valueIndex].trim()
    })).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&finite(x.value)).map(x=>({
      time:Math.floor(ms(`${x.date}T00:00:00Z`)/1000),date:x.date,close:Number(x.value)
    }));
  }

  class FredMarketProvider{
    constructor({fetchImpl=globalThis.fetch,baseUrl=FRED_CSV,nowFn=()=>Date.now()}={}){
      if(typeof fetchImpl!=='function') throw new Error('FredMarketProvider requires fetch.');
      this.fetchImpl=fetchImpl;this.baseUrl=baseUrl;this.nowFn=nowFn;
    }
    meta(asset){
      const meta=SERIES[asset];
      if(!meta) throw new FredMarketError('UNSUPPORTED_ASSET',`No FRED market mapping for ${asset}.`,{asset});
      return meta;
    }
    async getBarsForAsset(asset,{start,end}={}){
      const meta=this.meta(asset);
      const startMs=ms(start),endMs=ms(end);
      if(!Number.isFinite(startMs)||!Number.isFinite(endMs)||endMs<=startMs) throw new FredMarketError('INVALID_RANGE','Invalid market time range.',{start,end});
      const barsByDate=new Map();
      const urls=[];
      let cursor=startMs;
      while(cursor<=endMs){
        const chunkEnd=Math.min(endMs,cursor+(CHUNK_DAYS*DAY_MS));
        const params=new URLSearchParams({id:meta.id,cosd:new Date(cursor).toISOString().slice(0,10),coed:new Date(chunkEnd).toISOString().slice(0,10)});
        const url=`${this.baseUrl}?${params.toString()}`;
        urls.push(url);
        const response=await this.fetchImpl(url,{method:'GET',headers:{Accept:'text/csv'}});
        if(!response?.ok) throw new FredMarketError('SOURCE_REQUEST_FAILED',`FRED market CSV failed: ${response?.status??'NETWORK'}.`,{url,status:response?.status??null});
        parseCsv(await response.text(),meta.id).forEach(bar=>{
          if(bar.time*1000>=startMs&&bar.time*1000<=endMs) barsByDate.set(bar.date,bar);
        });
        if(chunkEnd>=endMs) break;
        cursor=chunkEnd+DAY_MS;
      }
      const bars=[...barsByDate.values()].sort((a,b)=>a.time-b.time);
      if(!bars.length) throw new FredMarketError('NO_ROWS','FRED market series returned no observations.',{asset,start,end});
      return {
        asset,seriesId:meta.id,priceBasis:meta.priceBasis,bars,
        provenance:[{sourceId:`FRED-${meta.id}`,sourceType:'OFFICIAL_SERIES_VIA_FRED',quality:'PRIMARY_OR_OFFICIAL_UPSTREAM',seriesId:meta.id,upstreamSource:meta.source,retrievedAt:new Date(this.nowFn()).toISOString(),chunkCount:urls.length,note:'Close-only index series fetched in bounded date chunks. M99 does not synthesize OHLC or volume.'}]
      };
    }
  }
  return {FRED_CSV,DAY_MS,CHUNK_DAYS,SERIES,FredMarketError,FredMarketProvider,parseCsv};
})();