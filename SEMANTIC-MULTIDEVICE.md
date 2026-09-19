# Semantic Multi-Device v0.7

## Doel
Meerdere apparaten mogen dezelfde Creabundalo-betekeniswereld gebruiken zonder silent overwrite.

## Apparaatidentiteit
Elk apparaat krijgt lokaal een pseudonieme device identity:

- deviceId
- label
- local sequence
- Lamport clock
- vector clock

De identity staat lokaal in IndexedDB en bevat geen naam of e-mailadres.

## Causal metadata
Nieuwe Core-events krijgen:

```json
{
  "causal": {
    "deviceId": "dev_...",
    "seq": 42,
    "lamport": 87,
    "vector": {
      "dev_a": 42,
      "dev_b": 19
    },
    "scope": "shared"
  }
}
```

## Scope
Niet alles hoort gedeeld te worden.

### Shared
- node creëren
- node type/status wijzigen
- reparent
- edge label
- parkeren
- andere betekeniswijzigingen

### Device-local
- huidige focus
- actieve lens

Een telefoon mag dus een andere view hebben dan de laptop zonder semantisch conflict.

## Vault lineage
Een devicebundle bevat de `vaultId`.

Import wordt geweigerd als:

```
bundle.vaultId != local vaultId
```

Hierdoor kunnen twee onafhankelijke Creabundalo-werelden niet per ongeluk worden samengevoegd.

## Encrypted portable bundle
Devicebundles worden nooit als plaintext eventlog gedownload.

Flow:

```
shared semantic events
      ↓
event bundle
      ↓
Vault AES-GCM portable encryption
      ↓
*.enc.json
```

Alleen een apparaat met dezelfde Vault data key kan de bundle openen.

## Merge
Import doet eerst deduplicatie op eventId.

Daarna:

- causally ordered events → veilig mergeable;
- concurrent events op verschillende properties → veilig mergeable;
- concurrent events op dezelfde semantic property → conflict.

## Conflict keys
v0.7 detecteert conflicten voor:

- node.kind
- node.status
- node.parentId
- node.edgeLabel

Voorbeeld:

```
Laptop: node X → status DONE
Telefoon: node X → status PAUSED
beide zonder elkaar gezien
= CONFLICT
```

Geen last-write-wins.

## Resolutie
De UI toont per conflict:

- lokale waarde;
- remote waarde;
- Houd lokaal;
- Neem remote.

Bij resolutie:

1. remote event wordt causally geobserveerd;
2. remote event wordt in de geschiedenis opgenomen;
3. gebruiker kiest winnaar;
4. een nieuw local resolution-event wordt gemaakt;
5. dat event volgt causaal op beide takken;
6. alles wordt append-only in de Vault opgeslagen.

De resolutie zelf is dus auditbaar.

## Causal clocks
De device runtime onderhoudt:

- monotone per-device sequence;
- Lamport clock;
- vector clock van bekende devices.

De vector clock bepaalt of twee events:
- before
- after
- equal
- concurrent

zijn.

## Replay
Replay blijft deterministisch.

Voor causale events:
1. Lamport;
2. deviceId;
3. sequence;
4. eventId.

Voor legacy events blijft bestaande streamPosition/tijd ordering als fallback.

## Huidige transportvorm
v0.7 gebruikt bewust encrypted export/import als testtransport.

Dit valideert eerst:
- identity;
- causal ordering;
- dedup;
- lineage;
- merge;
- conflict resolution.

Automatische cloud event-sync komt daarna.

## Bewuste grenzen
- oude pre-v0.7 events hebben geen vector metadata;
- geen device signing/public keys;
- geen device revocation;
- conflictregels dekken nog niet elk toekomstig eventtype;
- transport is nog file-based;
- geen server-side encrypted event mailbox;
- geen CRDT voor vrije tekst/documenten.

## Volgende stap
Encrypted event synchronization via Scaleway:

```
device A
   ↓ encrypted event segments
Scaleway event mailbox
   ↓
device B
   ↓ decrypt + causal merge
```

Belangrijk:
- nooit whole-Vault last-write-wins voor multi-device;
- event segments zijn append-only;
- ieder device heeft eigen remote prefix;
- projection blijft lokaal reproduceerbaar.

## Kernregel

```
Concurrency must be detected, not hidden.
User intent resolves semantic conflicts.
Views are local; meaning is shared.
```
