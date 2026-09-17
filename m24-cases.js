globalThis.M24Cases = (() => {
  const cases = Object.freeze({
    'BTC-2021-2022-TOP-MARKDOWN': Object.freeze({
      id:'BTC-2021-2022-TOP-MARKDOWN',
      asset:'BTC',
      analysis:'TOP_MARKDOWN',
      resolutionIndependent:true,
      window:{from:'2021-01-01',to:'2022-06-30'},
      checkpointWindows:{
        firstTop:{from:'2021-04-01',to:'2021-05-09',select:'MAX_HIGH'},
        automaticReaction:{from:'2021-05-10',to:'2021-07-25',select:'MIN_LOW'},
        supportReference:{from:'2021-09-01',to:'2021-09-30',select:'MIN_LOW'},
        secondTop:{from:'2021-10-01',to:'2021-11-30',select:'MAX_HIGH'},
        markdownOutcome:{from:'2021-12-01',to:'2022-06-30',select:'MIN_LOW'}
      },
      rules:{
        supportBreak:'FIRST_CLOSE_BELOW_SUPPORT_LOW_AFTER_SECOND_TOP',
        momentum:'WILDER_RSI_14',
        participation:'COMPARE_VOLUME_AT_RESOLVED_TOP_BARS'
      },
      note:'Checkpoint windows identify market structure semantically; individual source resolutions select their own bars inside the same windows.'
    })
  });

  const clone=value=>structuredClone(value);
  function get(id){return cases[id]?clone(cases[id]):null}
  function list(){return Object.values(cases).map(clone)}

  return {get,list};
})();
