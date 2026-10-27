// Planta técnica 2D. Geometria e dimensões sempre em metros.
import {effectiveVisible} from './model.js';
import {distanceToWalls,footprintGap,detectFloorCollisions} from './geometry.js';

const PX=124;
const PAD={left:108,right:38,top:112,bottom:88};
const floorTypes=new Set(['bed','tabletop','cabinet','dresser','chair','wardrobe','nightstand','rug','plant','block','desk']);
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=value=>Number(value.toFixed(2));
const fmt=value=>Number(value).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const line=(x1,y1,x2,y2,classes='')=>'<line x1="'+n(x1)+'" y1="'+n(y1)+'" x2="'+n(x2)+'" y2="'+n(y2)+'"'+(classes?' class="'+classes+'"':'')+'/>';
const furniture=o=>effectiveVisible(o,o._project)&&!o.parentId&&floorTypes.has(o.type);
const label=o=>o.name;
const footprint=o=>fmt(o.w)+' × '+fmt(o.d)+' m';
const palette={bed:'#d0d9d5',tabletop:'#bfcfc8',cabinet:'#a5b8ab',dresser:'#a5b8ab',chair:'#dfd4c5',wardrobe:'#c5c4ba',nightstand:'#c8c5b8',rug:'#e2dac7',plant:'#c0d2b5',block:'#d2d8d1',desk:'#bfcfc8'};
function dimensionH(x1,x2,baseline,y,text){
 return '<g class="plan-dimension">'+
 line(x1,baseline-5,x1,y-8)+line(x2,baseline-5,x2,y-8)+line(x1,y,x2,y)+
 line(x1-4,y-4,x1+4,y+4)+line(x2-4,y-4,x2+4,y+4)+
 '<text class="plan-dimension-value" x="'+n((x1+x2)/2)+'" y="'+n(y-9)+'" text-anchor="middle">'+esc(text)+'</text></g>';
}
function dimensionV(y1,y2,baseline,x,text){
 const mid=(y1+y2)/2,tx=x-17;
 return '<g class="plan-dimension">'+
 line(baseline-5,y1,x+8,y1)+line(baseline-5,y2,x+8,y2)+line(x,y1,x,y2)+
 line(x-4,y1-4,x+4,y1+4)+line(x-4,y2-4,x+4,y2+4)+
 '<text class="plan-dimension-value" x="'+n(tx)+'" y="'+n(mid)+'" text-anchor="middle" transform="rotate(-90 '+n(tx)+' '+n(mid)+')">'+esc(text)+'</text></g>';
}
function planMarkup(project,selectedId,visible){
 const r=project.room,X=PAD.left,Y=PAD.top;
 const width=r.w*PX,depth=r.d*PX,right=X+width,bottom=Y+depth;
 const winLeft=X+(r.w/2+r.window.center-r.window.w/2)*PX;
 const winRight=winLeft+r.window.w*PX;
 const doorRight=X+(r.w-r.door.offset)*PX,doorLeft=doorRight-r.door.w*PX;
 const opening=r.door.angle*Math.PI/180;
 const swingX=doorRight-r.door.w*PX*Math.cos(opening);
 const swingY=bottom-r.door.w*PX*Math.sin(opening);
 const parts=['<svg id="plan-map" class="plan-map" viewBox="0 0 '+n(width+PAD.left+PAD.right)+' '+n(depth+PAD.top+PAD.bottom)+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Planta baixa do quarto, com comprimento, largura, porta, janela e móveis em escala real">'];
 parts.push('<defs><pattern id="plan-grid" width="'+PX/2+'" height="'+PX/2+'" patternUnits="userSpaceOnUse"><path d="M '+PX/2+' 0 L 0 0 0 '+PX/2+'" stroke="#dfe7e0" stroke-width=".6" fill="none"/></pattern></defs>');
 parts.push('<rect class="plan-room-bg" x="'+X+'" y="'+Y+'" width="'+n(width)+'" height="'+n(depth)+'"/>');
 parts.push('<rect x="'+X+'" y="'+Y+'" width="'+n(width)+'" height="'+n(depth)+'" fill="url(#plan-grid)" stroke="none"/>');
 parts.push('<g class="plan-structure">'+line(X,Y,X,bottom)+line(right,Y,right,bottom)+line(X,Y,winLeft,Y)+line(winRight,Y,right,Y)+line(X,bottom,doorLeft,bottom)+line(doorRight,bottom,right,bottom)+'</g>');
 parts.push('<g class="plan-window">'+line(winLeft,Y,winRight,Y)+line(winLeft,Y-5,winLeft,Y+5,'plan-opening-end')+line(winRight,Y-5,winRight,Y+5,'plan-opening-end')+'</g>');
 parts.push('<g class="plan-door-geometry"><path d="M '+n(doorLeft)+' '+n(bottom)+' A '+n(r.door.w*PX)+' '+n(r.door.w*PX)+' 0 0 1 '+n(swingX)+' '+n(swingY)+'" class="plan-door-swing"/>'+
 line(doorRight,bottom,swingX,swingY,'plan-door-leaf')+
 '<circle cx="'+n(doorRight)+'" cy="'+n(bottom)+'" r="3.5" class="plan-hinge"/></g>');
 parts.push(dimensionH(X,right,Y,36,fmt(r.w)+' m'));
 parts.push(dimensionV(Y,bottom,X,32,fmt(r.d)+' m'));
 parts.push('<text class="plan-opening-label" x="'+n((winLeft+winRight)/2)+'" y="'+n(Y-23)+'" text-anchor="middle">JANELA · '+fmt(r.window.w)+' m</text>');
 parts.push('<text class="plan-opening-note" x="'+n((winLeft+winRight)/2)+'" y="'+n(Y-9)+'" text-anchor="middle">Base '+fmt(r.window.sill)+' m · altura '+fmt(r.window.h)+' m</text>');
 parts.push('<text class="plan-opening-label" x="'+n((doorLeft+doorRight)/2)+'" y="'+n(bottom+28)+'" text-anchor="middle">PORTA · '+fmt(r.door.w)+' m</text>');
 parts.push('<text class="plan-floor-note" x="'+n(X+width/2)+'" y="'+n(bottom+65)+'" text-anchor="middle">Pé-direito '+fmt(r.h)+' m · Área '+fmt(r.w*r.d)+' m²</text>');
 // O contorno é a dimensão real do objeto; identificadores substituem nomes
 // dentro do desenho, evitando sobreposição em móveis estreitos.
 for(const {o,index} of visible){
  const x=X+(o.x+r.w/2)*PX,y=Y+(o.z+r.d/2)*PX;
  const ow=Math.max(3,o.w*PX),od=Math.max(3,o.d*PX),selected=o.id===selectedId;
  const col=palette[o.type]||'#cfdad0';
  parts.push('<g class="plan-object'+(selected?' selected':'')+'" data-plan-id="'+esc(o.id)+'" role="button" tabindex="0" aria-label="'+esc(o.name+', '+footprint(o))+'" transform="translate('+n(x)+' '+n(y)+') rotate('+n(-o.rotation)+')">');
  parts.push('<title>'+esc(o.name+' — '+footprint(o))+'</title>');
  parts.push('<rect class="plan-furniture-outline" x="'+n(-ow/2)+'" y="'+n(-od/2)+'" width="'+n(ow)+'" height="'+n(od)+'" rx="2" fill="'+col+'"/>');
  // Tag visível apenas quando cabe no móvel; a legenda preserva todos os itens.
  if(Math.min(ow,od)>=39){
    parts.push('<rect class="plan-index-bg" x="-13" y="-12" width="26" height="24" rx="7"/>');
    parts.push('<text class="plan-index" x="0" y="1" text-anchor="middle" dominant-baseline="central">'+String(index+1).padStart(2,'0')+'</text>');
  }
  parts.push('</g>');
 }
 parts.push('</svg>');
 return parts.join('');
}
function clearanceMarkup(visible,selectedId,project){
 const selection=visible.find(item=>item.o.id===selectedId)?.o;
 if(!selection)return '';
 const gaps=distanceToWalls(selection,project.room);
 const names=[['left','Esquerda'],['right','Direita'],['top','Janela'],['bottom','Entrada']];
 const nearest=visible.filter(({o})=>o.id!==selectedId)
  .map(({o})=>({name:o.name,distance:footprintGap(selection,o)}))
  .sort((a,b)=>a.distance-b.distance)[0];
 const collisions=detectFloorCollisions(project,selectedId);
 return '<section class="plan-clearance" aria-label="Distâncias do móvel selecionado">'+
 '<strong>Distâncias às paredes</strong><p>Calculadas em metros · independentes do zoom</p>'+
 '<div class="plan-clearance-grid">'+names.map(([key,name])=>{
  const value=gaps[key];
  return '<div><span>'+name+'</span><b class="'+(value<0?'plan-clearance-error':'')+'">'+
  (value<0?'Avanço '+fmt(-value):fmt(value))+' m</b></div>';
 }).join('')+'</div>'+
 (nearest?'<p class="plan-clearance-nearest"><strong>Móvel mais próximo:</strong> '+esc(nearest.name)+' · '+fmt(nearest.distance)+' m</p>':'')+
 (collisions.length?'<p class="plan-clearance-warning" role="status">Possível sobreposição com: '+esc(collisions.map(o=>o.name).join(', '))+'</p>':'')+
 '<p class="plan-clearance-method">Distâncias derivadas das posições do projeto; algumas posições ainda são estimadas.</p></section>';
}
function legendMarkup(visible,selectedId,project){
 return '<aside class="plan-legend" aria-label="Legenda dos móveis na planta">'+
 '<div class="plan-legend-heading"><strong>Móveis na planta</strong><span>'+visible.length+' representados</span></div>'+
 '<div class="plan-legend-list">'+visible.map(({o,index})=>
 '<button type="button" class="plan-legend-row'+(o.id===selectedId?' selected':'')+'" data-plan-select="'+esc(o.id)+'" aria-pressed="'+String(o.id===selectedId)+'">'+
 '<span class="plan-legend-id">'+String(index+1).padStart(2,'0')+'</span>'+
 '<span class="plan-legend-desc"><strong>'+esc(label(o))+'</strong><small>'+footprint(o)+(o.rotation?' · giro '+fmt(Math.abs(o.rotation))+'°':'')+'</small></span></button>'
 ).join('')+'</div>'+clearanceMarkup(visible,selectedId,project)+'<p class="plan-legend-note">As paredes e aberturas seguem as medidas informadas. Alguns móveis ainda têm posições aproximadas. Itens suspensos aparecem na lista de objetos do editor.</p></aside>';
}
export function renderFloorplan(host,project,selectedId){
 if(!host)return;
 const visible=project.objects.filter(o=>furniture({...o,_project:project}))
  .sort((a,b)=>(a.y+a.h)-(b.y+b.h)).map((o,index)=>({o,index}));
 host.innerHTML='<div class="plan-drawing">'+planMarkup(project,selectedId,visible)+'</div>'+legendMarkup(visible,selectedId,project);
}
export function attachFloorplanHandlers(host,getProject,onSelect,onCommit,onNotify){
 let drag=null;
 const position=(event,project)=>{
  const svg=host.querySelector('.plan-map');
  if(!svg)return null;
  const matrix=svg.getScreenCTM();
  if(!matrix)return null;
  const p=svg.createSVGPoint();
  p.x=event.clientX;p.y=event.clientY;
  const point=p.matrixTransform(matrix.inverse());
  return {x:(point.x-PAD.left)/PX-project.room.w/2,z:(point.y-PAD.top)/PX-project.room.d/2};
 };
 host.addEventListener('click',event=>{
  const el=event.target.closest('[data-plan-id],[data-plan-select]');
  if(el)onSelect(el.getAttribute('data-plan-id')||el.getAttribute('data-plan-select'));
 });
 host.addEventListener('keydown',event=>{
  if(event.key!=='Enter'&&event.key!==' ')return;
  const obj=event.target.closest('.plan-object');
  if(!obj)return;
  event.preventDefault();onSelect(obj.dataset.planId);
 });
 host.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;
  const el=event.target.closest('.plan-object');
  if(!el)return;
  const obj=getProject().objects.find(o=>o.id===el.dataset.planId);
  if(!obj)return;
  const start=position(event,getProject());if(!start)return;
  onSelect(obj.id);
  if(obj.locked){onNotify('Este móvel está fixado. Desmarque a opção antes de mover.');return;}
  drag={id:obj.id,originX:obj.x,originZ:obj.z,start,changed:false};
  host.setPointerCapture(event.pointerId);
  event.preventDefault();
 });
 host.addEventListener('pointermove',event=>{
  if(!drag)return;
  const now=position(event,getProject());if(!now)return;
  const dx=now.x-drag.start.x,dz=now.z-drag.start.z;
  if(!drag.changed&&Math.abs(dx)+Math.abs(dz)<.015)return;
  drag.changed=true;
  onCommit(drag.id,drag.originX+dx,drag.originZ+dz,false);
 });
 function finish(event){
  if(!drag)return;
  const previous=drag;drag=null;
  if(host.hasPointerCapture(event.pointerId))host.releasePointerCapture(event.pointerId);
  if(previous.changed)onCommit(previous.id,0,0,true);
 }
 host.addEventListener('pointerup',finish);
 host.addEventListener('pointercancel',finish);
}
