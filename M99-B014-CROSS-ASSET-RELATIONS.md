# M99-B014 — Cross-Asset Relation Discovery

## Goal
Discover measured cross-asset associations without turning them into timeless rules or causal claims.

## Work packages
| Task | Priority | Output | Status |
|---|---|---|---|
| B014-T01 | P1 | Relation instance schema | DONE |
| B014-T02 | P1 | Correlation / lead-lag engine | DONE |
| B014-T03 | P1 | March-2020 real-source relation snapshot | RUNNING |
| B014-T04 | P1 | Regime-scoped relation library | READY |
| B014-T05 | P1 | Relation stability / change detection | READY |

## Relation identity
A relation instance must include:
- left subject;
- right subject;
- transforms;
- time window;
- resolution;
- regime/case;
- aligned sample size;
- contemporaneous association;
- lag scan;
- provenance;
- evidence status;
- causality status.

## Critical rule
`CORRELATION != CAUSATION`

A lagged association does not mean the leading asset caused the other asset to move.

## First real-source test
GLOBAL March 2020:
- SPX ↔ VIX
- SPX ↔ broad USD
- SPX ↔ WTI
- SPX ↔ 10Y Treasury yield

The relation engine works on changes/returns rather than correlating trending price levels.
