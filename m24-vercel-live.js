globalThis.M24VercelLive = (() => {
  function priceLabel(n){if(!Number.isFinite(Number(n)))return'—';const v=Number(n);return Math.abs(v)>=1000?v.toLocaleString('en-US',{maximumFractionDigits:0}):v.toLocaleString('en-US',{maximumFractionDigits:2})}
  class VercelMarketProvider {
    constructor({fetchImpl=globalThis.fetch,fallback}={}){
      if(typeof fetchImpl!=='function') throw new Error('VercelMarketProvider requires fetch.');
      if(!fallback) throw new Error('VercelMarketProvider requires fallback.');
      this.fetchImpl=fetchImpl;this.fallback=fallback;
    }
    async getMarketState(asset,context={}){
      try{
        const q=new URLSearchParams({asset,resolution:context.resolution||'D',level:context.window||'episode'});
        const r=await this.fetchImpl('/api/m24/market?'+q.toString(),{headers:{Accept:'application/json'},cache:'no-store'});
        if(!r?.ok)throw new Error('LIVE_MARKET_HTTP_'+(r?.status??'NETWORK'));
        const live=await r.json();if(live.status==='SOURCE_GAP'||!Array.isArray(live.values)||!live.values.length)throw new Error(live.error||'LIVE_MARKET_SOURCE_GAP');
        const model=await this.fallback.getMarketState(asset,context);
        return {...model,
          name:live.name||model.name,
          price:priceLabel(live.price),
          trend:live.change5Pct==null?'→ live':live.change5Pct>0?'↑ '+live.change5Pct+'%':live.change5Pct<0?'↘ '+live.change5Pct+'%':'→ 0%',
          window:live.window||model.window,
          values:live.values,
          bars:live.bars,
          sourceStatus:live.freshness==='LIVE_MARKET'?'LIVE':'DELAYED',
          sourceFreshness:live.freshness,
          sourceQuality:live.quality,
          sourceAsOf:live.asOf,
          sourceRetrievedAt:live.retrievedAt,
          provenance:live.provenance||[]
        };
      }catch(err){
        const fallback=await this.fallback.getMarketState(asset,context);
        return {...fallback,sourceStatus:'FALLBACK',sourceFreshness:'SOURCE_GAP',sourceQuality:'MOCK_FALLBACK',sourceError:String(err.message||err)};
      }
    }
    async getMeaningState(asset,context={}){const x=await this.fallback.getMeaningState(asset,context);return {...x,sourceStatus:'MODEL_CONTEXT'};}
    async getCrossAssetState(){
      try{
        const r=await this.fetchImpl('/api/m24/cross',{headers:{Accept:'application/json'},cache:'no-store'});
        if(!r?.ok)throw new Error('CROSS_HTTP_'+(r?.status??'NETWORK'));
        const x=await r.json();
        return (x.items||[]).map(i=>({
          key:i.key,
          name:i.name,
          direction:i.direction,
          state:i.state,
          className:i.className,
          status:i.status,
          asOf:i.asOf,
          sourceQuality:i.quality,
          sourceUrl:i.source||null,
          sourceFreshness:x.freshness||'DAILY_DELAYED',
          sourceRetrievedAt:x.retrievedAt||null,
          provenance:i.source?[{sourceId:'FRED',quality:i.quality||'OFFICIAL_OR_OFFICIAL_UPSTREAM',url:i.source,retrievedAt:x.retrievedAt||null}]:[]
        }));
      }catch{return this.fallback.getCrossAssetState()}
    }
    async getDerivativesState(asset){
      try{
        const r=await this.fetchImpl('/api/m24/derivatives?asset='+encodeURIComponent(asset),{headers:{Accept:'application/json'},cache:'no-store'});
        const x=await r.json();
        if(!r?.ok||x.sourceStatus==='SOURCE_GAP') return {...x,sourceStatus:'SOURCE_GAP'};
        return x;
      }catch(err){
        return {
          schema:'m24.derivatives.live.v0.1',
          asset,
          sourceStatus:'SOURCE_GAP',
          freshness:'SOURCE_GAP',
          quality:'PRIMARY_EXCHANGE_DERIVATIVES',
          error:String(err.message||err),
          provenance:[]
        };
      }
    }
    async getHistoricalCase(id){return this.fallback.getHistoricalCase(id)}
  }
  return {VercelMarketProvider};
})();