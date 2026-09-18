const M24Coinbase = (() => {
  const MAX_CANDLES = 300;
  const CHUNK_CANDLES = 299;
  const GRANULARITIES = Object.freeze([60,300,900,3600,21600,86400]);
  const ASSET_TO_PRODUCT = Object.freeze({BTC:'BTC-USD',ETH:'ETH-USD',SOL:'SOL-USD'});

  const isFiniteNumber = value => Number.isFinite(Number(value));
  const iso = value => new Date(value).toISOString();

  class CoinbaseHistoricalProvider {
    constructor({fetchImpl=globalThis.fetch,baseUrl='https://api.exchange.coinbase.com'}={}) {
      if (typeof fetchImpl !== 'function') throw new Error('CoinbaseHistoricalProvider requires fetch.');
      this.fetchImpl = fetchImpl;
      this.baseUrl = String(baseUrl).replace(/\/$/,'');
    }

    productForAsset(asset) {
      const productId = ASSET_TO_PRODUCT[asset];
      if (!productId) throw new Error(`No Coinbase product mapping for ${asset}.`);
      return productId;
    }

    async fetchBars({productId,start,end,granularity=86400}) {
      if (!productId) throw new Error('productId is required.');
      if (!GRANULARITIES.includes(Number(granularity))) throw new Error(`Unsupported Coinbase granularity ${granularity}.`);
      const startMs = new Date(start).getTime();
      const endMs = new Date(end).getTime();
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) throw new Error('Invalid historical time range.');

      const bucketMs = Number(granularity) * 1000;
      const chunkMs = bucketMs * CHUNK_CANDLES;
      const barsByTime = new Map();
      let cursor = startMs;

      while (cursor < endMs) {
        const chunkEnd = Math.min(endMs, cursor + chunkMs);
        const params = new URLSearchParams({
          start: iso(cursor),
          end: iso(chunkEnd),
          granularity: String(granularity)
        });
        const url = `${this.baseUrl}/products/${encodeURIComponent(productId)}/candles?${params.toString()}`;
        const response = await this.fetchImpl(url,{method:'GET',headers:{Accept:'application/json'}});
        if (!response || !response.ok) {
          const status = response?.status ?? 'NETWORK';
          throw new Error(`Coinbase historical candles failed: ${status}.`);
        }
        const payload = await response.json();
        if (!Array.isArray(payload)) throw new Error('Coinbase candles response is not an array.');
        payload.forEach(row=>{
          if (!Array.isArray(row) || row.length < 6) return;
          const [time,low,high,open,close,volume] = row;
          if (![time,low,high,open,close,volume].every(isFiniteNumber)) return;
          const timestamp = Number(time);
          barsByTime.set(timestamp,{
            time:timestamp,
            date:new Date(timestamp*1000).toISOString().slice(0,10),
            open:Number(open),high:Number(high),low:Number(low),close:Number(close),volume:Number(volume)
          });
        });
        cursor = chunkEnd;
      }

      return [...barsByTime.values()]
        .filter(bar=>bar.time*1000>=startMs && bar.time*1000<=endMs)
        .sort((a,b)=>a.time-b.time);
    }

    async getBarsForAsset(asset,{start,end,granularity=86400}={}) {
      const productId = this.productForAsset(asset);
      const bars = await this.fetchBars({productId,start,end,granularity});
      return {
        asset,
        productId,
        resolutionSeconds:Number(granularity),
        bars,
        provenance:[{
          sourceId:'COINBASE-EXCHANGE-CANDLES',
          sourceType:'AUTHORITATIVE_EXCHANGE_API',
          quality:'PRIMARY_EXCHANGE',
          productId,
          endpoint:'/products/{product_id}/candles',
          retrievedAt:new Date().toISOString(),
          note:'Coinbase Exchange historical product candles; chunked to remain within the documented 300-candle request limit.'
        }]
      };
    }
  }

  return {MAX_CANDLES,CHUNK_CANDLES,GRANULARITIES,ASSET_TO_PRODUCT,CoinbaseHistoricalProvider};
})();
