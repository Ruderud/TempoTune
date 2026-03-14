import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptsDir, '../../..');
const verifyScriptPath = path.join(scriptsDir, 'verify-production-runtime-config.sh');

function withTempConfig(contents: string) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tempotune-prod-config-'));
  const configPath = path.join(tempDir, 'config.generated.ts');
  fs.writeFileSync(configPath, contents);
  return configPath;
}

function runVerifyAgainst(configPath: string) {
  return spawnSync('bash', [verifyScriptPath, configPath], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

describe('verify-production-runtime-config.sh', () => {
  it('passes when the generated config is production-safe', () => {
    const configPath = withTempConfig(
      [
        "export const DEV_MACHINE_IP = '192.168.0.2';",
        'export const DEV_SERVER_PORT = 3000;',
        "export const PROD_WEB_URL = 'https://tempotune.example.com';",
        "export const ANDROID_EMULATOR_HOST = '10.0.2.2';",
        "export const APP_RUNTIME_CHANNEL = 'production';",
        'export const QA_USE_DEV_WEB_URL = false;',
        'export const QA_ENABLE_WEBVIEW_DEBUGGING = false;',
        "export const QA_WEB_URL = '';",
      ].join('\n'),
    );

    const result = runVerifyAgainst(configPath);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('fails when production config points at a private-network host', () => {
    const configPath = withTempConfig(
      [
        "export const DEV_MACHINE_IP = '192.168.0.2';",
        'export const DEV_SERVER_PORT = 3000;',
        "export const PROD_WEB_URL = 'https://192.168.0.50';",
        "export const ANDROID_EMULATOR_HOST = '10.0.2.2';",
        "export const APP_RUNTIME_CHANNEL = 'production';",
        'export const QA_USE_DEV_WEB_URL = false;',
        'export const QA_ENABLE_WEBVIEW_DEBUGGING = false;',
        "export const QA_WEB_URL = '';",
      ].join('\n'),
    );

    const result = runVerifyAgainst(configPath);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('private network host');
  });
});
