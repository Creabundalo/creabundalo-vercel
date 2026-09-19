# Independent Vault Backup v0.1

Creabundalo kan een lokale map gebruiken als onafhankelijke backupbestemming.

## Doel
De backup-provider zit buiten de runtime. De map kan door Proton Drive, NAS-software of een andere sync-tool worden meegenomen.

## Werking
- gebruiker kiest expliciet een map;
- de directory handle wordt in IndexedDB onthouden;
- browserpermissie blijft leidend en kan opnieuw gevraagd worden;
- elke backup is een nieuw encrypted bestand met tijdstempel;
- restore kiest de nieuwste geldige backup op bestandsnaam;
- de provider ziet alleen ciphertext.

## Bestandsvorm
```
creabundalo-vault-2026-09-19T16-42-11-123Z.enc.json
```

## Waarom versioned
We overschrijven niet steeds `latest`. Daardoor blijft herstelgeschiedenis bestaan als actuele data beschadigd raakt of syncsoftware een wijziging doorzet.

## Browsergrens
De File System Access API vereist HTTPS en expliciete gebruikersinteractie. `showDirectoryPicker()` is niet overal beschikbaar; waar deze ontbreekt blijft de bestaande encrypted download-export de fallback. Directory handles kunnen in IndexedDB worden opgeslagen, maar toegang blijft onder browsercontrole.

## Proton/NAS
Creabundalo integreert hier niet rechtstreeks met Proton. De gebruiker kiest bijvoorbeeld een lokale Proton Drive-map:
```
Proton Drive/Creabundalo Backup/
```
De Proton-client synchroniseert die map onafhankelijk. Hetzelfde patroon werkt voor een NAS-syncfolder.

## Productiereview
Voor productie volgen nog:
- retention policy;
- periodieke automatische backup-trigger;
- backup verification / restore test;
- quota/disk-space signalering;
- onafhankelijke securityreview.
