// check_simple.js — what "simple" means, and why it could not have been the selector
//
// Setup: 4 generic lines, 6 vertices P_ij. The three ways to pair the lines
// give three "gap pairs" {P_ab, P_cd}; the OTHER four vertices then form a
// quadrilateral whose four sides lie on the four given lines, one each.
//
// SIMPLE = that closed 4-gon Q0->Q1->Q2->Q3->Q0 does not cross itself:
//   a Jordan polygon with a well-defined inside, not a bowtie.
//   Test: the two pairs of NON-adjacent sides do not properly intersect.
//
// Claims:
//  1. Every side of each 4-gon lies on a distinct one of the four given lines
//     (so all three really are quadrilaterals of the arrangement).
//  2. Exactly TWO of the three are simple, one is crossed — 2000/2000.
//     (Last session I wrote "exactly one". This is the correction.)
//  3. The crossed one is exactly the pairing whose gap line SEPARATES the
//     four remaining vertices 2-and-2... or not. Tested, not assumed.
//  4. Simplicity is NOT projectively invariant: a projective map that sweeps
//     the line at infinity across the figure changes which 4-gons are simple,
//     while the harmonic cross-ratio is untouched. So simplicity could never
//     have singled out a projectively-defined object.
//  5. The one-side test IS stable under affine maps but likewise NOT under
//     projective maps — it is a drafting-board (affine) criterion, which is
//     the right kind for a construction done on paper.

'use strict';
let pass = 0, fail = 0;
function assert(n, ok, d) { (ok ? pass++ : fail++); console.log((ok ? 'PASS  ' : 'FAIL  ') + n + (d ? '   [' + d + ']' : '')); }

function lineFrom2(p, q) { return [p[1] - q[1], q[0] - p[0], p[0] * q[1] - p[1] * q[0]]; }
function meet(l, m) {
  const x = l[1] * m[2] - l[2] * m[1], y = l[2] * m[0] - l[0] * m[2], w = l[0] * m[1] - l[1] * m[0];
  return Math.abs(w) < 1e-12 ? null : [x / w, y / w];
}
function onLine(l, p) { return Math.abs(l[0] * p[0] + l[1] * p[1] + l[2]) / Math.hypot(l[0], l[1]); }
function segsCross(p1, p2, p3, p4) {
  const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2), d3 = d(p1, p2, p3), d4 = d(p1, p2, p4);
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
}
function crossRatio(a, b, x, y) {
  const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy), u = [dx / n, dy / n];
  const t = p => (p[0] - a[0]) * u[0] + (p[1] - a[1]) * u[1];
  const tb = t(b), tx = t(x), ty = t(y);
  return (tx * (ty - tb)) / ((tx - tb) * ty);
}
function rng(seed) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }

const PAIR = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];
const key = (i, j) => i < j ? '' + i + j : '' + j + i;

function analyse(lines) {
  const P = {};
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
    const p = meet(lines[i], lines[j]); if (!p) return null; P[key(i, j)] = p;
  }
  const out = [];
  for (const [[a, b], [c, d]] of PAIR) {
    const A = P[key(a, b)], B = P[key(c, d)];
    const Q = [P[key(a, c)], P[key(a, d)], P[key(b, d)], P[key(b, c)]];
    // which given line carries each side
    const sideLines = [a, d, b, c]; // Q0Q1 on line a, Q1Q2 on line d, Q2Q3 on line b, Q3Q0 on line c
    const gap = lineFrom2(A, B);
    const X = meet(gap, lineFrom2(Q[0], Q[2])), Y = meet(gap, lineFrom2(Q[1], Q[3]));
    if (!X || !Y) return null;
    const simple = !segsCross(Q[0], Q[1], Q[2], Q[3]) && !segsCross(Q[1], Q[2], Q[3], Q[0]);
    const sg = Q.map(p => Math.sign(gap[0] * p[0] + gap[1] * p[1] + gap[2]));
    const oneSide = sg.every(s => s === sg[0]);
    const nPos = sg.filter(s => s > 0).length;
    out.push({ A, B, Q, sideLines, simple, oneSide, split: Math.min(nPos, 4 - nPos),
               cr: crossRatio(A, B, X, Y) });
  }
  return { P, pairings: out };
}

// ---------- 1. each 4-gon's sides lie on the four given lines, one each ----------
{
  const rand = rng(7771);
  let worst = 0, allDistinct = true, n = 0;
  for (let t = 0; t < 300; t++) {
    const L = [];
    for (let i = 0; i < 4; i++) L.push(lineFrom2([rand() * 100 - 50, rand() * 100 - 50], [rand() * 100 - 50, rand() * 100 - 50]));
    const r = analyse(L); if (!r) continue; n++;
    for (const p of r.pairings) {
      const set = new Set(p.sideLines);
      if (set.size !== 4) allDistinct = false;
      for (let s = 0; s < 4; s++) {
        const P1 = p.Q[s], P2 = p.Q[(s + 1) % 4], Ls = L[p.sideLines[s]];
        worst = Math.max(worst, onLine(Ls, P1), onLine(Ls, P2));
      }
    }
  }
  assert('1. every 4-gon: 4 sides on the 4 given lines, one each', allDistinct && worst < 1e-9,
    n + ' arrangements, worst off-line distance ' + worst.toExponential(2));
}

