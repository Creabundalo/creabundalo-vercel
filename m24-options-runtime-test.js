'use strict';
const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('m24-core.js','utf8');
const test=`
(async()=>{
  const check=(c,m)=>{if(!c)throw new Error(m)};
  const provider={
    async getMarketState(){return {values:[1,2,3],mechanismScore:0,mechanisms:[],provenance:[{sourceId:'TEST-MARKET'}]};},
    async getMeaningState(){return {score:0,narrative:'test',confidence:.5,provenance:[{sourceId:'TEST-MEANING'}]};},
    async getCrossAssetState(){return [];},
    async getDerivativesState(){return {sourceStatus:'NOT_APPLICABLE',freshness:'N/A',quality:'N/A',provenance:[]};},
    async getOptionsState(){return {
      sourceStatus:'OK',
      freshness:'LIVE_OPTIONS',
      quality:'PRIMARY_OPTIONS_EXCHANGE',
      front:{atmIv:50,atmPutCallIvSkew:2,putCallOiRatio:1},
      interpretation:{skew:'ATM_SKEW_BALANCED'},
      provenance:[{sourceId:'DERIBIT-OPTIONS-BOOK-SUMMARY'}]
    };}
  };
  const runtime=new M24Core.Runtime({provider});
  const snapshot=await runtime.snapshot('BTC',{window:'episode',resolution:'D'});
  check(snapshot.optionsRec&&snapshot.optionsRec.type==='OPTIONS_STATE','OPTIONS_STATE record missing');
  check(runtime.store.list('OPTIONS_STATE').length===1,'options state not persisted in Qubus');
  check(snapshot.trick.relations.some(r=>r.targetId===snapshot.optionsRec.id),'Trickster/supporting relation must include options state');
  console.log('M24 options runtime contract PASS');
})()
`;

(async()=>{
  await vm.runInThisContext(`${source}\n${test}`,{filename:'m24-options-runtime-bundle.js'});
})().catch(err=>{console.error(err);process.exit(1)});
