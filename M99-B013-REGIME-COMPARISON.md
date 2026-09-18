# M99-B013 — Cross-Asset Regime Comparison v0.1

## Purpose
Compare verified historical cases by **mechanism**, not by visual chart resemblance.

Evidence status convention:
- **VISIBLE** — directly measured/source-backed mechanism.
- **PLAUSIBLE** — interpretation supported by several observations.
- **HYPOTHESIS** — candidate relation requiring a larger sample.
- **NOT PRESENT / NOT MEASURED** — do not infer it.

## Verified comparison set

| Case | Domain | Timescale | Candidate | Visible evidence before/at decision | Outcome after decision |
|---|---|---:|---|---|---|
| BTC 2019 | Crypto | days/months | WAIT | regulated futures positioning; macro; positive Libra/adoption framing | later markdown, but no directional sample because decision was WAIT |
| BTC 2021 | Crypto | days/months | DOWNSIDE_WATCH | weaker participation, RSI divergence, stronger USD, tighter financial conditions; derivatives context | later support break and deep 2022 markdown |
| NASDAQ 2000 | Equity index | days/years | WAIT | price structure, rates, official technology/productivity narrative and SEC enforcement context | later support break and 2002 trough |
| GLOBAL Mar 2020 | Cross-asset | days/weeks | DOWNSIDE_WATCH | equity shock, VIX spike, tighter financial conditions, stronger USD, oil collapse | further break and March 23 trough |
| NL Housing 2022 | Housing | months | DOWNSIDE_WATCH | price-growth deceleration, transactions below prior year, rising ECB rate regime | later index break and 2023 trough |

## What is already visible

### 1. Price strength alone is not the common signal
The verified cases use different price structures:
- crypto can show a second top;
- housing can still make a higher price-index level while growth and transactions weaken;
- March 2020 is a shock/cascade, not a distribution top;
- Nasdaq 2000 can be source-complete without the current scoring engine issuing a directional candidate.

**Status: VISIBLE.**

### 2. Participation / activity deterioration is a recurring family
Observed forms differ by market:
- BTC 2021: weaker measured participation / momentum structure;
- NL housing 2022: annual price growth decelerates and transactions are down year-on-year;
- equity/index breadth and turnover are candidate equivalents but are not yet source-complete in the Nasdaq case.

The transferable concept is therefore **PARTICIPATION_STATE**, not one universal volume indicator.

**Status: PLAUSIBLE transferable mechanism family.**

### 3. Funding / liquidity / financial conditions matter, but in different channels
- BTC 2021: USD and financial-conditions context.
- March 2020: direct cross-asset liquidity stress, VIX, dollar and oil shock.
- Housing 2022: financing conditions transmit through policy/mortgage rates on a slower timescale.
- Nasdaq 2000: rates are context, but current verified case does not justify assigning them sole causality.

The transferable concept is **FINANCING_CONDITION_STATE**, with domain-specific adapters.

**Status: PLAUSIBLE transferable mechanism family.**

### 4. Derivatives are powerful sensors, not mandatory in every market
- BTC 2019 uses CME/CFTC futures positioning.
- BTC 2021 uses funding plus archived positioning.
- Housing does not need a crypto-style derivatives layer.
- Nasdaq close-only source completeness does not fabricate options evidence.

**Status: VISIBLE architecture rule.**

### 5. Narrative/meaning can diverge from mechanism
Meaning-world evidence is stored separately from mechanics:
- positive adoption/new-economy framing can coexist with weakening or stressed mechanics;
- policy/fraud/risk framing can change around checkpoints;
- narrative direction is never treated as truth or actor intent.

This is the literal M99 reuse of the **Trickster** method:
`meaning/frame ↔ measured mechanism ↔ positioning/flow ↔ outcome`.

**Status: VISIBLE as comparison method; predictive value remains HYPOTHESIS until larger samples exist.**

## Candidate universal state model

```
ASSET / MARKET
    ↓
ACTIVITY / PARTICIPATION
    +
FINANCING / LIQUIDITY
    +
LEVERAGE / POSITIONING        [when applicable]
    +
VALUATION / FUNDAMENTALS      [when applicable]
    +
PHYSICAL BALANCE              [commodities]
    +
MEANING WORLD
    ↓
REGIME STATE
    ↓
PRICE / OUTCOME
```

The layers are universal; the actual sensors are domain-specific.

## Important negative result
M99 does **not** currently support the claim that Elliott/Wyckoff/Fibonacci-style price geometry is itself the universal causal engine.

The more defensible hypothesis is the reverse:

> recurrent underlying state transitions can produce recurring price shapes.

That hypothesis is now testable across the case library.

## B013 acceptance result
B013 has achieved its purpose:
- cross-asset cases exist;
- slow/fast/shock markets coexist in one model;
- evidence profiles differ honestly;
- source-complete WAIT cases are retained;
- regime comparison is mechanism-first;
- universal vs domain-specific sensors are explicit.

**Batch status: DONE.**
