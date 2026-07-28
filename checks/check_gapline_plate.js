const GEO = require('./geo_extract.js');
let pass=0, fail=0;
function A(name, ok, d){ ok?pass++:fail++; console.log((ok?'PASS  ':'FAIL  ')+name+(d?'  ['+d+']':'')); }

// deterministic trials mirroring check_harmonic.js
let s=20260726>>>0; const rand=()=>{ s=(1664525*s+1013904223)>>>0; return s/4294967296; };
let worst=0, gapUnique=0, tested=0, simpleTwo=0, orbitOK=true;
for(let t=0;t<1500;t++){
  const L=[];
  for(let i=0;i<4;i++){
    L.push(GEO.lineFrom2([rand()*100-50,rand()*100-50],[rand()*100-50,rand()*100-50]));
  }
  const r=GEO.analyse(L);
  if(!r) continue;
  let ok=true;
  r.pairings.forEach(p=>{ if(!isFinite(p.cr)||Math.abs(p.cr-1)<1e-6) ok=false; });
  if(!ok) continue;
  tested++;
  let ns=0;
  r.pairings.forEach(p=>{ worst=Math.max(worst,Math.abs(p.cr+1)); if(p.simple) ns++; });
  if(ns===2) simpleTwo++;
  if(r.gapIndex>=0) gapUnique++;
  const orb=GEO.orbit(-1); const u=new Set(orb.map(v=>v.toFixed(9)));
  if(u.size!==3) orbitOK=false;
}
A('shipped analyse(): cr=-1 on all diagonals, '+tested+' trials', worst<1e-6, 'worst '+worst.toExponential(2));
A('shipped analyse(): gap pair unique (one-side) in all trials', gapUnique===tested, gapUnique+'/'+tested);
A('shipped analyse(): two simple 4-gons per arrangement', simpleTwo===tested, simpleTwo+'/'+tested);
A('shipped orbit(): harmonic collapses 6 to 3', orbitOK);
console.log(pass+'/'+(pass+fail)+' shipped-code assertions passed'+(fail?'  ***FAIL***':''));
process.exit(fail?1:0);
