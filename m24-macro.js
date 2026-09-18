globalThis.M24Macro = (() => {
  const FRED_CSV='https://fred.stlouisfed.org/graph/fredgraph.csv';
  const DAY_MS=86400000;
  const SERIES=Object.freeze({
    ECB_DEPOSIT_RATE:Object.freeze({id:'ECBDFR',label:'ECB Deposit Facility Rate',family:'RATES',units:'percent',frequency:'daily',source:'European Central Bank',higherMeaning:'TIGHTER_EURO_RATE'}),
    FED_FUNDS:Object.freeze({id:'EFFR',label:'Effective Fed Funds Rate',family:'RATES',units:'percent',frequency:'daily',source:'Federal Reserve Bank of New York',higherMeaning:'TIGHTER_SHORT_RATE'}),
    FED_FUNDS_LEGACY:Object.freeze({id:'DFF',label:'Federal Funds Effective Rate',family:'RATES',units:'percent',frequency:'daily',source:'Board of Governors of the Federal Reserve System',higherMeaning:'TIGHTER_SHORT_RATE'}),
    TEN_YEAR:Object.freeze({id:'DGS10',label:'10Y Treasury Yield',family:'RATES',units:'percent',frequency:'daily',source:'Board of Governors of the Federal Reserve System',higherMeaning:'HIGHER_LONG_RATE'}),
    DOLLAR:Object.freeze({id:'DTWEXBGS',label:'Broad U.S. Dollar Index',family:'FX',units:'index',frequency:'daily',source:'Board of Governors of the Federal Reserve System',higherMeaning:'STRONGER_DOLLAR'}),
    RRP:Object.freeze({id:'RRPONTSYD',label:'Overnight Reverse Repo',family:'LIQUIDITY',units:'billions_usd',frequency:'daily',source:'Federal Reserve Bank of New York',higherMeaning:'MORE_RRP_USAGE'}),
    FED_ASSETS:Object.freeze({id:'WALCL',label:'Federal Reserve Total Assets',family:'LIQUIDITY',units:'millions_usd',frequency:'weekly',source:'Board of Governors of the Federal Reserve System',higherMeaning:'LARGER_FED_BALANCE_SHEET'}),
    FIN_CONDITIONS:Object.freeze({id:'NFCI',label:'Chicago Fed National Financial Conditions Index',family:'CREDIT',units:'index',frequency:'weekly',source:'Federal Reserve Bank of Chicago',higherMeaning:'TIGHTER_FINANCIAL_CONDITIONS'}),
    WTI:Object.freeze({id:'DCOILWTICO',label:'WTI Crude Oil',family:'COMMODITY',units:'usd_per_barrel',frequency:'daily',source:'U.S. Energy Information Administration',higherMeaning:'HIGHER_OIL_PRICE'})
  });

  const byId=Object.freeze(Object.fromEntries(Object.entries(SERIES).map(([key,value])=>[value.id,{key,...value}])));
  const ms=value=>new Date(value).getTime();
  const finite=value=>{const s=String(value??'').trim();return s!==''&&s!=='.'&&Number.isFinite(Number(s))};
  const round=(n,d=4)=>Number(Number(n).toFixed(d));

  class MacroSourceError extends Error{
    constructor(code,message,detail={}){super(message);this.name='MacroSourceError';this.code=code;this.detail=detail}
  }

  function parseFredCsv(text,seriesId){
    const lines=String(text||'').trim().split(/\r?\n/);
    if(lines.length<2) return [];
    const header=lines[0].split(',').map(x=>x.trim());
    const dateIndex=header.findIndex(x=>x==='DATE'||x==='observation_date');
    const valueIndex=header.findIndex(x=>x===seriesId);
    if(dateIndex<0||valueIndex<0) throw new MacroSourceError('CSV_SHAPE_INVALID',`FRED CSV missing DATE/${seriesId} columns.`,{header});
    return lines.slice(1).map(line=>line.split(',')).filter(cols=>cols.length>Math.max(dateIndex,valueIndex)).map(cols=>({date:cols[dateIndex].trim(),value:cols[valueIndex].trim()})).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&finite(x.value)).map(x=>({date:x.date,time:ms(`${x.date}T00:00:00Z`),value:Number(x.value)}));
  }

  function closestOnOrBefore(records,date,maxLagDays=10){
    const target=ms(`${date}T23:59:59Z`);
    const candidate=records.filter(x=>x.time<=target).sort((a,b)=>b.time-a.time)[0]||null;
    if(!candidate) return null;
    const lagDays=(target-candidate.time)/DAY_MS;
    return lagDays<=maxLagDays?{...candidate,lagDays:round(lagDays,2)}:null;
  }

  function compareAtCheckpoints(seriesResult,labResult){
    const meta=seriesResult.meta;
    const firstDate=String(labResult.firstTop?.asOf||labResult.firstTop.date).slice(0,10);
    const secondDate=String(labResult.secondTop?.asOf||labResult.secondTop.date).slice(0,10);
    const first=closestOnOrBefore(seriesResult.records,firstDate,meta.frequency==='weekly'?10:5);
    const second=closestOnOrBefore(seriesResult.records,secondDate,meta.frequency==='weekly'?10:5);
    const delta=first&&second?round(second.value-first.value):null;
    const pctDelta=first&&second&&first.value!==0?round(((second.value/first.value)-1)*100,2):null;
    return {key:seriesResult.key,seriesId:meta.id,label:meta.label,family:meta.family,units:meta.units,higherMeaning:meta.higherMeaning,firstTop:first,secondTop:second,delta,pctDelta,status:first&&second?'COMPARABLE':'SOURCE_GAP',provenance:seriesResult.provenance};
  }

  function analyzeBundleAtCheckpoints(bundle,labResult){
    const series=Object.values(bundle.series||{}).map(x=>compareAtCheckpoints(x,labResult));
    return {
      type:'MACRO_CROSS_ASSET_CONTEXT',
      caseId:labResult.caseId,
      firstTopDate:labResult.firstTop.date,
      secondTopDate:labResult.secondTop.date,
      series,
      gaps:series.filter(x=>x.status==='SOURCE_GAP').map(x=>({seriesId:x.seriesId,label:x.label,reason:'NO_OBSERVATION_WITHIN_ALLOWED_LAG'})),
      note:'Macro/cross-asset observations are context. M24 does not infer a single causal direction from one series.'
    };
  }

  class FredCsvProvider{
    constructor({fetchImpl=globalThis.fetch,baseUrl=FRED_CSV,nowFn=()=>Date.now()}={}){
      if(typeof fetchImpl!=='function') throw new Error('FredCsvProvider requires fetch.');
      this.fetchImpl=fetchImpl;this.baseUrl=baseUrl;this.nowFn=nowFn;
    }

    meta(key){const meta=SERIES[key];if(!meta) throw new MacroSourceError('UNKNOWN_SERIES',`Unknown macro series ${key}.`,{key});return meta}

    async fetchSeries(key,{start,end}={}){
      const meta=this.meta(key);
      const startMs=ms(start),endMs=ms(end);
      if(!Number.isFinite(startMs)||!Number.isFinite(endMs)||endMs<=startMs) throw new MacroSourceError('INVALID_RANGE','Invalid macro time range.',{start,end});
      const params=new URLSearchParams({id:meta.id,cosd:new Date(startMs).toISOString().slice(0,10),coed:new Date(endMs).toISOString().slice(0,10)});
      const url=`${this.baseUrl}?${params.toString()}`;
      const response=await this.fetchImpl(url,{method:'GET',headers:{Accept:'text/csv'}});
      if(!response||!response.ok) throw new MacroSourceError('SOURCE_REQUEST_FAILED',`FRED CSV request failed: ${response?.status??'NETWORK'}.`,{key,url,status:response?.status??null});
      const text=await response.text();
      const records=parseFredCsv(text,meta.id).filter(x=>x.time>=startMs&&x.time<=endMs);
      return {key,meta:structuredClone(meta),records,provenance:[{sourceId:`FRED-${meta.id}`,sourceType:'OFFICIAL_SERIES_VIA_FRED',quality:'PRIMARY_OR_OFFICIAL_UPSTREAM',seriesId:meta.id,upstreamSource:meta.source,retrievedAt:new Date(this.nowFn()).toISOString(),note:'Read-only historical macro/cross-asset series. Missing observations remain missing.'}]};
    }

    async fetchBundle(keys,{start,end}={}){
      const entries=await Promise.all(keys.map(async key=>[key,await this.fetchSeries(key,{start,end})]));
      return {window:{start,end},series:Object.fromEntries(entries)};
    }
  }

  return {FRED_CSV,SERIES,MacroSourceError,FredCsvProvider,parseFredCsv,closestOnOrBefore,compareAtCheckpoints,analyzeBundleAtCheckpoints};
})();
