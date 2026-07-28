// check_fano.js — what the diagonal triangle has to do with Fano's axiom
//
// The plate's whole nine-point system is a complete quadrilateral: 4 lines,
// 6 vertices, 3 diagonals (the gap lines), 3 diagonal-triangle vertices.
// Fano's axiom (dual form) says those 3 diagonals are NOT concurrent.
// This script builds the same configuration over finite fields GF(p) and shows
// that the axiom fails for exactly one prime: p = 2, the Fano plane.
//
// Claims:
//  1. In PG(2,2) the three diagonals of a complete quadrilateral ARE concurrent.
//  2. In PG(2,p) for odd p they are NOT — the diagonal triangle is a real triangle.
//  3. Point count: the system is 6 + 3 = 9 points for odd p, and collapses to
//     6 + 1 = 7 points in PG(2,2) — which, with its 4 + 3 = 7 lines, IS the
//     Fano plane, all 7 points and all 7 lines used exactly once.
//  4. The harmonic range degenerates in characteristic 2: the two cuts X and Y
//     coincide, because the harmonic value -1 equals +1 there. For odd p they
//     are distinct and the cross-ratio is p-1 = -1.
//  5. So the real-plane construction the plate draws is a standing witness that
//     the drawing surface is not of characteristic 2. The harmonic undercarriage
//     depends on it: without Fano, "harmonic conjugate" is not a new point.

'use strict';
let pass = 0, fail = 0;
function assert(n, ok, d) { (ok ? pass++ : fail++); console.log((ok ? 'PASS  ' : 'FAIL  ') + n + (d ? '   [' + d + ']' : '')); }

function mod(a, p) { return ((a % p) + p) % p; }
function inv(a, p) { for (let i = 1; i < p; i++) if (mod(a * i, p) === 1) return i; return null; }
// normalise a projective triple: scale so the first nonzero coordinate is 1
function norm(v, p) {
  const w = v.map(x => mod(x, p));
  const i = w.findIndex(x => x !== 0);
  if (i < 0) return null;
  const s = inv(w[i], p);
  return w.map(x => mod(x * s, p));
}
function cross(a, b, p) {
  return norm([a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], p);
}
const eq = (a, b) => a && b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
function allPoints(p) {
  const out = [], seen = new Set();
  for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) for (let c = 0; c < p; c++) {
    const v = norm([a, b, c], p);
    if (v && !seen.has(v.join(','))) { seen.add(v.join(',')); out.push(v); }
  }
  return out;
}
const incident = (P, L, p) => mod(P[0] * L[0] + P[1] * L[1] + P[2] * L[2], p) === 0;

// cross-ratio of four collinear points, in GF(p)
function crossRatioF(P1, P2, P3, P4, p) {
  // basis: P1, P2 (independent). Write Pi = a*P1 + b*P2 by solving 2 coords.
  function coords(P) {
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
      const det = mod(P1[i] * P2[j] - P1[j] * P2[i], p);
      if (det === 0) continue;
      const d = inv(det, p);
      const a = mod((P[i] * P2[j] - P[j] * P2[i]) * d, p);
      const b = mod((P1[i] * P[j] - P1[j] * P[i]) * d, p);
      return [a, b];
    }
    return null;
  }
  const c = [P1, P2, P3, P4].map(coords);
  if (c.some(x => !x)) return null;
  const D = (u, v) => mod(u[0] * v[1] - u[1] * v[0], p);
  const num = mod(D(c[0], c[2]) * D(c[1], c[3]), p);
  const den = mod(D(c[1], c[2]) * D(c[0], c[3]), p);
  if (den === 0) return null;
  return mod(num * inv(den, p), p);
}

const PAIR = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];

