# Creabundalo Vault v0

## Doel
Een provider-onafhankelijke privacykern voor Creabundalo. De opslagprovider bewaart alleen ciphertext; ontsleuteling gebeurt op het apparaat.

## v0 architectuur
- **Data key (DEK):** willekeurige 256-bit AES-GCM sleutel.
- **Wachtzin:** wordt met PBKDF2-SHA-256 (600.000 iteraties + random salt) omgezet in een key-encryption-key die de DEK wrapt.
- **Recovery key:** aparte willekeurige 256-bit recovery secret die dezelfde DEK onafhankelijk kan unwrapen.
- **Data:** elk record krijgt een unieke 96-bit AES-GCM IV en authenticated additional data (record-id).
- **Lokale opslag:** encrypted records in IndexedDB.
- **Providerstatus:** nog geen netwerk- of cloudprovider gekoppeld.

## Bewuste grenzen van v0
Dit is een architectuurprototype, nog geen gecertificeerde productiekluis. Voor productie volgen minimaal:
1. onafhankelijke cryptografische/security review;
2. CSP/XSS-hardening en dependency policy;
3. passkey/device-key integratie;
4. key rotation en recovery-procedure;
5. encrypted snapshot import/restore;
6. Scaleway Object Storage adapter;
7. onafhankelijke backup-adapter (bijv. Proton-synced snapshotmap);
8. privacy classes + provider policy enforcement;
9. audit zonder gevoelige plaintext;
10. pentest en formele threat model review.

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
