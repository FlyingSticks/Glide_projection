// check_diagonals.js — depth projection of an irregular shape, and why the
// diagonals curve.
//
// Board model (isotropic glide, seat S, rate r): a scene point with picture
// position P and gauge g images at
//        X(P,g) = S + (P − S)·(1 − r·g)
// The shape lives in the picture plane (g = 0, true size and shape, in red);
// depth copies at g = 1/n, 2/n, ... ; each vertex runs back along a depth line.
//
// Claims:
//  1. TYPE A / equal ratio of parts: a point at fraction t along an edge images
//     at fraction t along the imaged edge — at EVERY depth. Exact.
//  2. The depth line of any edge mark is straight, and all mark depth-lines of
//     the whole figure concur at the seat (the collector) for r > 0.
//  3. Edges stay straight at every depth (the copy is a true scaled copy).
//  4. A 3D DIAGONAL of a wall cell — straight in space, crossing depths —
//     images as a QUADRATIC curve: linear position × linear scale. Fit residual
//     at machine precision, and genuinely bent (sag > 0) whenever r > 0.
//  5. The bend vanishes exactly when r = 0, or the segment lies in one depth
//     plane, or runs along one depth line.
//  6. The same 3D diagonal under a PINHOLE images dead straight. The curving
//     diagonal is the board's signature, not a property of the scene.
'use strict';
let pass=0,fail=0;
const A=(n,ok,d)=>{ok?pass++:fail++;console.log((ok?'PASS  ':'FAIL  ')+n+(d?'   ['+d+']':''));};
const S=[420,300];
const img=(P,g,r)=>[S[0]+(P[0]-S[0])*(1-r*g), S[1]+(P[1]-S[1])*(1-r*g)];
const persp=(P,g,q)=>[S[0]+(P[0]-S[0])/(1+q*g), S[1]+(P[1]-S[1])/(1+q*g)];
const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t];
const shape=[[120,80],[300,40],[520,120],[610,320],[430,520],[180,470]];

