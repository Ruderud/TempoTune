#!/usr/bin/env bash
# ios-testflight.sh — Build and upload iOS app to TestFlight
# Usage: ./scripts/ios-testflight.sh
# Runs from project root.

set -euo pipefail

WORKSPACE="apps/mobile/ios/TempoTune.xcworkspace"
SCHEME="TempoTune"
EXPORT_OPTIONS="apps/mobile/ios/ExportOptions.plist"
ARCHIVE_PATH="apps/mobile/ios/build/TempoTune.xcarchive"
OUTPUT_DIR="apps/mobile/ios/output"
LOG_FILE="apps/mobile/ios/build/testflight-upload.log"

mkdir -p "$(dirname "$ARCHIVE_PATH")" "$OUTPUT_DIR"

# Read current version for logging
PBXPROJ="apps/mobile/ios/TempoTune.xcodeproj/project.pbxproj"
VERSION=$(grep -m1 'MARKETING_VERSION' "$PBXPROJ" | sed 's/.*= //;s/;//;s/ //g')
BUILD=$(grep -m1 'CURRENT_PROJECT_VERSION' "$PBXPROJ" | sed 's/.*= //;s/;//;s/ //g')

echo "[ios-testflight] Starting build v${VERSION} (${BUILD})..."

# Archive
echo "[ios-testflight] Archiving..."
xcodebuild archive \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -archivePath "$ARCHIVE_PATH" \
  -destination 'generic/platform=iOS' \
  -quiet \
  -allowProvisioningUpdates

# Export + Upload (ExportOptions.plist has destination=upload)
echo "[ios-testflight] Exporting and uploading to TestFlight..."
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  -exportPath "$OUTPUT_DIR" \
  -allowProvisioningUpdates

echo "[ios-testflight] v${VERSION} (${BUILD}) uploaded to TestFlight successfully!"
