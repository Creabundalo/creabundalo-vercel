# M99-B019 — Deterministic Episode Generation

## Why
Calibration samples may not be hand-picked because we already know the later crash/rebound.

A famous-event list is useful for validation, but it is not sufficient for calibration.

## Core rule
A calibration episode must be generated from information available at decision time T.

```
historical stream
    ↓
rolling observation window
    ↓
mechanism/pattern candidate at T
    ↓
freeze DECISION_SNAPSHOT
    ↓
advance clock
    ↓
measure outcome at profile horizons
    ↓
sample enters compatible cohort
```

## Episode identity
Each generated episode stores:
- asset / market;
- decision timestamp;
- episodeGroup;
- selection rule version;
- coverage profile;
- horizon profile;
- regime family;
- direction;
- source-complete evidence state;
- later outcomes;
- overlap metadata.

## Anti-selection-bias rules
1. Never use future drawdown/rebound to decide whether an episode exists.
2. Famous historical events may be used as regression cases, not as the only calibration set.
3. One event cannot be duplicated by sliding the decision date a few days and counting each copy independently.
4. Near-overlapping decision windows belong to one `episodeGroup`.
5. Selection thresholds are versioned before outcomes are scored.
6. WAIT episodes are retained as negative controls but do not create directional forecast samples.
7. Failed candidates remain in the audit trail.

## First generator target
`CORE_DERIVATIVES × FAST_MARKET × DISTRIBUTION_MARKDOWN × DOWN`

Reason:
- existing chain already supports ETH/SOL;
- current n=2;
- source adapters are relatively mature;
- deficit to 30 is 28 independent directional episodes.

## Initial rolling candidate conditions
The generator may open a candidate checkpoint only from source-known-at-T features such as:
- resolved local high / second-high structure;
- participation weakening;
- RSI/momentum weakening;
- funding/crowding state;
- macro stress context;
- meaning/mechanism comparison.

These are inputs to the existing decision engine, not post-hoc labels.

## Independence
Default episode cooldown:
- FAST_MARKET: one episodeGroup per asset/regime until the previous outcome window has cleared;
- SHOCK: one episodeGroup per distinct shock window;
- SLOW_MARKET: one episodeGroup per cycle/region.

Exact cooldown rules are versioned and validated before batch production.
