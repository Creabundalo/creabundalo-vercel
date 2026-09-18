# M99 — Bonds / Credit Source Matrix v0.1

| Layer | Source | Authority | State | Use |
|---|---|---|---|---|
| Treasury yields/curves | U.S. Treasury / FRED with Treasury upstream | PRIMARY_OFFICIAL | READY | maturities, curve slopes |
| Policy/financial conditions | Fed/NY Fed/Chicago Fed via FRED | PRIMARY_OFFICIAL | IMPLEMENTED/READY | policy, liquidity, conditions |
| Corporate/agency transactions | FINRA TRACE | PRIMARY_REGULATORY | READY | price/yield/volume transactions |
| Treasury aggregates | FINRA fixed-income datasets | PRIMARY_REGULATORY | READY | daily Treasury trading volumes |
| Credit spreads | FRED/upstream series | OFFICIAL/DERIVED | READY | Aaa/Baa and other spread series |
| Futures positioning | CFTC Traders in Financial Futures | PRIMARY_REGULATOR | READY | dealer/asset manager/leveraged money |
| Rates futures/options | CME | PRIMARY_VENUE | HANDOFF_B004 | curve expectations / OI / options |
| CDS | venue/vendor/regulatory path TBD | TBD | SOURCE_GAP | B005 later enrichment |

## Integrity rules
- Yield and price direction are not interchangeable fields.
- Curve shape is stored by tenor/as-of, never as one scalar.
- TRACE is transaction evidence for eligible fixed income, not the entirety of credit.
- Publication/reporting lags are preserved in no-lookahead snapshots.
