// check_typeab.js — Type A / Type B transfers paired with the channel law
// w(g) = s + (w0 - s)*(1 - r*g) + sigma*g      (six-core-armatures sheet, verbatim)
//
// Claims:
//  1. Graduated edge is exact for EVERY rate: w is affine in g, so equal gauge
//     steps are equal picture steps on the drawn edge, at all r.
//  2. Type A (parallel transfer, "no collector point"): carries length ratios
//     onto ANY target line, parallel or not. Affine; midpoints to midpoints.
//  3. Type B (transfer through a collector point): onto a NON-parallel target,
//     equal parts become a progression, but cross-ratio is preserved exactly.
//     Onto a PARALLEL target it is a homothety and ratios survive — Kevin's
//     "non-parallel" annotation is the load-bearing condition.
//  4. Engine tie: the depth lines of an r = 0 channel are PARALLEL (Type A,
//     no collector). For r > 0 all depth lines of the channel CONCUR at
//     gauge 1/r — the seat / directing seat IS the collector point (Type B).
//  5. Pushbroom (0,1) = the Hybrid panel: one Type A channel crossed with one
//     Type B channel in a single construction.
//  6. Doubly ruled transfer on an irregular quad (Type A drawing): ruling at
//     parameter t cuts both unequal rails at ratio t; rulings do not concur.

'use strict';
let pass = 0, fail = 0;
function assert(name, ok, d) {
  (ok ? pass++ : fail++);
  console.log((ok ? 'PASS  ' : 'FAIL  ') + name + (d ? '   [' + d + ']' : ''));
}
const hyp = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function lineFrom2(p, q) { return [p[1] - q[1], q[0] - p[0], p[0] * q[1] - p[1] * q[0]]; }
function meet(l, m) {
  const x = l[1] * m[2] - l[2] * m[1], y = l[2] * m[0] - l[0] * m[2], w = l[0] * m[1] - l[1] * m[0];
  return Math.abs(w) < 1e-13 ? null : [x / w, y / w];
}
function cr4(t) { return ((t[2] - t[0]) * (t[3] - t[1])) / ((t[2] - t[1]) * (t[3] - t[0])); }

// ---- the shipped channel law ----
const chan = (g, w0, s, r, sig) => s + (w0 - s) * (1 - r * g) + sig * g;

// 1. affine in g at all rates: vanishing second difference
{
  let worst = 0;
  for (const r of [0, 0.35, 0.62, 1]) for (const sig of [0, 0.3]) {
    for (let i = 0; i < 20; i++) {
      const g = i * 0.04, h = 0.013;
      const d2 = chan(g + 2 * h, 2, 0.5, r, sig) - 2 * chan(g + h, 2, 0.5, r, sig) + chan(g, 2, 0.5, r, sig);
      worst = Math.max(worst, Math.abs(d2));
    }
  }
  assert('1. graduated edge exact at every rate: w affine in g', worst < 1e-12,
    'worst 2nd difference ' + worst.toExponential(2));
}

// 2. Type A: parallel transfer preserves ratios onto a NON-parallel target
{
  const dir = [0.31, 0.87]; // transfer direction (not a collector — a direction)
  const src = [0, 1, 2, 3].map(i => [i * 12, 0]);            // equal parts, y = 0
  const target = lineFrom2([-5, 30], [60, 4]);               // non-parallel target
  const img = src.map(p => meet(lineFrom2(p, [p[0] + dir[0], p[1] + dir[1]]), target));
  const parts = [hyp(img[0], img[1]), hyp(img[1], img[2]), hyp(img[2], img[3])];
  const spread = Math.max(...parts) / Math.min(...parts);
  assert('2. Type A carries equal parts onto a non-parallel line, still equal',
    Math.abs(spread - 1) < 1e-9, 'max/min = ' + spread.toFixed(12));
}

// 3. Type B: collector transfer — progression on non-parallel, homothety on parallel
{
  const E = [26, 58];
  const src = [0, 1, 2, 3].map(i => [i * 12, 0]);
  const tNon = lineFrom2([-5, 30], [60, 4]);                 // non-parallel
  const tPar = lineFrom2([-5, 20], [60, 20]);                // parallel to y = 0
  const imgN = src.map(p => meet(lineFrom2(E, p), tNon));
  const imgP = src.map(p => meet(lineFrom2(E, p), tPar));
  const pN = [hyp(imgN[0], imgN[1]), hyp(imgN[1], imgN[2]), hyp(imgN[2], imgN[3])];
  const pP = [hyp(imgP[0], imgP[1]), hyp(imgP[1], imgP[2]), hyp(imgP[2], imgP[3])];
  const spreadN = Math.max(...pN) / Math.min(...pN);
  const spreadP = Math.max(...pP) / Math.min(...pP);
  // cross-ratio: parametrize images along the target
  const par = (pts) => {
    const u = [(pts[3][0] - pts[0][0]), (pts[3][1] - pts[0][1])];
    const n = Math.hypot(u[0], u[1]);
    return pts.map(p => ((p[0] - pts[0][0]) * u[0] + (p[1] - pts[0][1]) * u[1]) / n);
  };
  const dcr = Math.abs(cr4(par(imgN)) - cr4([0, 12, 24, 36]));
  assert('3. Type B onto NON-parallel: equal parts become a progression',
    spreadN > 1.02, 'max/min = ' + spreadN.toFixed(4));
  assert('3b. Type B onto NON-parallel: cross-ratio preserved',
    dcr < 1e-9, 'dcr = ' + dcr.toExponential(2));
  assert('3c. Type B onto PARALLEL: homothety, ratios survive (the non-parallel condition is load-bearing)',
    Math.abs(spreadP - 1) < 1e-9, 'max/min = ' + spreadP.toFixed(12));
}

