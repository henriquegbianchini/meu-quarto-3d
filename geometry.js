// Geometria técnica compartilhada. Todas as coordenadas e distâncias são em metros.
// Origem no centro do piso; X cresce para a direita e Z cresce para a entrada.
const roundMeter=n=>Math.abs(n)<1e-9?0:Number(n.toFixed(3));

export function getObjectFootprint(object){
 const {x,z,w,d}=object;
 const angle=(object.rotation||0)*Math.PI/180;
 const c=Math.cos(angle),s=Math.sin(angle);
 return [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([dx,dz])=>({
   x:x+dx*c+dz*s,
   z:z-dx*s+dz*c
 }));
}

// Signed clearance to the inner room bounds. Negative values mean an overlap
// with a wall; values are not clamped so an editor can display that warning.
export function distanceToWalls(object,room){
 const points=getObjectFootprint(object);
 const xs=points.map(p=>p.x),zs=points.map(p=>p.z);
 return {
   left:roundMeter(Math.min(...xs)+room.w/2),
   right:roundMeter(room.w/2-Math.max(...xs)),
   top:roundMeter(Math.min(...zs)+room.d/2),
   bottom:roundMeter(room.d/2-Math.max(...zs))
 };
}


const dot=(a,axis)=>a.x*axis.x+a.z*axis.z;
const EPS=1e-8;
const axes=poly=>poly.map((p,i)=>{
 const q=poly[(i+1)%poly.length];
 return {x:-(q.z-p.z),z:q.x-p.x};
});
function intersectsWithPenetration(a,b){
 for(const axis of [...axes(a),...axes(b)]){
  const pa=a.map(p=>dot(p,axis)),pb=b.map(p=>dot(p,axis));
  if(Math.max(...pa)<=Math.min(...pb)+EPS||Math.max(...pb)<=Math.min(...pa)+EPS)return false;
 }
 return true;
}
function pointSegmentSquared(p,a,b){
 const dx=b.x-a.x,dz=b.z-a.z;
 const len=dx*dx+dz*dz;
 const t=len<1e-15?0:Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/len));
 return (p.x-a.x-t*dx)**2+(p.z-a.z-t*dz)**2;
}
const cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
const onSegment=(a,b,p)=>p.x>=Math.min(a.x,b.x)-EPS&&p.x<=Math.max(a.x,b.x)+EPS&&p.z>=Math.min(a.z,b.z)-EPS&&p.z<=Math.max(a.z,b.z)+EPS;
function touching(a,b,c,d){
 const abC=cross(a,b,c),abD=cross(a,b,d),cdA=cross(c,d,a),cdB=cross(c,d,b);
 if(abC*abD<-EPS&&cdA*cdB<-EPS)return true;
 return Math.abs(abC)<=EPS&&onSegment(a,b,c)||
  Math.abs(abD)<=EPS&&onSegment(a,b,d)||
  Math.abs(cdA)<=EPS&&onSegment(c,d,a)||
  Math.abs(cdB)<=EPS&&onSegment(c,d,b);
}
export function footprintGap(a,b){
 const p=getObjectFootprint(a),q=getObjectFootprint(b);
 if(intersectsWithPenetration(p,q))return 0;
 let best=Infinity;
 for(let i=0;i<p.length;i++){
  const p1=p[i],p2=p[(i+1)%p.length];
  for(let j=0;j<q.length;j++){
   const q1=q[j],q2=q[(j+1)%q.length];
   if(touching(p1,p2,q1,q2))return 0;
   best=Math.min(best,pointSegmentSquared(p1,q1,q2),pointSegmentSquared(p2,q1,q2),pointSegmentSquared(q1,p1,p2),pointSegmentSquared(q2,p1,p2));
  }
 }
 return roundMeter(Math.sqrt(best));
}
export function detectFloorCollisions(project,id){
 const current=project.objects.find(o=>o.id===id);
 if(!current||current.parentId)return [];
 const shape=getObjectFootprint(current);
 return project.objects.filter(o=>{
  if(o.id===id||o.parentId||o.visible===false||current.visible===false)return false;
  const verticalOverlap=Math.min(current.y+current.h,o.y+o.h)-Math.max(current.y,o.y);
  return verticalOverlap>EPS&&intersectsWithPenetration(shape,getObjectFootprint(o));
 });
}
