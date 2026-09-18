# M99 — Identity, Time & Lineage v0.1

## Canonical IDs
Examples:
- `ASSET:BTC`
- `EQUITY:US:AAPL`
- `INDEX:US:SPX`
- `FX:EURUSD`
- `COMMODITY:XAU`
- `BOND:US:UST10Y`
- `HOUSING:NL:PRICE_INDEX`
- `DERIVATIVE:CME:ES:2026-12`
- `OPTION:OCC:AAPL:2026-12-18:C:250`

Aliases belong to the same canonical entity; aliases never create a second identity.

## Hierarchy
```
TYPE
  ↓
INSTANCE
  ↓
STATE_INSTANCE @ time
  ↓
ASSERTION / OBSERVATION
  ↓
SOURCE + LINEAGE
```

## Time fields
Keep separate where meaningful:
- `event_time` — when the market event occurred;
- `published_at` — when a source published it;
- `observed_at` — when M99 ingested/observed it;
- `as_of` — latest information allowed for a decision snapshot;
- `effective_at` — when a policy/rate/value became effective.

## Resolution
Resolution belongs to the observation, not to the asset:
`tick / 1m / 5m / 1h / 4h / D / W / M / event`.

Changing resolution must not silently change the historical window.

## Lineage
Every derived value stores:
- parent observation IDs;
- transform/version;
- parameters;
- created_at;
- code/build reference;
- evidence status.

## No-lookahead invariant
A DECISION_SNAPSHOT at T may reference only records whose admissible `as_of <= T`.
Outcome records are linked later and can score the decision but can never mutate its inputs.
