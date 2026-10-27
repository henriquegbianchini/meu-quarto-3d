export const SCHEMA = 'meu-espaco/quarto-3d/v1';
export const PROJECT_REVISION = 'medidas-2026-10-25-v2';
const REMOVED_OBJECT_IDS = new Set(['led','fan','backpack','dog']);
const RETIRED_TYPES = new Set(['led','fan','backpack','dog']);
export function removeRetiredObjects(project) {
  // Old backups may contain obsolete types under new IDs. Remove by type AND ID.
  const removedIds=new Set(project.objects.filter(o=>o&&(
    REMOVED_OBJECT_IDS.has(o.id)||RETIRED_TYPES.has(o.type)
  )).map(o=>o.id));
  project.objects=project.objects.filter(o=>o&&!removedIds.has(o.id));
  for(const object of project.objects){
    if(removedIds.has(object.parentId))delete object.parentId;
  }
  return project;
}
export const CATALOG = {
  bed:{label:'Cama de solteiro',category:'Móvel',icon:'bed',w:.9,d:2,h:.60,color:'#e7e7e0'},
  desk:{label:'Bancada de trabalho',category:'Móvel',icon:'top',w:.62,d:1.68,h:.76,color:'#838c88'},
  tabletop:{label:'Tampo da bancada',category:'Móvel',icon:'top',w:.62,d:2.10,h:.04,y:.70,color:'#838c88'},
  cabinet:{label:'Gabinete com gavetas',category:'Móvel',icon:'top',w:.65,d:.65,h:.70,color:'#282c2a'},
  dresser:{label:'Cômoda',category:'Móvel',icon:'top',w:.62,d:.95,h:.76,color:'#282c2a'},
  chair:{label:'Cadeira de escritório',category:'Móvel',icon:'cube',w:.62,d:.62,h:1.06,color:'#282f2c'},
  shelf:{label:'Prateleira',category:'Parede',icon:'top',w:.25,d:.84,h:.02,color:'#303b36',y:1.58},
  l_shelf:{label:'Prateleira em L',category:'Parede',icon:'top',w:.50,d:1.35,h:.02,shelfDepth:.25,color:'#303b36',y:1.66},
  monitor:{label:'Monitor horizontal',category:'Equipamento',icon:'top',w:.11,d:.6,h:.42,color:'#252c2c'},
  portrait:{label:'Monitor vertical',category:'Equipamento',icon:'top',w:.11,d:.27,h:.51,color:'#252c2c'},
  pc:{label:'Computador',category:'Equipamento',icon:'cube',w:.26,d:.42,h:.43,color:'#222a2c'},
  keyboard:{label:'Teclado e mousepad',category:'Equipamento',icon:'top',w:.3,d:.7,h:.015,color:'#d8d3ce'},
  cans:{label:'Coleção de latas',category:'Decoração',icon:'cube',w:.14,d:1.18,h:.27,color:'#9a586a'},
  books:{label:'Livros e colecionáveis',category:'Decoração',icon:'folder',w:.17,d:.55,h:.25,color:'#b6aa83'},
  frames:{label:'Conjunto de quadros',category:'Parede',icon:'top',w:.035,d:.72,h:.57,color:'#252e2b',y:1.8},
  frame:{label:'Quadro individual',category:'Parede',icon:'top',w:.025,d:.30,h:.225,color:'#252e2b',y:1.95},
  wardrobe:{label:'Guarda-roupa',category:'Móvel',icon:'cube',w:1.2,d:.55,h:2.1,color:'#c4b59d'},
  nightstand:{label:'Mesa de cabeceira',category:'Móvel',icon:'top',w:.42,d:.38,h:.5,color:'#b2a085'},
  rug:{label:'Tapete',category:'Decoração',icon:'top',w:1.2,d:1.6,h:.012,color:'#b9ab94'},
  plant:{label:'Planta em vaso',category:'Decoração',icon:'sun',w:.4,d:.4,h:.85,color:'#718d5c'},
  block:{label:'Móvel livre',category:'Móvel',icon:'cube',w:.6,d:.6,h:.75,color:'#a7b49f'}
};
function item(id,type,name,x,z,extra={}) { return {id,type,name,x,z,y:0,rotation:0,visible:true,locked:false,...CATALOG[type],...extra}; }
export const DEFAULT_PROJECT = {
  schema:SCHEMA,revision:PROJECT_REVISION,title:'Meu quarto',estimated:false,
  measurementNotes:[
    'Quarto: 3,10 m na parede da janela/porta, 2,90 m na parede do PC e 2,70 m de altura. Medidas fornecidas pelo usuário.',
    'Moldura externa da janela: 2,05 × 1,30 m, começando a 1,00 m do chão e centralizada. Laterais livres de 52,5 cm.',
    'Dois gabinetes maiores: conjunto de 1,30 × 0,65 × 0,70 m, sem o tampo. A divisão em 65 + 65 cm é provisória, pois só a largura conjunta foi informada.',
    'Gabinete menor: 0,40 × 0,65 × 0,70 m. Tampo: 2,10 × 0,62 × 0,04 m, rente ao gabinete menor e cobrindo apenas parte dos maiores, conforme esclarecimento do usuário. A extensão descoberta dos gabinetes ainda é estimada.',
    'Cama: 2,00 × 0,90 × 0,60 m. Porta: 0,90 × 2,10 m, encostada na parede lateral.',
    'Prateleiras em L: braços externos de 1,35 m e 0,50 m; profundidade de 25 cm e espessura de 2 cm. Altura das superfícies: 1,68 e 2,05 m; vão livre de 35 cm e 65 cm do topo superior até o teto. Os 35 cm foram interpretados como vão livre.',
    'Prateleira sob os quadros: superfície a 1,60 m do chão. Comprimento de 84 cm e profundidade de 25 cm ainda estimados.',
    'Quadros: topo do conjunto a 25 cm do teto, base a 35 cm acima da prateleira de 1,60 m, primeiro quadro a 15 cm da parede lateral, vão horizontal de 15 cm e vão vertical de 5 cm. Altura derivada de 22,5 cm por quadro; largura individual de 30 cm ainda estimada.',
    'Posições sem cotas, detalhes decorativos, monitores, cadeira e espessuras de paredes continuam aproximados.'
  ],
  room:{w:3.10,d:2.90,h:2.70,wallColor:'#638da2',floorColor:'#eeeadc',woodColor:'#704b31',tile:.45,window:{w:2.05,h:1.30,sill:1.00,center:0},door:{w:.90,h:2.10,offset:0,angle:83}},
  objects:[
    item('desk','tabletop','Tampo cinza',-1.21,-.40,{y:.70,note:'Começa rente ao gabinete menor. Deixa aproximadamente 65 cm dos maiores descobertos; essa parte da posição ainda precisa de uma cota.'}),
    item('dresser','cabinet','Gabinete maior · lado da porta',-1.225,.975,{note:'Largura individual provisória de 65 cm. Os dois maiores juntos medem 130 cm, com profundidade de 65 cm e altura de 70 cm.'}),
    item('cabinet-large-2','cabinet','Gabinete maior · lado do tampo',-1.225,.325,{note:'Largura individual provisória de 65 cm. Os dois maiores juntos medem 130 cm.'}),
    item('cabinet-right','cabinet','Gabinete menor',-1.225,-1.25,{d:.40}),
    item('bed','bed','Cama de solteiro',1.10,-.45),
    item('chair','chair','Cadeira de escritório',-.54,-.48,{rotation:90}),
    item('pc','pc','Computador RGB',-1.19,-1.18,{y:.74,parentId:'desk'}),
    item('screen','monitor','Monitor horizontal',-1.39,-.60,{y:.74,parentId:'desk'}),
    item('portrait','portrait','Monitor vertical',-1.39,-.06,{y:.74,parentId:'desk'}),
    item('keyboard','keyboard','Teclado e mousepad',-1.06,-.52,{y:.745,parentId:'desk'}),
    item('shelf-low','l_shelf','Prateleira em L · inferior',-1.30,-.775,{y:1.66,note:'Superfície a 168 cm do chão. Braços de 135 e 50 cm, profundidade 25 cm e espessura 2 cm.'}),
    item('shelf-high','l_shelf','Prateleira em L · superior',-1.30,-.775,{y:2.03,note:'Superfície a 205 cm do chão, 65 cm abaixo do teto. Vão livre de 35 cm sobre a prateleira inferior.'}),
    item('cans','cans','Coleção de latas',-1.415,-.77,{y:1.68,d:1.18,parentId:'shelf-low'}),
    item('shelf-books','books','Livros da prateleira',-1.415,-1.06,{y:2.05,parentId:'shelf-high',d:.47}),
    item('shelf-front','shelf','Prateleira sob os quadros',-1.425,.88,{y:1.58,note:'Superfície a 160 cm do chão. Comprimento e profundidade ainda estimados.'}),
    item('collectibles','books','Livros e colecionáveis',-1.41,.88,{y:1.60,d:.73,parentId:'shelf-front'}),
    item('frames','frame','Quadro · superior esquerdo',-1.5375,1.15,{y:2.225,note:'Topo a 25 cm do teto. Altura de 22,5 cm derivada das distâncias informadas; largura de 30 cm estimada.'}),
    item('frame-top-right','frame','Quadro · superior direito',-1.5375,.70,{y:2.225,note:'Vão horizontal de 15 cm entre os quadros. Largura de 30 cm estimada.'}),
    item('frame-bottom-left','frame','Quadro · inferior esquerdo',-1.5375,1.15,{y:1.95,note:'Base a 35 cm da superfície da prateleira. Vão vertical de 5 cm até o quadro superior.'}),
    item('frame-bottom-right','frame','Quadro · inferior direito',-1.5375,.70,{y:1.95,note:'Base a 35 cm da superfície da prateleira. Vão vertical de 5 cm até o quadro superior.'}),
    item('books-dresser','books','Livros sobre o tampo cinza',-1.17,.48,{y:.74,d:.31,h:.17,parentId:'desk'}),
    item('books-cabinet','books','Livros no gabinete descoberto',-1.37,1.10,{y:.70,d:.25,h:.22,parentId:'dresser'})
  ]
};
export const clone = value => JSON.parse(JSON.stringify(value));
export const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
export const round = (n,p=3) => Number(n.toFixed(p));
export function effectiveVisible(o,project) { if(!o.visible)return false; if(o.parentId){const p=project.objects.find(x=>x.id===o.parentId);return p?effectiveVisible(p,project):true;}return true; }
export function boundPosition(o,room,snap=false) {
  const r=o.rotation*Math.PI/180, hw=(Math.abs(Math.cos(r))*o.w+Math.abs(Math.sin(r))*o.d)/2, hd=(Math.abs(Math.sin(r))*o.w+Math.abs(Math.cos(r))*o.d)/2;
  if(snap){o.x=round(Math.round(o.x/.05)*.05);o.z=round(Math.round(o.z/.05)*.05);}
  o.x=round(clamp(o.x,-Math.max(0,room.w/2-hw),Math.max(0,room.w/2-hw)));o.z=round(clamp(o.z,-Math.max(0,room.d/2-hd),Math.max(0,room.d/2-hd)));
  return hw*2>room.w||hd*2>room.d;
}
export function moveObject(project,id,patch) {
  const o=project.objects.find(x=>x.id===id); if(!o)return;
  const prev={...o}; Object.assign(o,patch); const angle=(o.rotation-prev.rotation)*Math.PI/180;
  const moveChildren=parentId=>{for(const ch of project.objects.filter(x=>x.parentId===parentId)){
    const dx=ch.x-prev.x,dz=ch.z-prev.z;
    ch.x=round(o.x+dx*Math.cos(angle)+dz*Math.sin(angle));ch.z=round(o.z-dx*Math.sin(angle)+dz*Math.cos(angle));
    ch.y=round(ch.y+o.y-prev.y+o.h-prev.h);ch.rotation=round(ch.rotation+o.rotation-prev.rotation);
    moveChildren(ch.id);
  }};moveChildren(id);
}
const color = (x,fallback) => typeof x==='string'&&/^#[0-9a-fA-F]{6}$/.test(x)?x:fallback;
const finite = (v,a,b,f) => Number.isFinite(Number(v))?clamp(Number(v),a,b):f;
export function validateProject(raw) {
  if(!raw||raw.schema!==SCHEMA||!raw.room||!Array.isArray(raw.objects)||raw.objects.length>150)throw new Error('Este arquivo não é um projeto válido do Meu Espaço.');
  const p=clone(DEFAULT_PROJECT),r=raw.room;
  p.title=String(raw.title||'Meu quarto').slice(0,100);p.estimated=raw.estimated!==false;
  p.revision=typeof raw.revision==='string'?raw.revision.slice(0,80):'legacy-v1';
  p.measurementNotes=Array.isArray(raw.measurementNotes)?raw.measurementNotes.slice(0,20).map(v=>String(v).slice(0,1000)):[];
  for(const k of ['w','d'])p.room[k]=finite(r[k],1.5,10,p.room[k]);p.room.h=finite(r.h,2,5,2.65);
  for(const k of ['wallColor','floorColor','woodColor'])p.room[k]=color(r[k],p.room[k]);p.room.tile=finite(r.tile,.15,1,.45);
  if(r.window){const v=r.window;p.room.window={w:finite(v.w,.3,p.room.w-.2,1.4),h:finite(v.h,.3,p.room.h-.5,1.1),sill:finite(v.sill,.2,p.room.h-.5,1),center:finite(v.center,-p.room.w/2+.3,p.room.w/2-.3,0)};}
  if(r.door){const v=r.door;p.room.door={w:finite(v.w,.5,Math.min(1.5,p.room.w-.2),.78),h:finite(v.h,1.8,p.room.h-.1,2.1),offset:finite(v.offset,0,p.room.w-.6,0),angle:finite(v.angle,0,100,83)};}
  // Strip retired entries before type validation; unrelated custom objects survive.
  const incoming=removeRetiredObjects({objects:clone(raw.objects)}).objects;
  const ids=new Set();p.objects=incoming.map((v,i)=>{
    if(!v||!CATALOG[v.type])throw new Error('O projeto contém um tipo de objeto desconhecido.');
    const id=String(v.id||'item-'+i).slice(0,80);if(ids.has(id))throw new Error('O projeto contém identificadores repetidos.');ids.add(id);
    const q={id,type:v.type,name:String(v.name||CATALOG[v.type].label).slice(0,100),x:finite(v.x,-20,20,0),z:finite(v.z,-20,20,0),y:finite(v.y,0,5,0),rotation:finite(v.rotation,-3600,3600,0),w:finite(v.w,.01,10,1),d:finite(v.d,.01,10,1),h:finite(v.h,.005,5,1),visible:v.visible!==false,locked:v.locked===true,color:color(v.color,CATALOG[v.type].color)};
    if(typeof v.parentId==='string')q.parentId=v.parentId.slice(0,80);
    if(typeof v.note==='string')q.note=v.note.slice(0,500);
    if(v.type==='l_shelf')q.shelfDepth=finite(v.shelfDepth,.03,Math.min(q.w,q.d),.25);
    return q;
  });
  removeRetiredObjects(p);
  for(const o of p.objects){const seen=new Set([o.id]);let q=o;while(q.parentId){if(seen.has(q.parentId))throw new Error('O projeto contém uma vinculação circular.');seen.add(q.parentId);q=p.objects.find(x=>x.id===q.parentId);if(!q){delete o.parentId;break;}}}
  normalizeRoom(p.room);return p;
}
export function normalizeRoom(r) {
  const v=r.window;v.w=clamp(v.w,.3,r.w-.16);v.sill=clamp(v.sill,.2,r.h-.4);v.h=clamp(v.h,.25,r.h-v.sill-.10);v.center=clamp(v.center,-r.w/2+v.w/2+.08,r.w/2-v.w/2-.08);
  const d=r.door;d.w=clamp(d.w,.5,r.w-.15);d.h=clamp(d.h,1.8,r.h-.1);d.offset=clamp(d.offset,0,r.w-d.w-.05);
}
