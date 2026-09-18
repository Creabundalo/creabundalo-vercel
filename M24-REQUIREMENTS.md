# M24 v0.1 — Augmented Market Viewer

## Product goal
M24 is not a charting terminal with more indicators. It is an augmented market viewer that projects meaning, causal context, pattern hypotheses, historical analogues and uncertainty on top of price.

Core chain:

`CAUSE → REGIME → POSITIONING → FLOW → MEANING WORLD → TRICKSTER → PATTERN → CONFIRMATION → FORECAST → ACTION → TRANSACTION → OUTCOME → LEARN`

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
- own transaction markers

## Meaning world + Trickster
Narrative and mechanism are first-class, separate records.

The Trickster engine is reused literally from the broader Creabundalo method. For markets it compares the visible narrative and price action with underlying flow, positioning, liquidity and cross-asset confirmation.

Evidence state must remain explicit:
1. **MECHANISM_VISIBLE** — observable market mechanism.
2. **PLAUSIBLE_INTERPRETATION** — hypothesis supported by evidence.
3. **INTENT_UNKNOWN** — default for suspected traps/manipulation.
4. **MANIPULATION_PROVEN** — only with hard evidence / official findings / defensible attribution.

Never infer an actor merely because it is a large holder.

## Historical case semantics
A historical case describes market structure independently from one source or timeframe.

For each case, M24 must separate:

`CASE WINDOW → CHECKPOINT WINDOW → SELECTION RULE → SOURCE/RESOLUTION → MEASURED INSTANCE`

A checkpoint may therefore be defined as, for example:
- maximum high inside a first-top window
- minimum low inside a support window
- maximum high inside a second-top window
- first close below the resolved support after the resolved second top

The analysis must not require a fixed weekly date when the same market event is tested on daily or intraday bars.

## Source / resolution comparison
M24 must be able to run the same historical case against multiple sources/resolutions and retain differences explicitly.

At minimum a comparison stores:
- resolved checkpoint dates per source/resolution
- metric deltas
- agreement/disagreement for structural and indicator verdicts
- both provenance chains

A disagreement is information. M24 must not silently average or rewrite conflicting weekly/daily outcomes into artificial certainty.

The initial comparison path is:

`weekly deterministic regression fixture → daily Coinbase Exchange historical bars`

Primary-source comparison is read-only historical analysis. It must not require broker credentials and may not expose any order action.

## Transactions
Transactions follow the same progressive-disclosure design as the rest of M24: compact rows first, details only after drill-down.

Default transaction row:

`ASSET | LONG/SHORT/HEDGE | STRATEGY | OPENED | ENTRY | SIZE | STATUS | P/L`

User-facing lifecycle:

`KANDIDAAT → KLAAR → OPEN → DEELS → GESLOTEN`

Alternate terminal states:

`GEANNULEERD | AFGEWEZEN`

Execution/audit lifecycle below the simple status:

`PREPARE → PREVIEW → APPROVE → COMMIT → VERIFY`

Every transaction must link back to the decision context at entry time:
- forecast instance
- regime
- meaning-world state
- Trickster assessment
- pattern/signals used
- risk plan / stop / targets
- fills and status changes
- realized outcome

Clicking a transaction row opens a nested detail view showing **why we entered, what changed while open, how execution happened, and what was learned**.

In v0.1 all transactions are paper/mock instances and are clearly labeled `PAPER`.

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
- LAB_RESULT
- LAB_RESULT_PRIMARY
- SOURCE_COMPARISON
- FORECAST_INSTANCE
- ACTION_CANDIDATE
- TRANSACTION_INSTANCE
- ORDER_INSTANCE
- FILL_INSTANCE
- TRANSACTION_STATE
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
- Historical case checkpoints can resolve from semantic windows rather than source-specific fixed dates.
- The same case can be tested on weekly and daily representations.
- Source/resolution disagreements are preserved as explicit comparison data.
- Primary historical-source comparison is read-only.
- Transactions are shown as compact rows and drill into full context/status history.
- Paper/live mode is explicit per transaction.
- `SIMULATED_ONLY` is permanently visible in v0.1.
- No broker order action exists.


## Verified multi-asset calibration cohort

Historical source-complete cases are evidence-derived, not manually promoted.

Current verified cohort:
- BTC 2021–22 — `EXTENDED_DERIVATIVES`
- ETH 2021–22 — `CORE_DERIVATIVES`
- SOL 2021–22 — `CORE_DERIVATIVES`
- BTC 2019 — pending; first-top period predates the available Binance futures funding history and must not be forced into a later-era derivatives profile.

Coverage profiles are calibration dimensions:
- `EXTENDED_DERIVATIVES`: core funding plus historical OI / long-short / taker-positioning extension.
- `CORE_DERIVATIVES`: core checkpoint funding is complete, while optional extended positioning is unavailable and retained as explicit source gaps.
- `UNPROFILED_RESEARCH`: may inspect samples across profiles, but may not be used as the calibrated probability cohort.

Every verified directional case is replayed independently at `3D / 2W / 1M / 2M`.
A replay forecast must carry its evidence coverage profile into `FORECAST_INSTANCE.conditions.coverageProfile`.
Calibration must filter by coverage profile; samples with different evidence coverage may not be silently pooled.

Current profile sample counts per replay horizon:
- `EXTENDED_DERIVATIVES`: n=1 (BTC 2021)
- `CORE_DERIVATIVES`: n=2 (ETH 2021 + SOL 2021)
- unprofiled research view: n=3

No probability may be displayed before the relevant filtered cohort reaches n=30.

Integrity rule: an incorrect horizon outcome is retained exactly as measured. Example: the ETH 2021 historical DOWN candidate was incorrect at 3D (+0.2638%) but correct at 2W / 1M / 2M. M24 may not smooth this into an overall “correct” label.
