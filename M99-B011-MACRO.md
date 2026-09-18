# M99-B011 — Macro / Real Economy

## Goal
Create a source-first macro world. M99 stores economic observations separately before interpretation; it does not collapse macro into one hidden bullish/bearish score.

## Architecture additions
- RELEASE_VINTAGE is explicit.
- OBSERVATION_PERIOD, RELEASE_TIME and REVISION_TIME are distinct.
- FORECAST/CONSENSUS and ACTUAL are separate records.
- Macro regime labels are derived states with evidence, not raw facts.

## Core families
- inflation;
- employment/labor;
- growth/GDP;
- industrial production;
- consumption/income;
- financial conditions;
- policy rates;
- yield curve;
- money/credit;
- central-bank balance sheets;
- housing;
- commodities/energy;
- trade/current account;
- FX/effective exchange rates.

## Preferred source stack
- Fed / New York Fed / FRED with upstream identity;
- BLS for labor/inflation;
- BEA for GDP/income/consumption;
- EIA for energy;
- ECB/Eurostat for euro area;
- BIS for cross-country credit/liquidity/property/FX;
- national official statistical agencies for local detail.

## Batch result
Macro domain/source architecture is DONE. Existing M24 FRED macro adapter is retained as a seed, not as the entire macro model.
