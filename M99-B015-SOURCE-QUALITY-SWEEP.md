# M99-B015 — Source Gap / Quality Sweep

## Goal
Close FASE A — FILL with one canonical list of source limitations, substitutions, conditional blockers and later calibration/safety gates.

## Quality dimensions
Every source path is judged on:
- authority;
- historical depth;
- timestamp/publication lag;
- revision policy;
- access reliability;
- licensing/cost;
- asset/venue scope;
- fallback/substitution;
- coverage-profile impact.

## Canonical gap register

| ID | Domain | Gap / limitation | Priority | State | Disposition |
|---|---|---|---|---|---|
| QG-001 | Housing | CBS OData unreachable from GitHub runner | P0 | RESOLVED_BY_SUBSTITUTE | official pinned CBS/Kadaster release extract with provenance |
| QG-002 | Crypto options | historical IV/skew/OI depth not integrated | P1 | OPEN | Deribit/CME path; validate history/licence before case promotion |
| QG-003 | U.S. listed options | deep historical quotes/trades/Greeks often commercial | P1 | ACCEPTED_LIMITATION | Cboe/OCC source path retained; do not synthesize |
| QG-004 | Futures | detailed old contract history may require CME DataMine | P1 | ACCEPTED_LIMITATION | use public regulatory/venue aggregates where sufficient |
| QG-005 | Crypto | on-chain/network provider not selected | P1 | OPEN | prefer direct-chain + methodology-documented derived sources |
| QG-006 | Crypto spot | single-venue bias in reproducible Coinbase history | P1 | OPEN | later multi-venue comparator |
| QG-007 | Crypto leverage | liquidation history is venue-fragmented | P1 | OPEN | preserve venue scope; aggregate only transparently |
| QG-008 | Credit | CDS source path not implemented | P1 | OPEN | regulatory/venue/vendor path later |
| QG-009 | Precious metals | LBMA/IBA historical benchmark access/licence | P1 | ACCEPTED_LIMITATION | futures/CFTC/macro can proceed; benchmark limitation explicit |
| QG-010 | Flows | ETF/fund flow primary-source normalization incomplete | P1 | OPEN | issuer/fund primary data preferred |
| QG-011 | Equity | securities-lending/borrow history often commercial | P2 | OPTIONAL_GAP | not core for current fill |
| QG-012 | Housing | direct mortgage-rate/credit/affordability layer not yet in verified NL case | P1 | OPEN_ENRICHMENT | add DNB/ECB/CBS before strong housing forecasting claims |
| QG-013 | Equity/index | Nasdaq verified case lacks breadth/fundamentals as core evidence | P1 | OPEN_ENRICHMENT | add SEC/breadth layer for bubble-mechanism tests |
| QG-014 | UK rates | gilt/LDI source adapter not implemented | P1 | SOURCE_PATH | build when UK-GILTS-2022 is promoted |
| QG-015 | Oil | April-2020 contract-level curve/storage/expiry adapter not implemented | CONDITIONAL_P0 | SOURCE_PATH | mandatory before OIL-APR2020 source-complete promotion |
| QG-016 | Meaning world | broad automated historical news intake not yet generic | P1 | OPEN | current case-scoped fixtures remain provenance-safe |
| QG-017 | Relations | real-source relation stability currently seeded mainly by March 2020 | P1 | BREADTH_GAP | expand across regimes before generalization |
| QG-018 | Calibration | directional sample counts remain far below n=30 per compatible cohort | P0_LATER | CALIBRATION_GAP | blocks probability display and live transition, not FILL |
| QG-019 | Execution | live broker action remains unauthorized | SAFETY_P0 | INTENTIONALLY_BLOCKED | SIMULATED_ONLY / paper until separate release decision |

## Resolved structural gaps
- derivatives no longer imply perpetual funding;
- pre-Binance BTC uses CFTC/CME futures positioning;
- non-crypto cases have case-specific evidence profiles;
- slow markets retain publication availability;
- CBS CI failure has an official-source fallback;
- relation records are window/regime scoped;
- source-complete WAIT cases do not create forecast samples.

## Phase decision
There is **no unresolved P0 structural source/architecture blocker for FASE A — FILL**.

Open P1/P2 items remain explicit enrichment tasks. Conditional P0 items become blocking only when the affected historical case is promoted.

The project may move to **FASE B — VALIDATE**.

Live execution does not move with it: M99 remains `SIMULATED_ONLY / PAPER`.
