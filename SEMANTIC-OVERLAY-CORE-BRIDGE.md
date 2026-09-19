# Semantic Overlay → Creabundalo Core Bridge v0.2

## Doel
De browserextension blijft een dunne stekker. Betekenisvolle interacties worden als canonieke events naar de lokale Creabundalo-webapp overgedragen en daarna encrypted in de bestaande Vault opgeslagen.

Er is in v0.2 **geen tussenserver** voor deze overdracht.

## Vertrouwensgrens

```
AI host page
   ↓ activeTab + content adapter
Extension isolated context
   ↓ canonical semantic event
chrome.storage.session pending queue
   ↓ externally_connectable
Creabundalo web app
   ↓ validation + mapping
Creabundalo graph
   ↓
encrypted Vault
   ↓ successful commit
ACK → extension queue
```

## Eventschema

```json
{
  "schema": "creabundalo.semantic-event.v1",
  "eventId": "...",
  "sessionId": "...",
  "type": "BRANCH_CREATED",
  "occurredAt": "...",
  "source": {
    "surface": "browser-extension",
    "adapter": "chatgpt",
    "host": "chatgpt.com"
  },
  "payload": {}
}
```

v0.2 events:
- `BRANCH_CREATED`
- `NODE_FOCUSED`
- `NODE_PROJECT_PROMOTED`
- `NODE_REPARENTED`

## Transactionele import

1. Extension houdt events pending in `chrome.storage.session`.
2. Creabundalo vraagt pending events op.
3. Import is alleen toegestaan wanneer de Vault bestaat en ontgrendeld is.
4. Events worden gevalideerd en idempotent in de graph gemapt.
5. De graph wordt encrypted in de Vault geschreven.
6. Pas na succesvolle Vault-save stuurt Creabundalo ACK met event IDs.
7. Alleen ge-ACKte events verdwijnen uit de extensionqueue.

Bij fout vóór stap 6 blijven events pending.

## Provenance
Elke geïmporteerde node kan bewaren:
- extension sessionId;
- semantic eventId;
- host adapter;
- hostnaam;
- eventtijd;
- externalRef voor deduplicatie.

Elke nieuwe extension-sessie krijgt in Creabundalo een eigen `session` contextnode onder de context die actief was bij de eerste import.

## Web ↔ extension verbinding
Manifest `externally_connectable` staat alleen toe:
- `https://creabundalo.com/*`
- `https://*.creabundalo.com/*`
- localhost / 127.0.0.1 voor ontwikkeling

De development-extension-ID moet eenmalig in de Vault UI worden ingevuld. De ID zelf is niet geheim en mag lokaal worden onthouden.

## Privacy
- geen ChatGPT/corporate-AI plaintext naar een Creabundalo server voor de bridge;
- geen Vault key in de extension;
- geen extension eventqueue in `storage.local` of `storage.sync`;
- hostpagina kan de session storage niet rechtstreeks lezen;
- de webapp ACKt pas na encrypted Vault commit.

## Bewuste grenzen v0.2
- pending extension events verdwijnen bij browserrestart/extension reload zolang ze nog niet zijn geïmporteerd;
- production extension ID is nog niet vastgepind/store-signed;
- pattern saturation is nog een UX-placeholder;
- alleen ChatGPT heeft automatische turn-detectie;
- Creabundalo preview-deployments buiten toegestane origins kunnen niet direct verbinden;
- multi-device overlay bridge volgt later via de encrypted core/sync-laag.

## Volgende architectuurstap
De canonieke eventlaag wordt de interface tussen:
- browser overlay;
- eigen Creabundalo UI;
- corporate connectors;
- toekomstige native clients;
- agents / ACTIO.

De UI is dus niet de bron van waarheid; de event/graph core is dat.
