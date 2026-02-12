#!/usr/bin/env node

/**
 * Auto-bump patch version for TempoTune web app.
 * Called by husky pre-commit hook on main branch.
 *
 * Bumps the patch version in apps/web/package.json and stages it.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PACKAGE_JSON = path.resolve(__dirname, '..', 'package.json');

function main() {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  const [major, minor, patch] = pkg.version.split('.').map(Number);
  const next = `${major}.${minor}.${patch + 1}`;

  pkg.version = next;
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  // Stage the updated package.json so it's included in the current commit
  execSync('git add apps/web/package.json', {
    cwd: path.resolve(__dirname, '..', '..', '..'),
    stdio: 'inherit',
  });

  console.log(`[web] auto-bumped version: ${major}.${minor}.${patch} → ${next}`);
}

main();
