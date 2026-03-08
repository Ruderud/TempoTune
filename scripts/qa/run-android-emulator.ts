#!/usr/bin/env tsx
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadQaEnv } from './load-qa-env';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const passthroughArgs = process.argv.slice(2);

loadQaEnv();

function runStep(label: string, args: string[], env: Record<string, string>) {
  console.log(`\n→ ${label}`);
  const result = spawnSync('pnpm', args, {
    cwd: ROOT,
    env: {
      ...process.env,
      ...env,
    },
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const env: Record<string, string> = {
  QA_PLATFORM: 'android',
  QA_DEVICE_MODE: 'booted',
  QA_REQUIRED_APPIUM_DRIVERS: 'uiautomator2',
  QA_ANDROID_APP_PACKAGE:
    process.env.QA_ANDROID_APP_PACKAGE ||
    process.env.QA_ANDROID_APP_ID ||
    'com.tempotune',
  QA_ANDROID_APP_ACTIVITY:
    process.env.QA_ANDROID_APP_ACTIVITY || 'com.tempotune.MainActivity',
  QA_ANDROID_USE_INSTALLED_APP: '1',
  QA_USE_DEV_WEB_URL: '1',
  QA_ENABLE_WEBVIEW_DEBUGGING: '1',
  QA_REQUIRE_WEB_SERVER: '1',
  QA_SKIP_METRO_REQUIREMENT: '1',
  QA_ANDROID_SHUTDOWN_EMULATOR_AFTER_RUN:
    process.env.QA_ANDROID_SHUTDOWN_EMULATOR_AFTER_RUN || '1',
  ANDROID_EMULATOR_HOST: 'localhost',
};

console.log('Android Emulator QA Runner\n');
console.log(`App package: ${env.QA_ANDROID_APP_PACKAGE}`);
console.log(`App activity: ${env.QA_ANDROID_APP_ACTIVITY}\n`);

runStep(
  'Mobile preflight',
  ['exec', 'tsx', 'scripts/qa/check-mobile-preflight.ts'],
  env
);
runStep(
  'Bootstrap local-dev-attached',
  ['exec', 'tsx', 'scripts/qa/bootstrap-device-run.ts'],
  env
);
runStep(
  'Prepare Android QA app',
  ['exec', 'tsx', 'scripts/qa/prepare-android-app.ts'],
  env
);
runStep(
  'Appium emulator smoke',
  ['exec', 'tsx', 'scripts/qa/run-appium.ts', ...passthroughArgs],
  env
);
