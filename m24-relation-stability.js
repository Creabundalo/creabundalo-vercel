globalThis.M24RelationStability = (() => {
  const round=(n,d=4)=>Number(Number(n).toFixed(d));
  function compare({relationA,relationB,labelA='A',labelB='B'}={}){
    const a=Number(relationA?.contemporaneous?.correlation),b=Number(relationB?.contemporaneous?.correlation);
    if(!Number.isFinite(a)||!Number.isFinite(b)) return {type:'RELATION_STABILITY',state:'INSUFFICIENT_SAMPLE',labelA,labelB};
    const delta=round(b-a);
    const signFlip=Math.sign(a)!==Math.sign(b)&&Math.abs(a)>=0.2&&Math.abs(b)>=0.2;
    const magnitudeShift=Math.abs(delta)>=0.4;
    const state=signFlip?'SIGN_FLIP':magnitudeShift?'MATERIAL_CHANGE':'STABLE_WITHIN_THRESHOLD';
    return {
      type:'RELATION_STABILITY',state,labelA,labelB,
      correlationA:a,correlationB:b,delta,signFlip,magnitudeShift,
      evidenceStatus:'MEASURED_ASSOCIATION_CHANGE',
      causalityStatus:'NOT_ESTABLISHED',
      rule:'Relation stability compares measured associations across explicit windows/regimes. A sign flip is not itself evidence of causal reversal.'
    };
  }
  return {compare};
})();