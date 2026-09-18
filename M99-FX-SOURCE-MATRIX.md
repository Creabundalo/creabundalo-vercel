# M99 — FX Source Matrix v0.1

| Layer | Source | Authority | State | Use |
|---|---|---|---|---|
| EUR reference/bilateral rates | ECB Data Portal EXR | PRIMARY_CENTRAL_BANK | READY | daily reference rates / effective rates |
| Global bilateral/effective rates | BIS Data Portal / SDMX | PRIMARY_INTERNATIONAL_OFFICIAL | READY | long cross-country comparable series |
| U.S. dollar / policy context | Fed/FRED | PRIMARY_OFFICIAL | READY | USD, rates, liquidity |
| Futures/options | CME | PRIMARY_VENUE | HANDOFF_B004 | FX futures/OI/options |
| Positioning | CFTC TFF | PRIMARY_REGULATOR | READY | dealer/asset-manager/leveraged-money |
| Meaning/events | central-bank releases + timestamped reporting | PRIMARY/REPUTABLE | READY | policy/regime narratives |

## Integrity rules
- ECB reference rates are informational reference rates, not necessarily executable transaction prices.
- Pair direction and unit conventions are canonicalized before comparison.
- Effective exchange rates are baskets, not substitutes for bilateral pairs.
- Carry signals require rate/tenor/as-of metadata.
