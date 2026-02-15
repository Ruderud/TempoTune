#!/usr/bin/env bash
set -euo pipefail

# TempoTune UI Quality Guardrails
# This script enforces static UI quality rules for the codebase.

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

ISSUES_COUNT=0
CHECKS_PASSED=0
CHECKS_FAILED=0

echo "════════════════════════════════════════════════════════"
echo "  TempoTune UI Quality Guardrails"
echo "════════════════════════════════════════════════════════"
echo ""

# Helper function to print results
print_result() {
  local check_name="$1"
  local status="$2"
  local details="${3:-}"

  if [ "$status" = "PASS" ]; then
    echo -e "${GREEN}✓${NC} $check_name"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo -e "${RED}✗${NC} $check_name"
    if [ -n "$details" ]; then
      echo -e "${YELLOW}  $details${NC}"
    fi
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
  fi
}

# Rule 1: No hardcoded years/versions in source
echo "Checking Rule 1: No hardcoded years in source files..."
YEAR_PATTERN='202[3-5]'
YEAR_MATCHES=$(grep -rn -E "$YEAR_PATTERN" \
  --include="*.tsx" \
  --include="*.ts" \
  --include="*.css" \
  --include="*.html" \
  --exclude-dir="node_modules" \
  --exclude-dir=".next" \
  --exclude-dir="dist" \
  --exclude="package.json" \
  --exclude="package-lock.json" \
  --exclude="pnpm-lock.yaml" \
  --exclude="CHANGELOG.md" \
  apps/web docs/mockups 2>/dev/null || true)

if [ -z "$YEAR_MATCHES" ]; then
  print_result "No hardcoded years (2023-2025)" "PASS"
else
  COUNT=$(echo "$YEAR_MATCHES" | wc -l | tr -d ' ')
  ISSUES_COUNT=$((ISSUES_COUNT + COUNT))
  print_result "No hardcoded years (2023-2025)" "FAIL" "$COUNT issue(s) found:"
  echo "$YEAR_MATCHES" | while read -r line; do
    echo "    $line"
  done
fi
echo ""

# Rule 2: No bare href="#" without data-route
echo "Checking Rule 2: No bare href=\"#\" links (without data-route)..."
BARE_HREF=$(grep -rn 'href="#"' \
  --include="*.tsx" \
  --include="*.html" \
  --exclude-dir="node_modules" \
  --exclude-dir=".next" \
  --exclude-dir="dist" \
  apps/web docs/mockups 2>/dev/null | grep -v 'data-route=' || true)

if [ -z "$BARE_HREF" ]; then
  print_result "No bare href=\"#\" links (without data-route)" "PASS"
else
  COUNT=$(echo "$BARE_HREF" | wc -l | tr -d ' ')
  ISSUES_COUNT=$((ISSUES_COUNT + COUNT))
  print_result "No bare href=\"#\" links (without data-route)" "FAIL" "$COUNT issue(s) found:"
  echo "$BARE_HREF" | while read -r line; do
    echo "    $line"
  done
fi
echo ""

# Rule 3: No sub-12px text classes
echo "Checking Rule 3: No text smaller than 12px (text-[8-11px])..."
SMALL_TEXT=$(grep -rn -E 'text-\[(8|9|10|11)px\]' \
  --include="*.tsx" \
  --include="*.ts" \
  --include="*.css" \
  --include="*.html" \
  --exclude-dir="node_modules" \
  --exclude-dir=".next" \
  --exclude-dir="dist" \
  apps/web docs/mockups 2>/dev/null || true)

if [ -z "$SMALL_TEXT" ]; then
  print_result "No text smaller than 12px" "PASS"
else
  COUNT=$(echo "$SMALL_TEXT" | wc -l | tr -d ' ')
  ISSUES_COUNT=$((ISSUES_COUNT + COUNT))
  print_result "No text smaller than 12px" "FAIL" "$COUNT issue(s) found:"
  echo "$SMALL_TEXT" | while read -r line; do
    echo "    $line"
  done
fi
echo ""

# Rule 4: Check for minimum touch targets (informational)
echo "Checking Rule 4: Touch target documentation (informational)..."
TOUCH_TARGETS=$(grep -rn -E '(min-h-\[44px\]|h-11|min-w-\[44px\]|w-11)' \
  --include="*.tsx" \
  --include="*.html" \
  --exclude-dir="node_modules" \
  --exclude-dir=".next" \
  apps/web docs/mockups 2>/dev/null || true)

if [ -n "$TOUCH_TARGETS" ]; then
  COUNT=$(echo "$TOUCH_TARGETS" | wc -l | tr -d ' ')
  print_result "Touch targets documented in $COUNT locations" "PASS"
else
  print_result "Touch targets: verify manually" "PASS" "No automatic size constraints found (check manually)"
fi
echo ""

# Rule 5: No hardcoded blue color remnants
echo "Checking Rule 5: No hardcoded blue colors from old design..."
BLUE_COLORS=$(grep -rn -E '(blue-400|blue-500|blue-600|#3b82f6|#2563eb|#60a5fa)' \
  --include="*.tsx" \
  --include="*.ts" \
  --include="*.css" \
  --exclude-dir="node_modules" \
  --exclude-dir=".next" \
  --exclude-dir="dist" \
  apps/web 2>/dev/null || true)

if [ -z "$BLUE_COLORS" ]; then
  print_result "No hardcoded blue colors" "PASS"
else
  COUNT=$(echo "$BLUE_COLORS" | wc -l | tr -d ' ')
  ISSUES_COUNT=$((ISSUES_COUNT + COUNT))
  print_result "No hardcoded blue colors" "FAIL" "$COUNT issue(s) found:"
  echo "$BLUE_COLORS" | while read -r line; do
    echo "    $line"
  done
fi
echo ""

# Summary
echo "════════════════════════════════════════════════════════"
echo "  Summary"
echo "════════════════════════════════════════════════════════"
echo -e "Checks Passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Checks Failed: ${RED}$CHECKS_FAILED${NC}"
echo -e "Total Issues:  ${RED}$ISSUES_COUNT${NC}"
echo ""

if [ "$ISSUES_COUNT" -gt 0 ]; then
  echo -e "${RED}UI Quality checks failed. Please fix the issues above.${NC}"
  exit 1
else
  echo -e "${GREEN}All UI Quality checks passed!${NC}"
  exit 0
fi
