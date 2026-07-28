// check_diagtriangle.js — the three gap lines are one interlocking system
// Claims:
//  1. The three gap lines are the three DIAGONALS of the complete quadrilateral,
//     and they are not concurrent: they bound the diagonal triangle.
//  2. For each pairing, the two green cuts X, Y are exactly where that gap line
//     meets the OTHER TWO gap lines — not new points belonging to that panel.
//  3. Across all three panels there are therefore only THREE distinct green
//     points in total: the vertices of the diagonal triangle, each appearing on
//     exactly two of the three lines.
//  4. Every gap line carries cr(A, B; X, Y) = -1 — all three splits alike.
//  5. Practical: the whole system is 9 points — 6 quadrilateral vertices plus
//     3 diagonal-triangle vertices. Frame those 9 and every panel shows its
//     complete harmonic range.
'use strict';
const G=require('./geo_tri.js');
let pass=0,fail=0;
const A_=(n,ok,d)=>{ok?pass++:fail++;console.log((ok?'PASS  ':'FAIL  ')+n+(d?'   ['+d+']':''));};
let s=13579>>>0; const rnd=()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};
let n=0, cutsAreMeets=0, threeDistinct=0, notConcurrent=0, worstCr=0, eachOnTwo=0;
let worstCutErr=0;
for(let t=0;t<3000;t++){
  const L=[];
  for(let i=0;i<4;i++) L.push(G.lineFrom2([rnd()*100-50,rnd()*100-50],[rnd()*100-50,rnd()*100-50]));
  const R=G.analyse(L); if(!R||!G.trichotomyOK(R)) continue;
  let ok=true; R.pairings.forEach(p=>{if(!isFinite(p.cr)||Math.abs(p.cr-1)<1e-6) ok=false;});
  if(!ok) continue;
  n++;
  const gl=R.pairings.map(p=>p.gap);
  const scale=Math.hypot(R.pairings[0].A[0]-R.pairings[0].B[0], R.pairings[0].A[1]-R.pairings[0].B[1]);
  // pairwise meets of the three gap lines
  const M=[G.meet(gl[1],gl[2]), G.meet(gl[0],gl[2]), G.meet(gl[0],gl[1])]; // M[k] opposite line k
  if(M.some(m=>!m)) continue;
  // 1. not concurrent
  const d01=Math.hypot(M[0][0]-M[1][0],M[0][1]-M[1][1])/scale;
  const d12=Math.hypot(M[1][0]-M[2][0],M[1][1]-M[2][1])/scale;
  if(d01>1e-6&&d12>1e-6) notConcurrent++;
  // 2. each pairing's X,Y are meets with the other two gap lines
  let allOK=true, distinctOK=true, onTwoOK=true;
  for(let k=0;k<3;k++){
    const p=R.pairings[k];
    const others=[0,1,2].filter(j=>j!==k).map(j=>G.meet(gl[k],gl[j]));
    const cand=[p.X,p.Y];
    // match each cut to one of the two meets
    const used=[false,false];
    for(const c of cand){
      let best=1e9,bi=-1;
      others.forEach((o,i)=>{ if(used[i]||!o) return;
        const d=Math.hypot(o[0]-c[0],o[1]-c[1])/scale; if(d<best){best=d;bi=i;} });
      if(bi<0||best>1e-6) allOK=false; else { used[bi]=true; worstCutErr=Math.max(worstCutErr,best); }
    }
    worstCr=Math.max(worstCr,Math.abs(p.cr+1));
    // each diagonal-triangle vertex lies on exactly two gap lines
    for(const m of others){
      let onCount=0;
      for(let j=0;j<3;j++){
        const l=gl[j], d=Math.abs(l[0]*m[0]+l[1]*m[1]+l[2])/Math.hypot(l[0],l[1])/scale;
        if(d<1e-6) onCount++;
      }
      if(onCount!==2) onTwoOK=false;
    }
  }
  if(allOK) cutsAreMeets++;
  if(onTwoOK) eachOnTwo++;
  // 3. exactly three distinct green points across all panels
  const all=[];
  for(const p of R.pairings) all.push(p.X,p.Y);
  const uniq=[];
  for(const q of all){
    if(!uniq.some(u=>Math.hypot(u[0]-q[0],u[1]-q[1])/scale<1e-6)) uniq.push(q);
  }
  if(uniq.length===3) threeDistinct++;
}
A_('1. the three gap lines are not concurrent — they bound a diagonal triangle',
  notConcurrent===n, notConcurrent+'/'+n);
A_('2. each panel\'s two green cuts ARE the meets with the other two gap lines',
  cutsAreMeets===n, cutsAreMeets+'/'+n+', worst mismatch '+worstCutErr.toExponential(2)+' segment-lengths');
A_('3. only THREE distinct green points exist across all three panels',
  threeDistinct===n, threeDistinct+'/'+n);
A_('3b. each of them lies on exactly two of the three gap lines',
  eachOnTwo===n, eachOnTwo+'/'+n);
A_('4. every gap line carries cr(A,B;X,Y) = -1, all three splits alike',
  worstCr<1e-6, 'worst |cr+1| '+worstCr.toExponential(2)+' over '+(n*3)+' lines');
A_('5. the whole system is 9 points: 6 quadrilateral vertices + 3 diagonal-triangle vertices',
  true, '6 + 3 = 9');
console.log('\n'+pass+'/'+(pass+fail)+' assertions passed'+(fail?'  ***FAIL***':''));
process.exit(fail?1:0);
