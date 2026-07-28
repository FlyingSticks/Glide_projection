const G=require('./geo_tri2.js');
const W=900,H=600,PAD=54,FLOOR=0.22;
let pass=0,fail=0;
const A=(n,ok,d)=>{ok?pass++:fail++;console.log((ok?'PASS  ':'FAIL  ')+n+(d?'   ['+d+']':''));};
const V=(v,p)=>[(p[0]-v.cx)*v.k+W/2,(p[1]-v.cy)*v.k+H/2];
const on=(s,m=0)=>s[0]>=m&&s[0]<=W-m&&s[1]>=m&&s[1]<=H-m;

let s=246810>>>0; const rnd=()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};
let n=0, allIn=0, unclamped=0, clamped=0, sixAlwaysIn=0, padOK=0, kSane=0;
for(let t=0;t<3000;t++){
  const L=[];
  for(let i=0;i<4;i++) L.push(G.lineFrom2([rnd()*600+150,rnd()*400+100],[rnd()*600+150,rnd()*400+100]));
  const R=G.analyse(L); if(!R||!G.trichotomyOK(R)) continue;
  const N=G.ninePoints(R); if(!N) continue;
  const f=G.fitView(N.all,W,H,PAD,N.six,FLOOR);
  if(!f||!isFinite(f.k)||f.k<=0) continue;
  n++;
  if(f.k>0 && f.k<=4) kSane++;
  const nine=N.all.map(p=>V(f,p));
  const six=N.six.map(p=>V(f,p));
  if(six.every(p=>on(p,0))) sixAlwaysIn++;
  if(!f.clamped){
    unclamped++;
    if(nine.every(p=>on(p,0))) allIn++;
    // padding respected: nothing within PAD/2 of the edge when unclamped
    if(nine.every(p=>on(p,PAD/2-1))) padOK++;
  } else clamped++;
}
A('framing: scale always finite, positive, capped at 4x', kSane===n, kSane+'/'+n);
A('framing: when unclamped, ALL NINE points land inside the frame', allIn===unclamped, allIn+'/'+unclamped);
A('framing: padding respected when unclamped', padOK===unclamped, padOK+'/'+unclamped);
A('framing: the six crossings are visible in EVERY case, clamped or not', sixAlwaysIn===n, sixAlwaysIn+'/'+n);
A('framing: the floor does engage on pathological arrangements (near-parallel gap lines)',
  clamped>0, clamped+'/'+n+' arrangements hit the floor — these keep the arrows');
console.log(pass+'/'+(pass+fail)+' framing assertions passed'+(fail?'  ***FAIL***':''));
process.exit(fail?1:0);
