# M99 — Fill Matrix v0.2

Legend: **C** = core, **E** = extended/when available, **—** = usually not applicable.

| Market | Price/Vol | Volatility | Futures | Options | Funding/Perps | On-chain/Network | Credit/Rates | Liquidity | Positioning/Flow | Macro | Meaning | Bubble/Regime | Outcome |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Crypto | C | C | C | E | C | C | E | C | C | C | C | C | C |
| Equities | C | C | E | C | — | — | C | C | C | C | C | C | C |
| Indices/ETFs | C | C | C | C | — | — | C | C | C | C | C | C | C |
| Bonds/Credit | C | C | C | C | — | — | C | C | C | C | C | C | C |
| Gold/Silver | C | C | C | C | — | — | C | C | C | C | C | C | C |
| Oil/Gas | C | C | C | C | — | — | C | C | C | C | C | C | C |
| FX | C | C | C | C | E | — | C | C | C | C | C | C | C |
| Housing | C | C | E | E | — | — | C | C | C | C | C | C | C |
| Commercial RE | C | C | E | E | — | — | C | C | C | C | C | C | C |
| Money/Funding | C | C | C | E | E | — | C | C | C | C | C | C | C |

## Crypto-specific on-chain/network sensor profile
Fill only where methodology is explicit and comparable:
- transaction / settlement activity;
- fees;
- supply state;
- staking / validator state where applicable;
- exchange inflow/outflow where provenance is reliable;
- stablecoin supply and settlement flows;
- bridge / DeFi collateral state where relevant;
- realized-cap style metrics only with methodology/version stored.

On-chain metrics are chain-specific; they are not assumed interchangeable across BTC, ETH and SOL.

## Derivatives sensor profile
Where applicable fill:
- contract identity / underlying;
- expiry / tenor;
- strike;
- open interest;
- traded volume;
- implied volatility;
- realized volatility context;
- put/call;
- skew;
- delta/gamma;
- dealer hedging proxies;
- funding;
- liquidations;
- margin/collateral;
- futures curve / basis;
- long-short / taker positioning;
- source availability/gaps.

## Housing / real-estate sensor profile
Fill:
- sale prices and indices;
- rents;
- transaction volumes;
- mortgage rates;
- lending standards;
- LTV / debt-service measures;
- building permits / starts / completions;
- inventory / time-on-market;
- affordability;
- household debt;
- mortgage arrears/defaults where available;
- MBS / covered-bond / mortgage-funding context;
- commercial vacancy/cap rates where applicable;
- policy/tax/regulatory events.

## Bubble/regime is a state layer, not a separate asset
Candidate states:
`ACCUMULATION → EXPANSION → EUPHORIA → BUBBLE_CANDIDATE → DISTRIBUTION → BREAKDOWN → CAPITULATION → RECOVERY`

A state must retain the measurable evidence that produced it.
