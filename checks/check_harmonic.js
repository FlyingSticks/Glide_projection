// check_harmonic.js — dependency-free verification for the-harmonic sheet
// Claims under test:
//  1. Complete quadrilateral: 4 generic lines, 6 vertices. For EVERY one of the
//     three opposite-vertex pairings, the gap line through the pair meets the
//     two diagonals of the remaining 4-gon in two points X,Y with
//     cross-ratio (A,B; X,Y) = -1.  (Kevin's steps 1-4, plus "not exclusively":
//     all three diagonals carry the harmonic, not just the visually simple one.)
//  2. Uniqueness: for generic arrangements, exactly ONE of the three pairings
//     yields a simple (non-self-crossing) quadrilateral — Kevin's "unique
//     irregular quadrilateral" and "unique line crossing gap".
//  3. Involution: the involution on the gap line with fixed points X,Y swaps
//     A and B (harmonic <=> conjugacy under that involution).
//  4. Type A transfer (doubly ruled / bilinear patch over an irregular quad):
//     the ruling at parameter t cuts BOTH rails at ratio t — equal ratios
//     transfer with no collector point; the mid-ruling bisects both rails.
//  5. Type B transfer (perspectivity from a collector point): cross-ratio is
//     preserved to machine precision, but equal parts do NOT stay equal
//     (midpoint not preserved in general).
//  6. Six-value cross-ratio orbit: at harmonic position the six permutation
//     values collapse to the 3-element orbit {-1, 2, 1/2}.

'use strict';
const EPS = 1e-9;
let pass = 0, fail = 0;
function assert(name, ok, detail) {
  if (ok) { pass++; console.log('PASS  ' + name + (detail ? '   [' + detail + ']' : '')); }
  else    { fail++; console.log('FAIL  ' + name + (detail ? '   [' + detail + ']' : '')); }
}

// ---------- primitives ----------
function lineFrom2(p, q) { // homogeneous line through two points
  return [p[1] - q[1], q[0] - p[0], p[0] * q[1] - p[1] * q[0]];
}
function meet(l, m) { // intersection of two homogeneous lines
  const x = l[1] * m[2] - l[2] * m[1];
  const y = l[2] * m[0] - l[0] * m[2];
  const w = l[0] * m[1] - l[1] * m[0];
  if (Math.abs(w) < 1e-14) return null;
  return [x / w, y / w];
}
function crossRatio(a, b, x, y) { // 4 collinear points, signed along a direction
  // parametrize along the line via projection on its direction
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const n = Math.hypot(dx, dy);
  const u = [dx / n, dy / n];
  const t = p => (p[0] - a[0]) * u[0] + (p[1] - a[1]) * u[1];
  const ta = 0, tb = t(b), tx = t(x), ty = t(y);
  return ((tx - ta) * (ty - tb)) / ((tx - tb) * (ty - ta));
}
function segsCross(p1, p2, p3, p4) { // proper crossing of open segments
  const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2), d3 = d(p1, p2, p3), d4 = d(p1, p2, p4);
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
}
function rng(seed) { // deterministic LCG
  let s = seed >>> 0;
  return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; };
}

// three opposite pairings of lines {0,1,2,3}: diagonal pair (a,b),(c,d)
const PAIRINGS = [ [[0,1],[2,3]], [[0,2],[1,3]], [[0,3],[1,2]] ];

function analyse(lines) {
  // vertices P[i][j]
  const P = {};
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
    const p = meet(lines[i], lines[j]);
    if (!p) return null;
    P[i + '' + j] = p;
  }
  const out = [];
  for (const [[a, b], [c, d]] of PAIRINGS) {
    const A = P[key(a, b)], B = P[key(c, d)];           // gap pair
    const Q = [P[key(a, c)], P[key(a, d)], P[key(b, d)], P[key(b, c)]]; // 4-gon, sides = the 4 lines
    const gap = lineFrom2(A, B);
    const diag1 = lineFrom2(Q[0], Q[2]);                 // green diagonals
    const diag2 = lineFrom2(Q[1], Q[3]);
    const X = meet(gap, diag1), Y = meet(gap, diag2);
    if (!X || !Y) return null;
    // simple 4-gon test: non-adjacent sides must not cross
    const simple = !segsCross(Q[0], Q[1], Q[2], Q[3]) && !segsCross(Q[1], Q[2], Q[3], Q[0]);
    // one-side test: does the gap line leave all four remaining vertices strictly on one side?
    const side = p => gap[0] * p[0] + gap[1] * p[1] + gap[2];
    const signs = Q.map(p => Math.sign(side(p)));
    const oneSide = signs.every(s => s === signs[0]);
    out.push({ A, B, X, Y, Q, simple, oneSide, cr: crossRatio(A, B, X, Y) });
  }
  return out;
  function key(i, j) { return i < j ? i + '' + j : j + '' + i; }
}

