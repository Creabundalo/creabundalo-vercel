# M24 Technical Design v0.1

## 1. Architectural goal
M24 is an augmented market-intelligence system, not a broker terminal. The UI is a projection of a provider-independent semantic state.

Core processing chain:

`SOURCE → OBSERVE → QUBUS → INTERPRET → MEANING WORLD → TRICKSTER → PATTERN → CONFIRM → FORECAST → ACTION CANDIDATE → ACTI GATE → OUTCOME → LEARN`

v0.1 remains `SIMULATED_ONLY`.

## 2. Separation of concerns

### Renderer
`m24.html` + `m24.css` + `m24.js`

Responsibilities:
- lifecycle/cycle/regime/episode/event/micro navigation
- independent resolution control
- STORY / ANALYSIS / LAB projections
- Legacy / M24 / AI-native interpretation lenses
- overlays and flags
- paper-transaction rows and drill-down

The renderer does not own market meaning or execution logic.

### Domain core
`m24-core.js`

Responsibilities:
- Qubus records and provenance
- signal/evidence vocabulary
- Trickster assessment
- forecast-instance creation and later calibration
- transaction state machine
- safety policy: no live execution in v0.1

### Provider layer
`m24-data.js` initially supplies deterministic mock data through provider contracts.

Future adapters:
- `MarketDataProvider`: price, volume, bars, order flow, market depth
- `MacroDataProvider`: rates, credit, liquidity, inflation, employment, energy
- `CrossAssetProvider`: linked-asset states/correlations/regime context
- `NarrativeProvider`: source claims, dominant frames, news/analyst narrative
- `OwnershipProvider`: holdings/ownership with provenance and reporting lag
- `BrokerProvider`: paper/live order interface, later IBKR adapter

Providers are replaceable. M24 meaning, Qubus records and decision logic must not depend on one vendor.

## 3. Qubus record envelope
Every meaningful object is an instance.

```js
{
  id,
  type,
  subjectId,
  timestamp,
  window,
  resolution,
  data,
  evidenceStatus,
  confidence,
  provenance: [{sourceId, observedAt, lag, note}],
  relations: [{type, targetId}]
}
```

Core types include:
`ASSET`, `MARKET_STATE`, `MACRO_FACTOR`, `REGIME`, `POSITIONING_STATE`, `FLOW_STATE`, `MEANING_STATE`, `TRICKSTER_ASSESSMENT`, `PRICE_STRUCTURE`, `PATTERN_INSTANCE`, `SIGNAL_INSTANCE`, `FIBONACCI_INSTANCE`, `HISTORICAL_CASE`, `FORECAST_INSTANCE`, `ACTION_CANDIDATE`, `TRANSACTION_INSTANCE`, `OUTCOME_INSTANCE`, `SOURCE`, `USER_OBSERVATION`.

## 4. Evidence model
Trickster and actor attribution use explicit evidence states:

1. `MECHANISM_VISIBLE`
2. `PLAUSIBLE_INTERPRETATION`
3. `INTENT_UNKNOWN`
4. `MANIPULATION_PROVEN`

`INTENT_UNKNOWN` is the default whenever a trap/manipulation interpretation is suggested without hard attribution evidence.

## 5. Time model
Time window and resolution are separate.

Hierarchy:
`LIFE CYCLE → CYCLE → REGIME → EPISODE → EVENT → MICRO`

A drill-down creates/selects a child window. Changing resolution only changes sample density inside that selected window.

## 6. Trickster engine
Input:
- visible price action
- meaning-world narrative
- flow/volume/positioning
- liquidity/leverage
- cross-asset confirmation
- source timing

Output:
- discrepancy score
- identified mechanism candidates (false breakout, failed breakdown, squeeze, liquidity sweep, narrative lag)
- evidence state
- explicit intent status
- links to supporting Qubus instances

The engine detects discrepancies; it does not invent an actor.

## 7. Forecast and learning
Forecasts are stored as instances at creation time.

Default horizons:
`NOW`, `3D`, `2W`, `1M`, `2M`.

Longer horizons widen uncertainty and move from a directional call toward scenarios/conditions.

Learning pipeline:
`FORECAST → REALIZED OUTCOME → SCORE → CALIBRATION CANDIDATE → BACKTEST → PAPER TEST → VALIDATION`

No calibration candidate may silently change live-money execution.

## 8. Transactions
Human status:
`KANDIDAAT → KLAAR → OPEN → DEELS → GESLOTEN`
with `GEANNULEERD` / `AFGEWEZEN` terminal alternatives.

Execution/audit status:
`PREPARE → PREVIEW → APPROVE → COMMIT → VERIFY`.

A transaction row is a projection of a `TRANSACTION_INSTANCE`; drill-down shows the linked rationale, forecast, signals, risk, Trickster assessment and outcome.

In v0.1 `COMMIT` is paper-state mutation only. There is no broker-submit action.

## 9. First historical case
`BTC-2021-2022-TOP-MARKDOWN` is the first lab case. v0.1 stores the case structure and signal checkpoints; authoritative historical bars and source provenance are connected in the next data phase.

Target checkpoints:
- first major top
- automatic reaction / correction
- second top
- momentum/participation comparison
- support break
- failed recovery / markdown

The purpose is to test whether the combined M24 state is more useful than any single Elliott/Wyckoff/RSI/Fibonacci label.

## 10. Safety boundary
Hard v0.1 invariants:
- `SIMULATED_ONLY` always visible
- no broker credentials
- no order-submit endpoint
- no autonomous real-money action
- ownership does not imply trade attribution
- manipulation intent is never inferred without evidence