// 1. equal ratio of parts at every depth
{
  let worst=0;
  for(const r of [0.35,0.7]) for(const g of [0,1/3,2/3,1]) for(let e=0;e<shape.length;e++){
    const P0=shape[e], P1=shape[(e+1)%shape.length];
    for(const t of [1/3,0.5,2/3,0.81]){
      const markImg=img(lerp(P0,P1,t),g,r);                 // image of the 3D mark
      const edgeMark=lerp(img(P0,g,r),img(P1,g,r),t);       // fraction t of the imaged edge
      worst=Math.max(worst,Math.hypot(markImg[0]-edgeMark[0],markImg[1]-edgeMark[1]));
    }
  }
  A('1. Type A: fraction t on the edge is fraction t on every depth copy — exact',
    worst<1e-10,'worst deviation '+worst.toExponential(2)+' px');
}
// 2. mark depth-lines are straight and concur at the seat
{
  let worstLine=0, worstSeat=0;
  const r=0.6;
  for(let e=0;e<shape.length;e++) for(const t of [0.25,2/3]){
    const M=lerp(shape[e],shape[(e+1)%shape.length],t);
    const pts=[0,0.3,0.65,1].map(g=>img(M,g,r));
    const a=pts[0], b=pts[3], L=Math.hypot(b[0]-a[0],b[1]-a[1]);
    for(const p of pts) worstLine=Math.max(worstLine,
      Math.abs((b[0]-a[0])*(a[1]-p[1])-(a[0]-p[0])*(b[1]-a[1]))/L);
    // extended to gauge 1/r the line lands on the seat
    const seatPt=img(M,1/r,r);
    worstSeat=Math.max(worstSeat,Math.hypot(seatPt[0]-S[0],seatPt[1]-S[1]));
  }
  A('2. every mark depth-line is straight and concurs at the seat (gauge 1/r)',
    worstLine<1e-10 && worstSeat<1e-9,
    'line residual '+worstLine.toExponential(2)+', seat miss '+worstSeat.toExponential(2));
}
// 3. edges straight at every depth
{
  let worst=0; const r=0.55;
  for(const g of [1/3,1]) for(let e=0;e<shape.length;e++){
    const a=img(shape[e],g,r), b=img(shape[(e+1)%shape.length],g,r);
    const L=Math.hypot(b[0]-a[0],b[1]-a[1]);
    for(const t of [0.2,0.5,0.8]){
      const p=img(lerp(shape[e],shape[(e+1)%shape.length],t),g,r);
      worst=Math.max(worst,Math.abs((b[0]-a[0])*(a[1]-p[1])-(a[0]-p[0])*(b[1]-a[1]))/L);
    }
  }
  A('3. edges image straight at every depth — the copies are true copies',
    worst<1e-10,'worst '+worst.toExponential(2));
}
// 4. the wall diagonal is a quadratic curve
{
  const r=0.6;
  // straight 3D segment: edge parameter t and gauge g both vary linearly
  const P0=shape[0], P1=shape[1];
  const D=tau=>img(lerp(P0,P1,tau), (1/3)+tau*(1/3), r);   // one wall cell's diagonal
  // exact quadratic through tau = 0, 1/2, 1
  const q0=D(0), qh=D(0.5), q1=D(1);
  const quad=tau=>{
    const b0=(1-tau)*(1-2*tau), b1=4*tau*(1-tau), b2=tau*(2*tau-1);
    return [b0*q0[0]+b1*qh[0]+b2*q1[0], b0*q0[1]+b1*qh[1]+b2*q1[1]];
  };
  let worstFit=0, sag=0;
  const L=Math.hypot(q1[0]-q0[0],q1[1]-q0[1]);
  for(let i=0;i<=40;i++){
    const tau=i/40, p=D(tau), f=quad(tau);
    worstFit=Math.max(worstFit,Math.hypot(p[0]-f[0],p[1]-f[1]));
    sag=Math.max(sag,Math.abs((q1[0]-q0[0])*(q0[1]-p[1])-(q0[0]-p[0])*(q1[1]-q0[1]))/L);
  }
  A('4. the diagonal images as an exact QUADRATIC — linear position × linear scale',
    worstFit<1e-9,'fit residual '+worstFit.toExponential(2));
  A('4b. and it genuinely bends', sag/L>1e-3,'sag '+(100*sag/L).toFixed(2)+'% of chord');
}
// 5. straight exactly in the degenerate cases
{
  const straight=(f)=>{
    const a=f(0), b=f(1), L=Math.hypot(b[0]-a[0],b[1]-a[1]);
    let s=0;
    for(let i=1;i<20;i++){ const p=f(i/20);
      s=Math.max(s,Math.abs((b[0]-a[0])*(a[1]-p[1])-(a[0]-p[0])*(b[1]-a[1]))/L); }
    return s;
  };
  const P0=shape[2], P1=shape[3];
  const s1=straight(tau=>img(lerp(P0,P1,tau),0.2+tau*0.5,0));       // r = 0
  const s2=straight(tau=>img(lerp(P0,P1,tau),0.4,0.6));             // one depth plane
  const s3=straight(tau=>img(P0,0.1+tau*0.8,0.6));                  // one depth line
  const s4=straight(tau=>img(lerp(P0,P1,tau),0.2+tau*0.5,0.6));     // the general case
  A('5. bend vanishes exactly for r = 0, in-plane, or along a depth line — and only there',
    s1<1e-10&&s2<1e-10&&s3<1e-10&&s4>1e-3,
    'residuals '+[s1,s2,s3].map(v=>v.toExponential(1)).join(', ')+' vs general '+s4.toExponential(1));
}
// 6. a pinhole keeps the same diagonal straight
{
  const P0=shape[0], P1=shape[1];
  const f=tau=>persp(lerp(P0,P1,tau),(1/3)+tau*(1/3),0.9);
  const a=f(0), b=f(1), L=Math.hypot(b[0]-a[0],b[1]-a[1]);
  let s=0;
  for(let i=1;i<40;i++){ const p=f(i/40);
    s=Math.max(s,Math.abs((b[0]-a[0])*(a[1]-p[1])-(a[0]-p[0])*(b[1]-a[1]))/L); }
  A('6. the SAME 3D diagonal under a pinhole is dead straight — the bend is the '+
    'board\'s signature, not the scene\'s', s<1e-10,'perspective residual '+s.toExponential(2));
}
console.log('\n'+pass+'/'+(pass+fail)+' assertions passed'+(fail?'  ***FAIL***':''));
process.exit(fail?1:0);
