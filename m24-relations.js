globalThis.M24Relations = (() => {
  const round=(n,d=4)=>Number(Number(n).toFixed(d));
  const finite=n=>Number.isFinite(Number(n));

  function transform(records,mode='RETURN_PCT'){
    const xs=(records||[]).filter(x=>x?.date&&finite(x.value)).sort((a,b)=>a.date.localeCompare(b.date));
    const out=[];
    for(let i=1;i<xs.length;i++){
      const prev=Number(xs[i-1].value),cur=Number(xs[i].value);
      let value=null;
      if(mode==='RETURN_PCT'&&prev!==0) value=((cur/prev)-1)*100;
      else if(mode==='DELTA') value=cur-prev;
      if(Number.isFinite(value)) out.push({date:xs[i].date,value});
    }
    return out;
  }

  function align(left,right){
    const r=new Map((right||[]).map(x=>[x.date,Number(x.value)]));
    return (left||[]).filter(x=>r.has(x.date)&&finite(x.value)&&finite(r.get(x.date))).map(x=>({
      date:x.date,left:Number(x.value),right:r.get(x.date)
    }));
  }

  function pearson(pairs){
    const xs=(pairs||[]).map(x=>Number(x.left)),ys=(pairs||[]).map(x=>Number(x.right));
    const n=xs.length;if(n<3) return null;
    const mx=xs.reduce((a,b)=>a+b,0)/n,my=ys.reduce((a,b)=>a+b,0)/n;
    let num=0,dx=0,dy=0;
    for(let i=0;i<n;i++){const a=xs[i]-mx,b=ys[i]-my;num+=a*b;dx+=a*a;dy+=b*b}
    if(dx===0||dy===0) return null;
    return num/Math.sqrt(dx*dy);
  }

  function lagPairs(aligned,lag){
    if(lag===0) return aligned;
    const out=[];
    if(lag>0){
      for(let i=lag;i<aligned.length;i++) out.push({date:aligned[i].date,left:aligned[i].left,right:aligned[i-lag].right});
    }else{
      const k=Math.abs(lag);
      for(let i=k;i<aligned.length;i++) out.push({date:aligned[i].date,left:aligned[i-k].left,right:aligned[i].right});
    }
    return out;
  }

  function strength(corr){
    const a=Math.abs(Number(corr));
    if(!Number.isFinite(a)) return 'INSUFFICIENT';
    if(a>=0.7) return 'STRONG';
    if(a>=0.4) return 'MODERATE';
    return 'WEAK';
  }

  function discoverPair({leftId,rightId,leftRecords,rightRecords,leftTransform='RETURN_PCT',rightTransform='RETURN_PCT',maxLag=3,minObs=20,window=null,regime=null}={}){
    const l=transform(leftRecords,leftTransform),r=transform(rightRecords,rightTransform);
    const aligned=align(l,r);
    if(aligned.length<minObs) return {
      type:'CROSS_ASSET_RELATION',leftId,rightId,state:'INSUFFICIENT_SAMPLE',
      sampleSize:aligned.length,minObs,window,regime,
      rule:'No relation is promoted below the minimum aligned sample.'
    };
    const lags=[];
    for(let lag=-maxLag;lag<=maxLag;lag++){
      const pairs=lagPairs(aligned,lag),corr=pearson(pairs);
      if(corr!=null) lags.push({lagMatchedObservations:lag,correlation:round(corr),sampleSize:pairs.length});
    }
    const contemporaneous=lags.find(x=>x.lagMatchedObservations===0)||null;
    const best=lags.slice().sort((a,b)=>Math.abs(b.correlation)-Math.abs(a.correlation))[0]||null;
    return {
      type:'CROSS_ASSET_RELATION',leftId,rightId,state:'MEASURED_ASSOCIATION',
      window,regime,leftTransform,rightTransform,sampleSize:aligned.length,
      contemporaneous:{...contemporaneous,strength:strength(contemporaneous?.correlation)},
      bestLag:best?{...best,strength:strength(best.correlation),interpretation:best.lagMatchedObservations>0?`${rightId} leads ${leftId} by ${best.lagMatchedObservations} matched observation(s)`:best.lagMatchedObservations<0?`${leftId} leads ${rightId} by ${Math.abs(best.lagMatchedObservations)} matched observation(s)`:'CONTEMPORANEOUS'}:null,
      lagScan:lags,
      evidenceStatus:'MEASURED_ASSOCIATION',
      causalityStatus:'NOT_ESTABLISHED',
      rule:'Correlation and lag are window/regime-specific measured associations. They do not establish causality or actor intent.'
    };
  }

  function toRecordPayload(result,provenance=[]){
    return {type:'CROSS_ASSET_RELATION',data:result,evidenceStatus:'MECHANISM_VISIBLE',confidence:null,provenance};
  }

  return {transform,align,pearson,lagPairs,strength,discoverPair,toRecordPayload};
})();