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
- projection of measured historical Lab results

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
`m24-data.js` supplies deterministic mock data through provider contracts.

`m24-historical.js` adds a replaceable historical adapter. Its first fixture is a weekly BTC/USD OHLCV dataset for the 2021→2022 lab case. The fixture is explicitly tagged `PUBLIC_REPRODUCIBLE_FIXTURE` / `SECONDARY`; it is useful for deterministic development and regression tests but is not treated as an authoritative calibration source.

`m24-coinbase.js` implements a primary-exchange historical-bar adapter for Coinbase Exchange. It maps M24 assets to exchange product IDs, normalizes Coinbase candle arrays to M24 bar objects, sorts/deduplicates bars, records primary-source provenance and chunks long ranges below Coinbase's documented 300-candle request maximum. The adapter is deliberately separate from the deterministic fixture: automated regression tests never depend on an external network call.

`m24-lab.js` contains historical measurement logic such as Wilder RSI, top-to-top comparisons, volume comparison, support-break detection and post-signal outcome measurement.

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
`ASSET`, `MARKET_STATE`, `MACRO_FACTOR`, `REGIME`, `POSITIONING_STATE`, `FLOW_STATE`, `MEANING_STATE`, `TRICKSTER_ASSESSMENT`, `PRICE_STRUCTURE`, `PATTERN_INSTANCE`, `SIGNAL_INSTANCE`, `FIBONACCI_INSTANCE`, `HISTORICAL_CASE`, `LAB_RESULT`, `FORECAST_INSTANCE`, `ACTION_CANDIDATE`, `TRANSACTION_INSTANCE`, `OUTCOME_INSTANCE`, `SOURCE`, `USER_OBSERVATION`.

## 4. Evidence model
Trickster and actor attribution use explicit evidence states:

1. `MECHANISM_VISIBLE`
2. `PLAUSIBLE_INTERPRETATION`
3. `INTENT_UNKNOWN`
4. `MANIPULATION_PROVEN`

`INTENT_UNKNOWN` is the default whenever a trap/manipulation interpretation is suggested without hard attribution evidence.

A Lab hypothesis may also be rejected. A rejected indicator hypothesis is retained as a measured result rather than silently removed or rewritten.

## 5. Time model
Time window and resolution are separate.

Hierarchy:
`LIFE CYCLE → CYCLE → REGIME → EPISODE → EVENT → MICRO`

A drill-down creates/selects a child window. Changing resolution only changes sample density inside that selected window.

Historical Lab tests must record their actual resolution. A weekly fixture cannot be presented as a daily RSI result.

Coinbase Exchange currently supports candle granularities `60`, `300`, `900`, `3600`, `21600`, and `86400` seconds. The initial M24 primary-source path uses daily bars (`86400`) and splits longer periods into subrequests so each remains within the 300-candle limit.

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

Historical tests separate information available at a checkpoint from later outcome data. Post-event drawdown may score a prior candidate; it may not be fed back into the original signal as if it had been known at the time.

## 8. Transactions
Human status:
`KANDIDAAT → KLAAR → OPEN → DEELS → GESLOTEN`
with `GEANNULEERD` / `AFGEWEZEN` terminal alternatives.

Execution/audit status:
`PREPARE → PREVIEW → APPROVE → COMMIT → VERIFY`.

A transaction row is a projection of a `TRANSACTION_INSTANCE`; drill-down shows the linked rationale, forecast, signals, risk, Trickster assessment and outcome.

In v0.1 `COMMIT` is paper-state mutation only. There is no broker-submit action.

## 9. First historical case
`BTC-2021-2022-TOP-MARKDOWN` is the first lab case.

Current deterministic development fixture:
- weekly BTC/USD OHLCV
- 2021-01-04 through 2022-06-27
- source copied from public `alpharithms/data` dataset
- source quality: `SECONDARY`
- purpose: regression/development, not final calibration

Measured checkpoints currently include:
- first major top: week of 2021-04-12
- second top: week of 2021-11-08
- support reference: week of 2021-09-20
- first weekly close below that support after the second top: 2022-01-17
- post-second-top trough inside the fixture: week of 2022-06-13

The first measurement is intentionally hypothesis-testing rather than story-confirming. In this weekly fixture the second high is higher and weekly volume is materially lower, while RSI(14) does **not** show the assumed bearish divergence. That RSI hypothesis is therefore stored as rejected for this fixture/resolution instead of being promoted to fact.

Primary-source adapter status:
- Coinbase Exchange candle adapter implemented
- BTC maps to `BTC-USD`
- daily historical ranges are normalized and chunked
- source provenance is tagged `AUTHORITATIVE_EXCHANGE_API` / `PRIMARY_EXCHANGE`
- deterministic contract test uses injected fake fetch; CI does not depend on Coinbase availability
- next integration step is to make the BTC case checkpoint definitions resolution-independent, then compare the weekly fixture against Coinbase daily bars without changing Lab semantics

Coinbase notes that historical candle data can omit intervals where there are no ticks, so completeness remains a source property rather than an assumption.

After the primary-bar comparison, add derivatives, macro, cross-asset and timestamped narrative sources.

The purpose is to test whether the combined M24 state is more useful than any single Elliott/Wyckoff/RSI/Fibonacci label.

## 10. Automated validation
`m24-smoke-test.js` executes the domain/runtime historical path in Node and asserts that:
- historical bars are present
- provenance is present
- second-top price comparison is measured
- lower weekly volume is detected
- the weekly RSI divergence hypothesis is not falsely confirmed
- the defined support break is found
- the later markdown outcome is measurable

`m24-coinbase-test.js` contract-tests the primary exchange adapter without network access and asserts:
- ranges over 300 daily candles are chunked
- Coinbase candle order is normalized to ascending time
- `[time, low, high, open, close, volume]` is mapped correctly
- BTC resolves to `BTC-USD`
- primary-exchange provenance is attached
- unsupported granularities are rejected

GitHub Actions runs syntax, architecture, historical runtime, Coinbase adapter, safety and interaction gates on M24 changes.

## 11. Safety boundary
Hard v0.1 invariants:
- `SIMULATED_ONLY` always visible
- no broker credentials
- no order-submit endpoint
- no autonomous real-money action
- ownership does not imply trade attribution
- manipulation intent is never inferred without evidence
