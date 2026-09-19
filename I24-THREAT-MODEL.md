# I24 Security / Privacy Threat Model — Pilot Baseline

## Protected assets
- semantic graph content;
- event history;
- recovery material;
- Vault data key;
- device causal identity;
- sync token;
- provider credentials;
- backup history;
- provenance/audit trail.

## Trust boundaries
1. Browser/OS process.
2. Creabundalo web application.
3. Browser extension isolated context.
4. Vercel server function.
5. Scaleway Object Storage.
6. Independent backup destination (Proton/NAS/etc.).
7. External AI host page.

## Primary threats and current controls

### XSS steals unlocked Vault context
Controls:
- CSP baseline;
- no third-party scripts in Branch UI;
- minimum provider/browser permissions;
- Vault encryption at rest.

Remaining:
- independent XSS review;
- remove `unsafe-inline` style allowance when layout strategy permits;
- Trusted Types where practical.

### Cloud provider reads user meaning
Controls:
- encryption before upload;
- semantic event segments and snapshots are ciphertext;
- provider never receives Vault data key.

Metadata leakage remains:
- object timestamps/sizes;
- pseudonymous vault/device/event identifiers;
- traffic timing.

### Provider outage
Controls:
- local-first operation;
- queued/retryable sync;
- independent backup path;
- no privacy downgrade fallback.

### Silent overwrite between devices
Controls:
- append-only events;
- conditional remote PUT;
- vector/Lamport causality;
- explicit same-property conflict handling;
- no whole-Vault last-write-wins.

### Lost device
Controls:
- remote encrypted events/snapshot;
- recovery key;
- independent backup.

Remaining:
- production device revocation;
- signed device registry.

### Stolen sync token
Current pilot risk:
- attacker could request presigned URLs for that pseudonymous owner.

Mitigations:
- token kept only in session memory;
- server stores hash mapping only;
- provider data remains encrypted.

Production requirement:
- passkey/account auth;
- token rotation/revocation;
- rate limiting and audit.

### Malicious/compromised device
Current risk:
- a device with Vault key can create valid encrypted semantic events.

Production requirement:
- per-device signing key;
- authorized device registry;
- revocation;
- signed event verification.

### Backup destruction/ransomware
Controls:
- timestamped independent backups;
- explicit cleanup only;
- retention policy;
- independent provider option.

Remaining:
- immutable/offline recovery copy option;
- periodic restore drill.

### Extension overreach
Controls:
- activeTab;
- no blanket host permission;
- session-only pending graph/events;
- externally_connectable restricted to Creabundalo origins.

Remaining:
- store review;
- adapter-specific DOM tests;
- production extension signing.

## Privacy principles
- local-first;
- data minimization;
- pseudonymous infrastructure IDs;
- explicit provider policy;
- no silent downgrade;
- private/work Vault separation in later tenant model;
- deletion/retention policy must be visible and auditable.

## Production gates
Before production with real personal/enterprise data:
- independent pentest;
- privacy/DPIA review;
- incident response procedure;
- key rotation/revocation;
- production identity layer;
- backup restore exercise;
- dependency/SBOM review;
- logging review for plaintext leakage;
- rate limiting/abuse controls on sync API.
