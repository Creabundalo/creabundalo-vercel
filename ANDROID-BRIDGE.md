# P24 Android bridge contract

ACTIO is the semantic/UI layer. Android is the device adapter.

## Default device state
- ACTIO launches after boot and restores the watch face.
- No account/login screen in normal daily use.
- Power key remains Android power/screen control.
- M99 Function key is reserved for ACTIO capture.

## Hardware actions

### Function key gesture map
The native Android bridge owns gesture recognition for the M99 Function key.

- **Single press** -> `window.P24.functionButton()` -> open ACTIO and start voice capture immediately.
- **Double press** (target window: 350 ms, tune on-device) -> `P24Native.startInstantVideo()` -> open the native camera surface and start video recording immediately.
- **Second double press while recording** -> stop and save the recording.
- Power key remains untouched.

A single press must be delayed only long enough to distinguish it from a double press. The bridge should use a small debounce/gesture state machine and provide haptic feedback so the user knows which action was recognized.

### Instant video contract
Preferred implementation: native Android CameraX `VideoCapture` / `Recorder`.

Flow:
1. Function key double press detected.
2. Bring `InstantVideoActivity` to the foreground.
3. Bind rear camera and microphone.
4. Create a MediaStore video output.
5. Start CameraX recording automatically.
6. Give immediate haptic/visual REC feedback.
7. Stop on second double press, explicit stop button, timeout, or app lifecycle safety event.
8. Save the resulting URI locally and emit it back to ACTIO as an attachment/event.
9. Add an audit-log record with timestamp, media URI and capture status.

Fallback implementation: `MediaStore.INTENT_ACTION_VIDEO_CAMERA` opens the installed camera app in video mode, but this fallback does **not** guarantee automatic recording. It is therefore not the preferred P24 interaction.

### Voice
`window.P24.functionButton()` -> ACTIO opens and starts voice capture immediately.

### Camera/photo
`window.P24.openCamera()` -> device camera / ACTIO attachment flow.

### Other apps
Web calls `window.P24Native.openLauncher()`.
Native Android opens the normal HOME launcher, where ordinary apps such as X/Twitter, Instagram and browser remain available.

### Return to ACTIO
ACTIO remains the preferred personal surface. Reopening ACTIO returns to the watch face and preserves local Today/log state.

## Alarm provider
Later: ACTIO approved ALARM operation -> native Android alarm intent / selected clock provider (Fossify Clock preferred, provider replaceable).

## Safety rule
Physical input may start local capture, but external actions still follow:
PREPARE -> PREVIEW -> APPROVE -> COMMIT -> VERIFY.

Local voice/video capture itself may start immediately from the physical key because it is a direct device action, not an external side effect. Any later send/share/calendar/mail action still requires the ACTIO approval flow.
