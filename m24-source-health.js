(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.M24SourceHealth=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function marketRow(snapshot){
    const m=snapshot?.market||{};
    const source=m.provenance?.[0]?.sourceId||m.sourceQuality||'UNKNOWN';
    const live=m.sourceStatus==='LIVE';
    const delayed=m.sourceStatus==='DELAYED';
    const fallback=m.sourceStatus==='FALLBACK';
    return {
      id:'MARKET',
      label:'Prijs / asset',
      source,
      api:fallback?'GAP':live||delayed?'OK':'MODEL',
      normalize:fallback?'FALLBACK':'OK',
      qubus:snapshot?.marketRec?'STORED':'GAP',
      m24:m.values?.length?'ACTIVE':'GAP',
      freshness:m.sourceFreshness||'UNKNOWN',
      asOf:m.sourceAsOf||null,
      quality:m.sourceQuality||null,
      overall:fallback?'SOURCE_GAP':live?'LIVE':delayed?'DELAYED':'MODEL'
    };
  }

  function crossRow(snapshot){
    const items=Array.isArray(snapshot?.cross)?snapshot.cross:[];
    const ok=items.filter(x=>x.status==='OK').length;
    const gaps=items.filter(x=>x.status==='SOURCE_GAP').length;
    const stored=Array.isArray(snapshot?.crossRecs)?snapshot.crossRecs.length:0;
    const freshness=items.find(x=>x.sourceFreshness)?.sourceFreshness||'DAILY_DELAYED';
    const asOf=items.map(x=>x.asOf).filter(Boolean).sort().at(-1)||null;
    return {
      id:'CROSS',
      label:'Cross-asset',
      source:'FRED',
      api:ok?(gaps?'PARTIAL':'OK'):'GAP',
      normalize:ok?'OK':'GAP',
      qubus:stored===items.length&&items.length?'STORED':stored?'PARTIAL':'GAP',
      m24:items.length?'ACTIVE':'GAP',
      freshness,
      asOf,
      quality:'OFFICIAL_OR_OFFICIAL_UPSTREAM',
      overall:ok?(gaps?'PARTIAL':'DAILY'):'SOURCE_GAP'
    };
  }

  function meaningRow(snapshot){
    const meaning=snapshot?.meaning||{};
    return {
      id:'MEANING',
      label:'Betekenis',
      source:'M24 MODEL',
      api:'MODEL',
      normalize:'OK',
      qubus:snapshot?.meaningRec?'STORED':'GAP',
      m24:meaning?'ACTIVE':'GAP',
      freshness:'MODEL_CONTEXT',
      asOf:null,
      quality:'MODEL',
      overall:'MODEL'
    };
  }

  function worldRow(){
    return {
      id:'WORLD',
      label:'Strategic world',
      source:'SNAPSHOT',
      api:'SNAPSHOT',
      normalize:'OK',
      qubus:'SEPARATE',
      m24:'ACTIVE',
      freshness:'SNAPSHOT',
      asOf:null,
      quality:'SOURCE_BOUND_SNAPSHOT',
      overall:'SNAPSHOT'
    };
  }

  function executionRow(){
    return {
      id:'EXECUTION',
      label:'Uitvoering',
      source:'PAPER ENGINE',
      api:'NO_BROKER',
      normalize:'N/A',
      qubus:'AUDIT',
      m24:'SIMULATED_ONLY',
      freshness:'N/A',
      asOf:null,
      quality:'SAFE_MODE',
      overall:'PAPER'
    };
  }

  function build(snapshot){
    return [marketRow(snapshot),crossRow(snapshot),meaningRow(snapshot),worldRow(),executionRow()];
  }

  return {build,marketRow,crossRow,meaningRow,worldRow,executionRow};
});