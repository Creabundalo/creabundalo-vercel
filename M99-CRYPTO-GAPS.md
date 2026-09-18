# M99-B002 — Crypto Gap & Quality Sweep

## P0 gaps discovered

### G-CR-001 — On-chain/network sensor family absent from generic base
**State:** ARCHITECTURE_GAP → RESOLVED_IN_B002  
Action: add `ON_CHAIN_NETWORK` to generic M99 fill architecture.

### G-CR-002 — Stablecoin liquidity not explicit
**State:** ARCHITECTURE_GAP → RESOLVED_IN_B002  
Action: model stablecoins as assets plus liquidity/settlement sensors.

### G-CR-003 — Crypto options source path not integrated
**State:** OPEN / NON-BLOCKING FOR B002  
Candidate primary venue: Deribit; regulated complement: CME.  
Owner batch: M99-B004.

### G-CR-004 — Single-venue spot bias
**State:** OPEN / P1  
Coinbase is a reproducible primary history source, but not “the whole crypto market.”  
Action: later cross-venue comparator.

### G-CR-005 — Historical derivatives archive asymmetry
**State:** KNOWN / PROFILED  
BTC has EXTENDED derivatives evidence in the verified case; ETH is CORE because archived checkpoint metrics are missing.  
Rule: preserve coverage profile in calibration.

### G-CR-006 — SOL source completeness
**State:** OPEN / P0 FOR FUTURE CASE PROMOTION  
Price and source adapters exist; meaning-world sources are seeded, but the case is not yet verified/source-complete.

### G-CR-007 — Meaning-world source density differs per asset/cycle
**State:** OPEN / EXPECTED  
Rule: source density is evidence coverage, not a value to fabricate.

### G-CR-008 — Liquidation history may be venue-fragmented
**State:** OPEN  
Rule: venue liquidations are venue observations; aggregate only with transparent methodology.

## Quality conclusions
- BTC is useful as a wind-tunnel, not as a universal market proxy.
- ETH and BTC already demonstrate why evidence-coverage profiles matter.
- Crypto needs one generic architecture but asset-specific sensors.
- Perpetual funding, options IV/skew and on-chain state are separate causal/context layers.
- Lifecycle cases should span multiple cycles before universal pattern claims are allowed.

## B002 outcome
No blocker prevents the project from moving to equities/index fill. Remaining crypto gaps are explicitly queued into B004, B010, B012 and B013.
