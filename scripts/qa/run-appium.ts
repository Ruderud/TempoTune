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
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanupMobileTargets } from './cleanup-mobile-targets';
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
const normalizedPassthroughArgs =
  passthroughArgs[0] === '--' ? passthroughArgs.slice(1) : passthroughArgs;
const MOBILE_SPECS_DIR = resolve(MOBILE_DIR, 'appium/specs');

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

type FailureHint = {
  title: string;
  steps: string[];
};

type WdioExecution = {
  success: boolean;
  command: string;
  output: string;
  logPath: string;
  specSummary: SpecSummary | null;
};

let cleanupCompleted = false;

function runCleanup(targets: MobileTarget[]) {
  if (cleanupCompleted || targets.length === 0) return;
  cleanupCompleted = true;

  console.log('\n═══ Cleanup ═══');
  const outcomes = cleanupMobileTargets(targets);

  for (const outcome of outcomes) {
    const summary =
      outcome.actions.length > 0 ? outcome.actions.join(', ') : 'nothing to clean up';
    console.log(
      `  ${outcome.target.name} (${outcome.target.platform}/${outcome.target.type}): ${summary}`
    );
  }
}

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

function detectFailureHints(output: string, target: MobileTarget): FailureHint[] {
  const hints: FailureHint[] = [];

  if (
    target.platform === 'ios' &&
    target.type === 'device' &&
    output.includes('XCTDaemonErrorDomain Code=41') &&
    output.includes('Not authorized for performing UI testing actions')
  ) {
    hints.push({
      title: 'iOS real-device UI testing authorization is disabled',
      steps: [
        'On the iPhone, enable Settings > Privacy & Security > Developer Mode and reboot if prompted.',
        'After Developer Mode is enabled, open Settings > Developer and turn on Enable UI Automation.',
        'For WebView tests, open Settings > Safari > Advanced and turn on Web Inspector and Remote Automation.',
        'Keep the device unlocked while starting Appium, and reconnect/trust the Mac again if the trust prompt appears.',
        'If it still fails, delete the existing WebDriverAgent app from the iPhone and retry with QA_IOS_USE_NEW_WDA=1.',
      ],
    });
  }

  if (
    target.platform === 'ios' &&
    output.includes('invalid code signature') &&
    output.includes('VPN & Device Management')
  ) {
    hints.push({
      title: 'Developer certificate is not trusted on the device',
      steps: [
        'Open Settings > General > VPN & Device Management on the iPhone.',
        'Select your Apple Development profile and trust it.',
      ],
    });
  }

  return hints;
}

function buildReportPaths(timestamp: string) {
  return {
    timestampedMarkdown: resolve(REPORT_DIR, `${timestamp}-device-report.md`),
    timestampedJson: resolve(REPORT_DIR, `${timestamp}-device-report.json`),
    latestMarkdown: resolve(REPORT_DIR, 'latest-device-report.md'),
    latestJson: resolve(REPORT_DIR, 'latest-device-report.json'),
  };
}

function getDefaultSpecFiles(): string[] {
  return readdirSync(MOBILE_SPECS_DIR)
    .filter((file) => file.endsWith('.spec.ts'))
    .sort()
    .map((file) => `appium/specs/${file}`);
}

