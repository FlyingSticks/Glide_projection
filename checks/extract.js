#!/usr/bin/env node
// extract.js — pull each plate's shipped geometry module out of its own HTML.
//
// The plate tests do not test a copy of the geometry; they test the exact code
// the page ships, lifted from the <script id="geo"> block. Run this once before
// run-all.js, from the repository root:
//
//     node checks/extract.js      (if the scripts live in checks/)
//     node extract.js             (if they live loose at the root)
//
'use strict';
const fs = require('fs');
const path = require('path');

const MAP = [
  ['the-gap-line-v1.html',    'geo_extract.js'],
  ['the-trichotomy-v2.html',  'geo_tri.js'],
  ['the-trichotomy-v2.html',  'geo_tri2.js'],
  ['the-fano-v1.html',        'geo_fano.js'],
  ['the-zones-v1.html',       'geo_zones.js'],
  ['the-midplane-v1.html',    'geo_mp.js'],
  ['the-halfformed-v1.html',  'geo_hf.js'],
  ['the-depth-projection-v1.html', 'geo_dp.js'],
];

// Works whether these scripts sit in checks/ or loose at the repository root:
// look for the plates beside the scripts first, then one level up.
function findRoot() {
  const probe = MAP[0][0];
  for (const dir of [__dirname, path.resolve(__dirname, '..')]) {
    if (fs.existsSync(path.join(dir, probe))) return dir;
  }
  return __dirname;
}
const root = findRoot();
const out  = __dirname;
let ok = 0, missing = [];

for (const [html, target] of MAP) {
  const src = path.join(root, html);
  if (!fs.existsSync(src)) { missing.push(html); continue; }
  const h = fs.readFileSync(src, 'utf8');
  const m = h.match(/<script id="geo">([\s\S]*?)<\/script>/);
  if (!m) { missing.push(html + ' (no geo block)'); continue; }
  fs.writeFileSync(path.join(out, target), m[1]);
  ok++;
}

console.log(`extracted ${ok}/${MAP.length} geometry modules into checks/`);
if (missing.length) {
  console.log('missing or unreadable:');
  for (const m of missing) console.log('  ' + m);
  console.log('\n(plate tests for those will not run; the standalone checks are unaffected)');
}
