# M99-B010 — Positioning / Flows / Ownership

## Goal
Make participant positioning and capital flow visible without pretending public datasets reveal real-time intent of named institutions.

## Architecture additions
- POSITION_STATE and FLOW_STATE remain separate.
- OWNERSHIP_SNAPSHOT is publication-lagged and never treated as real-time flow.
- PARTICIPANT_CLASS is explicit: dealer, asset manager, leveraged fund, producer, retail proxy, institution, insider.
- REPORTING_LAG is a first-class evidence property.

## Core sensors
- CFTC futures/options positioning;
- SEC 13F institutional holdings;
- FINRA equity short interest;
- insider filings;
- ETF/fund flows where primary/issuer data exists;
- exchange/venue volume and market share;
- dealer/options positioning proxies with methodology;
- securities lending / borrow cost where licensed/sourceable;
- crypto exchange flows where provenance is reliable.

## Integrity rules
1. 13F holdings are delayed disclosures, not live trades.
2. CFTC COT is aggregate participant-class data; it does not reveal named-trader intent.
3. Short interest and short volume are distinct concepts.
4. Flow estimates from commercial vendors remain DERIVED unless issuer/venue sourced.
5. No claim such as "BlackRock is behind this move" is allowed without direct evidence.

## Batch result
Independent positioning/flow architecture and source map is DONE.
Several high-frequency/borrow/ETF-flow feeds remain source/licence-specific later enrichments.
