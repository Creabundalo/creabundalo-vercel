const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('m24-trickster-lab.js','utf8');
const test=`
(()=>{
  const check=(condition,message)=>{if(!condition) throw new Error(message)};
  const labResult={caseId:'BTC-2021-2022-TOP-MARKDOWN',comparisons:{volumeBearishDivergence:true,rsiBearishDivergence:false}};
  const meaningContext={firstTop:{direction:0.7},secondTop:{direction:0.825}};
  const derivativesContext={comparison:{crowdingShift:'MORE_POSITIVE_AT_SECOND_TOP'}};
  const archiveDerivativesContext={
    firstTop:{summary:{globalLongShort:0.9,takerLongShortVolume:0.92}},
    secondTop:{summary:{globalLongShort:1.15,takerLongShortVolume:1.18}},
    deltas:{sumOpenInterest:40000,globalLongShort:0.25,takerLongShortVolume:0.26}
  };
  const macroContext={series:[
    {key:'DOLLAR',seriesId:'DTWEXBGS',status:'COMPARABLE',delta:2.5},
    {key:'FIN_CONDITIONS',seriesId:'NFCI',status:'COMPARABLE',delta:0.2},
    {key:'TEN_YEAR',seriesId:'DGS10',status:'COMPARABLE',delta:-0.14}
  ]};
  const result=M24TricksterLab.assess({labResult,meaningContext,derivativesContext,archiveDerivativesContext,macroContext});
  const ids=result.contrasts.map(x=>x.id);
  const confirmations=result.confirmations.map(x=>x.id);
  const observations=result.observations.map(x=>x.id);
  check(ids.includes('POSITIVE_NARRATIVE_WEAK_PARTICIPATION'),'price/meaning contrast missing');
  check(!ids.includes('POSITIVE_NARRATIVE_WEAK_MOMENTUM'),'rejected RSI divergence must not be resurrected');
  check(ids.includes('POSITIVE_NARRATIVE_LONG_CROWDING'),'funding/meaning contrast missing');
  check(ids.includes('POSITIVE_NARRATIVE_ARCHIVE_LONG_SKEW'),'archive long-skew contrast missing');
  check(confirmations.includes('POSITIVE_NARRATIVE_TAKER_BUY_CONFIRMATION'),'taker confirmation missing');
  check(observations.includes('OPEN_INTEREST_CHANGE'),'OI change should be descriptive observation');
  check(!ids.includes('OPEN_INTEREST_CHANGE'),'open interest alone must not become directional contrast');
  check(ids.includes('POSITIVE_NARRATIVE_STRONGER_DOLLAR'),'dollar contrast missing');
  check(ids.includes('POSITIVE_NARRATIVE_TIGHTER_FINANCIAL_CONDITIONS'),'financial conditions contrast missing');
  check(!ids.includes('POSITIVE_NARRATIVE_HIGHER_LONG_RATE'),'falling long rate must not be mislabeled higher');
  check(result.intentStatus==='INTENT_UNKNOWN'&&result.actorAttribution==='NONE','Trickster must not infer actor/intent');
  check(result.evidenceStatus==='PLAUSIBLE_INTERPRETATION','historical Trickster result must remain hypothesis-level');
  check(result.rule.startsWith('Open interest is directionless'),'OI evidence rule missing');
  const partial=M24TricksterLab.assess({labResult,meaningContext});
  check(partial.missingLayers.includes('derivatives')&&partial.missingLayers.includes('archiveDerivatives')&&partial.missingLayers.includes('macro'),'missing layers must remain explicit');
  console.log('M24 historical Trickster test OK',JSON.stringify({contrasts:ids,confirmations,observations,missingPartial:partial.missingLayers}));
})();
`;

try{vm.runInThisContext(`${source}\n${test}`,{filename:'m24-trickster-lab-test-bundle.js'})}catch(err){console.error(err);process.exit(1)}
