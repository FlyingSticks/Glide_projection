// check_xslit_zones.js — does cross-slit contain both the normal and the
// reversed cube view?
//
// Setup (picture plane at z = 0, scene at z > 0):
//   slit 1: the HORIZONTAL line { (t, 0, z1) }   — governs the vertical channel
//   slit 2: the VERTICAL   line { (0, s, z2) }   — governs the horizontal channel
//   with 0 < z1 < z2.
// A scene point images at the crossing of the unique line through it meeting
// both slits. Solving that gives
//        x_img = X · z2 / (z2 − Z)        y_img = −Y · z1 / (Z − z1)
// which is derived here, then verified against the raw construction.
//
// Claims:
//  1. The closed forms are correct: the line through P and its image really
//     does meet both slits.
//  2. Magnification depends on depth as Mx(Z) = z2/(z2−Z), My(Z) = −z1/(Z−z1).
//     Each blows up at its own slit — the slits are the directing planes.
//  3. THREE ZONES, separated by the two slits:
//       Z < z1          both |M| GROW with depth  → closer is smaller, 5 faces
//       z1 < Z < z2     |Mx| grows, |My| shrinks  → mixed, 3 faces
//       Z > z2          both |M| shrink           → ordinary camera, 1 face
//  4. Face counts for a small cube in each zone are exactly 5, 3, 1.
//  5. Cross-slit is NOT the lateral family: a straight 3D line images as a
//     genuine curve, so the channel law's straight-edge picture does not apply.

'use strict';
let pass = 0, fail = 0;
function assert(n, ok, d) { (ok ? pass++ : fail++); console.log((ok ? 'PASS  ' : 'FAIL  ') + n + (d ? '   [' + d + ']' : '')); }

const z1 = 2, z2 = 5;                        // the two slits
const Mx = Z => z2 / (z2 - Z);
const My = Z => -z1 / (Z - z1);
const image = (X, Y, Z) => [X * Mx(Z), Y * My(Z)];

// ---------- 1. the closed forms really are the cross-slit image ----------
{
  // brute force: find the line through P meeting both slits, intersect z = 0
  function byConstruction(X, Y, Z) {
    // line meets slit1 at (a,0,z1) and slit2 at (0,b,z2); require it to pass through P
    const U = (Z - z1) / (z2 - z1);
    if (Math.abs(1 - U) < 1e-12 || Math.abs(U) < 1e-12) return null;
    const a = X / (1 - U), b = Y / U;
    const A = [a, 0, z1], B = [0, b, z2];
    // does this line pass through P?
    const t = (Z - A[2]) / (B[2] - A[2]);
    const onLine = [A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1]), A[2] + t * (B[2] - A[2])];
    const errP = Math.hypot(onLine[0] - X, onLine[1] - Y, onLine[2] - Z);
    // where it crosses z = 0
    const u0 = (0 - A[2]) / (B[2] - A[2]);
    const img = [A[0] + u0 * (B[0] - A[0]), A[1] + u0 * (B[1] - A[1])];
    return { img, errP, A, B };
  }
  let worstImg = 0, worstOn = 0, worstSlit = 0;
  const samples = [];
  for (const Z of [0.7, 1.4, 2.6, 3.9, 6.2, 9.5]) for (const X of [-1.3, 0.8]) for (const Y of [-0.9, 1.1]) {
    const c = byConstruction(X, Y, Z);
    if (!c) continue;
    const f = image(X, Y, Z);
    worstImg = Math.max(worstImg, Math.hypot(c.img[0] - f[0], c.img[1] - f[1]));
    worstOn = Math.max(worstOn, c.errP);
    // the endpoints really lie on the slits
    worstSlit = Math.max(worstSlit, Math.abs(c.A[1]), Math.abs(c.A[2] - z1),
                                     Math.abs(c.B[0]), Math.abs(c.B[2] - z2));
    samples.push(Z);
  }
  assert('1. closed form matches the raw two-slit construction',
    worstImg < 1e-9 && worstOn < 1e-9 && worstSlit < 1e-12,
    samples.length + ' points; image err ' + worstImg.toExponential(2) +
    ', through-P err ' + worstOn.toExponential(2));
}

