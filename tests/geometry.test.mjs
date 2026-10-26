import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_PROJECT,clone} from '../model.js';
import {getObjectFootprint,distanceToWalls} from '../geometry.js';

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
