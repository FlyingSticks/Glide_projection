// check_straddle.js — why 1–3 is simple
//
// The 4-gon's sides lie on the four given lines in the order a, d, b, c:
//   Q0Q1 on a,  Q1Q2 on d,  Q2Q3 on b,  Q3Q0 on c
// so the two pairs of OPPOSITE sides lie on {a, b} and on {c, d} — and those
// are exactly the two pairs that were merged into the gap points:
//   A = a ∩ b   is the meet of the lines carrying opposite sides 0 and 2
//   B = c ∩ d   is the meet of the lines carrying opposite sides 1 and 3
//
// Claims:
//  1. A is the intersection point of the lines of opposite sides 0,2, and B of
//     opposite sides 1,3 — so both gap points lie ON the gap line by construction.
//  2. A side straddles the gap line  <=>  its two endpoints are on opposite sides
//     <=>  the gap point of its line-pair is interior to that side.
//  3. The number of straddling sides is always 0, 2 or 4 — never odd.
//  4. Split 0–4  -> 0 straddling sides.
//     Split 1–3  -> exactly 2, and they are ADJACENT (they share the lone vertex).
//     Split 2–2  -> 2 opposite, or all 4.
//  5. The 4-gon crosses itself  <=>  some pair of OPPOSITE sides both straddle.
//     Adjacent straddling sides cannot cross: they already meet at a corner.
//     Hence 1–3 is always simple — this is the reason, not a coincidence.

'use strict';
let pass = 0, fail = 0;
function assert(n, ok, d) { (ok ? pass++ : fail++); console.log((ok ? 'PASS  ' : 'FAIL  ') + n + (d ? '   [' + d + ']' : '')); }
function lineFrom2(p, q) { return [p[1] - q[1], q[0] - p[0], p[0] * q[1] - p[1] * q[0]]; }
function meet(l, m) {
  const x = l[1] * m[2] - l[2] * m[1], y = l[2] * m[0] - l[0] * m[2], w = l[0] * m[1] - l[1] * m[0];
  return Math.abs(w) < 1e-12 ? null : [x / w, y / w];
}
function segsCross(p1, p2, p3, p4) {
  const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2), d3 = d(p1, p2, p3), d4 = d(p1, p2, p4);
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
}
function interior(p, u, v) { // is p strictly between u and v on their line?
  const t = ((p[0] - u[0]) * (v[0] - u[0]) + (p[1] - u[1]) * (v[1] - u[1])) /
            ((v[0] - u[0]) ** 2 + (v[1] - u[1]) ** 2);
  return t > 1e-9 && t < 1 - 1e-9;
}
const PAIR = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];
const key = (i, j) => i < j ? '' + i + j : '' + j + i;
function rng(s0) { let s = s0 >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }

const rand = rng(31337);
let n = 0;
let gapPtOK = true, straddleEquiv = true, parityOK = true;
const bySplit = { 0: {}, 1: {}, 2: {} };
let adjacency13 = true, crossIffOpposite = true, alternating22 = 0, double22 = 0;

