import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CATALOG, DEFAULT_PROJECT, SCHEMA, clone, validateProject, removeRetiredObjects, boundPosition, moveObject} from '../model.js';

const retired=['led','fan','backpack','dog'];
test('o projeto padrão contém 22 objetos, IDs únicos e 9 vínculos válidos',()=>{
  assert.equal(DEFAULT_PROJECT.schema,SCHEMA);
  assert.equal(DEFAULT_PROJECT.objects.length,22);
  const ids=new Set(DEFAULT_PROJECT.objects.map(o=>o.id));
  assert.equal(ids.size,22);
  assert.equal(DEFAULT_PROJECT.objects.filter(o=>o.parentId).length,9);
  for(const o of DEFAULT_PROJECT.objects)if(o.parentId)assert.ok(ids.has(o.parentId),o.id);
  assert.deepEqual(DEFAULT_PROJECT.room.w,3.10);
  assert.deepEqual(DEFAULT_PROJECT.room.d,2.90);
  assert.deepEqual(DEFAULT_PROJECT.room.h,2.70);
});
test('medidas reais confirmadas são preservadas',()=>{
 const p=validateProject(clone(DEFAULT_PROJECT));
 assert.equal(p.estimated,false);
 assert.equal(p.room.window.w,2.05);
 assert.equal(p.room.window.h,1.30);
 assert.equal(p.room.window.sill,1);
 assert.equal(p.room.door.w,.90);
 assert.equal(p.room.door.h,2.10);
 const bed=p.objects.find(o=>o.id==='bed');
 assert.deepEqual([bed.d,bed.w,bed.h],[2,.9,.6]);
 const desk=p.objects.find(o=>o.id==='desk');
 assert.deepEqual([desk.d,desk.w,desk.h],[2.10,.62,.04]);
 assert.equal(p.objects.find(o=>o.id==='shelf-low').y+p.objects.find(o=>o.id==='shelf-low').h,1.68);
 assert.ok(Math.abs(p.objects.find(o=>o.id==='shelf-high').y+p.objects.find(o=>o.id==='shelf-high').h-2.05)<1e-9);
 assert.ok(p.measurementNotes.some(s=>s.includes('provisória')));
});
test('projeto-atual.json é idêntico ao projeto de referência versionado',async()=>{
 const [a,b]=await Promise.all(['projeto-atual.json','meu_quarto_medidas.json'].map(name=>readFile(new URL('../'+name,import.meta.url),'utf8').then(JSON.parse)));
 assert.deepEqual(a,b);
 assert.deepEqual(validateProject(a).objects,validateProject(b).objects);
});
test('nenhum ID nem tipo aposentado permanece disponível',()=>{
 for(const type of retired)assert.equal(Object.hasOwn(CATALOG,type),false,'type '+type+' não pode continuar no catálogo');
 for(const o of DEFAULT_PROJECT.objects){
   assert.equal(retired.includes(o.id),false);
   assert.equal(retired.includes(o.type),false);
 }
});
test('importação antiga remove tipos aposentados mesmo com IDs arbitrários',()=>{
 const legacy=clone(DEFAULT_PROJECT);
 for(const type of retired){
   legacy.objects.push({...legacy.objects[0],id:'importado-'+type,type,parentId:undefined});
 }
 const cleaned=validateProject(legacy);
 assert.equal(cleaned.objects.length,22);
 assert.equal(cleaned.objects.some(o=>retired.includes(o.id)||retired.includes(o.type)),false);
 assert.ok(cleaned.objects.find(o=>o.id==='bed'));
});
test('filhos de objetos aposentados não ficam com parentId inválido',()=>{
 const legacy=clone(DEFAULT_PROJECT);
 legacy.objects.push({...legacy.objects[0],id:'vintage-fan',type:'fan'});
 legacy.objects.push({...legacy.objects[0],id:'legitimate',type:'block',parentId:'vintage-fan'});
 const cleaned=validateProject(legacy);
 assert.ok(cleaned.objects.find(o=>o.id==='legitimate'));
 assert.equal(cleaned.objects.find(o=>o.id==='legitimate').parentId,undefined);
});
test('importação mantém objetos customizados legítimos, sem impor 22',()=>{
 const p=clone(DEFAULT_PROJECT);
 p.objects.push({...p.objects[0],id:'novo-movel',type:'block'});
 assert.equal(validateProject(p).objects.length,23);
});
test('IDs duplicados e ciclos são rejeitados',()=>{
 const duplicates=clone(DEFAULT_PROJECT);duplicates.objects[1].id=duplicates.objects[0].id;
 assert.throws(()=>validateProject(duplicates),/identificadores repetidos/i);
 const cycle=clone(DEFAULT_PROJECT);cycle.objects[0].parentId=cycle.objects[1].id;cycle.objects[1].parentId=cycle.objects[0].id;
 assert.throws(()=>validateProject(cycle),/circular/i);
});
test('snap não permite móvel sair do quarto',()=>{
 const p=clone(DEFAULT_PROJECT);const bed=p.objects.find(o=>o.id==='bed');
 bed.x=999;bed.z=-999;boundPosition(bed,p.room,true);
 assert.ok(Math.abs(bed.x)<=p.room.w/2);assert.ok(Math.abs(bed.z)<=p.room.d/2);
});
test('transladar bancada preserva deslocamento dos objetos apoiados',()=>{
 const p=clone(DEFAULT_PROJECT);
 const child=p.objects.find(o=>o.id==='pc');
 const before={x:child.x,z:child.z,y:child.y};
 const desk=p.objects.find(o=>o.id==='desk');
 moveObject(p,'desk',{x:desk.x+.1,z:desk.z+.1});
 assert.ok(Math.abs(child.x-(before.x+.1))<1e-9);
 assert.ok(Math.abs(child.z-(before.z+.1))<1e-9);
});
