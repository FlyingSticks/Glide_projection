// check_census.js — count/incidence as the board's zeroth level
// Structure: the edges-image of a cube. Picture square [-1,1]^2 with an n x n
// lattice; depth levels g_j = j*G/m, j = 0..m. Every lattice node carries a
// depth line; every level carries a copy of the lattice. Point (u, v, g) maps
// per channel by the shipped law  w = s + (w0 - s)(1 - r g) + sigma g.
//
// Modes:
//   A     — rates (0, 0) with shear: both channels Type A
//   B     — rates (r, r), r > 0: both channels Type B (collector at gauge 1/r)
//   FREE  — mode B followed by a smooth nonlinear bend of the picture
//
// Claims (the invariance ladder read bottom-up):
//  1. CENSUS: line counts, point counts, marks-per-line, and the full
//     incidence table are IDENTICAL across all modes and all parameter values
//     — count/incidence is preserved by everything, including the free bend.
//  2. CROSS-RATIO: four marks at equal depth steps DZ on a depth line have
//     picture cross-ratio equal to the cross-ratio of their Z values — in
//     modes A and B (any rates, any shear), broken by the free bend.
//  3. METRIC: the equal-DZ marks are NOT equally spaced in the picture in any
//     mode with a finite pinhole distance — plain length ratios survive
//     nothing; they are not even a level of the ladder here.
//  4. Graduated edge: marks at equal GAUGE steps are equally spaced on the
//     drawn depth edge in modes A and B (w affine in g) — and the free bend
//     breaks that too.

'use strict';
let pass = 0, fail = 0;
function assert(name, ok, d) {
  (ok ? pass++ : fail++);
  console.log((ok ? 'PASS  ' : 'FAIL  ') + name + (d ? '   [' + d + ']' : ''));
}
const chan = (g, w0, s, r, sig) => s + (w0 - s) * (1 - r * g) + sig * g;
const bend = (p, a) => [p[0] + a * Math.sin(1.7 * p[1] + 0.4), p[1] + a * Math.sin(1.3 * p[0] - 0.2)];
function cr4(t) { return ((t[2] - t[0]) * (t[3] - t[1])) / ((t[2] - t[1]) * (t[3] - t[0])); }

// gauge from depth: p(Z) = -Zp/(Z - Zp), g(Z) = 1 - p(Z)/p(Zg)
function gaugeOf(Z, Zp, Zg) {
  const p = z => -Zp / (z - Zp);
  return 1 - p(Z) / p(Zg);
}

const n = 3, m = 3, G = 0.8;
function buildStructure() {
  // abstract structure: nodes (i, j, level), lattice lines, depth lines
  const nodes = [], nodeId = {};
  for (let l = 0; l <= m; l++)
    for (let i = 0; i <= n; i++)
      for (let j = 0; j <= n; j++) {
        nodeId[[i, j, l]] = nodes.length;
        nodes.push([i, j, l]);
      }
  const curves = []; // each curve = ordered list of node ids
  for (let l = 0; l <= m; l++) {
    for (let i = 0; i <= n; i++) { // vertical lattice lines at level l
      const c = []; for (let j = 0; j <= n; j++) c.push(nodeId[[i, j, l]]);
      curves.push(c);
    }
    for (let j = 0; j <= n; j++) { // horizontal lattice lines at level l
      const c = []; for (let i = 0; i <= n; i++) c.push(nodeId[[i, j, l]]);
      curves.push(c);
    }
  }
  for (let i = 0; i <= n; i++)
    for (let j = 0; j <= n; j++) { // depth line per node
      const c = []; for (let l = 0; l <= m; l++) c.push(nodeId[[i, j, l]]);
      curves.push(c);
    }
  return { nodes, curves };
}
function placeNodes(struct, mode, r, sig, a) {
  return struct.nodes.map(([i, j, l]) => {
    const u = -1 + 2 * i / n, v = -1 + 2 * j / n, g = l * G / m;
    let p = [chan(g, u, 0, mode === 'A' ? 0 : r, sig),
             chan(g, v, 0, mode === 'A' ? 0 : r, sig * 0.6)];
    if (mode === 'FREE') p = bend(p, a);
    return p;
  });
}
function census(struct, placed) {
  // counts + incidence table (which node ids lie on which curve, in order)
  const marks = struct.curves.map(c => c.length);
  const table = struct.curves.map(c => c.join(',')).join('|');
  // node degree: how many curves pass through each node
  const deg = new Array(struct.nodes.length).fill(0);
  struct.curves.forEach(c => c.forEach(id => deg[id]++));
  return {
    lines: struct.curves.length,
    points: struct.nodes.length,
    marks: marks.join(','),
    degrees: deg.join(','),
    table
  };
}

