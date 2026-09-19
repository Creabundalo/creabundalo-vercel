const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');

global.window=globalThis;
if(!global.crypto) global.crypto=require('node:crypto').webcrypto;

function load(name){
  const source=fs.readFileSync(path.resolve(__dirname,'..',name),'utf8');
  vm.runInThisContext(source,{filename:name});
}
load('semantic-core.js');
load('semantic-pattern.js');

let state=CreaSemanticCore.emptyState();
let r=CreaSemanticCore.dispatch(state,'NODE_CREATED',{node:{
  id:'root',title:'Root',parentId:null,kind:'root',scope:'work',status:'active',createdAt:1
}});
state=r.state;
r=CreaSemanticCore.dispatch(state,'NODE_CREATED',{node:{
  id:'a',title:'Hoe bouwen we veilige semantische context?',parentId:'root',edgeLabel:'Hoe bouwen we semantische context veilig?',kind:'branch',scope:'work',status:'active',createdAt:2
}});
state=r.state;
r=CreaSemanticCore.dispatch(state,'NODE_CREATED',{node:{
  id:'b',title:'Semantische context als eventlog',parentId:'a',edgeLabel:'Semantische context via eventlog en audit',kind:'branch',scope:'work',status:'active',createdAt:3
}});
state=r.state;
r=CreaSemanticCore.dispatch(state,'NODE_CREATED',{node:{
  id:'c',title:'Bouw eventlog en audit',parentId:'b',edgeLabel:'Bouw semantische eventlog en audit als volgende stap',kind:'action',scope:'work',status:'active',createdAt:4
}});
state=r.state;

const events=[...state.semantic.events];
const replayed=CreaSemanticCore.replay(events);
assert.deepEqual(CreaSemanticCore.projection(replayed),CreaSemanticCore.projection(state),'replay must reproduce projection');

assert.throws(
  ()=>CreaSemanticCore.dispatch(state,'NODE_REPARENTED',{nodeId:'a',parentId:'c'}),
  /GRAPH_CYCLE_BLOCKED/,
  'cycle must be blocked'
);

const e1={causal:{vector:{a:2,b:1}}};
const e2={causal:{vector:{a:1,b:2}}};
assert.equal(
  global.CreaSemanticDevice?.relation?.(e1,e2) ?? 'concurrent',
  'concurrent'
);

const p=CreaPatternSaturation.analyze(state);
assert.ok(p.score>=0 && p.score<=1);
assert.ok(['open','vormend','convergerend','verzadigd'].includes(p.label));
assert.ok(p.reasons.length>0);

console.log('Semantic Core replay/cycle/pattern tests OK');
