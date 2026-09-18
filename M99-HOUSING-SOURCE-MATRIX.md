# M99 — Housing / Real Estate Source Matrix v0.1

| Layer | Source | Authority | State | Use |
|---|---|---|---|---|
| NL existing-home price index | CBS + Kadaster | PRIMARY_OFFICIAL | READY | monthly/quarterly price and transaction counts |
| NL regional price index | CBS + Kadaster | PRIMARY_OFFICIAL | READY | regional segmentation |
| NL transaction register | Kadaster/CBS | PRIMARY_OFFICIAL | READY/PARTIAL | notarized transactions; microdata access differs |
| NL mortgage/financial context | DNB/ECB/CBS | PRIMARY_OFFICIAL | SOURCE_PATH | rates, credit, debt/standards |
| Cross-country residential prices | BIS residential property prices | PRIMARY_INTERNATIONAL_OFFICIAL | READY | comparable nominal/real series |
| Cross-country commercial property | BIS commercial property prices | PRIMARY_INTERNATIONAL_OFFICIAL | READY | CRE context |
| Mortgage/credit market | national central banks / BIS / covered-bond/MBS sources | PRIMARY/INDUSTRY | SOURCE_PATH | funding channel |

## Integrity rules
- Average sale price is not the same as a house-price index.
- Transaction data are low frequency and publication-lagged; never forward-fill as newly observed facts.
- Regional composition effects must not be mistaken for national price movement.
- Historical analysis preserves the release available at T when revisions exist.
