# Creabundalo Vault v0.1

## Doel
Een provider-onafhankelijke privacykern voor Creabundalo. Opslagproviders bewaren alleen ciphertext; ontsleuteling gebeurt op het apparaat.

## Kernarchitectuur
- **Data key (DEK):** willekeurige 256-bit AES-GCM sleutel.
- **Wachtzin:** PBKDF2-SHA-256 met 600.000 iteraties en random salt; deze key wrapt de DEK.
- **Recovery key:** aparte willekeurige 256-bit recovery secret die dezelfde DEK onafhankelijk kan unwrapen.
- **Datarecords:** unieke AES-GCM IV per record + authenticated additional data op basis van record-id.
- **Lokale opslag:** encrypted records in IndexedDB.
- **Snapshot:** volledig encrypted exportformaat met metadata + encrypted records.
- **Restore:** snapshot wordt eerst op formaat/integriteit gevalideerd en daarna encrypted teruggezet; pas na unlock ontstaat plaintext in geheugen.
- **Provider-router:** opslagbestemmingen worden alleen gebruikt als hun toegestane privacyklassen overeenkomen met de data.

## Privacyklassen
```
STANDARD
PRIVATE
VAULT_HIGH
ENTERPRISE_RESTRICTED
```

Een provider mag alleen data ontvangen voor privacyklassen waarvoor hij expliciet geregistreerd is. Een providerstoring mag nooit automatisch naar een minder-private bestemming leiden.

## Providers in v0.1
- **LOCAL_DOWNLOAD** — actief; schrijft alleen een encrypted snapshot naar een lokaal bestand.
- **SCALEWAY_SYNC** — adaptercontract aanwezig, nog uitgeschakeld totdat een server-side/presigned backend bestaat.
- **INDEPENDENT_BACKUP** — adaptercontract aanwezig, nog uitgeschakeld; bedoeld voor Proton/NAS/andere onafhankelijke backupbestemming.

### Belangrijke securityregel
Cloudcredentials horen **niet in de browserextension of frontend**. Scaleway-toegang moet later via een backend/presigned-request mechanisme lopen, waarbij uitsluitend ciphertext wordt verstuurd.

## Providerprincipe

```
Creabundalo owns encryption.
Storage providers store ciphertext.
Provider failure must never silently become privacy degradation.
```

## Beoogde lagen
- LOCAL_VAULT
- SYNC_VAULT (Scaleway eerste kandidaat)
- BACKUP_VAULT (onafhankelijke provider, Proton/NAS mogelijk)
- ENTERPRISE_VAULT (customer-controlled destination)

## Nog nodig voor productie
1. onafhankelijke cryptografische/security review;
2. CSP/XSS-hardening en dependency policy;
3. passkey/device-key integratie;
4. key rotation en volledige recoveryprocedure;
5. geautomatiseerde restore-tests en corrupte snapshot-tests;
6. echte Scaleway backend/presigned adapter;
7. onafhankelijke backup-adapter;
8. uitgebreid privacy-policy model + audit zonder gevoelige plaintext;
9. device revocation en multi-device key distribution;
10. pentest en formele threat-model review.

Dit blijft een architectuurprototype en mag nog niet als gecertificeerde of productieklare security-oplossing worden gepresenteerd.
