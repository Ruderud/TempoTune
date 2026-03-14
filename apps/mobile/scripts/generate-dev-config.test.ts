import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptsDir, '../../..');
const scriptPath = path.join(scriptsDir, 'generate-dev-config.sh');
const configPath = path.resolve(scriptsDir, '../src/config.generated.ts');
const originalConfig = fs.readFileSync(configPath, 'utf8');

function runGenerateConfig(env: Record<string, string | undefined>) {
  const result = spawnSync('bash', [scriptPath], {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...env,
    },
    encoding: 'utf8',
  });

  expect(result.status).toBe(0);
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    generatedConfig: fs.readFileSync(configPath, 'utf8'),
  };
}

afterEach(() => {
  fs.writeFileSync(configPath, originalConfig);
});

describe('generate-dev-config.sh', () => {
  it('honors explicit production env overrides when generating runtime config', () => {
    const { stdout, generatedConfig } = runGenerateConfig({
      APP_RUNTIME_CHANNEL: 'production',
      PROD_WEB_URL: 'https://prod.example.com',
      DEV_SERVER_PORT: '4010',
      ANDROID_EMULATOR_HOST: '127.0.0.1',
      QA_USE_DEV_WEB_URL: '1',
      QA_ENABLE_WEBVIEW_DEBUGGING: '1',
      QA_WEB_URL: 'https://qa.example.com',
    });

    expect(stdout).toContain('CHANNEL=production');
    expect(generatedConfig).toContain("export const APP_RUNTIME_CHANNEL = 'production';");
    expect(generatedConfig).toContain("export const PROD_WEB_URL = 'https://prod.example.com';");
    expect(generatedConfig).toContain('export const DEV_SERVER_PORT = 4010;');
    expect(generatedConfig).toContain("export const ANDROID_EMULATOR_HOST = '127.0.0.1';");
    expect(generatedConfig).toContain('export const QA_USE_DEV_WEB_URL = false;');
    expect(generatedConfig).toContain('export const QA_ENABLE_WEBVIEW_DEBUGGING = false;');
    expect(generatedConfig).toContain("export const QA_WEB_URL = '';");
  });

  it('infers qa runtime when QA flags are enabled and no runtime channel override is provided', () => {
    const { stdout, generatedConfig } = runGenerateConfig({
      APP_RUNTIME_CHANNEL: '',
      QA_USE_DEV_WEB_URL: '1',
      QA_ENABLE_WEBVIEW_DEBUGGING: '1',
      QA_WEB_URL: 'https://qa.example.com',
    });

    expect(stdout).toContain('CHANNEL=qa');
    expect(generatedConfig).toContain("export const APP_RUNTIME_CHANNEL = 'qa';");
    expect(generatedConfig).toContain('export const QA_USE_DEV_WEB_URL = true;');
    expect(generatedConfig).toContain('export const QA_ENABLE_WEBVIEW_DEBUGGING = true;');
    expect(generatedConfig).toContain("export const QA_WEB_URL = 'https://qa.example.com';");
  });
});
