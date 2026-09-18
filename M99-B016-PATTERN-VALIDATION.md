# M99-B016 — Pattern Hypothesis Validation

## Goal
Test recurring price-pattern hypotheses against the source-complete case library without treating geometry as causal truth.

## Pattern families
- RSI / momentum divergence;
- Wyckoff-like distribution / accumulation state structure;
- Fibonacci retracement / extension geometry;
- Elliott-style swing/wave candidates;
- lifecycle/regime transitions.

## Rule
`PATTERN != CAUSE`

Patterns are observations/hypotheses derived from source-backed price/state data. Mechanism and meaning-world evidence remain separate.

## Work packages
| Task | Priority | Output | Status |
|---|---|---|---|
| B016-T01 | P0 | Pattern hypothesis record schema | DONE |
| B016-T02 | P0 | Fibonacci geometry engine | DONE |
| B016-T03 | P0 | RSI / structural distribution adapter | DONE |
| B016-T04 | P0 | Swing / Elliott candidate engine | DONE |
| B016-T05 | P0 | Verified cross-case pattern matrix | DONE |
| B016-T06 | P0 | Pattern ↔ mechanism comparison | DONE |

## Evidence discipline
Each pattern record stores:
- case ID / asset;
- source checkpoint IDs;
- pattern family;
- measured values;
- tolerance/rule version;
- status: OBSERVED / NOT_OBSERVED / INSUFFICIENT;
- evidence status;
- causal status = NOT_ESTABLISHED.

No pattern may create a live order by itself.


See `M99-B016-PATTERN-MECHANISM-COMPARISON.md` for the verified control result.

**Batch status: DONE.**
