#!/usr/bin/env tsx
/**
 * validate-feature-docs.ts
 * Validates frontmatter schema and criticalPaths existence in docs/features/*.md
 */
import { readFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { globSync } from 'glob';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const FEATURES_DIR = join(ROOT, 'docs/features');

const REQUIRED_FIELDS = ['id', 'name', 'status', 'platforms', 'criticalPaths'] as const;
const VALID_STATUSES = ['implemented', 'partial', 'planned'] as const;
const VALID_PLATFORMS = ['web', 'ios', 'android'] as const;

interface FeatureFrontmatter {
  id: string;
  name: string;
  status: string;
  platforms: string[];
  tests?: { unit?: string[]; e2eWeb?: string[]; e2eDevice?: string[] };
  criticalPaths: string[];
  manualChecks?: string[];
}

interface ValidationError {
  file: string;
  field: string;
  message: string;
}

function validateDoc(filePath: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const relative = filePath.replace(ROOT + '/', '');
  const content = readFileSync(filePath, 'utf-8');

  let data: FeatureFrontmatter;
  try {
    const parsed = matter(content);
    data = parsed.data as FeatureFrontmatter;
  } catch {
    errors.push({ file: relative, field: 'frontmatter', message: 'Failed to parse YAML frontmatter' });
    return errors;
  }

  // Required fields
  for (const field of REQUIRED_FIELDS) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push({ file: relative, field, message: `Missing required field "${field}"` });
    }
  }

  // Status validation
  if (data.status && !VALID_STATUSES.includes(data.status as typeof VALID_STATUSES[number])) {
    errors.push({
      file: relative,
      field: 'status',
      message: `Invalid status "${data.status}". Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  // Platforms validation
  if (data.platforms) {
    if (!Array.isArray(data.platforms)) {
      errors.push({ file: relative, field: 'platforms', message: 'Must be an array' });
    } else {
      for (const p of data.platforms) {
        if (!VALID_PLATFORMS.includes(p as typeof VALID_PLATFORMS[number])) {
          errors.push({
            file: relative,
            field: 'platforms',
            message: `Invalid platform "${p}". Must be one of: ${VALID_PLATFORMS.join(', ')}`,
          });
        }
      }
    }
  }

  // criticalPaths existence check
  if (data.criticalPaths) {
    if (!Array.isArray(data.criticalPaths)) {
      errors.push({ file: relative, field: 'criticalPaths', message: 'Must be an array' });
    } else {
      for (const cp of data.criticalPaths) {
        // Support glob patterns — verify at least one match
        const matches = globSync(cp, { cwd: ROOT });
        if (matches.length === 0) {
          errors.push({
            file: relative,
            field: 'criticalPaths',
            message: `Path not found: "${cp}"`,
          });
        }
      }
    }
  }

  // tests structure validation (optional but must be valid if present)
  if (data.tests) {
    if (typeof data.tests !== 'object') {
      errors.push({ file: relative, field: 'tests', message: 'Must be an object' });
    } else {
      for (const key of ['unit', 'e2eWeb', 'e2eDevice'] as const) {
        const val = data.tests[key];
        if (val !== undefined && !Array.isArray(val)) {
          errors.push({ file: relative, field: `tests.${key}`, message: 'Must be an array' });
        }
      }
    }
  }

  return errors;
}

// Main
const featureFiles = globSync('*.md', { cwd: FEATURES_DIR, absolute: true });

if (featureFiles.length === 0) {
  console.log('⚠ No feature docs found in docs/features/');
  process.exit(0);
}

console.log(`Validating ${featureFiles.length} feature doc(s)...\n`);

let totalErrors = 0;
for (const file of featureFiles.sort()) {
  const errors = validateDoc(file);
  const relative = file.replace(ROOT + '/', '');

  if (errors.length === 0) {
    console.log(`  ✓ ${relative}`);
  } else {
    totalErrors += errors.length;
    console.log(`  ✗ ${relative}`);
    for (const e of errors) {
      console.log(`    - [${e.field}] ${e.message}`);
    }
  }
}

console.log(`\n${totalErrors === 0 ? '✓ All feature docs valid' : `✗ ${totalErrors} error(s) found`}`);
process.exit(totalErrors > 0 ? 1 : 0);
