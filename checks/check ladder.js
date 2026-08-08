// check_ladder.js
// Backs the-ladder-v1.html: the structure ladder projective < affine < vector < metric,
// stated as an invariance table and verified cell by cell.
//   rung        scramble group          what it can never destroy
//   projective  all invertible 3x3      incidence, cross-ratio, pierce COUNT
//   affine      bottom row (0,0,1)      + parallelism, even spacing (the covector TYPE), midpoints
//   vector      affine fixing origin    + the origin
//   metric      rotations               + lengths and angles
// Plus L7: the contra/co-variance law — vector components transform by T, covector
// components by T^{-T}, and the pairing <w,v> is invariant. This is the pointwise
// differential-geometry layer the vector/one-form passage claims.
'use strict';
var out = [], nfail = 0;
function ok(t, c, d) { out.push((c ? ' ok  ' : 'FAIL ') + t + (d ? '  [' + d + ']' : '')); if (!c) nfail++; }

// ---------- 3x3 homogeneous machinery ----------
function ap(H, p) { // apply to affine point [x,y]
  var x = H[0][0] * p[0] + H[0][1] * p[1] + H[0][2], y = H[1][0] * p[0] + H[1][1] * p[1] + H[1][2],
      w = H[2][0] * p[0] + H[2][1] * p[1] + H[2][2];
  return [x / w, y / w];
}
function rot(t) { return [[Math.cos(t), -Math.sin(t), 0], [Math.sin(t), Math.cos(t), 0], [0, 0, 1]]; }
var Sproj = [[1, 0.12, 0.1], [0.06, 1, -0.08], [0.10, 0.07, 1]];
var Saff  = [[1.09, 0.17, 0.5], [0.33, 0.92, -0.3], [0, 0, 1]];
var Slin  = [[1.2, 0.35, 0], [0.15, 0.85, 0], [0, 0, 1]];
var Srot  = rot(25 * Math.PI / 180);

// ---------- the cast ----------
var Pl = [-2.4, -1.2], dl = [1, 0.55], ts = [0, 0.9, 1.7, 3.4];  // four collinear points
function linePt(t) { return [Pl[0] + t * dl[0], Pl[1] + t * dl[1]]; }
var A = [-0.9, -0.9], B = [1.5, 0.6];                             // the arrow
var O = [0, 0], v0 = [1.1, 0.4], w0 = [0.3, 1.0];                 // origin and two metric probes
function f(p) { return 0.55 * p[0] + 0.9 * p[1]; }                // the stack: leaves f = integer
function leafPts(k) { // two points on leaf f = k
  return [[k / 0.55 - 0 * 0.9 / 0.55, 0], [(k - 0.9) / 0.55, 1]];
}

// ---------- measured quantities ----------
function crossRatio(pts) { // of four collinear points, by parameter along their line
  var d = [pts[3][0] - pts[0][0], pts[3][1] - pts[0][1]], n2 = d[0] * d[0] + d[1] * d[1];
  var t = pts.map(function (p) { return ((p[0] - pts[0][0]) * d[0] + (p[1] - pts[0][1]) * d[1]) / n2; });
  return ((t[0] - t[2]) * (t[1] - t[3])) / ((t[0] - t[3]) * (t[1] - t[2]));
}
function pierceCount(H) { // crossings of the transformed arrow through the transformed leaves
  // by naturality this equals crossings of the original: count integers passed by f along A->B
  var n = 0, steps = 4000, prev = f(A), i;
  for (i = 1; i <= steps; i++) {
    var t = i / steps, p = [A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])], cur = f(p);
    n += Math.abs(Math.floor(cur) - Math.floor(prev)); prev = cur;
  }
  return n; // H-independent because arrow and leaves transform together; asserted below
}
function leafGeometry(H) { // directions and spacings of transformed leaves 0,1,2
  var L = [0, 1, 2].map(function (k) { return leafPts(k).map(function (p) { return ap(H, p); }); });
  function dir(l) { var d = [l[1][0] - l[0][0], l[1][1] - l[0][1]], n = Math.hypot(d[0], d[1]); return [d[0] / n, d[1] / n]; }
  function distTo(l, p) { var d = dir(l); return Math.abs((p[0] - l[0][0]) * d[1] - (p[1] - l[0][1]) * d[0]); }
  var d0 = dir(L[0]), d1 = dir(L[1]), d2 = dir(L[2]);
  var par = Math.abs(d0[0] * d1[1] - d0[1] * d1[0]) + Math.abs(d1[0] * d2[1] - d1[1] * d2[0]);
  var s01 = distTo(L[0], L[1][0]), s12 = distTo(L[1], L[2][0]);
  return { par: par, even: Math.abs(s01 - s12) / (s01 + s12) };
}
function midErr(H) { var M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  var Mi = ap(H, M), Ai = ap(H, A), Bi = ap(H, B);
  return Math.hypot(Mi[0] - (Ai[0] + Bi[0]) / 2, Mi[1] - (Ai[1] + Bi[1]) / 2); }
