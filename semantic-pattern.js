(() => {
  const STOP=new Set('de het een en of dat die dit van voor met op in aan te is zijn was waren wordt worden als bij naar om uit ik jij je wij we ze zij hij haar hem hun mijn jouw onze deze die daar hier dan maar ook nog wel niet geen wat hoe waarom waar welke wie wanneer kan kunnen moet moeten zou zouden'.split(' '));

  function words(text){
    return String(text||'').toLocaleLowerCase('nl-NL')
      .normalize('NFKD')
      .replace(/[^a-z0-9\s-]/g,' ')
      .split(/\s+/)
      .filter(w=>w.length>=4&&!STOP.has(w));
  }
  function entropy(tokens){
    if(!tokens.length) return 0;
    const counts=new Map();
    for(const t of tokens)counts.set(t,(counts.get(t)||0)+1);
    let h=0;
    for(const count of counts.values()){
      const p=count/tokens.length;
      h-=p*Math.log2(p);
    }
    return h;
  }
  function ancestors(state,id){
    const map=new Map((state.nodes||[]).map(n=>[n.id,n]));
    const out=[]; let n=map.get(id); const seen=new Set();
    while(n&&!seen.has(n.id)){
      seen.add(n.id);out.unshift(n);n=n.parentId?map.get(n.parentId):null;
    }
    return out;
  }
  function branchSlice(state,currentId){
    const chain=ancestors(state,currentId);
    let anchor=0;
    for(let i=chain.length-2;i>=0;i--){
      if(['project','root','session'].includes(chain[i].kind)){anchor=i;break;}
    }
    return chain.slice(anchor);
  }
  function siblingPressure(state,current){
    if(!current?.parentId) return 0;
    const siblings=(state.nodes||[]).filter(n=>n.parentId===current.parentId&&n.id!==current.id&&n.status!=='paused');
    return Math.min(1,siblings.length/4);
  }
  function childPressure(state,current){
    if(!current) return 0;
    const children=(state.nodes||[]).filter(n=>n.parentId===current.id&&n.status!=='paused');
    return Math.min(1,children.length/4);
  }
  function analyze(state,{currentId=state?.currentId}={}){
    const current=(state?.nodes||[]).find(n=>n.id===currentId);
    if(!current)return {score:0,label:'open',confidence:0,reasons:['geen current node'],signals:{}};

    const slice=branchSlice(state,currentId);
    const texts=slice.flatMap(n=>[n.title,n.edgeLabel]).filter(Boolean);
    const tokenLists=texts.map(words);
    const all=tokenLists.flat();
    const unique=new Set(all);
    const repeatRatio=all.length?1-(unique.size/all.length):0;

    const termCoverage=Math.min(1,unique.size/18);
    const depth=Math.max(0,slice.length-1);
    const depthSignal=Math.min(1,depth/7);
    const repetition=Math.max(0,Math.min(1,repeatRatio*2.2));
    const childOpen=childPressure(state,current);
    const siblingOpen=siblingPressure(state,current);

    const closureWords=/\b(klaar|besluit|besloten|actie|volgende stap|bouwen|uitvoeren|afronden|conclusie|plan|planning|implementeren|doe maar|next)\b/i;
    const questionWords=/\?\s*$|\b(hoe|waarom|wat|welke|wie|wanneer|kan|moet)\b/i;
    const lastText=[current.title,current.edgeLabel].filter(Boolean).join(' ');
    const closureSignal=(current.kind==='action'||current.status==='paused'||closureWords.test(lastText))?1:0;
    const openQuestion=questionWords.test(lastText)?1:0;

    const vocabularyStability=Math.max(0,1-Math.min(1,entropy(all)/5));
    const unresolvedPenalty=Math.min(1,.55*childOpen+.45*siblingOpen);

    let score=
      .20*depthSignal+
      .22*repetition+
      .16*termCoverage+
      .18*closureSignal+
      .12*vocabularyStability+
      .12*(1-unresolvedPenalty);

    score-=.10*openQuestion;
    score=Math.max(0,Math.min(1,score));

    let label='open';
    if(score>=.72)label='verzadigd';
    else if(score>=.48)label='convergerend';
    else if(score>=.28)label='vormend';

    const reasons=[];
    if(depthSignal>.65) reasons.push('lange samenhangende branch');
    if(repetition>.55) reasons.push('kernbegrippen keren terug');
    if(termCoverage>.65) reasons.push('voldoende semantische dekking');
    if(closureSignal) reasons.push('besluit/actie-signaal aanwezig');
    if(unresolvedPenalty>.45) reasons.push('nog meerdere open zijtakken');
    if(openQuestion) reasons.push('current eindigt nog als open vraag');
    if(!reasons.length) reasons.push('patroon nog in opbouw');

    const confidence=Math.min(1,.35+.07*Math.min(8,slice.length)+.02*Math.min(15,texts.length));

    return {
      score,
      label,
      confidence,
      reasons,
      signals:{
        depth:depthSignal,
        repetition,
        coverage:termCoverage,
        closure:closureSignal,
        vocabularyStability,
        unresolvedPenalty,
        openQuestion
      }
    };
  }

  window.CreaPatternSaturation={analyze,words};
})();