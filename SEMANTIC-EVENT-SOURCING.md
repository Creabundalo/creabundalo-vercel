# Semantic Event Sourcing v0.6

## Doel
De betekenisgraph is een projection. De append-only Semantic Event Store is de duurzame bron van waarheid.

## Architectuur

```
UI / Overlay / Connector
        ↓
canonical semantic event
        ↓
Semantic Core reducer
        ↓
in-memory projection
        ↓
atomic Vault commit
   ┌───────────────┴───────────────┐
   ↓                               ↓
append-only event record      current projection
```

## Fysieke scheiding in Vault

Eventrecords:
```
semantic:event:v1:<eventId>
```

Projection:
```
semantic:projection:v1
```

Legacy audit uit v0.5:
```
semantic:legacy-audit:v05
```

Elk eventrecord wordt met IndexedDB `add()` geschreven en kan daarmee niet stil worden overschreven. De projection wordt met `put()` geactualiseerd.

## Atomiciteit
`CreaVault.commitJSONBatch()` versleutelt eerst alle records en schrijft daarna in één IndexedDB-transactie:
- nieuwe eventrecords als append-only;
- de actuele projection als upsert.

Als één append faalt, wordt de hele transactie afgebroken.

## Crash-safe outbox
De UI houdt nieuw aangemaakte Core-events tijdelijk in een in-memory outbox.

De flush-loop:
1. neemt alle pending events;
2. neemt dezelfde revision van de projection;
3. commit events + projection atomair;
4. markeert pas daarna de revision als committed;
5. zet events bij fout terug in de outbox.

Nieuwe events die tijdens een commit ontstaan, worden in een volgende seriële flush verwerkt.

## Idempotente retry
Voor commit wordt gecontroleerd welke event-record IDs al in de Vault bestaan. Een event dat al duurzaam is opgeslagen maar lokaal nog in een retry/outbox zit, wordt niet opnieuw toegevoegd.

## Deterministic replay
`CreaSemanticCore.replay(events)` bouwt een lege graph opnieuw op.

Ordening:
1. `streamPosition`;
2. eventtijd;
3. event-ID als deterministische tie-breaker.

Voor bestaande v0.5-data wordt éénmalig een:
```
PROJECTION_SEEDED
```
event met positie 0 gemaakt. Dat is het migratiecheckpoint. Oude inline audit-events worden apart encrypted bewaard als legacy-audit, maar worden niet dubbel afgespeeld.

Nieuwe events krijgen oplopende `streamPosition` waarden.

## Replay verification
De Audit-lens heeft nu **Replay check**.

Flow:
1. flush alle pending events;
2. laad de append-only eventlog;
3. replay vanaf lege state;
4. canonicaliseer actuele graph en replaygraph;
5. bereken SHA-256;
6. vergelijk beide hashes.

Uitkomst:
```
REPLAY OK
```
betekent dat de huidige betekenisgraph exact uit de eventlog kan worden gereconstrueerd.

## Projection versus operationele adapterstate
Event sourcing geldt voor de betekenisgraph:
- nodes;
- relaties;
- current/focus;
- lens;
- betekenisstate-overgangen.

Technische connectorboekhouding, zoals externe-ID mappings en cursors, blijft operationele metadata in de projection. Die metadata bepaalt niet wat de graph betekent.

## Privacy
- eventrecords zijn afzonderlijk encrypted;
- projection is afzonderlijk encrypted;
- opslagproviders zien ciphertext;
- Vault wordt vóór eerste UI-persist geïnitialiseerd;
- zodra een Vault bestaat, ontstaat bij startup geen tijdelijke plaintext localStorage-write meer.

## Huidige grenzen
- event listing gebruikt in v0.6 nog een eenvoudige IndexedDB scan; later komt een geïndexeerde/chunked eventstore;
- één lokale streamPosition-reeks, nog geen multi-device Lamport/vector clock;
- event signing/device identity volgt later;
- schema migrations zijn nog handmatig/versioned;
- operationele connectorstate is nog geen aparte store;
- event compaction/checkpoints volgen later.

## Volgende stap
Multi-device semantics:
- device identity;
- causal ordering;
- conflict detection/resolution;
- encrypted event synchronization;
- merge zonder silent overwrite.

Kernregel:
```
The graph is rebuildable.
The event log is append-only.
The Vault makes both durable and private.
```
