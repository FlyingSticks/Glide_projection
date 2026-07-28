const {GEO,FANO}=require('./geo_fano.js');
let pass=0,fail=0;
const A=(n,ok,d)=>{ok?pass++:fail++;console.log((ok?'PASS  ':'FAIL  ')+n+(d?'   ['+d+']':''));};

// --- Fano panel structure, exactly as shipped ---
const V=FANO.verify();
A('shipped FANO: canonical drawing is an order-2 projective plane', V.planeOK);
A('shipped FANO: the four given lines are in general position', V.generalPosition);
A('shipped FANO: the three diagonals are concurrent',
  V.concurrentAt!==null, 'at '+FANO.NAME[V.concurrentAt]);
A('shipped FANO: six distinct vertices, one point left over',
  V.distinctVertices===6 && V.leftover!==null,
  'vertices '+V.distinctVertices+', leftover '+FANO.NAME[V.leftover]);
A('shipped FANO: the leftover point IS the concurrency point (6+1 = 7)',
  V.leftover===V.concurrentAt, FANO.NAME[V.leftover]);
// the drawn circle really passes through the three points of that line
{
  const circLine=FANO.LN.find(l=>l.circle);
  const worst=Math.max(...circLine.pts.map(i=>{
    const p=FANO.PT[i];
    return Math.abs(Math.hypot(p[0]-FANO.circle.c[0],p[1]-FANO.circle.c[1])-FANO.circle.r);
  }));
  A('shipped FANO: the drawn circle passes through its three points', worst<0.01,
    'worst deviation '+worst.toExponential(2)+' px');
}
// every drawn straight line's three points are actually collinear on screen
{
  let worst=0;
  for(const l of FANO.LN){
    if(l.circle) continue;
    const [a,b,c]=l.pts.map(i=>FANO.PT[i]);
    const area=Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]));
    const len=Math.hypot(c[0]-a[0],c[1]-a[1]);
    worst=Math.max(worst,area/len);
  }
  A('shipped FANO: each straight line is drawn through all three of its points',
    worst<0.01, 'worst offset '+worst.toExponential(2)+' px');
}

// --- real panel: diagonals never concurrent ---
{
  let s=777001>>>0; const rnd=()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};
  let n=0, minSpread=1e18;
  for(let t=0;t<4000;t++){
    const L=[];
    for(let i=0;i<4;i++) L.push(GEO.lineFrom2([rnd()*800+50,rnd()*500+30],[rnd()*800+50,rnd()*500+30]));
    const q=GEO.quadrilateral(L); if(!q) continue;
    const con=GEO.concurrency(q); if(!con||!isFinite(con.spread)) continue;
    n++; minSpread=Math.min(minSpread,con.spread);
  }
  A('shipped GEO: the real diagonal triangle never collapses',
    minSpread>1e-6, n+' arrangements, smallest spread '+minSpread.toExponential(2)+' × figure size');
}
// --- harmonic value by field ---
{
  const ok=[2,3,5,7,11].every(p=>{
    const h=GEO.harmonicIn(p);
    return h.value===p-1 && h.degenerate===(p===2);
  });
  A('shipped GEO: −1 = p−1 in GF(p), degenerate exactly at p = 2', ok,
    [2,3,5,7,11].map(p=>'GF('+p+')→'+GEO.harmonicIn(p).value).join(', '));
}
console.log('\n'+pass+'/'+(pass+fail)+' shipped-code assertions passed'+(fail?'  ***FAIL***':''));
process.exit(fail?1:0);
