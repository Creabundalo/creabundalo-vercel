const M24Lab = (() => {
  const round=(n,d=2)=>Number(n.toFixed(d));
  const pct=(a,b)=>b===0?null:((a/b)-1)*100;

  function rsiWilder(bars, period=14) {
    const closes=bars.map(x=>Number(x.close));
    const values=Array(closes.length).fill(null);
    if (closes.length<=period) return values;
    let gain=0,loss=0;
    for(let i=1;i<=period;i++){
      const d=closes[i]-closes[i-1];
      gain+=Math.max(d,0);loss+=Math.max(-d,0);
    }
    let avgGain=gain/period,avgLoss=loss/period;
    values[period]=avgLoss===0?100:100-(100/(1+(avgGain/avgLoss)));
    for(let i=period+1;i<closes.length;i++){
      const d=closes[i]-closes[i-1];
      avgGain=((avgGain*(period-1))+Math.max(d,0))/period;
      avgLoss=((avgLoss*(period-1))+Math.max(-d,0))/period;
      values[i]=avgLoss===0?100:100-(100/(1+(avgGain/avgLoss)));
    }
    return values;
  }

  function analyzeTopMarkdown(caseDef) {
    const bars=caseDef.bars||[];
    const indexOf=date=>bars.findIndex(x=>x.date===date);
    const firstIndex=indexOf(caseDef.firstTopDate);
    const secondIndex=indexOf(caseDef.secondTopDate);
    const supportIndex=indexOf(caseDef.supportDate);
    if ([firstIndex,secondIndex,supportIndex].some(i=>i<0)) throw new Error('Historical case checkpoints are missing from bars.');

    const rsi=rsiWilder(bars,14);
    const first=bars[firstIndex],second=bars[secondIndex];
    const supportLow=bars[supportIndex].low;
    const breakIndex=bars.findIndex((x,i)=>i>secondIndex && x.close<supportLow);
    const after=bars.slice(secondIndex+1);
    const trough=after.reduce((a,b)=>b.low<a.low?b:a,after[0]);
    const firstRsi=rsi[firstIndex],secondRsi=rsi[secondIndex];
    const rsiDivergence=Number.isFinite(firstRsi)&&Number.isFinite(secondRsi)&&second.high>first.high&&secondRsi<firstRsi;
    const volumeDivergence=second.high>first.high&&second.volume<first.volume;

    return {
      caseId:caseDef.id,
      resolution:caseDef.resolution||'W',
      firstTop:{date:first.date,high:first.high,close:first.close,volume:first.volume,rsi14:firstRsi==null?null:round(firstRsi)},
      secondTop:{date:second.date,high:second.high,close:second.close,volume:second.volume,rsi14:secondRsi==null?null:round(secondRsi)},
      comparisons:{
        priceHighChangePct:round(pct(second.high,first.high)),
        volumeChangePct:round(pct(second.volume,first.volume)),
        rsiChange:round((secondRsi??0)-(firstRsi??0)),
        rsiBearishDivergence:rsiDivergence,
        volumeBearishDivergence:volumeDivergence
      },
      support:{
        referenceDate:bars[supportIndex].date,
        referenceLow:supportLow,
        firstWeeklyCloseBelow:breakIndex>=0?bars[breakIndex].date:null,
        breakClose:breakIndex>=0?bars[breakIndex].close:null
      },
      outcome:{
        troughDate:trough?.date||null,
        troughLow:trough?.low??null,
        drawdownFromSecondHighPct:trough?round(pct(trough.low,second.high)):null
      },
      verdicts:[
        {
          test:'SECOND_TOP',
          status:second.high>first.high?'CONFIRMED':'NOT_CONFIRMED',
          statement:`Tweede week-high ${second.high>first.high?'boven':'niet boven'} eerste week-high.`
        },
        {
          test:'VOLUME_DIVERGENCE',
          status:volumeDivergence?'CONFIRMED':'NOT_CONFIRMED',
          statement:`Weekvolume tweede top ${Math.abs(round(pct(second.volume,first.volume),1))}% ${second.volume<first.volume?'lager':'hoger'} dan bij de eerste top.`
        },
        {
          test:'RSI_DIVERGENCE',
          status:rsiDivergence?'CONFIRMED':'REJECTED_FOR_THIS_FIXTURE',
          statement:rsiDivergence?'RSI(14) bevestigt bearish divergentie.':'RSI(14) bevestigt in deze wekelijkse fixture géén bearish divergentie; hypothese wordt niet als feit opgeslagen.'
        },
        {
          test:'SUPPORT_BREAK',
          status:breakIndex>=0?'CONFIRMED':'NOT_CONFIRMED',
          statement:breakIndex>=0?`Eerste wekelijkse close onder support op ${bars[breakIndex].date}.`:'Geen wekelijkse support-break gevonden.'
        }
      ],
      provenance:[caseDef.source]
    };
  }

  return {rsiWilder,analyzeTopMarkdown};
})();