function splitSpecArgs(args: string[]) {
  const passthroughWithoutSpec: string[] = [];
  const specArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--spec') {
      const next = args[i + 1];
      if (next) {
        specArgs.push(next);
        i += 1;
      }
      continue;
    }

    if (arg.startsWith('--spec=')) {
      specArgs.push(arg.slice('--spec='.length));
      continue;
    }

    passthroughWithoutSpec.push(arg);
  }

  return {
    passthroughWithoutSpec,
    specArgs,
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
  const specFilter = normalizedPassthroughArgs.join(' ').trim() || null;

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

function executeWdio(
  target: MobileTarget,
  portOffset: number,
  args: string[],
  logSuffix?: string
): WdioExecution {
  const env: Record<string, string> = {
    ...(process.env as Record<string, string>),
    APPIUM_HOME,
    QA_PLATFORM: target.platform,
    QA_DEVICE_UDID: target.udid,
    ...(target.osVersion ? { QA_DEVICE_OS_VERSION: target.osVersion } : {}),
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

  const command = `pnpm exec wdio run wdio.conf.ts ${args.join(' ')}`.trim();
  const child = spawnSync(
    'pnpm',
    ['exec', 'wdio', 'run', 'wdio.conf.ts', ...args],
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
    new Date().toISOString().replace(/[:.]/g, '-'),
    target.platform,
    sanitizeSegment(target.name),
    ...(logSuffix ? [sanitizeSegment(logSuffix)] : []),
    'wdio.log',
  ].join('-');
  const logPath = resolve(REPORT_DIR, logFileName);
  writeFileSync(logPath, combinedOutput);

  return {
    success: child.status === 0,
    command,
    logPath,
    output: combinedOutput,
    specSummary: parseSpecSummary(combinedOutput),
  };
}

function runWdio(target: MobileTarget, portOffset: number): TargetRunResult {
  const startedAt = new Date();
  const { passthroughWithoutSpec, specArgs } = splitSpecArgs(
    normalizedPassthroughArgs
  );
  const shouldRunSequentialSpecs =
    target.platform === 'ios' && target.type === 'device';

  const executions = shouldRunSequentialSpecs
    ? (specArgs.length > 0 ? specArgs : getDefaultSpecFiles()).map((specPath) => ({
        specPath,
        execution: executeWdio(
          target,
          portOffset,
          [...passthroughWithoutSpec, '--spec', specPath],
          specPath
        ),
      }))
    : [
        {
          specPath: null,
          execution: executeWdio(target, portOffset, normalizedPassthroughArgs),
        },
      ];

  const finishedAt = new Date();
  const combinedOutput = executions
    .map(({ specPath, execution }) =>
      specPath ? `# ${specPath}\n\n${execution.output}` : execution.output
    )
    .join('\n\n');
  const success = executions.every(({ execution }) => execution.success);
  const aggregateSummary = executions.reduce<SpecSummary | null>((acc, item) => {
    if (!item.execution.specSummary) return acc;
    if (!acc) {
      return { ...item.execution.specSummary };
    }

    acc.passed += item.execution.specSummary.passed;
    acc.failed += item.execution.specSummary.failed;
    acc.total += item.execution.specSummary.total;
    return acc;
  }, null);

  ensureReportDir();
  const aggregateLogPath = resolve(
    REPORT_DIR,
    [
      startedAt.toISOString().replace(/[:.]/g, '-'),
      target.platform,
      sanitizeSegment(target.name),
      shouldRunSequentialSpecs ? 'aggregate' : 'single',
      'wdio.log',
    ].join('-')
  );
  writeFileSync(aggregateLogPath, combinedOutput);

  if (!success) {
    console.error(`✗ Tests failed on ${target.name}`);
    const failureHints = detectFailureHints(combinedOutput, target);
    for (const hint of failureHints) {
      console.error(`  → ${hint.title}`);
      for (const step of hint.steps) {
        console.error(`    - ${step}`);
      }
    }
  }

  return {
    target,
    success,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    command: executions.map(({ execution }) => execution.command).join('\n'),
    logPath: aggregateLogPath,
    specSummary: aggregateSummary,
  };
}

const runStartedAt = new Date().toISOString();

console.log('Appium Device Test Runner\n');

const allTargets = discoverAllTargets();
const targets = filterTargets(allTargets);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    console.log(`\n⚠ Received ${signal}; cleaning up active mobile targets...`);
    runCleanup(targets);
    process.exit(signal === 'SIGINT' ? 130 : 143);
  });
}

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
const androidAppPackage =
  process.env.QA_ANDROID_APP_PACKAGE || '';
const useInstalledAndroidApp =
  process.env.QA_ANDROID_USE_INSTALLED_APP === '1' ||
  process.env.QA_ANDROID_USE_INSTALLED_APP === 'true' ||
  !!androidAppPackage;
const iosApp =
  process.env.QA_IOS_APP ||
  resolve(
    MOBILE_DIR,
    'ios/build/Build/Products/Debug-iphonesimulator/TempoTune.app'
  );
const iosBundleId = process.env.QA_IOS_BUNDLE_ID;

if (needsAndroid && !useInstalledAndroidApp && !existsSync(androidApk)) {
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
let exitCode = 0;

try {
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

  exitCode = failed > 0 ? 1 : 0;
} finally {
  runCleanup(targets);
}

process.exit(exitCode);
