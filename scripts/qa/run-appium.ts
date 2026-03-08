#!/usr/bin/env tsx
/**
 * run-appium.ts
 * Orchestrates Appium test execution across discovered devices.
 *
 * Environment variables:
 * - QA_PLATFORM: ios | android | all (default: all)
 * - QA_DEVICE_MODE: booted | connected | all | allowlist (default: all)
 * - QA_DEVICE_ALLOWLIST: comma-separated UDIDs (for allowlist mode)
 * - QA_ANDROID_APK: path to Android debug APK
 * - QA_IOS_APP: path to iOS .app bundle
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  discoverAllTargets,
  type MobileTarget,
} from './discover-mobile-targets';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const MOBILE_DIR = resolve(ROOT, 'apps/mobile');
const APPIUM_HOME = resolve(ROOT, '.appium');
const REPORT_DIR = resolve(ROOT, 'reports/qa/device');
const passthroughArgs = process.argv.slice(2);

type SpecSummary = {
  passed: number;
  failed: number;
  total: number;
  duration?: string;
};

type TargetRunResult = {
  target: MobileTarget;
  success: boolean;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  command: string;
  logPath: string;
  specSummary: SpecSummary | null;
};

type ReportStatus = 'passed' | 'failed' | 'blocked';

function filterTargets(targets: MobileTarget[]): MobileTarget[] {
  const platform = process.env.QA_PLATFORM || 'all';
  const mode = process.env.QA_DEVICE_MODE || 'all';
  const allowlist = (process.env.QA_DEVICE_ALLOWLIST || '')
    .split(',')
    .filter(Boolean);

  let filtered = targets;

  if (platform !== 'all') {
    filtered = filtered.filter((t) => t.platform === platform);
  }

  switch (mode) {
    case 'booted':
      filtered = filtered.filter(
        (t) =>
          t.status === 'booted' ||
          t.type === 'simulator' ||
          t.type === 'emulator'
      );
      break;
    case 'connected':
      filtered = filtered.filter((t) => t.type === 'device');
      break;
    case 'allowlist':
      filtered = filtered.filter((t) => allowlist.includes(t.udid));
      break;
    case 'all':
    default:
      break;
  }

  return filtered;
}

function ensureReportDir() {
  mkdirSync(REPORT_DIR, { recursive: true });
}

function sanitizeSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatDuration(durationMs: number): string {
  if (durationMs < 1000) return `${durationMs}ms`;
  return `${(durationMs / 1000).toFixed(1)}s`;
}

function stripAnsi(value: string): string {
  return value.replace(/\u001B\[[0-9;]*m/g, '');
}

function parseSpecSummary(output: string): SpecSummary | null {
  const cleanOutput = stripAnsi(output);
  const specLine = cleanOutput
    .split('\n')
    .find((line) => line.includes('Spec Files:'));

  if (!specLine) return null;

  const passed = Number(specLine.match(/(\d+)\s+passed/)?.[1] || 0);
  const failed = Number(specLine.match(/(\d+)\s+failed/)?.[1] || 0);
  const total = Number(specLine.match(/(\d+)\s+total/)?.[1] || 0);
  const duration = specLine.match(/in\s+([0-9:.]+)\s*$/)?.[1];

  if (!total) return null;

  return {
    passed,
    failed,
    total,
    duration,
  };
}

function buildReportPaths(timestamp: string) {
  return {
    timestampedMarkdown: resolve(REPORT_DIR, `${timestamp}-device-report.md`),
    timestampedJson: resolve(REPORT_DIR, `${timestamp}-device-report.json`),
    latestMarkdown: resolve(REPORT_DIR, 'latest-device-report.md'),
    latestJson: resolve(REPORT_DIR, 'latest-device-report.json'),
  };
}

function writeDeviceReport(options: {
  status: ReportStatus;
  startedAt: string;
  finishedAt: string;
  reason?: string;
  results: TargetRunResult[];
}) {
  ensureReportDir();

  const generatedAt = new Date().toISOString();
  const timestamp = generatedAt.replace(/[:.]/g, '-');
  const paths = buildReportPaths(timestamp);
  const targetCount = options.results.length;
  const passedTargets = options.results.filter(
    (result) => result.success
  ).length;
  const failedTargets = targetCount - passedTargets;
  const specFilter = passthroughArgs.join(' ').trim() || null;

  const jsonReport = {
    generatedAt,
    status: options.status,
    startedAt: options.startedAt,
    finishedAt: options.finishedAt,
    durationMs:
      new Date(options.finishedAt).getTime() -
      new Date(options.startedAt).getTime(),
    platform: process.env.QA_PLATFORM || 'all',
    deviceMode: process.env.QA_DEVICE_MODE || 'all',
    specFilter,
    reason: options.reason ?? null,
    targetCount,
    passedTargets,
    failedTargets,
    results: options.results.map((result) => ({
      target: result.target,
      success: result.success,
      startedAt: result.startedAt,
      finishedAt: result.finishedAt,
      durationMs: result.durationMs,
      command: result.command,
      logPath: result.logPath,
      specSummary: result.specSummary,
    })),
  };

  const markdownLines = [
    '# Device QA Report',
    '',
    `- Status: ${options.status.toUpperCase()}`,
    `- Generated: ${generatedAt}`,
    `- Platform filter: ${process.env.QA_PLATFORM || 'all'}`,
    `- Device mode: ${process.env.QA_DEVICE_MODE || 'all'}`,
    `- Spec filter: ${specFilter || '(full suite)'}`,
    `- Targets: ${targetCount} total, ${passedTargets} passed, ${failedTargets} failed`,
  ];

  if (options.reason) {
    markdownLines.push(`- Reason: ${options.reason}`);
  }

  if (targetCount > 0) {
    markdownLines.push(
      '',
      '## Target Results',
      '',
      '| Target | Platform | Type | Status | Duration | Spec Files | Log |',
      '| --- | --- | --- | --- | --- | --- | --- |'
    );

    for (const result of options.results) {
      const specSummary = result.specSummary
        ? `${result.specSummary.passed}/${result.specSummary.total} passed`
        : '-';
      const relativeLogPath = result.logPath.replace(`${ROOT}/`, '');
      markdownLines.push(
        `| ${result.target.name} | ${result.target.platform} | ${result.target.type} | ${result.success ? 'PASS' : 'FAIL'} | ${formatDuration(result.durationMs)} | ${specSummary} | ${relativeLogPath} |`
      );
    }
  }

  markdownLines.push('', '## Report Files', '');
  markdownLines.push(`- Markdown: ${paths.latestMarkdown}`);
  markdownLines.push(`- JSON: ${paths.latestJson}`);

  const markdownReport = markdownLines.join('\n');
  const jsonReportText = `${JSON.stringify(jsonReport, null, 2)}\n`;

  writeFileSync(paths.timestampedMarkdown, markdownReport);
  writeFileSync(paths.timestampedJson, jsonReportText);
  writeFileSync(paths.latestMarkdown, markdownReport);
  writeFileSync(paths.latestJson, jsonReportText);

  console.log('\n═══ Device QA Report ═══');
  console.log(`  Status: ${options.status.toUpperCase()}`);
  console.log(
    `  Targets: ${targetCount} total, ${passedTargets} passed, ${failedTargets} failed`
  );
  console.log(`  Markdown: ${paths.latestMarkdown}`);
  console.log(`  JSON: ${paths.latestJson}`);

  return paths;
}

function writeBlockedReport(startedAt: string, reason: string): never {
  writeDeviceReport({
    status: 'blocked',
    startedAt,
    finishedAt: new Date().toISOString(),
    reason,
    results: [],
  });
  process.exit(1);
}

function runWdio(target: MobileTarget, portOffset: number): TargetRunResult {
  const env: Record<string, string> = {
    ...(process.env as Record<string, string>),
    APPIUM_HOME,
    QA_PLATFORM: target.platform,
    QA_DEVICE_UDID: target.udid,
  };

  if (target.platform === 'android') {
    env.QA_SYSTEM_PORT = String(8200 + portOffset);
    env.QA_CHROMEDRIVER_PORT = String(9515 + portOffset);
  } else {
    env.QA_WDA_PORT = String(8100 + portOffset);
  }

  console.log(
    `\n═══ Running on: ${target.name} (${target.platform}/${target.type}) ═══`
  );
  console.log(`    UDID: ${target.udid}`);
  console.log(`    OS: ${target.osVersion || 'unknown'}\n`);

  const command =
    `pnpm exec wdio run wdio.conf.ts ${passthroughArgs.join(' ')}`.trim();
  const startedAt = new Date();
  const child = spawnSync(
    'pnpm',
    ['exec', 'wdio', 'run', 'wdio.conf.ts', ...passthroughArgs],
    {
      cwd: MOBILE_DIR,
      env,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 300_000,
      maxBuffer: 10 * 1024 * 1024,
    }
  );
  const finishedAt = new Date();

  const stdout = child.stdout || '';
  const stderr = child.stderr || '';
  const combinedOutput = [stdout, stderr].filter(Boolean).join('\n');

  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);

  ensureReportDir();
  const logFileName = [
    startedAt.toISOString().replace(/[:.]/g, '-'),
    target.platform,
    sanitizeSegment(target.name),
    'wdio.log',
  ].join('-');
  const logPath = resolve(REPORT_DIR, logFileName);
  writeFileSync(logPath, combinedOutput);

  const success = child.status === 0;
  if (!success) {
    console.error(`✗ Tests failed on ${target.name}`);
  }

  return {
    target,
    success,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    command,
    logPath,
    specSummary: parseSpecSummary(combinedOutput),
  };
}

const runStartedAt = new Date().toISOString();

console.log('Appium Device Test Runner\n');

const allTargets = discoverAllTargets();
const targets = filterTargets(allTargets);

console.log(
  `Discovered: ${allTargets.length} total, ${targets.length} after filters`
);
console.log(`Platform: ${process.env.QA_PLATFORM || 'all'}`);
console.log(`Mode: ${process.env.QA_DEVICE_MODE || 'all'}`);

if (targets.length === 0) {
  console.log('\n⚠ No matching devices/simulators found.');
  console.log('  - Check device connections (adb devices / xcrun simctl list)');
  console.log('  - Verify QA_PLATFORM and QA_DEVICE_MODE settings');
  writeBlockedReport(
    runStartedAt,
    'No matching devices/simulators found. Check device connections and QA filters.'
  );
}

const needsAndroid = targets.some((t) => t.platform === 'android');
const needsIos = targets.some((t) => t.platform === 'ios');

const androidApk =
  process.env.QA_ANDROID_APK ||
  resolve(MOBILE_DIR, 'android/app/build/outputs/apk/debug/app-debug.apk');
const iosApp =
  process.env.QA_IOS_APP ||
  resolve(
    MOBILE_DIR,
    'ios/build/Build/Products/Debug-iphonesimulator/TempoTune.app'
  );
const iosBundleId = process.env.QA_IOS_BUNDLE_ID;

if (needsAndroid && !existsSync(androidApk)) {
  console.error(`\n✗ Android APK not found: ${androidApk}`);
  console.error('  Build it first: cd apps/mobile && pnpm android');
  console.error('  Or set QA_ANDROID_APK to point to an existing APK');
  writeBlockedReport(runStartedAt, `Android APK not found: ${androidApk}`);
}

if (needsIos && !iosBundleId && !existsSync(iosApp)) {
  console.error(`\n✗ iOS app bundle not found: ${iosApp}`);
  console.error('  Build it first: cd apps/mobile && pnpm ios');
  console.error('  Or set QA_IOS_APP to point to an existing .app bundle');
  console.error(
    '  If the app is already installed on a simulator/device, set QA_IOS_BUNDLE_ID'
  );
  writeBlockedReport(runStartedAt, `iOS app bundle not found: ${iosApp}`);
}

let passed = 0;
let failed = 0;
const results: TargetRunResult[] = [];

for (let i = 0; i < targets.length; i++) {
  const result = runWdio(targets[i], i);
  results.push(result);
  if (result.success) passed++;
  else failed++;
}

console.log(`\n═══ Results ═══`);
console.log(`  Passed: ${passed}/${targets.length}`);
console.log(`  Failed: ${failed}/${targets.length}`);

writeDeviceReport({
  status: failed > 0 ? 'failed' : 'passed',
  startedAt: runStartedAt,
  finishedAt: new Date().toISOString(),
  results,
});

process.exit(failed > 0 ? 1 : 0);
