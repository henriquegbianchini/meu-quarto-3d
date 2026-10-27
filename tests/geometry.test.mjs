import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_PROJECT,clone} from '../model.js';
import {getObjectFootprint,distanceToWalls,footprintGap,detectFloorCollisions} from '../geometry.js';

const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<.001,'esperado '+expected+', recebeu '+actual);
test('pegada 2D respeita medidas em metros e rotação de 90 graus',()=>{
 const o={x:0,z:0,w:.9,d:2,rotation:90};
 const corners=getObjectFootprint(o);
 assert.equal(corners.length,4);
 const xs=corners.map(p=>p.x),zs=corners.map(p=>p.z);
 near(Math.max(...xs)-Math.min(...xs),2);
 near(Math.max(...zs)-Math.min(...zs),.9);
});
test('distâncias físicas até as quatro paredes independem do zoom SVG',()=>{
 const p=clone(DEFAULT_PROJECT);
 const chair=p.objects.find(o=>o.id==='chair');
 const d=distanceToWalls(chair,p.room);
 near(d.left,.70);near(d.right,1.78);near(d.top,.66);near(d.bottom,1.62);
});
test('cama encostada na parede não gera distância negativa',()=>{
 const p=clone(DEFAULT_PROJECT);
 const bed=p.objects.find(o=>o.id==='bed');
 const d=distanceToWalls(bed,p.room);
 near(d.right,0);near(d.top,0);near(d.bottom,.90);
});


test('cota entre dois móveis é a menor distância entre as bordas, em metros',()=>{
 const a={id:'a',x:0,z:0,w:1,d:1,rotation:0,y:0,h:1};
 const b={id:'b',x:2,z:0,w:1,d:1,rotation:0,y:0,h:1};
 near(footprintGap(a,b),1);
 b.x=1;
 near(footprintGap(a,b),0);
 b.x=0;
 near(footprintGap(a,b),0);
});
test('sobreposição volumétrica rotacionada é detectada, contato sem penetração não',()=>{
 const a={id:'a',x:0,z:0,w:1,d:1,rotation:0,y:0,h:1};
 const b={id:'b',x:.25,z:.25,w:1,d:1,rotation:45,y:0,h:1};
 const project={objects:[a,b]};
 assert.deepEqual(detectFloorCollisions(project,'a').map(o=>o.id),['b']);
 b.y=1;
 assert.deepEqual(detectFloorCollisions(project,'a'),[],'Contato vertical sem penetração não é colisão');
 b.y=0;b.x=1.5;b.z=0;b.rotation=0;
 assert.deepEqual(detectFloorCollisions(project,'a'),[],'Contato horizontal não é colisão');
});
test('objetos apoiados não geram alerta falso contra o próprio suporte',()=>{
 const a={id:'mesa',x:0,z:0,w:1,d:1,rotation:0,y:0,h:.7};
 const b={id:'monitor',x:0,z:0,w:.2,d:.2,rotation:0,y:.7,h:.4,parentId:'mesa'};
 assert.deepEqual(detectFloorCollisions({objects:[a,b]},'mesa'),[]);
});
