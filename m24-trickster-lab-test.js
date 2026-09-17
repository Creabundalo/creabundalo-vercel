const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('m24-trickster-lab.js','utf8');
const test=`
(()=>{
  const check=(condition,message)=>{if(!condition) throw new Error(message)};
  const labResult={caseId:'BTC-2021-2022-TOP-MARKDOWN',comparisons:{volumeBearishDivergence:true,rsiBearishDivergence:false}};
  const meaningContext={firstTop:{direction:0.7},secondTop:{direction:0.825}};
  const derivativesContext={comparison:{crowdingShift:'MORE_POSITIVE_AT_SECOND_TOP'}};
  const macroContext={series:[
    {key:'DOLLAR',seriesId:'DTWEXBGS',status:'COMPARABLE',delta:2.5},
    {key:'FIN_CONDITIONS',seriesId:'NFCI',status:'COMPARABLE',delta:0.2},
    {key:'TEN_YEAR',seriesId:'DGS10',status:'COMPARABLE',delta:-0.14}
  ]};
  const result=M24TricksterLab.assess({labResult,meaningContext,derivativesContext,macroContext});
  const ids=result.contrasts.map(x=>x.id);
  check(ids.includes('POSITIVE_NARRATIVE_WEAK_PARTICIPATION'),'price/meaning contrast missing');
  check(!ids.includes('POSITIVE_NARRATIVE_WEAK_MOMENTUM'),'rejected RSI divergence must not be resurrected');
  check(ids.includes('POSITIVE_NARRATIVE_LONG_CROWDING'),'derivatives/meaning contrast missing');
  check(ids.includes('POSITIVE_NARRATIVE_STRONGER_DOLLAR'),'dollar contrast missing');
  check(ids.includes('POSITIVE_NARRATIVE_TIGHTER_FINANCIAL_CONDITIONS'),'financial conditions contrast missing');
  check(!ids.includes('POSITIVE_NARRATIVE_HIGHER_LONG_RATE'),'falling long rate must not be mislabeled higher');
  check(result.intentStatus==='INTENT_UNKNOWN'&&result.actorAttribution==='NONE','Trickster must not infer actor/intent');
  check(result.evidenceStatus==='PLAUSIBLE_INTERPRETATION','historical Trickster result must remain hypothesis-level');
  const partial=M24TricksterLab.assess({labResult,meaningContext});
  check(partial.missingLayers.includes('derivatives')&&partial.missingLayers.includes('macro'),'missing layers must remain explicit');
  console.log('M24 historical Trickster test OK',JSON.stringify({contrasts:ids,missingPartial:partial.missingLayers}));
})();
`;

try{vm.runInThisContext(`${source}\n${test}`,{filename:'m24-trickster-lab-test-bundle.js'})}catch(err){console.error(err);process.exit(1)}
