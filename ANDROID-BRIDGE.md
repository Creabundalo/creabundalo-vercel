# P24 Android bridge contract

ACTIO is the semantic/UI layer. Android is the device adapter.

## Default device state
- ACTIO launches after boot and restores the watch face.
- No account/login screen in normal daily use.
- Power key remains Android power/screen control.
- M99 Function key is reserved for ACTIO capture.

## Hardware actions

### Function key
Native Android key event -> `window.P24.functionButton()`

Result: ACTIO opens and starts voice capture immediately.

### Camera
`window.P24.openCamera()` -> device camera / ACTIO attachment flow.

### Other apps
Web calls `window.P24Native.openLauncher()`.
Native Android opens the normal HOME launcher, where ordinary apps such as X/Twitter, Instagram and browser remain available.

### Return to ACTIO
ACTIO remains the preferred personal surface. Reopening ACTIO returns to the watch face and preserves local Today/log state.

## Alarm provider
Later: ACTIO approved ALARM operation -> native Android alarm intent / selected clock provider (Fossify Clock preferred, provider replaceable).

## Safety rule
Physical input may start capture, but external actions still follow:
PREPARE -> PREVIEW -> APPROVE -> COMMIT -> VERIFY.
