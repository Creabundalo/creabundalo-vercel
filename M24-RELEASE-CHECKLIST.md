# M24 v0.1 release checklist

## Meaning / UX
- [x] Augmented market viewer shell exists
- [x] Price/lifecycle is primary canvas
- [x] LIFE CYCLE → CYCLE → REGIME → EPISODE navigation exists
- [x] Resolution is a separate control
- [x] STORY / ANALYSIS / LAB modes exist
- [x] LEGACY / M24 / AI-NATIVE lenses exist
- [x] Meaning-world narrative is separate from measured mechanism
- [x] Trickster result displays evidence/intent caution
- [x] Cross-asset strip exists
- [x] Forecast horizons widen uncertainty
- [x] User observation flags persist locally

## Transactions
- [x] Transactions are rows by default
- [x] Row fields include asset, direction, strategy, entry, status and P/L
- [x] Drill-down exposes why/risk/target/forecast/Trickster context
- [x] User status lifecycle supports KANDIDAAT/KLAAR/OPEN/DEELS/GESLOTEN
- [x] Audit lifecycle displays PREPARE/PREVIEW/APPROVE/COMMIT/VERIFY
- [x] Transactions are PAPER/mock only in v0.1

## Qubus / learning
- [x] Requirements define core M24 Qubus types
- [x] Forecast instances are designed for realized-outcome calibration
- [x] Historical lab seed cases defined
- [x] Learning changes require backtest → paper test → validation before live eligibility

## Safety
- [x] SIMULATED_ONLY permanently visible
- [x] No broker provider in v0.1
- [x] No order-submit control exists
- [x] No actor attribution from ownership alone
- [x] Trickster defaults intent to unknown without evidence

## Release gates
- [x] JavaScript syntax gate — GitHub Actions
- [x] Required file gate — GitHub Actions
- [x] Interaction contract gate — GitHub Actions
- [ ] Browser interaction smoke test
- [ ] Vercel preview opens `/m24.html`
- [ ] Visual review on desktop
- [ ] Visual review on touch display

Release rule: M24 v0.1 remains a mock/paper viewer. Live market feeds and IBKR execution must be introduced behind provider interfaces and separate approval/verification gates.
