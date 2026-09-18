# M99 — Equity / Index Source Matrix v0.1

| Layer | Preferred source | Authority | State | Rule / gap |
|---|---|---|---|---|
| Company filings/fundamentals | SEC EDGAR data.sec.gov XBRL APIs | PRIMARY_OFFICIAL | READY | Filing facts keep taxonomy/context/as-of |
| Filing history/events | SEC submissions API / EDGAR | PRIMARY_OFFICIAL | READY | 10-K/10-Q/8-K timestamps preserved |
| Nasdaq breadth/index/volume | Nasdaq Trader Daily Market Files | PRIMARY_VENUE | READY | Useful for breadth/volume/index state; not individual full-history substitute |
| Nasdaq direct trades/order book | Nasdaq historical/direct market data | PRIMARY_VENUE | SOURCE_PATH | Entitlement/licensing may apply |
| NYSE trades/order book | NYSE TAQ historical products | PRIMARY_VENUE | SOURCE_PATH | Historical depth/book data is licensed |
| Options | Cboe/OCC family | PRIMARY_VENUE/CLEARING | HANDOFF_B004 | Keep options separate from cash equity |
| Index methodology/constituents | Index administrator / exchange | PRIMARY_INDEX_ADMIN | READY | Membership is time-varying |
| Meaning world | filings, earnings calls, timestamped primary/reputable reporting | MIXED_PRIMARY | READY | Analyst narrative ≠ measured fundamentals |

## Integrity rules
1. Corporate actions must adjust comparable price/share histories explicitly.
2. Survivorship bias is prohibited in historical index/equity cohorts.
3. Index membership must be evaluated as-of T.
4. SEC facts use filing/publication time, not later restatements, in no-lookahead snapshots.
5. Licensed exchange data limitations remain SOURCE_GAP/access metadata, never silently replaced.
