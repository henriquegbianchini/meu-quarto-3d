import * as T from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {GLTFExporter} from './vendor/GLTFExporter.js';
import {SoftwareRenderer} from './software-renderer.js';
import {effectiveVisible} from './model.js';

const mats=new Map(),textures=new Map();
function mat(c,extra={}){const key=c+JSON.stringify(extra);if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color:c,roughness:.75,...extra}));return mats.get(key);}
function box(g,w,h,d,x,y,z,c,extra){const m=new T.Mesh(new T.BoxGeometry(Math.max(w,.001),Math.max(h,.001),Math.max(d,.001)),typeof c==='string'?mat(c,extra):c);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function cyl(g,rt,rb,h,x,y,z,c,n=20){const m=new T.Mesh(new T.CylinderGeometry(rt,rb,h,n),mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function orb(g,rx,ry,rz,x,y,z,c){const m=new T.Mesh(new T.SphereGeometry(1,18,12),mat(c));m.scale.set(rx,ry,rz);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function line(g,points,c,closed=false){const m=new T.Line(new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))),new T.LineBasicMaterial({color:c}));if(closed)m.geometry.setFromPoints([...points,points[0]].map(p=>new T.Vector3(...p)));g.add(m);return m;}
function tube(g,points,r,c){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const mesh=new T.Mesh(new T.TubeGeometry(curve,72,r,7,false),mat(c));g.add(mesh);return mesh;}
function texture(key,draw,w=512,h=512,cached=true){if(cached&&textures.has(key))return textures.get(key);const cv=document.createElement('canvas');cv.width=w;cv.height=h;draw(cv.getContext('2d'),w,h);const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;if(cached)textures.set(key,tx);return tx;}
function floorMaterial(r){const key='floor'+r.floorColor;const tx=texture(key,(c,w,h)=>{c.fillStyle=r.floorColor;c.fillRect(0,0,w,h);c.strokeStyle='#8e9489';c.lineWidth=2.7;for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(i*w,0);c.lineTo(i*w+w,h);c.stroke();c.beginPath();c.moveTo(i*w+w,0);c.lineTo(i*w,h);c.stroke();}},512,512,false);tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.repeat.set(r.w/(r.tile*1.414),r.d/(r.tile*1.414));return new T.MeshStandardMaterial({map:tx,roughness:.47,color:'#ffffff'});}
function screenTexture(vertical){return texture('monitor-'+vertical,(c,w,h)=>{c.fillStyle='#283841';c.fillRect(0,0,w,h);c.fillStyle=vertical?'#e3d4c9':'#191f24';c.fillRect(12,12,w-24,h-24);if(vertical){c.fillStyle='#536268';for(let y=35;y<h-20;y+=17)c.fillRect(30,y,w-65,3);}else{c.fillStyle='#e99a71';c.fillRect(20,25,w-40,54);const colors=['#d86663','#ecb36f','#b7af78','#728994'];for(let i=0;i<4;i++){c.fillStyle=colors[i];c.fillRect(22+i*117,28,111,49);}for(let y=110;y<220;y+=19){c.fillStyle='#778285';c.fillRect(24,y,100,3);c.fillRect(340,y,130,3);c.fillStyle='#dc8d76';c.fillRect(145,y,170,9);}}},512,256);}
function artworkTexture(){return texture('frames',(c,w,h)=>{c.fillStyle='#dddcd0';c.fillRect(0,0,w,h);c.strokeStyle='#5e655d';c.lineWidth=4;for(let y=30;y<h;y+=31){c.beginPath();c.moveTo(20,y);c.lineTo(w-20,y-12);c.stroke();}c.fillStyle='#c6c8bd';c.beginPath();c.ellipse(w*.5,h*.45,65,83,0,0,Math.PI*2);c.fill();c.fillStyle='#505a55';c.beginPath();c.ellipse(w*.5,h*.42,43,55,0,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(40,h);c.quadraticCurveTo(w*.5,h*.54,w-40,h);c.fill();},256,320);}

export function objectModel(o){
  const g=new T.Group(),{w,h,d,color:c}=o;g.name=o.name;g.userData={id:o.id,type:o.type};
  if(o.type==='bed'){
    const leg=h*.22,base=h*.40,mattress=h*.38;
    box(g,w*.96,base,d*.98,0,leg+base/2,0,'#dadbd1');box(g,w,mattress,d,0,h-mattress/2,0,c).name='Colchão';
    for(const x of [-1,1])for(const z of [-1,1])cyl(g,.025,.022,leg,x*w*.39,leg/2,z*d*.4,'#e9e9de');
    for(let i=0;i<8;i++){const z=-d/2+(i+.5)*d/8;box(g,w,.002,d/16,0,h+.001,z,'#c8ceca');for(const x of [-1,1])box(g,.003,mattress*.8,d/16,x*(w/2-.001),h-mattress*.4,z,'#c8ceca');}
    const p=box(g,w*.77,.075,d*.18,0,h+.035,-d*.32,'#f0efe5');p.rotation.z=.018;
  }else if(o.type==='tabletop'){
    box(g,w,h,d,0,h/2,0,c).name='Tampo';
  }else if(o.type==='cabinet'){
    const front=Math.min(.018,w*.12);box(g,w-front,h,d,-front/2,h/2,0,c).name='Corpo do gabinete';
    for(let i=0;i<3;i++){const y=(i+.5)*h/3;box(g,front*.8,h/3-.012,d-.012,w/2-front*.6,y,0,mat(c,{roughness:.42}));box(g,front*.35,.012,d*.65,w/2-front*.175,y+h*.10,0,'#171e1b');}
  }else if(o.type==='desk'){
    box(g,w,.045,d,0,h-.0225,0,c);box(g,w*.93,.025,d*.99,0,h-.06,0,'#282e2a');
    box(g,w*.96,h-.09,d*.25,0,(h-.09)/2,-d*.37,'#2b2e2b');
    for(let i=0;i<3;i++)box(g,.009,(h-.14)/3,d*.23,w*.487,.07+(i+.5)*(h-.14)/3,-d*.37,'#383d38');
    for(const x of [-1,1])box(g,.04,h-.08,.045,x*w*.39,(h-.08)/2,d*.43,'#29322d');
  }else if(['dresser','wardrobe','nightstand','block'].includes(o.type)){
    box(g,w,h,d,0,h/2,0,c);
    if(o.type==='dresser'){for(let i=0;i<3;i++)for(let j=0;j<2;j++){box(g,.012,h/3-.015,d/2-.013,w/2+.007,(i+.5)*h/3,(j-.5)*d/2,mat(c,{roughness:.42}));box(g,.018,.012,d*.30,w/2+.018,(i+1)*h/3-.045,(j-.5)*d/2,'#171e1b');}}
    if(o.type==='wardrobe'){line(g,[[0,0,d/2+.004],[0,h,d/2+.004]],'#928a79');for(const x of [-.05,.05])box(g,.014,.17,.025,x,h*.52,d/2+.016,'#7c8074');}
    if(o.type==='nightstand'){line(g,[[-w/2,h*.53,d/2+.004],[w/2,h*.53,d/2+.004]],'#8c8878');box(g,.13,.018,.025,0,h*.72,d/2+.015,'#7c8074');}
  }else if(o.type==='chair'){
    const f=new T.Group();g.add(f);f.scale.set(w/.62,h/1.06,d/.62);
    cyl(f,.035,.035,.4,0,.24,0,'#737e76');box(f,.46,.08,.43,0,.48,0,c);box(f,.45,.47,.065,0,.79,-.18,c);
    box(f,.36,.30,.012,0,.82,-.14,mat('#667067',{transparent:true,opacity:.62}));
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5,x=Math.sin(a)*.27,z=Math.cos(a)*.27;tube(f,[[0,.13,0],[x*.5,.09,z*.5],[x,.06,z]],.012,'#a4ada3');orb(f,.033,.04,.03,x,.04,z,'#333c35');}
    for(const x of [-.27,.27]){box(f,.025,.19,.025,x,.58,0,'#434f45');box(f,.05,.03,.28,x,.68,0,c);}
  }else if(o.type==='shelf'){
    box(g,w,h,d,0,h/2,0,c);for(const z of [-d*.37,d*.37]){box(g,.018,.17,.023,-w*.4,-.08,z,c);tube(g,[[-w*.4,-.15,z],[w*.28,0,z]],.009,c);}
  }else if(o.type==='l_shelf'){
    const depth=Math.min(o.shelfDepth||.25,w,d);
    box(g,depth,h,d,-w/2+depth/2,h/2,0,c).name='Braço maior';
    box(g,w-depth,h,depth,depth/2,h/2,-d/2+depth/2,c).name='Retorno do braço menor';
    for(const z of [-d*.26,d*.36]){box(g,.018,.17,.023,-w/2+.012,-.08,z,c);tube(g,[[-w/2+.012,-.15,z],[-w/2+depth*.82,0,z]],.009,c);}
    box(g,.022,.14,.018,w*.28,-.065,-d/2+.012,c);
  }else if(['monitor','portrait'].includes(o.type)){
    box(g,w,.017,d*.44,w*.12,.009,0,c);box(g,.026,h*.28,.035,-w*.05,h*.14,0,c);
    box(g,.036,h*.78,d,-w*.14,h*.60,0,c);box(g,.005,h*.73,d*.94,-w*.14+.021,h*.60,0,new T.MeshStandardMaterial({map:screenTexture(o.type==='portrait'),roughness:.6,emissive:'#ffffff',emissiveMap:screenTexture(o.type==='portrait'),emissiveIntensity:.14}));
  }else if(o.type==='pc'){
    box(g,w,h,d,0,h/2,0,c);box(g,.002,h*.88,d*.84,w/2+.002,h*.52,0,mat('#90a2a0',{transparent:true,opacity:.35,roughness:.12}));
    box(g,w*.8,h*.87,.005,0,h*.51,d/2+.004,'#171e20');
    const rings=['#e577bd','#a274e0','#6ac8bc','#d8da86'];
    for(let i=0;i<3;i++){const y=h*(.18+i*.30);for(let j=0;j<4;j++){const ring=new T.Mesh(new T.TorusGeometry(w*.26,w*.045,6,12,Math.PI/2),mat(rings[j],{emissive:rings[j],emissiveIntensity:.65}));ring.rotation.z=j*Math.PI/2;ring.position.set(.01,y,d/2+.01);g.add(ring);}cyl(g,w*.07,w*.07,.015,0,y,d/2+.01,'#2c3540').rotation.x=Math.PI/2;}
  }else if(o.type==='keyboard'){
    box(g,w,h*.4,d,0,h*.2,0,c);box(g,w*.36,h*.5,d*.56,-w*.08,h*.6,-d*.09,'#d8dbd2');for(let i=0;i<10;i++)box(g,w*.30,.001,.002,-w*.08,h*.88,-d*.31+i*d*.05,'#909c92');orb(g,w*.12,h*.6,d*.065,w*.05,h*.6,d*.33,'#66716c');
  }else if(o.type==='cans'){
    const n=12,colors=['#ad4147','#edb64a','#668564','#c3c6ad','#9b6078','#4a8a8a','#dc8f4a','#7a8ba9','#8d6a7b','#bdd2a9','#d0b9a8','#5e876a'];
    for(let row=0;row<2;row++)for(let i=0;i<n;i++){const z=-d/2+(i+.5)*d/n,y=(row+.5)*h/2,rad=Math.min(w*.40,d/n*.43);cyl(g,rad,rad,h*.45,0,y,z,colors[(i+row*3)%colors.length],12);cyl(g,rad*.95,rad*.95,.003,0,y+h*.225,z,'#c6cfbc',12);box(g,.001,h*.20,rad*.9,rad+.001,y,z,'#e9e6cc');}
  }else if(o.type==='books'){
    const colors=['#d1c295','#555f57','#d5d8c1','#658a83','#b58376','#e4d7bb','#889b68'];const n=Math.max(3,Math.round(d/.065));for(let i=0;i<n;i++){const ht=h*(.7+(i%3)*.13);box(g,w*(.85+i%2*.15),ht,d/n*.84,0,ht/2,-d/2+(i+.5)*d/n,colors[i%colors.length]);box(g,.002,ht*.6,d/n*.2,w/2+.002,ht*.55,-d/2+(i+.5)*d/n,'#e2e3ce');}
  }else if(o.type==='frames'){
    for(let i=0;i<2;i++)for(let j=0;j<2;j++){const y=(i+.5)*h/2,z=(j-.5)*d/2;box(g,w,h/2-.025,d/2-.035,0,y,z,c);box(g,.002,h/2-.055,d/2-.065,w/2+.002,y,z,new T.MeshStandardMaterial({map:artworkTexture(),roughness:.9}));}
  }else if(o.type==='frame'){
    box(g,w,h,d,0,h/2,0,c);box(g,.002,Math.max(.01,h-.025),Math.max(.01,d-.025),w/2+.001,h/2,0,new T.MeshStandardMaterial({map:artworkTexture(),roughness:.9}));
  }else if(o.type==='rug'){
    box(g,w,h,d,0,h/2,0,c);for(let i=0;i<6;i++)box(g,w*.94,.001,.008,0,h+.001,-d*.4+i*d*.16,'#ded8c4');
  }else if(o.type==='plant'){
    cyl(g,w*.27,w*.19,h*.30,0,h*.15,0,'#bca88d');for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*w*.30,z=Math.sin(a)*d*.30,ht=h*(.55+(i%3)*.16);tube(g,[[0,h*.25,0],[x*.6,ht*.7,z*.6],[x,ht,z]],.006,'#667e4e');const leaf=orb(g,w*.10,h*.14,d*.09,x,ht,z,c);leaf.rotation.z=Math.sin(a)*.5;}
  }
  g.position.set(o.x,o.y,o.z);g.rotation.y=o.rotation*Math.PI/180;return g;
}
// Materiais do catálogo e texturas de telas/quadros são compartilhados.
// Geometrias, materiais específicos (linhas/piso) e mapas exclusivos são descartados.
export function releaseGroupResources(group){
 const geometrySet=new Set(),materialSet=new Set(),textureSet=new Set();
 const sharedMaterials=new Set(mats.values()),sharedTextures=new Set(textures.values());
 group.traverse(node=>{
  if(node.geometry)geometrySet.add(node.geometry);
  if(node.material)for(const m of (Array.isArray(node.material)?node.material:[node.material])){
   if(m)materialSet.add(m);
  }
 });
 for(const material of materialSet){
  if(sharedMaterials.has(material))continue;
  for(const value of Object.values(material)){
   if(value?.isTexture&&!sharedTextures.has(value))textureSet.add(value);
  }
 }
 for(const geometry of geometrySet)geometry.dispose();
 for(const material of materialSet)if(!sharedMaterials.has(material))material.dispose();
 for(const map of textureSet)map.dispose();
 group.removeFromParent();
}

