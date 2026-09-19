# Semantic Cloud Event Sync v0.8

## Doel
Multi-device synchronisatie gebeurt via **append-only encrypted semantic event segments**, niet door complete Vault snapshots over elkaar heen te schrijven.

De bestaande Scaleway Vault snapshot blijft bestaan als disaster-recoverylaag.

## Twee aparte stromen

```
LIVE / OPERATIONEEL
device A
  ↓ shared semantic events
AES-GCM event segments
  ↓
Scaleway Object Storage
  ↑
device B
  ↓ causal merge / conflict detection

RECOVERY
periodieke volledige encrypted Vault snapshot
  ↓
Scaleway latest.enc.json
```

## Object layout

```
creabundalo/
  v1/
    <owner>/
      primary/
        latest.enc.json

  v2/
    <owner>/
      <vaultId>/
        events/
          <deviceId>/
            000000000042_evt_xxx.enc.json
            000000000043_evt_yyy.enc.json
```

- owner is server-side pseudoniem;
- vaultId is pseudonieme Vault lineage;
- deviceId is pseudoniem;
- eventinhoud is encrypted;
- objectnaam lekt wel technische metadata zoals device, sequence en event-ID.

## Upload
1. Client leest lokale append-only eventstore.
2. Alleen events met `causal.scope=shared` worden geselecteerd.
3. Alleen events van het eigen device worden geüpload.
4. Server maakt maximaal 100 kortlevende presigned PUT URLs.
5. Event wordt lokaal met de Vault data key versleuteld.
6. PUT gebruikt `If-None-Match: *`.
7. Een bestaand object kan daardoor niet stil worden overschreven.

Scaleway ondersteunt conditional writes met `If-None-Match`; deze v0.8 gebruikt dit expliciet voor remote append-only gedrag.

## Download
1. Server voert ListObjectsV2 uit binnen:
   `creabundalo/v2/<owner>/<vaultId>/events/`
2. Server retourneert alleen gevalideerde segmentmetadata + 90 sec presigned GET URL.
3. Client vergelijkt remote event IDs met lokale event IDs.
4. Alleen onbekende segmenten worden opgehaald.
5. Client decrypt lokaal met de Vault key.
6. Event-ID, device-ID, sequence, scope en Vault lineage worden opnieuw gevalideerd.
7. Events gaan door dezelfde causal merge/conflictmotor uit v0.7.

## Auto-sync
Zolang Creabundalo open, ontgrendeld en Scaleway geactiveerd is:
- semantische event-sync: maximaal iedere 2 minuten;
- extra trigger na succesvolle lokale semantic commit;
- extra trigger bij focus/terugkeer naar tab;
- volledige Vault snapshot: maximaal iedere 6 uur;
- onafhankelijke Proton/NAS backup: maximaal iedere 6 uur.

Bij onopgeloste semantic conflicts stopt automatische event-merge totdat de gebruiker een keuze maakt.

## Conflictgedrag
Geen last-write-wins.

Concurrente wijzigingen op dezelfde semantic property:
- worden niet automatisch overschreven;
- verschijnen in de bestaande conflict-UI;
- gebruiker kiest lokaal of remote;
- keuze wordt nieuw causally-later resolution-event;
- resolution-event wordt daarna automatisch meegesynchroniseerd.

## Server trust boundary
De Vercel API:
- bewaart Scaleway credentials server-side;
- valideert bearer sync-token naar pseudonieme owner;
- valideert vaultId/deviceId/seq/eventId;
- kan S3-objectmetadata zien;
- kan ciphertext niet ontsleutelen;
- geeft alleen kortlevende presigned URLs uit.

Scaleway ziet:
- bucket/prefix;
- objectnamen;
- tijden/groottes;
- ciphertext.

Scaleway en Vercel zien **niet** de semantic payload zolang client-side Vault encryptie intact blijft.

## Scaleway rechten
De server-IAM identity heeft voor deze flow minimaal nodig:
- `s3:ListBucket` op de bucket voor ListObjectsV2;
- `s3:GetObject` op de Creabundalo objectprefix;
- `s3:PutObject` op de Creabundalo objectprefix.

Geen DeleteObject-recht is nodig voor event-sync.

## CORS
De bucket-CORS moet de exacte Creabundalo-origin toestaan met:
- GET
- HEAD
- PUT
- `AllowedHeaders: ["*"]`

`If-None-Match` gaat rechtstreeks van browser naar Object Storage en moet dus door CORS worden toegestaan.

## Pilotlimieten
- maximaal 200 eventsegmenten per ListObjectsV2-pagina;
- maximaal 20 pagina's per sync-run (4.000 remote segmenten);
- maximaal 100 presigned event uploads per batch;
- download concurrency = 6;
- sync-token is nog sessiegeheugen, geen productie-accountauth;
- geen device signing;
- geen remote garbage collection/compaction;
- geen push-notifications; polling alleen zolang app actief is.

## Volgende schaalstap
- passkey/account-auth in plaats van pilot token;
- device public keys + signed events;
- remote cursors/manifests om bucket listing te verminderen;
- event segment batching/chunking;
- push/wake mechanism via extension/native runtime;
- remote compaction/checkpoints zonder auditverlies;
- device revocation.

## Kernregel

```
Snapshots recover.
Events synchronize.
Conflicts stay visible.
Cloud stores ciphertext.
```
