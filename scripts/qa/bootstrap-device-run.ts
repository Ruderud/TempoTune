#!/usr/bin/env tsx
/**
 * bootstrap-device-run.ts
 * Bootstraps local-dev-attached mode for mobile device E2E testing.
 * - Generates dev config (IP + port)
 * - Verifies Next.js dev server
 * - Sets up adb reverse for Android
 * - Launches simulator/emulator if none running
 */
import { execSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureManagedWebDevServer } from './web-dev-server';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const MOBILE_DIR = resolve(ROOT, 'apps/mobile');

function exec(cmd: string, opts?: { cwd?: string }): string | null {
  try {
    return execSync(cmd, { encoding: 'utf-8', cwd: opts?.cwd, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function which(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function resolveAndroidEmulatorBinary(): string | null {
  const sdkRoot =
    process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME || resolve(process.env.HOME || '', 'Library/Android/sdk');
  const sdkBinary = resolve(sdkRoot, 'emulator/emulator');

  if (existsSync(sdkBinary)) {
    return sdkBinary;
  }

  const systemBinary = exec('which emulator');
  return systemBinary || null;
}

function getAndroidDeviceSerials() {
  const devices = exec('adb devices');
  if (!devices) return [];

  return devices
    .split('\n')
    .filter((line) => line.includes('\tdevice'))
    .map((line) => line.split('\t')[0]);
}

function setupAdbReverse(serial: string) {
  exec(`adb -s ${serial} reverse tcp:3000 tcp:3000`);
  exec(`adb -s ${serial} reverse tcp:8081 tcp:8081`);
}

async function waitForAndroidSerial(
  predicate: (serial: string) => boolean,
  timeoutMs = 180_000
): Promise<string | null> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const serial = getAndroidDeviceSerials().find(predicate);
    if (serial) {
      return serial;
    }

    await sleep(2000);
  }

  return null;
}

async function waitForAndroidBoot(serial: string, timeoutMs = 180_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const bootCompleted = exec(`adb -s ${serial} shell getprop sys.boot_completed`);
    if (bootCompleted === '1') {
      return true;
    }

    await sleep(2000);
  }

  return false;
}

async function checkPort(port: number): Promise<boolean> {
  try {
    const result = exec(`lsof -i :${port} -P -n`);
    return !!result && result.includes('LISTEN');
  } catch {
    return false;
  }
}

async function main() {
  const targetPlatform = process.env.QA_PLATFORM || 'all';
  const deviceMode = process.env.QA_DEVICE_MODE || 'all';
  const requireWebServer =
    process.env.QA_REQUIRE_WEB_SERVER === '1' ||
    process.env.QA_REQUIRE_WEB_SERVER === 'true';
  const explicitQaWebUrl = process.env.QA_WEB_URL?.trim();
  const usingExternalQaWebUrl =
    !!explicitQaWebUrl &&
    !/^https?:\/\/(?:localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(?:1[6-9]|2\d|3[0-1])\.)/i.test(
      explicitQaWebUrl
    );
  const skipMetroRequirement =
    process.env.QA_SKIP_METRO_REQUIREMENT === '1' ||
    process.env.QA_SKIP_METRO_REQUIREMENT === 'true';
  const shouldHandleAndroid =
    targetPlatform === 'all' || targetPlatform === 'android';
  const shouldHandleIos = targetPlatform === 'all' || targetPlatform === 'ios';
  const shouldBootAndroidEmulator = shouldHandleAndroid && deviceMode !== 'connected';
  const shouldBootIosSimulator =
    shouldHandleIos && deviceMode !== 'connected';

  console.log('Bootstrapping local-dev-attached mode...\n');

  // Step 1: Generate dev config
  console.log('1. Generating dev config...');
  const generateScript = resolve(MOBILE_DIR, 'scripts/generate-dev-config.sh');
  if (existsSync(generateScript)) {
    exec(`bash ${generateScript}`, { cwd: MOBILE_DIR });
    console.log('   ✓ Dev config generated');
  } else {
    console.log('   ○ generate-dev-config.sh not found, skipping');
  }

  // Step 2: Check Next.js dev server
  console.log('2. Checking Next.js dev server (port 3000)...');
  const nextRunning = await checkPort(3000);
  if (nextRunning) {
    console.log('   ✓ Next.js dev server running on :3000');
  } else if (usingExternalQaWebUrl) {
    console.log(`   ○ Skipping local web-server check (QA_WEB_URL=${explicitQaWebUrl})`);
  } else if (requireWebServer) {
    console.log('   ○ Not running. Starting managed Next.js dev server...');
    try {
      const managedServer = await ensureManagedWebDevServer({ port: 3000 });
      const statusLabel =
        managedServer.status === 'started' ? 'started by QA' : 'reused existing server';
      const logSuffix = managedServer.logPath
        ? ` (log: ${managedServer.logPath})`
        : '';
      console.log(`   ✓ Next.js dev server ready on :3000 (${statusLabel})${logSuffix}`);
    } catch (error) {
      console.log(
        `   ✗ ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  } else {
    console.log('   ○ Not running. Start it with: pnpm --filter @tempo-tune/web dev');
    console.log('   ⚠ Device tests may fail without the web server');
  }

  // Step 3: Check Metro bundler
  console.log('3. Checking Metro bundler (port 8081)...');
  const metroRunning = await checkPort(8081);
  if (metroRunning) {
    console.log('   ✓ Metro bundler running on :8081');
  } else if (skipMetroRequirement) {
    console.log('   ○ Not required for embedded-JS QA build path');
  } else {
    console.log('   ○ Not running. Will be started by react-native run commands');
  }

  // Step 4: Android — adb reverse (per-device)
  if (!shouldHandleAndroid) {
    console.log('4. Android: not requested for this QA run, skipping');
  } else if (which('adb')) {
    console.log('4. Setting up Android adb reverse...');
    const deviceSerials = getAndroidDeviceSerials();
    const emulatorSerials = deviceSerials.filter((serial) =>
      serial.startsWith('emulator-')
    );

    if (deviceSerials.length > 0) {
      for (const serial of deviceSerials) {
        setupAdbReverse(serial);
        console.log(`   ✓ adb reverse set for ${serial} (3000, 8081)`);
      }
    }

    if (shouldBootAndroidEmulator && emulatorSerials.length === 0) {
      const emulatorBinary = resolveAndroidEmulatorBinary();
      if (!emulatorBinary) {
        console.log('   ○ Android emulator binary not found');
      } else {
        const emulators = exec(`${emulatorBinary} -list-avds`);
        if (emulators && emulators.trim().length > 0) {
          const firstAvd = emulators.trim().split('\n')[0];
          console.log(`   ○ No device connected. Launching emulator: ${firstAvd}`);
          spawn(emulatorBinary, ['-avd', firstAvd], {
            detached: true,
            stdio: 'ignore',
          }).unref();
          console.log('   ⏳ Waiting for emulator to boot...');

          const serial = await waitForAndroidSerial((candidate) =>
            candidate.startsWith('emulator-')
          );

          if (!serial) {
            console.log('   ✗ Timed out waiting for the Android emulator to appear in adb');
          } else {
            const booted = await waitForAndroidBoot(serial);
            if (!booted) {
              console.log(`   ✗ Emulator ${serial} appeared but did not finish booting in time`);
            } else {
              setupAdbReverse(serial);
              console.log(`   ✓ Emulator ready: ${serial} (3000, 8081 reversed)`);
            }
          }
        } else {
          console.log('   ○ No Android devices/emulators available');
        }
      }
    } else if (deviceSerials.length === 0) {
      console.log('   ○ No Android devices/emulators available');
    } else {
      console.log('   ○ Android emulator already booted or emulator bootstrap is disabled for connected-only runs');
    }
  } else {
    console.log('4. Android: adb not found, skipping');
  }

  // Step 5: iOS — check simulator
  if (!shouldHandleIos) {
    console.log('5. iOS: not requested for this QA run, skipping');
  } else if (which('xcrun')) {
    console.log('5. Checking iOS simulators...');
    const simJson = exec('xcrun simctl list devices booted --json');
    let bootedSims: Array<{ name: string; udid: string }> = [];
    try {
      if (simJson) {
        const parsed = JSON.parse(simJson);
        for (const runtime of Object.values(parsed.devices) as Array<Array<{ state: string; name: string; udid: string }>>) {
          bootedSims.push(...runtime.filter((d) => d.state === 'Booted').map((d) => ({ name: d.name, udid: d.udid })));
        }
      }
    } catch { /* ignore */ }

    if (bootedSims.length > 0) {
      console.log(`   ✓ ${bootedSims.length} simulator(s) booted: ${bootedSims.map((s) => s.name).join(', ')}`);
    } else if (!shouldBootIosSimulator) {
      console.log('   ○ Simulator bootstrap not required for connected-only iOS runs');
    } else {
      // Try to boot a default iPhone simulator
      const allSims = exec('xcrun simctl list devices available --json');
      try {
        if (allSims) {
          const parsed = JSON.parse(allSims);
          for (const [runtime, devices] of Object.entries(parsed.devices) as Array<[string, Array<{ name: string; udid: string; isAvailable: boolean }>]>) {
            if (!runtime.includes('iOS')) continue;
            const iphone = devices.find((d) => d.name.includes('iPhone') && d.isAvailable);
            if (iphone) {
              console.log(`   ○ Booting simulator: ${iphone.name}`);
              exec(`xcrun simctl boot ${iphone.udid}`);
              exec('open -a Simulator');
              console.log(`   ✓ ${iphone.name} booted`);
              break;
            }
          }
        }
      } catch {
        console.log('   ○ No iOS simulators available');
      }
    }
  } else {
    console.log('5. iOS: xcrun not found, skipping');
  }

  console.log('\n✓ Bootstrap complete. Run device tests with: pnpm qa:device');
}

main().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
