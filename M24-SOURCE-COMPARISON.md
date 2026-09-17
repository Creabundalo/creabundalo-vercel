# M24 Source / Resolution Comparison v0.1

## Purpose
The historical case definition must describe market meaning and structure, not the sampling frequency of one dataset.

M24 therefore separates:

`CASE SEMANTICS → CHECKPOINT WINDOWS → SOURCE/RESOLUTION → MEASUREMENT → COMPARISON`

## BTC case semantics
`BTC-2021-2022-TOP-MARKDOWN` now uses semantic windows:

- `FIRST_TOP`: maximum high in 2021-04-01 → 2021-05-09
- `AUTOMATIC_REACTION`: minimum low in 2021-05-10 → 2021-07-25
- `SUPPORT_REFERENCE`: minimum low in 2021-09-01 → 2021-09-30
- `SECOND_TOP`: maximum high in 2021-10-01 → 2021-11-30
- `MARKDOWN_OUTCOME`: minimum low in 2021-12-01 → 2022-06-30

Support break is then defined as the first close below the resolved support-reference low after the resolved second top.

The same rule is applied to weekly, daily and future intraday datasets. No source-specific date is hard-coded into the analysis engine.

## Measurements per source/resolution
Each Lab result records:

- actual resolved checkpoint dates
- actual resolution
- first/second-top high, close, volume and RSI(14)
- price-high change
- volume change
- RSI-divergence verdict
- support reference and first close below it
- markdown trough and drawdown
- source provenance and quality

A signal may disagree across resolutions. That disagreement is stored; it is not averaged away or silently resolved.

## Comparison record
`M24Lab.compareSourceResults()` produces a `SOURCE_COMPARISON` candidate containing:

- checkpoint date deltas in days
- metric deltas
- agreement/disagreement for second-top structure, volume divergence, RSI divergence and support break
- both provenance chains

In the browser Lab, the primary-source comparison stores:

- `LAB_RESULT_PRIMARY`
- `SOURCE_COMPARISON`

as separate Qubus records.

## Sources
### Regression baseline
Weekly BTC/USD fixture, tagged:

- `PUBLIC_REPRODUCIBLE_FIXTURE`
- `SECONDARY`

Its purpose is deterministic regression testing.

### Primary exchange path
Coinbase Exchange candle adapter, tagged:

- `AUTHORITATIVE_EXCHANGE_API`
- `PRIMARY_EXCHANGE`

The browser only requests this source after an explicit `Vergelijk Coinbase dagdata` action. It is read-only historical analysis and has no broker/order capability.

## Validation
Automated gates include:

1. historical weekly regression test
2. cross-resolution Lab contract test
3. Coinbase adapter contract test
4. syntax / architecture / safety / interaction gates

The cross-resolution contract generates a finer daily representation from the fixed regression history and verifies that semantic checkpoint windows continue to resolve the same market structure without relying on fixed weekly dates.

## Next
Capture and retain an actual primary-exchange daily comparison result, then enrich the same checkpoint windows with:

`DERIVATIVES → MACRO/CROSS-ASSET → NARRATIVE/TIMING → TRICKSTER → FORECAST/OUTCOME`

Live execution remains outside v0.1.
