globalThis.M24CbsHousing = (() => {
  const BASE='https://opendata.cbs.nl/ODataApi/OData/85773NED';
  const DAY_MS=86400000;
  const monthEnd=(y,m)=>new Date(Date.UTC(y,m,0));
  const addDays=(d,n)=>new Date(d.getTime()+n*DAY_MS);
  const iso=d=>d.toISOString().slice(0,10);
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
  class CbsHousingError extends Error{constructor(code,message,detail={}){super(message);this.name='CbsHousingError';this.code=code;this.detail=detail}}

  function periodCodeToDate(code){
    const m=String(code||'').match(/^(\d{4})MM(0[1-9]|1[0-2])$/);
    if(!m) return null;
    return `${m[1]}-${m[2]}-01`;
  }
  function publicationDate(code){
    const m=String(code||'').match(/^(\d{4})MM(0[1-9]|1[0-2])$/);
    if(!m) return null;
    const end=monthEnd(Number(m[1]),Number(m[2]));
    return iso(addDays(end,22));
  }
  const PINNED_CBS_RELEASE_EXTRACT=Object.freeze([
    {date:'2021-11-01',periodCode:'2021MM11',publishedAt:'2021-12-22',priceIndex:124.0,yoyPct:20.1,transactions:null,transactionYoYPct:-13.0},
    {date:'2021-12-01',periodCode:'2021MM12',publishedAt:'2022-01-22',priceIndex:123.7,yoyPct:20.4,transactions:null,transactionYoYPct:-21.6},
    {date:'2022-01-01',periodCode:'2022MM01',publishedAt:'2022-02-22',priceIndex:127.4,yoyPct:21.1,transactions:14053,transactionYoYPct:-42.7},
    {date:'2022-02-01',periodCode:'2022MM02',publishedAt:'2022-03-22',priceIndex:127.9,yoyPct:20.2,transactions:null,transactionYoYPct:-16.8},
    {date:'2022-03-01',periodCode:'2022MM03',publishedAt:'2022-04-22',priceIndex:129.3,yoyPct:19.5,transactions:null,transactionYoYPct:-37.3},
    {date:'2022-04-01',periodCode:'2022MM04',publishedAt:'2022-05-22',priceIndex:130.7,yoyPct:19.7,transactions:null,transactionYoYPct:-15.7},
    {date:'2022-05-01',periodCode:'2022MM05',publishedAt:'2022-06-22',priceIndex:132.3,yoyPct:18.8,transactions:null,transactionYoYPct:-2.3},
    {date:'2022-06-01',periodCode:'2022MM06',publishedAt:'2022-07-22',priceIndex:132.4,yoyPct:16.6,transactions:null,transactionYoYPct:-11.6},
    {date:'2022-07-01',periodCode:'2022MM07',publishedAt:'2022-08-22',priceIndex:132.9,yoyPct:14.5,transactions:16417,transactionYoYPct:-13.8},
    {date:'2022-08-01',periodCode:'2022MM08',publishedAt:'2022-09-22',priceIndex:132.7,yoyPct:11.9,transactions:null,transactionYoYPct:null},
    {date:'2022-09-01',periodCode:'2022MM09',publishedAt:'2022-10-22',priceIndex:131.7,yoyPct:9.4,transactions:null,transactionYoYPct:null},
    {date:'2022-10-01',periodCode:'2022MM10',publishedAt:'2022-11-22',priceIndex:130.9,yoyPct:7.8,transactions:null,transactionYoYPct:null},
    {date:'2022-11-01',periodCode:'2022MM11',publishedAt:'2022-12-22',priceIndex:129.6,yoyPct:4.9,transactions:null,transactionYoYPct:null},
    {date:'2022-12-01',periodCode:'2022MM12',publishedAt:'2023-01-22',priceIndex:126.5,yoyPct:2.7,transactions:null,transactionYoYPct:null},
    {date:'2023-01-01',periodCode:'2023MM01',publishedAt:'2023-02-22',priceIndex:128.2,yoyPct:1.1,transactions:null,transactionYoYPct:null},
    {date:'2023-02-01',periodCode:'2023MM02',publishedAt:'2023-03-22',priceIndex:126.4,yoyPct:-1.2,transactions:null,transactionYoYPct:null},
    {date:'2023-03-01',periodCode:'2023MM03',publishedAt:'2023-04-22',priceIndex:125.9,yoyPct:-2.6,transactions:null,transactionYoYPct:null},
    {date:'2023-04-01',periodCode:'2023MM04',publishedAt:'2023-05-22',priceIndex:124.6,yoyPct:-4.7,transactions:null,transactionYoYPct:null},
    {date:'2023-05-01',periodCode:'2023MM05',publishedAt:'2023-06-22',priceIndex:124.6,yoyPct:-5.8,transactions:null,transactionYoYPct:null},
    {date:'2023-06-01',periodCode:'2023MM06',publishedAt:'2023-07-22',priceIndex:124.9,yoyPct:-5.7,transactions:null,transactionYoYPct:null},
    {date:'2023-07-01',periodCode:'2023MM07',publishedAt:'2023-08-22',priceIndex:125.6,yoyPct:-5.5,transactions:null,transactionYoYPct:null},
    {date:'2023-08-01',periodCode:'2023MM08',publishedAt:'2023-09-22',priceIndex:126.4,yoyPct:-4.7,transactions:null,transactionYoYPct:null},
    {date:'2023-09-01',periodCode:'2023MM09',publishedAt:'2023-10-22',priceIndex:127.2,yoyPct:-3.4,transactions:null,transactionYoYPct:null},
    {date:'2023-10-01',periodCode:'2023MM10',publishedAt:'2023-11-22',priceIndex:128.1,yoyPct:-2.1,transactions:null,transactionYoYPct:null},
    {date:'2023-11-01',periodCode:'2023MM11',publishedAt:'2023-12-22',priceIndex:128.7,yoyPct:-0.6,transactions:null,transactionYoYPct:null},
    {date:'2023-12-01',periodCode:'2023MM12',publishedAt:'2024-01-22',priceIndex:129.0,yoyPct:1.9,transactions:null,transactionYoYPct:null}
  ]);

  function pinnedRows(from,to){
    return PINNED_CBS_RELEASE_EXTRACT.filter(x=>x.date>=from&&x.date<=to).map(x=>structuredClone(x));
  }

  function pickProperty(props,needles){
    return (props||[]).find(p=>{
      if(p.Type==='TopicGroup'||!p.Key) return false;
      const hay=norm([p.Title,p.Description,p.Unit,p.Key].filter(Boolean).join(' '));
      return needles.every(n=>hay.includes(norm(n)));
    })||null;
  }
  function childrenOfGroup(props,groupNeedles){
    const group=(props||[]).find(p=>{
      if(p.Type!=='TopicGroup') return false;
      const hay=norm([p.Title,p.Description].filter(Boolean).join(' '));
      return groupNeedles.every(n=>hay.includes(norm(n)));
    });
    if(!group) return [];
    return (props||[]).filter(p=>p.Type!=='TopicGroup'&&p.Key&&p.ParentID===group.ID);
  }
  function pickChild(props,groupNeedles,childNeedles){
    return pickProperty(childrenOfGroup(props,groupNeedles),childNeedles);
  }
  class Provider{
    constructor({fetchImpl=globalThis.fetch,baseUrl=BASE,nowFn=()=>Date.now()}={}){
      if(typeof fetchImpl!=='function') throw new Error('CBS housing provider requires fetch.');
      this.fetchImpl=fetchImpl;this.baseUrl=baseUrl;this.nowFn=nowFn;
    }
    async json(path){
      const url=`${this.baseUrl}/${path}`;
      const response=await this.fetchImpl(url,{headers:{Accept:'application/json'}});
      if(!response?.ok) throw new CbsHousingError('SOURCE_REQUEST_FAILED',`CBS OData failed: ${response?.status??'NETWORK'}`,{url});
      const body=await response.json();
      return {url,rows:body?.value||body?.d?.results||[]};
    }
    async fetchMonthly({from='2020-01-01',to='2023-12-31'}={}){
      try{
        const [meta,data]=await Promise.all([this.json('DataProperties'),this.json('TypedDataSet')]);
        const price=pickProperty(meta.rows,['prijsindex','bestaande koopwoningen']);
        const yoy=pickProperty(meta.rows,['prijsindex','ontwikkeling','jaar eerder']);
        const sales=pickProperty(meta.rows,['aantal','verkochte woningen']);
        const salesYoy=pickProperty(meta.rows,['verkochte woningen','ontwikkeling','jaar eerder']);
        if(!price||!yoy||!sales||!salesYoy) throw new CbsHousingError('METADATA_MAPPING_FAILED','Could not map CBS housing fields',{price,yoy,sales,salesYoy});
        const rows=data.rows.map(r=>{
          const date=periodCodeToDate(r.Perioden);
          if(!date) return null;
          return {
            date,periodCode:r.Perioden,publishedAt:publicationDate(r.Perioden),
            priceIndex:Number(r[price.Key]),yoyPct:Number(r[yoy.Key]),transactions:Number(r[sales.Key]),transactionYoYPct:Number(r[salesYoy.Key])
          };
        }).filter(x=>x&&x.date>=from&&x.date<=to&&Number.isFinite(x.priceIndex)).sort((a,b)=>a.date.localeCompare(b.date));
        if(!rows.length) throw new CbsHousingError('NO_ROWS','No monthly CBS housing records in requested window',{from,to});
        return {
          rows,fields:{priceIndex:price.Key,yoyPct:yoy.Key,transactions:sales.Key,transactionYoYPct:salesYoy.Key},sourceMode:'CBS_ODATA_LIVE',
          provenance:[{sourceId:'CBS-85773NED',sourceType:'PRIMARY_OFFICIAL_ODATA',quality:'PRIMARY_OFFICIAL',url:data.url,retrievedAt:new Date(this.nowFn()).toISOString(),license:'CC-BY 4.0',note:'CBS/Kadaster existing-home price index; publication availability modeled at circa month-end + 22 days.'}]
        };
      }catch(err){
        const rows=pinnedRows(from,to);
        if(!rows.length) throw err;
        return {
          rows,fields:{priceIndex:'PINNED_PRICE_INDEX',yoyPct:'PINNED_YOY',transactions:'PINNED_TRANSACTIONS',transactionYoYPct:'PINNED_TRANSACTION_YOY'},
          sourceMode:'CBS_OFFICIAL_PINNED_RELEASE_EXTRACT',
          fallbackReason:String(err?.code||err?.message||err),
          provenance:[
            {sourceId:'CBS-85773NED-PINNED',sourceType:'PRIMARY_OFFICIAL_PINNED_EXTRACT',quality:'PRIMARY_OFFICIAL',url:'https://www.cbs.nl/nl-nl/cijfers/detail/85773NED',retrievedAt:'2026-09-18T00:00:00.000Z',note:'Pinned official CBS/Kadaster monthly index extract used when opendata.cbs.nl is unreachable from CI.'},
            {sourceId:'CBS-2022-08-HOUSING-RELEASE',sourceType:'PRIMARY_OFFICIAL_RELEASE',quality:'PRIMARY_OFFICIAL',url:'https://www.cbs.nl/nl-nl/nieuws/2022/34/prijsstijging-koopwoningen-vlakt-in-juli-opnieuw-af',retrievedAt:'2026-09-18T00:00:00.000Z',note:'Official July 2022 price/transaction release.'},
            {sourceId:'CBS-2022-02-HOUSING-RELEASE',sourceType:'PRIMARY_OFFICIAL_RELEASE',quality:'PRIMARY_OFFICIAL',url:'https://www.cbs.nl/nl-nl/nieuws/2022/08/prijsstijging-koopwoningen-loopt-op-naar-21-1-procent-in-januari',retrievedAt:'2026-09-18T00:00:00.000Z',note:'Official January 2022 price/transaction release.'}
          ]
        };
      }
    }
  }
  return {BASE,Provider,CbsHousingError,periodCodeToDate,publicationDate,pickProperty,childrenOfGroup,pickChild};
})();