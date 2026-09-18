# M99 — Source Registry Schema v0.1

Every external observation must resolve to a SOURCE record or explicit SOURCE_GAP.

## SOURCE
Required fields:
- `source_id`
- `provider`
- `domain` — PRICE / DERIVATIVES / CREDIT / MACRO / HOUSING / MEANING / etc.
- `dataset`
- `authority_class` — PRIMARY_OFFICIAL / PRIMARY_VENUE / PRIMARY_MEDIA / SECONDARY / DERIVED
- `access_method` — API / CSV / ARCHIVE / FILE / MANUAL
- `coverage_from`
- `coverage_to`
- `native_resolution`
- `timezone`
- `instrument_scope`
- `license_or_access_note`
- `health_state` — HEALTHY / DEGRADED / BLOCKED / RETIRED
- `last_verified_at`

Optional:
- fallback source IDs;
- checksum/digest;
- rate-limit note;
- geography restriction;
- expected publication lag;
- revision policy.

## SOURCE_OBSERVATION
- source_id
- subject_id
- observed_at
- effective_at
- as_of
- resolution
- raw_value / raw_payload_ref
- normalized_value
- unit
- lineage_id
- quality flags

## SOURCE_GAP
A missing observation is never converted to zero.

Required:
- gap_id
- source_id / attempted provider
- subject_id
- requested_window
- metric
- reason
- discovered_at
- blocking: true/false
- substitute_source_id if resolved
- resolution_state: OPEN / RESOLVED_BY_SUBSTITUTE / ACCEPTED_LIMITATION

## Ranking principle
Prefer:
1. official/issuer/regulator/venue;
2. authoritative first-party archive;
3. reputable primary reporting;
4. specialist secondary source;
5. derived/estimated data only when explicitly labelled.

A higher-ranked source does not erase disagreement; disagreement is retained as evidence.
