# QA Audio Fixtures

These files are QA-only fixtures. They should not live under deployable web `public/` assets.
The canonical location is `qa/assets/audio/`, and the app serves them only through the QA route `/qa-audio/*` during local dev/QA runs.

Re-generate these files with:

```bash
pnpm run qa:audio-fixtures
```

`*.wav` files are the deterministic source used by native on-device QA sample injection.  
`*.mp3` files are human-listenable mirrors of the same generated content.

Useful smoke-test commands:

```bash
pnpm run qa:device:audio-samples:ios-sim
pnpm run qa:device:audio-samples:ios-real
pnpm run qa:device:audio-samples:android-emu
pnpm run qa:device:audio-samples:android-real
```
