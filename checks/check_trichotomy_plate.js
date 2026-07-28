const G=require('./geo_tri.js');
let pass=0,fail=0;
function A(n,ok,d){ ok?pass++:fail++; console.log((ok?'PASS  ':'FAIL  ')+n+(d?'  ['+d+']':'')); }
let s=424242>>>0; const rnd=()=>{ s=(1664525*s+1013904223)>>>0; return s/4294967296; };
let tested=0, triAll=0, crossedIs2=0, worst=0, oneSideIsSplit0=0, sidesConsistent=0;
for(let t=0;t<2000;t++){
  const L=[];
  for(let i=0;i<4;i++) L.push(G.lineFrom2([rnd()*100-50,rnd()*100-50],[rnd()*100-50,rnd()*100-50]));
  const r=G.analyse(L); if(!r) continue;
  let ok=true; r.pairings.forEach(p=>{ if(!isFinite(p.cr)||Math.abs(p.cr-1)<1e-6) ok=false; });
  if(!ok) continue;
  tested++;
  if(G.trichotomyOK(r)) triAll++;
  if(r.pairings.every(p=>p.simple===(p.split!==2))) crossedIs2++;
  if(r.pairings.every(p=>p.oneSide===(p.split===0))) oneSideIsSplit0++;
  // sides array must have exactly `split` minority entries
  if(r.pairings.every(p=>{
      const nPos=p.sides.filter(x=>x>0).length;
      return Math.min(nPos,4-nPos)===p.split;
    })) sidesConsistent++;
  r.pairings.forEach(p=>{ worst=Math.max(worst,Math.abs(p.cr+1)); });
}
A('shipped: splits are always {0,1,2}', triAll===tested, triAll+'/'+tested);
A('shipped: crossed <=> split 2', crossedIs2===tested, crossedIs2+'/'+tested);
A('shipped: oneSide flag <=> split 0', oneSideIsSplit0===tested, oneSideIsSplit0+'/'+tested);
A('shipped: rendered side colors match the reported split', sidesConsistent===tested, sidesConsistent+'/'+tested);
A('shipped: cr = -1 on all three pairings', worst<1e-6, 'worst |cr+1| '+worst.toExponential(2));
console.log(pass+'/'+(pass+fail)+' shipped-code assertions passed'+(fail?'  ***FAIL***':''));
process.exit(fail?1:0);
