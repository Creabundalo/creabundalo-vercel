# M99 — Fill Acceptance & Gap Rules v0.1

## A work package is DONE only when
- required output records exist;
- identity is canonical;
- time/resolution is explicit;
- provenance exists;
- expected source gaps are recorded;
- validation gate passes;
- no prohibited lookahead exists for historical decisions.

## A market case is SOURCE_COMPLETE when
All **applicable core sensors** are complete. Extended sensors may be unavailable only when:
- the missing source is explicitly attempted;
- the gap is documented;
- the coverage profile records the limitation;
- calibration never mixes incompatible coverage profiles silently.

## Blocking gaps
Examples:
- missing core price history;
- unresolved decision-time macro source needed by the case;
- meaning-world has no timestamped evidence where required;
- corrupted archive/checksum;
- unresolved identity ambiguity.

## Non-blocking documented limitations
Examples:
- optional extended positioning unavailable historically;
- source publishes only weekly rather than daily data;
- a known archive retention limit is replaced by authoritative archive data.

## Batch continuation
A single BLOCKED task does not stop a batch unless downstream tasks depend on it.
The runner records the blocker, marks dependent tasks blocked, and continues with other READY tasks.

## Architecture decision rule
When repeated source gaps reveal that one universal schema is inappropriate, create an explicit profile/subtype rather than inventing values.

Example:
`DERIVATIVES = CORE_DERIVATIVES | EXTENDED_DERIVATIVES`.
