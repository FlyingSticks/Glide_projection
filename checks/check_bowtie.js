// check_bowtie.js — the harmonic range on the 2–2 (bowtie) pairing
// Claims:
//  1. The bowtie's waist — its self-crossing point — is not a new point: it is
//     exactly one of the two gap points, A or B. (Both occur across arrangements.)
//  2. The 2–2 pairing carries the same harmonic range: cr(A,B;X,Y) = -1.
//  3. Separation holds here too: exactly one green cut inside segment AB.
//  4. In the crossed case the roles LOOK swapped: the combinatorial diagonals
//     Q0Q2, Q1Q3 do not cross each other inside the figure, while two of the
//     SIDES do — which is why the drawing reads as a trapezoid with diagonals
//     rather than a bowtie with diagonals.
//  5. Both cuts land nearer the segment than in the 1–3 case: the outside cut's
//     distance from AB is bounded far more tightly, so the bowtie panel usually
//     shows all four points on canvas.
'use strict';
const G=require('./geo_tri.js');
let pass=0,fail=0;
const A_=(n,ok,d)=>{ok?pass++:fail++;console.log((ok?'PASS  ':'FAIL  ')+n+(d?'   ['+d+']':''));};
let s=606060>>>0; const rnd=()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};
let n=0, waistIsGap=0, worstWaist=0, atA=0, atB=0, worstCr=0, sep=0,
    diagsCrossInside=0, far13=[], far22=[];
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
    if(inX!==inY) sep++;
    const outT=Math.abs(inX?tY:tX);
    if(p.split===1) far13.push(outT);
    if(p.split===2){
      far22.push(outT);
      worstCr=Math.max(worstCr,Math.abs(p.cr+1));
      // waist
      const c1=G.segsCross(p.Q[0],p.Q[1],p.Q[2],p.Q[3]);
      const waist = c1
        ? G.meet(G.lineFrom2(p.Q[0],p.Q[1]),G.lineFrom2(p.Q[2],p.Q[3]))
        : G.meet(G.lineFrom2(p.Q[1],p.Q[2]),G.lineFrom2(p.Q[3],p.Q[0]));
      const dA=Math.hypot(waist[0]-p.A[0],waist[1]-p.A[1]);
      const dB=Math.hypot(waist[0]-p.B[0],waist[1]-p.B[1]);
      const scale=Math.hypot(u[0],u[1]);
      if(Math.min(dA,dB)/scale<1e-9) waistIsGap++;
      worstWaist=Math.max(worstWaist,Math.min(dA,dB)/scale);
      if(dA<dB) atA++; else atB++;
      // do the combinatorial diagonals cross each other as segments?
      if(G.segsCross(p.Q[0],p.Q[2],p.Q[1],p.Q[3])) diagsCrossInside++;
    }
  }
}
const med=a=>{const b=a.slice().sort((x,y)=>x-y);return b[Math.floor(b.length/2)];};
A_('1. the bowtie waist is exactly one of the gap points A or B',
  waistIsGap===far22.length, waistIsGap+'/'+far22.length+', worst offset '+worstWaist.toExponential(2)+' segment-lengths');
A_('1b. both A and B occur as the waist across arrangements', atA>0&&atB>0, 'at A '+atA+', at B '+atB);
A_('2. the 2–2 pairing carries cr = -1 like the others', worstCr<1e-6, 'worst |cr+1| '+worstCr.toExponential(2));
A_('3. separation holds in every pairing: exactly one cut inside AB', sep===n*3, sep+'/'+(n*3));
A_('4. in the crossed case the combinatorial diagonals never cross each other inside the figure',
  diagsCrossInside===0, diagsCrossInside+'/'+far22.length+' — the crossing is between sides, not diagonals');
A_('5. the outside cut sits closer in the 2–2 case than the 1–3 case',
  med(far22)<med(far13), 'median |t| outside: 2–2 '+med(far22).toFixed(2)+' vs 1–3 '+med(far13).toFixed(2));
console.log('\n'+pass+'/'+(pass+fail)+' assertions passed'+(fail?'  ***FAIL***':''));
process.exit(fail?1:0);
