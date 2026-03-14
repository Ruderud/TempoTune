# Docs Guide

## Structure

- `features/`: feature-level specs used by QA scripts and regression checks
- `mockups/`: design mockups and mockup-specific notes
- `plans/active/`: current working plans and active handoff documents
- `plans/archive/`: older implementation plans preserved for reference
- `qa/`: QA checklists and manual verification docs
- `releases/`: release and signing guides

## Notes

- Generated screenshots and QA output are not source documents. They live in ignored paths such as `.screenshots/`, `reports/qa/`, and `test-results/`.
- Build artifacts also stay outside `docs/`. Common generated locations are `apps/web/.next/`, `apps/mobile/android/app/build/`, `apps/mobile/ios/build/`, and `output/`, and they are ignored by Git.
- Assistant tool state under `.omc/` should not be used as the source of truth for project documentation.
- QA sample audio fixtures for tuner/rhythm smoke tests live in `apps/web/public/qa-audio/` and can be regenerated with `pnpm run qa:audio-fixtures`.
