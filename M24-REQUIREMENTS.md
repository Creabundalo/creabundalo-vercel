# M24 v0.1 — Augmented Market Viewer

## Product intent
M24 is not an indicator terminal. It is an explainable market-state viewer that projects meaning over price and keeps causes, narratives, mechanisms, patterns, uncertainty and actions separate.

Core chain:

`CAUSE → REGIME → POSITIONING → FLOW → MEANING WORLD → TRICKSTER → PATTERN → CONFIRMATION → FORECAST → ACTION → OUTCOME → LEARN`

## UX baseline
- Primary canvas: asset price / lifecycle.
- Time navigation is hierarchical: `LIFE CYCLE → CYCLE → REGIME → EPISODE → EVENT → MICRO`.
- Historical window and chart resolution are separate controls.
- Modes: STORY, ANALYSIS, LAB.
- Lenses: LEGACY, M24, AI-NATIVE.
- Every visible signal must answer: **what / why / source / uncertainty**.
- Clicking a historical flag keeps its parent time context.
- v0.1 is `SIMULATED_ONLY`; no broker execution path exists.

## Augmented layers
1. Structure: highs/lows, support/resistance.
2. Momentum: RSI/divergence and momentum state.
3. Flow: volume, open interest, liquidations, imbalance.
4. Patterns: Elliott, Wyckoff, learned M24 patterns.
5. Fibonacci: retracements and extensions.
6. Macro: rates, credit, liquidity, dollar, energy.
7. Cross-asset: gold, oil, Nasdaq, credit, crypto/asset-specific peers.
8. Meaning world: dominant narrative, frame and expectations.
9. Trickster: discrepancy between visible narrative and underlying mechanism.
10. Historical matches: prior Qubus states with outcomes.
11. Forecast: scenario fan by horizon; uncertainty widens with time.

## Trickster evidence discipline
Never jump from unusual market action to named-actor attribution.

Evidence states:
- `MECHANISM_VISIBLE`
- `INTERPRETATION_PLAUSIBLE`
- `INTENT_UNKNOWN`
- `MANIPULATION_PROVEN`
- `UNSUPPORTED`

## Qubus types
`ASSET`, `MARKET_STATE`, `MACRO_FACTOR`, `REGIME`, `POSITIONING_STATE`, `FLOW_STATE`, `MEANING_STATE`, `TRICKSTER_ASSESSMENT`, `PRICE_STRUCTURE`, `PATTERN_INSTANCE`, `SIGNAL_INSTANCE`, `FIBONACCI_INSTANCE`, `HISTORICAL_CASE`, `FORECAST_INSTANCE`, `ACTION_CANDIDATE`, `OUTCOME_INSTANCE`, `SOURCE`.

## Forecast / learning rule
A forecast is an instance, not a truth claim. Store its timestamp, horizon, signal context, scenario conditions and confidence. Later attach the realized outcome and calibration result.

Learning may propose new weights/rules but may not deploy them to live execution. Required path:

`LEARN → BACKTEST → PAPER TEST → VALIDATE → eligible for execution policy review`

## v0.1 acceptance
- Asset selector works with mock assets.
- Lifecycle breadcrumbs drill down and up without losing context.
- Resolution can change without changing the selected window.
- Overlay toggles work independently.
- Story panel translates indicators to ordinary Dutch.
- Meaning-world and mechanism panels are visibly separate.
- Trickster assessment always shows evidence status.
- Forecast horizon strip shows decreasing confidence with longer horizons.
- Historical case cards are clickable.
- UI visibly states `SIMULATED_ONLY`.
