#!/usr/bin/env tsx
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadQaEnv } from './load-qa-env';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const IOS_PROJECT = resolve(
  ROOT,
  'apps/mobile/ios/TempoTune.xcodeproj/project.pbxproj'
);

loadQaEnv();

export type AppleDevelopmentIdentity = {
  teamId: string;
  label: string;
};

export type IosRealDeviceSigningContext = {
  teamId: string | null;
  teamSource: 'env' | 'project' | 'security' | 'unresolved';
  signingId: string;
  appBundleId: string;
  updatedWdaBundleId: string;
  identities: AppleDevelopmentIdentity[];
  notes: string[];
};

function exec(command: string): string | null {
  try {
    return execSync(command, {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function readProjectDevelopmentTeam(): string | null {
  try {
    const source = readFileSync(IOS_PROJECT, 'utf-8');
    const match = source.match(/DEVELOPMENT_TEAM = ([A-Z0-9]+);/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function readAppleDevelopmentIdentities(): AppleDevelopmentIdentity[] {
  const output = exec('security find-identity -v -p codesigning');
  if (!output) return [];

  const identities = output
    .split('\n')
    .map((line) => {
      const labelMatch = line.match(/"([^"]+)"/);
      if (!labelMatch || !labelMatch[1].startsWith('Apple Development:')) {
        return null;
      }

      const subject = exec(
        `security find-certificate -a -c ${shellQuote(labelMatch[1])} -p | openssl x509 -noout -subject`
      );
      const teamIdFromSubject = subject?.match(/OU=([A-Z0-9]+)/)?.[1];
      const fallbackTeamId = labelMatch[1].match(/\(([A-Z0-9]+)\)$/)?.[1];
      const teamId = teamIdFromSubject || fallbackTeamId;

      if (!teamId) return null;

      return {
        teamId,
        label: labelMatch[1],
      };
    })
    .filter((value): value is AppleDevelopmentIdentity => value !== null);

  return Array.from(
    new Map(identities.map((identity) => [identity.teamId, identity])).values()
  );
}

export function resolveIosRealDeviceSigningContext(): IosRealDeviceSigningContext {
  const envTeamId =
    process.env.QA_IOS_XCODE_ORG_ID?.trim() ||
    process.env.QA_IOS_TEAM_ID?.trim() ||
    null;
  const projectTeamId = readProjectDevelopmentTeam();
  const identities = readAppleDevelopmentIdentities();
  const signingId =
    process.env.QA_IOS_XCODE_SIGNING_ID ||
    process.env.QA_IOS_SIGNING_ID ||
    'Apple Development';
  const appBundleId = process.env.QA_IOS_BUNDLE_ID || 'com.rud.tempotune';
  const updatedWdaBundleId =
    process.env.QA_IOS_UPDATED_WDA_BUNDLE_ID ||
    process.env.QA_IOS_WDA_BUNDLE_ID ||
    `${appBundleId}.wda`;
  const notes: string[] = [];

  if (envTeamId) {
    return {
      teamId: envTeamId,
      teamSource: 'env',
      signingId,
      appBundleId,
      updatedWdaBundleId,
      identities,
      notes,
    };
  }

  if (
    projectTeamId &&
    identities.some((identity) => identity.teamId === projectTeamId)
  ) {
    return {
      teamId: projectTeamId,
      teamSource: 'project',
      signingId,
      appBundleId,
      updatedWdaBundleId,
      identities,
      notes,
    };
  }

  if (projectTeamId && identities.length > 0) {
    notes.push(
      `TempoTune iOS project DEVELOPMENT_TEAM=${projectTeamId}, but available Apple Development identities are ${identities
        .map((identity) => identity.teamId)
        .join(', ')}.`
    );
  }

  if (identities.length > 0) {
    const [firstIdentity] = identities;
    if (identities.length > 1) {
      notes.push(
        `Multiple Apple Development teams found. Auto-selecting ${firstIdentity.teamId}. Override with QA_IOS_XCODE_ORG_ID if needed.`
      );
    }

    return {
      teamId: firstIdentity.teamId,
      teamSource: 'security',
      signingId,
      appBundleId,
      updatedWdaBundleId,
      identities,
      notes,
    };
  }

  notes.push(
    'No Apple Development signing identities were found in the local keychain.'
  );

  return {
    teamId: null,
    teamSource: 'unresolved',
    signingId,
    appBundleId,
    updatedWdaBundleId,
    identities,
    notes,
  };
}
