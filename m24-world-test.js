'use strict';
const assert=require('assert');
const fs=require('fs');
const M24World=require('./m24-world.js');
const snapshot=JSON.parse(fs.readFileSync('m24-world-snapshot.json','utf8'));

const evaluated=M24World.evaluateSnapshot(snapshot,'2026-09-19');
assert.equal(evaluated.safety,'NO_PROBABILITY_NO_AUTO_TRADE');
assert.equal(evaluated.worlds.length,5);

const housing=evaluated.worlds.find(w=>w.worldId==='NL_HOUSING_CURRENT');
assert(housing.recency.usable);
assert(housing.eligibleAnalogs.some(a=>a.caseId==='NL-HOUSING-2015-2023'));
assert.equal(housing.forecastProbability,null);

const grid=evaluated.worlds.find(w=>w.worldId==='EU_ELECTRIFICATION_GRID_CURRENT');
assert(grid.partialAnalogs.some(a=>a.caseId==='OIL-APR2020'));
assert(grid.cohortGap);
assert(grid.branches.some(b=>b.id==='PHYSICAL_ADAPTATION'));

const defence=evaluated.worlds.find(w=>w.worldId==='EU_DEFENCE_EXPANSION_CURRENT');
assert(defence.cohortGap);
assert(defence.branches.some(b=>b.id==='NEW_REGIME_OBSERVATION'));

const stable=evaluated.worlds.find(w=>w.worldId==='US_STABLECOIN_CURRENT');
assert(stable.cohortGap);
assert(stable.observations.some(o=>o.authority==='OFFICIAL_ANALYSIS_WITH_SECONDARY_MARKET_INPUT'));

const funding=evaluated.worlds.find(w=>w.worldId==='GLOBAL_FUNDING_REFERENCE');
assert(!funding.recency.usable);
assert.equal(funding.guard,'STALE_FAST_MARKET_CANNOT_ACTIVATE_CURRENT_MECHANISM');
assert.equal(funding.branches.length,0);

const financial=M24World.matchAnalogs(['FUNDING_LIQUIDITY_CONSTRAINT','COLLATERAL_LEVERAGE','FORCED_ACTION','PRICE_VOL_FEEDBACK','POLICY_BACKSTOP']);
assert(financial.filter(x=>x.eligible).some(x=>x.caseId==='GLOBAL-MAR2020'));
assert(financial.filter(x=>x.eligible).some(x=>x.caseId==='SPX-2007-2009'));
assert(financial.filter(x=>x.eligible).some(x=>x.caseId==='UK-GILTS-2022'));

const noExpiry=M24World.matchAnalogs(['PHYSICAL_CONSTRAINT','FORCED_ACTION']).find(x=>x.caseId==='OIL-APR2020');
assert(noExpiry.partial);
assert(noExpiry.missingRequirements.includes('EXPIRY_CONTRACT'));

console.log('M24 current-world/psi contract PASS');