# M99-B019 — Generated Enrichment Batch Policy

## Purpose
Generated calibration candidates are source-heavy. They are processed in small deterministic batches rather than one giant run.

## Default batch size
`3 cases`

## Order
1. decision date ascending;
2. asset canonical ID.

No ordering by known outcome, later drawdown, or expected success.

## Batch result states
- SOURCE_COMPLETE + directional → eligible for verified promotion/replay.
- SOURCE_COMPLETE + WAIT → retained negative control, zero directional samples.
- INCOMPLETE → missing evidence recorded.
- SOURCE_ERROR → retry/source-health task; never converted to missing=zero.

## Checkpoint
Each batch reports:
- attempted;
- source-complete;
- directional source-complete;
- WAIT controls;
- incomplete;
- source errors;
- exact case IDs / source gaps.

This allows B019 to expand gradually while preserving provenance and avoiding a 17-case opaque network run.
