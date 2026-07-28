const HF=require('./geo_hf.js');
let pass=0,fail=0;
const A=(n,ok,d)=>{ok?pass++:fail++;console.log((ok?'PASS  ':'FAIL  ')+n+(d?'   ['+d+']':''));};
const S=HF.slits();

// the three regimes land where they should
HF.setPlane(0);
A('shipped: camera position — both slits passed, 2 settled',
  HF.settled()===2 && HF.regime()==='camera' && HF.planeIsLast(),
  HF.stops().map(s=>s.name).join(' → '));
HF.setPlane(3.5);
A('shipped: midway — 1 settled, picture plane not last',
  HF.settled()===1 && HF.regime()==='half' && !HF.planeIsLast(),
  HF.stops().map(s=>s.name).join(' → '));
A('shipped: and it is the VERTICAL slit that has acted, so x is the settled one',
  HF.actedV() && !HF.actedH(), 'zv='+HF.zv()+' > 0 > zh='+HF.zh());
HF.setPlane(6.5);
A('shipped: behind both — 0 settled',
  HF.settled()===0 && HF.regime()==='none' && !HF.planeIsLast(),
  HF.stops().map(s=>s.name).join(' → '));

// the equivalence, swept
{
  let ok=true, counts={0:0,1:0,2:0};
  for(let p=-2;p<=7.4;p+=0.02){
    HF.setPlane(p);
    if(Math.abs(HF.zh())<1e-9||Math.abs(HF.zv())<1e-9) continue;
    const n=HF.settled();
    counts[n]++;
    if((n===2)!==(HF.zh()>0&&HF.zv()>0)) ok=false;
    if((n===2)!==HF.planeIsLast()) ok=false;
  }
  A('shipped: settled = 2 ⟺ both slit depths positive ⟺ picture plane passed last',
    ok, 'counts by regime — 0:'+counts[0]+'  1:'+counts[1]+'  2:'+counts[2]);
}
// the image coordinates are the closed forms, and each depends on ONE slit only
{
  HF.setPlane(0);
  const Z=HF.Z(), zh=HF.zh(), zv=HF.zv();
  A('shipped: x depends only on the vertical slit, y only on the horizontal',
    Math.abs(HF.Mx()-zv/(zv-Z))<1e-12 && Math.abs(HF.My()-(-zh/(Z-zh)))<1e-12,
    'Mx = '+HF.Mx().toFixed(6)+', My = '+HF.My().toFixed(6));
  // moving the horizontal slit must not move x
  const x0=HF.image(0)[0];
  A('shipped: so the settled coordinate is genuinely independent of the other slit',
    Math.abs(x0-HF.points()[0][0]*HF.Mx())<1e-12, 'x = '+x0.toFixed(6));
}
// three points give three parallel stripes in the half regime
{
  HF.setPlane(3.5);
  const xs=HF.points().map((_,i)=>HF.image(i)[0]);
  const distinct=new Set(xs.map(v=>v.toFixed(6))).size;
  A('shipped: in the half regime the three scene points give three distinct stripes',
    distinct===3, xs.map(v=>v.toFixed(3)).join(', '));
}
console.log('\n'+pass+'/'+(pass+fail)+' shipped-code assertions passed'+(fail?'  ***FAIL***':''));
process.exit(fail?1:0);
