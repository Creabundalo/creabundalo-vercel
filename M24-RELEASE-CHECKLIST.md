# M24 v0.1 release checklist

## Meaning / UX
- [ ] Asset selector changes context.
- [ ] LIFE CYCLE → CYCLE → REGIME → EPISODE → EVENT → MICRO drill-down works.
- [ ] Resolution changes detail without changing selected historical window.
- [ ] STORY mode explains market state in ordinary Dutch.
- [ ] ANALYSIS mode exposes overlays without forcing all layers on.
- [ ] LAB mode exposes historical comparisons.
- [ ] LEGACY / M24 / AI-NATIVE lens selector works.

## Qubus / explainability
- [ ] Narrative and measured mechanism are separate records.
- [ ] Signal detail contains what / why / source / uncertainty.
- [ ] User observations can become separate instances.
- [ ] Historical cases preserve time window and outcome.
- [ ] Forecasts are stored as instances and can later receive outcomes.

## Trickster discipline
- [ ] False breakout / liquidity sweep / narrative-flow divergence can be flagged.
- [ ] Intent defaults to `INTENT_UNKNOWN`.
- [ ] Named actors are not attributed without evidence.
- [ ] Trickster output is a confirmation/hypothesis layer, never proof by itself.

## Safety
- [x] v0.1 contains no broker execution code.
- [x] UI contract is `SIMULATED_ONLY`.
- [ ] Future ACTI execution must remain behind PREPARE → PREVIEW → APPROVE → COMMIT → VERIFY.

## Learning
- [ ] Forecast horizon shows widening uncertainty.
- [ ] Forecast → outcome → calibration schema exists.
- [ ] Learned rule changes require BACKTEST → PAPER TEST → VALIDATE before eligibility.

## Release gates
- [ ] HTML references required M24 assets.
- [ ] JavaScript syntax gate passes.
- [ ] Mock data parses.
- [ ] Required safety labels are present.
- [ ] Vercel preview opens `/m24.html`.
- [ ] Manual click-through accepted before merge.

Release rule: no `LIVE`, broker execution or self-deployed learned rule may be marked verified in v0.1.
