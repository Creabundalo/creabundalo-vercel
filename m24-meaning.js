globalThis.M24Meaning = (() => {
  const SOURCES=Object.freeze([
    Object.freeze({
      id:'SRC-REUTERS-2021-04-14-COINBASE',publishedAt:'2021-04-14T06:02:00Z',publisher:'Reuters',transport:'Yahoo/Reuters syndication',
      title:"Coinbase listing marks latest step in crypto's march to the mainstream",
      url:'https://tech.yahoo.com/general/articles/coinbase-listing-marks-latest-step-060207358.html',
      frames:['MAINSTREAM_ADOPTION','INSTITUTIONAL_LEGITIMACY'],direction:0.75,
      summary:'Coinbase public listing was framed as a milestone in cryptocurrency acceptance by mainstream finance.',
      quality:'PRIMARY_MEDIA_SYNDICATED'
    }),
    Object.freeze({
      id:'SRC-REUTERS-2021-04-14-VALIDATION',publishedAt:'2021-04-14T12:00:00Z',publisher:'Reuters',transport:'Reuters Archive',
      title:"Coinbase IPO represents 'validation' of crypto market - analyst",
      url:'https://reuters.screenocean.com/record/1611245',
      frames:['MAINSTREAM_ADOPTION','VALIDATION_FRAME'],direction:0.65,
      summary:'Analyst commentary around the Coinbase debut emphasized legitimacy and integration into the financial system.',
      quality:'PRIMARY_MEDIA_ARCHIVE'
    }),
    Object.freeze({
      id:'SRC-REUTERS-2021-05-19-CHINA',publishedAt:'2021-05-19T07:28:00Z',publisher:'Reuters',transport:'Reuters syndication',
      title:'Bitcoin slides below $40,000, ether tumbles',
      url:'https://economictimes.indiatimes.com/markets/cryptocurrency/bitcoin-slides-below-40000-ether-tumbles/articleshow/82761035.cms',
      frames:['REGULATORY_RISK','CHINA_RESTRICTIONS','TESLA_MUSK_UNCERTAINTY','SELL_OFF'],direction:-0.85,
      summary:'Coverage linked the sharp decline to China restrictions and earlier uncertainty following Tesla/Musk communications.',
      quality:'PRIMARY_MEDIA_SYNDICATED'
    }),
    Object.freeze({
      id:'SRC-REUTERS-2021-09-07-ELSALVADOR',publishedAt:'2021-09-07T14:32:00Z',publisher:'Reuters',transport:'Euronews with Reuters',
      title:'Bitcoin battered as El Salvador officially adopts the crypto as a legal currency',
      url:'https://www.euronews.com/next/2021/09/07/el-salvador-makes-history-as-bitcoin-is-officially-adopted-as-a-currency-but-not-without-i',
      frames:['SOVEREIGN_ADOPTION','IMPLEMENTATION_FRICTION','VOLATILITY'],direction:0.0,
      summary:'Legal-tender adoption created a strong adoption frame while rollout problems and a sharp price fall created simultaneous friction.',
      quality:'PRIMARY_MEDIA_SYNDICATED'
    }),
    Object.freeze({
      id:'SRC-REUTERS-2021-11-09-INFLATION',publishedAt:'2021-11-09T10:49:00Z',publisher:'Reuters',transport:'Global News syndication',
      title:'Bitcoin price hits new all-time high amid inflation worries',
      url:'https://globalnews.ca/news/8360529/bitcoin-price-record-high-inflation/',
      frames:['INFLATION_HEDGE','ADOPTION_MOMENTUM','RECORD_HIGH'],direction:0.8,
      summary:'Coverage associated record highs with adoption enthusiasm and concern about inflation.',
      quality:'PRIMARY_MEDIA_SYNDICATED'
    }),
    Object.freeze({
      id:'SRC-REUTERS-2021-11-09-INFLOWS',publishedAt:'2021-11-09T07:04:00Z',publisher:'Reuters',transport:'Interaksyon syndication',
      title:'Bitcoin inflows hit record high so far in 2021 — CoinShares data',
      url:'https://interaksyon.philstar.com/business/2021/11/09/204071/bitcoin-inflows-hit-record-high-so-far-in-2021-coinshares-data/',
      frames:['INSTITUTIONAL_FLOWS','GOVERNMENT_ACCEPTANCE','POSITIVE_MOMENTUM'],direction:0.85,
      summary:'Fund-flow reporting emphasized record annual inflows, government acceptance and sustained institutional demand.',
      quality:'PRIMARY_MEDIA_SYNDICATED'
    })
  ]);

  const ms=value=>new Date(value).getTime();
  const round=(n,d=3)=>Number(Number(n).toFixed(d));

  function inWindow(item,window){
    const t=ms(item.publishedAt),from=ms(`${window.from}T00:00:00Z`),to=ms(`${window.to}T23:59:59Z`);
    return t>=from&&t<=to;
  }

  function aggregate(items){
    const frameCounts={};
    items.forEach(item=>item.frames.forEach(frame=>frameCounts[frame]=(frameCounts[frame]||0)+1));
    const direction=items.length?round(items.reduce((sum,x)=>sum+x.direction,0)/items.length):null;
    const dominantFrames=Object.entries(frameCounts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([frame,count])=>({frame,count}));
    return {count:items.length,direction,dominantFrames,sourceIds:items.map(x=>x.id)};
  }

  function analyzeCase(caseSchema,sources=SOURCES){
    const firstItems=sources.filter(x=>inWindow(x,caseSchema.checkpointWindows.firstTop));
    const reactionItems=sources.filter(x=>inWindow(x,caseSchema.checkpointWindows.automaticReaction));
    const supportItems=sources.filter(x=>inWindow(x,caseSchema.checkpointWindows.supportReference));
    const secondItems=sources.filter(x=>inWindow(x,caseSchema.checkpointWindows.secondTop));
    return {
      type:'MEANING_WORLD_CONTEXT',caseId:caseSchema.id,asset:caseSchema.asset,
      firstTop:aggregate(firstItems),automaticReaction:aggregate(reactionItems),supportReference:aggregate(supportItems),secondTop:aggregate(secondItems),
      sources:structuredClone(sources),
      comparison:{directionDelta:firstItems.length&&secondItems.length?round(aggregate(secondItems).direction-aggregate(firstItems).direction):null},
      evidenceStatus:'SOURCE_CLAIM',
      note:'Frame direction is an explicit coding aid for comparing narratives, not a truth score and not a price prediction.'
    };
  }

  function toProvenance(item){return {sourceId:item.id,sourceType:'TIMESTAMPED_MEDIA_SOURCE',quality:item.quality,publisher:item.publisher,publishedAt:item.publishedAt,url:item.url,title:item.title}}

  return {SOURCES,inWindow,aggregate,analyzeCase,toProvenance};
})();
