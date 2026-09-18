# M99-B019 — Calibration Cohort Expansion

## Goal
Expand **compatible** historical calibration cohorts until M99 can display a historical reference probability without mixing incompatible evidence.

## Hard gate
Minimum sample size remains:

`n >= 30`

Until that threshold is reached inside the matching cohort:

`displayProbability = null`

## Cohort identity
A directional historical sample is grouped by:

`coverageProfile × horizonProfile × regimeFamily × direction × horizon`

This means M99 must not silently mix:
- CORE and EXTENDED derivatives evidence;
- FAST, SHOCK and SLOW clocks;
- gradual distribution/markdown regimes and acute liquidity shocks;
- DOWN and UP candidates.

## Current verified directional inventory

### CORE_DERIVATIVES / FAST_MARKET / DISTRIBUTION_MARKDOWN / DOWN
- ETH 2021
- SOL 2021
- current n = 2
- deficit to 30 = 28 episodes per horizon

### EXTENDED_DERIVATIVES / FAST_MARKET / DISTRIBUTION_MARKDOWN / DOWN
- BTC 2021
- current n = 1
- deficit = 29

### CROSS_ASSET_LIQUIDITY / SHOCK / LIQUIDITY_SHOCK / DOWN
- GLOBAL March 2020
- current n = 1
- deficit = 29

### HOUSING_PRICE_RATE_MEANING / SLOW_MARKET / HOUSING_CYCLE_ROLLOVER / DOWN
- NL Housing 2022
- current n = 1
- deficit = 29

## Negative controls
- BTC 2019 — source-complete WAIT → no forecast sample
- NASDAQ 2000 — source-complete WAIT → no forecast sample

Later declines do not retroactively convert these cases into directional samples.

## Episode independence rules
A new case counts toward cohort expansion only when:
1. it has its own decision checkpoint and later outcome;
2. it is source-complete under the same coverage profile;
3. its decision window is not a duplicate/relabel of an already counted event;
4. overlapping windows from the same asset/cycle are grouped under one `episodeGroup`;
5. one episode contributes at most one sample to a given horizon/cohort;
6. all case selection rules are fixed before reading the outcome.

## Expansion order
1. **CORE_DERIVATIVES FAST/DOWN** — most mature current cohort and existing provider chain.
2. **SHOCK DOWN** — add distinct historical liquidity/volatility shocks.
3. **SLOW housing DOWN** — add independent countries/cycles with publication-aware data.
4. **EXTENDED_DERIVATIVES FAST/DOWN** — expand where archive evidence genuinely supports the extended profile.

No cohort is allowed to borrow samples from another merely to reach 30 faster.

## Validation / holdout
Once a cohort reaches enough episodes:
- preserve chronological holdout episodes;
- report training and holdout separately;
- do not retune case-selection rules using holdout outcomes;
- retain Wilson interval and sample count alongside any historical hit rate.

## Work packages
| Task | Priority | Output | Status |
|---|---|---|---|
| B019-T01 | P0 | Regime-aware cohort identity | DONE |
| B019-T02 | P0 | Current verified sample inventory | DONE |
| B019-T03 | P0 | Automated deficit / expansion planner | DONE |
| B019-T04 | P0 | Episode-independence rules | DONE |
| B019-T05 | P0 | CORE fast-market expansion queue | RUNNING |
| B019-T06 | P0 | SHOCK expansion queue | READY |
| B019-T07 | P0 | SLOW-market expansion queue | READY |
| B019-T08 | P1 | EXTENDED derivatives expansion queue | READY |
| B019-T09 | P0 | n>=30 / holdout gate | READY |

## Safety
M99 remains `SIMULATED_ONLY / PAPER`. Calibration expansion does not authorize broker execution.
