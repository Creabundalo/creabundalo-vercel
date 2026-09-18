# M99 — Macro Source Matrix v0.1

| Family | Source | Authority | State |
|---|---|---|---|
| U.S. labor/inflation | BLS Public Data API | PRIMARY_OFFICIAL | READY |
| U.S. GDP/income/consumption | BEA Data API | PRIMARY_OFFICIAL | READY |
| Fed policy/balance sheet/conditions | Fed/NY Fed/Chicago Fed/FRED | PRIMARY_OFFICIAL | IMPLEMENTED/READY |
| Energy | EIA API | PRIMARY_OFFICIAL | READY |
| Euro area policy/FX/macroeconomy | ECB Data Portal / Eurostat | PRIMARY_OFFICIAL | READY |
| Global credit/liquidity/FX/property | BIS SDMX/Data Portal | PRIMARY_INTERNATIONAL_OFFICIAL | READY |
| NL economy/housing | CBS / DNB | PRIMARY_OFFICIAL | READY |

## Vintage rule
A backtest uses only the release/vintage available at decision time T. Later revisions may be stored as later state but never overwrite the historical information set.
