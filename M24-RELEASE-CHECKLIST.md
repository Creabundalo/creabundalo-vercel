# M24 v0.1 release checklist

## Product / UX
- [x] Asset overview screen exists
- [x] LIFE CYCLE → CYCLE → REGIME → EPISODE navigation exists
- [x] Resolution is controlled separately from selected time window
- [x] STORY / ANALYSIS / LAB modes exist
- [x] LEGACY / M24 / AI-NATIVE lenses exist
- [x] Cross-asset strip exists
- [x] Meaning-world versus mechanism view exists
- [x] Trickster assessment is visible
- [x] Fibonacci / momentum / pattern overlays exist
- [x] Forecast horizons NOW / 3D / 2W / 1M / 2M exist
- [x] User observations can be stored locally

## Transactions
- [x] Compact transaction rows exist
- [x] Row drill-down shows rationale, risk, target, forecast and Trickster context
- [x] Human status model exists: KANDIDAAT / KLAAR / OPEN / DEELS / GESLOTEN / GEANNULEERD / AFGEWEZEN
- [x] Audit lifecycle exists: PREPARE → PREVIEW → APPROVE → COMMIT → VERIFY
- [x] v0.1 transaction mode is PAPER only

## Architecture
- [x] Renderer separated from domain core
- [x] QubusStore exists
- [x] TricksterEngine exists
- [x] ForecastEngine exists
- [x] TransactionEngine exists
- [x] MarketDataProvider contract exists
- [x] MockProvider adapter exists
- [x] Provider-independent Runtime exists
- [x] Technical design documented
- [x] BTC 2021→2022 historical case definition exists

## Evidence / semantics
- [x] Narrative and measured mechanism are separate records
- [x] MECHANISM_VISIBLE / PLAUSIBLE_INTERPRETATION / INTENT_UNKNOWN / MANIPULATION_PROVEN vocabulary exists
- [x] Intent defaults to unknown for suspected trap/manipulation patterns
- [x] Ownership never implies actor attribution

## Learning
- [x] Forecasts are first-class Qubus instances
- [x] Outcome record contract exists
- [x] Calibration pipeline documented
- [x] Learned changes cannot silently alter real-money execution

## Safety
- [x] SIMULATED_ONLY permanently visible in v0.1
- [x] No broker credentials
- [x] No live BrokerProvider implementation
- [x] No order-submit action
- [x] COMMIT means paper-state mutation only

## Automated gates
- [x] Required-file gate defined
- [x] JavaScript syntax checks cover renderer/core/provider
- [x] Architecture contract checks defined
- [x] Safety contract checks defined
- [x] Interaction contract checks defined
- [ ] Latest GitHub Actions M24 Release Gate green after modular-runtime commit
- [ ] Visual browser/Vercel preview review completed

Release rule: M24 cannot progress from paper to real execution until historical validation, paper trading and an explicit live-execution approval gate exist.