// ---------- 2. the slits are the directing planes ----------
{
  const nearSlit2 = [4.9, 4.99, 4.999].map(Z => Math.abs(Mx(Z)));
  const nearSlit1 = [2.1, 2.01, 2.001].map(Z => Math.abs(My(Z)));
  assert('2. each channel blows up at its own slit — the slits are the directing planes',
    nearSlit2.every((v, i) => i === 0 || v > nearSlit2[i - 1]) && nearSlit2[2] > 1000 &&
    nearSlit1.every((v, i) => i === 0 || v > nearSlit1[i - 1]) && nearSlit1[2] > 1000,
    '|Mx| → ' + nearSlit2.map(v => v.toFixed(0)).join(', ') + ' at the vertical slit; ' +
    '|My| → ' + nearSlit1.map(v => v.toFixed(0)).join(', ') + ' at the horizontal slit');
}

// ---------- 3. three zones ----------
{
  function trend(f, a, b) {   // is |f| increasing across [a,b]?
    const n = 40, v = [];
    for (let i = 0; i <= n; i++) v.push(Math.abs(f(a + (b - a) * i / n)));
    let up = true, down = true;
    for (let i = 1; i <= n; i++) { if (v[i] <= v[i - 1]) up = false; if (v[i] >= v[i - 1]) down = false; }
    return up ? 'grows' : down ? 'shrinks' : 'mixed';
  }
  const zoneA = [trend(Mx, 0.05, z1 - 0.05), trend(My, 0.05, z1 - 0.05)];
  const zoneB = [trend(Mx, z1 + 0.05, z2 - 0.05), trend(My, z1 + 0.05, z2 - 0.05)];
  const zoneC = [trend(Mx, z2 + 0.05, 40), trend(My, z2 + 0.05, 40)];
  assert('3. zone A (in front of both slits): BOTH channels grow with depth',
    zoneA[0] === 'grows' && zoneA[1] === 'grows', 'Mx ' + zoneA[0] + ', My ' + zoneA[1]);
  assert('3b. zone B (between the slits): one grows, one shrinks — both behaviours at once',
    zoneB[0] === 'grows' && zoneB[1] === 'shrinks', 'Mx ' + zoneB[0] + ', My ' + zoneB[1]);
  assert('3c. zone C (beyond both slits): both shrink — the ordinary camera',
    zoneC[0] === 'shrinks' && zoneC[1] === 'shrinks', 'Mx ' + zoneC[0] + ', My ' + zoneC[1]);
}

// ---------- 4. face counts for a cube in each zone ----------
{
  // cube of half-width 1, faces at Zn (near) and Zf (far), viewed head-on.
  // left/right walls become visible when the far face's image is WIDER than the
  // near face's; top/bottom when it is TALLER.
  function facesVisible(Zn, Zf) {
    const wN = Math.abs(Mx(Zn)), wF = Math.abs(Mx(Zf));
    const hN = Math.abs(My(Zn)), hF = Math.abs(My(Zf));
    return 1 + (wF > wN ? 2 : 0) + (hF > hN ? 2 : 0);
  }
  const A = facesVisible(0.4, 1.4);     // wholly in front of slit 1
  const B = facesVisible(2.4, 4.4);     // wholly between the slits
  const C = facesVisible(6, 12);        // wholly beyond slit 2
  assert('4. a cube in front of both slits shows 5 faces — the reversed view',
    A === 5, A + ' faces');
  assert('4b. a cube between the slits shows 3 — near face plus one opposed pair only',
    B === 3, B + ' faces');
  assert('4c. a cube beyond both slits shows 1 — the ordinary exterior view',
    C === 1, C + ' faces');
}

// ---------- 5. cross-slit is not the lateral family ----------
{
  // a straight 3D line, sampled, images as a curve: check the middle sample's
  // departure from the chord through the endpoints
  const P0 = [-1, 0.6, 0.6], P1 = [1.4, -0.8, 1.7];   // a slanting segment in zone A
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    pts.push(image(P0[0] + t * (P1[0] - P0[0]), P0[1] + t * (P1[1] - P0[1]), P0[2] + t * (P1[2] - P0[2])));
  }
  const a = pts[0], b = pts[20];
  let sag = 0;
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  for (const p of pts) {
    const d = Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / L;
    sag = Math.max(sag, d);
  }
  assert('5. a straight 3D line images as a genuine CURVE — cross-slit is not the lateral family',
    sag / L > 1e-3, 'max sag = ' + (100 * sag / L).toFixed(2) + '% of chord length');
}

console.log('\n' + pass + '/' + (pass + fail) + ' assertions passed' + (fail ? '  ***FAILURES***' : ''));
process.exit(fail ? 1 : 0);
