#!/usr/bin/env node
/*
  Enforces Angular version consistency with one permitted exception:
  - Allow @angular/ssr to differ (it may lag behind in patch versions)
  - All other @angular/* (framework/runtime/tooling) packages must share the same major.minor.patch OR an allowed pinned set.
  Additionally ensures that no caret (^) or tilde (~) ranges are used for framework packages (they must be exact) to guarantee reproducibility.
*/
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const deps = { ...(pkg.dependencies||{}), ...(pkg.devDependencies||{}) };

const angularEntries = Object.entries(deps).filter(([name]) => name.startsWith('@angular/'));
if (angularEntries.length === 0) {
  console.log('No @angular/* packages found. Skipping check.');
  process.exit(0);
}

// Packages allowed to have version variance (optional peers / tooling)
const allowedExceptions = new Set([
  '@angular/ssr',      // may lag behind
  '@angular/cli',      // tooling can be a different patch
  '@angular/build'     // build tooling may differ
]);

// Collect enforced versions (exclude exceptions)
const enforced = angularEntries.filter(([name]) => !allowedExceptions.has(name));

// Extract exact versions, disallow ranges for enforced packages
const problems = [];
const versionMap = new Map();

for (const [name, version] of enforced) {
  if (/^[~^]/.test(version)) {
    problems.push(`${name} uses range specifier (${version}). Use an exact version.`);
    continue;
  }
  const key = version; // we treat version as exact string
  if (!versionMap.has(key)) versionMap.set(key, []);
  versionMap.get(key).push(name);
}

if (versionMap.size > 1) {
  const details = [...versionMap.entries()].map(([ver, list]) => `${ver}: ${list.join(', ')}`).join('\n');
  problems.push(`Angular packages have mismatched versions:\n${details}`);
}

// Check exceptions still share the same MAJOR.MINOR as baseline (optional heuristic)
const baselineVersion = [...versionMap.keys()][0];
if (baselineVersion) {
  const [baseMaj, baseMin] = baselineVersion.split('.');
  for (const [name, version] of angularEntries) {
    if (allowedExceptions.has(name)) {
      // Only enforce major/minor for non-tooling exceptions (@angular/ssr)
      const tooling = name === '@angular/cli' || name === '@angular/build';
      if (!tooling) {
        const [maj, min] = version.replace(/^[~^]/,'').split('.');
        if (maj !== baseMaj || min !== baseMin) {
          problems.push(`${name} (${version}) differs in major/minor from baseline ${baselineVersion}`);
        }
      }
    }
  }
}

if (problems.length) {
  console.error('\nAngular version consistency check FAILED:\n- ' + problems.join('\n- '));
  process.exit(1);
}

console.log('Angular version consistency check PASSED.');
