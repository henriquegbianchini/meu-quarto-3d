import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Script} from 'node:vm';
const file=new URL('../meu_quarto_3d.html',import.meta.url);
const sourceProject=new URL('../projeto-atual.json',import.meta.url);

test('HTML offline contém snapshot íntegro do projeto em vez de null',async()=>{
 const html=await readFile(file,'utf8');
 const source=JSON.parse(await readFile(sourceProject,'utf8'));
 const match=html.match(/<script id="embedded-project" type="application\/json">([\s\S]*?)<\/script>/);
 assert.ok(match,'snapshot embutido deve existir');
 const snap=JSON.parse(match[1]);
 assert.deepEqual(snap,source);
 assert.equal(snap.objects.length,22);
});
test('HTML offline encapsula JS assíncrono em script clássico válido',async()=>{
 const html=await readFile(file,'utf8');
 assert.ok(!html.includes('<script type="module" src="app.js"></script>'));
 assert.ok(html.includes('window.__ROOM_PHOTOS__='));
 const all=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
 assert.ok(all.length>=2,'scripts embutidos devem existir');
 const script=all.at(-1)[1];
 assert.ok(script.includes('(async()=>{')||script.includes('(async () => {'),'JavaScript com await deve estar encapsulado');
 assert.doesNotThrow(()=>new Script(script), 'o HTML não pode conter top-level await em script clássico');
});
