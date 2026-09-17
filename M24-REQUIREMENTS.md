# M24 v0.1 — Augmented Market Viewer

## Product goal
M24 is not a charting terminal with more indicators. It is an augmented market viewer that projects meaning, causal context, pattern hypotheses, historical analogues and uncertainty on top of price.

Core chain:

`CAUSE → REGIME → POSITIONING → FLOW → MEANING WORLD → TRICKSTER → PATTERN → CONFIRMATION → FORECAST → ACTION → LEARN`

v0.1 is **SIMULATED_ONLY**. No broker execution path may exist.

## UX model

### Time navigation
Time window and resolution are separate concepts.

Hierarchy:

`LIFE CYCLE → CYCLE → REGIME → EPISODE → EVENT → MICRO`

The user drills into a selected historical region while parent context remains visible. Resolution changes detail inside the selected window; it must never silently jump to the latest N days.

### View modes
- **STORY** — ordinary-language explanation: what is happening, why, and what it may mean.
- **ANALYSIS** — overlay controls and measured signals.
- **LAB** — historical analogues, hypotheses, forecasts and realized outcomes.

### Interpretation lenses
- **LEGACY** — conventional macro/market interpretation.
- **M24** — causal transition model using macro, flow, cross-asset, positioning and patterns.
- **AI-NATIVE** — experimental future-economy lens where compute/AI/resource substitution may alter legacy relationships.

## Augmented overlays
The price/lifecycle is the primary canvas. Optional overlays include:
- momentum / RSI divergence
- volume / participation
- Elliott structure
- Wyckoff phase
- Fibonacci retracement/extension zones
- macro events
- cross-asset context
- leverage / liquidations / positioning
- meaning-world narrative
- Trickster assessment
- historical matches
- M24 forecast flags

## Meaning world + Trickster
Narrative and mechanism are first-class, separate records.

The Trickster engine is reused literally from the broader Creabundalo method. For markets it compares the visible narrative and price action with underlying flow, positioning, liquidity and cross-asset confirmation.

Evidence state must remain explicit:
1. **MECHANISM_VISIBLE** — observable market mechanism.
2. **PLAUSIBLE_INTERPRETATION** — hypothesis supported by evidence.
3. **INTENT_UNKNOWN** — default for suspected traps/manipulation.
4. **MANIPULATION_PROVEN** — only with hard evidence / official findings / defensible attribution.

Never infer an actor merely because it is a large holder.

## Qubus core types
- ASSET
- MARKET_STATE
- MACRO_FACTOR
- REGIME
- POSITIONING_STATE
- FLOW_STATE
- MEANING_STATE
- TRICKSTER_ASSESSMENT
- PRICE_STRUCTURE
- PATTERN_INSTANCE
- SIGNAL_INSTANCE
- FIBONACCI_INSTANCE
- HISTORICAL_CASE
- FORECAST_INSTANCE
- ACTION_CANDIDATE
- OUTCOME_INSTANCE
- SOURCE
- USER_OBSERVATION

Each time-varying record should support timestamp/window, timeframe/resolution, provenance, uncertainty/confidence and relations to other instances.

## Forecast model
Forecasts behave like weather forecasts: uncertainty widens with horizon.

Default horizons:
- NOW
- 3D
- 2W
- 1M
- 2M

Longer horizons should become scenario-based rather than a single price target. Store every forecast as an instance, then attach realized outcomes later for calibration.

## Learning safety
M24 may learn from historical and paper outcomes, but learned rule/weight changes must pass:

`LEARN → BACKTEST → PAPER TEST → VALIDATION → eligible for live use`

No learned change may silently alter real-money execution.

## First historical lab set
1. BTC 2021 top → 2022 markdown
2. Nasdaq 2000 dot-com peak
3. Oil 2008 peak
4. March 2020 multi-asset liquidity cascade
5. UK gilt / collateral stress 2022

## v0.1 acceptance criteria
- One calm asset overview screen.
- Mock BTC lifecycle visible.
- Hierarchical drill-down preserves parent context.
- Resolution is a separate control.
- STORY / ANALYSIS / LAB modes work.
- LEGACY / M24 / AI-NATIVE lenses work.
- Overlay toggles work.
- Clicking a historical flag explains what / why / meaning / evidence.
- Narrative and measured mechanism are shown separately.
- Trickster output defaults intent to unknown unless evidenced.
- Cross-asset strip is visible.
- Forecast strip widens uncertainty by horizon.
- `SIMULATED_ONLY` is permanently visible in v0.1.
- No broker order action exists.
