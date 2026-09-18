# M99-B013 — Historical Bubbles / Crashes / Regimes

## Goal
Build a cross-asset historical case library that allows M99 to test whether mechanisms are universal, asset-class specific or regime specific.

## Work packages
| Task | Priority | Output | Status |
|---|---|---|---|
| B013-T01 | P0 | Regime/state model | DONE |
| B013-T02 | P0 | Cross-asset historical case registry | DONE |
| B013-T03 | P0 | Source-readiness matrix per case | DONE |
| B013-T04 | P0 | First non-crypto executable case | DONE |
| B013-T05 | P0 | First housing executable case | DONE |
| B013-T06 | P0 | March-2020 cross-asset case | DONE |
| B013-T07 | P0 | Regime comparison output | DONE |

## Selection principle
The library intentionally includes:
- speculative bubbles;
- credit-driven cycles;
- physical commodity shocks;
- policy/regime breaks;
- collateral/liquidity cascades;
- slow housing cycles;
- cross-asset crises.

This prevents BTC from becoming the hidden template for all markets.

## Promotion
`REGISTERED → SOURCE_READY → EXECUTABLE → SOURCE_COMPLETE → REPLAYED → CALIBRATION_SAMPLE`

A source-complete case can remain non-directional and therefore contribute zero forecast samples.

## Next executable targets
1. `NASDAQ-1999-2002` — DONE, SOURCE_COMPLETE, non-directional WAIT.
2. `NL-HOUSING-2015-2023` — DONE, SOURCE_COMPLETE, DOWNSIDE_WATCH with publication-lag control.
3. `OIL-APR2020` — commodity contract/physical-balance mechanics.
4. `GLOBAL-MAR2020` — DONE, SOURCE_COMPLETE cross-asset liquidity cascade.

These four cases deliberately stress different sensor families.


### NASDAQ T04 verified result
- source: NASDAQ Composite daily close via FRED/Nasdaq;
- raw observations: 1004, 1999-01-04 through 2002-12-31;
- first top: 2000-03-10;
- second/lower peak: 2000-03-24;
- support break: 2000-03-30;
- trough: 2002-10-09 at 1114.11 close;
- coverage profile: `INDEX_CLOSE_MACRO_MEANING`;
- action candidate: `WAIT`;
- no synthetic OHLC, volume or derivatives.


### B013 final result
- NASDAQ 1999–2002: SOURCE_COMPLETE / WAIT.
- NL Housing 2015–2023: SOURCE_COMPLETE / DOWNSIDE_WATCH; January 2022 YoY growth peak, July 2022 price-level peak, decision availability 2022-08-22.
- GLOBAL March 2020: SOURCE_COMPLETE / DOWNSIDE_WATCH; cross-asset liquidity-shock profile.
- Cross-asset regime comparison and machine-readable mechanism matrix completed.

**Batch status: DONE.**

The key result is that recurring price shapes are not treated as universal causes. M99 now compares transferable mechanism families such as participation state and financing/liquidity state while retaining domain-specific sensors.
