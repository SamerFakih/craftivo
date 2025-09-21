#!/usr/bin/env node
/**
 * Preinstall cleanup script.
 * Addresses Windows EPERM unlink issues during `npm ci` by proactively
 * removing potentially locked native addon directories before npm prunes.
 */
const fs = require('fs');
const path = require('path');

// Directories (package roots) that commonly ship native .node binaries and may lock
// Add patterns as needed if new EPERM offenders appear.
const targets = ['@msgpackr-extract', '@lmdb'];

// Attempt to rename before delete (Windows sometimes releases handle after rename)
function tryRename(p) {
  try {
    if (fs.existsSync(p)) {
      const temp = p + '.cleanup-' + Date.now();
      fs.renameSync(p, temp);
      return temp;
    }
  } catch (_) {
    /* ignore */
  }
  return p;
}

function rmDirSafe(dir) {
  if (!fs.existsSync(dir)) return;
  const renamed = tryRename(dir);
  const attempts = 5;
  for (let i = 0; i < attempts; i++) {
    try {
      fs.rmSync(renamed, { recursive: true, force: true });
      console.log('[preinstall-clean] Removed', renamed);
      return;
    } catch (e) {
      if (i === attempts - 1) {
        console.warn('[preinstall-clean] Failed to remove', renamed, e.message);
      } else {
        // small backoff
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25 * (i + 1));
      }
    }
  }
}

function main() {
  const cwd = process.cwd();
  const nodeModules = path.join(cwd, 'node_modules');

  if (!fs.existsSync(nodeModules)) return; // First fresh install; nothing to do.

  // If a previous failed install left a partially pruned node_modules, nuking the whole dir
  // before npm ci does its own prune can avoid EPERM on specific nested native binaries.
  const partialMarker = path.join(nodeModules, '.package-lock.json'); // improbable file; heuristic placeholder
  if (fs.existsSync(nodeModules) && fs.readdirSync(nodeModules).length < 10) {
    // Very small node_modules could be an aborted prune; let npm handle it.
  }

  for (const t of targets) {
    const full = path.join(nodeModules, t);
    if (fs.existsSync(full)) {
      rmDirSafe(full);
    }
  }
}

main();
