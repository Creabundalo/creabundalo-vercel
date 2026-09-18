# M99-B005 — Bonds / Credit

## Goal
Model fixed income and credit as price + yield + curve + spread + liquidity + issuer/collateral state, not as one "interest-rate" number.

## Architecture additions
- YIELD_CURVE / TERM_STRUCTURE is first-class.
- CREDIT_SPREAD is a relation between risky and reference curves.
- DURATION / CONVEXITY are instrument-state attributes.
- Issuer → issue → tranche/security identity is explicit.
- Transaction liquidity and quote/yield observations remain distinct.

## Core sensors
- sovereign yields by maturity;
- yield-curve slopes;
- policy rate / OIS proxies;
- corporate yields/spreads;
- investment-grade/high-yield state;
- TRACE trades/volumes where available;
- defaults/distress;
- CDS where sourceable;
- repo/funding/collateral;
- duration/convexity;
- futures/options positioning;
- financial conditions;
- meaning world / central-bank expectations.

## Representative cases
- CREDIT-2007-2009 — spread widening / deleveraging.
- UST-MAR2020 — Treasury market liquidity stress.
- RATES-2021-2022 — inflation/rate repricing.
- UK-GILTS-2022 — collateral/margin spiral.
- BANKS-2023 — duration/liquidity mismatch and deposit confidence.

## Batch result
Independent B005 domain/source/case fill is DONE.
Specific UK/European source adapters and CDS data access remain explicit later tasks.
