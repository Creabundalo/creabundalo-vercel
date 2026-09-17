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
- [x] LAB switches BTC to deterministic historical weekly fixture
- [x] Measured historical test result is projected in LAB
- [x] LAB exposes explicit read-only Coinbase daily comparison action
- [x] Source/resolution comparison is projected separately from baseline result
- [x] LAB lazy-loads a read-only derivatives-context action
- [x] Historical OI source gaps are shown as missing-source state, never as zero
- [x] LAB lazy-loads read-only macro/cross-asset context
- [x] Macro series remain separate instead of being collapsed into a hidden direction score

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
- [x] HistoricalProvider adapter exists
- [x] CoinbaseHistoricalProvider primary-exchange adapter exists
- [x] BinanceDerivativesProvider exists
- [x] FredCsvProvider source-first macro adapter exists
- [x] Historical funding pagination/normalization exists
- [x] Recent open-interest normalization exists
- [x] Historical OI source-window limitation is explicit
- [x] Binance Vision metrics/funding archive locators exist
- [x] Macro source registry retains original upstream source provenance
- [x] EFFR / 10Y / broad dollar / RRP / Fed assets / NFCI / WTI are separate series
- [x] Macro observations resolve around semantic BTC checkpoints
- [x] Missing/stale macro observations become SOURCE_GAP
- [x] Resolution-independent case schema exists
- [x] Checkpoints resolve through semantic windows/selectors rather than fixed source dates
- [x] Primary-source Lab runner exists
- [x] Derivatives Lab binder exists
- [x] Macro Lab binder exists
- [x] Source/resolution comparison engine exists
- [x] M24Lab RSI/top/volume/support/outcome analysis exists
- [x] Provider-independent Runtime exists
- [x] Technical design documented
- [x] Source/resolution comparison design documented
- [x] Derivatives evidence design documented
- [x] Macro/cross-asset evidence design documented
- [x] BTC 2021→2022 historical case definition exists
- [x] LAB_RESULT is stored as a Qubus record
- [x] Primary Lab and SOURCE_COMPARISON can be stored as separate Qubus records
- [x] DERIVATIVES_CONTEXT and SOURCE_GAP can be stored as separate Qubus records
- [x] MACRO_CROSS_ASSET_CONTEXT and SOURCE_GAP can be stored as separate Qubus records

## Evidence / semantics
- [x] Narrative and measured mechanism are separate records
- [x] MECHANISM_VISIBLE / PLAUSIBLE_INTERPRETATION / INTENT_UNKNOWN / MANIPULATION_PROVEN vocabulary exists
- [x] Intent defaults to unknown for suspected trap/manipulation patterns
- [x] Ownership never implies actor attribution
- [x] A rejected historical indicator hypothesis is retained instead of rewritten
- [x] Weekly RSI is not mislabeled as daily RSI
- [x] Primary exchange bars and secondary regression fixture remain distinct provenance classes
- [x] Cross-source/resolution disagreement is retained as data rather than averaged away
- [x] Missing derivatives history is retained as SOURCE_GAP rather than numeric zero
- [x] Funding crowding context is not treated as proof of manipulation or actor intent
- [x] Macro/cross-asset changes are descriptive context, not automatic trade direction

## Learning
- [x] Forecasts are first-class Qubus instances
- [x] Outcome record contract exists
- [x] Calibration pipeline documented
- [x] Learned changes cannot silently alter real-money execution
- [x] Historical outcome measurement is separated from the earlier checkpoint hypothesis
- [x] Missing-source records can be excluded from numeric calibration instead of treated as zero

## Safety
- [x] SIMULATED_ONLY permanently visible in v0.1
- [x] No broker credentials
- [x] No live BrokerProvider implementation
- [x] No order-submit action
- [x] Coinbase historical comparison is read-only
- [x] Derivatives context is read-only market data
- [x] Macro/cross-asset context is read-only historical data
- [x] COMMIT means paper-state mutation only

## Automated gates
- [x] Required-file gate defined
- [x] JavaScript syntax checks cover renderer/core/providers/lab
- [x] Architecture contract checks defined
- [x] Historical runtime smoke test defined
- [x] Cross-resolution Lab contract test defined
- [x] Coinbase adapter deterministic contract test defined
- [x] Derivatives adapter deterministic contract test defined
- [x] Derivatives Lab/Qubus contract test defined
- [x] Macro provider deterministic contract test defined
- [x] Macro Lab/Qubus contract test defined
- [x] Safety contract checks defined
- [x] Interaction contract checks defined
- [x] M24 Release Gate green after derivatives Lab/UI integration (run 53)
- [x] ACTIO Release Gate remains green on derivatives checkpoint (run 60)
- [x] M24 Release Gate green after macro/cross-asset integration (run 63)
- [x] ACTIO Release Gate remains green on macro/cross-asset checkpoint (run 70)
- [ ] Visual browser/Vercel preview review completed

## Historical BTC case status
- [x] Deterministic weekly OHLCV fixture attached for 2021-01 through 2022-06
- [x] Second high measured above first high
- [x] Lower weekly volume at second top measured
- [x] RSI(14) bearish-divergence hypothesis rejected for this weekly fixture
- [x] First weekly support break after second top measured
- [x] Subsequent markdown outcome measured
- [x] Primary-exchange historical market-data adapter implemented (Coinbase Exchange)
- [x] Case checkpoint definitions are resolution-independent
- [x] Source-comparison engine implemented for weekly baseline versus daily primary result
- [x] Interactive primary-source comparison path implemented
- [x] Historical funding adapter implemented (Binance USD-M)
- [x] Funding is compared across semantic first-top / second-top windows
- [x] Historical OI recent-API limitation becomes SOURCE_GAP
- [x] Binance Vision metrics archive is designated for 2021 OI/ratio backfill
- [x] Macro/cross-asset provider implemented for EFFR, DGS10, dollar, RRP, Fed assets, NFCI and WTI
- [x] Macro/cross-asset context is compared around resolved first/second top dates
- [ ] Capture an actual Coinbase daily comparison result in a source-complete Lab run
- [ ] Implement Binance Vision ZIP/CSV metrics archive importer
- [ ] Attach 2021 open-interest / long-short / taker-ratio archive data
- [ ] Add timestamped narrative/source history

Release rule: M24 cannot progress from paper to real execution until historical validation, paper trading and an explicit live-execution approval gate exist.
