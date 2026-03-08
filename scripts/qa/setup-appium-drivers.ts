#!/usr/bin/env tsx
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const APPIUM_HOME = resolve(ROOT, '.appium');

const DRIVER_SPECS = {
  ios: 'appium-xcuitest-driver@9.10.5',
  android: 'appium-uiautomator2-driver@4.2.9',
} as const;

type DriverName = 'xcuitest' | 'uiautomator2';

function exec(cmd: string): string | null {
  try {
    return execSync(cmd, {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        APPIUM_HOME,
      },
    }).trim();
  } catch {
    return null;
  }
}

function run(cmd: string) {
  execSync(cmd, {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      APPIUM_HOME,
    },
  });
}

function resolveTargets(): DriverName[] {
  const platform = process.env.QA_PLATFORM || 'all';
  if (platform === 'ios') return ['xcuitest'];
  if (platform === 'android') return ['uiautomator2'];
  return ['uiautomator2', 'xcuitest'];
}

function readInstalledDrivers(): Record<string, { version?: string }> {
  const output = exec(
    'pnpm --filter @tempo-tune/mobile exec appium driver list --installed --json'
  );
  if (!output) return {};

  try {
    return JSON.parse(output) as Record<string, { version?: string }>;
  } catch {
    return {};
  }
}

function isInstalled(
  drivers: Record<string, { version?: string }>,
  name: DriverName,
  version: string
) {
  return drivers[name]?.version === version;
}

const targets = resolveTargets();
const installed = readInstalledDrivers();

console.log('Appium Driver Setup\n');
console.log(`APPIUM_HOME: ${APPIUM_HOME}`);
console.log(`Target set: ${targets.join(', ')}\n`);

for (const target of targets) {
  const spec = target === 'xcuitest' ? DRIVER_SPECS.ios : DRIVER_SPECS.android;
  const version = spec.split('@').at(-1) ?? '';

  if (isInstalled(installed, target, version)) {
    console.log(`✓ ${target}@${version} already installed`);
    continue;
  }

  console.log(`→ Installing ${spec}...`);
  run(
    `pnpm --filter @tempo-tune/mobile exec appium driver install ${spec} --source=npm`
  );
}

console.log('\n✓ Appium driver setup complete');
