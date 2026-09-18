# M99 — Regime / Bubble State Model v0.1

## Purpose
Regime labels are time-bounded hypotheses derived from evidence. They are not permanent asset labels and not a substitute for raw observations.

## Core state vocabulary
- ACCUMULATION
- EXPANSION
- EUPHORIA
- BUBBLE_CANDIDATE
- DISTRIBUTION
- BREAKDOWN
- LIQUIDITY_STRESS
- LEVERAGE_CASCADE
- CAPITULATION
- RECOVERY
- POLICY_SHOCK
- SUPPLY_SHOCK
- CREDIT_STRESS
- PEG_STRESS
- VOLATILITY_SHOCK
- RANGE / NORMALIZATION

## Evidence dimensions
A regime state may reference:
- price/volume;
- volatility;
- leverage/derivatives;
- credit/rates;
- liquidity/funding/collateral;
- positioning/flow;
- fundamentals or physical balance where applicable;
- macro;
- cross-asset behavior;
- meaning world;
- event/policy timeline.

## Bubble candidate rule
`BUBBLE_CANDIDATE` is not assigned from price appreciation alone.

Candidate evidence can include:
- valuation/price acceleration;
- leverage/credit expansion;
- breadth/participation;
- speculative issuance/activity;
- options/derivatives crowding;
- turnover/transaction acceleration;
- narrative convergence/euphoria;
- weakening fundamentals or participation beneath price;
- affordability/debt stress for housing;
- physical-balance divergence for commodities.

## State transition principle
States may overlap and transitions are hypotheses:
`ACCUMULATION → EXPANSION → EUPHORIA/BUBBLE_CANDIDATE → DISTRIBUTION → BREAKDOWN → CAPITULATION → RECOVERY`

Event-driven states such as POLICY_SHOCK, SUPPLY_SHOCK or LEVERAGE_CASCADE can interrupt the sequence.

## Proof discipline
Each REGIME_STATE stores:
- subject/case;
- start/end or open interval;
- evidence record IDs;
- source/provenance;
- confidence;
- status: MECHANISM_VISIBLE / PLAUSIBLE_INTERPRETATION / HYPOTHESIS;
- competing explanations.

No state may imply actor intent.
