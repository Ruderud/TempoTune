#!/usr/bin/env tsx
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadQaEnv } from './load-qa-env';
import { resolveIosRealDeviceSigningContext } from './ios-real-device-signing';

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

const signing = resolveIosRealDeviceSigningContext();

for (const note of signing.notes) {
  console.log(`○ ${note}`);
}

const env: Record<string, string> = {
  QA_PLATFORM: 'ios',
  QA_DEVICE_MODE: 'connected',
  QA_REQUIRED_APPIUM_DRIVERS: 'xcuitest',
  QA_IOS_BUNDLE_ID: signing.appBundleId,
  QA_IOS_UPDATED_WDA_BUNDLE_ID: signing.updatedWdaBundleId,
  QA_IOS_XCODE_SIGNING_ID: signing.signingId,
  QA_IOS_USE_NEW_WDA: process.env.QA_IOS_USE_NEW_WDA || '1',
  QA_USE_DEV_WEB_URL: '1',
  QA_ENABLE_WEBVIEW_DEBUGGING: '1',
  QA_REQUIRE_WEB_SERVER: '1',
  QA_SKIP_METRO_REQUIREMENT: '1',
  QA_IOS_SHUTDOWN_SIMULATOR_AFTER_RUN:
    process.env.QA_IOS_SHUTDOWN_SIMULATOR_AFTER_RUN || '1',
};

if (signing.teamId) {
  env.QA_IOS_XCODE_ORG_ID = signing.teamId;
}

console.log('iOS Real Device QA Runner\n');
console.log(`App bundle: ${signing.appBundleId}`);
console.log(`WDA bundle: ${signing.updatedWdaBundleId}`);
console.log(`Signing: ${signing.signingId}`);
console.log(`Team: ${signing.teamId ?? 'unresolved'}\n`);

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
  'Prepare iOS real-device QA app',
  ['exec', 'tsx', 'scripts/qa/prepare-ios-real-device-app.ts'],
  env
);
runStep(
  'WDA real-device signing probe',
  ['exec', 'tsx', 'scripts/qa/check-ios-real-device-wda.ts'],
  env
);
runStep(
  'Appium real-device smoke',
  ['exec', 'tsx', 'scripts/qa/run-appium.ts', ...passthroughArgs],
  env
);
