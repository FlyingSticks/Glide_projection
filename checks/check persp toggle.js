// check_persp_toggle.js — the same construction under one-point perspective
// Perspective: X(P,g) = S + (P − S)/(1 + q·g).  Glide: X = S + (P − S)(1 − r·g).
'use strict';
let pass=0,fail=0;
const A=(n,ok,d)=>{ok?pass++:fail++;console.log((ok?'PASS  ':'FAIL  ')+n+(d?'   ['+d+']':''));};
const S=[430,315], q=0.9, r=0.6;
const pp=(P,g)=>[S[0]+(P[0]-S[0])/(1+q*g), S[1]+(P[1]-S[1])/(1+q*g)];
const gl=(P,g)=>[S[0]+(P[0]-S[0])*(1-r*g), S[1]+(P[1]-S[1])*(1-r*g)];
const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t];
const shape=[[120,95],[305,45],[540,120],[640,330],[450,545],[175,505]];
const straightness=f=>{
  const a=f(0), b=f(1), L=Math.hypot(b[0]-a[0],b[1]-a[1]);
  let s=0;
  for(let i=1;i<30;i++){ const p=f(i/30);
    s=Math.max(s,Math.abs((b[0]-a[0])*(a[1]-p[1])-(a[0]-p[0])*(b[1]-a[1]))/L); }
  return s;
};
// 1. equal ratio of parts holds under perspective too — each copy is a scaling
{
  let worst=0;
  for(const g of [1/3,2/3,1]) for(let e=0;e<6;e++) for(const t of [1/3,0.5,0.81]){
    const a=pp(lerp(shape[e],shape[(e+1)%6],t),g);
    const b=lerp(pp(shape[e],g),pp(shape[(e+1)%6],g),t);
    worst=Math.max(worst,Math.hypot(a[0]-b[0],a[1]-b[1]));
  }
  A('1. equal ratio of parts survives one-point perspective — each copy is a true copy',
    worst<1e-10, 'worst '+worst.toExponential(2)+' px');
}
// 2. every wall diagonal is DEAD STRAIGHT under perspective
{
  let worst=0;
  for(let e=0;e<6;e++) for(const [t0,g0,t1,g1] of [[0,1/3,1/3,2/3],[1/3,0,2/3,1/3],[2/3,2/3,1,1]]){
    worst=Math.max(worst,straightness(tau=>pp(lerp(shape[e],shape[(e+1)%6],t0+(t1-t0)*tau), g0+(g1-g0)*tau)));
  }
  A('2. every wall diagonal images dead straight under perspective', worst<1e-10,
    'worst residual '+worst.toExponential(2)+' px — vs 1–4% sag under the glide');
}
// 3. depth-line graduation: glide equal steps, perspective a shrinking progression
{
  const M=lerp(shape[0],shape[1],0.5);
  const stepsG=[0,1/3,2/3,1].map(g=>gl(M,g));
  const stepsP=[0,1/3,2/3,1].map(g=>pp(M,g));
  const d=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
  const dg=[d(stepsG[0],stepsG[1]),d(stepsG[1],stepsG[2]),d(stepsG[2],stepsG[3])];
  const dp=[d(stepsP[0],stepsP[1]),d(stepsP[1],stepsP[2]),d(stepsP[2],stepsP[3])];
  A('3. glide graduates its depth lines in EQUAL steps; perspective in a shrinking progression',
    Math.abs(dg[0]-dg[1])<1e-9 && Math.abs(dg[1]-dg[2])<1e-9 && dp[0]>dp[1] && dp[1]>dp[2],
    'glide '+dg.map(v=>v.toFixed(2)).join(' = ')+' · persp '+dp.map(v=>v.toFixed(2)).join(' > '));
}
// 4. both families of depth lines concur at the seat — the glide at finite gauge 1/r,
//    perspective in the limit g → ∞
{
  const M=lerp(shape[2],shape[3],0.7);
  const glSeat=gl(M,1/r);
  const ppFar=pp(M,1e9);
  A('4. both concur at the seat: the glide reaches it at gauge 1/r, perspective only in the limit',
    Math.hypot(glSeat[0]-S[0],glSeat[1]-S[1])<1e-9 && Math.hypot(ppFar[0]-S[0],ppFar[1]-S[1])<1e-6,
    'glide hits it exactly; perspective approaches it');
}
console.log('\n'+pass+'/'+(pass+fail)+' assertions passed'+(fail?'  ***FAIL***':''));
process.exit(fail?1:0);
