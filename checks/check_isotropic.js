// check_isotropic.js — the one depth where a cross-slit renders a square as a square
//
// In Kevin's screenshot the two magnification curves cross inside zone B, and the
// cube's near face happens to sit almost exactly on the crossing. That crossing
// is |Mx| = |My|: the unique depth at which the image is isotropic.
//
// Claims:
//  1. |Mx| = |My| exactly at Z_h = 2·z1·z2/(z1+z2) — the HARMONIC MEAN of the
//     two slit depths.
//  2. Besides the trivial Z = 0 (the picture plane, both magnifications 1),
//     that is the only isotropic depth anywhere on the axis.
//  3. Z_h always lies strictly between the slits, so the isotropic depth is
//     always in zone B — the mixed zone.
//  4. (z1, z2 ; Z_h, 0) = −1 : the isotropic depth is the HARMONIC CONJUGATE
//     OF THE PICTURE PLANE with respect to the two slits.
//  5. At Z_h a square images as a square, but mirror-flipped (Mx > 0, My < 0).
'use strict';
let pass=0,fail=0;
const A=(n,ok,d)=>{ok?pass++:fail++;console.log((ok?'PASS  ':'FAIL  ')+n+(d?'   ['+d+']':''));};
const cr=(a,b,c,d)=>((c-a)/(c-b))/((d-a)/(d-b));

let worstH=0, worstCR=0, allInB=true, rows=[];
for(const [z1,z2] of [[2,5],[1,9],[3.4,4.1],[0.7,12],[2,2.0001]]){
  const Mx=Z=>z2/(z2-Z), My=Z=>-z1/(Z-z1);
  const Zh=2*z1*z2/(z1+z2);
  // RELATIVE gap: near-equal slits push both magnifications into the 10^4 range,
  // where an absolute tolerance measures floating-point noise rather than geometry
  worstH=Math.max(worstH, Math.abs(Math.abs(Mx(Zh))-Math.abs(My(Zh)))/Math.abs(Mx(Zh)));
  worstCR=Math.max(worstCR, Math.abs(cr(z1,z2,Zh,0)+1));   // dimensionless already
  if(!(Zh>z1&&Zh<z2)) allInB=false;
  rows.push(`z1=${z1} z2=${z2} → Zh=${Zh.toFixed(4)}`);
}
A('1. |Mx| = |My| at the harmonic mean of the slit depths', worstH<1e-9,
  'worst RELATIVE gap '+worstH.toExponential(2)+' over 5 slit pairs');
{
  // detect crossings by SIGN CHANGE of |Mx|−|My|, then bisect — a threshold on the
  // difference can step straight over the root, which is what my first version did
  const z1=2,z2=5, Mx=Z=>z2/(z2-Z), My=Z=>-z1/(Z-z1);
  const Zh=2*z1*z2/(z1+z2);
  const f=Z=>Math.abs(Mx(Z))-Math.abs(My(Z));
  const roots=[]; const step=0.001;
  for(let Z=0.002;Z<200;Z+=step){
    const a=Z, b=Z+step;
    if(Math.abs(a-z1)<0.02||Math.abs(b-z1)<0.02) continue;
    if(Math.abs(a-z2)<0.02||Math.abs(b-z2)<0.02) continue;
    if(f(a)===0||f(a)*f(b)<0){
      let lo=a, hi=b;
      for(let i=0;i<60;i++){ const m=(lo+hi)/2; if(f(lo)*f(m)<=0) hi=m; else lo=m; }
      roots.push((lo+hi)/2);
    }
  }
  const distinct=roots.filter((v,i)=>i===0||v-roots[i-1]>0.05);
  A('2. and nowhere else on the axis (root-finding, not thresholding)',
    distinct.length===1 && Math.abs(distinct[0]-Zh)<1e-6,
    distinct.length+' crossing at Z = '+distinct.map(v=>v.toFixed(6)).join(', ')+
    ' vs Zh = '+Zh.toFixed(6));
}
A('3. the isotropic depth always lies between the slits — always zone B', allInB, rows.join('  ·  '));
A('4. (z1, z2 ; Zh, 0) = −1 — Zh is the harmonic conjugate of the PICTURE PLANE '+
  'with respect to the two slits', worstCR<1e-9,
  'worst |cr+1| '+worstCR.toExponential(2)+' over 5 slit pairs incl. a near-degenerate one');
{
  const z1=2,z2=5,Zh=2*z1*z2/(z1+z2);
  const Mx=z2/(z2-Zh), My=-z1/(Zh-z1);
  A('5. a square images as a square there, mirror-flipped',
    Math.abs(Math.abs(Mx)-Math.abs(My))<1e-12 && Mx>0 && My<0,
    'Mx = '+Mx.toFixed(6)+', My = '+My.toFixed(6)+'   (Zh = '+Zh.toFixed(4)+' = 20/7)');
}
console.log('\n'+pass+'/'+(pass+fail)+' assertions passed'+(fail?'  ***FAIL***':''));
process.exit(fail?1:0);
