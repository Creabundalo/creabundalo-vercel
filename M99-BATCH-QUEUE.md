# M99 — Master Batch Queue v0.1

## Current phase
**FASE B — VALIDATE**

## Batch plan
| Batch | Priority | Product | Scope | Dependency | Status |
|---|---|---|---|---|---|
| M99-B000 | P0 | P00 | Project method / PBS / WBS / queue | — | DONE |
| M99-B001 | P0 | P01/P02 | Fundament + full fill matrix | B000 | DONE |
| M99-B002 | P0 | P01/P03/P05 | Crypto lifecycle & mechanics | B001 | DONE |
| M99-B003 | P0 | P01/P03 | Equities / indices | B001 | DONE |
| M99-B004 | P0 | P05 | Futures / options / derivatives | B001 | DONE |
| M99-B005 | P0 | P01/P03 | Bonds / credit | B001 | DONE |
| M99-B006 | P0 | P01/P03 | Gold / silver / commodities | B001 | DONE |
| M99-B007 | P0 | P01/P03 | FX | B001 | DONE |
| M99-B008 | P0 | P01/P03 | Housing / real estate | B001 | DONE |
| M99-B009 | P0 | P01/P02 | Money / funding / collateral / liquidity | B001 | DONE |
| M99-B010 | P0 | P02/P09 | Positioning / flows / cross-asset | B001 | DONE |
| M99-B011 | P0 | P02/P09 | Macro / real economy | B001 | DONE |
| M99-B012 | P0 | P06 | Meaning world | B001 | DONE |
| M99-B013 | P0 | P03/P08 | Historical bubbles / crashes / regimes | B002-B012 | DONE |
| M99-B014 | P1 | P09 | Cross-asset relation discovery | B002-B013 | DONE |
| M99-B015 | P0 | P02/P14 | Source-gap / quality sweep | B002-B014 | DONE |
| M99-B016 | P0 | P08 | Pattern hypothesis validation | B013-B015 | RUNNING |
| M99-B017 | P0 | P07 | Trickster validation across cases | B013-B016 | READY |
| M99-B018 | P0 | P10 | Horizon/timescale validation | B013-B016 | READY |
| M99-B019 | P0 | P10/P14 | Calibration cohort expansion | B016-B018 | READY_WITH_DEPENDENCIES |

## M99-B001 — Fundament + full fill matrix
### Goal
Ensure the base model cannot silently omit an entire market, instrument family or sensor layer.

### Work packages
| Task | Priority | Output | Status |
|---|---|---|---|
| B001-T01 | P0 | Canonical market-domain list | DONE |
| B001-T02 | P0 | Derivatives taxonomy incl. options | DONE |
| B001-T03 | P0 | Housing/real-estate domain | DONE |
| B001-T04 | P0 | Bubble/regime state taxonomy | DONE |
| B001-T05 | P0 | Sensor-family catalogue | DONE |
| B001-T06 | P0 | Asset-class × sensor applicability matrix | DONE |
| B001-T07 | P0 | Source-registry schema | DONE |
| B001-T08 | P0 | Canonical entity-ID schema | DONE |
| B001-T09 | P0 | Batch acceptance/gap rules | DONE |
| B001-T10 | P0 | Machine-readable queue record format | DONE |

### B001 acceptance criteria
Batch B001 is **DONE**. Acceptance met:
- all market domains are canonicalized;
- each asset class has a sensor profile;
- derivatives are represented both as instruments and as sensors on underlyings;
- housing/real estate is first-class;
- bubble/regime is modeled as state, not asset class;
- source registry schema exists;
- identity/time/provenance/source-gap rules are explicit;
- the next fill batches can execute without inventing structure mid-run.

## Existing work mapped into the queue
The previous BTC/ETH/SOL M24 work is **not discarded**. It becomes seed material under:
- B002 Crypto;
- B004 Derivatives;
- B011 Macro;
- B012 Meaning World;
- B013 Historical regimes;
- P10 calibration.

No previous case is treated as universal evidence for another asset class.


## M99-B002 — Crypto lifecycle & mechanics
### Checkpoint
Independent crypto fill work is complete. One P0 dependency remains blocked on the older derivatives path.

