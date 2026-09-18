# M99-B009 — Money / Funding / Collateral / Liquidity

## Goal
Make the monetary plumbing visible: reserves, repo, reverse repo, collateral, central-bank balance sheets and global funding.

## Architecture additions
- BALANCE_SHEET_STATE is first-class.
- COLLATERAL_NETWORK is explicit: asset eligibility, haircut/margin, financing channel.
- CENTRAL_BANK_OPERATION and MARKET_FUNDING are distinct.
- STOCK (balance sheet) and FLOW (operation/transaction) are never mixed.
- publication lag and transaction-data delay are explicit evidence properties.

## Core sensors
- reserve balances;
- central-bank assets/liabilities;
- repo/reverse repo;
- policy implementation rates;
- secured/unsecured funding stress;
- collateral type/eligibility;
- Treasury/MBS holdings;
- dealer/bank funding;
- money-market flows where sourceable;
- global dollar liquidity;
- cross-currency basis where sourceable;
- margin/haircut events;
- meaning/policy communications.

## Representative cases
- FUNDING-SEP2019 — U.S. repo stress.
- MARCH2020 — dash-for-cash / collateral/liquidity cascade.
- QE-QT-CYCLES — balance-sheet/liquidity regime shifts.
- UK-GILTS-2022 — collateral/margin amplification.
- USD-FUNDING-STRESS episodes — cross-border dollar liquidity.

## Batch result
Independent monetary-plumbing domain/source fill is DONE.
Detailed dealer-level/private funding data remain source-limited and must never be inferred from aggregate central-bank series.
