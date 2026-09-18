globalThis.M24Cftc = (() => {
  const BASE='https://publicreporting.cftc.gov/resource/gpe5-46if.json';
  const MARKET_CODES=Object.freeze({BTC:'133741'});
  const DAY_MS=86400000;
  const num=v=>v==null||v===''?null:(Number.isFinite(Number(v))?Number(v):null);
  const isoDate=v=>new Date(v).toISOString().slice(0,10);
  const addDays=(date,days)=>new Date(new Date(date).getTime()+days*DAY_MS);
  const publicationAt=reportDate=>`${isoDate(addDays(`${reportDate}T00:00:00Z`,3))}T23:59:59.999Z`;

  class CftcSourceError extends Error{
    constructor(code,message,detail={}){super(message);this.name='CftcSourceError';this.code=code;this.detail=detail}
  }

  function normalize(row){
    const reportDate=isoDate(row.report_date_as_yyyy_mm_dd);
    const net=(a,b)=>num(a)!=null&&num(b)!=null?num(a)-num(b):null;
    return {
      reportDate,
      publishedAt:publicationAt(reportDate),
      marketName:row.market_and_exchange_names||row.contract_market_name||null,
      contractMarketCode:String(row.cftc_contract_market_code||''),
      openInterest:num(row.open_interest_all),
      dealer:{long:num(row.dealer_positions_long_all),short:num(row.dealer_positions_short_all),net:net(row.dealer_positions_long_all,row.dealer_positions_short_all)},
      assetManager:{long:num(row.asset_mgr_positions_long),short:num(row.asset_mgr_positions_short),net:net(row.asset_mgr_positions_long,row.asset_mgr_positions_short)},
      leveragedMoney:{long:num(row.lev_money_positions_long),short:num(row.lev_money_positions_short),net:net(row.lev_money_positions_long,row.lev_money_positions_short)},
      otherReportable:{long:num(row.other_rept_positions_long),short:num(row.other_rept_positions_short),net:net(row.other_rept_positions_long,row.other_rept_positions_short)},
      nonReportable:{long:num(row.nonrept_positions_long_all),short:num(row.nonrept_positions_short_all),net:net(row.nonrept_positions_long_all,row.nonrept_positions_short_all)}
    };
  }

  function latestAvailable(records,checkpointDate){
    const cutoff=new Date(`${checkpointDate}T23:59:59.999Z`).getTime();
    return records.filter(x=>new Date(x.publishedAt).getTime()<=cutoff).sort((a,b)=>new Date(b.publishedAt)-new Date(a.publishedAt))[0]||null;
  }

  function pct(a,b){
    if(!Number.isFinite(a)||!Number.isFinite(b)||a===0) return null;
    return Number((((b/a)-1)*100).toFixed(2));
  }

  function analyzeAtCheckpoints(records,caseSchema,labResult){
    const first=latestAvailable(records,labResult.firstTop.date);
    const second=latestAvailable(records,labResult.secondTop.date);
    const gaps=[];
    if(!first) gaps.push({type:'SOURCE_GAP',domain:'DERIVATIVES',metric:'CFTC_TFF',checkpoint:'firstTop',reason:'NO_PUBLISHED_REPORT_AVAILABLE'});
    if(!second) gaps.push({type:'SOURCE_GAP',domain:'DERIVATIVES',metric:'CFTC_TFF',checkpoint:'secondTop',reason:'NO_PUBLISHED_REPORT_AVAILABLE'});
    const wrap=(x,date)=>x?{
      date,asOf:x.publishedAt,count:1,reportDate:x.reportDate,publishedAt:x.publishedAt,
      openInterest:x.openInterest,dealer:x.dealer,assetManager:x.assetManager,leveragedMoney:x.leveragedMoney,
      otherReportable:x.otherReportable,nonReportable:x.nonReportable
    }:{date,asOf:null,count:0};
    const f=wrap(first,labResult.firstTop.date),s=wrap(second,labResult.secondTop.date);
    return {
      type:'DERIVATIVES_CONTEXT',caseId:caseSchema.id,asset:caseSchema.asset,
      evidenceFamily:'FUTURES_POSITIONING',sourceMode:'CFTC_TFF_FUTURES_ONLY',
      firstTop:f,secondTop:s,
      comparison:first&&second?{
        openInterestChangePct:pct(first.openInterest,second.openInterest),
        leveragedMoneyNetChange:Number((second.leveragedMoney.net-first.leveragedMoney.net).toFixed(2)),
        assetManagerNetChange:Number((second.assetManager.net-first.assetManager.net).toFixed(2)),
        dealerNetChange:Number((second.dealer.net-first.dealer.net).toFixed(2))
      }:null,
      sourceGaps:gaps,
      coverageProfile:'FUTURES_POSITIONING',
      availabilityPolicy:'CFTC weekly COT: Tuesday positions, standard Friday publication; M99 conservatively admits the report after Friday day-end.',
      note:'CFTC TFF positioning is aggregate regulated-futures positioning. It is not perpetual funding, not named-trader flow and not actor intent.'
    };
  }

  class TffProvider{
    constructor({fetchImpl=globalThis.fetch,baseUrl=BASE,nowFn=()=>Date.now()}={}){
      if(typeof fetchImpl!=='function') throw new Error('TffProvider requires fetch.');
      this.fetchImpl=fetchImpl;this.baseUrl=baseUrl;this.nowFn=nowFn;
    }
    marketCode(asset){
      const code=MARKET_CODES[asset];
      if(!code) throw new CftcSourceError('UNSUPPORTED_ASSET',`No CFTC TFF market code for ${asset}.`,{asset});
      return code;
    }
    async fetchHistory({asset,start,end}={}){
      const code=this.marketCode(asset);
      const from=isoDate(start),to=isoDate(end);
      const where=`cftc_contract_market_code='${code}' AND report_date_as_yyyy_mm_dd >= '${from}T00:00:00.000' AND report_date_as_yyyy_mm_dd <= '${to}T23:59:59.999'`;
      const params=new URLSearchParams({'$where':where,'$order':'report_date_as_yyyy_mm_dd ASC','$limit':'5000'});
      const url=`${this.baseUrl}?${params.toString()}`;
      const response=await this.fetchImpl(url,{method:'GET',headers:{Accept:'application/json'}});
      if(!response?.ok) throw new CftcSourceError('SOURCE_REQUEST_FAILED',`CFTC TFF request failed: ${response?.status??'NETWORK'}.`,{url,status:response?.status??null});
      const rows=await response.json();
      const records=(Array.isArray(rows)?rows:[]).map(normalize).sort((a,b)=>new Date(a.reportDate)-new Date(b.reportDate));
      if(!records.length) throw new CftcSourceError('NO_ROWS','CFTC TFF returned no rows for requested market/window.',{asset,code,from,to,url});
      return {
        asset,marketCode:code,records,
        provenance:[{sourceId:'CFTC-TFF-FUTURES-ONLY',datasetId:'gpe5-46if',sourceType:'PRIMARY_REGULATOR_OPEN_DATA',quality:'PRIMARY_REGULATOR',url,retrievedAt:new Date(this.nowFn()).toISOString()}],
        sourceMode:'CFTC_TFF_FUTURES_ONLY'
      };
    }
  }

  return {BASE,MARKET_CODES,CftcSourceError,TffProvider,normalize,publicationAt,latestAvailable,analyzeAtCheckpoints};
})();