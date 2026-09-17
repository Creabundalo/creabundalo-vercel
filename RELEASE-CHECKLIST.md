# P24 / ACTIO release checklist

## Meaning / UX
- [x] Watch-first default state
- [x] Swipe opens ACTIO
- [x] One-click Function action reserved for immediate voice capture
- [x] Double-click Function action reserved for immediate video capture (device verification pending)
- [x] Camera available from ACTIO
- [x] Overig returns to ordinary Android apps
- [x] Today list with completion checkmarks
- [x] Audit log visible

## Transaction safety
- [x] PREPARE
- [x] PREVIEW shows the final intended action
- [x] APPROVE required before external execution
- [x] COMMIT isolated behind providers
- [x] VERIFY reads back committed records
- [x] Unknown contacts resolved/created before events

## Local-first / device
- [x] Local persistence
- [x] PWA manifest
- [x] Offline shell / service worker
- [x] Wake-lock control
- [x] No mandatory daily login screen
- [x] Native Android bridge contract documented

## Providers
- [x] Contact provider abstraction
- [x] Calendar provider abstraction
- [x] Alarm provider abstraction
- [x] External Calendar/Alarm remain LOCAL_MOCK for this release
- [ ] M99 Function key event verified on physical device
- [ ] Android CameraX direct-record adapter verified on physical device
- [ ] Fossify/Android alarm adapter verified on physical device
- [ ] Live CalendarProvider verified end-to-end

## Release gates
- [x] JavaScript syntax gate
- [x] Manifest parse gate
- [x] Required PWA assets gate
- [x] Interaction-contract gate
- [x] Provider safety gate
- [ ] GitHub Actions ACTIO Release Gate green on final head
- [ ] Vercel preview green on final head
- [ ] Production deployment green after merge

Release rule: do not mark LIVE providers or physical-button features as verified until tested on the actual device. No silent external actions; PREVIEW -> APPROVE remains mandatory.