// ---------- 2. exactly two of three are simple ----------
{
  const rand = rng(20260726);
  const counts = [0, 0, 0, 0]; let n = 0;
  const crossedSplit = {}, simpleSplit = {};
  for (let t = 0; t < 2000; t++) {
    const L = [];
    for (let i = 0; i < 4; i++) L.push(lineFrom2([rand() * 100 - 50, rand() * 100 - 50], [rand() * 100 - 50, rand() * 100 - 50]));
    const r = analyse(L); if (!r) continue;
    let ok = true; for (const p of r.pairings) if (!isFinite(p.cr) || Math.abs(p.cr - 1) < 1e-6) ok = false;
    if (!ok) continue;
    n++;
    let ns = 0;
    for (const p of r.pairings) {
      if (p.simple) { ns++; simpleSplit[p.split] = (simpleSplit[p.split] || 0) + 1; }
      else crossedSplit[p.split] = (crossedSplit[p.split] || 0) + 1;
    }
    counts[ns]++;
  }
  assert('2. exactly TWO of three 4-gons are simple (last session I wrote "one")',
    counts[2] === n, n + ' arrangements, counts[0,1,2,3 simple] = ' + counts.join(','));
  assert('3. the crossed 4-gon is exactly the one whose gap line splits the other four 2-and-2',
    !crossedSplit[0] && !crossedSplit[1] && !simpleSplit[2],
    'crossed by split ' + JSON.stringify(crossedSplit) + ', simple by split ' + JSON.stringify(simpleSplit));
}

// ---------- 4 & 5. behaviour under affine vs projective maps ----------
{
  const rand = rng(555);
  let crStable = 0, simpleChanged = 0, oneSideChangedProj = 0,
      simpleStableAff = 0, oneSideStableAff = 0, n = 0, worstCr = 0;
  for (let t = 0; t < 400; t++) {
    const L = [];
    const pts = [];
    for (let i = 0; i < 4; i++) {
      const p = [rand() * 60 - 30, rand() * 60 - 30], q = [rand() * 60 - 30, rand() * 60 - 30];
      pts.push([p, q]); L.push(lineFrom2(p, q));
    }
    const r0 = analyse(L); if (!r0) continue;
    let ok = true; for (const p of r0.pairings) if (!isFinite(p.cr) || Math.abs(p.cr - 1) < 1e-6) ok = false;
    if (!ok) continue;

    // affine map
    const Maff = [[1 + rand(), rand() - 0.5, rand() * 20 - 10],
                  [rand() - 0.5, 1 + rand(), rand() * 20 - 10],
                  [0, 0, 1]];
    // projective map: small but nonzero third row, sweeping infinity near the figure
    const Mproj = [[1, 0.2, 3], [0.1, 1, -2], [0.012, -0.009, 1]];
    const apply = (M, p) => {
      const w = M[2][0] * p[0] + M[2][1] * p[1] + M[2][2];
      return [(M[0][0] * p[0] + M[0][1] * p[1] + M[0][2]) / w,
              (M[1][0] * p[0] + M[1][1] * p[1] + M[1][2]) / w];
    };
    const mapLines = M => pts.map(([p, q]) => lineFrom2(apply(M, p), apply(M, q)));
    const rA = analyse(mapLines(Maff)), rP = analyse(mapLines(Mproj));
    if (!rA || !rP) continue;
    n++;
    const sig = r => r.pairings.map(p => (p.simple ? 1 : 0)).join('');
    const osg = r => r.pairings.map(p => (p.oneSide ? 1 : 0)).join('');
    if (sig(rA) === sig(r0)) simpleStableAff++;
    if (osg(rA) === osg(r0)) oneSideStableAff++;
    if (sig(rP) !== sig(r0)) simpleChanged++;
    if (osg(rP) !== osg(r0)) oneSideChangedProj++;
    for (let k = 0; k < 3; k++) worstCr = Math.max(worstCr, Math.abs(rP.pairings[k].cr + 1), Math.abs(r0.pairings[k].cr + 1));
    crStable++;
  }
  assert('4. cross-ratio = -1 survives the projective map (as it must)', worstCr < 1e-6,
    n + ' arrangements, worst |cr+1| ' + worstCr.toExponential(2));
  assert('4b. simplicity is NOT projectively invariant — it changes under a map that sweeps infinity',
    simpleChanged > 0, simpleChanged + '/' + n + ' arrangements changed which 4-gons are simple');
  assert('5. simplicity IS affine-invariant', simpleStableAff === n, simpleStableAff + '/' + n);
  assert('5b. the one-side test is affine-invariant too...', oneSideStableAff === n, oneSideStableAff + '/' + n);
  assert('5c. ...but also not projective', oneSideChangedProj > 0,
    oneSideChangedProj + '/' + n + ' arrangements changed which pairing is one-side');
}

console.log('\n' + pass + '/' + (pass + fail) + ' assertions passed' + (fail ? '  ***FAILURES***' : ''));
process.exit(fail ? 1 : 0);
