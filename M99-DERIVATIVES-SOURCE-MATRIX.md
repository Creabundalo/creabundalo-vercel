# M99 — Derivatives Source Matrix v0.1

| Domain | Source | Authority | Coverage/use | State |
|---|---|---|---|---|
| U.S. listed options | Cboe exchange/reference/historical data | PRIMARY_VENUE | series, volume, quote/trade history, IV/Greeks/OI products | SOURCE_PATH |
| Options OI clearing basis | OCC-derived OI surfaced in venue products | PRIMARY_CLEARING/DERIVED | prior-night OI convention | SOURCE_PATH |
| Futures/options on futures | CME Group | PRIMARY_VENUE | volume/OI reports, settlements, product specs; detailed history via data products | SOURCE_PATH |
| Futures positioning | CFTC COT / TFF / disaggregated | PRIMARY_REGULATOR | weekly participant positioning | READY |
| Crypto perps/funding | Binance Vision / venue archives | PRIMARY_VENUE | historical funding/positioning | IMPLEMENTED |
| Crypto options | Deribit | PRIMARY_VENUE | options/futures/perps API | READY / historical depth to validate |
| Volatility futures/options | Cboe/CFE | PRIMARY_VENUE | VIX-family volume/OI/history | SOURCE_PATH |

## Known access constraints
- Cboe historical option quote/trade datasets include rich fields such as IV/Greeks/OI, but long-history products are commercial/licensed.
- CME free volume/OI reports are useful, while detailed historical contract data may require DataMine/other licensed access.
- Derived dealer-gamma estimates are not primary facts and require methodology/version.

## B002 handoff
BTC June/July 2019 predates Binance Futures. CME Bitcoin futures launched in 2017, so B004 owns the older-derivatives path needed for that case.
