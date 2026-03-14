#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(dirname "$0")"
CONFIG_FILE="${1:-${SCRIPT_DIR}/../src/config.generated.ts}"

node - "$CONFIG_FILE" <<'EOF'
const fs = require('node:fs');

const configPath = process.argv[2];
const source = fs.readFileSync(configPath, 'utf8');

function pickString(name) {
  const match = source.match(new RegExp(`export const ${name} = '([^']*)';`));
  return match ? match[1] : null;
}

function pickBoolean(name) {
  const match = source.match(new RegExp(`export const ${name} = (true|false);`));
  return match ? match[1] === 'true' : null;
}

function isPrivateOrLocalHost(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname;

    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '10.0.2.2' ||
      host.startsWith('192.168.') ||
      /^10\.\d+\.\d+\.\d+$/.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(host)
    );
  } catch {
    return true;
  }
}

const runtimeChannel = pickString('APP_RUNTIME_CHANNEL');
const prodWebUrl = pickString('PROD_WEB_URL');
const qaUseDevWebUrl = pickBoolean('QA_USE_DEV_WEB_URL');
const qaEnableWebviewDebugging = pickBoolean('QA_ENABLE_WEBVIEW_DEBUGGING');
const qaWebUrl = pickString('QA_WEB_URL');

const errors = [];

if (runtimeChannel !== 'production') {
  errors.push(`APP_RUNTIME_CHANNEL must be 'production' (got ${runtimeChannel ?? 'null'})`);
}

if (qaUseDevWebUrl !== false) {
  errors.push('QA_USE_DEV_WEB_URL must be false');
}

if (qaEnableWebviewDebugging !== false) {
  errors.push('QA_ENABLE_WEBVIEW_DEBUGGING must be false');
}

if ((qaWebUrl ?? '') !== '') {
  errors.push('QA_WEB_URL must be empty for production builds');
}

if (!prodWebUrl || !prodWebUrl.startsWith('https://')) {
  errors.push(`PROD_WEB_URL must be an https URL (got ${prodWebUrl ?? 'null'})`);
} else if (isPrivateOrLocalHost(prodWebUrl)) {
  errors.push(`PROD_WEB_URL must not point to localhost or a private network host (got ${prodWebUrl})`);
}

if (errors.length > 0) {
  console.error('[verify-production-runtime-config] Production runtime config validation failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`[verify-production-runtime-config] OK: ${prodWebUrl}`);
EOF
