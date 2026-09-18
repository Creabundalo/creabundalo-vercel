# M99 — Project Method

## Purpose
M99 (MoneyMaker) is run as a product-driven project, not as a stream of ad-hoc chat tasks.

```
PROJECT
  ↓
PBS — what products must exist?
  ↓
DELIVERABLES
  ↓
WBS — what work creates them?
  ↓
WORK PACKAGES
  ↓
BATCH QUEUE
  ↓
BATCH RUN
  ↓
CHECKPOINT / ACCEPTANCE
```

## Operating rule
The default operating unit is a **batch**, not a micro-task.

A batch may run through all READY work packages whose dependencies are satisfied. Human interruption is required only for:
- a real architecture decision with multiple material consequences;
- an irreversible external action;
- credentials / live-money authorization;
- a source/legal constraint that changes scope;
- a contradiction in requirements that cannot be resolved conservatively.

Everything else is recorded and the batch continues.

## Status model
- `READY` — dependencies satisfied.
- `RUNNING` — current batch is processing it.
- `DONE` — acceptance criteria passed.
- `BLOCKED` — cannot continue; reason and unblock action recorded.
- `LATER` — intentionally outside current phase.

## Priority
- `P0` — required for the current product phase.
- `P1` — important enrichment.
- `P2` — optional / later optimization.

## Current project phase
**FASE A — FILL**

Goal: build a broad, source-backed market world before optimizing forecasts or live trading.

Every fill product preserves:
- source/provenance;
- timestamp / as-of;
- resolution;
- evidence status;
- source gaps;
- asset class / instrument identity;
- no-lookahead boundaries where historical analysis is used.

## Batch report
A batch checkpoint reports only:
1. DONE work packages;
2. BLOCKED work packages + exact reason;
3. source gaps;
4. architecture decisions created by evidence;
5. notable discoveries;
6. next READY work packages.

## Safety
M99 remains `SIMULATED_ONLY / PAPER` until a separate ACTI release gate explicitly authorizes live execution.
