#!/usr/bin/env tsx
/**
 * check-mobile-preflight.ts
 * Validates that all prerequisites for mobile device E2E testing are met.
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const APPIUM_HOME = resolve(ROOT, '.appium');
const targetPlatform = process.env.QA_PLATFORM || 'all';
const deviceMode = process.env.QA_DEVICE_MODE || 'all';
const setupCommand =
  targetPlatform === 'ios'
    ? deviceMode === 'connected'
      ? 'pnpm qa:setup:device:ios-real'
      : 'pnpm qa:setup:device:ios-sim'
    : targetPlatform === 'android'
      ? deviceMode === 'connected'
        ? 'pnpm qa:setup:device:android-real'
        : 'pnpm qa:setup:device:android-emu'
    : 'pnpm qa:setup:device';
const requiredDrivers = (
  process.env.QA_REQUIRED_APPIUM_DRIVERS ||
  (targetPlatform === 'ios'
    ? 'xcuitest'
    : targetPlatform === 'android'
      ? 'uiautomator2'
      : '')
)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  required: boolean;
}

function which(cmd: string): string | null {
  try {
    return execSync(`which ${cmd}`, { encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

function exec(cmd: string): string | null {
  try {
    return execSync(cmd, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

const checks: CheckResult[] = [];

// ─── Common Tools ───

const nodeVersion = exec('node --version');
checks.push({
  name: 'Node.js',
  passed: !!nodeVersion,
  message: nodeVersion || 'Not found',
  required: true,
});

const pnpmVersion = exec('pnpm --version');
checks.push({
  name: 'pnpm',
  passed: !!pnpmVersion,
  message: pnpmVersion || 'Not found',
  required: true,
});

// ─── Appium ───

const appiumPath = exec(
  'pnpm --filter @tempo-tune/mobile exec appium --version'
);
checks.push({
  name: 'Appium (via mobile devDep)',
  passed: !!appiumPath,
  message: appiumPath || 'Not installed. Run: pnpm install',
  required: true,
});

// ─── Appium Drivers ───

const appiumHome = existsSync(APPIUM_HOME);
checks.push({
  name: 'APPIUM_HOME (.appium/)',
  passed: appiumHome,
  message: appiumHome ? APPIUM_HOME : `Not found. Run: ${setupCommand}`,
  required: true,
});

if (appiumHome) {
  const driverList = exec(
    `APPIUM_HOME=${APPIUM_HOME} pnpm --filter @tempo-tune/mobile exec appium driver list --installed --json`
  );
  let drivers: Record<string, unknown> = {};
  try {
    if (driverList) drivers = JSON.parse(driverList);
  } catch {
    /* ignore */
  }

  checks.push({
    name: 'Appium UiAutomator2 driver',
    passed: 'uiautomator2' in drivers,
    message:
      'uiautomator2' in drivers
        ? 'Installed'
        : `Not installed. Run: ${setupCommand}`,
    required: requiredDrivers.includes('uiautomator2'),
  });

  checks.push({
    name: 'Appium XCUITest driver',
    passed: 'xcuitest' in drivers,
    message:
      'xcuitest' in drivers
        ? 'Installed'
        : `Not installed. Run: ${setupCommand}`,
    required: requiredDrivers.includes('xcuitest'),
  });
}

// ─── Android ───

const adbPath = which('adb');
checks.push({
  name: 'adb (Android SDK)',
  passed: !!adbPath,
  message: adbPath || 'Not found. Install Android SDK Platform Tools',
  required: targetPlatform === 'android',
});

if (adbPath) {
  const devices = exec('adb devices -l');
  const deviceLines = (devices || '')
    .split('\n')
    .filter((l) => l.includes('device') && !l.startsWith('List'));
  checks.push({
    name: 'Android devices/emulators',
    passed: deviceLines.length > 0,
    message:
      deviceLines.length > 0
        ? `${deviceLines.length} device(s) connected`
        : 'No devices connected',
    required: false,
  });
}

const javaVersion = exec('java -version 2>&1');
checks.push({
  name: 'Java (for UiAutomator2)',
  passed: !!javaVersion,
  message: javaVersion ? javaVersion.split('\n')[0] : 'Not found',
  required: targetPlatform === 'android',
});

// ─── iOS ───

const xcrunPath = which('xcrun');
checks.push({
  name: 'xcrun (Xcode CLI)',
  passed: !!xcrunPath,
  message: xcrunPath || 'Not found (macOS only)',
  required: targetPlatform === 'ios',
});

const xcodebuildPath = which('xcodebuild');
checks.push({
  name: 'xcodebuild',
  passed: !!xcodebuildPath,
  message: xcodebuildPath || 'Not found. Install Xcode',
  required: targetPlatform === 'ios',
});

if (xcrunPath) {
  const simulators = exec('xcrun simctl list devices booted --json');
  let bootedCount = 0;
  try {
    if (simulators) {
      const parsed = JSON.parse(simulators);
      for (const runtime of Object.values(parsed.devices) as Array<
        Array<{ state: string }>
      >) {
        bootedCount += runtime.filter((d) => d.state === 'Booted').length;
      }
    }
  } catch {
    /* ignore */
  }

  checks.push({
    name: 'iOS simulators (booted)',
    passed: bootedCount > 0,
    message:
      bootedCount > 0
        ? `${bootedCount} simulator(s) booted`
        : 'No booted simulators',
    required: false,
  });
}

// ─── Report ───

console.log('Mobile Device Preflight Check\n');

let hasRequiredFailure = false;
for (const check of checks) {
  const icon = check.passed ? '✓' : check.required ? '✗' : '○';
  const tag = check.required ? '' : ' (optional)';
  console.log(`  ${icon} ${check.name}${tag}: ${check.message}`);
  if (!check.passed && check.required) hasRequiredFailure = true;
}

const optionalPassed = checks.filter((c) => !c.required && c.passed).length;
const optionalTotal = checks.filter((c) => !c.required).length;

console.log(`\nRequired: ${hasRequiredFailure ? '✗ FAIL' : '✓ PASS'}`);
console.log(`Optional: ${optionalPassed}/${optionalTotal} available`);

if (hasRequiredFailure) {
  console.log(
    '\n✗ Required prerequisites not met. Fix the above issues before running device tests.'
  );
  process.exit(1);
}

console.log('\n✓ Preflight passed. Ready for device testing.');
