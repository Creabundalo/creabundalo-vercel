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
    return iso(addDays(end,28));
  }
  function pickProperty(props,needles){
    return (props||[]).find(p=>{
      const hay=norm([p.Title,p.Description,p.Unit,p.Key].filter(Boolean).join(' '));
      return needles.every(n=>hay.includes(norm(n)));
    })||null;
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
      const [meta,data]=await Promise.all([this.json('DataProperties'),this.json('TypedDataSet')]);
      const price=pickProperty(meta.rows,['prijsindex','bestaande koopwoningen']);
      const yoy=pickProperty(meta.rows,['ontwikkeling','jaar eerder']);
      const sales=pickProperty(meta.rows,['aantal','verkochte woningen']);
      if(!price||!yoy||!sales) throw new CbsHousingError('METADATA_MAPPING_FAILED','Could not map CBS housing fields',{price,yoy,sales,keys:meta.rows.map(x=>({k:x.Key,t:x.Title}))});
      const rows=data.rows.map(r=>{
        const date=periodCodeToDate(r.Perioden);
        if(!date) return null;
        return {
          date,periodCode:r.Perioden,publishedAt:publicationDate(r.Perioden),
          priceIndex:Number(r[price.Key]),yoyPct:Number(r[yoy.Key]),transactions:Number(r[sales.Key])
        };
      }).filter(x=>x&&x.date>=from&&x.date<=to&&Number.isFinite(x.priceIndex)).sort((a,b)=>a.date.localeCompare(b.date));
      if(!rows.length) throw new CbsHousingError('NO_ROWS','No monthly CBS housing records in requested window',{from,to});
      return {
        rows,fields:{priceIndex:price.Key,yoyPct:yoy.Key,transactions:sales.Key},
        provenance:[{sourceId:'CBS-85773NED',sourceType:'PRIMARY_OFFICIAL_ODATA',quality:'PRIMARY_OFFICIAL',url:data.url,retrievedAt:new Date(this.nowFn()).toISOString(),license:'CC-BY 4.0',note:'CBS/Kadaster existing-home price index. Publication lag modeled conservatively as month-end + 28 days.'}]
      };
    }
  }
  return {BASE,Provider,CbsHousingError,periodCodeToDate,publicationDate,pickProperty};
})();