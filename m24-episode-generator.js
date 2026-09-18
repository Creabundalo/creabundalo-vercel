globalThis.M24EpisodeGenerator = (() => {
  const DAY_MS=86400000;
  const round=(n,d=4)=>Number(Number(n).toFixed(d));
  const finite=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v));
  const ms=d=>new Date(`${d}T00:00:00Z`).getTime();
  const daysBetween=(a,b)=>Math.round((ms(b)-ms(a))/DAY_MS);

  const DEFAULT_RULE=Object.freeze({
    id:'FAST_DISTRIBUTION_V1',
    rsiPeriod:14,
    minPeakSeparationDays:21,
    maxPeakSeparationDays:240,
    minRetestRatio:0.92,
    maxRetestRatio:1.10,
    localPeakLookbackDays:7,
    maxVolumeRatio:0.85,
    minRsiWeakeningPoints:5,
    cooldownDays:75
  });

  function mergeRule(rule={}){return {...DEFAULT_RULE,...rule}}

  function normalizedBars(bars){
    return (bars||[])
      .filter(x=>x?.date&&finite(x.high)&&finite(x.close))
      .map(x=>({...x,high:Number(x.high),close:Number(x.close),volume:finite(x.volume)?Number(x.volume):null}))
      .sort((a,b)=>a.date.localeCompare(b.date));
  }

  function candidateAt({asset,bars,rsi,index,rule}){
    const current=bars[index];
    if(!current||index<rule.rsiPeriod+rule.minPeakSeparationDays) return null;

    const eligible=[];
    for(let j=0;j<index;j++){
      const gap=daysBetween(bars[j].date,current.date);
      if(gap>=rule.minPeakSeparationDays&&gap<=rule.maxPeakSeparationDays) eligible.push(j);
    }
    if(!eligible.length) return null;
    const firstIndex=eligible.reduce((best,j)=>bars[j].high>bars[best].high?j:best,eligible[0]);
    const first=bars[firstIndex];
    const ratio=current.high/first.high;
    if(ratio<rule.minRetestRatio||ratio>rule.maxRetestRatio) return null;

    const localStart=Math.max(0,index-rule.localPeakLookbackDays);
    const priorLocalHigh=Math.max(...bars.slice(localStart,index).map(x=>x.high));
    if(current.high<priorLocalHigh) return null;

    const volumeRatio=finite(first.volume)&&finite(current.volume)&&first.volume!==0?current.volume/first.volume:null;
    const rsiFirst=rsi[firstIndex],rsiSecond=rsi[index];
    const rsiDelta=finite(rsiFirst)&&finite(rsiSecond)?Number(rsiSecond)-Number(rsiFirst):null;
    const volumeWeak=finite(volumeRatio)&&volumeRatio<=rule.maxVolumeRatio;
    const rsiWeak=finite(rsiDelta)&&rsiDelta<=-rule.minRsiWeakeningPoints;
    if(!volumeWeak&&!rsiWeak) return null;

    return {
      type:'EPISODE_CANDIDATE',
      asset,
      decisionDate:current.date,
      regimeFamily:'DISTRIBUTION_MARKDOWN',
      horizonProfile:'FAST_MARKET',
      selectorRule:rule.id,
      firstTop:{
        date:first.date,high:first.high,close:first.close,volume:first.volume,
        rsi14:finite(rsiFirst)?round(rsiFirst):null
      },
      checkpoint:{
        date:current.date,high:current.high,close:current.close,volume:current.volume,
        rsi14:finite(rsiSecond)?round(rsiSecond):null
      },
      observed:{
        peakSeparationDays:daysBetween(first.date,current.date),
        retestRatio:round(ratio),
        volumeRatio:finite(volumeRatio)?round(volumeRatio):null,
        rsiDelta:finite(rsiDelta)?round(rsiDelta):null,
        volumeWeak,rsiWeak
      },
      evidenceStatus:'PRICE_CANDIDATE_ONLY',
      outcomeStatus:'UNREAD_AT_SELECTION',
      rule:'Candidate selection uses bars at or before decisionDate only. Future support breaks, troughs and returns are not inputs.'
    };
  }

  function dedupeCandidates(candidates,rule){
    const accepted=[],suppressed=[];
    let currentGroup=null;
    for(const candidate of candidates){
      if(!currentGroup||daysBetween(currentGroup.anchorDate,candidate.decisionDate)>rule.cooldownDays){
        currentGroup={
          id:`${candidate.asset}:${candidate.regimeFamily}:${candidate.decisionDate}`,
          anchorDate:candidate.decisionDate,
          selectedDecisionDate:candidate.decisionDate
        };
        accepted.push({...candidate,episodeGroup:currentGroup.id});
      }else{
        suppressed.push({
          ...candidate,
          episodeGroup:currentGroup.id,
          suppressedReason:'COOLDOWN_DUPLICATE',
          selectedDecisionDate:currentGroup.selectedDecisionDate
        });
      }
    }
    return {accepted,suppressed};
  }

  function scanFastMarket({asset,bars,rule={}}={}){
    if(!asset) throw new Error('Episode scan requires asset.');
    const cfg=mergeRule(rule);
    const xs=normalizedBars(bars);
    if(xs.length<=cfg.rsiPeriod) return {type:'EPISODE_SCAN_RESULT',asset,rule:cfg,candidates:[],suppressed:[],sourceCount:xs.length};
    const rsi=M24Lab.rsiWilder(xs,cfg.rsiPeriod);
    const raw=[];
    for(let i=0;i<xs.length;i++){
      const c=candidateAt({asset,bars:xs,rsi,index:i,rule:cfg});
      if(c) raw.push(c);
    }
    const dedup=dedupeCandidates(raw,cfg);
    return {
      type:'EPISODE_SCAN_RESULT',
      asset,rule:cfg,sourceCount:xs.length,
      candidates:dedup.accepted,
      suppressed:dedup.suppressed,
      rawCandidateCount:raw.length,
      selectedCount:dedup.accepted.length,
      ruleText:'The first qualifying candidate in an episode group is selected. Later near-duplicate candidates are suppressed without consulting outcomes.'
    };
  }

  return {DEFAULT_RULE,mergeRule,normalizedBars,candidateAt,dedupeCandidates,scanFastMarket,daysBetween};
})();