# M24 Macro / Cross-Asset Layer v0.1

## Purpose
M24 stores macro and cross-asset observations as separate source-backed facts before interpreting them.

`OFFICIAL SERIES → CHECKPOINT OBSERVATION → MACRO_CROSS_ASSET_CONTEXT → TRICKSTER / FORECAST EVIDENCE`

There is deliberately no single hidden “macro score” in v0.1.

## Initial source registry
The provider reads historical CSV series through FRED while retaining the original upstream source in provenance.

- `EFFR` — Effective Federal Funds Rate — Federal Reserve Bank of New York
- `DGS10` — 10-Year Treasury yield — Board of Governors of the Federal Reserve System
- `DTWEXBGS` — Broad U.S. Dollar Index — Board of Governors
- `RRPONTSYD` — Overnight Reverse Repo — Federal Reserve Bank of New York
- `WALCL` — Federal Reserve Total Assets — Board of Governors
- `NFCI` — National Financial Conditions Index — Federal Reserve Bank of Chicago
- `DCOILWTICO` — WTI crude oil — U.S. Energy Information Administration

The FRED transport is an adapter; the upstream source identity remains part of each Qubus provenance record.

## Semantics
Each series keeps its own meaning label, for example:

- higher EFFR → tighter short-rate context
- higher DGS10 → higher long-rate context
- higher broad dollar → stronger-dollar context
- higher RRP use → more cash parked in reverse repo
- larger WALCL → larger Fed balance sheet
- higher NFCI → tighter financial conditions
- higher WTI → higher oil-price context

These labels are descriptive, not automatic trade directions.

## Checkpoint comparison
For each BTC historical Lab checkpoint M24 takes the latest valid observation on or before the resolved market date, subject to a maximum lag appropriate for the source frequency.

It stores:
- first-top observation
- second-top observation
- absolute delta
- percentage delta where meaningful
- source lag
- provenance

Missing or stale observations become `SOURCE_GAP`, never numeric zero.

## Qubus records

### `MACRO_CROSS_ASSET_CONTEXT`
Contains all source-specific first-top versus second-top observations.

### `SOURCE_GAP`
Used if an official series has no acceptable observation near a checkpoint.

## Trickster use
The Trickster engine may later compare:

`meaning-world narrative ↔ price structure ↔ derivatives crowding ↔ macro/cross-asset context`

Example: a bullish narrative may coexist with a stronger dollar, tighter financial conditions and rising leverage. That discrepancy is a hypothesis input, not proof of manipulation.

## UI
Lab lazy-loads a read-only `Laad macro/cross-asset` action. It displays each series separately and explicitly states that context is not collapsed into an automatic direction.

## Automated validation
`m24-macro-test.js` validates FRED CSV parsing, missing-value handling, source provenance, range parameters and checkpoint deltas.

`m24-macro-lab-test.js` validates Qubus binding and explicit `SOURCE_GAP` creation.

## Next step
After this layer is stable, add timestamped narrative / meaning-world sources to the same checkpoints and run the first combined Trickster backtest across price + derivatives + macro + narrative.
