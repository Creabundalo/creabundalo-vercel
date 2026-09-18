# M99-B004 — Futures / Options / Derivatives

## Goal
Create one derivatives world that supports equities, indices, rates, commodities, FX and crypto while preserving contract-specific mechanics.

## Taxonomy
- futures;
- options;
- options on futures;
- perpetuals;
- forwards;
- swaps;
- CDS / credit derivatives;
- structured exposure (later).

## Core derivative sensors
- contract identity / underlying;
- expiry / tenor;
- strike / option type;
- price / volume / open interest;
- implied volatility;
- volatility term structure / surface;
- delta / gamma / vega / theta where source/method exists;
- skew / put-call structure;
- futures curve / basis / carry;
- funding;
- margin/collateral;
- liquidations;
- dealer/participant positioning proxies;
- settlement type and contract specification;
- expiry / roll / corporate-action adjustments.

## Architecture additions
- CONTRACT_LIFECYCLE is first-class state.
- VOLATILITY_SURFACE is separate from spot volatility.
- TERM_STRUCTURE / CURVE is first-class.
- A derivative observation always references an underlying + venue + contract.
- Greeks/derived dealer exposure must store methodology; they are not raw exchange facts.

## Representative cases
- BTC-2019 CME futures context — needed to unblock B002.
- VOLMAGEDDON-2018 — short-volatility / VIX ecosystem.
- GME-2021 — short interest + options gamma/crowding.
- MARCH-2020 — options/futures volatility and hedging.
- OIL-APR2020 — futures curve/storage/expiry mechanics.
- UK-GILTS-2022 — rates derivatives / margin/collateral amplification.

## Batch checkpoint
Schema/source mapping is DONE.
Two execution dependencies remain:
- detailed BTC-2019 CME historical contract data adapter;
- broad historical listed-options data access, which may require licensed datasets.

These blockers do not stop B005/B006/B007...
