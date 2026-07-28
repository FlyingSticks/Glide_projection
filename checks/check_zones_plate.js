const XS=require('./geo_zones.js');
let pass=0,fail=0;
const A=(n,ok,d)=>{ok?pass++:fail++;console.log((ok?'PASS  ':'FAIL  ')+n+(d?'   ['+d+']':''));};

// 1. shipped closed forms match the raw two-slit construction
{
  let worst=0;
  for(const Z of [0.6,1.5,2.7,4.2,6.5,10]) for(const X of [-1.2,0.9]) for(const Y of [-0.7,1.3]){
    const U=(Z-XS.z1)/(XS.z2-XS.z1);
    if(Math.abs(1-U)<1e-9||Math.abs(U)<1e-9) continue;
    const a=X/(1-U), b=Y/U, A1=[a,0,XS.z1], B1=[0,b,XS.z2];
    const u0=(0-A1[2])/(B1[2]-A1[2]);
    const img=[A1[0]+u0*(B1[0]-A1[0]), A1[1]+u0*(B1[1]-A1[1])];
    const f=XS.image(X,Y,Z);
    worst=Math.max(worst,Math.hypot(img[0]-f[0],img[1]-f[1]));
  }
  A('shipped: image() matches the raw two-slit construction', worst<1e-9, worst.toExponential(2));
}
// 2. every cube the UI can produce lies wholly in one zone
{
  let bad=0,n=0;
  for(const z of ['A','B','C']) for(let t=0.08;t<=0.92;t+=0.005){
    const c=XS.cubeAt(z,t); n++;
    if(XS.zoneOf(c.Zn)!==z||XS.zoneOf(c.Zf)!==z) bad++;
  }
  A('shipped: every reachable cube position stays inside its zone', bad===0, n+' positions, '+bad+' straddling');
}
// 3. face counts are 5/3/1 across the whole slider range
{
  const want={A:5,B:3,C:1}; let bad=[],n=0;
  for(const z of ['A','B','C']) for(let t=0.08;t<=0.92;t+=0.005){
    const c=XS.cubeAt(z,t), f=XS.faces(c.Zn,c.Zf); n++;
    if(f.n!==want[z]) bad.push(z+'@'+t.toFixed(3)+'→'+f.n);
  }
  A('shipped: face count is 5 / 3 / 1 at every slider position', bad.length===0,
    n+' positions'+(bad.length?'; first bad '+bad[0]:''));
}
// 4. growth direction per zone
{
  const rows=[];
  let ok=true;
  for(const z of ['A','B','C']){
    const c=XS.cubeAt(z,0.5), f=XS.faces(c.Zn,c.Zf);
    const xg=f.wF>f.wN, yg=f.hF>f.hN;
    rows.push(z+':x'+(xg?'↑':'↓')+' y'+(yg?'↑':'↓'));
    if(z==='A'&&!(xg&&yg)) ok=false;
    if(z==='B'&&!(xg&&!yg)) ok=false;
    if(z==='C'&&!(!xg&&!yg)) ok=false;
  }
  A('shipped: A both grow · B one each · C both shrink', ok, rows.join('  '));
}
// 5. receding edges really are curves in every zone
{
  let minSag=1e9;
  for(const z of ['A','B','C']){
    const c=XS.cubeAt(z,0.5);
    minSag=Math.min(minSag, XS.sag(XS.recedingEdge(-1,-1,c.Zn,c.Zf,28)));
  }
  A('shipped: receding edges bend in every zone (cross-slit, not lateral)',
    minSag>1e-3, 'smallest bend '+(100*minSag).toFixed(2)+'% of chord');
}
// 6. asymptotes are exactly the slits
{
  const near2=[XS.z2-0.01,XS.z2-0.001].map(Z=>Math.abs(XS.Mx(Z)));
  const near1=[XS.z1-0.01,XS.z1-0.001].map(Z=>Math.abs(XS.My(Z)));
  A('shipped: Mx blows up at the vertical slit, My at the horizontal slit',
    near2[1]>near2[0]&&near2[1]>1000&&near1[1]>near1[0]&&near1[1]>1000,
    '|Mx|→'+near2[1].toFixed(0)+', |My|→'+near1[1].toFixed(0));
}
// ---- the isotropic marker, added to the shipped module ----
{
  const Zh=XS.isotropicDepth(), ic=XS.isotropicCheck();
  A('shipped: Zh is the harmonic mean of the slit depths',
    Math.abs(Zh-2*XS.z1*XS.z2/(XS.z1+XS.z2))<1e-12, 'Zh = '+Zh.toFixed(6));
  A('shipped: |Mx| = |My| there', ic.gap<1e-12, 'relative gap '+ic.gap.toExponential(2));
  A('shipped: it lies strictly between the slits (always zone B)',
    Zh>XS.z1 && Zh<XS.z2 && XS.zoneOf(Zh)==='B', XS.z1+' < '+Zh.toFixed(4)+' < '+XS.z2);
  A('shipped: (z1, z2 ; Zh, 0) = -1', Math.abs(ic.cr+1)<1e-12, 'cr = '+ic.cr.toFixed(12));
  // it is the ONLY crossing, found by sign change rather than by threshold
  const f=Z=>Math.abs(XS.Mx(Z))-Math.abs(XS.My(Z));
  const roots=[]; const st=0.001;
  for(let Z=0.002;Z<200;Z+=st){
    if(Math.abs(Z-XS.z1)<0.02||Math.abs(Z+st-XS.z1)<0.02) continue;
    if(Math.abs(Z-XS.z2)<0.02||Math.abs(Z+st-XS.z2)<0.02) continue;
    if(f(Z)*f(Z+st)<0){
      let lo=Z,hi=Z+st;
      for(let i=0;i<60;i++){ const m=(lo+hi)/2; if(f(lo)*f(m)<=0) hi=m; else lo=m; }
      roots.push((lo+hi)/2);
    }
  }
  const distinct=roots.filter((v,i)=>i===0||v-roots[i-1]>0.05);
  A('shipped: it is the only crossing on the axis',
    distinct.length===1 && Math.abs(distinct[0]-Zh)<1e-6,
    distinct.length+' root at '+distinct.map(v=>v.toFixed(6)).join(','));
  // reachable by the zone-B slider?
  let straddles=0,n=0;
  for(let t=0.08;t<=0.92;t+=0.005){ const c=XS.cubeAt('B',t); n++;
    if(c.Zn<=Zh&&Zh<=c.Zf) straddles++; }
  A('shipped: the zone-B slider can place the cube across the isotropic depth',
    straddles>0, straddles+' of '+n+' positions straddle it');
}
// ---- face-shape mode ----
{
  const Zh=XS.isotropicDepth(), lim=XS.farAspect();
  A('shipped: aspect = 1 at the two square depths and nowhere else',
    Math.abs(XS.aspect(0)-1)<1e-12 && Math.abs(XS.aspect(Zh)-1)<1e-12 &&
    XS.squareDepths().length===2, 'Z = 0, '+Zh.toFixed(6));
  A('shipped: aspect approaches z2/z1 from BOTH directions',
    Math.abs(XS.aspect(1e8)-lim)<1e-6 && Math.abs(XS.aspect(-1e8)-lim)<1e-6,
    'forward '+XS.aspect(1e8).toFixed(6)+', backward '+XS.aspect(-1e8).toFixed(6)+', z2/z1 = '+lim.toFixed(6));
  A('shipped: that limit is NOT a square', Math.abs(lim-1)>0.1, lim.toFixed(3)+':1');
  A('shipped: shape degenerates at the slits',
    XS.aspect(XS.z1-1e-6)<1e-5 && XS.aspect(XS.z2-1e-6)>1e5, 'flat at z1, upright at z2');
}
console.log(pass+'/'+(pass+fail)+' shipped-code assertions passed (incl. shape mode)'+(fail?'  ***FAIL***':''));
process.exit(fail?1:0);
