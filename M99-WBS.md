# M99 — WBS / Work Package Catalogue v0.1

## WP-00 Project control
| WP | Priority | Deliverable | Acceptance |
|---|---|---|---|
| WP-0001 | P0 | PBS | Product tree exists and is versioned |
| WP-0002 | P0 | Batch queue | All current fill work is queue-addressable |
| WP-0003 | P0 | Fill matrix | Asset classes × sensor layers × source needs |
| WP-0004 | P0 | Status/checkpoint model | Batch completion is auditable |

## WP-01 Market universe
| WP | Priority | Scope |
|---|---|---|
| WP-0101 | P0 | Crypto universe + representative assets |
| WP-0102 | P0 | Equities / sectors / indices / ETFs |
| WP-0103 | P0 | Bonds / credit |
| WP-0104 | P0 | Commodities |
| WP-0105 | P0 | FX |
| WP-0106 | P0 | Housing / real estate |
| WP-0107 | P0 | Money/funding/collateral |
| WP-0108 | P0 | Derivative instrument families |
| WP-0109 | P1 | Volatility instruments |

## WP-02 Sensor profiles
Each asset class gets an applicability profile rather than forcing identical fields.

Core sensor families:
- price / volume;
- volatility;
- derivatives;
- credit / rates;
- liquidity / funding / collateral;
- positioning / flow;
- macro;
- cross-asset;
- meaning world;
- events;
- regime/bubble;
- outcome;
- provenance/source gaps.

## WP-03 Historical case seeding
Initial representative cases:
- BTC 2019;
- BTC 2021–22;
- ETH 2021–22;
- SOL 2021–22;
- Nasdaq 1999–2002;
- S&P 2007–09;
- March 2020 liquidity cascade;
- UK gilts 2022;
- Gold 2011;
- Oil 2008;
- Oil 2020;
- Housing US 2003–09;
- Housing NL representative cycle;
- EUR/USD representative rate-regime cycle.

## WP-04 Source registry
For each sensor family:
- preferred primary source;
- fallback source;
- access method;
- historical depth;
- resolution;
- licensing/access constraint;
- health status.

## WP-05 Fill pipelines
Provider-independent ingestion to Qubus records with:
- canonical IDs;
- timestamps;
- lineage;
- gap records;
- retry rules;
- deterministic historical snapshots.

## WP-06 Validation
No-lookahead checks, source consistency, cross-resolution tests, evidence promotion gates.

## WP-07 Batch operations
Queue selection, dependency check, execution, validation, checkpoint and next-ready calculation.
