# M99 — Master Batch Queue v0.1

## Current phase
**FASE A — FILL**

## Batch plan
| Batch | Priority | Product | Scope | Dependency | Status |
|---|---|---|---|---|---|
| M99-B000 | P0 | P00 | Project method / PBS / WBS / queue | — | DONE |
| M99-B001 | P0 | P01/P02 | Fundament + full fill matrix | B000 | DONE |
| M99-B002 | P0 | P01/P03/P05 | Crypto lifecycle & mechanics | B001 | BLOCKED |
| M99-B003 | P0 | P01/P03 | Equities / indices | B001 | DONE |
| M99-B004 | P0 | P05 | Futures / options / derivatives | B001 | BLOCKED |
| M99-B005 | P0 | P01/P03 | Bonds / credit | B001 | DONE |
| M99-B006 | P0 | P01/P03 | Gold / silver / commodities | B001 | DONE |
| M99-B007 | P0 | P01/P03 | FX | B001 | DONE |
| M99-B008 | P0 | P01/P03 | Housing / real estate | B001 | DONE |
| M99-B009 | P0 | P01/P02 | Money / funding / collateral / liquidity | B001 | DONE |
| M99-B010 | P0 | P02/P09 | Positioning / flows / cross-asset | B001 | DONE |
| M99-B011 | P0 | P02/P09 | Macro / real economy | B001 | DONE |
| M99-B012 | P0 | P06 | Meaning world | B001 | DONE |
| M99-B013 | P0 | P03/P08 | Historical bubbles / crashes / regimes | B002-B012 | READY_WITH_DEPENDENCIES |
| M99-B014 | P1 | P09 | Cross-asset relation discovery | B002-B013 | LATER |
| M99-B015 | P0 | P02/P14 | Source-gap / quality sweep | B002-B013 | LATER |

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
| B002-T04 | P0 | BTC 2019 source-complete case | BLOCKED → B004 |
| B002-T05 | P0 | Expanded lifecycle/event case registry | DONE |
| B002-T06 | P0 | Crypto gap/quality sweep | DONE |
| B002-T07 | P1 | Crypto options layer | BLOCKED → B004 |
| B002-T08 | P1 | On-chain/network sensor profile | DONE |

### Blocker
BTC's June/July 2019 case predates Binance Futures. M99 needs an older historical derivatives path (candidate: CME Bitcoin futures, available since 2017) before that case can be promoted without inventing evidence.

### Project continuation
This blocker does not block other B001-dependent batches. **M99-B003 — Equities / indices remains the next READY batch.**


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
- B002 Crypto — remaining BTC 2019 historical-derivatives dependency + crypto options handoff.
- B004 Futures / options / derivatives — domain/taxonomy/source map is filled, but detailed historical listed-options access and the older BTC/CME adapter remain unresolved.

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
**M99-B004-RESOLVE** — generalize derivatives evidence profiles and implement/use a historical pre-Binance BTC derivatives path (CME/CFTC) without requiring perpetual-funding data that did not yet exist.