// 4. engine tie: depth lines of a channel, drawn in the (w, g) picture strip
//    depth line of scene coordinate w0: the curve g -> (chan(g,...), g). It is
//    a straight drawn line (affine). r = 0: all such lines PARALLEL.
//    r > 0: all concur at gauge 1/r, picture position s + sig/r.
{
  const s = 0, sig = 0.25;
  // r = 0: directions of depth lines for varied w0
  let maxAng = 0;
  const dirs = [];
  for (const w0 of [-2, -0.7, 0.4, 1.9]) {
    const p0 = [chan(0, w0, s, 0, sig), 0], p1 = [chan(1, w0, s, 0, sig), 1];
    dirs.push([p1[0] - p0[0], p1[1] - p0[1]]);
  }
  for (let i = 1; i < dirs.length; i++) {
    maxAng = Math.max(maxAng, Math.abs(dirs[0][0] * dirs[i][1] - dirs[0][1] * dirs[i][0]));
  }
  assert('4. r = 0 channel: depth lines parallel — Type A, no collector',
    maxAng < 1e-12, 'worst cross product ' + maxAng.toExponential(2));
  for (const r of [0.35, 1]) {
    let worst = 0;
    const seat = [s + sig / r, 1 / r]; // predicted collector: gauge 1/r
    for (const w0 of [-2, -0.7, 0.4, 1.9]) {
      const L = lineFrom2([chan(0, w0, s, r, sig), 0], [chan(0.6, w0, s, r, sig), 0.6]);
      worst = Math.max(worst, Math.abs(L[0] * seat[0] + L[1] * seat[1] + L[2]) / Math.hypot(L[0], L[1]));
    }
    assert('4b. r = ' + r + ' channel: all depth lines concur at gauge 1/r — the seat IS the collector (Type B)',
      worst < 1e-12, 'residual ' + worst.toExponential(2));
  }
}

// 5. pushbroom (0,1): u-channel Type A, v-channel Type B in one construction
{
  const ru = 0, rv = 1, sig = 0.2;
  // u depth lines parallel?
  const du = [];
  for (const u0 of [-1, 0.3, 1.4]) {
    du.push([chan(1, u0, 0, ru, sig) - chan(0, u0, 0, ru, sig), 1]);
  }
  const parOK = Math.abs(du[0][0] * du[1][1] - du[0][1] * du[1][0]) < 1e-12 &&
                Math.abs(du[0][0] * du[2][1] - du[0][1] * du[2][0]) < 1e-12;
  // v depth lines concurrent at gauge 1?
  let worst = 0;
  const seat = [0 + sig / rv, 1 / rv];
  for (const v0 of [-1, 0.3, 1.4]) {
    const L = lineFrom2([chan(0, v0, 0, rv, sig), 0], [chan(0.6, v0, 0, rv, sig), 0.6]);
    worst = Math.max(worst, Math.abs(L[0] * seat[0] + L[1] * seat[1] + L[2]) / Math.hypot(L[0], L[1]));
  }
  assert('5. pushbroom (0,1) = Hybrid: one Type A channel x one Type B channel',
    parOK && worst < 1e-12, 'v-concurrency residual ' + worst.toExponential(2));
}

// 6. doubly ruled transfer on irregular quad (re-asserted for this plate's ledger)
{
  const H = [0, 0], G = [37, 21], A = [5, -18], D = [55, -7];
  const r1 = t => [H[0] + t * (G[0] - H[0]), H[1] + t * (G[1] - H[1])];
  const r2 = t => [A[0] + t * (D[0] - A[0]), A[1] + t * (D[1] - A[1])];
  const b1 = hyp(r1(0.5), H) / hyp(G, H), b2 = hyp(r2(0.5), A) / hyp(D, A);
  const p = meet(lineFrom2(r1(0.25), r2(0.25)), lineFrom2(r1(0.75), r2(0.75)));
  const mid = lineFrom2(r1(0.5), r2(0.5));
  const off = p ? Math.abs(mid[0] * p[0] + mid[1] * p[1] + mid[2]) / Math.hypot(mid[0], mid[1]) : 99;
  assert('6. doubly ruled quad: mid-ruling bisects both rails; rulings do not concur',
    Math.abs(b1 - 0.5) < 1e-9 && Math.abs(b2 - 0.5) < 1e-9 && off > 1e-3,
    'ratios ' + b1.toFixed(9) + ', ' + b2.toFixed(9) + '; concurrency offset ' + off.toFixed(3));
}

console.log('\n' + pass + '/' + (pass + fail) + ' assertions passed' + (fail ? '  ***FAILURES***' : ''));
process.exit(fail ? 1 : 0);
