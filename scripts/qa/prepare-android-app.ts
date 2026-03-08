#!/usr/bin/env tsx
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadQaEnv } from './load-qa-env';
import {
  discoverAndroidTargets,
  type MobileTarget,
} from './discover-mobile-targets';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const MOBILE_DIR = resolve(ROOT, 'apps/mobile');
const ANDROID_DIR = resolve(MOBILE_DIR, 'android');

loadQaEnv();

const APP_PACKAGE =
  process.env.QA_ANDROID_APP_PACKAGE ||
  process.env.QA_ANDROID_APP_ID ||
  'com.tempotune';
const APP_ACTIVITY =
  process.env.QA_ANDROID_APP_ACTIVITY || 'com.tempotune.MainActivity';
const APK_PATH =
  process.env.QA_ANDROID_APK ||
  resolve(ANDROID_DIR, 'app/build/outputs/apk/release/app-release.apk');

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

function selectTarget(): MobileTarget {
  const preferredUdid = process.env.QA_DEVICE_UDID?.trim();
  const deviceMode = process.env.QA_DEVICE_MODE || 'all';
  const targets = discoverAndroidTargets().filter((target) => {
    if (deviceMode === 'connected') return target.type === 'device';
    if (deviceMode === 'booted') return target.type === 'emulator';
    return true;
  });

  if (targets.length === 0) {
    console.error('✗ No matching Android device/emulator found.');
    console.error('  Check adb devices and QA_DEVICE_MODE.');
    process.exit(1);
  }

  if (preferredUdid) {
    const preferred = targets.find((target) => target.udid === preferredUdid);
    if (!preferred) {
      console.error(`✗ Requested Android target UDID not found: ${preferredUdid}`);
      process.exit(1);
    }
    return preferred;
  }

  return targets[0];
}

function isInstalled(serial: string) {
  const packages = exec(`adb -s ${serial} shell pm list packages ${APP_PACKAGE}`);
  return !!packages && packages.includes(APP_PACKAGE);
}

function grantPermission(serial: string, permission: string) {
  exec(`adb -s ${serial} shell pm grant ${APP_PACKAGE} ${permission}`);
}

function readGlobalSetting(serial: string, key: string) {
  return exec(`adb -s ${serial} shell settings get global ${key}`);
}

function writeGlobalSetting(serial: string, key: string, value: string) {
  exec(`adb -s ${serial} shell settings put global ${key} ${value}`);
}

function forceStop(serial: string) {
  exec(`adb -s ${serial} shell am force-stop ${APP_PACKAGE}`);
}

function forceStopSystemPackage(serial: string, packageName: string) {
  exec(`adb -s ${serial} shell am force-stop ${packageName}`);
}

function setupReverse(serial: string) {
  exec(`adb -s ${serial} reverse tcp:3000 tcp:3000`);
  exec(`adb -s ${serial} reverse tcp:8081 tcp:8081`);
}

function installApk(serial: string) {
  const settingKeys = ['package_verifier_enable', 'verifier_verify_adb_installs'];
  const previousSettings = Object.fromEntries(
    settingKeys.map((key) => [key, readGlobalSetting(serial, key)])
  );

  for (const key of settingKeys) {
    writeGlobalSetting(serial, key, '0');
  }

  try {
    run(`adb -s ${serial} install -r -g ${JSON.stringify(APK_PATH)}`);
  } finally {
    for (const key of settingKeys) {
      const previousValue = previousSettings[key];
      if (previousValue && previousValue !== 'null') {
        writeGlobalSetting(serial, key, previousValue);
      }
    }
  }
}

const target = selectTarget();
const buildEnv = {
  QA_USE_DEV_WEB_URL: '1',
  QA_ENABLE_WEBVIEW_DEBUGGING: '1',
  ANDROID_EMULATOR_HOST: 'localhost',
  ...(process.env.QA_WEB_URL ? { QA_WEB_URL: process.env.QA_WEB_URL } : {}),
};

console.log('Android App Preparation\n');
console.log(`Target: ${target.name} (${target.udid})`);
console.log(`Type: ${target.type}`);
if (target.osVersion) {
  console.log(`OS: Android ${target.osVersion}`);
}
console.log(`Package: ${APP_PACKAGE}`);
console.log(`Activity: ${APP_ACTIVITY}`);
console.log(`APK: ${APK_PATH}`);
console.log('Build: Release + embedded JS bundle');
console.log('WebView: QA debug enabled\n');

run('bash scripts/generate-dev-config.sh', MOBILE_DIR, buildEnv);

console.log('→ Building Android release APK...');
run('./gradlew app:assembleRelease', ANDROID_DIR, buildEnv);

if (!existsSync(APK_PATH)) {
  console.error(`\n✗ Android release APK not found at ${APK_PATH}`);
  process.exit(1);
}

console.log('\n→ Installing APK on target...');
forceStop(target.udid);
for (const packageName of [
  'com.android.vending',
  'com.google.android.gms',
  'com.google.android.packageinstaller',
  'com.samsung.android.packageinstaller',
]) {
  forceStopSystemPackage(target.udid, packageName);
}
installApk(target.udid);

if (!isInstalled(target.udid)) {
  console.error(`\n✗ App install finished, but ${APP_PACKAGE} is not reported as installed`);
  process.exit(1);
}

setupReverse(target.udid);
grantPermission(target.udid, 'android.permission.RECORD_AUDIO');
grantPermission(target.udid, 'android.permission.POST_NOTIFICATIONS');
forceStop(target.udid);

console.log('\n✓ Android QA app is built, installed, and ready for Appium');
