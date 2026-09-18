# M99 — Commodity Source Matrix v0.1

| Layer | Source | Authority | State | Use |
|---|---|---|---|---|
| Energy physical balance | U.S. EIA Open Data API | PRIMARY_OFFICIAL | READY | prices, stocks, production, consumption, imports/exports |
| Futures/options | CME/NYMEX/COMEX | PRIMARY_VENUE | SOURCE_PATH | settlements, contracts, volume/OI |
| Positioning | CFTC COT | PRIMARY_REGULATOR | READY | producer, swap dealer, managed money, etc. |
| Gold/silver benchmark | LBMA / IBA | PRIMARY_BENCHMARK | LICENSE_CONSTRAINT | benchmark prices; historical table access/licence restrictions |
| London physical/OTC context | LBMA clearing/vault/trade data | PRIMARY_INDUSTRY | READY/PARTIAL | vault holdings, clearing, OTC turnover |
| Macro/cross-asset | Fed/FRED/EIA | PRIMARY_OFFICIAL | READY | USD, rates, liquidity, energy |

## Integrity rules
- Futures price, spot benchmark and physical inventory are separate evidence.
- A single contract's negative/positive price cannot be generalized to all physical oil.
- COT report date and publication date are separate timestamps.
- Benchmark licence/access restrictions are stored in SOURCE metadata.
- Physical balance data may be weekly/monthly; lower frequency is not interpolated as observed fact.
