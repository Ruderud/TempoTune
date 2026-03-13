#!/usr/bin/env tsx
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const passthroughArgs = process.argv.slice(2);

function runStep(label: string, args: string[]) {
  console.log(`\n═══ ${label} ═══\n`);
  const result = spawnSync('pnpm', args, {
    cwd: ROOT,
    env: process.env,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

runStep('Static QA', ['run', 'qa']);
runStep('Web E2E', ['exec', 'nx', 'run', 'web:e2e']);
runStep('On-device QA', [
  'exec',
  'tsx',
  'scripts/qa/run-ondevice-check.ts',
  ...passthroughArgs,
]);
