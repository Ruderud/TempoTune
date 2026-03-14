#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(dirname "$0")"

QA_USE_DEV_WEB_URL_VALUE="${QA_USE_DEV_WEB_URL:-0}"
QA_ENABLE_WEBVIEW_DEBUGGING_VALUE="${QA_ENABLE_WEBVIEW_DEBUGGING:-0}"
QA_WEB_URL_VALUE="${QA_WEB_URL:-}"
EXPLICIT_RUNTIME_CHANNEL="${APP_RUNTIME_CHANNEL:-}"
RELEASE_CHANNEL="${TEMPO_TUNE_RELEASE_CHANNEL:-production}"
ALLOW_QA_RELEASE="${TEMPO_TUNE_ALLOW_QA_RELEASE:-0}"

RUNTIME_CHANNEL="development"

if [ "${CONFIGURATION:-Debug}" = "Release" ]; then
  case "$RELEASE_CHANNEL" in
    production)
      RUNTIME_CHANNEL="production"
      QA_USE_DEV_WEB_URL_VALUE=0
      QA_ENABLE_WEBVIEW_DEBUGGING_VALUE=0
      QA_WEB_URL_VALUE=
      ;;
    qa)
      if [ "$ALLOW_QA_RELEASE" != "1" ]; then
        echo "Error: Release QA build requested without TEMPO_TUNE_ALLOW_QA_RELEASE=1." >&2
        exit 1
      fi
      RUNTIME_CHANNEL="qa"
      ;;
    *)
      echo "Error: TEMPO_TUNE_RELEASE_CHANNEL must be 'production' or 'qa' for Release builds (got '$RELEASE_CHANNEL')." >&2
      exit 1
      ;;
  esac
elif [ -n "$EXPLICIT_RUNTIME_CHANNEL" ]; then
  RUNTIME_CHANNEL="$EXPLICIT_RUNTIME_CHANNEL"
elif [ "$QA_USE_DEV_WEB_URL_VALUE" = "1" ] || [ "$QA_ENABLE_WEBVIEW_DEBUGGING_VALUE" = "1" ] || [ -n "$QA_WEB_URL_VALUE" ]; then
  RUNTIME_CHANNEL="qa"
fi

APP_RUNTIME_CHANNEL="$RUNTIME_CHANNEL" \
QA_USE_DEV_WEB_URL="$QA_USE_DEV_WEB_URL_VALUE" \
QA_ENABLE_WEBVIEW_DEBUGGING="$QA_ENABLE_WEBVIEW_DEBUGGING_VALUE" \
QA_WEB_URL="$QA_WEB_URL_VALUE" \
  bash "${SCRIPT_DIR}/generate-dev-config.sh"

if [ "${CONFIGURATION:-Debug}" = "Release" ] && [ "$RUNTIME_CHANNEL" = "production" ]; then
  bash "${SCRIPT_DIR}/verify-production-runtime-config.sh"
fi
