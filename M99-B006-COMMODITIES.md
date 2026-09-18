# M99-B006 — Gold / Silver / Commodities

## Goal
Add physical-market mechanics to M99. Commodity prices are not modeled without inventory/supply/demand/curve/location context where relevant.

## Architecture additions
- PHYSICAL_BALANCE is first-class: production, consumption, inventory, imports/exports.
- SEASONALITY is explicit context, not a hidden adjustment.
- LOCATION / QUALITY / GRADE basis is explicit.
- FUTURES_CURVE / storage/carry is core for storable commodities.
- Spot benchmark and futures settlement are distinct observations.

## Representative cases
- OIL-2008 — demand/liquidity boom → crash.
- OIL-APR2020 — storage/expiry/negative WTI futures.
- GOLD-2011 — precious-metal peak / macro regime.
- SILVER-2011 — high-volatility precious-metal episode.
- ENERGY-2022 — geopolitical/supply shock.
- GOLD-2020 — real-rates/liquidity/safe-haven regime.

## Core sensors
- spot/futures price;
- futures curve / basis;
- volume/OI;
- CFTC positioning;
- inventories;
- production;
- consumption/product supplied;
- imports/exports;
- refinery/utilization where relevant;
- shipping/location constraints where relevant;
- USD / real-rate / credit context;
- ETF/physical flows where sourceable;
- options / volatility;
- benchmark/licensing provenance.

## Batch result
Independent B006 fill structure is DONE.
Licensed LBMA historical benchmark access remains a documented source constraint, not a blocker for the broader commodity domain.
