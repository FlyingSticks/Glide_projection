// check_cuts.js — where the harmonic range sits on the gap line
// Claims:
//  1. Harmonic conjugates separate: exactly ONE of the two diagonal cuts lies
//     inside segment AB, the other outside it — in every split class.
//  2. In the 1–3 case the INSIDE cut is always the diagonal through the lone
//     vertex; the outside cut is the diagonal joining the three-side vertices.
//  3. That outside cut runs away without bound as its diagonal turns parallel
//     to the gap line — which is why it is often off-canvas.
'use strict';
const G=require('./geo_tri.js');
let pass=0,fail=0;
const A=(n,ok,d)=>{ok?pass++:fail++;console.log((ok?'PASS  ':'FAIL  ')+n+(d?'   ['+d+']':''));};
let s=8080>>>0; const rnd=()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};
let n=0, sep=0, loneInside=0, n13=0, farCount=0, maxT=0;
for(let t=0;t<3000;t++){
  const L=[];
  for(let i=0;i<4;i++) L.push(G.lineFrom2([rnd()*100-50,rnd()*100-50],[rnd()*100-50,rnd()*100-50]));
  const R=G.analyse(L); if(!R||!G.trichotomyOK(R)) continue;
  let ok=true; R.pairings.forEach(p=>{if(!isFinite(p.cr)||Math.abs(p.cr-1)<1e-6) ok=false;});
  if(!ok) continue;
  n++;
  for(const p of R.pairings){
    const u=[p.B[0]-p.A[0],p.B[1]-p.A[1]], d2=u[0]*u[0]+u[1]*u[1];
    const par=q=>((q[0]-p.A[0])*u[0]+(q[1]-p.A[1])*u[1])/d2;
    const tX=par(p.X), tY=par(p.Y);
    const inX=tX>0&&tX<1, inY=tY>0&&tY<1;
    if(inX!==inY) sep++;                       // exactly one inside
    maxT=Math.max(maxT,Math.abs(inX?tY:tX));
    if(p.split===1){
      n13++;
      const lone=p.Q.findIndex((q,i)=>p.sides[i]!==p.majority);
      // X comes from diagonal Q0-Q2, Y from Q1-Q3
      const loneDiagIsX=(lone===0||lone===2);
      const insideIsX=inX;
      if(loneDiagIsX===insideIsX) loneInside++;
      if(Math.abs(insideIsX?tY:tX)>5) farCount++;
    }
  }
}
A('1. harmonic conjugates separate: exactly one cut inside segment AB',
  sep===n*3, sep+'/'+(n*3)+' pairings');
A('2. in the 1–3 case the inside cut is the diagonal through the lone vertex',
  loneInside===n13, loneInside+'/'+n13+' of the 1–3 pairings');
A('3. the outside cut ranges far beyond the segment (unbounded as its diagonal turns parallel)',
  maxT>50, 'largest |t| of an outside cut: '+maxT.toFixed(1)+' segment-lengths from A; '+
  (100*farCount/n13).toFixed(0)+'% of 1–3 cases put it >5 lengths out');
console.log('\n'+pass+'/'+(pass+fail)+' assertions passed'+(fail?'  ***FAIL***':''));
process.exit(fail?1:0);
