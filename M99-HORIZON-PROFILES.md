# M99 — Horizon Profiles v0.1

M99 does not force one timescale onto every market.

## FAST_MARKET
Use for liquid daily/intraday markets such as crypto, equities, indices, FX and liquid commodities.

Initial calibration horizons:
- 3D
- 2W
- 1M
- 2M

## SHOCK
Use for acute liquidity / volatility / policy events where near-term state changes matter most.

Candidate horizons:
- 1D
- 3D
- 1W
- 1M

## SLOW_MARKET
Use for housing and other low-frequency/publication-lagged markets.

Candidate horizons:
- 1M
- 3M
- 6M
- 12M

## CREDIT_MACRO
Use for slower credit, balance-sheet and macro regimes.

Candidate horizons:
- 1M
- 3M
- 6M
- 12M

## Rule
A forecast/outcome sample may only be compared with samples from a compatible horizon profile and evidence-coverage profile.

Changing chart resolution does not change the historical window. Drill-down is:
world → asset/market → lifecycle → regime → episode → event → micro.

A slow-market observation is admitted by publication availability, not by pretending the underlying monthly period was known in real time.
