'use strict';
const assert=require('assert');
const CP=require('./competence-projection.js');

const mem=(()=>{
  const data=new Map();
  return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v))};
})();

assert.equal(Object.keys(CP.STAGES).length,4);
assert.equal(CP.STAGES.guided.canonical,'ONBEWUST_ONBEKWAAM');
assert.equal(CP.STAGES.learning.canonical,'BEWUST_ONBEKWAAM');
assert.equal(CP.STAGES.analysis.canonical,'BEWUST_BEKWAAM');
assert.equal(CP.STAGES.expert.canonical,'ONBEWUST_BEKWAAM');

assert.equal(CP.getStage('investing',mem),'analysis');
assert.equal(CP.setStage('investing','guided',mem),'guided');
assert.equal(CP.getStage('investing',mem),'guided');
assert.equal(CP.setStage('household','expert',mem),'expert');
assert.equal(CP.getStage('household',mem),'expert');
assert.equal(CP.getStage('investing',mem),'guided');

const expert=CP.projectionFor('expert');
assert.equal(expert.showRawSources,true);
assert.equal(expert.showEvidenceCodes,true);
const guided=CP.projectionFor('guided');
assert.equal(guided.showTechnical,false);
assert.equal(guided.showGlossary,true);

const doc={body:{dataset:{}}};
const applied=CP.applyToDocument(doc,'learning');
assert.equal(doc.body.dataset.competence,'learning');
assert.equal(doc.body.dataset.competenceCanonical,'BEWUST_ONBEKWAAM');
assert.equal(applied.depth,2);

console.log('Competence Projection contract PASS');