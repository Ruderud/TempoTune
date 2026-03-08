#!/usr/bin/env tsx
import { execSync, spawnSync } from 'node:child_process';
import { closeSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverAllTargets } from './discover-mobile-targets';
import { loadQaEnv } from './load-qa-env';
import { resolveIosRealDeviceSigningContext } from './ios-real-device-signing';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const REPORT_DIR = resolve(ROOT, 'reports/qa/device');
const WDA_PROJECT = resolve(
  ROOT,
  '.appium/node_modules/appium-xcuitest-driver/node_modules/appium-webdriveragent/WebDriverAgent.xcodeproj'
);

loadQaEnv();

function run(command: string): string {
  return execSync(command, {
    cwd: ROOT,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function sanitizeSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function ensureReportDir() {
  mkdirSync(REPORT_DIR, { recursive: true });
}

console.log('iOS Real Device WDA Check\n');

const targets = discoverAllTargets().filter(
  (target) => target.platform === 'ios' && target.type === 'device'
);

if (targets.length === 0) {
  console.error('✗ No connected iOS device found.');
  process.exit(1);
}

const signing = resolveIosRealDeviceSigningContext();

for (const note of signing.notes) {
  console.log(`○ ${note}`);
}

if (!signing.teamId) {
  console.error(
    '\n✗ Unable to resolve an Apple Development team for WDA signing.'
  );
  if (signing.identities.length > 0) {
    console.error(
      `  Available Apple Development teams: ${signing.identities
        .map((identity) => identity.teamId)
        .join(', ')}`
    );
  }
  console.error(
    '  Set QA_IOS_XCODE_ORG_ID=<TEAM_ID> and make sure the matching Apple ID account is added in Xcode.'
  );
  process.exit(1);
}

const target = process.env.QA_DEVICE_UDID
  ? targets.find(
      (candidate) => candidate.udid === process.env.QA_DEVICE_UDID
    ) || targets[0]
  : targets[0];

console.log(`Target: ${target.name} (${target.udid})`);
console.log(`Team: ${signing.teamId} [${signing.teamSource}]`);
console.log(`Signing: ${signing.signingId}`);
console.log(`WDA bundle: ${signing.updatedWdaBundleId}\n`);

const command = [
  'xcodebuild',
  `-project "${WDA_PROJECT}"`,
  '-scheme WebDriverAgentRunner',
  `-destination 'id=${target.udid}'`,
  '-allowProvisioningUpdates',
  '-allowProvisioningDeviceRegistration',
  `DEVELOPMENT_TEAM=${signing.teamId}`,
  `CODE_SIGN_IDENTITY="${signing.signingId}"`,
  `PRODUCT_BUNDLE_IDENTIFIER=${signing.updatedWdaBundleId}`,
  'build-for-testing',
].join(' ');

function buildLogPath(targetName: string): string {
  ensureReportDir();
  return resolve(
    REPORT_DIR,
    `${new Date().toISOString().replace(/[:.]/g, '-')}-ios-real-wda-check-${sanitizeSegment(
      targetName
    )}.log`
  );
}

const logPath = buildLogPath(target.name);

try {
  writeFileSync(logPath, `${command}\n\n`);
  const logFd = openSync(logPath, 'a');
  const result = spawnSync(command, {
    cwd: ROOT,
    shell: true,
    stdio: ['ignore', logFd, logFd],
  });
  closeSync(logFd);

  if (result.status !== 0) {
    throw new Error(`xcodebuild exited with status ${result.status ?? 'unknown'}`);
  }

  console.log('✓ WebDriverAgent real-device signing check passed.');
  console.log(`  Log: ${logPath}`);
} catch (error) {
  let output = '';
  try {
    output = readFileSync(logPath, 'utf-8');
  } catch {
    writeFileSync(logPath, `${command}\n\n${String(error)}\n`);
    output = readFileSync(logPath, 'utf-8');
  }

  if (!output.startsWith(command)) {
    writeFileSync(logPath, `${command}\n\n${output}\n${String(error)}\n`);
    output = readFileSync(logPath, 'utf-8');
  }

  const errorLines = output
    .split('\n')
    .filter((line) => line.includes(' error: '))
    .slice(0, 8);

  console.error('✗ WebDriverAgent real-device signing check failed.');
  if (errorLines.length > 0) {
    console.error('');
    for (const line of errorLines) {
      console.error(line);
    }
  }

  if (output.includes('No Account for Team')) {
    console.error('');
    console.error(
      `Next step: open Xcode > Settings > Accounts and add/sign in to the Apple ID for team ${signing.teamId}.`
    );
  }

  if (output.includes('No profiles for')) {
    console.error(
      `Next step: make sure Xcode can create a development profile for ${signing.updatedWdaBundleId}.xctrunner.`
    );
  }

  if (output.includes('No signing certificate')) {
    console.error(
      `Next step: verify an '${signing.signingId}' certificate with private key is available to Xcode for team ${signing.teamId}.`
    );
  }

  console.error(`Full log: ${logPath}`);
  process.exit(1);
}
