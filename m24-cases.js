globalThis.M24Cases = (() => {
  const sharedRules=Object.freeze({
    supportBreak:'FIRST_CLOSE_BELOW_SUPPORT_LOW_AFTER_SECOND_TOP',
    momentum:'WILDER_RSI_14',
    participation:'COMPARE_VOLUME_AT_RESOLVED_TOP_BARS'
  });

  const topMarkdown=(spec)=>Object.freeze({
    analysis:'TOP_MARKDOWN',
    resolutionIndependent:true,
    providerFamily:'COINBASE_EXCHANGE',
    status:'EXECUTABLE_PRIMARY',
    calibrationEligible:false,
    requiredLayers:['PRICE','MEANING_WORLD','DERIVATIVES','MACRO','DECISION_SNAPSHOT','BACKTEST_OUTCOME'],
    rules:sharedRules,
    ...spec,
    note:`${spec.note||''} Checkpoint windows are search spaces; source data resolves the actual bars. Calibration eligibility remains false until required evidence layers are source-complete.`.trim()
  });


  const indexCloseMarkdown=(spec)=>Object.freeze({
    analysis:'TOP_MARKDOWN_CLOSE_ONLY',
    resolutionIndependent:true,
    providerFamily:'FRED_MARKET_SERIES',
    status:'EXECUTABLE_PRIMARY',
    calibrationEligible:false,
    requiredLayers:['PRICE','MEANING_WORLD','MACRO','DECISION_SNAPSHOT','BACKTEST_OUTCOME'],
    coverageProfile:'INDEX_CLOSE_MACRO_MEANING',
    rules:Object.freeze({
      supportBreak:'FIRST_CLOSE_BELOW_SUPPORT_CLOSE_AFTER_SECOND_TOP',
      momentum:'WILDER_RSI_14',
      participation:'NOT_AVAILABLE_CLOSE_ONLY'
    }),
    ...spec,
    note:(spec.note||'')+' Close-only index source is kept honest: no OHLC or volume is synthesized. Required evidence is case-specific rather than crypto-shaped.'
  });

  const housingCycle=(spec)=>Object.freeze({
    analysis:'HOUSING_CYCLE',
    resolutionIndependent:false,
    providerFamily:'CBS_KADASTER_HOUSING',
    status:'EXECUTABLE_PRIMARY',
    calibrationEligible:false,
    requiredLayers:['PRICE','MEANING_WORLD','MACRO','DECISION_SNAPSHOT','BACKTEST_OUTCOME'],
    coverageProfile:'HOUSING_PRICE_RATE_MEANING',
    scoreProfile:'HOUSING_SLOW_MARKET',
    ...spec,
    note:(spec.note||'')+' Housing is modeled as a slow market with publication lag; no daily-market or derivatives assumptions are forced.'
  });

  const crossAssetShock=(spec)=>Object.freeze({
    analysis:'CROSS_ASSET_SHOCK',
    resolutionIndependent:true,
    providerFamily:'FRED_MARKET_SERIES',
    status:'EXECUTABLE_PRIMARY',
    calibrationEligible:false,
    requiredLayers:['PRICE','MEANING_WORLD','MACRO','DECISION_SNAPSHOT','BACKTEST_OUTCOME'],
    coverageProfile:'CROSS_ASSET_LIQUIDITY',
    scoreProfile:'CROSS_ASSET_LIQUIDITY',
    ...spec,
    note:(spec.note||'')+' Cross-asset shock cases use a pre-shock baseline and system-stress checkpoint; no double-top semantics are implied.'
  });

  const cases = Object.freeze({
    'BTC-2019-TOP-MARKDOWN': topMarkdown({
      id:'BTC-2019-TOP-MARKDOWN',asset:'BTC',
      window:{from:'2019-05-01',to:'2019-12-31'},
      checkpointWindows:{
        firstTop:{from:'2019-06-20',to:'2019-06-30',select:'MAX_HIGH'},
        automaticReaction:{from:'2019-07-01',to:'2019-07-05',select:'MIN_LOW'},
        supportReference:{from:'2019-07-01',to:'2019-07-05',select:'MIN_LOW'},
        secondTop:{from:'2019-07-06',to:'2019-07-15',select:'MAX_HIGH'},
        markdownOutcome:{from:'2019-07-16',to:'2019-12-31',select:'MIN_LOW'}
      },
      note:'2019 BTC local-top / lower-high markdown candidate.'
    }),
    'BTC-2021-2022-TOP-MARKDOWN': topMarkdown({
      id:'BTC-2021-2022-TOP-MARKDOWN',asset:'BTC',
      window:{from:'2021-01-01',to:'2022-06-30'},
      checkpointWindows:{
        firstTop:{from:'2021-04-01',to:'2021-05-09',select:'MAX_HIGH'},
        automaticReaction:{from:'2021-05-10',to:'2021-07-25',select:'MIN_LOW'},
        supportReference:{from:'2021-09-01',to:'2021-09-30',select:'MIN_LOW'},
        secondTop:{from:'2021-10-01',to:'2021-11-30',select:'MAX_HIGH'},
        markdownOutcome:{from:'2021-12-01',to:'2022-06-30',select:'MIN_LOW'}
      },
      note:'Existing BTC double-top / distribution regression case.'
    }),
    'ETH-2021-2022-TOP-MARKDOWN': topMarkdown({
      id:'ETH-2021-2022-TOP-MARKDOWN',asset:'ETH',
      window:{from:'2021-03-01',to:'2022-06-30'},
      checkpointWindows:{
        firstTop:{from:'2021-04-15',to:'2021-05-31',select:'MAX_HIGH'},
        automaticReaction:{from:'2021-05-13',to:'2021-07-25',select:'MIN_LOW'},
        supportReference:{from:'2021-09-01',to:'2021-09-30',select:'MIN_LOW'},
        secondTop:{from:'2021-10-01',to:'2021-11-30',select:'MAX_HIGH'},
        markdownOutcome:{from:'2021-12-01',to:'2022-06-30',select:'MIN_LOW'}
      },
      note:'ETH 2021 first-peak / second-peak / 2022 markdown candidate.'
    }),
    'NASDAQ-1999-2002': indexCloseMarkdown({
      id:'NASDAQ-1999-2002',asset:'NASDAQ',
      window:{from:'1999-01-01',to:'2002-12-31'},
      macroKeys:['FED_FUNDS_LEGACY','TEN_YEAR','WTI'],
      checkpointWindows:{
        firstTop:{from:'2000-03-06',to:'2000-03-13',select:'MAX_CLOSE'},
        automaticReaction:{from:'2000-03-14',to:'2000-03-20',select:'MIN_CLOSE'},
        supportReference:{from:'2000-03-14',to:'2000-03-20',select:'MIN_CLOSE'},
        secondTop:{from:'2000-03-21',to:'2000-03-28',select:'MAX_CLOSE'},
        markdownOutcome:{from:'2000-03-29',to:'2002-12-31',select:'MIN_CLOSE'}
      },
      note:'NASDAQ dot-com peak / lower-second-peak / long markdown case using daily composite closes.'
    }),
    'NL-HOUSING-2015-2023': housingCycle({
      id:'NL-HOUSING-2015-2023',asset:'NL_HOUSING',
      window:{from:'2020-01-01',to:'2023-12-31'},
      macroKeys:['ECB_DEPOSIT_RATE'],
      checkpointWindows:{
        firstTop:{from:'2021-11-01',to:'2022-02-28',select:'MAX_YOY'},
        automaticReaction:{from:'2022-02-01',to:'2022-05-31',select:'MAX_INDEX'},
        supportReference:{from:'2021-12-01',to:'2022-01-31',select:'MAX_INDEX'},
        secondTop:{from:'2022-06-01',to:'2022-08-31',select:'MAX_INDEX'},
        markdownOutcome:{from:'2022-09-01',to:'2023-12-31',select:'MIN_INDEX'}
      },
      note:'NL existing-home cycle: peak YoY growth → peak price level → 2022/23 correction.'
    }),
    'GLOBAL-MAR2020': crossAssetShock({
      id:'GLOBAL-MAR2020',asset:'SPX',
      window:{from:'2019-12-01',to:'2020-06-30'},
      macroKeys:['VIX','DOLLAR','TEN_YEAR','FIN_CONDITIONS','FED_ASSETS','WTI','FED_FUNDS_LEGACY'],
      checkpointWindows:{
        firstTop:{from:'2020-02-17',to:'2020-02-21',select:'MAX_CLOSE'},
        automaticReaction:{from:'2020-03-09',to:'2020-03-12',select:'MIN_CLOSE'},
        supportReference:{from:'2020-03-12',to:'2020-03-16',select:'MIN_CLOSE'},
        secondTop:{from:'2020-03-12',to:'2020-03-16',select:'MIN_CLOSE'},
        markdownOutcome:{from:'2020-03-17',to:'2020-03-31',select:'MIN_CLOSE'}
      },
      note:'March 2020 global liquidity/volatility shock using SPX as primary market state and official cross-asset stress sensors.'
    }),
    'SOL-2021-2022-TOP-MARKDOWN': topMarkdown({
      id:'SOL-2021-2022-TOP-MARKDOWN',asset:'SOL',
      window:{from:'2021-07-01',to:'2022-06-30'},
      checkpointWindows:{
        firstTop:{from:'2021-08-15',to:'2021-09-20',select:'MAX_HIGH'},
        automaticReaction:{from:'2021-09-10',to:'2021-10-05',select:'MIN_LOW'},
        supportReference:{from:'2021-09-20',to:'2021-10-20',select:'MIN_LOW'},
        secondTop:{from:'2021-10-20',to:'2021-11-20',select:'MAX_HIGH'},
        markdownOutcome:{from:'2021-12-01',to:'2022-06-30',select:'MIN_LOW'}
      },
      note:'SOL 2021 multi-peak / 2022 markdown candidate.'
    })
  });

  const clone=value=>structuredClone(value);
  function get(id){return cases[id]?clone(cases[id]):null}
  function list({asset=null,status=null}={}){
    return Object.values(cases).filter(x=>(!asset||x.asset===asset)&&(!status||x.status===status)).map(clone);
  }
  function calibrationCandidates(){return list().filter(x=>x.calibrationEligible===true)}

  return {get,list,calibrationCandidates};
})();
