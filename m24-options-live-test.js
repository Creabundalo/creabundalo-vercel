'use strict';
const assert=require('assert');
const o=require('./api/m24/options.js');

function response(body,{status=200}={}){return {ok:status>=200&&status<300,status,async json(){return body}}}
function mockRes(){return{code:null,body:null,headers:{},setHeader(k,v){this.headers[k]=v},status(c){this.code=c;return this},json(x){this.body=x;return this}}}

const now=Date.UTC(2026,8,19,12);
const rows=[
  {instrument_name:'BTC-25SEP26-60000-C',mark_iv:45,open_interest:100,volume:10,underlying_price:61000},
  {instrument_name:'BTC-25SEP26-60000-P',mark_iv:50,open_interest:150,volume:12,underlying_price:61000},
  {instrument_name:'BTC-25SEP26-65000-C',mark_iv:47,open_interest:80,volume:8,underlying_price:61000},
  {instrument_name:'BTC-25SEP26-65000-P',mark_iv:52,open_interest:100,volume:7,underlying_price:61000},
  {instrument_name:'BTC-30OCT26-60000-C',mark_iv:53,open_interest:90,volume:5,underlying_price:61200},
  {instrument_name:'BTC-30OCT26-60000-P',mark_iv:55,open_interest:110,volume:6,underlying_price:61200}
];

(async()=>{
  assert.equal(o.parseInstrument('SOL_USDC-30OCT26-250-C').side,'C');
  const summary=o.summarize(rows,{asset:'BTC',nowMs:now,retrievedAt:'2026-09-19T12:00:00Z'});
  assert.equal(summary.sourceStatus,'OK');
  assert.equal(summary.front.expiryDate,'2026-09-25');
  assert.equal(summary.front.atmStrike,60000);
  assert.equal(summary.front.atmIv,47.5);
  assert.equal(summary.front.atmPutCallIvSkew,5);
  assert.equal(summary.front.putCallOiRatio,1.389);
  assert.equal(summary.back.expiryDate,'2026-10-30');
  assert.equal(summary.interpretation.skew,'PUT_IV_RICH');
  assert.equal(summary.interpretation.positioning,'PUT_OI_HEAVY');
  assert.equal(summary.interpretation.termStructure,'BACK_IV_HIGHER');

  const h=o.createHandler({nowFn:()=>now,fetchImpl:async()=>response({result:rows})});
  const r=mockRes();await h({query:{asset:'BTC'}},r);
  assert.equal(r.code,200);
  assert.equal(r.body.quality,'PRIMARY_OPTIONS_EXCHANGE');

  const na=mockRes();await h({query:{asset:'TSLA'}},na);
  assert.equal(na.code,200);
  assert.equal(na.body.sourceStatus,'NOT_APPLICABLE');

  const bad=o.createHandler({nowFn:()=>now,fetchImpl:async()=>response({}, {status:503})});
  const rb=mockRes();await bad({query:{asset:'ETH'}},rb);
  assert.equal(rb.code,502);
  assert.equal(rb.body.sourceStatus,'SOURCE_GAP');

  console.log('M24 live options API contract PASS');
})().catch(e=>{console.error(e);process.exit(1)});
