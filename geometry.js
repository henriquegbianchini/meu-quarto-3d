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
