#!/usr/bin/env node
/**
 * Robust CI/local clean install helper to mitigate Windows EPERM unlink
 * on native .node binaries (e.g. lmdb, msgpackr-extract) when using `npm ci`.
 *
 * Strategy:
 * 1. If node_modules exists, rename it (atomic move) to a temp folder.
 *    Renaming releases many Windows file locks immediately.
 * 2. Remove the temp folder recursively (with retries) in background style.
 * 3. Invoke `npm ci`.
 */

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const cwd = process.cwd();
const nm = path.join(cwd, 'node_modules');

function retry(fn, attempts, delayMs) {
  for (let i = 0; i < attempts; i++) {
    try {
      return fn();
    } catch (e) {
      if (i === attempts - 1) throw e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delayMs * (i + 1));
    }
  }
}

function safeRenameNodeModules() {
  if (!fs.existsSync(nm)) return null;
  const tempName = 'node_modules._old_' + Date.now();
  const tempPath = path.join(cwd, tempName);
  try {
    fs.renameSync(nm, tempPath);
    console.log('[ci-install] Renamed node_modules ->', tempName);
    return tempPath;
  } catch (e) {
    console.warn('[ci-install] Rename failed, will attempt direct removal', e.message);
    return null;
  }
}

function rmRecursive(target) {
  if (!target || !fs.existsSync(target)) return;
  retry(
    () => {
      fs.rmSync(target, { recursive: true, force: true });
    },
    5,
    40
  );
  console.log('[ci-install] Removed', target);
}

function runCommand(label, cmd) {
  console.log(`[ci-install] ${label}: ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit', env: process.env });
    return true;
  } catch (e) {
    console.error(`[ci-install] ${label} failed:`, e.message);
    return false;
  }
}

function runNpmCi() {
  const ciOk = runCommand(
    'npm ci',
    `${process.platform === 'win32' ? 'npm.cmd' : 'npm'} ci --no-audit --no-fund`
  );
  if (ciOk) {
    console.log('[ci-install] npm ci completed successfully');
    return;
  }
  console.warn('[ci-install] Attempting fallback: npm install');
  const installOk = runCommand(
    'npm install',
    `${process.platform === 'win32' ? 'npm.cmd' : 'npm'} install --no-audit --no-fund`
  );
  if (!installOk) {
    console.error(
      '[ci-install] Both npm ci and npm install failed. Consider moving repo outside OneDrive or pausing sync/AV.'
    );
    process.exit(1);
  }
  console.log('[ci-install] Fallback npm install succeeded');
}

function main() {
  if (/OneDrive/i.test(cwd)) {
    console.warn(
      '[ci-install] WARNING: Project directory is under OneDrive. This can cause EPERM lock issues on native addons.'
    );
  }
  const renamed = safeRenameNodeModules();
  // Remove old copy (ignore errors, done before install to minimize locks)
  if (renamed) {
    try {
      rmRecursive(renamed);
    } catch (e) {
      console.warn('[ci-install] Cleanup failed', e.message);
    }
  }
  runNpmCi();
}

main();