export class RoomScene{
  constructor(el,project,callbacks){
    this.el=el;this.project=project;this.callbacks=callbacks;this.view='3d';this.mode='explore';this.autoWalls=true;this.dirty=true;this.meshes=new Map();this.selected=null;
    this.scene=new T.Scene();this.scene.background=null;this.root=new T.Group();this.root.name='Meu quarto';this.scene.add(this.root);
    try{this.renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});}
    catch{this.isSoftware=true;this.renderer=new SoftwareRenderer();}
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.shadowMap.autoUpdate=false;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.35;el.append(this.renderer.domElement);
    this.scene.add(new T.HemisphereLight('#f5faf0','#a9b6a2',2.1));this.sun=new T.DirectionalLight('#fff6df',3.1);this.sun.position.set(2,6,2);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);this.sun.shadow.camera.left=-6;this.sun.shadow.camera.right=6;this.sun.shadow.camera.top=6;this.sun.shadow.camera.bottom=-6;this.sun.shadow.normalBias=.03;this.sun.shadow.bias=-.00015;this.scene.add(this.sun);
    const fill=new T.DirectionalLight('#c6daef',.8);fill.position.set(-2,3,-3);this.scene.add(fill);
    this.perspective=new T.PerspectiveCamera(36,1,.02,60);this.ortho=new T.OrthographicCamera(-3,3,3,-3,.01,50);this.camera=this.perspective;this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;this.controls.dampingFactor=.09;this.controls.minDistance=.35;this.controls.maxDistance=16;this.controls.maxPolarAngle=Math.PI*.49;this.controls.addEventListener('change',()=>{this.dirty=true;});
    this.ray=new T.Raycaster();this.pointer=new T.Vector2();this.floorPlane=new T.Plane(new T.Vector3(0,1,0),0);this.hitPoint=new T.Vector3();this.startPointer=null;
    el.addEventListener('pointerdown',e=>this.pointerDown(e),true);el.addEventListener('pointermove',e=>this.pointerMove(e),true);el.addEventListener('pointerup',e=>this.pointerUp(e),true);el.addEventListener('pointercancel',()=>this.cancelDrag(),true);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(el);this.sync(project);this.setView('3d');this.resize();
    this.renderer.setAnimationLoop(()=>{this.controls.update();this.updateWalls();if(this.dirty){this.renderer.render(this.scene,this.camera);this.dirty=false;}});
  }
  resize(){const w=this.el.clientWidth,h=this.el.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.perspective.aspect=w/h;this.perspective.updateProjectionMatrix();const r=this.project.room,extent=Math.max(r.w,r.d)*.70,aspect=w/h;this.ortho.left=-extent*aspect;this.ortho.right=extent*aspect;this.ortho.top=extent;this.ortho.bottom=-extent;this.ortho.updateProjectionMatrix();this.dirty=true;}
  buildRoom(){
    if(this.shell)releaseGroupResources(this.shell);this.shell=new T.Group();this.shell.name='Paredes, piso e aberturas';this.root.add(this.shell);const r=this.project.room,{w,d,h}=r,t=.10;
    box(this.shell,w+.13,.10,d+.13,0,-.065,0,'#d5dbcb');const floor=box(this.shell,w,.024,d,0,-.012,0,this.isSoftware?r.floorColor:floorMaterial(r));floor.name='Piso cerâmico diagonal';
    if(this.isSoftware){for(const slope of [-1,1])for(let c=-w-d;c<w+d;c+=r.tile*1.414){const pts=[];for(const x of [-w/2,w/2]){const z=slope*x+c;if(z>=-d/2&&z<=d/2)pts.push([x,.002,z]);}for(const z of [-d/2,d/2]){const x=(z-c)/slope;if(x>-w/2&&x<w/2)pts.push([x,.002,z]);}if(pts.length===2)line(this.shell,pts,'#a0a596');}}
    this.walls={};for(const k of ['north','south','east','west']){const group=new T.Group();group.name='Parede '+k;this.walls[k]=group;this.shell.add(group);}
    const wall=(g,ww,hh,dd,x,y,z)=>box(g,ww,hh,dd,x,y,z,r.wallColor);
    wall(this.walls.west,t,h,d,-w/2-t/2,h/2,0);wall(this.walls.east,t,h,d,w/2+t/2,h/2,0);
    const win=r.window,wl=win.center-win.w/2,wr=win.center+win.w/2;
    wall(this.walls.north,wl+w/2,h,t,(-w/2+wl)/2,h/2,-d/2-t/2);wall(this.walls.north,w/2-wr,h,t,(w/2+wr)/2,h/2,-d/2-t/2);wall(this.walls.north,win.w,win.sill,t,win.center,win.sill/2,-d/2-t/2);wall(this.walls.north,win.w,h-win.sill-win.h,t,win.center,(h+win.sill+win.h)/2,-d/2-t/2);
    const door=r.door,dr=w/2-door.offset,dl=dr-door.w;
    wall(this.walls.south,dl+w/2,h,t,(-w/2+dl)/2,h/2,d/2+t/2);wall(this.walls.south,w/2-dr,h,t,(w/2+dr)/2,h/2,d/2+t/2);wall(this.walls.south,door.w,h-door.h,t,(dl+dr)/2,(h+door.h)/2,d/2+t/2);
    const trims=[['north',w,win.center,0,-d/2],['south',w,0,0,d/2],['east',d,w/2,0,0],['west',d,-w/2,0,0]];
    for(const [name,len] of trims){const gp=this.walls[name],side=name==='east'||name==='west';for(const y of [h-.025,h-.07])box(gp,side?.045:len,.025,side?len:.045,side?(name==='east'?w/2:-w/2):0,y,side?0:(name==='north'?-d/2:d/2),'#e7e9df');if(name==='east'||name==='west')box(gp,.025,.07,d,side?(name==='east'?w/2-.013:-w/2+.013):0,.035,0,'#e4e2d0');}
    const wg=this.walls.north,wood=r.woodColor,z=-d/2+.004,cy=win.sill+win.h/2,border=.035,innerW=win.w-border*2,innerH=win.h-border*2,panelW=innerW/4;
    for(const x of [wl+border/2,wr-border/2])box(wg,border,win.h,.09,x,cy,z,wood);
    for(const y of [win.sill+border/2,win.sill+win.h-border/2])box(wg,win.w,border,.09,win.center,y,z,wood);
    box(wg,win.w,.02,.16,win.center,win.sill+.01,z,'#8e7051');
    for(let i=1;i<4;i++)box(wg,.028,innerH,.075,wl+border+i*panelW,cy,z,wood);
    for(let i=0;i<4;i++){const x=wl+border+(i+.5)*panelW;if(i===1||i===2){box(wg,panelW-.028,innerH,.028,x,cy,z-.015,'#49392e');for(let j=0;j<23;j++)box(wg,panelW-.034,innerH/23*.67,.025,x,win.sill+border+(j+.5)*innerH/23,z+.012,j%2?'#674a34':wood);}else{box(wg,panelW-.028,innerH,.008,x,cy,z-.024,mat('#8e9e91',{transparent:true,opacity:.67,roughness:.12}));for(let j=1;j<4;j++)box(wg,panelW-.028,.02,.04,x,win.sill+border+j*innerH/4,z+.017,wood);}}
    for(const x of [win.center-.025,win.center+.025])box(wg,.012,.06,.015,x,win.sill+win.h*.4,z+.048,'#a9a38a');
    const dg=this.walls.south;for(const x of [dl,dr])box(dg,.06,door.h,.11,x,door.h/2,d/2,wood);box(dg,door.w+.08,.065,.11,(dl+dr)/2,door.h,d/2,wood);box(dg,door.w,.016,.18,(dl+dr)/2,.008,d/2,'#b6b6a3');
    const leaf=new T.Group();leaf.name='Porta de madeira';leaf.position.set(dr,0,d/2-.012);leaf.rotation.y=-door.angle*Math.PI/180;dg.add(leaf);box(leaf,door.w,door.h,.035,-door.w/2,door.h/2,0,wood);
    for(let i=0;i<3;i++)box(leaf,door.w*.81,door.h*.25,.012,-door.w/2,door.h*(.17+i*.31),-.025,mat(wood,{roughness:.48}));box(leaf,door.w*.77,.085,.014,-door.w/2,door.h*.51,-.035,'#b0b5a5');box(leaf,.025,.12,.018,-door.w*.88,door.h*.46,-.05,'#aab7ad');box(leaf,.11,.018,.025,-door.w*.84,door.h*.48,-.07,'#b9c5ba');
    this.renderer.shadowMap.needsUpdate=true;this.dirty=true;
  }
  sync(p){this.project=p;const roomKey=JSON.stringify(p.room);if(roomKey!==this.roomKey){this.roomKey=roomKey;this.buildRoom();this.resize();}
    const ids=new Set(p.objects.map(o=>o.id));for(const [id,entry]of this.meshes){if(!ids.has(id)){releaseGroupResources(entry.group);this.meshes.delete(id);}}
    for(const o of p.objects){const key=JSON.stringify([o.type,o.w,o.h,o.d,o.color,o.shelfDepth]);let entry=this.meshes.get(o.id);if(!entry||entry.key!==key){if(entry)releaseGroupResources(entry.group);const group=objectModel(o);this.root.add(group);entry={key,group};this.meshes.set(o.id,entry);}entry.group.position.set(o.x,o.y,o.z);entry.group.rotation.y=o.rotation*Math.PI/180;entry.group.name=o.name;entry.group.visible=effectiveVisible(o,p);}
    this.setSelection(this.selected);this.renderer.shadowMap.needsUpdate=true;this.dirty=true;
  }
  setSelection(id){this.selected=id;if(this.selection){this.scene.remove(this.selection);this.selection.geometry.dispose();this.selection.material.dispose();this.selection=null;}const g=this.meshes.get(id)?.group;if(g&&g.visible){this.selection=new T.BoxHelper(g,'#6d9775');this.selection.material.depthTest=false;this.selection.material.transparent=true;this.selection.material.opacity=.7;this.selection.renderOrder=3;this.scene.add(this.selection);}this.dirty=true;}
  setMode(mode){this.mode=mode;this.el.style.cursor=mode==='move'?'grab':'default';}
  setView(view){this.view=view;this.camera=view==='top'?this.ortho:this.perspective;this.controls.object=this.camera;const r=this.project.room,scale=Math.max(r.w,r.d)/3.15;
    if(view==='top'){this.ortho.position.set(0,8,0.001);this.ortho.up.set(0,0,-1);this.controls.target.set(0,0,0);this.ortho.zoom=1;this.controls.enableRotate=false;this.controls.minZoom=.4;this.controls.maxZoom=4;}
    else if(view==='inside'){this.perspective.up.set(0,1,0);this.perspective.position.set(r.w*.15,1.55,r.d*.44);this.controls.target.set(0,1.10,-r.d*.30);this.perspective.fov=70;this.controls.enableRotate=true;this.controls.maxPolarAngle=Math.PI*.90;}
    else{this.perspective.up.set(0,1,0);const aspect=this.el.clientWidth/this.el.clientHeight;const extra=aspect<1.15?1.8:1.38;this.perspective.position.set(4.5*scale*extra,4.1*scale*extra,5.4*scale*extra);this.controls.target.set(0,1.02,0);this.perspective.fov=36;this.controls.enableRotate=true;this.controls.maxPolarAngle=Math.PI*.49;}
    this.camera.updateProjectionMatrix();this.controls.update();this.dirty=true;this.resize();
  }
  updateWalls(){if(!this.walls)return;const top=this.view==='top',cut=this.autoWalls&&this.view==='3d',r=this.project.room;const wanted={north:!top&&!(cut&&this.camera.position.z<-r.d/2),south:!top&&!(cut&&this.camera.position.z>r.d/2),east:!top&&!(cut&&this.camera.position.x>r.w/2),west:!top&&!(cut&&this.camera.position.x<-r.w/2)};for(const k of Object.keys(wanted))if(this.walls[k].visible!==wanted[k]){this.walls[k].visible=wanted[k];this.dirty=true;this.renderer.shadowMap.needsUpdate=true;}}
  rayAt(e){const rect=this.el.getBoundingClientRect();this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);}
  pick(e){this.rayAt(e);const visible=[...this.meshes.values()].filter(x=>x.group.visible).map(x=>x.group);const hits=this.ray.intersectObjects(visible,true);for(const hit of hits){let q=hit.object;while(q&&!q.userData.id)q=q.parent;if(q?.userData.id)return q.userData.id;}return null;}
  pointerDown(e){if(e.button!==0)return;const id=this.pick(e);this.startPointer={x:e.clientX,y:e.clientY,id};
    if(this.mode==='move'&&id){const o=this.project.objects.find(q=>q.id===id);if(o?.locked){this.callbacks.locked();return;}this.callbacks.select(id);this.controls.enabled=false;this.floorPlane.constant=-o.y;this.ray.ray.intersectPlane(this.floorPlane,this.hitPoint);this.drag={id,offsetX:o.x-this.hitPoint.x,offsetZ:o.z-this.hitPoint.z,startX:o.x,startZ:o.z,moved:false};this.callbacks.startMove();this.el.setPointerCapture(e.pointerId);this.el.style.cursor='grabbing';e.stopImmediatePropagation();e.preventDefault();}
  }
  pointerMove(e){if(!this.drag)return;this.rayAt(e);if(!this.ray.ray.intersectPlane(this.floorPlane,this.hitPoint))return;this.drag.moved=true;this.callbacks.move(this.drag.id,this.hitPoint.x+this.drag.offsetX,this.hitPoint.z+this.drag.offsetZ);e.stopImmediatePropagation();e.preventDefault();}
  pointerUp(e){if(this.drag){const moved=this.drag.moved;this.drag=null;this.controls.enabled=true;this.el.style.cursor='grab';this.callbacks.endMove(moved);this.startPointer=null;e.stopImmediatePropagation();e.preventDefault();return;}
    if(this.startPointer&&Math.hypot(e.clientX-this.startPointer.x,e.clientY-this.startPointer.y)<7){this.callbacks.select(this.startPointer.id);}this.startPointer=null;
  }
  cancelDrag(){if(this.drag){this.drag=null;this.controls.enabled=true;this.callbacks.endMove(true);}this.startPointer=null;}
  async exportGLB(){
    const clone=this.root.clone(true);clone.name='Meu quarto — objetos separados';clone.children[0].children.forEach(g=>g.visible=true);clone.updateMatrixWorld(true);
    return await new GLTFExporter().parseAsync(clone,{binary:true,onlyVisible:true,maxTextureSize:1024});
  }
  async screenshot(){this.renderer.render(this.scene,this.camera);return this.renderer.domElement.toDataURL('image/png');}
}