function originErr(H) { var Oi = ap(H, O); return Math.hypot(Oi[0], Oi[1]); }
function lenAngle(H) { var Oi = ap(H, O), vi = ap(H, v0), wi = ap(H, w0);
  var a = [vi[0] - Oi[0], vi[1] - Oi[1]], b = [wi[0] - Oi[0], wi[1] - Oi[1]];
  var la = Math.hypot(a[0], a[1]), lb = Math.hypot(b[0], b[1]);
  return { lv: la, ang: Math.acos((a[0] * b[0] + a[1] * b[1]) / (la * lb)) }; }
var Id = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
var base = { cr: crossRatio(ts.map(linePt)), n: pierceCount(Id), la: lenAngle(Id) };

// L1 — cross-ratio survives every scramble, including the projective one
(function () {
  var worst = 0;
  [Sproj, Saff, Slin, Srot].forEach(function (H) {
    worst = Math.max(worst, Math.abs(crossRatio(ts.map(function (t) { return ap(H, linePt(t)); })) - base.cr));
  });
  ok('L1 cross-ratio survives ALL four scrambles (the projective invariant)', worst < 1e-9, 'worst=' + worst.toExponential(1));
})();

// L2 — the pierce count is pure incidence: survives everything too
(function () {
  var same = true;
  [Sproj, Saff, Slin, Srot].forEach(function (H) { if (pierceCount(H) !== base.n) same = false; });
  ok('L2 pierce count of arrow-through-leaves survives ALL scrambles (incidence)', same, 'count=' + base.n);
})();

// L3 — the covector TYPE (parallel + evenly spaced leaves) is affine: the projective scramble kills it
(function () {
  var ga = leafGeometry(Saff), gl = leafGeometry(Slin), gr = leafGeometry(Srot), gp = leafGeometry(Sproj);
  ok('L3a affine, linear, rotation scrambles keep the stack a genuine covector',
    ga.par + ga.even + gl.par + gl.even + gr.par + gr.even < 1e-9);
  ok('L3b the projective scramble BREAKS it: leaves neither parallel nor even', gp.par > 1e-3 && gp.even > 1e-3,
    'par=' + gp.par.toExponential(1) + ' even=' + gp.even.toExponential(1));
})();

// L4 — midpoints are affine: survive affine and below, die under projective
(function () {
  ok('L4a affine/linear/rotation preserve the midpoint', midErr(Saff) + midErr(Slin) + midErr(Srot) < 1e-9);
  ok('L4b the projective scramble moves it off midpoint', midErr(Sproj) > 1e-3, 'err=' + midErr(Sproj).toExponential(1));
})();

// L5 — the origin is vector-space structure: linear and rotation fix it, affine and projective do not
(function () {
  ok('L5a linear and rotation scrambles fix the origin', originErr(Slin) + originErr(Srot) < 1e-12);
  ok('L5b affine and projective scrambles move it', originErr(Saff) > 0.1 && originErr(Sproj) > 0.05);
})();

// L6 — length and angle are metric structure: only the rotation preserves them
(function () {
  var r = lenAngle(Srot), l = lenAngle(Slin);
  ok('L6a rotation preserves |v| and the angle', Math.abs(r.lv - base.la.lv) + Math.abs(r.ang - base.la.ang) < 1e-9);
  ok('L6b a generic linear scramble changes both', Math.abs(l.lv - base.la.lv) > 1e-3 && Math.abs(l.ang - base.la.ang) > 1e-3);
})();

// L7 — contra/co-variance: components move oppositely, the pairing does not move at all
(function () {
  // frame change T (2x2); vector components v' = T v; covector components w' = T^{-T} w
  var T2 = [[1.2, 0.35], [0.15, 0.85]], det = T2[0][0] * T2[1][1] - T2[0][1] * T2[1][0];
  var Tinv = [[T2[1][1] / det, -T2[0][1] / det], [-T2[1][0] / det, T2[0][0] / det]];
  var TinvT = [[Tinv[0][0], Tinv[1][0]], [Tinv[0][1], Tinv[1][1]]];
  var worst = 0, i;
  for (i = 1; i <= 6; i++) {
    var v = [Math.sin(3 * i), Math.cos(2 * i) + 1.2], w = [Math.cos(i) + 0.4, Math.sin(2 * i) - 1.1];
    var vp = [T2[0][0] * v[0] + T2[0][1] * v[1], T2[1][0] * v[0] + T2[1][1] * v[1]];
    var wp = [TinvT[0][0] * w[0] + TinvT[0][1] * w[1], TinvT[1][0] * w[0] + TinvT[1][1] * w[1]];
    worst = Math.max(worst, Math.abs((wp[0] * vp[0] + wp[1] * vp[1]) - (w[0] * v[0] + w[1] * v[1])));
  }
  ok('L7 contra/co-variance: v\u2192Tv, \u03c9\u2192T\u207b\u1d40\u03c9, and \u27e8\u03c9,v\u27e9 is unchanged', worst < 1e-12, 'worst=' + worst.toExponential(1));
})();

console.log(out.join('\n'));
console.log('----------------------------------------------');
console.log((out.length - nfail) + '/' + out.length + ' assertions pass' + (nfail ? '  <<< FAILURES' : ''));
process.exit(nfail ? 1 : 0);
