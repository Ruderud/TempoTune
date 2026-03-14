# QA Audio Fixtures

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
