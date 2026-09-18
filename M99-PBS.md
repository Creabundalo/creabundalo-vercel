# M99 — Product Breakdown Structure (PBS) v0.1

## P00 — Project Control
Deliverables:
- project method;
- PBS;
- WBS/work-package catalogue;
- batch queue;
- checkpoint/status view.

Acceptance: every M99 activity can be traced to a product, work package and batch.

## P01 — Market World
A canonical financial-world model covering:
- equities;
- indices / ETFs / funds;
- crypto;
- bonds / credit;
- commodities;
- FX;
- real estate / housing;
- money markets / funding / collateral;
- volatility;
- derivatives.

Acceptance: each instrument/market has canonical identity, asset class and applicable sensor profile.

## P02 — Source & Data World
Deliverables:
- source registry;
- provider adapters;
- provenance model;
- resolution/time model;
- source-gap model;
- quality ranking.

Acceptance: no analytical value exists without source/as-of/provenance or an explicit SOURCE_GAP.

## P03 — Historical Case Library
Cases include:
- bubbles;
- double tops / distributions;
- crashes;
- squeezes;
- liquidity cascades;
- capitulations;
- recoveries;
- rate/credit shocks;
- housing cycles.

Acceptance: cases are source-resolvable and use semantic checkpoint rules rather than hand-picked outcome dates.

## P04 — Market Mechanics
Price, volume, volatility, liquidity, order/market flow, support/resistance, momentum and market microstructure.

## P05 — Derivatives World
- futures;
- options;
- perpetuals;
- forwards;
- swaps;
- CDS / credit derivatives;
- open interest;
- funding;
- IV / skew;
- delta / gamma;
- expiries;
- liquidations / margin.

Acceptance: derivatives are linked to the underlying and distinguished as core vs extended evidence where sources differ.

## P06 — Meaning World
Timestamped narratives, consensus, analyst framing, expectations and source claims.

Acceptance: frame coding is separate from truth/evidence and asset/case scoped.

## P07 — Trickster
Compare:
`story ↔ measured mechanism ↔ positioning ↔ flow ↔ outcome`.

Acceptance: discrepancy may be detected; actor intent is never inferred without evidence.

## P08 — Pattern & Regime Engine
- Wyckoff;
- Elliott;
- Fibonacci;
- RSI / momentum;
- lifecycle;
- accumulation / expansion / euphoria / bubble candidate / distribution / breakdown / capitulation / recovery.

Acceptance: patterns are hypotheses measured against outcomes, not assumed causes.

## P09 — Cross-Asset Model
Relations among equities, credit, rates, USD, commodities, crypto, volatility and real estate.

## P10 — Forecast & Calibration
Horizon replay, regime cohorts, coverage-profile cohorts, minimum sample gates and confidence calibration.

Acceptance: no displayed historical probability below the minimum sample threshold.

## P11 — Transaction Model
Candidate → prepare → preview → approve → commit → verify → outcome.

Acceptance: complete audit trail; live execution remains separately gated.

## P12 — M99 Cockpit
Row-first augmented market viewer with drill-down from world → asset → lifecycle → regime → episode → event → micro.

## P13 — ACTI / Broker Layer
Paper adapters first; later broker connectivity under explicit authorization.

## P14 — Operations & Learning
Batch execution, monitoring, regression gates, model calibration, source-health monitoring and learning records.