// ---------- 1 & 2: harmonic on all three diagonals; uniqueness of simple 4-gon ----------
const rand = rng(20260726);
const TRIALS = 2000;
let worstCr = 0, simpleCounts = [0, 0, 0, 0], oneSideCounts = [0, 0, 0, 0],
    oneSideIsSimple = 0, tested = 0;
for (let t = 0; t < TRIALS; t++) {
  const lines = [];
  for (let i = 0; i < 4; i++) {
    const p = [rand() * 100 - 50, rand() * 100 - 50];
    const q = [rand() * 100 - 50, rand() * 100 - 50];
    lines.push(lineFrom2(p, q));
  }
  const res = analyse(lines);
  if (!res) continue; // skip near-degenerate draw
  // reject near-degenerate arrangements (three lines almost concurrent etc.)
  let ok = true;
  for (const r of res) if (!isFinite(r.cr) || Math.abs(r.cr - 1) < 1e-6) ok = false;
  if (!ok) continue;
  tested++;
  let nSimple = 0, nOneSide = 0, oneSideR = null;
  for (const r of res) {
    worstCr = Math.max(worstCr, Math.abs(r.cr + 1));
    if (r.simple) nSimple++;
    if (r.oneSide) { nOneSide++; oneSideR = r; }
  }
  simpleCounts[nSimple]++;
  oneSideCounts[nOneSide]++;
  if (nOneSide === 1 && oneSideR.simple) oneSideIsSimple++;
}
assert('1. (A,B;X,Y) = -1 on ALL THREE diagonals, ' + tested + ' random arrangements',
  worstCr < 1e-6, 'worst |cr+1| = ' + worstCr.toExponential(2));
// NOTE: simplicity alone does NOT single out the quadrilateral — two of the
// three 4-gons are simple in every generic arrangement:
assert('2. two of three 4-gons are simple (simplicity is NOT the unique marker)',
  simpleCounts[2] === tested,
  'counts [0,1,2,3 simple] = ' + simpleCounts.join(','));
assert('2b. the gap pair IS unique: exactly one pairing has its join line ' +
       'leaving the other four vertices on one side',
  oneSideCounts[1] === tested,
  'counts [0,1,2,3 one-side] = ' + oneSideCounts.join(','));
assert('2c. that unique gap pair\'s 4-gon is always one of the simple ones',
  oneSideIsSimple === tested, oneSideIsSimple + '/' + tested);

// ---------- 3: involution with fixed points X,Y swaps A,B ----------
{
  const lines = [
    lineFrom2([-40, -10], [50, 25]), lineFrom2([-30, 40], [40, -35]),
    lineFrom2([-45, 5], [30, 45]),  lineFrom2([-10, -45], [15, 50])
  ];
  const res = analyse(lines);
  let worst = 0;
  for (const r of res) {
    // parametrize gap line; involution fixing tx,ty: t -> ( (tx+ty)t - 2 tx ty ) / ( 2 t - (tx+ty) )  (harmonic-conjugate form)
    const dx = r.B[0] - r.A[0], dy = r.B[1] - r.A[1];
    const n = Math.hypot(dx, dy), u = [dx / n, dy / n];
    const par = p => (p[0] - r.A[0]) * u[0] + (p[1] - r.A[1]) * u[1];
    const tA = 0, tB = par(r.B), tx = par(r.X), ty = par(r.Y);
    const inv = t => ((tx + ty) * t - 2 * tx * ty) / (2 * t - (tx + ty));
    worst = Math.max(worst, Math.abs(inv(tA) - tB), Math.abs(inv(tB) - tA));
  }
  assert('3. involution with fixed points X,Y exchanges A and B (all 3 diagonals)',
    worst < 1e-6, 'worst residual ' + worst.toExponential(2));
}