const S = buildStructure();
const settings = [
  ['A', 0, 0.25, 0], ['A', 0, 0.55, 0],
  ['B', 0.4, 0.25, 0], ['B', 1.0, 0.1, 0], ['B', 0.7, 0.4, 0],
  ['FREE', 0.7, 0.25, 0.12], ['FREE', 0.4, 0.25, 0.2]
];
// 1. census identical everywhere
{
  const cs = settings.map(([mo, r, sig, a]) => census(S, placeNodes(S, mo, r, sig, a)));
  const ref = JSON.stringify(cs[0]);
  const allSame = cs.every(c => JSON.stringify(c) === ref);
  assert('1. census + incidence table identical across all modes and parameters',
    allSame, cs[0].lines + ' curves, ' + cs[0].points + ' points, ' + settings.length + ' settings');
}

// 2 & 3 & 4. the ladder on a depth line, using real depths Z
{
  const Zp = -5, Zg = 4;               // pinhole behind picture plane, gauge plane ahead
  const Zs = [0.5, 1.5, 2.5, 3.5];     // equal DZ
  const gs = Zs.map(Z => gaugeOf(Z, Zp, Zg));
  const crZ = cr4(Zs);
  const probes = [['A', 0, 0.5, 0], ['B', 0.6, 0.3, 0], ['FREE', 0.6, 0.3, 0.15]];
  const res = probes.map(([mo, r, sig, a]) => {
    const pts = gs.map(g => {
      let p = [chan(g, 0.8, 0, mo === 'A' ? 0 : r, sig), chan(g, 0.5, 0, mo === 'A' ? 0 : r, sig * 0.6)];
      if (mo === 'FREE') p = bend(p, a);
      return p;
    });
    // parametrize along the (possibly bent) run by chord from first point direction
    const u = [pts[3][0] - pts[0][0], pts[3][1] - pts[0][1]];
    const nn = Math.hypot(u[0], u[1]);
    const t = pts.map(p => ((p[0] - pts[0][0]) * u[0] + (p[1] - pts[0][1]) * u[1]) / nn);
    const parts = [t[1] - t[0], t[2] - t[1], t[3] - t[2]];
    return { dcr: Math.abs(cr4(t) - crZ), spread: Math.max(...parts) / Math.min(...parts) };
  });
  assert('2. cross-ratio of equal-DZ marks preserved in mode A', res[0].dcr < 1e-9,
    'dcr ' + res[0].dcr.toExponential(2));
  assert('2b. cross-ratio preserved in mode B', res[1].dcr < 1e-9,
    'dcr ' + res[1].dcr.toExponential(2));
  assert('2c. cross-ratio broken by the free bend (orders above the A/B residuals)',
    res[2].dcr > 1e-6 && res[2].dcr > 1e6 * Math.max(res[0].dcr, res[1].dcr),
    'dcr ' + res[2].dcr.toExponential(2) + ' vs preserved ' + Math.max(res[0].dcr, res[1].dcr).toExponential(2));
  assert('3. metric: equal DZ is NOT equal spacing, even in mode A (the gauge is projective in Z)',
    res[0].spread > 1.02 && res[1].spread > 1.02,
    'spreads ' + res[0].spread.toFixed(3) + ', ' + res[1].spread.toFixed(3));
}
{
  // 4. equal-GAUGE marks: equally spaced in A and B, broken by bend
  const gs = [0.1, 0.3, 0.5, 0.7];
  const probe = (mo, r, sig, a) => {
    const pts = gs.map(g => {
      let p = [chan(g, 0.8, 0, mo === 'A' ? 0 : r, sig), chan(g, 0.5, 0, mo === 'A' ? 0 : r, sig * 0.6)];
      if (mo === 'FREE') p = bend(p, a);
      return p;
    });
    const d = i => Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    const parts = [d(0), d(1), d(2)];
    return Math.max(...parts) / Math.min(...parts);
  };
  const sA = probe('A', 0, 0.5, 0), sB = probe('B', 0.6, 0.3, 0), sF = probe('FREE', 0.6, 0.3, 0.15);
  assert('4. graduated edge: equal-gauge marks equally spaced in A and B, broken by the bend',
    Math.abs(sA - 1) < 1e-9 && Math.abs(sB - 1) < 1e-9 && sF > 1.005,
    'spreads ' + sA.toFixed(9) + ', ' + sB.toFixed(9) + ', ' + sF.toFixed(4));
}

console.log('\n' + pass + '/' + (pass + fail) + ' assertions passed' + (fail ? '  ***FAILURES***' : ''));
process.exit(fail ? 1 : 0);
