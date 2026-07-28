const DP=require('./geo_dp.js');
let pass=0,fail=0;
const A=(n,ok,d)=>{ok?pass++:fail++;console.log((ok?'PASS  ':'FAIL  ')+n+(d?'   ['+d+']':''));};

// the shipped live checks hold at many rates, parts, and random shapes
{
  let s=90210>>>0; const rnd=()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};
  let worstR=0, worstS=0, worstQ=0, n=0;
  for(let trial=0;trial<40;trial++){
    const shape=[];
    for(let i=0;i<6;i++){
      const a=(i/6)*2*Math.PI+(rnd()-0.5)*0.5, rad=150+rnd()*150;
      shape.push([430+rad*Math.cos(a), 310+rad*Math.sin(a)*0.9]);
    }
    DP.setShape(shape);
    for(const r of [0.15,0.45,0.85]) for(const m of [2,3,5]){
      DP.setRate(r); DP.setParts(m); n++;
      worstR=Math.max(worstR,DP.ratioCheck());
      worstS=Math.max(worstS,DP.seatCheck());
      worstQ=Math.max(worstQ,DP.quadCheck());
    }
  }
  A('shipped: equal ratio of parts exact across 360 configurations', worstR<1e-9,
    'worst '+worstR.toExponential(2)+' px');
  A('shipped: mark depth-lines concur at the seat throughout', worstS<1e-6,
    'worst '+worstS.toExponential(2)+' px');
  A('shipped: wall diagonals are exact quadratics throughout', worstQ<1e-9,
    'worst fit residual '+worstQ.toExponential(2)+' px');
}
// bend behaviour: zero at r=0, growing with r
{
  DP.setShape([[120,95],[305,45],[540,120],[640,330],[450,545],[175,505]]);
  const ST=DP.stations();
  const sags=[0,0.2,0.5,0.85].map(r=>{
    DP.setRate(r);
    return DP.sag(DP.diagonal(0,0,ST[1],1,ST[2],24));
  });
  A('shipped: bend is zero at r = 0 and grows with the rate',
    sags[0]<1e-10 && sags.every((v,i)=>i===0||v>sags[i-1]),
    'sag = '+sags.map(v=>(100*v).toFixed(2)+'%').join(', ')+' at r = 0, 0.2, 0.5, 0.85');
}
// copies really are scaled copies: every copy similar to the original
{
  DP.setRate(0.6);
  const shape=DP.getShape(), ST=DP.stations();
  let worst=0;
  for(const g of ST.slice(1)){
    const cp=DP.copy(g), k=1-0.6*g;
    for(let i=0;i<shape.length;i++){
      const a=shape[i], b=shape[(i+1)%shape.length];
      const A2=cp[i], B2=cp[(i+1)%shape.length];
      worst=Math.max(worst,Math.abs(Math.hypot(B2[0]-A2[0],B2[1]-A2[1])-k*Math.hypot(b[0]-a[0],b[1]-a[1])));
    }
  }
  A('shipped: each depth copy is a true scaled copy — every edge length × (1 − r·g)',
    worst<1e-9,'worst '+worst.toExponential(2)+' px');
}
// diagonal endpoints land on the part marks they claim to join
{
  DP.setRate(0.6); DP.setParts(3);
  const ST=DP.stations(), shape=DP.getShape();
  const d=DP.diagonal(2,1/3,ST[1],2/3,ST[2],10);
  const P0=shape[2], P1=shape[3];
  const e0=DP.img(DP.lerp(P0,P1,1/3),ST[1]);
  const e1=DP.img(DP.lerp(P0,P1,2/3),ST[2]);
  const err=Math.max(Math.hypot(d[0][0]-e0[0],d[0][1]-e0[1]),
                     Math.hypot(d[10][0]-e1[0],d[10][1]-e1[1]));
  A('shipped: each diagonal joins exactly the marks it claims to join', err<1e-10,
    'endpoint error '+err.toExponential(2)+' px');
}
// ---- the perspective mode ----
{
  DP.setShape([[120,95],[305,45],[540,120],[640,330],[450,545],[175,505]]);
  DP.setRate(0.6); DP.setParts(3);
  DP.setMode('persp');
  A('shipped: perspective mode — equal ratio of parts still exact', DP.ratioCheck()<1e-9,
    DP.ratioCheck().toExponential(2));
  A('shipped: perspective mode — the diagonal is dead straight', DP.diagStraightness()<1e-9,
    'sag '+DP.diagStraightness().toExponential(2));
  const gp=DP.graduation();
  A('shipped: perspective mode — stations in a shrinking progression',
    gp[0]>gp[1]&&gp[1]>gp[2], gp.map(v=>v.toFixed(1)).join(' > '));
  DP.setMode('glide');
  const gg=DP.graduation();
  A('shipped: glide mode — stations in equal steps',
    Math.abs(gg[0]-gg[1])<1e-9&&Math.abs(gg[1]-gg[2])<1e-9, gg.map(v=>v.toFixed(1)).join(' = '));
  A('shipped: the toggle changes the diagonal from bent to straight and back',
    DP.diagStraightness()>1e-3, 'glide sag '+(100*DP.diagStraightness()).toFixed(2)+'%');
}
console.log('\n'+pass+'/'+(pass+fail)+' shipped-code assertions passed'+(fail?'  ***FAIL***':''));
process.exit(fail?1:0);
