#!/usr/bin/env bash
# bump-ios-version.sh — Bump iOS native version in project.pbxproj
# Usage: ./scripts/bump-ios-version.sh [major|minor|patch]
# Default: patch

set -euo pipefail

PBXPROJ="apps/mobile/ios/TempoTune.xcodeproj/project.pbxproj"

if [[ ! -f "$PBXPROJ" ]]; then
  echo "Error: $PBXPROJ not found. Run from project root." >&2
  exit 1
fi

# Read current version (first MARKETING_VERSION match)
CURRENT=$(grep -m1 'MARKETING_VERSION' "$PBXPROJ" | sed 's/.*= //;s/;//;s/ //g')

if [[ -z "$CURRENT" ]]; then
  echo "Error: Could not read MARKETING_VERSION from $PBXPROJ" >&2
  exit 1
fi

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"
PATCH=${PATCH:-0}

BUMP_TYPE="${1:-patch}"

case "$BUMP_TYPE" in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
  *)
    echo "Usage: $0 [major|minor|patch]" >&2
    exit 1
    ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"

# Replace all MARKETING_VERSION occurrences
sed -i '' "s/MARKETING_VERSION = ${CURRENT};/MARKETING_VERSION = ${NEW_VERSION};/g" "$PBXPROJ"

# Bump CURRENT_PROJECT_VERSION (build number) — increment by 1
BUILD_NUM=$(grep -m1 'CURRENT_PROJECT_VERSION' "$PBXPROJ" | sed 's/.*= //;s/;//;s/ //g')
NEW_BUILD=$((BUILD_NUM + 1))
sed -i '' "s/CURRENT_PROJECT_VERSION = ${BUILD_NUM};/CURRENT_PROJECT_VERSION = ${NEW_BUILD};/g" "$PBXPROJ"

echo "iOS version bumped: ${CURRENT} -> ${NEW_VERSION} (build ${BUILD_NUM} -> ${NEW_BUILD})"
