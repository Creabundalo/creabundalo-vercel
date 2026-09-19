# Vault Continuity / Health v0.3

## Doel
Continuïteit zichtbaar maken als lens op dezelfde Creabundalo-werkelijkheid.

## Wat wordt bijgehouden
- lokale encrypted Vault-save;
- laatste succesvolle Scaleway-sync;
- laatste succesvolle onafhankelijke backup;
- laatste restorebron en -tijd;
- laatste verificatie per externe provider;
- laatste fout per provider.

Deze health-metadata bevat geen inhoud van de Vault.

## Verificatie
"Controleer nu" doet meer dan alleen providerstatus tonen:
1. exporteert de actuele encrypted snapshot;
2. berekent lokaal SHA-256;
3. leest de actieve externe ciphertext terug;
4. berekent opnieuw SHA-256;
5. vergelijkt beide waarden;
6. registreert verified/error in de continuity ledger.

## UX
De Branch UI heeft nu een extra lens:
```
Continuïteit
```

Deze toont:
- Lokale Vault
- Scaleway sync
- Onafhankelijke backup
- Restore

## Principe
```
Provider failure != privacy downgrade
Successful write != verified recoverability
```

Voor productie volgen nog automatische periodieke verification, retention policy, alerts, device revocation en externe securityreview.
