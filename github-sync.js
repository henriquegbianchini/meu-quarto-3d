// GitHub Contents API: a origem persistente e o arquivo versionado do projeto.
// Credencial temporária somente em memória da aba; jamais usar localStorage/cookies.
const OWNER='henriquegbianchini';
const REPO='meu-quarto-3d';
const FILE='projeto-atual.json';
const API='https://api.github.com/repos/'+OWNER+'/'+REPO+'/contents/'+FILE;
const HEADERS={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
const utf8Encode=str=>{
  const data=new TextEncoder().encode(str);let out='';
  for(let i=0;i<data.length;i+=16384)out+=String.fromCharCode(...data.slice(i,i+16384));
  return btoa(out);
};
const utf8Decode=encoded=>{
  const raw=atob(encoded.replace(/\s/g,''));const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
  return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
};
const jsonClean=p=>JSON.stringify(p,null,2)+'\n';
export function createGitHubStore(onStatus){
 let token=null,sha=null,loadedJSON=null,queuedJSON=null,timer=null,busy=false,blocked=false,loadReady=false,failures=0;
 const status=(kind,message)=>onStatus?.(kind,message);
 async function getRemote(authToken){
   const headers={...HEADERS};
   if(authToken)headers.Authorization='Bearer '+authToken;
   const res=await fetch(API+'?t='+Date.now(),{headers,cache:'no-store'});
   if(!res.ok)throw new Error(res.status===404?'O arquivo do projeto não existe no GitHub.':'Não foi possível ler o projeto no GitHub (HTTP '+res.status+').');
   const data=await res.json();
   if(!data.content||!data.sha)throw new Error('Resposta incompleta do GitHub.');
   const parsed=JSON.parse(utf8Decode(data.content));
   return {data:parsed,sha:data.sha};
 }
 async function load(){
   status('loading','Carregando projeto do GitHub…');
   try{
     const remote=await getRemote();
     sha=remote.sha;loadedJSON=jsonClean(remote.data);loadReady=true;
     status('idle','Projeto carregado do GitHub · conecte para salvar');
     return remote.data;
   }catch(error){
     loadReady=false;blocked=true;
     status('error','Falha ao carregar do GitHub · não salve por cima');
     throw error;
   }
 }
 function schedule(p,immediate=false){
   const next=jsonClean(p);
   if(next===loadedJSON&&!busy){queuedJSON=null;clearTimeout(timer);status(token?'saved':'idle',token?'Tudo salvo no GitHub':'Projeto carregado do GitHub · conecte para salvar');return;}
   queuedJSON=next;failures=0;
   if(!token){status('pending','Alterações sem salvar · conecte o GitHub');return;}
   if(blocked){status('error','Conflito de versões · exporte seu JSON');return;}
   status('pending','Alterações pendentes de envio…');
   clearTimeout(timer);timer=setTimeout(flush,immediate?0:1250);
 }
 async function flush(){
   if(busy||!token||!queuedJSON||blocked||!loadReady)return;
   busy=true;const content=queuedJSON;queuedJSON=null;
   status('saving','Salvando automaticamente no GitHub…');
   try{
     const res=await fetch(API,{method:'PUT',headers:{...HEADERS,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({
       message:'chore(room): autosave project measurements and furniture',
       content:utf8Encode(content),sha,branch:'main'
     })});
     if(!res.ok){
       const body=await res.json().catch(()=>({}));
       if(res.status===409||res.status===422){blocked=true;throw new Error('Conflito com outra versão no GitHub. Exporte o JSON e atualize a página antes de continuar.');}
       if(res.status===401||res.status===403){token=null;throw new Error('Acesso ao GitHub negado. Verifique se o token tem permissão Contents: Read and write.');}
       throw new Error('Falha ao salvar no GitHub (HTTP '+res.status+'). '+String(body.message||''));
     }
     const data=await res.json();
     if(!data.content?.sha)throw new Error('O GitHub não confirmou a nova versão.');
     sha=data.content.sha;loadedJSON=content;failures=0;
     if(queuedJSON===loadedJSON)queuedJSON=null;
     status(queuedJSON?'pending':'saved',queuedJSON?'Há alterações mais recentes a enviar':'Salvo no GitHub · '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}));
   }catch(error){
     if(!queuedJSON)queuedJSON=content;
     failures++;
     status('error',error.message||'Não foi possível salvar automaticamente.');
   }finally{
     busy=false;
     if(queuedJSON&&token&&!blocked&&failures<3){clearTimeout(timer);timer=setTimeout(flush,2200*failures);}
   }
 }
 async function connect(secret,project){
   if(!loadReady)throw new Error('Carregue a versão do GitHub primeiro para impedir perda de dados.');
   if(!secret||!/^github_pat_|^ghp_/.test(secret.trim()))throw new Error('Informe um token pessoal GitHub válido.');
   const candidate=secret.trim();
   const user=await fetch('https://api.github.com/user',{headers:{...HEADERS,Authorization:'Bearer '+candidate},cache:'no-store'});
   if(!user.ok)throw new Error('Não foi possível autenticar o token no GitHub (HTTP '+user.status+').');
   const who=await user.json();
   if(who.login?.toLowerCase()!==OWNER.toLowerCase())throw new Error('Este token pertence a outra conta. Conecte a conta '+OWNER+'.');
   const latest=await getRemote(candidate);
   if(latest.sha!==sha){blocked=true;throw new Error('O projeto foi alterado no GitHub desde que esta aba abriu. Exporte o JSON e atualize a página.');}
   token=candidate;blocked=false;
   if(jsonClean(project)!==loadedJSON){
     schedule(project,true);
   }else status('saved','Conectado ao GitHub · salvamento automático ativo');
   return who.login;
 }
 function state(){return {connected:!!token,pending:!!queuedJSON,busy,blocked,loadReady};}
 function disconnect(){token=null;clearTimeout(timer);status(queuedJSON?'pending':'idle',queuedJSON?'Desconectado · alterações aguardam conexão':'Desconectado · alterações futuras não serão salvas');}
 function saveNow(project){
   if(blocked){status('error','Conflito de versões · exporte seu JSON antes de tentar novamente');return false;}
   failures=0;schedule(project,true);
   clearTimeout(timer);
   if(token&&!busy)void flush();
   return true;
 }
 return {load,connect,schedule,state,disconnect,saveNow};
}
