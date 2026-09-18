# M99-B002 — Crypto Lifecycle & Market Mechanics

## Goal
Turn the existing BTC/ETH/SOL seed work into a systematic crypto fill layer without treating crypto as representative of all markets.

## Existing seed inventory

| Asset / case | Price provider | Meaning world | Core derivatives | Extended derivatives | Macro | No-lookahead/outcome | Current state |
|---|---|---|---|---|---|---|---|
| BTC 2019 top/markdown | Coinbase-capable | not yet case-complete | provider-capable | provider-capable | shared provider-capable | analyzer-capable | REGISTERED |
| BTC 2021–22 | Coinbase verified | complete / asset-scoped | complete | complete | complete | verified | SOURCE_COMPLETE / EXTENDED_DERIVATIVES |
| ETH 2021–22 | Coinbase verified | complete / asset-scoped | complete | source-limited at checkpoint archive dates | complete | verified | SOURCE_COMPLETE / CORE_DERIVATIVES |
| SOL 2021–22 | Coinbase-capable | seeded / asset-scoped sources present | provider-capable | provider-capable, actual checkpoint coverage unverified | shared provider-capable | analyzer-capable | REGISTERED |

## Provider capability baseline

### Price
Coinbase adapter maps:
- BTC → BTC-USD
- ETH → ETH-USD
- SOL → SOL-USD

### Funding / perpetual context
Binance Vision monthly funding archive maps:
- BTC → BTCUSDT
- ETH → ETHUSDT
- SOL → SOLUSDT

### Extended derivatives
Binance Vision daily metrics maps the same three assets and may provide:
- open interest;
- OI value;
- top-trader account long/short;
- top-trader position long/short;
- global long/short;
- taker long/short volume.

Historical archive availability is a per-date evidence question. Missing archives remain SOURCE_GAP.

### Macro
Shared source-first macro bundle currently includes:
- effective Fed funds;
- 10Y Treasury;
- broad USD;
- reverse repo;
- Fed total assets;
- NFCI financial conditions;
- WTI.

### Meaning world
Meaning-world records are asset/case scoped. BTC and ETH have verified source-complete top coverage; SOL already has case-scoped source seeds and must pass its own evidence gate.

## Work packages

| Task | Priority | Goal | Status | Acceptance |
|---|---|---|---|---|
| B002-T01 | P0 | Inventory existing BTC/ETH/SOL work | DONE | Existing cases/providers/evidence profiles mapped |
| B002-T02 | P0 | Crypto provider capability matrix | DONE | Price/funding/extended/macro/meaning capabilities explicit |
| B002-T03 | P0 | Source-complete SOL 2021 case | READY | Real-source chain + replay + coverage profile |
| B002-T04 | P0 | Source-complete BTC 2019 case | READY | Real-source chain + replay + coverage profile |
| B002-T05 | P0 | Add lifecycle cases beyond top/markdown | READY | Accumulation/expansion/capitulation/recovery represented |
| B002-T06 | P0 | Crypto gap & quality sweep | READY | Core gaps, extended limitations, source health documented |
| B002-T07 | P1 | Add crypto options layer | READY | IV/skew/OI/expiry sensors connected where historical source exists |
| B002-T08 | P1 | Add on-chain sensor profile | READY | On-chain signals treated as crypto-specific, not universal |

## Batch rule
Do not add more crypto assets merely to increase row count. First stabilize representative lifecycle coverage across BTC/ETH/SOL, then move to non-crypto batches so M99 can distinguish universal mechanisms from crypto-specific ones.

## B002 completion criteria
- BTC, ETH and SOL have at least one source-complete representative historical case;
- at least one earlier BTC cycle is source-complete;
- crypto-specific sensors are explicitly separated from universal sensors;
- source gaps/coverage profiles are recorded;
- lifecycle coverage includes more than only top→markdown;
- next non-crypto batch can reuse the same project method without crypto assumptions.
