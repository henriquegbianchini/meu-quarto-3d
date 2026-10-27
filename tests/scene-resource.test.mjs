import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {objectModel,releaseGroupResources} from '../scene.js';
import {DEFAULT_PROJECT} from '../model.js';

test('o renderizador não contém branches dos tipos aposentados',async()=>{
 const code=await readFile(new URL('../scene.js',import.meta.url),'utf8');
 for(const type of ['fan','led','backpack','dog']){
  assert.equal(code.includes("o.type==='"+type+"'"),false,'branch aposentado: '+type);
 }
});

test('descarte de um grupo libera geometria, material exclusivo e textura exclusiva uma única vez',()=>{
 const group=new THREE.Group();
 const texture=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1);
 const material=new THREE.MeshBasicMaterial({map:texture});
 const geometry=new THREE.BoxGeometry(.3,.3,.3);
 const calls={geometry:0,material:0,texture:0};
 geometry.dispose=()=>{calls.geometry++};
 material.dispose=()=>{calls.material++};
 texture.dispose=()=>{calls.texture++};
 group.add(new THREE.Mesh(geometry,material));
 group.add(new THREE.Mesh(geometry,material));
 const parent=new THREE.Group();parent.add(group);
 releaseGroupResources(group);
 assert.deepEqual(calls,{geometry:1,material:1,texture:1});
 assert.equal(group.parent,null);
});

test('material reutilizado pelo catálogo permanece válido ao trocar um móvel',()=>{
 const roomObject=DEFAULT_PROJECT.objects.find(o=>o.id==='bed');
 const g=objectModel(roomObject);
 const shared=g.children.find(ch=>ch.isMesh).material;
 let disposed=0;const original=shared.dispose;
 shared.dispose=function(){disposed++;return original.call(this)};
 try{
  releaseGroupResources(g);
  assert.equal(disposed,0,'um material de cache pode estar em outro objeto');
  const duplicate=objectModel({...roomObject,id:'other-bed'});
  assert.equal(duplicate.children.find(ch=>ch.isMesh).material,shared);
  releaseGroupResources(duplicate);
 }finally{shared.dispose=original;}
});
