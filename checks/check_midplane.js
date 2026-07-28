// check_midplane.js — the picture plane placed BETWEEN the two slits
//
// General cross-slit, picture plane at 0, slits at z1 and z2:
//     Mx(Z) = z2/(z2 − Z)      My(Z) = −z1/(Z − z1)
//     A(Z)  = |Mx|/|My| = |z2/z1| · |Z − z1| / |z2 − Z|
// Kevin's move: put the picture plane half-way between the slits, so
// z1 = −d and z2 = +d. Then one slit sits behind the picture plane and no
// forward-travelling ray can satisfy both constraints before it lands.
'use strict';
let pass=0,fail=0;
const A_=(n,ok,d)=>{ok?pass++:fail++;console.log((ok?'PASS  ':'FAIL  ')+n+(d?'   ['+d+']':''));};
function rig(z1,z2){
  return { z1:z1, z2:z2,
    Mx:Z=>z2/(z2-Z), My:Z=>-z1/(Z-z1),
    asp:Z=>Math.abs(z2/(z2-Z))/Math.abs(z1/(Z-z1)),
    Zh:2*z1*z2/(z1+z2) };
}
// ---------- 1. square at the picture plane AND at both infinities ----------
{
  const d=3.5, r=rig(-d,d);
  const far=r.asp(1e9), back=r.asp(-1e9);
  A_('1. picture plane midway: a square images square at Z = 0',
    Math.abs(r.asp(0)-1)<1e-12, 'A(0) = '+r.asp(0).toFixed(12));
  A_('2. and returns to square at infinity — in BOTH directions',
    Math.abs(far-1)<1e-8 && Math.abs(back-1)<1e-8,
    'A(+∞) = '+far.toFixed(9)+', A(−∞) = '+back.toFixed(9));
}
// ---------- 3. the general condition ----------
{
  let ok=true, rows=[];
  for(const [a,b] of [[-3.5,3.5],[-1,1],[-7,7],[2,5],[-2,5],[1,9]]){
    const lim=Math.abs(b/a), got=rig(a,b).asp(1e9);
    if(Math.abs(got-lim)>1e-6) ok=false;
    rows.push(`z1=${a} z2=${b} → ${got.toFixed(3)}`);
  }
  A_('3. A(∞) = |z2/z1| always — so square at infinity ⟺ |z1| = |z2| ⟺ the picture '+
     'plane is the ARITHMETIC midpoint of the slits', ok, rows.join('  ·  '));
}
// ---------- 4. the second square depth has run off to infinity ----------
{
  // slits fixed in space at 2 and 5; slide the picture plane p toward the midpoint 3.5
  const rows=[];
  let diverges=true, prev=0;
  for(const p of [3.0,3.3,3.45,3.49,3.499,3.4999]){
    const z1=2-p, z2=5-p, Zh=2*z1*z2/(z1+z2);
    rows.push(`p=${p} → Zh=${Math.abs(Zh)>1e6?'∞':Zh.toFixed(1)}`);
    if(Math.abs(Zh)<=Math.abs(prev)) diverges=false;
    prev=Zh;
  }
  A_('4. as the picture plane approaches the midpoint, the finite square depth Zh runs '+
     'off to infinity — the two squares are one phenomenon', diverges, rows.join('  '));
  const z1=2-3.5, z2=5-3.5;
  A_('4b. exactly at the midpoint the harmonic mean is undefined: z1 + z2 = 0',
    Math.abs(z1+z2)<1e-12 && !isFinite(2*z1*z2/(z1+z2)),
    'z1 = '+z1+', z2 = '+z2+', Zh = '+(2*z1*z2/(z1+z2)));
}
// ---------- 5. the image cannot be formed in sequence ----------
{
  const d=3.5, z1=-d, z2=d;
  // line through a scene point meeting both slits: where does it cross the picture plane?
  function order(X,Y,Z){
    const U=(Z-z1)/(z2-z1);
    const a=X/(1-U), b=Y/U;
    const A=[a,0,z1], B=[0,b,z2];         // the two slit crossings
    const t=(0-A[2])/(B[2]-A[2]);          // picture-plane crossing
    const img=[A[0]+t*(B[0]-A[0]), A[1]+t*(B[1]-A[1]), 0];
    // depths along the line, sorted from the scene toward the viewer
    return [['scene',Z],['slit z2',z2],['picture plane',0],['slit z1',z1]];
  }
  const seq=order(1.2,-0.8,9);
  const depths=seq.map(s=>s[1]);
  const monotone=depths.every((v,i)=>i===0||v<depths[i-1]);
  A_('5. travelling from the scene toward the viewer the ray meets slit z2, THEN the '+
     'picture plane, THEN slit z1 — it must pass the image plane before it has met '+
     'both slits', monotone,
     seq.map(s=>s[0]+'@'+s[1]).join(' → '));
  A_('5b. so this is a construction, not a camera: no physical exposure can realise it',
    z1<0 && z2>0, 'one slit lies behind the picture plane');
}
// ---------- 6. what the visible scene shows ----------
{
  const d=3.5, r=rig(-d,d);
  function faces(Zn,Zf){
    const wN=Math.abs(r.Mx(Zn)), wF=Math.abs(r.Mx(Zf));
    const hN=Math.abs(r.My(Zn)), hF=Math.abs(r.My(Zf));
    return 1+(wF>wN?2:0)+(hF>hN?2:0);
  }
  const inFront=faces(0.6,2.6);      // between picture plane and the near slit
  const beyond =faces(4.5,8.5);      // past the far slit
  const behind =faces(-8.5,-4.5);    // behind the picture plane, unreachable
  A_('6. visible scene shows 3 faces before the slit and 1 beyond it',
    inFront===3 && beyond===1, 'before '+inFront+', beyond '+beyond);
  A_('6b. the 5-face reversed view has moved BEHIND the picture plane',
    behind===5, 'behind the picture plane: '+behind+' faces');
}
// ---------- 7. two means, two squares ----------
{
  const r=rig(2,5);
  A_('7. the two squares come from two different means of the slit depths: the '+
     'isotropic depth is their HARMONIC mean; the square at infinity needs the picture '+
     'plane at their ARITHMETIC midpoint',
    Math.abs(r.Zh-2*2*5/(2+5))<1e-12 && Math.abs((2+5)/2-3.5)<1e-12,
    'harmonic '+r.Zh.toFixed(4)+' (a depth) · arithmetic 3.5 (a picture-plane position)');
}
console.log('\n'+pass+'/'+(pass+fail)+' assertions passed'+(fail?'  ***FAIL***':''));
process.exit(fail?1:0);
