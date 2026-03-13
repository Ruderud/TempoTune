#!/usr/bin/env tsx
import { execSync } from 'node:child_process';
import { loadQaEnv } from './load-qa-env';
import {
  discoverAllTargets,
  type MobileTarget,
} from './discover-mobile-targets';

loadQaEnv();

type CleanupOptions = {
  androidAppId?: string;
  iosAppBundleId?: string;
  iosWdaBundleId?: string;
  shutdownAndroidEmulators?: boolean;
  shutdownSimulators?: boolean;
  terminateApp?: boolean;
  terminateWda?: boolean;
};

type CleanupOutcome = {
  target: MobileTarget;
  actions: string[];
};

function exec(command: string): boolean {
  try {
    execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return true;
  } catch {
    return false;
  }
}

function getBooleanEnv(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;
  return raw === '1' || raw.toLowerCase() === 'true';
}

function uniqueTargets(targets: MobileTarget[]): MobileTarget[] {
  return Array.from(new Map(targets.map((target) => [target.udid, target])).values());
}

function cleanupIosTarget(
  target: MobileTarget,
  iosAppBundleId: string,
  iosWdaBundleId: string,
  terminateApp: boolean,
  terminateWda: boolean,
  shutdownSimulators: boolean
): string[] {
  const actions: string[] = [];
  const terminate =
    target.type === 'device'
      ? (bundleId: string) =>
          exec(
            `xcrun devicectl device process terminate --device ${target.udid} ${bundleId}`
          )
      : (bundleId: string) =>
          exec(`xcrun simctl terminate ${target.udid} ${bundleId}`);

  if (terminateApp && terminate(iosAppBundleId)) {
    actions.push(`terminated app ${iosAppBundleId}`);
  }

  if (terminateWda) {
    for (const bundleId of [iosWdaBundleId, `${iosWdaBundleId}.xctrunner`]) {
      if (terminate(bundleId)) {
        actions.push(`terminated ${bundleId}`);
      }
    }
  }

  if (shutdownSimulators && target.type === 'simulator') {
    if (exec(`xcrun simctl shutdown ${target.udid}`)) {
      actions.push('shutdown simulator');
    }
  }

  return actions;
}

function cleanupAndroidTarget(
  target: MobileTarget,
  androidAppId: string,
  terminateApp: boolean,
  shutdownAndroidEmulators: boolean
): string[] {
  const actions: string[] = [];

  if (
    terminateApp &&
    exec(`adb -s ${target.udid} shell am force-stop ${androidAppId}`)
  ) {
    actions.push(`force-stopped ${androidAppId}`);
  }

  if (
    shutdownAndroidEmulators &&
    target.type === 'emulator' &&
    exec(`adb -s ${target.udid} emu kill`)
  ) {
    actions.push('shutdown emulator');
  }

  return actions;
}

export function cleanupMobileTargets(
  targets: MobileTarget[],
  options: CleanupOptions = {}
): CleanupOutcome[] {
  const iosAppBundleId =
    options.iosAppBundleId || process.env.QA_IOS_BUNDLE_ID || 'com.rud.tempotune';
  const iosWdaBundleId =
    options.iosWdaBundleId ||
    process.env.QA_IOS_UPDATED_WDA_BUNDLE_ID ||
    process.env.QA_IOS_WDA_BUNDLE_ID ||
    `${iosAppBundleId}.wda`;
  const androidAppId =
    options.androidAppId ||
    process.env.QA_ANDROID_APP_PACKAGE ||
    process.env.QA_ANDROID_APP_ID ||
    process.env.QA_ANDROID_PACKAGE ||
    'com.tempotune';
  const terminateApp =
    options.terminateApp ?? getBooleanEnv('QA_CLEANUP_APP_AFTER_RUN', true);
  const terminateWda =
    options.terminateWda ?? getBooleanEnv('QA_CLEANUP_WDA_AFTER_RUN', true);
  const shutdownAndroidEmulators =
    options.shutdownAndroidEmulators ??
    getBooleanEnv('QA_ANDROID_SHUTDOWN_EMULATOR_AFTER_RUN', false);
  const shutdownSimulators =
    options.shutdownSimulators ??
    getBooleanEnv('QA_IOS_SHUTDOWN_SIMULATOR_AFTER_RUN', false);

  return uniqueTargets(targets).map((target) => {
    const actions =
      target.platform === 'ios'
        ? cleanupIosTarget(
            target,
            iosAppBundleId,
            iosWdaBundleId,
            terminateApp,
            terminateWda,
            shutdownSimulators
          )
        : cleanupAndroidTarget(
            target,
            androidAppId,
            terminateApp,
            shutdownAndroidEmulators
          );

    return { target, actions };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const targets = discoverAllTargets();
  const outcomes = cleanupMobileTargets(targets);

  if (outcomes.length === 0) {
    console.log('No mobile targets found for cleanup.');
    process.exit(0);
  }

  console.log('Mobile target cleanup\n');
  for (const outcome of outcomes) {
    const summary =
      outcome.actions.length > 0 ? outcome.actions.join(', ') : 'nothing to clean up';
    console.log(
      `- ${outcome.target.name} (${outcome.target.platform}/${outcome.target.type}): ${summary}`
    );
  }
}
