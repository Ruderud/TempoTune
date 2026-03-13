#!/usr/bin/env tsx
import { execSync, spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverAllTargets, type MobileTarget } from './discover-mobile-targets';
import { loadQaEnv } from './load-qa-env';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

type OnDeviceLaneKey =
  | 'android-emu'
  | 'android-real'
  | 'ios-sim'
  | 'ios-real';
type OnDeviceAlias = 'auto' | 'connected' | 'simulator';

type LaneConfig = {
  key: OnDeviceLaneKey;
  label: string;
  description: string;
  scriptPath: string;
  available: boolean;
  availabilityReason: string;
};

type ParsedArgs = {
  target: OnDeviceLaneKey | OnDeviceAlias | null;
  listOnly: boolean;
  passthroughArgs: string[];
};

loadQaEnv();

function exec(command: string): string | null {
  try {
    return execSync(command, {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

function which(command: string): boolean {
  try {
    execSync(`which ${command}`, {
      cwd: ROOT,
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

function parseArgs(args: string[]): ParsedArgs {
  const passthroughArgs: string[] = [];
  let target: ParsedArgs['target'] = null;
  let listOnly = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--') {
      passthroughArgs.push(...args.slice(index + 1));
      break;
    }

    if (arg === '--list') {
      listOnly = true;
      continue;
    }

    if (arg === '--target') {
      target = (args[index + 1] as ParsedArgs['target']) ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith('--target=')) {
      target = arg.slice('--target='.length) as ParsedArgs['target'];
      continue;
    }

    passthroughArgs.push(arg);
  }

  return {
    target,
    listOnly,
    passthroughArgs,
  };
}

function resolveAndroidEmulatorBinary(): string | null {
  const sdkRoot =
    process.env.ANDROID_SDK_ROOT ||
    process.env.ANDROID_HOME ||
    resolve(process.env.HOME || '', 'Library/Android/sdk');
  const sdkBinary = resolve(sdkRoot, 'emulator/emulator');

  if (exec(`test -x ${JSON.stringify(sdkBinary)} && echo ok`) === 'ok') {
    return sdkBinary;
  }

  return exec('which emulator');
}

function hasAndroidEmulatorSupport() {
  const emulatorBinary = resolveAndroidEmulatorBinary();
  if (!emulatorBinary) return false;

  const avds = exec(`${JSON.stringify(emulatorBinary)} -list-avds`);
  return !!avds && avds.split('\n').some((entry) => entry.trim().length > 0);
}

function hasIosSimulatorSupport() {
  if (!which('xcrun')) return false;

  const availableDevicesJson = exec('xcrun simctl list devices available --json');
  if (!availableDevicesJson) return false;

  try {
    const parsed = JSON.parse(availableDevicesJson) as {
      devices: Record<
        string,
        Array<{ isAvailable?: boolean; availabilityError?: string }>
      >;
    };

    return Object.entries(parsed.devices).some(([runtime, devices]) => {
      if (!runtime.includes('iOS')) return false;
      return devices.some((device) => device.isAvailable !== false && !device.availabilityError);
    });
  } catch {
    return false;
  }
}

function joinTargetNames(targets: MobileTarget[]) {
  return targets.map((target) => target.name).join(', ');
}

function buildLaneConfigs(targets: MobileTarget[]): LaneConfig[] {
  const androidDevices = targets.filter(
    (target) => target.platform === 'android' && target.type === 'device'
  );
  const androidEmulators = targets.filter(
    (target) => target.platform === 'android' && target.type === 'emulator'
  );
  const iosDevices = targets.filter(
    (target) => target.platform === 'ios' && target.type === 'device'
  );
  const iosSimulators = targets.filter(
    (target) => target.platform === 'ios' && target.type === 'simulator'
  );

  const hasAndroidEmulatorLane =
    androidEmulators.length > 0 || hasAndroidEmulatorSupport();
  const hasIosSimulatorLane = iosSimulators.length > 0 || hasIosSimulatorSupport();

  return [
    {
      key: 'android-real',
      label: 'Android Connected Device',
      description:
        androidDevices.length > 0
          ? `Connected: ${joinTargetNames(androidDevices)}`
          : 'No connected Android device',
      scriptPath: 'scripts/qa/run-android-real-device.ts',
      available: androidDevices.length > 0,
      availabilityReason:
        androidDevices.length > 0
          ? 'connected device detected'
          : 'connect an Android device via adb',
    },
    {
      key: 'android-emu',
      label: 'Android Emulator',
      description:
        androidEmulators.length > 0
          ? `Booted: ${joinTargetNames(androidEmulators)}`
          : 'Will boot the first available Android AVD',
      scriptPath: 'scripts/qa/run-android-emulator.ts',
      available: hasAndroidEmulatorLane,
      availabilityReason:
        hasAndroidEmulatorLane
          ? 'emulator runner available'
          : 'install Android emulator/AVD first',
    },
    {
      key: 'ios-real',
      label: 'iOS Connected Device',
      description:
        iosDevices.length > 0
          ? `Connected: ${joinTargetNames(iosDevices)}`
          : 'No connected iPhone/iPad',
      scriptPath: 'scripts/qa/run-ios-real-device.ts',
      available: iosDevices.length > 0,
      availabilityReason:
        iosDevices.length > 0
          ? 'connected iOS device detected'
          : 'connect an iOS device first',
    },
    {
      key: 'ios-sim',
      label: 'iOS Simulator',
      description:
        iosSimulators.length > 0
          ? `Booted: ${joinTargetNames(iosSimulators)}`
          : 'Will use a booted or bootable iOS simulator',
      scriptPath: 'scripts/qa/run-ios-simulator.ts',
      available: hasIosSimulatorLane,
      availabilityReason:
        hasIosSimulatorLane
          ? 'simulator runner available'
          : 'install Xcode simulator runtimes first',
    },
  ];
}

function printLaneConfigs(lanes: LaneConfig[]) {
  console.log('On-device QA Targets\n');
  for (const lane of lanes) {
    const icon = lane.available ? '✓' : '○';
    console.log(`  ${icon} ${lane.key.padEnd(13)} ${lane.label}`);
    console.log(`    ${lane.description}`);
  }
}

function findLaneByKey(
  lanes: LaneConfig[],
  key: OnDeviceLaneKey
): LaneConfig | undefined {
  return lanes.find((lane) => lane.key === key);
}

function resolveAliasLane(
  lanes: LaneConfig[],
  alias: OnDeviceAlias
): LaneConfig | null {
  if (alias === 'auto') return null;

  const candidateKeys =
    alias === 'connected'
      ? (['android-real', 'ios-real'] as OnDeviceLaneKey[])
      : (['android-emu', 'ios-sim'] as OnDeviceLaneKey[]);

  const availableCandidates = candidateKeys
    .map((key) => findLaneByKey(lanes, key))
    .filter((lane): lane is LaneConfig => !!lane && lane.available);

  if (availableCandidates.length === 1) {
    return availableCandidates[0];
  }

  const requestedKind = alias === 'connected' ? 'connected device' : 'simulator/emulator';
  if (availableCandidates.length === 0) {
    throw new Error(`No available ${requestedKind} targets found.`);
  }

  throw new Error(
    `Multiple ${requestedKind} targets are available. Use --target with one of: ${availableCandidates
      .map((lane) => lane.key)
      .join(', ')}`
  );
}

async function promptForLane(lanes: LaneConfig[]) {
  const availableLanes = lanes.filter((lane) => lane.available);
  const rl = createInterface({ input, output });

  try {
    console.log('Select on-device QA target:\n');
    availableLanes.forEach((lane, index) => {
      console.log(`${index + 1}. ${lane.label} (${lane.key})`);
      console.log(`   ${lane.description}`);
    });

    const answer = await rl.question('\nTarget number: ');
    const selectedIndex = Number.parseInt(answer.trim(), 10) - 1;
    const selectedLane = availableLanes[selectedIndex];

    if (!selectedLane) {
      throw new Error('Invalid selection.');
    }

    return selectedLane;
  } finally {
    rl.close();
  }
}

function runLane(lane: LaneConfig, passthroughArgs: string[]) {
  console.log(`\nRunning on-device QA with ${lane.label} (${lane.key})`);
  console.log(`Details: ${lane.description}\n`);

  const result = spawnSync(
    'pnpm',
    ['exec', 'tsx', lane.scriptPath, ...passthroughArgs],
    {
      cwd: ROOT,
      env: process.env,
      stdio: 'inherit',
    }
  );

  process.exit(result.status ?? 1);
}

const rawArgs = process.argv.slice(2);
const parsedArgs = parseArgs(rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs);
const targets = discoverAllTargets();
const laneConfigs = buildLaneConfigs(targets);
const availableLanes = laneConfigs.filter((lane) => lane.available);

if (parsedArgs.listOnly) {
  printLaneConfigs(laneConfigs);
  process.exit(0);
}

if (availableLanes.length === 0) {
  printLaneConfigs(laneConfigs);
  console.error('\nNo available on-device QA target was found.');
  process.exit(1);
}

async function main() {
  if (parsedArgs.target) {
    if (parsedArgs.target === 'auto') {
      if (availableLanes.length === 1) {
        runLane(availableLanes[0], parsedArgs.passthroughArgs);
        return;
      }

      if (!input.isTTY || !output.isTTY) {
        throw new Error(
          `Multiple on-device targets are available. Use --target with one of: ${availableLanes
            .map((lane) => lane.key)
            .join(', ')}`
        );
      }

      const selectedLane = await promptForLane(laneConfigs);
      runLane(selectedLane, parsedArgs.passthroughArgs);
      return;
    }

    if (parsedArgs.target === 'connected' || parsedArgs.target === 'simulator') {
      const resolvedLane = resolveAliasLane(laneConfigs, parsedArgs.target);
      if (resolvedLane) {
        runLane(resolvedLane, parsedArgs.passthroughArgs);
        return;
      }
    }

    const explicitLane = findLaneByKey(
      laneConfigs,
      parsedArgs.target as OnDeviceLaneKey
    );

    if (!explicitLane) {
      throw new Error(`Unknown on-device target: ${parsedArgs.target}`);
    }

    if (!explicitLane.available) {
      throw new Error(
        `${explicitLane.key} is not available: ${explicitLane.availabilityReason}`
      );
    }

    runLane(explicitLane, parsedArgs.passthroughArgs);
    return;
  }

  if (availableLanes.length === 1) {
    runLane(availableLanes[0], parsedArgs.passthroughArgs);
    return;
  }

  if (!input.isTTY || !output.isTTY) {
    throw new Error(
      `Multiple on-device targets are available. Use --target with one of: ${availableLanes
        .map((lane) => lane.key)
        .join(', ')}`
    );
  }

  const selectedLane = await promptForLane(laneConfigs);
  runLane(selectedLane, parsedArgs.passthroughArgs);
}

main().catch((error) => {
  printLaneConfigs(laneConfigs);
  console.error(`\n✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
