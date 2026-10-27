// Cache temporário de emergência: somente projeto pendente, NUNCA credenciais.
// O JSON versionado no GitHub permanece a fonte de verdade.
export function createDraftRecoveryStore(storage=globalThis.localStorage,pathname=globalThis.location?.pathname||'/'){
 const key='meu-quarto-3d:pending:v1:'+encodeURIComponent(pathname);
 function read(){
  try{
   if(!storage)return null;
   const value=JSON.parse(storage.getItem(key)||'null');
   if(!value||value.version!==1||typeof value.body!=='string'||typeof value.baseSha!=='string')return null;
   return value;
  }catch{return null;}
 }
 function write(body,baseSha){
  try{
   if(!storage||typeof body!=='string'||body.length>2_000_000)return false;
   storage.setItem(key,JSON.stringify({version:1,body,baseSha:baseSha||'',savedAt:new Date().toISOString()}));
   return true;
  }catch{return false;}
 }
 function clearIfMatches(body){
  try{if(read()?.body===body)storage.removeItem(key);}catch{}
 }
 function discard(){try{storage?.removeItem(key);}catch{}}
 return {read,write,clearIfMatches,discard};
}
