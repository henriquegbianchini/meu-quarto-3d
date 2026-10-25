// Planta 2D cotada. Toda geometria parte das dimensões do projeto, em metros.
import {effectiveVisible} from './model.js';

const px=115;
const pad={left:124,right:88,top:126,bottom:135};
const escapeText=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const coord=n=>Number(n.toFixed(2));
const floorTypes=new Set(['bed','tabletop','cabinet','dresser','chair','wardrobe','nightstand','rug','plant','block','desk']);
const prettyName=o=>o.name.replace(' de solteiro','').replace(' de escritório','').replace(' · lado da porta','').replace(' · lado do tampo','');
function visibleOnPlan(o,p){return effectiveVisible(o,p)&&!o.parentId&&floorTypes.has(o.type);}
function line(x1,y1,x2,y2,extra=''){return '<line x1="'+coord(x1)+'" y1="'+coord(y1)+'" x2="'+coord(x2)+'" y2="'+coord(y2)+'" '+extra+'/>';}
function dimH(x1,x2,y,label,base){
 return '<g class="plan-dimension">'+line(x1,base,x1,y-6)+line(x2,base,x2,y-6)+line(x1,y,x2,y)+
 line(x1-5,y-5,x1+5,y+5)+line(x2-5,y-5,x2+5,y+5)+
 '<text x="'+coord((x1+x2)/2)+'" y="'+coord(y-11)+'" text-anchor="middle">'+escapeText(label)+'</text></g>';
}
function dimV(y1,y2,x,label,base){
 const mid=(y1+y2)/2;
 return '<g class="plan-dimension">'+line(base,y1,x+6,y1)+line(base,y2,x+6,y2)+line(x,y1,x,y2)+
 line(x-5,y1-5,x+5,y1+5)+line(x-5,y2-5,x+5,y2+5)+
 '<text x="'+coord(x-12)+'" y="'+coord(mid)+'" text-anchor="middle" transform="rotate(-90 '+coord(x-12)+' '+coord(mid)+')">'+escapeText(label)+'</text></g>';
}
export function renderFloorplan(host,project,selectedId){
 if(!host)return;
 const r=project.room,w=r.w*px,h=r.d*px;
 const X=pad.left,Y=pad.top,bottom=Y+h,right=X+w;
 const winL=X+(r.w/2+r.window.center-r.window.w/2)*px;
 const winR=winL+r.window.w*px;
 const doorR=X+(r.w-r.door.offset)*px,doorL=doorR-r.door.w*px;
 const doorAngle=r.door.angle*Math.PI/180;
 const doorEndX=doorR-r.door.w*px*Math.cos(doorAngle);
 const doorEndY=bottom-r.door.w*px*Math.sin(doorAngle);
 const pieces=[];
 pieces.push('<svg id="plan-map" class="plan-map" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+coord(w+pad.left+pad.right)+' '+coord(h+pad.top+pad.bottom)+'" role="img" aria-label="Planta do quarto em escala com paredes, janela, porta, medidas e móveis">');
 pieces.push('<defs><pattern id="plan-grid" width="'+px/2+'" height="'+px/2+'" patternUnits="userSpaceOnUse"><path d="M '+px/2+' 0 L 0 0 0 '+px/2+'" fill="none" stroke="#dae2da" stroke-width=".7"/></pattern></defs>');
 pieces.push('<rect x="'+X+'" y="'+Y+'" width="'+coord(w)+'" height="'+coord(h)+'" fill="#fcfdf9" stroke="none"/>');
 pieces.push('<rect x="'+X+'" y="'+Y+'" width="'+coord(w)+'" height="'+coord(h)+'" fill="url(#plan-grid)"/>');
 pieces.push('<g class="plan-wall">'+line(X,Y,X,bottom)+line(right,Y,right,bottom)+line(X,Y,winL,Y)+line(winR,Y,right,Y)+line(X,bottom,doorL,bottom)+line(doorR,bottom,right,bottom)+'</g>');
 pieces.push('<g class="plan-opening">'+line(winL,Y,winR,Y,'stroke="#71a9c2" stroke-width="9"')+
 line(winL,Y-6,winL,Y+6)+line(winR,Y-6,winR,Y+6)+'</g>');
 pieces.push('<g class="plan-door"><circle cx="'+coord(doorR)+'" cy="'+coord(bottom)+'" r="4" fill="#88694e"/>'+
 '<path d="M '+coord(doorL)+' '+coord(bottom)+' A '+coord(r.door.w*px)+' '+coord(r.door.w*px)+' 0 0 1 '+coord(doorEndX)+' '+coord(doorEndY)+'" fill="none" stroke="#c4a98a" stroke-width="1.7" stroke-dasharray="5 4"/>'+
 line(doorR,bottom,doorEndX,doorEndY,'stroke="#88694e" stroke-width="4" stroke-linecap="round"')+'</g>');
 // Escala: largura e profundidade projetadas diretamente em px por metro.
 pieces.push(dimH(X,right,Y-76,fmt(r.w)+' m',Y-8));
 pieces.push(dimV(Y,bottom,X-78,fmt(r.d)+' m',X-8));
 pieces.push('<g class="plan-label"><text x="'+coord((winL+winR)/2)+'" y="'+coord(Y-18)+'" text-anchor="middle">JANELA '+fmt(r.window.w)+' m</text>');
 pieces.push('<text x="'+coord((winL+winR)/2)+'" y="'+coord(Y+20)+'" text-anchor="middle" class="plan-caption">base '+fmt(r.window.sill)+' m · altura '+fmt(r.window.h)+' m</text>');
 pieces.push('<text x="'+coord((doorL+doorR)/2)+'" y="'+coord(bottom+26)+'" text-anchor="middle">PORTA '+fmt(r.door.w)+' m</text>');
 pieces.push('<text x="'+coord(X+w/2)+'" y="'+coord(bottom+85)+'" text-anchor="middle" class="plan-caption">ALTURA DO QUARTO: '+fmt(r.h)+' m</text></g>');
 const sorted=project.objects.filter(o=>visibleOnPlan(o,project)).sort((a,b)=>(a.y+a.h)-(b.y+b.h));
 for(const o of sorted){
  const ox=X+(o.x+r.w/2)*px,oy=Y+(o.z+r.d/2)*px;
  const fw=Math.max(4,o.w*px),fh=Math.max(4,o.d*px);
  const selected=o.id===selectedId;
  const label=prettyName(o);
  const displayText=fw>70&&fh>44;
  pieces.push('<g class="plan-object'+(selected?' selected':'')+'" data-plan-id="'+escapeText(o.id)+'" tabindex="0" role="button" aria-label="'+escapeText(o.name+', '+fmt(o.w)+' por '+fmt(o.d)+' metros')+'" transform="translate('+coord(ox)+' '+coord(oy)+') rotate('+coord(-o.rotation)+')">');
  pieces.push('<title>'+escapeText(o.name+' · '+fmt(o.w)+' × '+fmt(o.d)+' m')+'</title>');
  pieces.push('<rect x="'+coord(-fw/2)+'" y="'+coord(-fh/2)+'" width="'+coord(fw)+'" height="'+coord(fh)+'" rx="3" style="--plan-color:'+escapeText(o.color)+'"/>');
  if(displayText)pieces.push('<text text-anchor="middle" y="-4" class="plan-furniture-label">'+escapeText(label.length>19?label.slice(0,18)+'…':label)+'</text><text text-anchor="middle" y="12" class="plan-furniture-size">'+fmt(o.w)+' × '+fmt(o.d)+'</text>');
  pieces.push('</g>');
 }
 if(selectedId){
  const selected=project.objects.find(o=>o.id===selectedId);
  if(selected)pieces.push('<g class="plan-selected-label"><rect x="'+coord(X)+'" y="'+coord(bottom+45)+'" width="'+coord(w)+'" height="24" rx="6"/><text x="'+coord(X+w/2)+'" y="'+coord(bottom+61)+'" text-anchor="middle">'+escapeText(selected.name+' · '+fmt(selected.w)+' × '+fmt(selected.d)+' m')+'</text></g>');
 }
 pieces.push('</svg>');
 host.innerHTML=pieces.join('');
}
export function attachFloorplanHandlers(host,getProject,onSelect,onCommit,onNotify){
 let drag=null;
 const loc=(e,project)=>{
   const svg=host.querySelector('svg');
   if(!svg)return null;
   const matrix=svg.getScreenCTM();
   if(!matrix)return null;
   const point=svg.createSVGPoint();point.x=e.clientX;point.y=e.clientY;
   const p=point.matrixTransform(matrix.inverse());
   return {x:(p.x-pad.left)/px-project.room.w/2,z:(p.y-pad.top)/px-project.room.d/2};
 };
 host.addEventListener('click',e=>{
   const node=e.target.closest('[data-plan-id]');
   if(node)onSelect(node.getAttribute('data-plan-id'));
 });
 host.addEventListener('keydown',e=>{
   if(e.key!=='Enter'&&e.key!==' ')return;
   const node=e.target.closest('[data-plan-id]');if(!node)return;
   e.preventDefault();onSelect(node.getAttribute('data-plan-id'));
 });
 host.addEventListener('pointerdown',e=>{
   if(e.button!==0)return;
   const node=e.target.closest('[data-plan-id]');if(!node)return;
   const o=getProject().objects.find(q=>q.id===node.getAttribute('data-plan-id'));
   if(!o)return;
   onSelect(o.id);
   if(o.locked){onNotify('Este móvel está fixado. Desmarque a opção para mover.');return;}
   const p=loc(e,getProject());if(!p)return;
   drag={id:o.id,x:o.x,z:o.z,start:p,changed:false};
   host.setPointerCapture(e.pointerId);e.preventDefault();
 });
 host.addEventListener('pointermove',e=>{
   if(!drag)return;
   const p=loc(e,getProject());if(!p)return;
   const dx=p.x-drag.start.x,dz=p.z-drag.start.z;
   if(Math.abs(dx)+Math.abs(dz)<.01&&!drag.changed)return;
   drag.changed=true;
   onCommit(drag.id,drag.x+dx,drag.z+dz,false);
 });
 const finish=e=>{
   if(!drag)return;
   const old=drag;drag=null;
   if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);
   if(old.changed)onCommit(old.id,0,0,true);
 };
 host.addEventListener('pointerup',finish);host.addEventListener('pointercancel',finish);
}
