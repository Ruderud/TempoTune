#!/usr/bin/env bash

set -euo pipefail

if [[ "${TEMPO_TUNE_FORCE_NO_WATCH_METRO:-0}" == "1" ]]; then
  echo "forcing Metro no-watch mode (CI=1)." >&2
  exec env CI=1 react-native start "$@"
fi

if [[ "${TEMPO_TUNE_FORCE_WATCH_METRO:-0}" == "1" ]]; then
  exec react-native start "$@"
fi

if command -v watchman >/dev/null 2>&1; then
  exec react-native start "$@"
fi

echo "watchman not found; trying Metro watch mode first." >&2

set +e
react-native start "$@"
status=$?
set -e

echo "Metro exited with status ${status}; restarting in no-watch mode (CI=1)." >&2
exec env CI=1 react-native start "$@"
