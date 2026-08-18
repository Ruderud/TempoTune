# TempoTune Agent Guide

## Repository Scope

- pnpm 10 + Nx 22 TypeScript monorepo.
- `apps/web`: Next.js 16, React 19, Tailwind CSS 4, Cloudflare Workers deployment.
- `apps/mobile`: React Native 0.81 hybrid shell for iOS and Android.
- `packages/audio` and `packages/audio-input`: shared audio and input logic.
- `packages/shared`: cross-platform types, constants, and utilities.

## Change Rules

- Keep changes narrowly scoped to the requested work; do not refactor adjacent code without a concrete need.
- Preserve the web/mobile bridge protocol and keep shared message types synchronized across both clients.
- Add or update tests for bug fixes and changes to audio, bridge, or shared logic.
- Do not hand-edit generated version/config artifacts; use the package scripts that own them.
- For UI changes under `apps/web`, keep text at least `12px`, touch targets at least `44px`, and use `100dvh` for fixed mobile layouts.
- After web UI changes, run `bash scripts/qa/ui-screenshot.sh` and inspect the generated screenshots.

## Validation

Run the smallest relevant checks first, then the affected suite:

```bash
pnpm -C apps/web exec tsc --noEmit
pnpm --filter @tempo-tune/mobile type-check
pnpm exec nx affected -t lint test type-check
pnpm exec vitest run
pnpm exec prettier --check <changed-files>
```

For broader web validation, use `pnpm qa:web`. Device QA requires an available simulator or physical device; follow the `qa:device:*` scripts rather than inventing ad-hoc commands.

## Git and Generated State

- Keep commits aligned to one work unit.
- Do not overwrite unrelated local changes or untracked files.
- Use the repository version scripts for releases; version labels follow `tempotune-{web|mobile}-{semver}-{git-short-hash}`.
- Treat deployment, signing, production secrets, and force pushes as approval-gated operations.
