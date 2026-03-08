#!/usr/bin/env tsx
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const MOBILE_DIR = resolve(ROOT, 'apps/mobile');

type ConnectedDevice = {
  name: string;
  udid: string;
  osVersion?: string;
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

function run(cmd: string, cwd = ROOT, env?: NodeJS.ProcessEnv) {
  execSync(cmd, {
    cwd,
    env: {
      ...process.env,
      ...env,
    },
    stdio: 'inherit',
  });
}

function getConnectedIosDevices(): ConnectedDevice[] {
  const raw = exec('xcrun xctrace list devices 2>/dev/null');
  if (!raw) return [];

  const devices: ConnectedDevice[] = [];
  const lines = raw.split('\n');
  let inDevices = false;

  for (const line of lines) {
    if (line.includes('== Devices ==')) {
      inDevices = true;
      continue;
    }
    if (line.includes('== Simulators ==')) {
      break;
    }
    if (!inDevices || !line.trim()) {
      continue;
    }

    const match = line.match(
      /^(.+?)\s+\((\d+\.\d+(?:\.\d+)?)\)\s+\(([A-F0-9-]+)\)$/
    );
    if (!match) {
      continue;
    }

    const [, name, osVersion, udid] = match;
    devices.push({
      name: name.trim(),
      udid,
      osVersion,
    });
  }

  return devices;
}

function selectTargetDevice(): ConnectedDevice {
  const preferredUdid = process.env.QA_DEVICE_UDID?.trim();
  const connectedDevices = getConnectedIosDevices();

  if (connectedDevices.length === 0) {
    console.error('✗ No connected iOS real device found.');
    process.exit(1);
  }

  if (preferredUdid) {
    const preferred = connectedDevices.find((device) => device.udid === preferredUdid);
    if (!preferred) {
      console.error(`✗ Requested iOS device UDID not found: ${preferredUdid}`);
      process.exit(1);
    }
    return preferred;
  }

  return connectedDevices[0];
}

function isInstalledOnDevice(udid: string, bundleId: string): boolean {
  const output = exec(
    `xcrun devicectl device info apps --device ${udid} --bundle-id ${bundleId}`
  );

  return !!output && output.includes(bundleId);
}

function terminateApp(udid: string, bundleId: string) {
  exec(`xcrun devicectl device process terminate --device ${udid} ${bundleId}`);
}

const target = selectTargetDevice();
const bundleId = process.env.QA_IOS_BUNDLE_ID || 'com.rud.tempotune';
const buildPath = resolve(
  MOBILE_DIR,
  'ios/build-qa/Build/Products/Release-iphoneos/TempoTune.app'
);
const buildEnv = {
  QA_USE_DEV_WEB_URL: '1',
  QA_ENABLE_WEBVIEW_DEBUGGING: '1',
  ...(process.env.QA_WEB_URL ? { QA_WEB_URL: process.env.QA_WEB_URL } : {}),
};

console.log('iOS Real Device App Preparation\n');
console.log(`Device: ${target.name} (${target.udid})`);
if (target.osVersion) {
  console.log(`OS: ${target.osVersion}`);
}
console.log(`Bundle ID: ${bundleId}`);
console.log(`Build output: ${buildPath}`);
console.log('Build: Release + embedded JS bundle');
console.log('WebView: dev URL + inspectable enabled\n');

run('bash scripts/generate-dev-config.sh', MOBILE_DIR, buildEnv);

const xcodeOrgId =
  process.env.QA_IOS_XCODE_ORG_ID || process.env.QA_IOS_TEAM_ID;
const xcodeSigningId =
  process.env.QA_IOS_XCODE_SIGNING_ID ||
  process.env.QA_IOS_SIGNING_ID ||
  'Apple Development';

const xcodebuildArgs = [
  'xcodebuild',
  '-workspace',
  'ios/TempoTune.xcworkspace',
  '-scheme',
  'TempoTune',
  '-configuration',
  'Release',
  '-destination',
  `id=${target.udid}`,
  '-derivedDataPath',
  'ios/build-qa',
  '-allowProvisioningUpdates',
  'build',
];

if (xcodeOrgId) {
  xcodebuildArgs.splice(xcodebuildArgs.length - 1, 0, `DEVELOPMENT_TEAM=${xcodeOrgId}`);
}
if (xcodeSigningId) {
  xcodebuildArgs.splice(
    xcodebuildArgs.length - 1,
    0,
    `CODE_SIGN_IDENTITY=${xcodeSigningId}`
  );
}

run(
  xcodebuildArgs
    .map((arg) => (arg.includes(' ') ? JSON.stringify(arg) : arg))
    .join(' '),
  MOBILE_DIR,
  buildEnv
);

if (!existsSync(buildPath)) {
  console.error(`\n✗ Built .app bundle not found at ${buildPath}`);
  process.exit(1);
}

exec(`xcrun devicectl device uninstall app --device ${target.udid} ${bundleId}`);
run(
  `xcrun devicectl device install app --device ${target.udid} ${JSON.stringify(buildPath)}`
);

if (!isInstalledOnDevice(target.udid, bundleId)) {
  console.error('\n✗ App install finished, but the device does not report the bundle as installed');
  process.exit(1);
}

terminateApp(target.udid, bundleId);

console.log('\n✓ iOS real-device QA app is built and installed');
