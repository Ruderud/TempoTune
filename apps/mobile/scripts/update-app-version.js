#!/usr/bin/env node

/**
 * Interactive version update script for TempoTune mobile app.
 *
 * Updates version across:
 *   - apps/mobile/package.json
 *   - apps/mobile/android/app/build.gradle (versionCode, versionName)
 *   - apps/mobile/ios/TempoTune.xcodeproj/project.pbxproj (MARKETING_VERSION, CURRENT_PROJECT_VERSION)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON = path.join(ROOT, 'package.json');
const BUILD_GRADLE = path.join(ROOT, 'android', 'app', 'build.gradle');
const PBXPROJ = path.join(ROOT, 'ios', 'TempoTune.xcodeproj', 'project.pbxproj');

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

function parseArgs(argv) {
  const parsed = {
    version: process.env.TEMPO_TUNE_MARKETING_VERSION || '',
    buildNumber: process.env.TEMPO_TUNE_BUILD_NUMBER || '',
    yes: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--yes') {
      parsed.yes = true;
      continue;
    }

    if (arg === '--version') {
      parsed.version = argv[index + 1] || '';
      index += 1;
      continue;
    }

    if (arg === '--build-number') {
      parsed.buildNumber = argv[index + 1] || '';
      index += 1;
    }
  }

  return parsed;
}

function updatePackageJson(version) {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  pkg.version = version;
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log(`  ✓ package.json → ${version}`);
}

function updateBuildGradle(versionName, versionCode) {
  let content = fs.readFileSync(BUILD_GRADLE, 'utf8');

  content = content.replace(
    /versionCode\s+\d+/,
    `versionCode ${versionCode}`,
  );
  content = content.replace(
    /versionName\s+"[^"]+"/,
    `versionName "${versionName}"`,
  );

  fs.writeFileSync(BUILD_GRADLE, content, 'utf8');
  console.log(`  ✓ build.gradle → versionName="${versionName}", versionCode=${versionCode}`);
}

function updatePbxproj(versionName, buildNumber) {
  let content = fs.readFileSync(PBXPROJ, 'utf8');

  content = content.replace(
    /MARKETING_VERSION = [^;]+;/g,
    `MARKETING_VERSION = ${versionName};`,
  );
  content = content.replace(
    /CURRENT_PROJECT_VERSION = [^;]+;/g,
    `CURRENT_PROJECT_VERSION = ${buildNumber};`,
  );

  fs.writeFileSync(PBXPROJ, content, 'utf8');
  console.log(`  ✓ project.pbxproj → MARKETING_VERSION=${versionName}, CURRENT_PROJECT_VERSION=${buildNumber}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const currentVersion = readPackageVersion();
  const suggestedVersion = bumpPatch(currentVersion);

  console.log(`\nTempoTune Mobile — Version Update`);
  console.log(`Current version: ${currentVersion}\n`);
  let nextVersion = args.version.trim();
  let buildNumber = args.buildNumber.trim();

  if (!args.yes || !nextVersion || !buildNumber) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    nextVersion =
      nextVersion ||
      (await ask(rl, `Next version [${suggestedVersion}]: `)).trim() ||
        suggestedVersion;

    const currentBuildGradle = fs.readFileSync(BUILD_GRADLE, 'utf8');
    const currentVersionCode =
      currentBuildGradle.match(/versionCode\s+(\d+)/)?.[1] || '1';
    const suggestedBuildNumber = Number(currentVersionCode) + 1;

    buildNumber =
      buildNumber ||
      (await ask(rl, `Build number [${suggestedBuildNumber}]: `)).trim() ||
        String(suggestedBuildNumber);

    rl.close();
  }

  // Validate semver format
  if (!/^\d+\.\d+\.\d+$/.test(nextVersion)) {
    console.error('Error: Version must follow semver format (e.g. 1.2.3)');
    process.exit(1);
  }

  if (!/^\d+$/.test(buildNumber)) {
    console.error('Error: Build number must be a positive integer');
    process.exit(1);
  }

  console.log(`\nUpdating to v${nextVersion} (build ${buildNumber})...\n`);

  updatePackageJson(nextVersion);
  updateBuildGradle(nextVersion, buildNumber);
  updatePbxproj(nextVersion, buildNumber);

  console.log(`\nDone! Version updated to ${nextVersion} (build ${buildNumber})\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
