import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const CANDIDATE_FILES = ['.env.qa.local', '.env.local', '.env'];

let loaded = false;

function normalizeValue(rawValue: string): string {
  const trimmed = rawValue.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function loadQaEnv() {
  if (loaded) return;
  loaded = true;

  for (const filename of CANDIDATE_FILES) {
    const fullPath = resolve(ROOT, filename);
    if (!existsSync(fullPath)) continue;

    const source = readFileSync(fullPath, 'utf-8');
    for (const line of source.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const exportStripped = trimmed.startsWith('export ')
        ? trimmed.slice('export '.length).trim()
        : trimmed;
      const separatorIndex = exportStripped.indexOf('=');
      if (separatorIndex <= 0) continue;

      const key = exportStripped.slice(0, separatorIndex).trim();
      if (!key || process.env[key] !== undefined) continue;

      const rawValue = exportStripped.slice(separatorIndex + 1);
      process.env[key] = normalizeValue(rawValue);
    }
  }
}
