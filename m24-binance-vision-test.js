const fs=require('fs');
const vm=require('vm');
const nodeCrypto=require('crypto');
if(!globalThis.crypto) globalThis.crypto=nodeCrypto.webcrypto;

function storedZip(filename,text){
  const name=Buffer.from(filename,'utf8'),data=Buffer.from(text,'utf8');
  const local=Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(0,6);local.writeUInt16LE(0,8);
  local.writeUInt32LE(0,14);local.writeUInt32LE(data.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(name.length,26);local.writeUInt16LE(0,28);
  const localBlock=Buffer.concat([local,name,data]);
  const central=Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(0,8);central.writeUInt16LE(0,10);
  central.writeUInt32LE(0,16);central.writeUInt32LE(data.length,20);central.writeUInt32LE(data.length,24);central.writeUInt16LE(name.length,28);
  central.writeUInt16LE(0,30);central.writeUInt16LE(0,32);central.writeUInt16LE(0,34);central.writeUInt16LE(0,36);central.writeUInt32LE(0,38);central.writeUInt32LE(0,42);
  const centralBlock=Buffer.concat([central,name]);
  const eocd=Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50,0);eocd.writeUInt16LE(0,4);eocd.writeUInt16LE(0,6);eocd.writeUInt16LE(1,8);eocd.writeUInt16LE(1,10);
  eocd.writeUInt32LE(centralBlock.length,12);eocd.writeUInt32LE(localBlock.length,16);eocd.writeUInt16LE(0,20);
  return Buffer.concat([localBlock,centralBlock,eocd]);
}

const source=fs.readFileSync('m24-binance-vision.js','utf8');
const test=`
(async()=>{
  const check=(condition,message)=>{if(!condition) throw new Error(message)};
  const csv='create_time,symbol,sum_open_interest,sum_open_interest_value,count_toptrader_long_short_ratio,sum_toptrader_long_short_ratio,count_long_short_ratio,sum_taker_long_short_vol_ratio\\n2021-04-14,BTCUSDT,98666.163,2236289208.19,0.7665686,1.1363333,0.8332767,0.92530759\\n';
  const zip=globalThis.__testZip;
  const expected=globalThis.__zipHash;
  const calls=[];
  const fakeFetch=async url=>{
    calls.push(url);
    if(url.endsWith('.CHECKSUM')) return {ok:true,status:200,text:async()=>expected+'  BTCUSDT-metrics-2021-04-14.zip'};
    if(url.includes('2021-04-15.zip')) return {ok:false,status:404,arrayBuffer:async()=>new ArrayBuffer(0)};
    return {ok:true,status:200,arrayBuffer:async()=>zip.buffer.slice(zip.byteOffset,zip.byteOffset+zip.byteLength)};
  };
  const provider=new M24BinanceVision.BinanceVisionMetricsProvider({fetchImpl:fakeFetch,nowFn:()=>Date.parse('2026-09-17T20:00:00Z')});
  const result=await provider.fetchDay('BTC','2021-04-14');
  check(result.status==='OK','archive day should load');
  check(result.records.length===1,'metrics row count wrong');
  check(result.records[0].sum_open_interest===98666.163,'open-interest mapping wrong');
  check(result.records[0].sum_taker_long_short_vol_ratio===0.92530759,'taker ratio mapping wrong');
  check(result.summary.globalLongShort===0.8332767,'metrics summary wrong');
  check(result.provenance[0].sha256===expected,'verified checksum must be retained in provenance');
  check(calls.some(x=>x.endsWith('.CHECKSUM')),'checksum sidecar must be requested');

  const gap=await provider.fetchDay('BTC','2021-04-15');
  check(gap.status==='SOURCE_GAP'&&gap.reason==='ARCHIVE_DAY_MISSING','404 archive day must become source gap');

  const parsed=M24BinanceVision.parseMetricsCsv(csv);
  check(parsed[0].date==='2021-04-14','date-only create_time parsing failed');
  check(M24BinanceVision.checksumHash(expected+' *file.zip')===expected,'checksum parser failed');

  let mismatch=false;
  const badProvider=new M24BinanceVision.BinanceVisionMetricsProvider({fetchImpl:async url=>url.endsWith('.CHECKSUM')?{ok:true,status:200,text:async()=>('0'.repeat(64)+' file.zip')}:{ok:true,status:200,arrayBuffer:async()=>zip.buffer.slice(zip.byteOffset,zip.byteOffset+zip.byteLength)}});
  try{await badProvider.fetchDay('BTC','2021-04-14')}catch(err){mismatch=err.code==='CHECKSUM_MISMATCH'}
  check(mismatch,'checksum mismatch must fail closed');
  console.log('M24 Binance Vision archive test OK',JSON.stringify({rows:result.records.length,gap:gap.reason,sha:expected.slice(0,8)}));
})()
`;

const csv='create_time,symbol,sum_open_interest,sum_open_interest_value,count_toptrader_long_short_ratio,sum_toptrader_long_short_ratio,count_long_short_ratio,sum_taker_long_short_vol_ratio\n2021-04-14,BTCUSDT,98666.163,2236289208.19,0.7665686,1.1363333,0.8332767,0.92530759\n';
globalThis.__testZip=storedZip('BTCUSDT-metrics-2021-04-14.csv',csv);
globalThis.__zipHash=nodeCrypto.createHash('sha256').update(globalThis.__testZip).digest('hex');
(async()=>{try{await vm.runInThisContext(`${source}\n${test}`,{filename:'m24-binance-vision-test-bundle.js'})}finally{delete globalThis.__testZip;delete globalThis.__zipHash}})().catch(err=>{console.error(err);process.exit(1)});
