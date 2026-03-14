#!/bin/bash
# TempoTune 작업 완료 알림
# Usage: bash scripts/dev/notify.sh "WU-2 튜너 UI 재구성 완료"

TITLE="${1:-작업 완료}"
SUBTITLE="${2:-TempoTune}"

osascript -e "display notification \"$TITLE\" with title \"$SUBTITLE\" sound name \"Glass\""
