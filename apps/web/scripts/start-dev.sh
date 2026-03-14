#!/usr/bin/env bash
set -euo pipefail

if [[ "${TEMPO_TUNE_FORCE_TURBOPACK_WEB:-0}" == "1" ]]; then
  exec next dev "$@"
fi

if command -v watchman >/dev/null 2>&1; then
  exec next dev "$@"
fi

echo "watchman not found; starting Next.js in webpack polling mode." >&2
exec env WATCHPACK_POLLING=true next dev --webpack "$@"
