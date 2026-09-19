# I24 · Intelligence 24 — Pilot Status

Date: 2026-09-19

## Positionering
I24 is de generieke Creabundalo intelligence/meaning layer.

```
SURFACES / ADAPTERS
   ↓
Semantic Core
   ↓
append-only Event Store
   ↓
Pattern / Branch / Context capabilities
   ↓
encrypted Vault
   ↓
sync / backup / projections
```

## Status per capability

| Capability | Status | Pilot priority |
|---|---|---|
| Semantic Core / canonical events | BUILT | P0 |
| Branch/context graph | BUILT | P0 |
| Audit + deterministic replay | BUILT | P0 |
| Local encrypted Vault | BUILT | P0 |
| Recovery key | BUILT | P0 |
| Scaleway encrypted snapshot | BUILT, needs live config/test | P0 |
| Multi-device causal model | BUILT | P0 |
| Explicit conflict resolution | BUILT | P0 |
| Scaleway append-only event sync | BUILT, needs live config/test | P0 |
| Continuity Health | BUILT | P0 |
| Retention policy | BUILT | P1 |
| Browser Semantic Overlay | BUILT v0.x | P0 |
| Overlay → Core/Vault bridge | BUILT | P0 |
| Pattern saturation engine | BUILT heuristic v0.1 | P1 |
| Independent backup folder | BUILT | P1 |
| Proton Drive direct integration | NOT REQUIRED | P3 / optional |
| NAS backup | AVAILABLE via folder adapter | P2 |
| CI / syntax / semantic replay tests | BUILT | P0 |
| Security headers | BUILT | P0 |
| Passkey/account identity | NOT BUILT | P1 after pilot |
| Device signing + revocation | NOT BUILT | P1 after pilot |
| External pentest/security review | EXTERNAL | P0 before production |
| Formal privacy/DPIA review | EXTERNAL | P0 before production |

## Providerrollen

### Local device
Primary execution and decryption boundary.

### Scaleway
Operational infrastructure:
- append-only encrypted semantic event transport;
- encrypted Vault disaster-recovery snapshot;
- provider adapter, not I24 core.

### Proton Drive
Optional independent secondary backup destination via synced folder.

No direct Proton dependency is required for I24 operation.

### NAS / other storage
Optional independent backup through the same folder pattern.

## Proton decision update
Previous importance: possible core/privacy storage dependency.

Current decision:
```
Proton = OPTIONAL BACKUP DESTINATION
not runtime
not sync authority
not encryption authority
not product prerequisite
```

Reason: I24 owns its client-side encryption, event semantics, Vault and provider routing.

## Pilot blockers that require a human/external system

1. Create/confirm Scaleway account.
2. Create private Object Storage bucket (recommended: Amsterdam / nl-ams).
3. Create least-privilege Scaleway IAM/API key.
4. Add server-only Scaleway credentials to Vercel environment.
5. Generate one pilot sync token and store only its SHA-256 mapping server-side.
6. Configure exact-origin bucket CORS.
7. Load/install the unpacked browser extension for pilot.
8. Run first real browser end-to-end Vault test.
9. Run two-device causal sync/conflict test.
10. Commission independent security/pentest before any production claim.
11. Commission formal privacy/DPIA/legal review before external production use involving personal data.

Calling Scaleway is not required for pilot setup. Their console supports bucket/IAM setup and Basic support includes ticketing.

## Assistant-owned remaining engineering after pilot evidence
These are intentionally postponed until the current architecture is proven live:
- production passkey/account auth replacing pilot token;
- signed device events + device revocation;
- remote cursors/manifests/chunking beyond pilot listing limits;
- extension/native background wake;
- pattern saturation v0.2 using semantic/open-question evidence;
- event/schema migrations;
- append-only audit compaction/checkpoints;
- enterprise tenant/policy model.

## Go/no-go definition for I24 pilot
Pilot is technically credible when all are true:

- Vault setup/unlock/recovery works in real browser.
- No plaintext persistence after Vault creation.
- Replay check returns OK.
- Scaleway snapshot upload + restore succeeds.
- Semantic event sync succeeds between two devices.
- Concurrent same-property edits produce visible conflict, not silent overwrite.
- Conflict resolution becomes a later causal event and syncs back.
- Independent encrypted backup can be restored.
- CI checks green.
- No critical/high finding remains from external security review before production.

## Architecture rule
```
I24 owns meaning.
Vault owns confidentiality.
Events own history.
Scaleway transports ciphertext.
Proton/NAS are optional recovery destinations.
UI is projection.
```
