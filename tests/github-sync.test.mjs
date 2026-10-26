import test from 'node:test';
import assert from 'node:assert/strict';
import {createGitHubStore} from '../github-sync.js';
import {clone,DEFAULT_PROJECT} from '../model.js';

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const oldFetch=globalThis.fetch;

test('o conflito remoto não pode ser ignorado por Salvar agora',async t=>{
 t.after(()=>{globalThis.fetch=oldFetch;});
 const events=[];
 let puts=0;
 const source=clone(DEFAULT_PROJECT);
 globalThis.fetch=async (url,init={})=>{
   const path=String(url);
   if(path.endsWith('/user'))return new Response(JSON.stringify({login:'henriquegbianchini'}),{status:200});
   if(init.method==='PUT'){puts++;return new Response(JSON.stringify({message:'sha mismatch'}),{status:409});}
   return new Response(JSON.stringify({sha:'remote-sha',content:Buffer.from(JSON.stringify(source),'utf8').toString('base64')}),{status:200});
 };
 const store=createGitHubStore((kind,message)=>events.push({kind,message}));
 await store.load();
 await store.connect('ghp_test_somente_mock',source);
 const next=clone(source);
 next.objects[0].name='Edição A';
 store.schedule(next,true);
 await sleep(45);
 assert.equal(puts,1);
 assert.equal(store.state().blocked,true);
 assert.equal(store.state().pending,true);
 store.saveNow(next);
 await sleep(45);
 assert.equal(puts,1,'Conflito permanece bloqueado mesmo após Salvar agora');
 assert.equal(store.state().blocked,true);
 assert.equal(store.state().pending,true);
 assert.ok(events.some(e=>e.kind==='error'));
});

test('resposta de sucesso sem SHA não afirma que foi salvo',async t=>{
 t.after(()=>{globalThis.fetch=oldFetch;});
 const source=clone(DEFAULT_PROJECT);
 const events=[];
 globalThis.fetch=async (url,init={})=>{
   if(String(url).endsWith('/user'))return new Response(JSON.stringify({login:'henriquegbianchini'}),{status:200});
   if(init.method==='PUT')return new Response(JSON.stringify({content:{}}),{status:200});
   return new Response(JSON.stringify({sha:'initial-sha',content:Buffer.from(JSON.stringify(source),'utf8').toString('base64')}),{status:200});
 };
 const store=createGitHubStore((kind)=>events.push(kind));
 await store.load();
 await store.connect('ghp_fake_test',source);
 const edited=clone(source);edited.title='Nova versão';
 store.schedule(edited,true);
 await sleep(40);
 assert.equal(store.state().pending,true,'Edição sem confirmação deve permanecer pendente');
 assert.notEqual(events.at(-1),'saved');
});

test('editores desconectados não fazem PUT e preservam alterações pendentes',async t=>{
 t.after(()=>{globalThis.fetch=oldFetch;});
 let puts=0;
 const source=clone(DEFAULT_PROJECT);
 globalThis.fetch=async (url,init={})=>{
  if(init.method==='PUT')puts++;
  return new Response(JSON.stringify({sha:'sha',content:Buffer.from(JSON.stringify(source),'utf8').toString('base64')}),{status:200});
 };
 const store=createGitHubStore(()=>{});
 await store.load();
 const edited=clone(source);edited.title='Edição local pendente';
 store.schedule(edited,true);
 await sleep(35);
 assert.equal(puts,0);
 assert.equal(store.state().connected,false);
 assert.equal(store.state().pending,true);
});