function analysePG(lines, p) {
  const V = {};
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
    const v = cross(lines[i], lines[j], p);
    if (!v) return null;
    V[i + '' + j] = v;
  }
  // no three lines concurrent
  const seen = new Set(Object.values(V).map(v => v.join(',')));
  if (seen.size !== 6) return null;
  const key = (i, j) => i < j ? '' + i + j : '' + j + i;
  const diags = [], quads = [];
  for (const [[a, b], [c, d]] of PAIR) {
    const A = V[key(a, b)], B = V[key(c, d)];
    diags.push(cross(A, B, p));                       // the gap line
    quads.push([A, B, [V[key(a, c)], V[key(a, d)], V[key(b, d)], V[key(b, c)]]]);
  }
  return { V, diags, quads };
}

// find one complete quadrilateral in PG(2,p)
function findConfig(p) {
  const L = allPoints(p);                              // lines share the dual coordinates
  for (let i = 0; i < L.length; i++)
    for (let j = i + 1; j < L.length; j++)
      for (let k = j + 1; k < L.length; k++)
        for (let m = k + 1; m < L.length; m++) {
          const r = analysePG([L[i], L[j], L[k], L[m]], p);
          if (r) return { lines: [L[i], L[j], L[k], L[m]], r };
        }
  return null;
}

const report = {};
for (const p of [2, 3, 5, 7]) {
  const f = findConfig(p);
  if (!f) { report[p] = null; continue; }
  const { r } = f;
  // are the three diagonals concurrent?
  const m01 = cross(r.diags[0], r.diags[1], p);
  const m02 = cross(r.diags[0], r.diags[2], p);
  const m12 = cross(r.diags[1], r.diags[2], p);
  const concurrent = eq(m01, m02) && eq(m02, m12);
  // the nine-point system
  const pts = new Set(Object.values(r.V).map(v => v.join(',')));
  [m01, m02, m12].forEach(v => { if (v) pts.add(v.join(',')); });
  // harmonic range on the first gap line
  const [A, B, Q] = r.quads[0];
  const X = cross(r.diags[0], cross(Q[0], Q[2], p), p);
  const Y = cross(r.diags[0], cross(Q[1], Q[3], p), p);
  const cr = crossRatioF(A, B, X, Y, p);
  report[p] = { concurrent, nPoints: pts.size, nLines: 4 + new Set(r.diags.map(d => d.join(','))).size,
                cutsCoincide: eq(X, Y), cr };
}

assert('1. PG(2,2): the three diagonals of a complete quadrilateral ARE concurrent',
  report[2] && report[2].concurrent, 'Fano\u2019s axiom fails in characteristic 2');
assert('2. PG(2,p), p odd: the diagonals are NOT concurrent — a genuine diagonal triangle',
  [3, 5, 7].every(p => report[p] && !report[p].concurrent),
  'checked p = 3, 5, 7');
assert('3. the system is 9 points for odd p and collapses to 7 in PG(2,2)',
  report[2].nPoints === 7 && [3, 5, 7].every(p => report[p].nPoints === 9),
  'p=2: ' + report[2].nPoints + ' points / ' + report[2].nLines + ' lines (the Fano plane exactly); ' +
  'p=3,5,7: ' + [3, 5, 7].map(p => report[p].nPoints).join(', ') + ' points');
assert('4. the harmonic cuts X and Y coincide in characteristic 2, and are distinct for odd p',
  report[2].cutsCoincide && [3, 5, 7].every(p => !report[p].cutsCoincide),
  'cross-ratio: p=3 \u2192 ' + report[3].cr + ' (= \u22121 mod 3), p=5 \u2192 ' + report[5].cr +
  ' (= \u22121 mod 5), p=7 \u2192 ' + report[7].cr + ' (= \u22121 mod 7)');
assert('5. for odd p the harmonic value is exactly p\u22121, i.e. \u22121',
  [3, 5, 7].every(p => report[p].cr === p - 1),
  [3, 5, 7].map(p => 'p=' + p + ': ' + report[p].cr).join(', '));

console.log('\n' + pass + '/' + (pass + fail) + ' assertions passed' + (fail ? '  ***FAILURES***' : ''));
process.exit(fail ? 1 : 0);
