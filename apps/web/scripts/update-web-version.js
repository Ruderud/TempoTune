#!/usr/bin/env node

/**
 * Interactive version update script for TempoTune web app.
 *
 * Updates the version field in apps/web/package.json.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON = path.join(ROOT, 'package.json');

function readPackageVersion() {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  return pkg.version;
}

function bumpPatch(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  const currentVersion = readPackageVersion();
  const suggestedVersion = bumpPatch(currentVersion);

  console.log(`\nTempoTune Web — Version Update`);
  console.log(`Current version: ${currentVersion}\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const nextVersion = (await ask(rl, `Next version [${suggestedVersion}]: `)).trim() || suggestedVersion;

  if (!/^\d+\.\d+\.\d+$/.test(nextVersion)) {
    console.error('Error: Version must follow semver format (e.g. 1.2.3)');
    rl.close();
    process.exit(1);
  }

  rl.close();

  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  pkg.version = nextVersion;
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  console.log(`\n  ✓ package.json → ${nextVersion}`);
  console.log(`\nDone! Version updated to ${nextVersion}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
