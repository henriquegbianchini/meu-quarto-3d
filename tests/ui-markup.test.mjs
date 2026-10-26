import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../'+name,import.meta.url),'utf8');

test('canvas fica entre a lista de objetos e o inspetor na estrutura desktop',async()=>{
 const html=await read('index.html');
 const left=html.indexOf('class="objects-sidebar"');
 const middle=html.indexOf('id="viewport"');
 const right=html.indexOf('class="sidebar inspector-sidebar"');
 assert.ok(left>=0&&middle>=0&&right>=0);
 assert.ok(middle<left&&left<right,'ordem semântica original viewport, objetos, inspetor');
 assert.equal((html.match(/id="inspector"/g)||[]).length,1);
 assert.equal((html.match(/id="object-list"/g)||[]).length,1);
 assert.equal((html.match(/id="save-status"/g)||[]).length,1);
});
test('status de sincronização permanece acessível em telas estreitas',async()=>{
 const css=await read('style.css');
 assert.ok(css.includes('Studio Precision v1'));
 assert.ok(css.includes('.project-title{display:flex'), 'o status não pode estar oculto por regra mobile');
 assert.ok(css.includes('.objects-sidebar'));
 assert.ok(css.includes('.inspector-sidebar'));
});
