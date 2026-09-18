# M99-B012 — Meaning World

## Goal
Store what market participants could have been told, expected or framed at time T without confusing narrative with mechanism or truth.

## Record types
- SOURCE_FACT — directly reported measurable fact.
- SOURCE_CLAIM — attributed claim by a source/person/institution.
- CONSENSUS_EXPECTATION — forecast/estimate with publisher and timestamp.
- NARRATIVE_FRAME — coded interpretation/theme.
- POLICY_COMMUNICATION — official communication.
- ANALYST_VIEW — attributed analyst interpretation.
- SOCIAL_SENTIMENT — derived/aggregated sentiment with methodology.

## Required fields
- source_id;
- publisher/issuer;
- published_at;
- effective/event time where different;
- asset/case scope;
- title/summary;
- frame codes;
- direction coding if used;
- source quality;
- provenance URL/reference;
- evidence status.

## Rules
1. Frame direction is not a truth score.
2. Claims are attributed; M99 does not adopt motive claims as fact.
3. Sources are asset/case scoped; BTC narrative cannot silently populate ETH/SOL/equities.
4. Publication time governs no-lookahead admissibility.
5. Repeated headlines from syndication may share one canonical source lineage to avoid fake source diversity.
6. Narrative persistence and narrative/mechanism divergence are measurable Trickster inputs.

## Batch result
Meaning-world architecture/source hierarchy is DONE.
Automated broad news ingestion remains a later provider task; historical case fixtures remain allowed when source/provenance is explicit.
