#!/usr/bin/env tsx
/**
 * check-regression.ts
 * Detects which features are potentially affected by the current git diff.
 * Reads criticalPaths from docs/features/*.md frontmatter and matches against changed files.
 */
import { readFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import matter from 'gray-matter';
import { globSync } from 'glob';
import { minimatch } from 'minimatch';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const FEATURES_DIR = join(ROOT, 'docs/features');

interface FeatureDoc {
  id: string;
  name: string;
  status: string;
  platforms: string[];
  criticalPaths: string[];
  filePath: string;
}

function getChangedFiles(base?: string): string[] {
  const baseRef = base || process.env.QA_BASE_REF || 'HEAD~1';
  try {
    const diff = execSync(`git diff --name-only ${baseRef}`, {
      cwd: ROOT,
      encoding: 'utf-8',
    });
    return diff
      .trim()
      .split('\n')
      .filter((line) => line.length > 0);
  } catch {
    // Fallback: unstaged + staged changes
    const diff = execSync('git diff --name-only && git diff --name-only --cached', {
      cwd: ROOT,
      encoding: 'utf-8',
    });
    return diff
      .trim()
      .split('\n')
      .filter((line) => line.length > 0);
  }
}

function loadFeatureDocs(): FeatureDoc[] {
  const files = globSync('*.md', { cwd: FEATURES_DIR, absolute: true });
  const docs: FeatureDoc[] = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const { data } = matter(content);
      if (data.id && data.criticalPaths && Array.isArray(data.criticalPaths)) {
        docs.push({
          id: data.id,
          name: data.name || data.id,
          status: data.status || 'unknown',
          platforms: data.platforms || [],
          criticalPaths: data.criticalPaths,
          filePath: file.replace(ROOT + '/', ''),
        });
      }
    } catch {
      // Skip unparseable docs (validate-feature-docs handles errors)
    }
  }

  return docs;
}

function matchFeatures(
  changedFiles: string[],
  features: FeatureDoc[],
): Map<string, { feature: FeatureDoc; matchedFiles: string[] }> {
  const results = new Map<string, { feature: FeatureDoc; matchedFiles: string[] }>();

  for (const feature of features) {
    const matchedFiles: string[] = [];

    for (const changed of changedFiles) {
      for (const pattern of feature.criticalPaths) {
        if (minimatch(changed, pattern)) {
          matchedFiles.push(changed);
          break; // Don't double-count same file
        }
      }
    }

    if (matchedFiles.length > 0) {
      results.set(feature.id, { feature, matchedFiles });
    }
  }

  return results;
}

// Main
const baseRef = process.argv[2];
const changedFiles = getChangedFiles(baseRef);

if (changedFiles.length === 0) {
  console.log('No changed files detected.');
  process.exit(0);
}

const features = loadFeatureDocs();

if (features.length === 0) {
  console.log('⚠ No feature docs found in docs/features/');
  process.exit(0);
}

console.log(`Changed files: ${changedFiles.length}`);
console.log(`Feature docs: ${features.length}\n`);

const affected = matchFeatures(changedFiles, features);

if (affected.size === 0) {
  console.log('✓ No features affected by current changes.');
  process.exit(0);
}

console.log(`⚠ ${affected.size} feature(s) potentially affected:\n`);

for (const [id, { feature, matchedFiles }] of affected) {
  const statusBadge =
    feature.status === 'implemented' ? '●' : feature.status === 'partial' ? '◐' : '○';
  console.log(`  ${statusBadge} ${feature.name} [${id}] (${feature.platforms.join(', ')})`);
  for (const f of matchedFiles) {
    console.log(`    → ${f}`);
  }
}

console.log('\n─── Regression check complete ───');

// Output JSON for CI consumption
const jsonOutput = {
  totalChanged: changedFiles.length,
  affectedFeatures: Array.from(affected.entries()).map(([id, { feature, matchedFiles }]) => ({
    id,
    name: feature.name,
    status: feature.status,
    platforms: feature.platforms,
    matchedFiles,
  })),
};

if (process.env.CI || process.env.QA_JSON_OUTPUT) {
  console.log('\n--- JSON ---');
  console.log(JSON.stringify(jsonOutput, null, 2));
}
