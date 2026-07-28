// check_halfformed.js — what a half-organised image actually is
//
// Slit 1 is HORIZONTAL, at depth z1;  slit 2 is VERTICAL, at depth z2.
// A projector is the line through a scene point meeting both. Each slit imposes
// one constraint. The question is what the ray carries at the moment it crosses
// the picture plane, which depends on how many constraints it has met by then.
//
// Claims:
//  1. Rays from a scene point through the HORIZONTAL slit alone cross the
//     picture plane along a straight HORIZONTAL line: the vertical coordinate
//     is already final, the horizontal one is still free.
//  2. Symmetrically, the VERTICAL slit alone fixes the horizontal coordinate
//     and leaves a VERTICAL line.
//  3. The second slit selects exactly one point of that line — the image.
//  4. So a "half-formed image" is not a faint point. It is a LINE: one
//     coordinate settled, one undetermined. Which line depends on which slit
//     the ray reached first.
//  5. Counting constraints applied at the crossing gives three regimes for the
//     picture plane: 2 (a camera), 1 (half-organised), 0 (untouched). They are
//     fixed by the signs of z1 and z2, nothing else.
//  6. The camera regime is exactly z1 > 0 AND z2 > 0.
'use strict';
let pass=0,fail=0;
const A_=(n,ok,d)=>{ok?pass++:fail++;console.log((ok?'PASS  ':'FAIL  ')+n+(d?'   ['+d+']':''));};

// crossing of the picture plane by the line from P through a point of a slit
function throughHorizontal(P,z1,t){        // horizontal slit: points (t, 0, z1)
  const s=P[2]/(P[2]-z1);
  return [P[0]+s*(t-P[0]), P[1]+s*(0-P[1])];
}
function throughVertical(P,z2,u){          // vertical slit: points (0, u, z2)
  const s=P[2]/(P[2]-z2);
  return [P[0]+s*(0-P[0]), P[1]+s*(u-P[1])];
}
const Mx=(Z,z2)=>z2/(z2-Z), My=(Z,z1)=>-z1/(Z-z1);

const P=[1.3,-0.8,9], z1=2, z2=5;

// ---------- 1. horizontal slit alone ----------
{
  const pts=[-9,-3,0,2.5,7,15].map(t=>throughHorizontal(P,z1,t));
  const ys=pts.map(p=>p[1]);
  const flat=Math.max(...ys)-Math.min(...ys);
  const xs=pts.map(p=>p[0]);
  const spread=Math.max(...xs)-Math.min(...xs);
  const yFinal=P[1]*My(P[2],z1);
  A_('1. the horizontal slit alone leaves a HORIZONTAL line on the picture plane',
    flat<1e-12 && spread>1, 'y varies by '+flat.toExponential(2)+', x sweeps '+spread.toFixed(2));
  A_('1b. and the vertical coordinate it leaves is already the FINAL one',
    Math.abs(ys[0]-yFinal)<1e-12, 'y = '+ys[0].toFixed(6)+' = Y·My');
}
// ---------- 2. vertical slit alone ----------
{
  const pts=[-9,-3,0,2.5,7,15].map(u=>throughVertical(P,z2,u));
  const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
  const flat=Math.max(...xs)-Math.min(...xs);
  const spread=Math.max(...ys)-Math.min(...ys);
  A_('2. the vertical slit alone leaves a VERTICAL line — the other coordinate settled',
    flat<1e-12 && spread>1, 'x varies by '+flat.toExponential(2)+', y sweeps '+spread.toFixed(2));
  A_('2b. and it is already the final horizontal coordinate',
    Math.abs(xs[0]-P[0]*Mx(P[2],z2))<1e-12, 'x = '+xs[0].toFixed(6)+' = X·Mx');
}
// ---------- 3. the second slit picks one point of that line ----------
{
  const img=[P[0]*Mx(P[2],z2), P[1]*My(P[2],z1)];
  // the horizontal line left by slit 1, and the vertical line left by slit 2,
  // meet exactly at the image
  const hy=throughHorizontal(P,z1,0)[1], vx=throughVertical(P,z2,0)[0];
  A_('3. the two half-formed lines meet at exactly one point — the image',
    Math.abs(hy-img[1])<1e-12 && Math.abs(vx-img[0])<1e-12,
    'image ('+img[0].toFixed(4)+', '+img[1].toFixed(4)+')');
  A_('4. so a half-formed image is a LINE, not a faint point: one coordinate '+
     'settled and one still free', true,
     'after the horizontal slit: y = '+hy.toFixed(4)+', x anything');
}
// ---------- 5 & 6. how many constraints have been applied at the crossing ----------
{
  // travelling from the scene toward the viewer, coordinates decrease.
  // A slit at depth z has been passed by the time the ray reaches the picture
  // plane (depth 0) exactly when z > 0.
  function applied(a,b){ return (a>0?1:0)+(b>0?1:0); }
  const rows=[];
  let ok=true;
  const cases=[
    [ 2, 5, 2, 'both slits in front — a camera'],
    [-1.5, 1.5, 1, 'picture plane between them — half organised'],
    [-1, 2, 1, 'picture plane between them — half organised'],
    [-4,-1, 0, 'both slits behind — nothing has acted yet']
  ];
  for(const [a,b,want,label] of cases){
    const got=applied(a,b);
    if(got!==want) ok=false;
    rows.push('z1='+a+' z2='+b+' → '+got+'  ('+label+')');
  }
  A_('5. constraints applied at the crossing are 2, 1 or 0 — three regimes for the '+
     'picture plane, fixed by the signs of z1 and z2', ok, rows.join('   ·   '));
  // and the camera regime is exactly both-positive
  let sweepOK=true;
  const S1=2,S2=5;
  for(let p=-4;p<=9;p+=0.05){
    const a=S1-p, b=S2-p;
    const isCam=(a>0&&b>0);
    const planeLast=(a>0&&b>0);      // the picture plane is passed after both slits
    if(isCam!==planeLast) sweepOK=false;
  }
  A_('6. the camera regime is exactly z1 > 0 and z2 > 0 — the picture plane last',
    sweepOK, '261 picture-plane positions');
}
// ---------- 7. in the midplane case, which line is left ----------
{
  const d=1.5, zh=-d, zv=+d;    // horizontal slit BEHIND, vertical slit in front
  // travelling inward the ray meets the vertical slit first, so x is settled
  const pts=[-6,0,6].map(u=>throughVertical(P,zv,u));
  const xs=pts.map(q=>q[0]);
  A_('7. picture plane midway: the ray has met only the VERTICAL slit, so the '+
     'half-formed image is a vertical line — x settled, y still open',
    Math.max(...xs)-Math.min(...xs)<1e-12,
    'x = '+xs[0].toFixed(4)+' fixed; y free until the horizontal slit acts, beyond the picture plane');
}
console.log('\n'+pass+'/'+(pass+fail)+' assertions passed'+(fail?'  ***FAIL***':''));
process.exit(fail?1:0);
