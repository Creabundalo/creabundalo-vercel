# M99-B014 — Cross-Asset Relation Discovery

## Goal
Discover measured cross-asset associations without turning them into timeless rules or causal claims.

## Work packages
| Task | Priority | Output | Status |
|---|---|---|---|
| B014-T01 | P1 | Relation instance schema | DONE |
| B014-T02 | P1 | Correlation / lead-lag engine | DONE |
| B014-T03 | P1 | March-2020 real-source relation snapshot | DONE |
| B014-T04 | P1 | Regime-scoped relation library | DONE |
| B014-T05 | P1 | Relation stability / change detection | DONE |

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


## Verified March-2020 result
Window 2020-01-02 → 2020-04-30:
- SPX ↔ VIX: -0.7222, STRONG inverse association.
- SPX ↔ broad USD: -0.4098, MODERATE inverse association; strongest scanned lag was USD leading SPX by two matched observations at -0.4252.
- SPX ↔ WTI: +0.1242, WEAK.
- SPX ↔ 10Y yield changes: +0.5171, MODERATE.
- All causality statuses remain `NOT_ESTABLISHED`.

Regime stability:
- SPX ↔ VIX: -0.9226 pre-shock, -0.7925 stress, -0.6079 early recovery.
- SPX ↔ USD: -0.1654 pre-shock, -0.2382 stress, -0.5116 early recovery.

The relation library stores these as separate regime/window instances rather than one timeless correlation.

**Batch status: DONE for FASE A — FILL.**
