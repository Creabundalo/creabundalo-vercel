# M99 — Positioning / Flow Source Matrix v0.1

| Layer | Source | Authority | State | Use |
|---|---|---|---|---|
| Futures/options participant positioning | CFTC COT / TFF / Disaggregated | PRIMARY_REGULATOR | READY | dealer, asset manager, leveraged money, producer, managed money |
| Institutional equity holdings | SEC Form 13F datasets | PRIMARY_OFFICIAL_FILINGS | READY | quarterly holdings snapshots |
| Equity short interest | FINRA equity short interest | PRIMARY_REGULATORY | READY | twice-monthly short positions; publication lag explicit |
| Insider transactions | SEC structured insider datasets | PRIMARY_OFFICIAL_FILINGS | READY | filed insider transactions |
| Exchange market share/volume | Nasdaq/NYSE/Cboe venue statistics | PRIMARY_VENUE | READY/PARTIAL | venue and consolidated activity |
| ETF/fund flows | issuer/fund filings/primary data where available | PRIMARY/DERIVED | SOURCE_PATH | do not default to vendor estimates |
| Securities lending/borrow | licensed/vendor/market source | DERIVED/COMMERCIAL | SOURCE_GAP | later optional enrichment |

## Timing rule
Every positioning source stores both position/report date and publication/availability date.
