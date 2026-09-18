# M99-B008 — Housing / Real Estate

## Goal
Treat housing as a leveraged slow-moving market with price, transaction volume, financing, affordability, supply and credit quality.

## Architecture additions
- SLOW_MARKET / PUBLICATION_LAG is explicit.
- LOCATION hierarchy is first-class: country → region → municipality / metro.
- TRANSACTION_PRICE, PRICE_INDEX and APPRAISAL/WOZ-like values are distinct.
- AFFORDABILITY and DEBT_SERVICE are derived layers with methodology.
- MORTGAGE_FUNDING / MBS / covered-bond context links housing to credit markets.

## Core sensors
- house price indices;
- transaction counts / liquidity;
- rents;
- mortgage rates;
- lending standards;
- LTV / debt-service;
- household debt;
- permits / starts / completions;
- housing stock / inventory / time-on-market where sourceable;
- affordability;
- arrears/defaults;
- MBS/covered-bond funding;
- commercial vacancy/cap rates;
- policy/tax/regulatory events;
- meaning world.

## Representative cases
- NL-HOUSING-1995-2008 — expansion/credit cycle.
- NL-HOUSING-2008-2013 — correction/deleveraging.
- NL-HOUSING-2015-2022 — low-rate expansion.
- NL-HOUSING-2022-2023 — rate shock / temporary price correction.
- US-HOUSING-2003-2009 — credit/bubble/securitization cycle.
- CRE-2020S — commercial-real-estate financing stress.

## Batch result
Independent housing/real-estate fill structure is DONE.
Exact municipal/property-level enrichment is later; broad Netherlands and cross-country official series are already sourceable.
