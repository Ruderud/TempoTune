import { execSync, spawn } from 'node:child_process';
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const REPORT_DIR = resolve(ROOT, 'reports/qa/web');
const STATE_PATH = resolve(REPORT_DIR, 'managed-next-dev-server.json');
const LOG_PATH = resolve(REPORT_DIR, 'managed-next-dev-server.log');

type ManagedWebServerState = {
  pid: number;
  startedAt: string;
  logPath: string;
};

type ManagedWebServerResult = {
  status: 'already-running' | 'managed-existing' | 'started';
  logPath: string | null;
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function readState(): ManagedWebServerState | null {
  if (!existsSync(STATE_PATH)) return null;

  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf-8')) as ManagedWebServerState;
  } catch {
    return null;
  }
}

function clearState() {
  if (existsSync(STATE_PATH)) {
    unlinkSync(STATE_PATH);
  }
}

function isProcessRunning(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function isPortListening(port: number): boolean {
  const result = exec(`lsof -i :${port} -P -n`);
  return !!result && result.includes('LISTEN');
}

async function waitForPort(port: number, timeoutMs: number) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (isPortListening(port)) {
      return true;
    }

    await sleep(1000);
  }

  return false;
}

export async function ensureManagedWebDevServer(options?: {
  port?: number;
  timeoutMs?: number;
}): Promise<ManagedWebServerResult> {
  const port = options?.port ?? 3000;
  const timeoutMs = options?.timeoutMs ?? 120_000;
  const state = readState();

  if (state && !isProcessRunning(state.pid)) {
    clearState();
  }

  const activeState = readState();

  if (isPortListening(port)) {
    return {
      status:
        activeState && isProcessRunning(activeState.pid)
          ? 'managed-existing'
          : 'already-running',
      logPath: activeState?.logPath ?? null,
    };
  }

  if (activeState && isProcessRunning(activeState.pid)) {
    const ready = await waitForPort(port, Math.min(timeoutMs, 20_000));
    if (ready) {
      return {
        status: 'managed-existing',
        logPath: activeState.logPath,
      };
    }

    stopManagedWebDevServer();
  }

  mkdirSync(REPORT_DIR, { recursive: true });
  const logFd = openSync(LOG_PATH, 'a');
  const child = spawn('pnpm', ['--filter', '@tempo-tune/web', 'dev'], {
    cwd: ROOT,
    env: process.env,
    detached: true,
    stdio: ['ignore', logFd, logFd],
  });
  closeSync(logFd);

  if (!child.pid) {
    throw new Error('Failed to start the managed Next.js dev server.');
  }

  child.unref();

  writeFileSync(
    STATE_PATH,
    JSON.stringify(
      {
        pid: child.pid,
        startedAt: new Date().toISOString(),
        logPath: LOG_PATH,
      },
      null,
      2
    )
  );

  const ready = await waitForPort(port, timeoutMs);
  if (!ready) {
    stopManagedWebDevServer();
    throw new Error(
      `Timed out waiting for the Next.js dev server on :${port}. See ${LOG_PATH}`
    );
  }

  return {
    status: 'started',
    logPath: LOG_PATH,
  };
}

export function stopManagedWebDevServer() {
  const state = readState();
  if (!state) {
    return {
      stopped: false,
      logPath: null,
    };
  }

  clearState();

  try {
    process.kill(-state.pid, 'SIGTERM');
    return {
      stopped: true,
      logPath: state.logPath,
    };
  } catch {
    try {
      process.kill(state.pid, 'SIGTERM');
      return {
        stopped: true,
        logPath: state.logPath,
      };
    } catch {
      return {
        stopped: false,
        logPath: state.logPath,
      };
    }
  }
}
