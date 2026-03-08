#!/usr/bin/env tsx
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const MOBILE_DIR = resolve(ROOT, 'apps/mobile');
const APP_BUNDLE_ID = process.env.QA_IOS_BUNDLE_ID || 'com.rud.tempotune';
const APP_BUNDLE_PATH =
  process.env.QA_IOS_APP ||
  resolve(
    MOBILE_DIR,
    'ios/build/Build/Products/Debug-iphonesimulator/TempoTune.app'
  );
const SKIP_BUILD_IF_INSTALLED = process.env.QA_IOS_SIMULATOR_SKIP_BUILD === '1';

type BootedSimulator = {
  name: string;
  udid: string;
};

function exec(cmd: string, cwd = ROOT): string | null {
  try {
    return execSync(cmd, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

function run(cmd: string, cwd = ROOT) {
  execSync(cmd, {
    cwd,
    stdio: 'inherit',
  });
}

function getBootedSimulators(): BootedSimulator[] {
  const raw = exec('xcrun simctl list devices booted --json');
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as {
      devices: Record<
        string,
        Array<{ name: string; udid: string; state: string }>
      >;
    };

    const sims: BootedSimulator[] = [];
    for (const devices of Object.values(parsed.devices)) {
      for (const device of devices) {
        if (device.state === 'Booted') {
          sims.push({ name: device.name, udid: device.udid });
        }
      }
    }
    return sims;
  } catch {
    return [];
  }
}

function isInstalledOnSimulator(udid: string): boolean {
  return !!exec(`xcrun simctl get_app_container ${udid} ${APP_BUNDLE_ID} app`);
}

function grantMicrophonePermission(udid: string) {
  exec(`xcrun simctl privacy ${udid} grant microphone ${APP_BUNDLE_ID}`);
}

function terminateApp(udid: string) {
  exec(`xcrun simctl terminate ${udid} ${APP_BUNDLE_ID}`);
}

const preferredUdid = process.env.QA_IOS_SIMULATOR_UDID;
const bootedSimulators = getBootedSimulators();
const target = preferredUdid
  ? bootedSimulators.find((sim) => sim.udid === preferredUdid)
  : bootedSimulators[0];

if (!target) {
  console.error('✗ No booted iOS simulator found.');
  console.error('  Boot a simulator first or run: pnpm qa:device:ios-sim');
  process.exit(1);
}

const appInstalled = isInstalledOnSimulator(target.udid);
const appBuilt = existsSync(APP_BUNDLE_PATH);

console.log('iOS Simulator App Preparation\n');
console.log(`Simulator: ${target.name} (${target.udid})`);
console.log(`Bundle ID: ${APP_BUNDLE_ID}`);
console.log(`Bundle path: ${APP_BUNDLE_PATH}\n`);

grantMicrophonePermission(target.udid);

if (appInstalled) {
  terminateApp(target.udid);
  if (SKIP_BUILD_IF_INSTALLED) {
    console.log(
      appBuilt
        ? '✓ Simulator already has the app installed and the .app bundle exists'
        : '✓ Simulator already has the app installed'
    );
    process.exit(0);
  }
}

console.log('→ Building and installing the app on the booted simulator...');
run(
  `pnpm --filter @tempo-tune/mobile exec react-native run-ios --udid ${target.udid} --no-packager --buildFolder ios/build`,
  MOBILE_DIR
);

if (!isInstalledOnSimulator(target.udid)) {
  console.error(
    `\n✗ App was built but not installed on simulator ${target.name}`
  );
  process.exit(1);
}

grantMicrophonePermission(target.udid);
terminateApp(target.udid);

if (!existsSync(APP_BUNDLE_PATH)) {
  console.log(
    '\n○ App installed successfully, but no reusable .app bundle was found at the default path'
  );
  console.log('  Appium will use bundleId-based launch for the simulator path');
}

console.log('\n✓ iOS simulator app is ready for Appium');
