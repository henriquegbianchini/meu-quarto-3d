import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraftRecoveryStore} from '../pending-draft-store.js';

function storage(){
 const m=new Map();
 return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};
}
test('rascunho temporário permite recuperar dados pendentes sem armazenar token',()=>{
 const fake=storage();
 const store=createDraftRecoveryStore(fake,'/meu-quarto-3d/');
 store.write('{"title":"Alterado"}','sha-1');
 assert.equal(store.read().body,'{"title":"Alterado"}');
 assert.equal(store.read().baseSha,'sha-1');
 assert.equal(JSON.stringify(store.read()).includes('ghp_'),false);
});
test('confirmação de versão antiga não apaga edição mais recente',()=>{
 const fake=storage(),store=createDraftRecoveryStore(fake,'/site');
 store.write('versao A','sha-1');
 store.write('versao B','sha-1');
 store.clearIfMatches('versao A');
 assert.equal(store.read().body,'versao B');
 store.clearIfMatches('versao B');
 assert.equal(store.read(),null);
});
test('armazenamento indisponível não quebra a edição em memória',()=>{
 const fail={getItem:()=>{throw Error('denied')},setItem:()=>{throw Error('denied')},removeItem:()=>{throw Error('denied')}};
 const store=createDraftRecoveryStore(fail,'/site');
 assert.doesNotThrow(()=>store.write('dados','sha'));
 assert.equal(store.read(),null);
});
