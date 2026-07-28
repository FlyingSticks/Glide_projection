// check_growth.js — does a receding square grow?
//
// The channel law:  w = ŝ + (ŵ − ŝ)(1 − r·g) + σ̂·g
// so a separation between two scene points scales in the picture by
//        S(g) = 1 − r·g
// with g the gauge: g = 0 at the picture plane, g = 1 at infinite depth.
//
// Claims:
//  1. S(g) = 1 − r·g exactly: picture separation is the scene separation times
//     that factor, independent of position and of shear.
//  2. Perspective (r = 1): S → 0 at g = 1. Infinite depth compresses to nothing.
//  3. The vanishing-axis lateral's WIDTH channel (r = 1−k, 0 < k < 1) does NOT
//     shrink to nothing: S → k > 0. Infinite depth keeps a fixed fraction.
//  4. Relative to perspective, that width GROWS WITHOUT BOUND with depth:
//     S_lat/S_persp = (1 − (1−k)g)/(1 − g) → ∞ as g → 1.
//  5. A receding SQUARE in the vanishing-axis lateral therefore stretches: its
//     width/height ratio → ∞. It does not shrink uniformly; it spreads sideways.
//  6. LITERAL growth (every dimension larger with depth) needs r < 0 — the seat
//     behind the viewer. The law permits it and it is drawable; the six core
//     armatures do not use it. So "recedes and grows" is not what the current
//     sheets do, but it is one step outside them, not a different theory.
//  7. r > 1 puts the seat at FINITE gauge 1/r: past it the image inverts and
//     grows in magnitude. A second, different way to get growth with depth.

'use strict';
let pass = 0, fail = 0;
function assert(n, ok, d) { (ok ? pass++ : fail++); console.log((ok ? 'PASS  ' : 'FAIL  ') + n + (d ? '   [' + d + ']' : '')); }
const chan = (g, w0, s, r, sig) => s + (w0 - s) * (1 - r * g) + sig * g;
const S = (g, r) => 1 - r * g;

// 1. separation scales exactly by S(g), whatever the seat, shear or position
{
  let worst = 0;
  for (const r of [-0.6, 0, 0.35, 1, 1.8]) for (const sig of [0, 0.4]) for (const s of [-0.3, 0.7]) {
    for (const g of [0, 0.25, 0.5, 0.75, 0.99]) {
      const a = chan(g, 0.3, s, r, sig), b = chan(g, 1.1, s, r, sig);
      worst = Math.max(worst, Math.abs((b - a) - 0.8 * S(g, r)));
    }
  }
  assert('1. picture separation = scene separation × (1 − r·g), exactly',
    worst < 1e-12, 'worst residual ' + worst.toExponential(2));
}

// 2. perspective compresses infinite depth to nothing
{
  const tail = [0.9, 0.99, 0.999, 0.9999].map(g => S(g, 1));
  assert('2. perspective (r = 1): size → 0 at infinite depth',
    tail[tail.length - 1] < 1e-3 && tail.every((v, i) => i === 0 || v < tail[i - 1]),
    'S = ' + tail.map(v => v.toFixed(4)).join(', '));
}

// 3. the lateral's width channel keeps a finite fraction
{
  let ok = true, rows = [];
  for (const k of [0.3, 0.6, 0.85]) {
    const r = 1 - k, lim = S(1, r);
    rows.push('k=' + k + ' → S(∞)=' + lim.toFixed(3));
    if (Math.abs(lim - k) > 1e-12) ok = false;
  }
  assert('3. lateral width (r = 1−k): size at infinite depth = k, not 0', ok, rows.join('  '));
}

// 4. relative to perspective it grows without bound
{
  const k = 0.6, r = 1 - k;
  const ratios = [0.5, 0.9, 0.99, 0.999].map(g => S(g, r) / S(g, 1));
  const growing = ratios.every((v, i) => i === 0 || v > ratios[i - 1]);
  assert('4. lateral width ÷ perspective width → ∞ with depth',
    growing && ratios[ratios.length - 1] > 100,
    'k=0.6: ratio = ' + ratios.map(v => v.toFixed(1)).join(', ') + ' at g = 0.5, 0.9, 0.99, 0.999');
}

// 5. a receding square stretches: width/height → ∞
{
  const k = 0.6;
  const aspect = g => S(g, 1 - k) / S(g, 1);   // width channel r=1−k, height channel r=1
  const a = [0, 0.5, 0.9, 0.99].map(aspect);
  assert('5. a receding SQUARE in the vanishing-axis lateral spreads sideways: w/h → ∞',
    Math.abs(a[0] - 1) < 1e-12 && a.every((v, i) => i === 0 || v > a[i - 1]) && a[3] > 50,
    'w/h = ' + a.map(v => v.toFixed(2)).join(', ') + ' at g = 0, 0.5, 0.9, 0.99');
}

// 6. literal uniform growth needs r < 0
{
  const grows = r => {
    const v = [0, 0.3, 0.6, 0.9, 1].map(g => S(g, r));
    return v.every((x, i) => i === 0 || x > v[i - 1]);
  };
  const armatureRates = [0, 1, 0.4, 1 - 0.6];      // box, pinhole, and lateral width channels
  assert('6. literal growth with depth happens exactly when r < 0',
    grows(-0.5) && grows(-1.2) && !grows(0) && armatureRates.every(r => !grows(r)),
    'r=−0.5 → S(∞)=' + S(1, -0.5).toFixed(2) + ', r=−1.2 → S(∞)=' + S(1, -1.2).toFixed(2) +
    '; no armature rate grows');
  // and the seat sits behind the viewer there
  assert('6b. for r < 0 the seat is at negative gauge — behind the eye, never reached by receding',
    (1 / -0.5) < 0 && (1 / -1.2) < 0, 'gauge 1/r = ' + (1 / -0.5).toFixed(2) + ', ' + (1 / -1.2).toFixed(2));
}

// 7. r > 1: seat at finite gauge, inversion and growth beyond it
{
  const r = 1.8, gSeat = 1 / r;
  const before = S(gSeat - 0.05, r), after = S(gSeat + 0.05, r), far = S(0.99, r);
  assert('7. r > 1: the seat lands at finite gauge 1/r; past it the image inverts and grows',
    gSeat < 1 && before > 0 && after < 0 && Math.abs(far) > Math.abs(after),
    'seat at g=' + gSeat.toFixed(3) + '; S = ' + before.toFixed(3) + ' → ' + after.toFixed(3) +
    ' → ' + far.toFixed(3));
}

console.log('\n' + pass + '/' + (pass + fail) + ' assertions passed' + (fail ? '  ***FAILURES***' : ''));
process.exit(fail ? 1 : 0);
