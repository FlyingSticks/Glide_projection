// check_invariance.js — what is actually invariant about the square depth
//
// Slits fixed in space at S1, S2. Picture plane at p. The depth at which a
// square face images square (other than the picture plane itself) is
//        Zsq = p + 2·z1·z2/(z1+z2),   z_i = S_i − p
// which is usually described as "the harmonic mean of the slit depths". That
// phrasing hides the picture plane inside the word "depths".
//
// Claims:
//  1. A(∞) = |z2/z1| is NOT a property of the slit pair — it moves with the
//     picture plane. Kevin's instinct.
//  2. The invariant is a cross-ratio: (S1, S2 ; Zsq, p) = −1, in absolute
//     coordinates, for every picture-plane position. Zsq is the HARMONIC
//     CONJUGATE OF THE PICTURE PLANE with respect to the two slits.
//  3. The map p ↦ Zsq is therefore an INVOLUTION: apply it twice, return.
//  4. Its fixed points are exactly the two slits.
//  5. It exchanges the midpoint of the slits with the point at infinity —
//     which is the whole content of the midplane configuration.
//  6. "Harmonic mean" is the special case p = 0: the harmonic mean of a and b
//     is just the harmonic conjugate of the ORIGIN with respect to a and b.
//  7. Under an arbitrary projectivity of the depth line the harmonic conjugacy
//     survives exactly; A(∞) does not, because it is anchored to the ideal
//     point. That is the precise sense in which one is invariant and the other
//     is only affine.
'use strict';
let pass=0,fail=0;
const A_=(n,ok,d)=>{ok?pass++:fail++;console.log((ok?'PASS  ':'FAIL  ')+n+(d?'   ['+d+']':''));};
const cr=(a,b,c,d)=>((c-a)/(c-b))/((d-a)/(d-b));
const S1=2, S2=5;
const zsq=p=>{ const a=S1-p, b=S2-p, s=a+b;
  return Math.abs(s)<1e-12 ? Infinity : p + 2*a*b/s; };
const Ainf=p=>Math.abs((S2-p)/(S1-p));

// ---------- 1. A(∞) is not invariant ----------
{
  const vals=[0,1,2.5,3,4,4.5,-1].map(p=>[p,Ainf(p)]);
  const spread=Math.max(...vals.map(v=>v[1]))/Math.min(...vals.map(v=>v[1]));
  A_('1. A(∞) changes with the picture plane — not a property of the slit pair',
    spread>3, vals.map(v=>'p='+v[0]+'→'+v[1].toFixed(2)).join('  '));
}
// ---------- 2. the invariant ----------
{
  let worst=0, n=0;
  for(let p=-6;p<=9;p+=0.017){
    if(Math.abs(p-S1)<1e-6||Math.abs(p-S2)<1e-6) continue;
    const Z=zsq(p);
    if(!isFinite(Z)) continue;
    worst=Math.max(worst,Math.abs(cr(S1,S2,Z,p)+1)); n++;
  }
  A_('2. (S1, S2 ; Zsq, p) = −1 at every picture-plane position',
    worst<1e-9, n+' positions, worst |cr+1| '+worst.toExponential(2));
}
// ---------- 3 & 4. involution, fixed at the slits ----------
{
  let worst=0;
  for(const p of [-3,-0.5,0,1,2.5,3,4,4.4,6,8]){
    const Z=zsq(p);
    if(!isFinite(Z)) continue;
    worst=Math.max(worst,Math.abs(zsq(Z)-p));
  }
  A_('3. p ↦ Zsq is an involution — applying it twice returns the picture plane',
    worst<1e-9, 'worst round-trip error '+worst.toExponential(2));
  A_('4. its fixed points are exactly the two slits',
    Math.abs(zsq(S1)-S1)<1e-9 && Math.abs(zsq(S2)-S2)<1e-9 &&
    [0,1,3,4,6].every(p=>Math.abs(zsq(p)-p)>1e-6),
    'Zsq(S1)='+zsq(S1).toFixed(6)+', Zsq(S2)='+zsq(S2).toFixed(6));
}
// ---------- 5. midpoint ↔ infinity ----------
{
  const mid=(S1+S2)/2;
  const big=1e7;
  A_('5. the involution exchanges the midpoint with the point at infinity',
    !isFinite(zsq(mid)) && Math.abs(zsq(big)-mid)/mid<1e-6,
    'Zsq(midpoint) = ∞ · Zsq(far away) → '+zsq(big).toFixed(4)+' vs midpoint '+mid);
}
// ---------- 6. "harmonic mean" is the case p = 0 ----------
{
  const hm=2*S1*S2/(S1+S2);
  A_('6. the harmonic mean is just the harmonic conjugate of the ORIGIN — the name '+
     'hides the picture plane inside the word "depths"',
    Math.abs(zsq(0)-hm)<1e-12 && Math.abs(cr(S1,S2,hm,0)+1)<1e-12,
    'Zsq(0) = '+zsq(0).toFixed(6)+' = 2·S1·S2/(S1+S2)');
}
// ---------- 7. behaviour under a projectivity of the depth line ----------
{
  // an arbitrary projective change of depth coordinate
  const M=[[1.7,-2.3],[0.31,1.05]];                 // t ↦ (1.7t − 2.3)/(0.31t + 1.05)
  const T=t=>!isFinite(t) ? M[0][0]/M[1][0] : (M[0][0]*t+M[0][1])/(M[1][0]*t+M[1][1]);
  let worstCR=0, changedA=false;
  for(const p of [-1,0,1,2.6,3,4,6]){
    const Z=zsq(p);
    if(!isFinite(Z)) continue;
    worstCR=Math.max(worstCR,Math.abs(cr(T(S1),T(S2),T(Z),T(p))+1));
    // A(∞) rebuilt in the new coordinate, where the ideal point has MOVED
    const A2=Math.abs((T(S2)-T(p))/(T(S1)-T(p)));
    if(Math.abs(A2-Ainf(p))>1e-6) changedA=true;
  }
  A_('7. under an arbitrary projectivity the harmonic conjugacy is preserved exactly',
    worstCR<1e-9, 'worst |cr+1| '+worstCR.toExponential(2));
  A_('7b. while A(∞) is not — it is anchored to the ideal point, so it is affine, '+
     'not projective', changedA, 'the ratio changes when infinity moves');
}
console.log('\n'+pass+'/'+(pass+fail)+' assertions passed'+(fail?'  ***FAIL***':''));
process.exit(fail?1:0);
