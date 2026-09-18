const M24Historical = (() => {
  const raw = [["2021-01-04",32810.95,41946.74,28722.76,38356.44,538834804975],["2021-01-11",38346.53,39966.41,30549.6,35791.28,508900951412],["2021-01-18",35792.24,37755.89,28953.37,32289.38,423439379849],["2021-01-25",32285.8,38406.26,29367.14,33114.36,495037340009],["2021-02-01",33114.58,40846.55,32384.23,38903.44,449918619842],["2021-02-08",38886.83,49487.64,38076.32,48717.29,580021243858],["2021-02-15",48696.54,58330.57,46347.48,57539.95,470533297170],["2021-02-22",57532.74,57533.39,43241.62,45137.77,766679775805],["2021-03-01",45159.5,52535.14,45115.09,51206.69,333113779409],["2021-03-08",51174.12,61683.86,49506.05,59302.32,373838576722],["2021-03-15",59267.43,60540.99,53555.03,57523.42,393542542227],["2021-03-22",57517.89,58471.48,50856.57,55950.75,403128836645],["2021-03-29",55947.9,60267.19,55139.34,58758.55,408348561550],["2021-04-05",58760.88,61276.66,55604.02,60204.96,406637390979],["2021-04-12",60175.95,64863.1,52829.54,56216.18,508118943571],["2021-04-19",56191.59,57520.05,47159.48,49004.25,444719708699],["2021-04-26",49077.79,58448.34,48852.8,56631.08,335231529997],["2021-05-03",56620.27,59464.61,52969.05,58232.32,458766142208],["2021-05-10",58250.87,59519.36,43963.35,46456.06,483967915938],["2021-05-17",46415.9,46623.56,30681.5,34770.58,563629210102],["2021-05-24",34700.36,40782.08,33520.74,35678.13,350206489990],["2021-05-31",35658.59,39478.95,34241.95,35862.38,248884892724],["2021-06-07",35835.27,39322.78,31114.44,39097.86,298428017340],["2021-06-14",39016.97,41295.27,33432.07,35698.3,269949570053],["2021-06-21",35641.14,35721.64,28893.62,34649.64,305541799334],["2021-06-28",34679.12,36542.11,32770.68,35287.78,231729218470],["2021-07-05",35284.34,35284.34,32133.18,34240.19,178445862441],["2021-07-12",34254.02,34592.16,31100.67,31796.81,147501894180],["2021-07-19",31800.01,35364.93,29360.96,35350.19,156414750211],["2021-07-26",35384.03,42541.68,35287.31,39974.89,237553113912],["2021-08-02",39907.26,45282.35,37458.0,43798.12,226902699564],["2021-08-09",43791.93,48098.68,42848.69,47047.0,234268000892],["2021-08-16",47019.96,49717.02,43998.32,49321.65,236289722726],["2021-08-23",49291.68,50482.08,46394.28,48829.83,223947952688],["2021-08-30",48834.85,51868.68,46562.44,51753.41,256225023619],["2021-09-06",51769.0,52853.77,43285.21,46063.27,293311066613],["2021-09-13",46057.21,48791.78,43591.32,47260.22,226141953163],["2021-09-20",47261.41,47328.2,39787.61,43208.54,270099994433],["2021-09-27",43234.18,49130.69,40829.67,48199.95,223042115392],["2021-10-04",48208.91,56401.3,47045.0,54771.58,261919545521],["2021-10-11",54734.12,62757.13,54370.97,61553.62,277084548345],["2021-10-18",61548.8,66930.39,59643.34,60930.84,257856648064],["2021-10-25",60893.93,63729.32,58206.92,61318.96,256114057651],["2021-11-01",61320.45,64242.79,59695.18,63326.99,227064607869],["2021-11-08",63344.07,68789.62,62333.91,65466.84,259776276520],["2021-11-15",65521.29,66281.57,55705.18,58730.48,253419951009],["2021-11-22",58706.85,59367.97,53569.77,57248.46,243930001011],["2021-11-29",57291.91,59113.4,42874.62,49368.85,276690611812],["2021-12-06",49413.48,51934.78,46942.35,50098.34,208148497532],["2021-12-13",50114.74,50205.0,45598.44,46707.02,214770398202],["2021-12-20",46707.06,51814.03,45579.81,50809.52,175052499792],["2021-12-27",50802.61,51956.33,45819.95,47345.22,203998848909],["2022-01-03",47343.54,47510.73,40672.28,41911.6,276182787152],["2022-01-10",41910.23,44278.42,39796.57,43113.88,199473804544],["2022-01-17",43118.12,43413.02,34349.25,36276.8,196326044073],["2022-01-24",36275.73,38825.41,33184.06,37917.6,178727434896],["2022-01-31",37920.28,42500.79,36375.54,42412.43,143977109319],["2022-02-07",42406.78,45661.17,41748.16,42197.52,176958095731],["2022-02-14",42157.4,44667.22,38112.81,38431.38,144975794552],["2022-02-21",38423.21,40005.35,34459.22,37709.79,190469710084],["2022-02-28",37706.0,45077.58,37518.21,38419.98,187557375751],["2022-03-07",38429.3,42465.67,37260.2,37849.66,175966999156],["2022-03-14",37846.32,42316.55,37680.73,41247.82,184097042034],["2022-03-21",41246.13,46827.55,40668.04,46820.49,188591889758],["2022-03-28",46821.85,48086.84,44403.14,46453.57,223334181931],["2022-04-04",46445.27,47106.14,42021.21,42207.67,188557001876],["2022-04-11",42201.04,42424.59,39373.06,39716.95,174652159709],["2022-04-18",39721.2,42893.58,38696.19,39469.29,184314843516],["2022-04-25",39472.61,40713.89,37585.79,38469.09,216681007567],["2022-05-02",38472.19,39902.95,33878.96,34059.27,239044762282],["2022-05-09",34060.02,34222.07,26350.49,31305.11,357800928090],["2022-05-16",31304.38,31305.34,28708.96,30323.72,196429842104],["2022-05-23",30309.4,30590.59,28261.91,29445.96,212594819496],["2022-05-30",29443.37,32249.86,29303.57,29906.66,203063587161],["2022-06-06",29910.28,31693.29,26762.65,26762.65,215929645934],["2022-06-13",26737.58,26795.59,17708.62,20553.27,309685915250],["2022-06-20",20553.37,21783.72,19689.17,21027.29,175909056122],["2022-06-27",21028.24,21478.09,20228.81,20280.63,42347230868]];
  const btcWeeklyBars = raw.map(([date,open,high,low,close,volume])=>({date,open,high,low,close,volume}));

  const btc2021Case = {
    id:'BTC-2021-2022-TOP-MARKDOWN',
    asset:'BTC',
    resolution:'W',
    firstTopDate:'2021-04-12',
    secondTopDate:'2021-11-08',
    supportDate:'2021-09-20',
    source:{
      sourceId:'ALPHARITHMS-BTC-USD-WEEKLY-2017-2022',
      sourceType:'PUBLIC_REPRODUCIBLE_FIXTURE',
      quality:'SECONDARY',
      repository:'alpharithms/data',
      path:'BTC-USD.06282017-06282022.csv',
      note:'Weekly OHLCV fixture copied into M24 for deterministic historical testing. Replace with an authoritative market-data adapter before calibration decisions.'
    }
  };

  const clone = value => structuredClone(value);

  class HistoricalProvider {
    constructor({fallback}={}) {
      if (!fallback) throw new Error('HistoricalProvider requires a fallback provider.');
      this.fallback=fallback;
    }
    useFixture(asset, context={}) {
      return asset==='BTC' && context.mode==='lab';
    }
    async getMarketState(asset, context={}) {
      if (!this.useFixture(asset, context)) return this.fallback.getMarketState(asset, context);
      const bars=clone(btcWeeklyBars);
      const last=bars.at(-1);
      const firstTopIndex=bars.findIndex(x=>x.date===btc2021Case.firstTopDate);
      const secondTopIndex=bars.findIndex(x=>x.date===btc2021Case.secondTopDate);
      const supportIndex=bars.findIndex(x=>x.date===btc2021Case.supportDate);
      const breakIndex=bars.findIndex((x,i)=>i>secondTopIndex && x.close<bars[supportIndex].low);
      return {
        asset:'BTC',
        name:'Bitcoin',
        price:`${(last.close/1000).toFixed(1)}k`,
        trend:'↘ historical markdown',
        window:['2021-01','BTC 2021 → 2022 lab fixture','2022-06'],
        values:bars.map(x=>x.close),
        bars,
        flags:[
          {i:firstTopIndex,label:'1e top',title:'Eerste top (week)',evidence:'MECHANISM_VISIBLE',action:'WAIT',what:`Week-high $${bars[firstTopIndex].high.toLocaleString('en-US',{maximumFractionDigits:0})}.`,why:'Dit is het eerste referentiepunt van de testcase.',meaning:'Bullish marktverhaal blijft dominant.',reading:'Referentiepunt; nog geen downside-conclusie.'},
          {i:secondTopIndex,label:'2e top',title:'Tweede top (week)',evidence:'MECHANISM_VISIBLE',action:'TEST',what:`Week-high $${bars[secondTopIndex].high.toLocaleString('en-US',{maximumFractionDigits:0})}.`,why:'Prijs maakt een hogere top; Lab vergelijkt momentum en volume zonder vooraf een divergentie aan te nemen.',meaning:'Voortzettingsverhaal versus meetbare bevestiging.',reading:'Hypothese testen; niet invullen.'},
          {i:breakIndex,label:'break',title:'Structurele support-break',evidence:'MECHANISM_VISIBLE',action:'DOWNSIDE CANDIDATE',what:`Week-close $${bars[breakIndex].close.toLocaleString('en-US',{maximumFractionDigits:0})} onder de gekozen september-support.`,why:'Dit is de eerste wekelijkse close onder de vaste supportreferentie na de tweede top.',meaning:'De prijsstructuur verzwakt aantoonbaar.',reading:'Vanaf hier mag downside als bevestigde historische kandidaat worden gescoord.'}
        ],
        mechanism:'Historische weekbars: tweede prijs-top hoger, volume lager; RSI-uitkomst wordt door Lab berekend en niet vooraf aangenomen.',
        mechanismScore:-0.35,
        mechanisms:['SECOND_PRICE_TOP','VOLUME_COMPARE','RSI_TEST','SUPPORT_BREAK_TEST'],
        context,
        provenance:[clone(btc2021Case.source)]
      };
    }
    async getMeaningState(asset, context={}) {
      if (!this.useFixture(asset, context)) return this.fallback.getMeaningState(asset, context);
      return {
        narrative:'Historische hypothese: na de eerste top bleef het bull/continuation-verhaal sterk; M24 toetst of marktmechanismen dat bij de tweede top bevestigden.',
        score:.45,
        confidence:.45,
        provenance:[{sourceId:'M24-HISTORICAL-HYPOTHESIS',note:'Interpretatieve testcase; geen feitelijke actor- of intentieclaim.'}]
      };
    }
    async getCrossAssetState(asset, context={}) {
      return this.fallback.getCrossAssetState(asset, context);
    }
    async getHistoricalCase(id) {
      if (id===btc2021Case.id) return {...clone(btc2021Case),bars:clone(btcWeeklyBars)};
      return this.fallback.getHistoricalCase(id);
    }
  }

  return {btcWeeklyBars,btc2021Case,HistoricalProvider};
})();
