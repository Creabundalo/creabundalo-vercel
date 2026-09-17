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

### Open interest
Binance's open-interest history endpoint is a recent-history source, not a complete 2021 historical source. M24 therefore does **not** convert an unavailable historical response into `openInterest = 0`.

For an old case the provider emits/causes a `SOURCE_GAP` with:
- requested historical window
- documented retention class
- recommended archival source
- an example Binance Vision metrics archive URL

### Binance Vision archive
Historical derivatives archive locator:

`data/futures/um/daily/metrics/{SYMBOL}/{SYMBOL}-metrics-YYYY-MM-DD.zip`

This archive can supply historical metrics such as open interest and ratios where files are present. Missing archive days must remain explicit source gaps.

Funding archive locator:

`data/futures/um/monthly/fundingRate/{SYMBOL}/{SYMBOL}-fundingRate-YYYY-MM.zip`

Archive ingestion/parsing is a separate adapter step so browser UI and regression CI do not silently depend on ZIP transport.

## Qubus records

### `DERIVATIVES_CONTEXT`
Stores measured funding context around semantic case windows.

For the BTC 2021 case the same case schema supplies:
- first-top window
- second-top window

The funding analysis stores per window:
- sample count
- average funding rate
- share of positive funding observations
- min/max rate

It then stores a comparison such as:
- `MORE_POSITIVE_AT_SECOND_TOP`
- `LESS_POSITIVE_AT_SECOND_TOP`
- `UNCHANGED`
- `INSUFFICIENT_DATA`

These are positioning/crowding observations, not actor attribution.

### `SOURCE_GAP`
A source gap is first-class data. Example:

`OPEN_INTEREST / 2021 requested / recent-history API cannot cover / use Binance Vision metrics archive`

This prevents the learning layer from confusing missing data with a measured zero.

## Trickster use
The derivatives layer may strengthen or weaken a Trickster hypothesis.

Example:

`visible bullish narrative + higher price top + increasingly positive funding`

may indicate increasing long crowding, but it does not prove a trap or manipulation.

The evidence progression remains:

`mechanism visible → plausible interpretation → intent unknown → manipulation proven only with separate hard evidence`

## UI
Lab exposes a lazy-loaded `Laad derivatencontext` action. It:
- fetches read-only historical funding
- evaluates funding in the case checkpoint windows
- records `DERIVATIVES_CONTEXT`
- records historical OI limitations as `SOURCE_GAP`
- never accesses an account or places an order

## Automated tests
`m24-derivatives-test.js` checks:
- BTC → BTCUSDT mapping
- historical funding pagination
- normalization/provenance
- preservation of funding `rateType`
- recent open-interest normalization
- rejection of old OI history as a source-window error
- Binance Vision archive URL construction
- semantic funding comparison around first/second top

`m24-derivatives-lab-test.js` checks:
- derivatives context binding to the BTC case
- source gap is a first-class Qubus payload
- source gap is not interpreted as zero
- funding provenance survives into the Lab payload

## Next step
Implement a deterministic Binance Vision ZIP/CSV archive importer for historical BTCUSDT metrics, then attach actual 2021 open-interest/ratio observations to the same checkpoint windows. After that, add macro/cross-asset and timestamped meaning-world evidence.
