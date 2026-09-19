'use strict';
const assert=require('assert');
const market=require('./api/m24/market.js');
const cross=require('./api/m24/cross.js');

function response(body,{status=200,json=false}={}){return {ok:status>=200&&status<300,status,async text(){return body},async json(){return json?body:JSON.parse(body)}}}
function mockRes(){return{code:null,body:null,headers:{},setHeader(k,v){this.headers[k]=v},status(c){this.code=c;return this},json(x){this.body=x;return this}}}

(async()=>{
  assert(market.ASSETS.BTC&&market.ASSETS.TSLA&&market.ASSETS.OIL&&market.ASSETS.SOL);
  const cb=market.createHandler({fetchImpl:async url=>{
    if(url.includes('/candles?'))return response([[1704067200,90,110,95,100,12],[1704153600,98,120,100,115,14]],{json:true});
    if(url.includes('/ticker'))return response({price:'117.5'},{json:true});
    throw new Error('unexpected '+url);
  }});
  const r1=mockRes();await cb({query:{asset:'BTC',resolution:'D',level:'episode'}},r1);
  assert.equal(r1.code,200);assert.equal(r1.body.asset,'BTC');assert.equal(r1.body.price,117.5);assert.equal(r1.body.quality,'PRIMARY_EXCHANGE');

  const fredText='DATE,DCOILWTICO\n2026-09-17,98.4\n2026-09-18,99.1\n';
  const oil=market.createHandler({fetchImpl:async()=>response(fredText)});
  const r2=mockRes();await oil({query:{asset:'OIL'}},r2);
  assert.equal(r2.code,200);assert.equal(r2.body.asOf,'2026-09-18');assert.equal(r2.body.freshness,'OFFICIAL_DAILY_DELAYED');

  const bad=market.createHandler({fetchImpl:async()=>{throw new Error('offline')}});
  const r3=mockRes();await bad({query:{asset:'SOL'}},r3);
  assert.equal(r3.code,502);assert.equal(r3.body.status,'SOURCE_GAP');

  const crossHandler=cross.createHandler({fetchImpl:async url=>{
    const id=new URL(url).searchParams.get('id');
    return response('DATE,'+id+'\n2026-09-17,100\n2026-09-18,102\n');
  }});
  const r4=mockRes();await crossHandler({query:{}},r4);
  assert.equal(r4.code,200);assert.equal(r4.body.items.length,5);assert(r4.body.items.every(x=>x.status==='OK'));
  console.log('M24 Vercel live API contract PASS');
})().catch(e=>{console.error(e);process.exit(1)});
