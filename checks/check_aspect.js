// check_aspect.js — the shape of a square face against depth
//
// Aspect of the image of a square face at depth Z:
//     A(Z) = |Mx| / |My| = (z2/z1) · |Z − z1| / |z2 − Z|
// Kevin's conjecture: put the square at the isotropic depth and let the shape
// distort away from it — and in both directions it should approach a square
// again at infinity. Tested.
'use strict';
let pass=0,fail=0;
const A_=(n,ok,d)=>{ok?pass++:fail++;console.log((ok?'PASS  ':'FAIL  ')+n+(d?'   ['+d+']':''));};
const z1=2, z2=5;
const Mx=Z=>z2/(z2-Z), My=Z=>-z1/(Z-z1);
const asp=Z=>Math.abs(Mx(Z))/Math.abs(My(Z));
const Zh=2*z1*z2/(z1+z2);

A_('1. closed form A(Z) = (z2/z1)·|Z−z1|/|z2−Z| matches |Mx|/|My|', (()=>{
  let w=0;
  for(let Z=-40;Z<60;Z+=0.013){
    if(Math.abs(Z-z1)<1e-3||Math.abs(Z-z2)<1e-3) continue;
    const f=(z2/z1)*Math.abs(Z-z1)/Math.abs(z2-Z);
    w=Math.max(w,Math.abs(f-asp(Z))/Math.max(1,f));
  }
  return w<1e-12;
})());

A_('2. the image is square at exactly two depths: the picture plane and Zh',
  Math.abs(asp(0)-1)<1e-12 && Math.abs(asp(Zh)-1)<1e-12, 'Z = 0 and Z = '+Zh.toFixed(6));
A_('2b. and nowhere else (sign-change search over the whole axis)', (()=>{
  const f=Z=>asp(Z)-1, roots=[], st=0.0005;
  for(let Z=-60;Z<200;Z+=st){
    if(Math.abs(Z-z1)<0.01||Math.abs(Z+st-z1)<0.01) continue;
    if(Math.abs(Z-z2)<0.01||Math.abs(Z+st-z2)<0.01) continue;
    if(f(Z)*f(Z+st)<0){ let lo=Z,hi=Z+st;
      for(let i=0;i<60;i++){const m=(lo+hi)/2; if(f(lo)*f(m)<=0) hi=m; else lo=m;}
      roots.push((lo+hi)/2); }
  }
  const d=roots.filter((v,i)=>i===0||v-roots[i-1]>0.05);
  return d.length===2 && Math.abs(d[0])<1e-6 && Math.abs(d[1]-Zh)<1e-6;
})(), 'two roots only');

A_('3. shape degenerates AT the slits: flat at z1, upright sliver at z2',
  asp(z1-1e-6)<1e-5 && asp(z1+1e-6)<1e-5 && asp(z2-1e-6)>1e5 && asp(z2+1e-6)>1e5,
  'A→0 at the horizontal slit, A→∞ at the vertical slit');

// ---- the conjecture ----
{
  const far=[100,1e3,1e5,1e8].map(asp);
  const back=[-100,-1e3,-1e5,-1e8].map(asp);
  const lim=z2/z1;
  A_('4. both directions DO approach one and the same limiting shape',
    Math.abs(far[3]-back[3])<1e-6, 'forward '+far[3].toFixed(6)+', backward '+back[3].toFixed(6));
  A_('5. but that limit is NOT a square — it is a rectangle of aspect z2/z1',
    Math.abs(far[3]-lim)<1e-6 && Math.abs(lim-1)>0.1,
    'A(∞) = '+far[3].toFixed(6)+' = z2/z1 = '+lim.toFixed(6)+', not 1');
  A_('5b. the limit is a square only when the slits coincide — i.e. a pinhole',
    (()=>{
      for(const [a,b] of [[3,3],[2,2],[7,7]]){
        const A=(b/a)*Math.abs(1e8-a)/Math.abs(b-1e8);
        if(Math.abs(A-1)>1e-6) return false;
      }
      for(const [a,b] of [[2,5],[1,9],[3,3.5]]){
        const A=(b/a)*Math.abs(1e8-a)/Math.abs(b-1e8);
        if(Math.abs(A-b/a)>1e-6) return false;
      }
      return true;
    })(), 'z1 = z2 → A ≡ 1 at all depths (perspective preserves shape)');
  A_('6. the far field reads the slit ratio off the picture directly',
    Math.abs(far[3]-z2/z1)<1e-6, 'aspect at infinity = '+(z2/z1).toFixed(3)+':1');
}
A_('7. the isotropic depth is the HARMONIC mean, not the midpoint between the slits',
  Math.abs(Zh-2*z1*z2/(z1+z2))<1e-12 && Math.abs(Zh-(z1+z2)/2)>0.5,
  'harmonic '+Zh.toFixed(4)+' vs arithmetic midpoint '+((z1+z2)/2).toFixed(4));
console.log('\n'+pass+'/'+(pass+fail)+' assertions passed'+(fail?'  ***FAIL***':''));
process.exit(fail?1:0);