for (let t = 0; t < 3000; t++) {
  const L = [];
  for (let i = 0; i < 4; i++) L.push(lineFrom2([rand() * 100 - 50, rand() * 100 - 50], [rand() * 100 - 50, rand() * 100 - 50]));
  const P = {}; let ok = true;
  for (let i = 0; i < 4 && ok; i++) for (let j = i + 1; j < 4; j++) {
    const p = meet(L[i], L[j]); if (!p) { ok = false; break; } P[key(i, j)] = p;
  }
  if (!ok) continue;
  let usable = true;
  const rows = [];
  for (const [[a, b], [c, d]] of PAIR) {
    const A = P[key(a, b)], B = P[key(c, d)];
    const Q = [P[key(a, c)], P[key(a, d)], P[key(b, d)], P[key(b, c)]];
    const gap = lineFrom2(A, B);
    if (Math.hypot(gap[0], gap[1]) < 1e-9) { usable = false; break; }
    rows.push({ A, B, Q, gap, sideLines: [a, d, b, c], L });
  }
  if (!usable) continue;
  n++;

  for (const r of rows) {
    const { A, B, Q, gap, sideLines, L } = r;
    // 1. gap points are the meets of the opposite-side line pairs
    const A2 = meet(L[sideLines[0]], L[sideLines[2]]);
    const B2 = meet(L[sideLines[1]], L[sideLines[3]]);
    if (!A2 || !B2 || Math.hypot(A2[0] - A[0], A2[1] - A[1]) > 1e-6 ||
        Math.hypot(B2[0] - B[0], B2[1] - B[1]) > 1e-6) gapPtOK = false;

    const side = p => (gap[0] * p[0] + gap[1] * p[1] + gap[2]) > 0 ? 1 : -1;
    const sg = Q.map(side);
    const nPos = sg.filter(s => s > 0).length;
    const split = Math.min(nPos, 4 - nPos);

    // 2. straddle <=> the relevant gap point is interior to that side
    const straddles = [0, 1, 2, 3].map(i => sg[i] !== sg[(i + 1) % 4]);
    const gapPtOf = [A, B, A, B]; // sides 0,2 -> A ; sides 1,3 -> B
    for (let i = 0; i < 4; i++) {
      const inSeg = interior(gapPtOf[i], Q[i], Q[(i + 1) % 4]);
      if (inSeg !== straddles[i]) straddleEquiv = false;
    }

    // 3. parity
    const nStr = straddles.filter(Boolean).length;
    if (nStr % 2 !== 0) parityOK = false;
    bySplit[split][nStr] = (bySplit[split][nStr] || 0) + 1;

    // 4. in the 1–3 case the two straddling sides share the lone vertex
    if (split === 1) {
      const lone = sg.findIndex(s => s === (nPos === 1 ? 1 : -1));
      const expect = [(lone + 3) % 4, lone]; // sides incident to the lone vertex
      const got = [0, 1, 2, 3].filter(i => straddles[i]).sort();
      if (JSON.stringify(got) !== JSON.stringify(expect.sort())) adjacency13 = false;
    }

    // 5. crossing <=> some OPPOSITE pair both straddle
    const crossed = segsCross(Q[0], Q[1], Q[2], Q[3]) || segsCross(Q[1], Q[2], Q[3], Q[0]);
    const oppBoth = (straddles[0] && straddles[2]) || (straddles[1] && straddles[3]);
    if (crossed !== oppBoth) crossIffOpposite = false;

    if (split === 2) {
      if (sg[0] !== sg[1] && sg[1] !== sg[2] && sg[2] !== sg[3]) alternating22++;
      if (segsCross(Q[0], Q[1], Q[2], Q[3]) && segsCross(Q[1], Q[2], Q[3], Q[0])) double22++;
    }
  }
}

assert('1. A and B are exactly the meets of the two OPPOSITE-side line pairs', gapPtOK, n + ' arrangements');
assert('2. a side straddles the gap line ⟺ its gap point lies inside that side', straddleEquiv);
assert('3. the number of straddling sides is always even', parityOK);
assert('4. split 0 → 0 straddling sides; split 1 → 2; split 2 → 2 or 4',
  JSON.stringify(Object.keys(bySplit[0])) === '["0"]' &&
  JSON.stringify(Object.keys(bySplit[1])) === '["2"]' &&
  Object.keys(bySplit[2]).every(k => k === '2' || k === '4'),
  'split0 ' + JSON.stringify(bySplit[0]) + ' split1 ' + JSON.stringify(bySplit[1]) + ' split2 ' + JSON.stringify(bySplit[2]));
assert('4b. in the 1–3 case the two straddling sides are ADJACENT (they share the lone vertex)', adjacency13);
assert('5. the 4-gon crosses ⟺ some pair of OPPOSITE sides both straddle', crossIffOpposite);
// I predicted the alternating 2–2 pattern (all four sides straddling, a double
// crossing) would occur. It never does — 0/3000. So the 2–2 split always has
// its two straddling sides OPPOSITE, and the bowtie has exactly one crossing.
assert('5b. the alternating 2–2 pattern never occurs: split 2 always has exactly ' +
       'two straddling sides, and they are opposite — so the bowtie crosses exactly once',
  alternating22 === 0 && double22 === 0 && Object.keys(bySplit[2]).join() === '2',
  'alternating ' + alternating22 + ', double-crossed ' + double22 +
  ', straddle counts at split 2: ' + JSON.stringify(bySplit[2]));

console.log('\n' + pass + '/' + (pass + fail) + ' assertions passed' + (fail ? '  ***FAILURES***' : ''));
process.exit(fail ? 1 : 0);
