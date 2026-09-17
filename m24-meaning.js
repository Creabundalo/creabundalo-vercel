globalThis.M24Meaning = (() => {
  const source=spec=>Object.freeze(spec);
  const SOURCES=Object.freeze([
    source({
      id:'SRC-REUTERS-2021-04-14-COINBASE',assets:['BTC'],caseIds:['BTC-2021-2022-TOP-MARKDOWN'],publishedAt:'2021-04-14T06:02:00Z',publisher:'Reuters',transport:'Yahoo/Reuters syndication',
      title:"Coinbase listing marks latest step in crypto's march to the mainstream",
      url:'https://tech.yahoo.com/general/articles/coinbase-listing-marks-latest-step-060207358.html',
      frames:['MAINSTREAM_ADOPTION','INSTITUTIONAL_LEGITIMACY'],direction:0.75,
      summary:'Coinbase public listing was framed as a milestone in cryptocurrency acceptance by mainstream finance.',quality:'PRIMARY_MEDIA_SYNDICATED'
    }),
    source({
      id:'SRC-REUTERS-2021-04-14-VALIDATION',assets:['BTC'],caseIds:['BTC-2021-2022-TOP-MARKDOWN'],publishedAt:'2021-04-14T12:00:00Z',publisher:'Reuters',transport:'Reuters Archive',
      title:"Coinbase IPO represents 'validation' of crypto market - analyst",url:'https://reuters.screenocean.com/record/1611245',
      frames:['MAINSTREAM_ADOPTION','VALIDATION_FRAME'],direction:0.65,
      summary:'Analyst commentary around the Coinbase debut emphasized legitimacy and integration into the financial system.',quality:'PRIMARY_MEDIA_ARCHIVE'
    }),
    source({
      id:'SRC-REUTERS-2021-05-19-CHINA',assets:['BTC'],caseIds:['BTC-2021-2022-TOP-MARKDOWN'],publishedAt:'2021-05-19T07:28:00Z',publisher:'Reuters',transport:'Reuters syndication',
      title:'Bitcoin slides below $40,000, ether tumbles',url:'https://economictimes.indiatimes.com/markets/cryptocurrency/bitcoin-slides-below-40000-ether-tumbles/articleshow/82761035.cms',
      frames:['REGULATORY_RISK','CHINA_RESTRICTIONS','TESLA_MUSK_UNCERTAINTY','SELL_OFF'],direction:-0.85,
      summary:'Coverage linked the sharp decline to China restrictions and earlier uncertainty following Tesla/Musk communications.',quality:'PRIMARY_MEDIA_SYNDICATED'
    }),
    source({
      id:'SRC-REUTERS-2021-09-07-ELSALVADOR',assets:['BTC'],caseIds:['BTC-2021-2022-TOP-MARKDOWN'],publishedAt:'2021-09-07T14:32:00Z',publisher:'Reuters',transport:'Euronews with Reuters',
      title:'Bitcoin battered as El Salvador officially adopts the crypto as a legal currency',url:'https://www.euronews.com/next/2021/09/07/el-salvador-makes-history-as-bitcoin-is-officially-adopted-as-a-currency-but-not-without-i',
      frames:['SOVEREIGN_ADOPTION','IMPLEMENTATION_FRICTION','VOLATILITY'],direction:0.0,
      summary:'Legal-tender adoption created a strong adoption frame while rollout problems and a sharp price fall created simultaneous friction.',quality:'PRIMARY_MEDIA_SYNDICATED'
    }),
    source({
      id:'SRC-REUTERS-2021-11-09-INFLATION',assets:['BTC'],caseIds:['BTC-2021-2022-TOP-MARKDOWN'],publishedAt:'2021-11-09T10:49:00Z',publisher:'Reuters',transport:'Global News syndication',
      title:'Bitcoin price hits new all-time high amid inflation worries',url:'https://globalnews.ca/news/8360529/bitcoin-price-record-high-inflation/',
      frames:['INFLATION_HEDGE','ADOPTION_MOMENTUM','RECORD_HIGH'],direction:0.8,
      summary:'Coverage associated record highs with adoption enthusiasm and concern about inflation.',quality:'PRIMARY_MEDIA_SYNDICATED'
    }),
    source({
      id:'SRC-REUTERS-2021-11-09-INFLOWS',assets:['BTC'],caseIds:['BTC-2021-2022-TOP-MARKDOWN'],publishedAt:'2021-11-09T07:04:00Z',publisher:'Reuters',transport:'Interaksyon syndication',
      title:'Bitcoin inflows hit record high so far in 2021 — CoinShares data',url:'https://interaksyon.philstar.com/business/2021/11/09/204071/bitcoin-inflows-hit-record-high-so-far-in-2021-coinshares-data/',
      frames:['INSTITUTIONAL_FLOWS','GOVERNMENT_ACCEPTANCE','POSITIVE_MOMENTUM'],direction:0.85,
      summary:'Fund-flow reporting emphasized record annual inflows, government acceptance and sustained institutional demand.',quality:'PRIMARY_MEDIA_SYNDICATED'
    }),

    source({
      id:'SRC-REUTERS-ETH-2021-05-03-DEFI',assets:['ETH'],caseIds:['ETH-2021-2022-TOP-MARKDOWN'],publishedAt:'2021-05-03T10:30:00Z',publisher:'Reuters',transport:'Reuters syndication',
      title:'Ethereum breaks past $3,000 to quadruple in value in 2021',url:'https://www.brecorder.com/news/40089762',
      frames:['DEFI_ADOPTION','NETWORK_UTILITY','OUTPERFORMANCE','DECENTRALISED_FINANCE'],direction:0.75,
      summary:'Coverage framed ether strength around growing Ethereum utility, DeFi usage and expectations of a larger role in decentralized finance.',quality:'PRIMARY_MEDIA_SYNDICATED'
    }),
    source({
      id:'SRC-REUTERS-ETH-2021-05-12-RECORD',assets:['ETH'],caseIds:['ETH-2021-2022-TOP-MARKDOWN'],publishedAt:'2021-05-12T10:50:00Z',publisher:'Reuters',transport:'Investing/Reuters syndication',
      title:'Digital coin ether hits record high as 2021 gains near 500%',url:'https://ca.investing.com/news/technology-news/ether-hits-record-high-taking-2021-gains-to-nearly-500-2437648',
      frames:['DEFI_ADOPTION','INSTITUTIONAL_INTEREST','RECORD_HIGH','POSITIVE_MOMENTUM'],direction:0.9,
      summary:'Coverage linked the record to expanding DeFi use and increasing institutional interest in cryptocurrencies.',quality:'PRIMARY_MEDIA_SYNDICATED'
    }),
    source({
      id:'SRC-REUTERS-ETH-2021-11-08-MOMENTUM',assets:['ETH'],caseIds:['ETH-2021-2022-TOP-MARKDOWN'],publishedAt:'2021-11-08T02:45:00Z',publisher:'Reuters',transport:'Investing/Reuters syndication',
      title:'Crypto rally lifts ether to new record, bitcoin to near 3-week high',url:'https://www.investing.com/news/currency-news/crypto-rally-lifts-ether-to-new-record-bitcoin-to-near-3week-high-2670980',
      frames:['POSITIVE_MOMENTUM','INSTITUTIONAL_ACCEPTANCE','INFLATION_HEDGE','FAVOURABLE_NEWS'],direction:0.85,
      summary:'Coverage described record ether prices amid momentum, flows, favourable news, inflation fears and broader institutional acceptance of crypto.',quality:'PRIMARY_MEDIA_SYNDICATED'
    }),
    source({
      id:'SRC-REUTERS-ETH-2021-11-09-ATH',assets:['ETH'],caseIds:['ETH-2021-2022-TOP-MARKDOWN'],publishedAt:'2021-11-09T15:51:00Z',publisher:'Reuters',transport:'Investing/Reuters syndication',
      title:'Bitcoin, ether hit all-time highs as momentum accelerates',url:'https://uk.investing.com/news/economy/fast-money-drives-bitcoin-ether-to-new-record-highs-2506449',
      frames:['RECORD_HIGH','CRYPTO_ADOPTION','INFLATION_CONCERN','MOMENTUM_AND_FLOWS'],direction:0.9,
      summary:'Coverage framed ether and bitcoin records around adoption enthusiasm, inflation concerns, momentum and flows into the asset class.',quality:'PRIMARY_MEDIA_SYNDICATED'
    })
  ]);

  const ms=value=>new Date(value).getTime();
  const round=(n,d=3)=>Number(Number(n).toFixed(d));

  function inWindow(item,window){
    const t=ms(item.publishedAt),from=ms(`${window.from}T00:00:00Z`),to=ms(`${window.to}T23:59:59Z`);
    return t>=from&&t<=to;
  }

  function appliesToCase(item,caseSchema){
    const assets=item.assets||[];const caseIds=item.caseIds||[];
    const assetOk=!assets.length||assets.includes(caseSchema.asset);
    const caseOk=!caseIds.length||caseIds.includes(caseSchema.id);
    return assetOk&&caseOk;
  }

  function sourcesForCase(caseSchema,sources=SOURCES){return sources.filter(item=>appliesToCase(item,caseSchema))}

  function aggregate(items){
    const frameCounts={};
    items.forEach(item=>item.frames.forEach(frame=>frameCounts[frame]=(frameCounts[frame]||0)+1));
    const direction=items.length?round(items.reduce((sum,x)=>sum+x.direction,0)/items.length):null;
    const dominantFrames=Object.entries(frameCounts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([frame,count])=>({frame,count}));
    return {count:items.length,direction,dominantFrames,sourceIds:items.map(x=>x.id)};
  }

  function analyzeCase(caseSchema,sources=SOURCES){
    if(!caseSchema?.id||!caseSchema?.asset) throw new Error('Meaning-world analysis requires a case schema with id and asset.');
    const scoped=sourcesForCase(caseSchema,sources);
    const firstItems=scoped.filter(x=>inWindow(x,caseSchema.checkpointWindows.firstTop));
    const reactionItems=scoped.filter(x=>inWindow(x,caseSchema.checkpointWindows.automaticReaction));
    const supportItems=scoped.filter(x=>inWindow(x,caseSchema.checkpointWindows.supportReference));
    const secondItems=scoped.filter(x=>inWindow(x,caseSchema.checkpointWindows.secondTop));
    return {
      type:'MEANING_WORLD_CONTEXT',caseId:caseSchema.id,asset:caseSchema.asset,
      firstTop:aggregate(firstItems),automaticReaction:aggregate(reactionItems),supportReference:aggregate(supportItems),secondTop:aggregate(secondItems),
      sources:structuredClone(scoped),
      comparison:{directionDelta:firstItems.length&&secondItems.length?round(aggregate(secondItems).direction-aggregate(firstItems).direction):null},
      sourceScope:{asset:caseSchema.asset,caseId:caseSchema.id,totalScopedSources:scoped.length},
      evidenceStatus:'SOURCE_CLAIM',
      note:'Frame direction is an explicit coding aid for comparing narratives, not a truth score and not a price prediction. Sources are asset/case scoped and cannot leak across assets.'
    };
  }

  function toProvenance(item){return {sourceId:item.id,sourceType:'TIMESTAMPED_MEDIA_SOURCE',quality:item.quality,publisher:item.publisher,publishedAt:item.publishedAt,url:item.url,title:item.title,assets:structuredClone(item.assets||[]),caseIds:structuredClone(item.caseIds||[])}}

  return {SOURCES,inWindow,appliesToCase,sourcesForCase,aggregate,analyzeCase,toProvenance};
})();
