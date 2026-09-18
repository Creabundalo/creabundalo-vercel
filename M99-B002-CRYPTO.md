# M99-B002 — Crypto Lifecycle & Market Mechanics

## Goal
Turn the existing BTC/ETH/SOL seed work into a systematic crypto fill layer without treating crypto as representative of all markets.

## Existing seed inventory

| Asset / case | Price | Meaning world | Core derivatives | Extended derivatives | Macro | No-lookahead/outcome | State |
|---|---|---|---|---|---|---|---|
| BTC 2019 top/markdown | Coinbase-capable | incomplete | PRE-BINANCE-FUTURES GAP | needs older venue source | provider-capable | analyzer-capable | BLOCKED ON B004 |
| BTC 2021–22 | verified | complete / asset-scoped | complete | complete | complete | verified | SOURCE_COMPLETE / EXTENDED |
| ETH 2021–22 | verified | complete / asset-scoped | complete | source-limited | complete | verified | SOURCE_COMPLETE / CORE |
| SOL 2021–22 | verified | complete / asset-scoped | complete | source-limited | complete | verified | SOURCE_COMPLETE / CORE |

## Architecture additions from B002
- `ON_CHAIN_NETWORK` is now a first-class sensor family.
- Stablecoins are modeled both as assets and as liquidity/settlement sensors.
- Crypto options are a distinct evidence family from perpetual funding.
- Venue-specific observations remain venue-specific.
- Evidence coverage profile travels with replay/calibration samples.

## Work packages

| Task | Priority | Goal | Status | Result / blocker |
|---|---|---|---|---|
| B002-T01 | P0 | Inventory existing BTC/ETH/SOL work | DONE | Seed work mapped |
| B002-T02 | P0 | Crypto provider capability matrix | DONE | Spot/funding/OI/macro/meaning + future options/on-chain paths explicit |
| B002-T03 | P0 | Source-complete SOL 2021 case | DONE | Verified `CORE_DERIVATIVES` snapshot exists |
| B002-T04 | P0 | Source-complete BTC 2019 case | DONE | CFTC/CME FUTURES_POSITIONING profile verified by real-source E2E |
| B002-T05 | P0 | Add lifecycle cases beyond top/markdown | DONE | Crypto lifecycle/event registry seeded |
| B002-T06 | P0 | Crypto gap & quality sweep | DONE | Gaps classified and handed off |
| B002-T07 | P1 | Add crypto options layer | ACCEPTED_LIMITATION | Source paths defined in B004; deep historical options data may be licensed |
| B002-T08 | P1 | Add on-chain sensor profile | DONE | Sensor family added; provider selection remains later source work |

## Verified source chronology behind the BTC 2019 blocker
- Binance Futures went live in September 2019, so it cannot provide native Binance-futures evidence for the June/July 2019 BTC top.
- CME Bitcoin futures had already launched in December 2017, so an older regulated derivatives path exists but is not yet integrated into M99.

## Batch checkpoint
**Independent B002 work is complete.**

Batch status: **DONE**. The older BTC derivatives dependency was resolved in B004 using CFTC/CME futures positioning; options-history licensing remains a documented non-blocking limitation.

B002 no longer blocks the project. Crypto fill now has verified BTC 2019, BTC 2021, ETH 2021 and SOL 2021 representative cases with explicit coverage profiles.

## Acceptance achieved
- BTC/ETH/SOL representative crypto structure mapped;
- SOL promoted to a real source-complete case;
- crypto-specific vs universal sensors separated;
- on-chain/network and stablecoin liquidity made explicit;
- lifecycle case registry extends beyond top→markdown;
- source gaps/coverage profiles documented;
- options and older derivatives dependencies handed to B004 instead of fabricating data.
