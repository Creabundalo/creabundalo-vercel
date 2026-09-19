# I24 lokaal starten op Windows

## Snelste route

1. Zorg dat deze repositorymap lokaal op je Windows-pc staat.
2. Dubbelklik op START-I24.cmd.
3. I24 opent automatisch op http://localhost:8787/branch-ui.html.
4. Laat het PowerShell-venster open zolang je I24 gebruikt.
5. Stoppen: sluit het venster of druk Ctrl+C.

Er is geen Node, Python of Vercel CLI nodig voor deze lokale UI/Vault-test.

## Wat lokaal al werkt

- Branch UI
- Semantic Core
- lokale encrypted Vault
- recovery key
- append-only event store
- Replay Check
- Audit lens
- Pattern Saturation
- Continuity UI
- independent backup folder
- Semantic Overlay bridge op localhost

## Wat in deze simpele lokale modus nog niet werkt

/api/vault-sync is een Vercel/serverfunctie. Daarom werken Scaleway snapshot- en cloud event-sync pas wanneer de Vercel deployment weer beschikbaar is, of wanneer later een lokale backend-runtime wordt gestart.

De lokale Vault zelf is hiervan niet afhankelijk.

## Browserextension lokaal laden

1. Open Chrome: chrome://extensions
2. Zet Developer mode aan.
3. Klik Load unpacked.
4. Kies de submap extension uit deze repository.
5. Noteer de extension ID.
6. Open I24 op localhost en open VAULT.
7. Vul bij Semantic Overlay Bridge de extension ID in en klik Koppel extension.
8. Open ChatGPT, klik op het Creabundalo-extensionicoon en de overlay verschijnt.
