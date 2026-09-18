# M24 Meaning World / Historical Trickster v0.1

## Purpose
The meaning-world layer stores what was being said around market checkpoints as timestamped source claims, separately from what price, flow, derivatives and macro actually measured.

`SOURCE CLAIMS → FRAME CODING → MEANING_WORLD_CONTEXT → HISTORICAL_TRICKSTER_ASSESSMENT`

## First BTC fixture
The initial 2021 case uses timestamped Reuters / Reuters-syndicated historical source metadata around four phases:

- April first top: mainstream adoption / legitimacy around the Coinbase listing
- May automatic reaction: regulatory risk, China restrictions and Tesla/Musk uncertainty
- September support area: sovereign adoption plus implementation friction around El Salvador
- November second top: inflation-hedge, adoption momentum and institutional-flow framing

Each item stores:
- publication timestamp
- publisher / transport
- title and URL
- coded frames
- an explicit direction coding aid
- a short source-grounded summary

The direction field is not a truth score, sentiment oracle or price prediction. It exists only so source framing can be compared reproducibly across checkpoints.

## Qubus record
`MEANING_WORLD_CONTEXT` stores:
- first-top aggregate
- automatic-reaction aggregate
- support-reference aggregate
- second-top aggregate
- dominant frames
- source IDs
- source provenance

## Historical Trickster
`HISTORICAL_TRICKSTER_ASSESSMENT` compares loaded layers without inferring actors.

Current contrast rules can identify cases such as:
- positive narrative ↔ weaker measured participation
- positive narrative ↔ bearish RSI divergence, only if RSI actually measured it
- positive narrative ↔ more-positive funding / long crowding
- positive narrative ↔ stronger dollar
- positive narrative ↔ tighter NFCI financial conditions
- positive narrative ↔ higher long rate
- narrative persistence across both top windows

Rejected evidence is never resurrected: the BTC weekly RSI divergence previously failed, so the Trickster Lab must not describe it as present.

## Evidence discipline
Every historical Trickster result remains:

- evidence: `PLAUSIBLE_INTERPRETATION`
- intent: `INTENT_UNKNOWN`
- actor attribution: `NONE`

A discrepancy is a hypothesis generator and possible confirmation input, not proof of manipulation.

## Missing layers
The assessment records which layers were loaded and which were absent. It can run with price + meaning world, then become richer after derivatives and macro are loaded. Missing layers remain explicit rather than silently assumed.

## UI
Lab provides:
- `Laad betekeniswereld`
- `Draai Trickster over geladen lagen`

The source items remain visible so the human can inspect why a frame was coded.

## Automated tests
`m24-meaning-test.js` verifies timestamp-window selection, frame presence, provenance and the non-truth-score rule.

`m24-trickster-lab-test.js` verifies multi-layer contrasts, preserves the rejected RSI result, tests missing-layer handling, and enforces `INTENT_UNKNOWN / actor NONE`.