// ---------- 4: Type A — ruled (bilinear) transfer over an irregular quad ----------
{
  // irregular quad rails: rail1 from H to G, rail2 from A to D (arbitrary, unequal, non-parallel)
  const H = [0, 0], G = [37, 21], A = [5, -18], D = [55, -7];
  const rail1 = t => [H[0] + t * (G[0] - H[0]), H[1] + t * (G[1] - H[1])];
  const rail2 = t => [A[0] + t * (D[0] - A[0]), A[1] + t * (D[1] - A[1])];
  // rulings: connect equal-parameter points (second ruling of the bilinear patch)
  // claim: ruling at t cuts rail1 at ratio t and rail2 at ratio t — trivially by construction,
  // so the substantive check: the rulings do NOT concur (no collector point) unless quad is a
  // perspectivity configuration, and the mid-ruling bisects both rails.
  const mid1 = rail1(0.5), mid2 = rail2(0.5);
  const bis1 = Math.hypot(mid1[0] - H[0], mid1[1] - H[1]) / Math.hypot(G[0] - H[0], G[1] - H[1]);
  const bis2 = Math.hypot(mid2[0] - A[0], mid2[1] - A[1]) / Math.hypot(D[0] - A[0], D[1] - A[1]);
  // no collector: intersect ruling(0.25) with ruling(0.75) and ruling(0.5): concurrency test
  const rl = t => lineFrom2(rail1(t), rail2(t));
  const p1 = meet(rl(0.25), rl(0.75));
  const onMid = p1 ? Math.abs(rl(0.5)[0] * p1[0] + rl(0.5)[1] * p1[1] + rl(0.5)[2]) /
                     Math.hypot(rl(0.5)[0], rl(0.5)[1]) : 0;
  assert('4. Type A: mid-ruling bisects both unequal rails (ratio 1/2 exactly)',
    Math.abs(bis1 - 0.5) < EPS && Math.abs(bis2 - 0.5) < EPS,
    'ratios ' + bis1.toFixed(12) + ', ' + bis2.toFixed(12));
  assert('4b. Type A: rulings have NO collector point on this irregular quad',
    p1 === null || onMid > 1e-3, 'distance of ruling(1/2) from pairwise meet = ' + (p1 ? onMid.toFixed(4) : 'parallel'));
}

// ---------- 5: Type B — perspectivity from collector point ----------
{
  const E = [30, 60]; // collector
  const src = [[0, 0], [10, 0], [20, 0], [30, 0], [40, 0]]; // equal parts on line y=0
  const target = lineFrom2([-20, 20], [70, 8]); // non-parallel target line
  const img = src.map(p => meet(lineFrom2(E, p), target));
  // cross-ratio of first four preserved?
  const crSrc = crossRatio(src[0], src[1], src[2], src[3]);
  const crImg = crossRatio(img[0], img[1], img[2], img[3]);
  // equal parts destroyed?
  const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const parts = [d(img[0], img[1]), d(img[1], img[2]), d(img[2], img[3]), d(img[3], img[4])];
  const spread = Math.max(...parts) / Math.min(...parts);
  assert('5. Type B: cross-ratio preserved through collector point',
    Math.abs(crSrc - crImg) < 1e-9, 'Δcr = ' + Math.abs(crSrc - crImg).toExponential(2));
  assert('5b. Type B: equal parts become a progression (ratios NOT preserved)',
    spread > 1.05, 'max/min part ratio = ' + spread.toFixed(4));
}

// ---------- 6: six-value orbit collapses to {-1, 2, 1/2} at harmonic ----------
{
  const l = -1;
  const orbit = [l, 1 / l, 1 - l, 1 / (1 - l), l / (l - 1), (l - 1) / l];
  const uniq = [...new Set(orbit.map(v => v.toFixed(9)))].sort();
  assert('6. harmonic orbit of six cross-ratio values = {-1, 0.5, 2}',
    uniq.length === 3 && uniq.join(',') === '-1.000000000,0.500000000,2.000000000',
    uniq.join(', '));
}

console.log('\n' + pass + '/' + (pass + fail) + ' assertions passed' + (fail ? '  ***FAILURES***' : ''));
process.exit(fail ? 1 : 0);
