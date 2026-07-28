#!/usr/bin/env node
// run-all.js — run every check in this folder and summarise.
//
//     node checks/extract.js && node checks/run-all.js
//
// Exit code is nonzero if any script fails, so this can gate a commit.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const dir = __dirname;
const files = fs.readdirSync(dir)
  .filter(f => f.startsWith('check_') && f.endsWith('.js'))
  .sort();

let passed = 0, failed = 0, totalAssertions = 0;
const failures = [];

for (const f of files) {
  let out = '', code = 0;
  try {
    out = execFileSync(process.execPath, [path.join(dir, f)], { encoding: 'utf8' });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
    code = e.status === undefined ? 1 : e.status;
  }
  const m = out.match(/(\d+)\/(\d+) (?:shipped-code |framing )?assertions passed/);
  const tally = m ? `${m[1]}/${m[2]}` : '—';
  if (m) totalAssertions += parseInt(m[2], 10);
  if (code === 0) { passed++; console.log(`  PASS  ${f.padEnd(30)} ${tally}`); }
  else { failed++; failures.push(f); console.log(`  FAIL  ${f.padEnd(30)} ${tally}`); }
}

console.log('');
console.log(`${passed}/${files.length} scripts passed · ${totalAssertions} assertions total`);
if (failed) {
  console.log('failing: ' + failures.join(', '));
  process.exit(1);
}
