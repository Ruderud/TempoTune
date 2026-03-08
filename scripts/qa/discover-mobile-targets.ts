#!/usr/bin/env tsx
/**
 * discover-mobile-targets.ts
 * Discovers connected devices and booted simulators/emulators for Appium testing.
 * Outputs both human-readable table and JSON.
 */
import { execSync } from 'node:child_process';

export interface MobileTarget {
  platform: 'android' | 'ios';
  type: 'device' | 'emulator' | 'simulator';
  name: string;
  udid: string;
  osVersion?: string;
  status: 'connected' | 'booted';
}

function exec(cmd: string): string | null {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
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

export function discoverAndroidTargets(): MobileTarget[] {
  if (!which('adb')) return [];

  const output = exec('adb devices -l');
  if (!output) return [];

  const targets: MobileTarget[] = [];
  const lines = output.split('\n').slice(1); // Skip header

  for (const line of lines) {
    const match = line.match(/^(\S+)\s+device\s+(.*)/);
    if (!match) continue;

    const [, serial, props] = match;
    const modelMatch = props.match(/model:(\S+)/);
    const name = modelMatch ? modelMatch[1].replace(/_/g, ' ') : serial;
    const isEmulator = serial.startsWith('emulator-');

    // Get Android version
    const osVersion = exec(`adb -s ${serial} shell getprop ro.build.version.release`) || undefined;

    targets.push({
      platform: 'android',
      type: isEmulator ? 'emulator' : 'device',
      name,
      udid: serial,
      osVersion,
      status: 'connected',
    });
  }

  return targets;
}

export function discoverIOSTargets(): MobileTarget[] {
  if (!which('xcrun')) return [];

  const targets: MobileTarget[] = [];

  // Booted simulators
  const simJson = exec('xcrun simctl list devices booted --json');
  if (simJson) {
    try {
      const parsed = JSON.parse(simJson);
      for (const [runtime, devices] of Object.entries(parsed.devices) as Array<[string, Array<{ name: string; udid: string; state: string }>]>) {
        const versionMatch = runtime.match(/SimRuntime\.iOS-(\d+-\d+)/);
        const osVersion = versionMatch ? versionMatch[1].replace('-', '.') : undefined;

        for (const device of devices) {
          if (device.state !== 'Booted') continue;
          targets.push({
            platform: 'ios',
            type: 'simulator',
            name: device.name,
            udid: device.udid,
            osVersion,
            status: 'booted',
          });
        }
      }
    } catch { /* ignore */ }
  }

  // Connected physical devices
  const physicalJson = exec('xcrun xctrace list devices 2>/dev/null');
  if (physicalJson) {
    // Parse format: "DeviceName (OSVersion) (UDID)"
    const lines = physicalJson.split('\n');
    let inDevices = false;
    for (const line of lines) {
      if (line.includes('== Devices ==')) {
        inDevices = true;
        continue;
      }
      if (line.includes('== Simulators ==')) break;
      if (!inDevices || !line.trim()) continue;

      const match = line.match(/^(.+?)\s+\((\d+\.\d+(?:\.\d+)?)\)\s+\(([A-F0-9-]+)\)/);
      if (match) {
        const [, name, osVersion, udid] = match;
        // Skip if already discovered as simulator
        if (!targets.some((t) => t.udid === udid)) {
          targets.push({
            platform: 'ios',
            type: 'device',
            name: name.trim(),
            udid,
            osVersion,
            status: 'connected',
          });
        }
      }
    }
  }

  return targets;
}

export function discoverAllTargets(): MobileTarget[] {
  return [...discoverAndroidTargets(), ...discoverIOSTargets()];
}

function printTable(targets: MobileTarget[]) {
  if (targets.length === 0) {
    console.log('No devices/simulators found.');
    return;
  }

  const header = ['Platform', 'Type', 'Name', 'UDID', 'OS', 'Status'];
  const rows = targets.map((t) => [
    t.platform,
    t.type,
    t.name,
    t.udid.length > 20 ? t.udid.slice(0, 17) + '...' : t.udid,
    t.osVersion || '-',
    t.status,
  ]);

  // Calculate column widths
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));

  const separator = widths.map((w) => '─'.repeat(w + 2)).join('┼');
  const formatRow = (row: string[]) => row.map((cell, i) => ` ${cell.padEnd(widths[i])} `).join('│');

  console.log(formatRow(header));
  console.log(separator);
  for (const row of rows) {
    console.log(formatRow(row));
  }
}

// Main (when run directly)
const targets = discoverAllTargets();

console.log(`Discovered ${targets.length} mobile target(s):\n`);
printTable(targets);

if (process.env.QA_JSON_OUTPUT || process.env.CI) {
  console.log('\n--- JSON ---');
  console.log(JSON.stringify(targets, null, 2));
}
