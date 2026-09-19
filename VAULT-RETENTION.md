# Vault Retention & Auto Continuity v0.4

## Doel
Automatische continuïteit zonder achtergrondclaims of agressieve verwijdering.

## Automatische policy zolang Creabundalo open/actief is
- Scaleway auto-sync: maximaal eens per 15 minuten.
- Onafhankelijke backup: maximaal eens per 6 uur.
- Policy-check: elke 5 minuten en bij focus/terugkeer naar de tab.
- Alleen wanneer de Vault bestaat en ontgrendeld is.
- Alleen naar providers die actief en toegestaan zijn voor VAULT_HIGH.

Een gewone webpagina is geen betrouwbare achtergrondservice. Voor echte achtergrondtaken volgt later de browserextension/PWA/native-laag.

## Health-drempels
Waarschuwing wanneer een geactiveerde provider buiten policy valt:
- Scaleway laatste sync ouder dan 24 uur.
- Onafhankelijke backup ouder dan 7 dagen.
- Herstelbaarheid langer dan 7 dagen niet opnieuw geverifieerd.

Niet-geactiveerde providers veroorzaken geen waarschuwingen.

## Retentie
Standaard:
- 14 dagelijkse herstelpunten;
- 12 wekelijkse herstelpunten;
- 24 maandelijkse herstelpunten.

De analyse bucketiseert bestaande versioned backups op dag/week/maand en markeert overtollige snapshots als kandidaat.

## Verwijderen
Nooit stil automatisch in v0.4.

Flow:
1. Analyseer backups.
2. Toon totaal / bewaren / opruimkandidaten.
3. Gebruiker kiest expliciet 'Ruim kandidaten op'.
4. Extra confirm met aantallen.
5. Alleen bestanden met het Creabundalo-backupnaamformaat mogen verwijderd worden.

## Principes
```
Automatic continuity, explicit destruction.
Provider failure != privacy downgrade.
Successful write != verified recoverability.
```

## Nog nodig voor productie
- echte background scheduler in extension/native runtime;
- retention policy per account/enterprise tenant;
- immutable/offline recovery point optie;
- storage quota signalering;
- periodieke restore drill;
- audit van policy-wijzigingen;
- externe securityreview.
