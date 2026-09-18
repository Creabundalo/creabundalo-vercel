# M99-B003 — Equities / Indices

## Goal
Create a reusable equity/index fill domain without treating price as the whole company or index.

## Architecture additions
- FUNDAMENTALS becomes a first-class equity sensor family.
- CORPORATE_ACTIONS / SECURITY_MASTER becomes first-class provenance.
- Index composition and rebalancing are time-varying state, not static metadata.
- Equity price, company fundamentals, index membership, options and flows are separate layers.

## Representative instruments
- S&P 500 / SPX — broad U.S. benchmark.
- Nasdaq-100 / NDX and Nasdaq Composite — growth/technology and market-breadth benchmark.
- AEX — Dutch benchmark for later European coverage.
- Representative company classes: mega-cap growth, banks/credit-sensitive, energy, cyclical/value, high-short-interest/squeeze.

## Representative historical cases
| Case | Theme | Status |
|---|---|---|
| NASDAQ-1999-2002 | bubble/euphoria → breakdown | REGISTERED |
| SPX-2007-2009 | credit crisis / deleveraging | REGISTERED |
| EQUITY-MAR2020 | liquidity cascade | REGISTERED |
| GROWTH-2021-2022 | rates/valuation compression | REGISTERED |
| GME-2021 | short squeeze / options / crowding | REGISTERED → B004 dependency |
| EQUITY-AI-ERA | valuation/capex/productivity regime | LATER / no pre-decided bubble label |

## Core equity sensors
- price / volume / breadth;
- realized and implied volatility;
- earnings / revenue / margins / cash flow / balance sheet;
- shares outstanding / float;
- valuation measures;
- short interest / securities lending where sourceable;
- ETF/index flows;
- options;
- rates/credit sensitivity;
- sector/index membership;
- corporate actions;
- meaning world / analyst expectations;
- outcome / provenance.

## Batch result
Independent B003 fill structure is DONE.
Execution of individual historical cases moves to B013 and options-specific evidence to B004.
