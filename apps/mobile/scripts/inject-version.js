#!/usr/bin/env node

/**
 * Build-time version injection for TempoTune mobile app.
 *
 * Reads the semantic version from package.json and the current git commit hash,
 * then appends APP_VERSION to config.generated.ts.
 *
 * In CI, also writes DEPLOYMENT_VERSION to GITHUB_ENV.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON = path.join(ROOT, 'package.json');
const CONFIG_FILE = path.join(ROOT, 'src', 'config.generated.ts');

function getVersion() {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  return pkg.version;
}

function getCommitHash() {
  if (process.env.COMMIT_HASH) {
    return process.env.COMMIT_HASH;
  }
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function main() {
  const version = getVersion();
  const commitHash = getCommitHash();
  const appVersion = `tempotune-mobile-${version}-${commitHash}`;

  // Append APP_VERSION to existing config.generated.ts
  let content = '';
  if (fs.existsSync(CONFIG_FILE)) {
    content = fs.readFileSync(CONFIG_FILE, 'utf8');
  }

  // Remove any previous APP_VERSION line to avoid duplicates
  content = content.replace(/^export const APP_VERSION = .*;\n?/m, '');

  // Ensure trailing newline before appending
  if (content.length > 0 && !content.endsWith('\n')) {
    content += '\n';
  }

  content += `export const APP_VERSION = '${appVersion}';\n`;

  fs.writeFileSync(CONFIG_FILE, content, 'utf8');
  console.log(`Injected APP_VERSION = '${appVersion}' into config.generated.ts`);

  // In CI, write DEPLOYMENT_VERSION to GITHUB_ENV
  if (process.env.GITHUB_ENV) {
    fs.appendFileSync(process.env.GITHUB_ENV, `DEPLOYMENT_VERSION=${appVersion}\n`);
    console.log(`Wrote DEPLOYMENT_VERSION to GITHUB_ENV`);
  }
}

main();
