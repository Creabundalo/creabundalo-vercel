globalThis.M24EpisodeUniverse = (() => {
  const UNIVERSES=Object.freeze({
    FAST_DISTRIBUTION_V1:Object.freeze({
      generatorRule:'FAST_DISTRIBUTION_V1',
      frozenAt:'2026-09-18',
      assets:Object.freeze({
        ETH:Object.freeze({from:'2020-01-01',to:'2025-12-31'}),
        SOL:Object.freeze({from:'2021-08-01',to:'2025-12-31'})
      }),
      note:'Fixed historical scan windows for the first mechanics-core expansion cohort. Changing a boundary requires a new universe version.'
    })
  });

  function get(id='FAST_DISTRIBUTION_V1'){
    const u=UNIVERSES[id];return u?structuredClone(u):null;
  }

  function assetWindow(asset,id='FAST_DISTRIBUTION_V1'){
    const u=UNIVERSES[id];
    const w=u?.assets?.[asset];
    if(!u||!w) throw new Error(`No canonical episode universe window for ${asset} in ${id}.`);
    return structuredClone(w);
  }

  function scanCanonical({asset,bars,universeId='FAST_DISTRIBUTION_V1',rule={}}={}){
    const universe=UNIVERSES[universeId];
    if(!universe) throw new Error(`Unknown episode universe ${universeId}.`);
    const window=assetWindow(asset,universeId);
    const bounded=(bars||[]).filter(x=>x?.date>=window.from&&x?.date<=window.to);
    const scan=M24EpisodeGenerator.scanFastMarket({asset,bars:bounded,rule:{...rule,id:universe.generatorRule}});
    const decorate=c=>({
      ...c,
      selectionUniverseId:universeId,
      selectionWindow:structuredClone(window),
      selectionEligible:true
    });
    return {
      ...scan,
      selectionUniverseId:universeId,
      selectionWindow:window,
      candidates:scan.candidates.map(decorate),
      suppressed:scan.suppressed.map(decorate),
      selectionEligible:true,
      ruleText:scan.ruleText+' Candidate eligibility is valid only inside this frozen universe version.'
    };
  }

  function verifyCandidate(candidate){
    if(!candidate?.selectionEligible||!candidate?.selectionUniverseId||!candidate?.selectionWindow) return {eligible:false,reason:'NON_CANONICAL_SELECTION'};
    const universe=UNIVERSES[candidate.selectionUniverseId];
    const expected=universe?.assets?.[candidate.asset];
    if(!expected) return {eligible:false,reason:'ASSET_NOT_IN_UNIVERSE'};
    const same=expected.from===candidate.selectionWindow.from&&expected.to===candidate.selectionWindow.to;
    const inside=candidate.decisionDate>=expected.from&&candidate.decisionDate<=expected.to;
    return {eligible:same&&inside,reason:same&&inside?null:'UNIVERSE_WINDOW_MISMATCH',universeId:candidate.selectionUniverseId,expected:structuredClone(expected)};
  }

  return {UNIVERSES,get,assetWindow,scanCanonical,verifyCandidate};
})();