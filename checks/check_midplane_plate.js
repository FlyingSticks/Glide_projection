const MP=require('./geo_mp.js');
let pass=0,fail=0;
const A=(n,ok,d)=>{ok?pass++:fail++;console.log((ok?'PASS  ':'FAIL  ')+n+(d?'   ['+d+']':''));};

// camera position
MP.setPlane(0);
A('shipped: camera position — both slit depths positive', MP.z1()>0&&MP.z2()>0&&!MP.isConstruction(),
  'z1='+MP.z1()+', z2='+MP.z2());
A('shipped: square at the picture plane', Math.abs(MP.aspect(0)-1)<1e-12);
A('shipped: second square at the harmonic mean', Math.abs(MP.aspect(MP.Zh())-1)<1e-9,
  'Zh = '+MP.Zh().toFixed(6));
A('shipped: limit at infinity = |z2/z1|, not square',
  Math.abs(MP.aspect(1e9)-MP.farAspect())<1e-6 && Math.abs(MP.farAspect()-1)>0.1,
  MP.farAspect().toFixed(3)+':1');
A('shipped: the picture plane is the last stop along a projector — realisable',
  MP.planeIsLast(9), MP.raySequence(9).map(s=>s[0]).join(' → '));

// midpoint
MP.setPlane(MP.midpoint());
A('shipped: at the midpoint the slit depths are equal and opposite',
  Math.abs(MP.z1()+MP.z2())<1e-12 && MP.isMidpoint(), 'z1='+MP.z1()+', z2='+MP.z2());
A('shipped: Zh is undefined there — the second square is at infinity', MP.Zh()===null);
A('shipped: the shape returns to square at infinity, from BOTH directions',
  Math.abs(MP.aspect(1e9)-1)<1e-8 && Math.abs(MP.aspect(-1e9)-1)<1e-8,
  'A(+∞)='+MP.aspect(1e9).toFixed(9)+', A(−∞)='+MP.aspect(-1e9).toFixed(9));
A('shipped: still square at the picture plane', Math.abs(MP.aspect(0)-1)<1e-12);
A('shipped: NOT realisable — the image is fixed before both slits are met',
  !MP.planeIsLast(9) && MP.isConstruction(), MP.raySequence(9).map(s=>s[0]).join(' → '));

// the sweep: as the picture plane travels from one slit to the other, the second
// square depth traverses the whole projective line exactly once, 0 -> ∞ -> 0.
// (My first version asserted monotone growth from p = 0, which is wrong: |Zh|
//  first falls to zero as the plane crosses the NEAR slit.)
{
  const [S1,S2]=MP.slits(), mid=MP.midpoint();
  MP.setPlane(S1); const atS1=MP.Zh();
  MP.setPlane(S2); const atS2=MP.Zh();
  A('shipped: Zh = 0 when the picture plane sits on either slit',
    Math.abs(atS1)<1e-12 && Math.abs(atS2)<1e-12, 'both 0');
  const lower=[], upper=[];
  for(let p=S1+0.05;p<mid-1e-9;p+=0.05){ MP.setPlane(p); lower.push(MP.Zh()); }
  for(let p=mid+0.05;p<S2-1e-9;p+=0.05){ MP.setPlane(p); upper.push(MP.Zh()); }
  const lowerOK = lower.every(v=>v<0) && lower.every((v,i)=>i===0||Math.abs(v)>Math.abs(lower[i-1]));
  const upperOK = upper.every(v=>v>0) && upper.every((v,i)=>i===0||v<upper[i-1]);
  A('shipped: below the midpoint Zh is negative and diverging; above it, positive and returning',
    lowerOK && upperOK,
    'approach '+lower[lower.length-1].toFixed(0)+' → ∞ → '+upper[0].toFixed(0)+' → 0');
  MP.setPlane(mid);
  A('shipped: so the second square makes one full circuit of the projective depth line '+
    'as the plane crosses from slit to slit, passing through the ideal point at the midpoint',
    MP.Zh()===null && lowerOK && upperOK, '0 → −∞ ≡ +∞ → 0');
  const near=[];
  for(const p of [mid-0.1,mid-0.01,mid+0.01,mid+0.1]){ MP.setPlane(p); near.push(MP.farAspect()); }
  A('shipped: and the limiting shape closes on square as it does',
    near.every(v=>Math.abs(v-1)<0.15), near.map(v=>v.toFixed(4)).join(', '));
}
// A(inf) = 1 exactly when the plane is the arithmetic midpoint
{
  let ok=true;
  for(let p=-1;p<=6;p+=0.05){
    MP.setPlane(p);
    if(Math.abs(MP.z1())<1e-9||Math.abs(MP.z2())<1e-9) continue;
    const sq=Math.abs(MP.farAspect()-1)<1e-9;
    const mid=Math.abs(p-MP.midpoint())<1e-9;
    if(sq!==mid) ok=false;
  }
  A('shipped: square at infinity ⟺ picture plane at the arithmetic midpoint', ok, '141 positions');
}
// ---- the invariant, in the shipped module ----
{
  const [S1,S2]=MP.slits();
  let worst=0,n=0;
  for(let p=-6;p<=9;p+=0.019){
    if(Math.abs(p-S1)<1e-6||Math.abs(p-S2)<1e-6) continue;
    MP.setPlane(p);
    const inv=MP.invariant();
    if(inv===null) continue;
    worst=Math.max(worst,Math.abs(inv+1)); n++;
  }
  A('shipped: (S1, S2 ; square, picture plane) = −1 everywhere',
    worst<1e-9, n+' positions, worst |cr+1| '+worst.toExponential(2));
  let rt=0;
  for(const x of [-3,0,1,2.5,3,4,6,8]) rt=Math.max(rt,Math.abs(MP.conjugateOf(MP.conjugateOf(x))-x));
  A('shipped: conjugateOf is an involution', rt<1e-9, 'worst round trip '+rt.toExponential(2));
  A('shipped: its fixed points are the slits',
    Math.abs(MP.conjugateOf(S1)-S1)<1e-9 && Math.abs(MP.conjugateOf(S2)-S2)<1e-9);
  A('shipped: it swaps the midpoint with infinity',
    !isFinite(MP.conjugateOf(MP.midpoint())) && Math.abs(MP.conjugateOf(Infinity)-MP.midpoint())<1e-9);
}
console.log(pass+'/'+(pass+fail)+' shipped-code assertions passed (incl. invariant)'+(fail?'  ***FAIL***':''));
process.exit(fail?1:0);
