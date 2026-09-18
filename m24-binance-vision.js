globalThis.M24BinanceVision = (() => {
  const BASE='https://data.binance.vision/data/futures/um/daily/metrics';
  const ASSET_TO_SYMBOL=Object.freeze({BTC:'BTCUSDT',ETH:'ETHUSDT',SOL:'SOLUSDT'});
  const METRIC_COLUMNS=Object.freeze([
    'sum_open_interest','sum_open_interest_value','count_toptrader_long_short_ratio',
    'sum_toptrader_long_short_ratio','count_long_short_ratio','sum_taker_long_short_vol_ratio'
  ]);

  class ArchiveError extends Error{
    constructor(code,message,detail={}){super(message);this.name='ArchiveError';this.code=code;this.detail=detail}
  }

  const numeric=value=>value!==''&&value!=null&&Number.isFinite(Number(value));
  const isoDate=value=>new Date(value).toISOString().slice(0,10);

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

  function parseMetricsCsv(text){
    const lines=String(text||'').replace(/^\uFEFF/,'').trim().split(/\r?\n/).filter(Boolean);
    if(lines.length<2) return [];
    const header=parseCsvLine(lines[0]).map(x=>x.trim());
    const required=['create_time','symbol',...METRIC_COLUMNS];
    const missing=required.filter(name=>!header.includes(name));
    if(missing.length) throw new ArchiveError('CSV_SCHEMA_INVALID','Binance Vision metrics CSV is missing expected columns.',{missing,header});
    const index=Object.fromEntries(header.map((name,i)=>[name,i]));
    return lines.slice(1).map(parseCsvLine).map(cols=>{
      const timeRaw=(cols[index.create_time]||'').trim();
      const timestamp=/^\d{10,13}$/.test(timeRaw)?Number(timeRaw)*(timeRaw.length===10?1000:1):Date.parse(timeRaw.length===10?`${timeRaw}T00:00:00Z`:timeRaw);
      if(!Number.isFinite(timestamp)) return null;
      const row={createTime:new Date(timestamp).toISOString(),date:new Date(timestamp).toISOString().slice(0,10),symbol:(cols[index.symbol]||'').trim()};
      METRIC_COLUMNS.forEach(name=>{const raw=(cols[index[name]]||'').trim();row[name]=numeric(raw)?Number(raw):null});
      return row;
    }).filter(Boolean);
  }

  async function inflateRaw(bytes){
    if(typeof DecompressionStream!=='function') throw new ArchiveError('DEFLATE_UNAVAILABLE','Runtime has no DecompressionStream(deflate-raw).');
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  function findEocd(view){
    const min=Math.max(0,view.byteLength-65557);
    for(let i=view.byteLength-22;i>=min;i--) if(view.getUint32(i,true)===0x06054b50) return i;
    return -1;
  }

  async function unzipCsvEntries(arrayBuffer){
    const view=new DataView(arrayBuffer),eocd=findEocd(view);
    if(eocd<0) throw new ArchiveError('ZIP_EOCD_MISSING','ZIP end-of-central-directory not found.');
    const entriesCount=view.getUint16(eocd+10,true);
    const centralOffset=view.getUint32(eocd+16,true);
    let offset=centralOffset;
    const decoder=new TextDecoder();
    const files=[];
    for(let n=0;n<entriesCount;n++){
      if(view.getUint32(offset,true)!==0x02014b50) throw new ArchiveError('ZIP_CENTRAL_INVALID','Invalid ZIP central-directory entry.',{offset});
      const method=view.getUint16(offset+10,true);
      const compressedSize=view.getUint32(offset+20,true);
      const uncompressedSize=view.getUint32(offset+24,true);
      const nameLen=view.getUint16(offset+28,true),extraLen=view.getUint16(offset+30,true),commentLen=view.getUint16(offset+32,true);
      const localOffset=view.getUint32(offset+42,true);
      const name=decoder.decode(new Uint8Array(arrayBuffer,offset+46,nameLen));
      offset+=46+nameLen+extraLen+commentLen;
      if(!name.toLowerCase().endsWith('.csv')) continue;
      if(view.getUint32(localOffset,true)!==0x04034b50) throw new ArchiveError('ZIP_LOCAL_INVALID','Invalid ZIP local header.',{name,localOffset});
      const localNameLen=view.getUint16(localOffset+26,true),localExtraLen=view.getUint16(localOffset+28,true);
      const dataStart=localOffset+30+localNameLen+localExtraLen;
      const compressed=new Uint8Array(arrayBuffer,dataStart,compressedSize);
      let data;
      if(method===0) data=new Uint8Array(compressed);
      else if(method===8) data=await inflateRaw(compressed);
      else throw new ArchiveError('ZIP_METHOD_UNSUPPORTED',`Unsupported ZIP compression method ${method}.`,{name,method});
      if(uncompressedSize&&data.byteLength!==uncompressedSize) throw new ArchiveError('ZIP_SIZE_MISMATCH','Uncompressed ZIP entry size mismatch.',{name,expected:uncompressedSize,actual:data.byteLength});
      files.push({name,text:decoder.decode(data)});
    }
    if(!files.length) throw new ArchiveError('ZIP_CSV_MISSING','No CSV entry found in metrics ZIP.');
    return files;
  }

  async function sha256Hex(arrayBuffer){
    if(!globalThis.crypto?.subtle) throw new ArchiveError('SHA256_UNAVAILABLE','WebCrypto SHA-256 unavailable.');
    const digest=await globalThis.crypto.subtle.digest('SHA-256',arrayBuffer);
    return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  }

  function checksumHash(text){
    const match=String(text||'').trim().match(/^([a-fA-F0-9]{64})(?:\s+\*?\S+)?/);
    if(!match) throw new ArchiveError('CHECKSUM_INVALID','Archive checksum file does not contain SHA-256 hash.');
    return match[1].toLowerCase();
  }

  function summarize(records){
    if(!records.length) return {count:0};
    const avg=name=>{
      const values=records.map(x=>x[name]).filter(Number.isFinite);
      return values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
    };
    return {
      count:records.length,
      firstTime:records[0].createTime,lastTime:records.at(-1).createTime,
      sumOpenInterest:avg('sum_open_interest'),sumOpenInterestValue:avg('sum_open_interest_value'),
      topTraderAccountLongShort:avg('count_toptrader_long_short_ratio'),
      topTraderPositionLongShort:avg('sum_toptrader_long_short_ratio'),
      globalLongShort:avg('count_long_short_ratio'),
      takerLongShortVolume:avg('sum_taker_long_short_vol_ratio')
    };
  }

  class BinanceVisionMetricsProvider{
    constructor({fetchImpl=globalThis.fetch,baseUrl=BASE,nowFn=()=>Date.now()}={}){
      if(typeof fetchImpl!=='function') throw new Error('BinanceVisionMetricsProvider requires fetch.');
      this.fetchImpl=fetchImpl;this.baseUrl=String(baseUrl).replace(/\/$/,'');this.nowFn=nowFn;
    }
    symbolForAsset(asset){const symbol=ASSET_TO_SYMBOL[asset];if(!symbol)throw new ArchiveError('UNSUPPORTED_ASSET',`No Binance Vision mapping for ${asset}.`,{asset});return symbol}
    url(asset,date){const symbol=this.symbolForAsset(asset),day=isoDate(`${date}T00:00:00Z`);return `${this.baseUrl}/${symbol}/${symbol}-metrics-${day}.zip`}
    async fetchDay(asset,date){
      const url=this.url(asset,date),checksumUrl=`${url}.CHECKSUM`;
      const [zipResponse,checksumResponse]=await Promise.all([
        this.fetchImpl(url,{method:'GET'}),this.fetchImpl(checksumUrl,{method:'GET',headers:{Accept:'text/plain'}})
      ]);
      if(!zipResponse?.ok){
        if(zipResponse?.status===404) return {asset,date:isoDate(`${date}T00:00:00Z`),status:'SOURCE_GAP',reason:'ARCHIVE_DAY_MISSING',url};
        throw new ArchiveError('ARCHIVE_REQUEST_FAILED',`Metrics archive request failed: ${zipResponse?.status??'NETWORK'}.`,{url,status:zipResponse?.status??null});
      }
      if(!checksumResponse?.ok) throw new ArchiveError('CHECKSUM_REQUEST_FAILED',`Checksum request failed: ${checksumResponse?.status??'NETWORK'}.`,{checksumUrl});
      const [arrayBuffer,checksumText]=await Promise.all([zipResponse.arrayBuffer(),checksumResponse.text()]);
      const actual=await sha256Hex(arrayBuffer),expected=checksumHash(checksumText);
      if(actual!==expected) throw new ArchiveError('CHECKSUM_MISMATCH','Binance Vision archive checksum mismatch.',{expected,actual,url});
      const entries=await unzipCsvEntries(arrayBuffer);
      const records=entries.flatMap(entry=>parseMetricsCsv(entry.text)).filter(x=>x.symbol===this.symbolForAsset(asset));
      return {
        asset,date:isoDate(`${date}T00:00:00Z`),status:records.length?'OK':'SOURCE_GAP',records,summary:summarize(records),
        provenance:[{sourceId:'BINANCE-VISION-USDM-METRICS',sourceType:'AUTHORITATIVE_PUBLIC_ARCHIVE',quality:'PRIMARY_EXCHANGE_DERIVATIVES_ARCHIVE',url,checksumUrl,sha256:actual,retrievedAt:new Date(this.nowFn()).toISOString()}]
      };
    }
    async fetchDates(asset,dates){return Promise.all(dates.map(date=>this.fetchDay(asset,date)))}
  }

  return {BASE,ASSET_TO_SYMBOL,METRIC_COLUMNS,ArchiveError,parseCsvLine,parseMetricsCsv,unzipCsvEntries,sha256Hex,checksumHash,summarize,BinanceVisionMetricsProvider};
})();
