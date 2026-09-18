# M99 — Money / Funding / Collateral Source Matrix v0.1

| Layer | Source | Authority | State | Use |
|---|---|---|---|---|
| Fed balance sheet/reserve factors | Federal Reserve H.4.1 / FRED | PRIMARY_OFFICIAL | READY | reserves, assets, liabilities |
| Repo / reverse repo operations | New York Fed Markets Data | PRIMARY_OFFICIAL | READY | operation results/history |
| SOMA holdings | New York Fed | PRIMARY_OFFICIAL | READY | central-bank securities holdings |
| Policy implementation / rates | New York Fed / Fed | PRIMARY_OFFICIAL | READY | implementation framework |
| Global liquidity | BIS | PRIMARY_INTERNATIONAL_OFFICIAL | READY | cross-border/global liquidity |
| Debt service / credit | BIS | PRIMARY_INTERNATIONAL_OFFICIAL | READY | leverage burden |
| Private repo / secured funding detail | OFR/DTCC/venue sources where available | OFFICIAL/INDUSTRY | SOURCE_PATH | market plumbing enrichment |
| Derivatives margin/collateral | CCP/venue/regulatory sources | MIXED_PRIMARY | HANDOFF_B004/B005 | stress amplification |

## Integrity rules
- RRP usage is context, not a universal scalar "liquidity score."
- Central-bank assets and reserve balances are related but not identical.
- Repo operations are policy/market operations with eligible collateral definitions.
- Aggregate liquidity data do not identify individual actor intent.
