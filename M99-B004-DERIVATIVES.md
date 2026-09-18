# M99-B004 — Futures / Options / Derivatives

## Goal
Create one derivatives world that supports equities, indices, rates, commodities, FX and crypto while preserving contract-specific mechanics.

## Result
**DONE for FASE A — FILL.**

The original blocker is resolved: M99 no longer equates derivatives evidence with perpetual funding.

Supported historical evidence profiles now include:
- `EXTENDED_DERIVATIVES` — funding + archived positioning where source-complete;
- `CORE_DERIVATIVES` — funding complete, optional positioning source-limited;
- `FUTURES_POSITIONING` — regulated futures positioning where perpetual funding did not exist.

## BTC 2019 resolution
BTC's June/July 2019 case predates Binance Futures. M99 now uses CFTC Traders in Financial Futures data for CME Bitcoin (market code 133741) instead.

Verified real-source result:
- first top: 2019-06-26;
- second top: 2019-07-10;
- CFTC report admitted at first top: report date 2019-06-18, publication availability 2019-06-21;
- CFTC report admitted at second top: report date 2019-07-02, publication availability 2019-07-05;
- open interest: 5,391 → 5,839 (+8.31%);
- evidence profile: `FUTURES_POSITIONING`;
- source completeness: TRUE;
- historical action candidate: `WAIT`.

Important: source completeness does not force a directional forecast. BTC 2019 is retained as a valid source-complete case but contributes no directional calibration sample because its candidate was WAIT.

## Taxonomy
- futures;
- options;
- options on futures;
- perpetuals;
- forwards;
- swaps;
- CDS / credit derivatives;
- structured exposure (later).

## Architecture additions
- CONTRACT_LIFECYCLE is first-class state.
- VOLATILITY_SURFACE is separate from spot volatility.
- TERM_STRUCTURE / CURVE is first-class.
- A derivative observation always references underlying + venue + contract.
- Greeks/derived dealer exposure must store methodology.
- DERIVATIVES_CONTEXT is evidence-family aware rather than funding-specific.

## Source/access limitations
Long-history listed-options quote/trade/Greeks datasets can require commercial/licensed access. This is an accepted `SOURCE_LIMITATION`, not a reason to fabricate values and not a blocker for the FILL architecture.

## Acceptance
- derivatives no longer imply perpetual funding;
- pre-perpetual BTC history has a primary-regulator futures-positioning path;
- no-lookahead publication timing is enforced;
- evidence profile travels into calibration;
- non-directional source-complete cases do not create forecast samples;
- options-history licensing limitations remain explicit.
