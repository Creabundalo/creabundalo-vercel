# M99-B013 — Source Readiness Matrix v0.1

| Case | Domain | Price/core source | Domain-specific source | Meaning/event source | Readiness | Blocking gap |
|---|---|---|---|---|---|---|
| BTC-2019-TOP-MARKDOWN | Crypto | Coinbase | CFTC TFF / CME BTC | Reuters | SOURCE_COMPLETE | none |
| BTC-2021-2022-TOP-MARKDOWN | Crypto | Coinbase | Binance Vision | Reuters | SOURCE_COMPLETE_REPLAYED | none |
| ETH-2021-2022-TOP-MARKDOWN | Crypto | Coinbase | Binance Vision core | Reuters | SOURCE_COMPLETE_REPLAYED | extended positioning source-limited |
| SOL-2021-2022-TOP-MARKDOWN | Crypto | Coinbase | Binance Vision core | scoped media/protocol | SOURCE_COMPLETE_REPLAYED | extended positioning source-limited |
| NASDAQ-1999-2002 | Equity/index | NASDAQCOM via FRED/Nasdaq | case-specific macro profile; close-only index architecture | Fed/SEC official sources | SOURCE_COMPLETE | none; optional breadth/fundamentals remain extended |
| SPX-2007-2009 | Equity/index | exchange/index/FRED path | credit/funding/volatility | filings/official/media | SOURCE_READY | historical constituent/breadth design |
| EQUITY-MAR2020 | Equity/index | exchange/index | VIX/funding/rates | official/media | SOURCE_READY | consolidated multi-source adapter |
| GME-2021 | Equity | exchange data | FINRA short interest + options | SEC/media | SOURCE_PATH | listed-options historical dataset/access |
| CREDIT-2007-2009 | Bonds/credit | Treasury/FRED | spreads + TRACE/Fed | official/media | SOURCE_READY | case-specific spread set |
| UST-MAR2020 | Bonds/credit | Treasury/FRED | NY Fed funding + CFTC | Fed/NY Fed/media | SOURCE_READY | Treasury liquidity measurement selection |
| UK-GILTS-2022 | Bonds/credit | BoE/UK official path | LDI/collateral/rates sources | BoE/official/media | SOURCE_PATH | UK source adapter |
| OIL-2008 | Commodity | EIA/CME path | EIA physical + CFTC | EIA/OPEC/media | SOURCE_READY | futures/spot benchmark selection |
| OIL-APR2020 | Commodity | CME futures required | EIA storage + CFTC | official/media | SOURCE_PATH | contract-level settlement/curve adapter |
| GOLD-2011 | Commodity | benchmark/futures path | CFTC + real rates/USD | official/media | SOURCE_PATH | benchmark/licence choice |
| CHF-2015-SNB-FLOOR-EXIT | FX | SNB/ECB/BIS path | rates/options | SNB official | SOURCE_READY | bilateral tradable/reference price policy |
| USD-2021-2022 | FX | Fed/BIS/ECB | rates + CFTC | central banks/media | SOURCE_READY | executable FX price adapter |
| US-HOUSING-2003-2009 | Housing | official HPI | mortgage credit/MBS/standards | Fed/official/media | SOURCE_READY | vintage-aware housing adapter |
| NL-HOUSING-1995-2013 | Housing | CBS/Kadaster | DNB/ECB mortgage/credit | official/media | SOURCE_READY | CBS/DNB adapter |
| NL-HOUSING-2015-2023 | Housing | CBS/Kadaster | DNB/ECB rates/credit/supply | official/media | SOURCE_READY | CBS/DNB adapter |
| FUNDING-SEP2019 | Funding | NY Fed | reserves/repo/Treasury | Fed/NY Fed | SOURCE_READY | event-specific threshold logic |
| GLOBAL-MAR2020 | Cross-asset | multiple official/venue paths | funding/vol/credit/commodities | official/media | SOURCE_READY | multi-domain orchestration |

## Readiness rule
- `SOURCE_COMPLETE`: real-source evidence gate passed.
- `SOURCE_COMPLETE_REPLAYED`: source complete and directional historical replay exists.
- `SOURCE_READY`: required source families are identified and publicly/officially obtainable; adapter/case implementation remains.
- `SOURCE_PATH`: a credible source path exists but access/licensing or adapter design remains material.

## First non-crypto implementation choice
**NASDAQ-1999-2002** is selected as B013-T04 because:
- it is structurally different from crypto;
- it tests long lifecycle/bubble-state logic;
- price/index history and macro/rate context have official/primary paths;
- it forces M99 to add fundamentals and index/breadth semantics rather than reuse crypto sensors.
