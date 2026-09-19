'use strict';
const assert=require('assert');
const H=require('./m24-source-health.js');

const snapshot={
  market:{
    values:[1,2,3],
    sourceStatus:'LIVE',
    sourceFreshness:'LIVE_MARKET',
    sourceQuality:'PRIMARY_EXCHANGE',
    sourceAsOf:'2026-09-19',
    provenance:[{sourceId:'COINBASE-EXCHANGE'}]
  },
  marketRec:{id:'M1'},
  meaning:{score:.2},
  meaningRec:{id:'ME1'},
  cross:[
    {status:'OK',asOf:'2026-09-18',sourceFreshness:'DAILY_DELAYED'},
    {status:'OK',asOf:'2026-09-19',sourceFreshness:'DAILY_DELAYED'}
  ],
  crossRecs:[{id:'C1'},{id:'C2'}],
  derivatives:{
    sourceStatus:'OK',
    freshness:'LIVE_DERIVATIVES',
    quality:'PRIMARY_EXCHANGE_DERIVATIVES',
    asOf:'2026-09-19T12:00:00Z',
    provenance:[{sourceId:'BINANCE-USDM-PREMIUM-INDEX'}]
  },
  derivativesRec:{id:'D1'}
};

const rows=H.build(snapshot);
assert.equal(rows.length,6);
assert.equal(rows[0].source,'COINBASE-EXCHANGE');
assert.equal(rows[0].api,'OK');
assert.equal(rows[0].qubus,'STORED');
assert.equal(rows[0].overall,'LIVE');
assert.equal(rows[1].source,'BINANCE-USDM-PREMIUM-INDEX');
assert.equal(rows[1].api,'OK');
assert.equal(rows[1].qubus,'STORED');
assert.equal(rows[1].overall,'LIVE');
assert.equal(rows[2].source,'FRED');
assert.equal(rows[2].api,'OK');
assert.equal(rows[2].qubus,'STORED');
assert.equal(rows[2].asOf,'2026-09-19');
assert.equal(rows[3].qubus,'STORED');
assert.equal(rows[5].m24,'SIMULATED_ONLY');

const fallback=H.marketRow({market:{values:[1],sourceStatus:'FALLBACK',sourceFreshness:'SOURCE_GAP'},marketRec:{id:'M2'}});
assert.equal(fallback.api,'GAP');
assert.equal(fallback.normalize,'FALLBACK');
assert.equal(fallback.overall,'SOURCE_GAP');

console.log('M24 source health contract PASS');