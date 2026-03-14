#!/bin/bash
# UI Screenshot utility for TempoTune
# Takes mobile viewport screenshots of metronome and tuner pages
# Usage: bash scripts/qa/ui-screenshot.sh

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SCREENSHOT_DIR="$PROJECT_DIR/.screenshots"
mkdir -p "$SCREENSHOT_DIR"

# Check if dev server is running
if ! lsof -i :3000 > /dev/null 2>&1; then
  echo "SKIP: Dev server not running on :3000"
  exit 0
fi

VIEWPORTS=("390,844:iphone12" "412,915:pixel7")
PAGES=("/metronome:metronome" "/tuner:tuner")

for vp in "${VIEWPORTS[@]}"; do
  IFS=':' read -r size name <<< "$vp"
  for pg in "${PAGES[@]}"; do
    IFS=':' read -r path pgname <<< "$pg"
    outfile="$SCREENSHOT_DIR/${name}-${pgname}.png"
    npx playwright screenshot --viewport-size="$size" "http://localhost:3000${path}" "$outfile" 2>/dev/null
  done
done

echo "Screenshots saved to .screenshots/ (4 files)"
