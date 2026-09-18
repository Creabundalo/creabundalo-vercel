const M24Data = (() => {
  class MarketDataProvider {
    async getMarketState(){ throw new Error('Not implemented'); }
    async getMeaningState(){ throw new Error('Not implemented'); }
    async getCrossAssetState(){ throw new Error('Not implemented'); }
    async getHistoricalCase(){ throw new Error('Not implemented'); }
  }

  const assets = {
    BTC:{name:'Bitcoin',price:'76.2k',trend:'↘ zwak',window:['2019','2021–2022 episode','2026'],values:[18,22,30,45,68,84,58,72,91,78,60,46,51,38,44,34,42,39],mechanismScore:-.42,narrativeScore:.55,narrative:'“Dip kopen; macrotrend blijft omhoog.”',mechanism:'Tweede top kwetsbaar; momentum en bevestiging lopen terug.',mechanisms:['LOWER_MOMENTUM','SECOND_PEAK','CROSS_ASSET_WEAKENING'],flags:[
      {i:5,label:'1e top',title:'Eerste top',evidence:'MECHANISM_VISIBLE',action:'WAIT',what:'Sterke stijging eindigt in een eerste scherpe reactie.',why:'Momentum en deelname zijn hoog; eerste winstneming en liquidaties verschijnen.',meaning:'Het dominante verhaal blijft bullish.',reading:'Nog geen trendbreuk. Dit wordt een referentiepunt voor de volgende top.'},
      {i:8,label:'2e top',title:'Tweede piek / divergentie',evidence:'PLAUSIBLE_INTERPRETATION',action:'DOWNSIDE WATCH',what:'Prijs bereikt opnieuw een hoge zone.',why:'De momentumlaag is zwakker dan bij de eerste piek en cross-asset bevestiging neemt af.',meaning:'Het verhaal zegt voortzetting; de onderliggende kracht bevestigt minder.',reading:'Trickster-vraag: echte breakout of lokbeweging? Wacht op steunbreuk.'},
      {i:11,label:'break',title:'Steunbreuk',evidence:'MECHANISM_VISIBLE',action:'SHORT CANDIDATE',what:'De geselecteerde steunzone breekt.',why:'Verkoopdruk en gedwongen afbouw kunnen elkaar versterken.',meaning:'Het bullish verhaal verliest geloofwaardigheid.',reading:'Pas hier ontstaat structurele downside-bevestiging; uitvoering blijft PAPER.'}
    ]},
    TSLA:{name:'Tesla',price:'421',trend:'→ gemengd',window:['2018','selected cycle','2026'],values:[22,31,26,43,55,48,69,81,74,89,82,70,65,72,61,67,58,63],mechanismScore:-.08,narrativeScore:.48,narrative:'“AI/robotica rechtvaardigt langdurige groei.”',mechanism:'Hoge verwachting kan samengaan met gevoelige waardering en flow.',mechanisms:['VALUATION_SENSITIVITY'],flags:[]},
    OIL:{name:'WTI Oil',price:'101',trend:'↘ afkoelend',window:['2006','2008 peak analogue','2026'],values:[30,37,48,67,86,95,73,52,34,42,58,62,55,71,82,75,69,73],mechanismScore:.12,narrativeScore:.45,narrative:'“Aanbodstress houdt olie structureel hoog.”',mechanism:'Aanbod, vraag, geopolitiek en liquiditeit kunnen tegelijk draaien.',mechanisms:['SUPPLY_STRESS','POSITIONING'],flags:[]},
    SOL:{name:'Solana',price:'184',trend:'↑ volatiel',window:['2020','current lifecycle','2026'],values:[12,20,36,68,86,54,33,46,64,79,62,71,88,76,84,69,77,73],mechanismScore:.15,narrativeScore:.52,narrative:'“Netwerkgebruik en crypto-beta blijven groeien.”',mechanism:'Hoge beta maakt leverage/liquidaties extra belangrijk.',mechanisms:['HIGH_BETA','LIQUIDATION_RISK'],flags:[]}
  };

  const crossAsset = [
    {name:'Goud',direction:'↑',state:'sterk',className:'up'},
    {name:'WTI olie',direction:'↘',state:'afkoelend',className:'down'},
    {name:'Nasdaq',direction:'→',state:'gemengd',className:'flat'},
    {name:'Credit',direction:'↗',state:'krapper',className:'down'},
    {name:'Dollar',direction:'→',state:'neutraal',className:'flat'}
  ];

  const historicalCases = [
    {id:'BTC-2021-2022-TOP-MARKDOWN',asset:'BTC',label:'BTC 2021 → 2022',pattern:'Tweede top + distributie',status:'SEED_NEEDS_AUTHORITATIVE_BARS',checkpoints:['FIRST_TOP','AUTOMATIC_REACTION','SECOND_TOP','MOMENTUM_COMPARE','SUPPORT_BREAK','MARKDOWN'],note:'Eerste labcase voor gecombineerde M24-toestand.'},
    {id:'NASDAQ-2000-PEAK',asset:'NASDAQ',label:'Nasdaq 2000',pattern:'Lifecycle saturation',status:'SEED',checkpoints:['EUPHORIA','INTERNAL_WEAKNESS','BREAK'],note:'Narratief versus internals.'},
    {id:'OIL-2008-PEAK',asset:'OIL',label:'Oil 2008',pattern:'Blow-off / reversal',status:'SEED',checkpoints:['SUPPLY_NARRATIVE','PRICE_ACCELERATION','REVERSAL'],note:'Fysieke markt versus positionering/liquiditeit.'}
  ];

  const paperTransactions = [
    {id:'T-001',asset:'BTC',direction:'SHORT',strategy:'Put spread',entry:'76.4k',size:'0.5R',userStatus:'KANDIDAAT',auditStatus:'PREVIEW',pnl:'—',why:'Tweede top + afnemend momentum; wacht nog op bevestigde steunbreuk.',risk:'Max 0.5R',target:'Fib/structure zone',forecast:'F-0002',trickster:'Discrepantie; intentie onbekend'},
    {id:'T-002',asset:'TSLA',direction:'HEDGE',strategy:'Protective put',entry:'418',size:'0.3R',userStatus:'OPEN',auditStatus:'VERIFY',pnl:'+0.12R',why:'Bescherming rond hoge volatiliteit; geen directionele short-call.',risk:'Premie begrensd',target:'Protectie tijdens event',forecast:'F-0011',trickster:'Geen hard trickster-signaal'},
    {id:'T-003',asset:'OIL',direction:'LONG',strategy:'Call spread',entry:'94.2',size:'0.4R',userStatus:'GESLOTEN',auditStatus:'VERIFY',pnl:'+0.61R',why:'Momentum + aanbodstress + cross-asset bevestiging in mockcase.',risk:'0.4R',target:'1.272 extension',forecast:'F-0007',trickster:'Narratief/mechanisme bevestigden elkaar'}
  ];

  class MockProvider extends MarketDataProvider {
    async getMarketState(asset, context={}) {
      const a=assets[asset] || assets.BTC;
      return {asset,name:a.name,price:a.price,trend:a.trend,window:a.window,values:a.values,flags:a.flags,mechanism:a.mechanism,mechanismScore:a.mechanismScore,mechanisms:a.mechanisms,context,provenance:[{sourceId:'M24-MOCK',observedAt:new Date().toISOString(),note:'Deterministic v0.1 mock data'}]};
    }
    async getMeaningState(asset) {
      const a=assets[asset] || assets.BTC;
      return {narrative:a.narrative,score:a.narrativeScore,confidence:.55,provenance:[{sourceId:'M24-MOCK-NARRATIVE',observedAt:new Date().toISOString()}]};
    }
    async getCrossAssetState(){ return structuredClone(crossAsset); }
    async getHistoricalCase(id){ return structuredClone(historicalCases.find(x=>x.id===id) || null); }
  }

  return {MarketDataProvider,MockProvider,assets,crossAsset,historicalCases,paperTransactions};
})();
