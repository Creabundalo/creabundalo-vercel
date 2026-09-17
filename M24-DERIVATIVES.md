# M24 Derivatives Layer v0.1

## Purpose
The derivatives layer adds positioning/leverage evidence to the same historical case without treating derivatives as a causal explanation by themselves.

Processing chain:

`CASE CHECKPOINT → FUNDING / OI / RATIOS → DERIVATIVES_CONTEXT → TRICKSTER COMPARISON → FORECAST EVIDENCE`

It remains read-only and `SIMULATED_ONLY`.

## Source model

### Historical funding
Primary adapter: Binance USD-M Futures public funding-rate history.

M24 normalizes:
- symbol
- funding time
- funding rate
- mark price when supplied
- `rateType` when supplied
- source provenance

The provider paginates long ranges and keeps the result as exchange-specific derivatives evidence.

### Recent open interest
Binance's open-interest history endpoint is a recent-history source, not a complete 2021 historical source. M24 therefore does **not** convert an unavailable historical response into `openInterest = 0`.

For an old case the provider emits/causes a `SOURCE_GAP` with:
- requested historical window
- documented retention class
- recommended archival source
- an example Binance Vision metrics archive URL

### Binance Vision historical metrics
Historical archive locator:

`data/futures/um/daily/metrics/{SYMBOL}/{SYMBOL}-metrics-YYYY-MM-DD.zip`

`m24-binance-vision.js` now implements deterministic archive ingestion:
1. request the ZIP and its `.CHECKSUM` sidecar
2. calculate SHA-256 over the downloaded ZIP
3. fail closed if the checksum differs
4. read the ZIP central directory
5. extract CSV entries (`stored` or `deflate` ZIP methods)
6. validate the expected metrics schema
7. normalize rows to typed M24 observations
8. preserve archive URL, checksum and retrieval provenance

Expected metrics include:
- `sum_open_interest`
- `sum_open_interest_value`
- `count_toptrader_long_short_ratio`
- `sum_toptrader_long_short_ratio`
- `count_long_short_ratio`
- `sum_taker_long_short_vol_ratio`

Missing archive days remain `SOURCE_GAP`; they are never converted to zero.

Funding archive locator remains available for independent validation:

`data/futures/um/monthly/fundingRate/{SYMBOL}/{SYMBOL}-fundingRate-YYYY-MM.zip`

## Qubus records

### `DERIVATIVES_CONTEXT`
Stores measured funding context around semantic case windows.

### `ARCHIVE_DERIVATIVES_CONTEXT`
Stores checksum-verified historical metrics at resolved case checkpoints, including:
- open interest
- open-interest value
- top-trader account long/short ratio
- top-trader position long/short ratio
- global long/short ratio
- taker long/short volume ratio
- first-top → second-top deltas
- source provenance and archive SHA-256

### `SOURCE_GAP`
A source gap is first-class data. Examples:
- recent OI API cannot cover the 2021 case
- a Binance Vision archive day is missing
- a downloaded archive contains no valid metrics rows

This prevents the learning layer from confusing missing data with a measured zero.

## Evidence semantics
Open interest by itself is **directionless**. A higher OI value means more open contracts, not automatically more longs or more shorts.

Directional positioning context requires an actual ratio or directional measurement, for example:
- global long/short ratio
- top-trader account/position ratio
- taker buy/sell volume ratio
- funding rate

This is enforced in the Historical Trickster tests.

## Trickster use
The derivatives layer may strengthen, weaken or confirm a Trickster hypothesis.

Examples:
- positive narrative + more-positive funding → possible long crowding context
- positive narrative + increasingly long-skewed archived global L/S ratio → crowding hypothesis
- positive narrative + stronger taker-buy ratio → mechanism may actually confirm part of the visible narrative
- higher OI alone → observation only, never a directional Trickster contrast

None of these proves a trap, manipulation or actor identity.

Evidence progression remains:

`mechanism visible → plausible interpretation → intent unknown → manipulation proven only with separate hard evidence`

## UI
Lab exposes lazy-loaded read-only actions:
- `Laad derivatencontext` — funding + recent-OI capability/gap
- `Laad 2021 OI/ratio archief` — checksum-verified Binance Vision checkpoint metrics

Neither action accesses an account or places an order.

## Automated tests
`m24-derivatives-test.js` checks funding, recent OI and archive routing.

`m24-derivatives-lab-test.js` checks Qubus binding and `SOURCE_GAP` semantics.

`m24-binance-vision-test.js` checks:
- deterministic ZIP parsing using a generated test archive
- metrics CSV schema mapping
- checksum sidecar verification
- fail-closed checksum mismatch behavior
- missing archive day → `SOURCE_GAP`

`m24-binance-vision-lab-test.js` checks:
- first/second checkpoint metrics comparison
- archive provenance retention
- archive gaps as separate Qubus payloads

`m24-trickster-lab-test.js` additionally enforces that:
- OI change is descriptive, not directional
- actual long/short skew may become a positioning contrast
- actual taker-buy skew may become a confirmation
- actor attribution and intent are never invented

## Next step
Run the archive path against the real 2021 BTCUSDT checkpoint dates, retain any missing days explicitly, and then use the source-complete historical state in the first calibrated multi-layer backtest. Broaden source coverage rather than silently interpolating archive gaps.
