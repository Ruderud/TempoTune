# Mobile Release Runbook

TempoTune mobile release paths are split into two modes:

- **Production release**: requires real signing credentials
- **QA release**: uses a debug-signed release variant only when explicitly opted in by the QA scripts

## Android

### Production release signing

Set these environment variables before running a production Android release build:

```bash
export TEMPO_TUNE_RELEASE_STORE_FILE=/absolute/path/to/release.keystore
export TEMPO_TUNE_RELEASE_STORE_PASSWORD=...
export TEMPO_TUNE_RELEASE_KEY_ALIAS=...
export TEMPO_TUNE_RELEASE_KEY_PASSWORD=...
```

Then build:

```bash
cd apps/mobile/android
./gradlew app:bundleRelease
```

Expected artifact path:

```text
apps/mobile/android/app/build/outputs/bundle/release/
```

If the signing variables are missing, release builds fail fast by design.

### QA Android release build

Local Android device QA uses a release APK with embedded JS, but it opts into debug signing explicitly so production signing is never bypassed accidentally.

The QA scripts set:

```bash
TEMPO_TUNE_ALLOW_DEBUG_RELEASE_SIGNING=1
TEMPO_TUNE_ENABLE_MINIFY_IN_RELEASE=0
TEMPO_TUNE_ENABLE_SHRINK_RESOURCES_IN_RELEASE=0
```

Manual equivalent:

```bash
cd apps/mobile/android
TEMPO_TUNE_ALLOW_DEBUG_RELEASE_SIGNING=1 \
TEMPO_TUNE_ENABLE_MINIFY_IN_RELEASE=0 \
TEMPO_TUNE_ENABLE_SHRINK_RESOURCES_IN_RELEASE=0 \
./gradlew app:assembleRelease
```

Expected artifact path:

```text
apps/mobile/android/app/build/outputs/apk/release/
```

## iOS

Use the existing TestFlight flow:

```bash
./scripts/ios-testflight.sh
```

Expected archive/log paths:

```text
apps/mobile/ios/build/TempoTune.xcarchive
apps/mobile/ios/build/testflight-upload.log
```

For real-device QA signing, prefer `.env.qa.local` with:

```bash
QA_IOS_TEAM_ID=YOUR_TEAM_ID
QA_IOS_SIGNING_ID="Apple Development"
QA_IOS_BUNDLE_ID=com.rud.tempotune
QA_IOS_WDA_BUNDLE_ID=com.rud.tempotune.wda
```

## Rollback Notes

- Android: keep the last known-good signed AAB/APK artifact and its version code
- iOS: keep the previous TestFlight/App Store build number ready for resubmission
- WebView QA failures: verify `QA_WEB_URL` or local server reachability before rebuilding mobile binaries
