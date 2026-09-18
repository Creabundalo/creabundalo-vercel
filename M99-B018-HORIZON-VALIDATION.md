# M99-B018 — Horizon / Timescale Validation

## Goal
Validate that M99 evaluates outcomes on a clock appropriate to the market, rather than applying crypto-style 3D/2W horizons everywhere.

## Horizon profiles

### FAST_MARKET
Use for liquid daily markets and crypto top/markdown cases.

- 3D
- 2W
- 1M
- 2M
- clock: market daily observations

### SHOCK
Use for acute liquidity / volatility shocks.

- 1D
- 3D
- 1W
- 2W
- 1M
- clock: market daily observations

### SLOW_MARKET
Use for housing and other publication-lagged slow markets.

- 1M
- 3M
- 6M
- 12M
- clock: publication calendar

## Rules
1. The horizon profile is part of forecast/cohort identity.
2. FAST, SHOCK and SLOW samples may not be silently pooled.
3. For publication-lag markets, the decision value is the latest observation actually published by T.
4. Outcome availability is stored separately from the underlying observation period.
5. A directional candidate may be correct at one horizon and incorrect at another; all are retained.
6. Source completeness does not imply short-horizon certainty.
7. No probability is displayed below n=30 inside a compatible horizon/profile cohort.

## Work packages
| Task | Priority | Output | Status |
|---|---|---|---|
| B018-T01 | P0 | Horizon-profile schema | DONE |
| B018-T02 | P0 | FAST/SHOCK/SLOW clock contract | DONE |
| B018-T03 | P0 | Real-source housing slow-market replay | DONE |
| B018-T04 | P0 | Real-source March-2020 shock replay | DONE |
| B018-T05 | P0 | Cohort isolation by horizon profile | DONE |
| B018-T06 | P0 | Validation conclusion | DONE |

## Validation principle
The user-facing intuition “closer horizons should usually be easier to estimate” is not encoded as a guarantee. Markets can reverse violently; observed horizon-specific accuracy must be learned from compatible historical cohorts.


## Verified result

### SLOW_MARKET — NL Housing 2022
Decision availability: 2022-08-22.

- 1M: -0.1505% — correct DOWN
- 3M: -1.5049% — correct DOWN
- 6M: -3.5365% — correct DOWN
- 12M: -5.4929% — correct DOWN

### SHOCK — GLOBAL March 2020
Decision checkpoint: 2020-03-16.

- 1D: +5.9955% — incorrect DOWN
- 3D: +0.9748% — incorrect DOWN
- 1W: -6.2331% — correct DOWN
- 2W: +10.0799% — incorrect DOWN
- 1M: +16.6475% — incorrect DOWN

### Conclusion
Closer is not automatically more reliable. Shock regimes can reverse violently even when the stress diagnosis was correct. Horizon accuracy must therefore be calibrated by compatible market-timescale/regime cohorts.

**Batch status: DONE.**
