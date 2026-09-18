# M99-B019 — Mechanics-Core Calibration Profile

## Purpose
Scaling automatic historical calibration must not depend on hand-curating news around every generated checkpoint.

M99 therefore adds a distinct evidence profile:

`MECHANICS_CORE_DERIVATIVES`

## Required layers
- PRICE
- DERIVATIVES
- MACRO
- DECISION_SNAPSHOT
- BACKTEST_OUTCOME

## Not required
- MEANING_WORLD

Meaning-world evidence is **not removed** from M99. It remains:
- mandatory in the richer semantic historical cases;
- the input to Trickster comparisons;
- an optional augmentation for generated mechanics-core episodes.

## Why this must be a separate cohort
A mechanics-only sample cannot be silently mixed with:
- `CORE_DERIVATIVES`
- `EXTENDED_DERIVATIVES`
- any meaning-required profile

because the evidence set differs.

## Candidate promotion path

```
PRICE_CANDIDATE_ONLY
  ↓
generated deterministic case schema
  ↓
price + derivatives + macro
  ↓
no-lookahead decision
  ↓
source evidence gate
  ↓
WAIT or directional candidate
  ↓
later horizon replay
  ↓
MECHANICS_CORE_DERIVATIVES calibration cohort
```

## Integrity
- Candidate selection cannot inspect later outcomes.
- Outcome windows are fixed from the decision date and rule version.
- Empty meaning-world context may be stored, but it is not counted as required evidence.
- Semantic enrichment can be added later without changing the original mechanics-core decision.
- Re-enrichment may create a different richer cohort, never rewrite the old sample.

This profile exists to make calibration scalable without weakening provenance or reintroducing manual event selection.
