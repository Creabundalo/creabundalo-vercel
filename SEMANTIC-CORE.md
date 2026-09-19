# Creabundalo Semantic Core v0.5

## Doel
Eén betekenislogica voor alle oppervlakken.

De UI, browserextension, corporate connectors en toekomstige ACTIO-clients mogen de graph niet ieder op hun eigen manier muteren. Ze leveren canonieke events aan dezelfde reducer.

## Contract

```
SURFACE / ADAPTER
      ↓
semantic event
      ↓
SEMANTIC CORE
      ↓
graph state
      ↓
VAULT
      ↓
projection / lens / action
```

### Surface
Voorbeelden:
- Creabundalo Branch UI
- Semantic Overlay
- corporate connector
- future native client
- ACTIO agent

### Core
`semantic-core.js` bevat:
- event creation;
- event validation;
- reducer/apply;
- idempotency;
- graph cycle protection;
- canonical text normalization;
- append-only semantic audit;
- graph navigation helpers.

## Canonieke events v1
- `NODE_CREATED`
- `NODE_FOCUSED`
- `NODE_KIND_SET`
- `NODE_STATUS_SET`
- `NODE_REPARENTED`
- `NODE_EDGE_LABEL_SET`
- `LENS_SET`
- `NODE_PARKED`

## State
Bestaande state blijft compatibel. De Core voegt toe:

```json
{
  "semantic": {
    "version": 1,
    "events": [],
    "appliedEventIds": []
  }
}
```

De eventlijst is in v0.5 begrensd op de laatste 5.000 events in de actieve state en de deduplicatielijst op 10.000 IDs. Voor een productie-auditlog volgt later een aparte append-only store.

## Eigen UI
De volgende UI-acties muteren niet langer rechtstreeks:
- node focussen;
- nieuwe vraag/branch;
- projectpromotie;
- parkeren;
- lens wisselen.

Ze dispatchen Semantic Core-events.

## Overlay
Extension-events worden eerst vertaald naar Core-events. De browseroverlay en de eigen UI komen daardoor uiteindelijk in dezelfde reducer terecht.

Extension-provenance blijft op geïmporteerde nodes bewaard:
- external event ID;
- session ID;
- adapter;
- host;
- oorspronkelijke tijd;
- externalRef.

## Auditlens
De Branch UI heeft nu een `Audit` lens die de laatste Semantic Core-events toont:
- eventtype;
- tijd;
- event-ID;
- surface/adapter;
- payload.

Hierdoor is zichtbaar **waardoor** de betekenisgraph veranderde.

## Architectuurregel
```
UI is projection.
Adapter is translation.
Semantic Core is meaning/state transition.
Vault is durable encrypted state.
```

## Volgende stappen
- eventlog fysiek scheiden van actuele projection state;
- deterministic replay: lege graph + eventlog → dezelfde graph;
- schema migrations;
- signed/device-attributed events;
- conflict resolution voor multi-device sync;
- echte pattern-saturation engine als Core capability;
- policy hooks vóór events worden toegepast;
- ACTIO-events met strengere autorisatie.
