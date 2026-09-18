# M99 — Crypto Source Matrix v0.1

| Layer | Preferred source / provider | Authority | Historical role | Current state | Gap / rule |
|---|---|---|---|---|---|
| Spot price/volume | Coinbase Exchange | Primary venue | BTC/ETH/SOL daily bars + replay | IMPLEMENTED | Add secondary-venue comparison later |
| Perpetual funding | Binance Vision funding archives | Primary venue archive | Historical leverage/crowding | IMPLEMENTED | REST geo restriction does not alter archive evidence |
| OI / long-short / taker | Binance Vision daily metrics | Primary venue archive | Extended positioning | IMPLEMENTED / SOURCE-LIMITED | Missing archive day stays SOURCE_GAP |
| Recent derivatives | Binance Futures market-data API | Primary venue | Recent OI/positioning | IMPLEMENTED | Historical retention limits explicit |
| Crypto futures/options | CME Group crypto data | Regulated primary venue | Institutional futures/options/basis/OI | READY | Adapter not built in B002 |
| Crypto options | Deribit public API/data | Primary derivatives venue | IV/skew/options OI/term structure | READY | Historical-depth/licensing path to validate in B004 |
| Macro/USD/liquidity | FRED with upstream Fed/NY Fed/Chicago Fed/EIA | Official upstream | Cross-asset context | IMPLEMENTED | Series kept separate; no hidden macro score |
| Meaning world | Timestamped source fixtures / primary reporting | Primary/reputable media | Narrative around checkpoints | IMPLEMENTED for BTC/ETH; PARTIAL SOL | Asset/case scoped only |
| On-chain/network | Direct chain data + methodology-documented provider(s) | Primary chain / derived | Network state | GAP / B002 ARCH DECISION | Provider selection required; methodology must be stored |
| Stablecoin supply/flows | Issuer/chain data + documented aggregation | Primary/derived | Liquidity/settlement context | GAP | Must distinguish issuance from exchange flow |
| ETF flows | Fund/issuer/regulated-market source where applicable | Primary/official | Institutional spot flow | GAP | Relevant mainly after ETF launch dates |
| Liquidations | Venue-level derivatives feeds/archives where available | Primary venue | Forced-flow cascade context | PARTIAL GAP | Never infer market-wide liquidation from one venue |
| Cross-venue basis | Multiple spot/futures venues | Multi-primary | Fragmentation / stress | GAP | Preserve venue-specific observations |

## Verified external source facts
- Binance documents perpetual funding as periodic transfers between long/short holders intended to keep perpetual price anchored to spot/index.
- Binance derivatives historical OI/ratio REST endpoints can have limited recent history; M99 therefore keeps archive and recent-provider capabilities separate.
- CME publishes cryptocurrency futures/options datasets including Bitcoin, Ether and Solana products.
- Deribit exposes futures, perpetuals and options through public APIs.

## Source quality rules
1. Primary venue data describes that venue; never silently universalize it.
2. Derived on-chain metrics must store methodology/version.
3. Missing archive data is not zero.
4. Crypto derivatives coverage profile is attached to forecasts used in calibration.
5. Options and perpetuals are separate evidence families even when they share an underlying.
