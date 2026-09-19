'use strict';
const assert=require('assert');
const d=require('./api/m24/derivatives.js');

function response(body,{status=200}={}){return {ok:status>=200&&status<300,status,async json(){return body}}}
function mockRes(){return{code:null,body:null,headers:{},setHeader(k,v){this.headers[k]=v},status(c){this.code=c;return this},json(x){this.body=x;return this}}}

(async()=>{
  const now=Date.parse('2026-09-19T12:00:00Z');
  const funding=Array.from({length:4},(_,i)=>({fundingRate:String(0.0001+i*0.00001),fundingTime:now-(3-i)*8*3600000}));
  const oi=Array.from({length:5},(_,i)=>({sumOpenInterest:String(100+i*2),timestamp:now-(4-i)*3600000}));
  const h=d.createHandler({fetchImpl:async url=>{
    if(url.includes('/premiumIndex')) return response({lastFundingRate:'0.00015',nextFundingTime:String(now+8*3600000),markPrice:'62000'});
    if(url.includes('/fundingRate')) return response(funding);
    if(url.includes('/openInterestHist')) return response(oi);
    throw new Error('unexpected '+url);
  }});
  const r=mockRes();await h({query:{asset:'BTC'}},r);
  assert.equal(r.code,200);
  assert.equal(r.body.asset,'BTC');
  assert.equal(r.body.sourceStatus,'OK');
  assert.equal(r.body.funding.currentRate,0.00015);
  assert.equal(r.body.openInterest.current,108);
  assert.equal(r.body.openInterest.changeRecentPct,8);
  assert.equal(r.body.interpretation.leverageReading,'LONG_LEVERAGE_EXPANDING');
  assert.equal(r.body.provenance.length,3);

  const na=mockRes();await h({query:{asset:'TSLA'}},na);
  assert.equal(na.code,200);
  assert.equal(na.body.sourceStatus,'NOT_APPLICABLE');

  const bad=d.createHandler({fetchImpl:async()=>response({}, {status:503})});
  const rb=mockRes();await bad({query:{asset:'SOL'}},rb);
  assert.equal(rb.code,502);
  assert.equal(rb.body.sourceStatus,'SOURCE_GAP');

  console.log('M24 live derivatives API contract PASS');
})().catch(e=>{console.error(e);process.exit(1)});
