#!/usr/bin/env tsx
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadQaEnv } from './load-qa-env';
import { stopManagedWebDevServer } from './web-dev-server';

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
    const error = new Error(`${label} failed`) as Error & { exitCode?: number };
    error.exitCode = result.status ?? 1;
    throw error;
  }
}

const env: Record<string, string> = {
  QA_PLATFORM: 'ios',
  QA_DEVICE_MODE: 'booted',
  QA_REQUIRED_APPIUM_DRIVERS: 'xcuitest',
  QA_IOS_BUNDLE_ID: process.env.QA_IOS_BUNDLE_ID || 'com.rud.tempotune',
  QA_USE_DEV_WEB_URL: '1',
  QA_ENABLE_WEBVIEW_DEBUGGING: '1',
  QA_REQUIRE_WEB_SERVER: '1',
  QA_SKIP_METRO_REQUIREMENT: '1',
  QA_IOS_SHUTDOWN_SIMULATOR_AFTER_RUN:
    process.env.QA_IOS_SHUTDOWN_SIMULATOR_AFTER_RUN || '1',
};

if (process.env.QA_IOS_SIMULATOR_UDID) {
  env.QA_DEVICE_UDID = process.env.QA_IOS_SIMULATOR_UDID;
}

console.log('iOS Simulator QA Runner\n');
console.log(`App bundle: ${env.QA_IOS_BUNDLE_ID}`);
if (env.QA_DEVICE_UDID) {
  console.log(`Preferred simulator UDID: ${env.QA_DEVICE_UDID}`);
}
console.log('');

let exitCode = 0;

try {
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
    'Prepare iOS simulator QA app',
    ['exec', 'tsx', 'scripts/qa/prepare-ios-simulator-app.ts'],
    env
  );
  runStep(
    'Appium simulator smoke',
    ['exec', 'tsx', 'scripts/qa/run-appium.ts', ...passthroughArgs],
    env
  );
} catch (error) {
  exitCode =
    typeof error === 'object' &&
    error !== null &&
    'exitCode' in error &&
    typeof error.exitCode === 'number'
      ? error.exitCode
      : 1;

  if (error instanceof Error) {
    console.error(`\n✗ ${error.message}`);
  } else {
    console.error(`\n✗ ${String(error)}`);
  }
} finally {
  const managedServer = stopManagedWebDevServer();
  if (managedServer.stopped) {
    console.log('\n→ Stopped managed Next.js dev server');
  }
}

process.exit(exitCode);