| Task | Priority | Output | Status |
|---|---|---|---|
| B002-T01 | P0 | BTC/ETH/SOL seed inventory | DONE |
| B002-T02 | P0 | Crypto source/provider matrix | DONE |
| B002-T03 | P0 | SOL 2021 source-complete case | DONE |
| B002-T04 | P0 | BTC 2019 source-complete case | DONE |
| B002-T05 | P0 | Expanded lifecycle/event case registry | DONE |
| B002-T06 | P0 | Crypto gap/quality sweep | DONE |
| B002-T07 | P1 | Crypto options layer | ACCEPTED_LIMITATION |
| B002-T08 | P1 | On-chain/network sensor profile | DONE |

### Resolution
BTC 2019 was resolved through CFTC/CME futures positioning and is source-complete. Long-history crypto/listed-options data remains an explicit source-access limitation, not a blocker.


## Multi-batch checkpoint B003-B012

### DONE
- B003 Equities / indices
- B005 Bonds / credit
- B006 Gold / silver / commodities
- B007 FX
- B008 Housing / real estate
- B009 Money / funding / collateral / liquidity
- B010 Positioning / flows
- B011 Macro / real economy
- B012 Meaning world

### BLOCKED
- none in the P0 fill chain. Detailed long-history listed-options access remains an accepted source limitation, not a phase blocker.

### Architecture discoveries folded into the base
- ON_CHAIN_NETWORK
- STABLECOIN_LIQUIDITY
- FUNDAMENTALS / CORPORATE_ACTIONS / SECURITY_MASTER
- CONTRACT_LIFECYCLE / VOLATILITY_SURFACE / TERM_STRUCTURE
- YIELD_CURVE / CREDIT_SPREAD / DURATION_CONVEXITY
- PHYSICAL_BALANCE / INVENTORY / SEASONALITY / LOCATION_QUALITY_BASIS
- RATE_DIFFERENTIAL_CARRY / FX_REGIME
- HOUSING LOCATION_HIERARCHY / AFFORDABILITY / MORTGAGE_FINANCE / PUBLICATION_LAG
- BALANCE_SHEET_STATE / COLLATERAL_NETWORK / REPO_FUNDING
- REPORTING_LAG / RELEASE_VINTAGE

### Next project-critical run
**M99-B013 — Historical bubbles / crashes / regimes** — now READY. Use the completed market/source worlds to populate representative regime cases and compare which mechanisms survive across asset classes.


## M99-B004-RESOLVE checkpoint
### DONE
- generalized derivatives evidence profiles;
- added CFTC TFF provider for CME Bitcoin market code 133741;
- enforced Friday publication availability for Tuesday COT positions;
- verified BTC 2019 real-source enrichment;
- pinned `m24-verified-btc-2019.json`;
- preserved `WAIT` as non-directional: source-complete case does not become a forecast sample.

### Project effect
- M99-B002 → DONE
- M99-B004 → DONE
- M99-B013 → READY


## M99-B013 checkpoint
### DONE
- regime/state model v0.1;
- cross-asset historical case registry;
- source-readiness matrix across crypto, equities, credit, commodities, FX, housing, funding and cross-asset crises.

### RUNNING
- B013-T04 first non-crypto executable case: **NASDAQ-1999-2002**.

### Principle
Broad research windows are registered first; source data resolves actual checkpoints. Source-complete cases may remain non-directional and therefore contribute zero forecast samples.


## M99-B014 checkpoint
### RUNNING
Cross-asset relation discovery.

First rule: a relation is always scoped by subjects, time window, resolution, regime and evidence status. M99 does not store timeless claims such as “asset A always follows asset B”.


## FASE A closeout — FILL
- B000–B015 completed.
- No unresolved structural P0 source/architecture blocker.
- Open source limitations are explicit P1/P2 or conditional case blockers.
- Calibration n<30 and live execution remain hard later gates.

## FASE B — VALIDATE
### M99-B016 — Pattern hypothesis validation
Test RSI, Wyckoff-like state structure, Elliott-wave hypotheses and Fibonacci relations against the verified case library without treating any pattern as a cause.

### M99-B017 — Trickster validation
Measure meaning-world ↔ mechanism/flow divergence across source-complete cases.

### M99-B018 — Horizon/timescale validation
Define horizon profiles by market timescale. A housing market must not inherit 3D/2W horizons merely because crypto uses them.

### M99-B019 — Calibration cohort expansion
Generate enough compatible historical samples per horizon/regime/coverage profile before any probability may be displayed.

### Safety
M99 remains `SIMULATED_ONLY / PAPER`. FASE B does not authorize live orders.
