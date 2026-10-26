import {DEFAULT_PROJECT,CATALOG,SCHEMA,PROJECT_REVISION,clone,clamp,round,effectiveVisible,boundPosition,moveObject,validateProject,normalizeRoom} from './model.js';
import {RoomScene} from './scene.js';
import {renderFloorplan,attachFloorplanHandlers} from './floorplan.js';
import {createGitHubStore} from './github-sync.js';

const $=id=>document.getElementById(id);
const icon=name=>'<svg aria-hidden="true"><use href="#i-'+name+'"/></svg>';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=0)=>n.toLocaleString('pt-BR',{maximumFractionDigits:d});
let rawEmbedded=null;try{rawEmbedded=JSON.parse($('embedded-project').textContent);}catch{}
const cloud=createGitHubStore((kind,message)=>{const el=$('save-status');el.textContent=message;el.dataset.state=kind;const label=$('github-connect')?.querySelector('span');if(label)label.textContent=cloud.state().connected?'GitHub conectado':'Conectar GitHub';});
let project=clone(DEFAULT_PROJECT),selectedId=null,scene=null,history=[],future=[],moveStart=null,floorplanStart=null,currentView='3d',mode='explore',snap=true,toastTimer=null;
let previousProject=null;
let oldDraft=null;
try{
  // Leitura única de rascunhos antigos, para migração opcional. Nunca gravamos no localStorage.
  oldDraft=localStorage.getItem('meu-espaco-quarto-v1:'+location.pathname+':original');
}catch{}
if(rawEmbedded){
  try{project=validateProject(rawEmbedded);}catch(error){console.warn('Snapshot inválido:',error);}
  $('save-status').textContent='Cópia offline · exporte seu projeto';
}else{
  try{project=validateProject(await cloud.load());}
  catch(error){console.error('GitHub load failed:',error);toast('Não foi possível carregar a versão do GitHub. As alterações não serão gravadas nesta sessão.');}
}
const initialReferences=['Vista da cama e da janela','Entrada do quarto','Bancada e prateleiras','Parede da entrada','Vista geral','Cama vista da entrada'];
const references=window.__ROOM_PHOTOS__||initialReferences.map((caption,i)=>({src:'references/quarto-'+(i+1)+'.jpg',caption}));

function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3200);}
function persist(){if(rawEmbedded){$('save-status').textContent='Cópia offline · exporte o JSON';return;}cloud.schedule(project);}
function remember(before){history.push(before);if(history.length>40)history.shift();future=[];}
function commit(action,message){const before=clone(project);action();if(JSON.stringify(before)!==JSON.stringify(project)){remember(before);persist();render();if(message)toast(message);}}
function undo(){if(!history.length)return;future.push(clone(project));project=history.pop();if(!project.objects.some(o=>o.id===selectedId))selectedId=null;persist();render();toast('Alteração desfeita.');}
function redo(){if(!future.length)return;history.push(clone(project));project=future.pop();persist();render();toast('Alteração refeita.');}
function findSelected(){return project.objects.find(o=>o.id===selectedId);}
function select(id){selectedId=id&&project.objects.some(o=>o.id===id)?id:null;renderList();renderInspector();scene?.setSelection(selectedId);if(currentView==='top')renderFloorplan($('plan-canvas'),project,selectedId);}
function switchTab(room){$('objects-panel').hidden=false;$('inspector').hidden=room;$('room-panel').hidden=!room;$('tab-objects').classList.toggle('active',!room);$('tab-room').classList.toggle('active',room);$('tab-objects').setAttribute('aria-selected',String(!room));$('tab-room').setAttribute('aria-selected',String(room));}
function render(){renderList();renderInspector();renderRoom();scene?.sync(project);if(currentView==='top')renderFloorplan($('plan-canvas'),project,selectedId);$('undo').disabled=!history.length;$('redo').disabled=!future.length;$('area-text').textContent=fmt(project.room.w*project.room.d,2)+' m²';$('measure-label').textContent=project.estimated?'medidas estimadas':'dimensões informadas';}
const sideFacing=new Set(['cabinet','tabletop','shelf','monitor','portrait','frames','frame']);
function dimensionsText(o){if(o.type==='l_shelf')return fmt(o.d*100)+' + '+fmt(o.w*100)+' cm · em L';if(o.type==='frame')return fmt(o.d*100)+' × '+fmt(o.h*100,1)+' cm · quadro';return fmt((sideFacing.has(o.type)?o.d:o.w)*100)+' × '+fmt((sideFacing.has(o.type)?o.w:o.d)*100)+' cm';}
function renderList(){
  $('object-count').textContent=project.objects.length;const q=$('search').value.toLocaleLowerCase('pt-BR');const objects=project.objects.filter(o=>o.name.toLocaleLowerCase('pt-BR').includes(q));
  $('object-list').innerHTML=objects.length?objects.map(o=>'<div class="object-row'+(selectedId===o.id?' selected':'')+(!effectiveVisible(o,project)?' hidden-object':'')+'"><button class="object-select" data-select="'+esc(o.id)+'"><span class="object-icon">'+icon(CATALOG[o.type].icon)+'</span><span class="object-info"><strong>'+esc(o.name)+'</strong><small>'+dimensionsText(o)+' · '+(o.locked?'fixado':esc(CATALOG[o.type].category.toLowerCase()))+'</small></span></button><button class="visibility-button" data-visibility="'+esc(o.id)+'" aria-label="'+(effectiveVisible(o,project)?'Ocultar ':'Mostrar ')+esc(o.name)+'" title="Mostrar ou ocultar">'+icon('eye')+'</button></div>').join(''):'<p class="empty-search">Nenhum objeto com esse nome.</p>';
}
function field(label,key,value,min,max,step=.1){return '<label>'+label+'<input data-field="'+key+'" type="number" value="'+value+'" min="'+min+'" max="'+max+'" step="'+step+'"></label>';}
function renderInspector(){
  const o=findSelected();if(!o){$('inspector').innerHTML='<div class="inspector-empty">'+icon('move')+'<br>Selecione um móvel na planta, no 3D ou na lista para ajustar sua posição, medidas e cor.</div>';return;}
  const parent=project.objects.find(p=>p.id===o.parentId),childCount=project.objects.filter(p=>p.parentId===o.id).length;
  const board=['tabletop','shelf','l_shelf'].includes(o.type);
  let sizeFields;
  if(o.type==='l_shelf')sizeFields=field('Braço maior','d',round(o.d*100),3,1000)+field('Braço menor','w',round(o.w*100),3,1000)+field('Espessura','h',round(o.h*100),.5,500,.1);
  else if(sideFacing.has(o.type))sizeFields=field(o.type==='tabletop'||o.type==='shelf'?'Comprimento':'Largura','d',round(o.d*100),1,1000)+field(o.type==='frame'?'Espessura':'Profund.','w',round(o.w*100),1,1000)+field(board?'Espessura':'Altura','h',round(o.h*100),.5,500,.1);
  else sizeFields=field('Largura','w',round(o.w*100),1,1000)+field('Profund.','d',round(o.d*100),1,1000)+field('Altura','h',round(o.h*100),.5,500,.1);
  $('inspector').innerHTML='<div class="inspector-top"><h3>Editar objeto</h3><span class="edit-tag">'+esc(CATALOG[o.type].category)+'</span></div><label class="full-label">Nome<input data-field="name" value="'+esc(o.name)+'" maxlength="100"></label>'+
    '<h3>Tamanho <small>centímetros</small></h3><div class="form-grid three">'+sizeFields+'</div>'+
    (o.type==='l_shelf'?'<div class="form-grid">'+field('Profundidade dos braços','shelfDepth',round((o.shelfDepth||.25)*100),3,Math.min(o.w,o.d)*100)+'</div>':'')+
    '<h3>Posição <small>centímetros desde o centro</small></h3><div class="form-grid three">'+field('Esq. / dir.','x',round(o.x*100),-1000,1000)+field('Fundo / frente','z',round(o.z*100),-1000,1000)+field(board?'Topo do chão':'Base do chão',board?'top':'y',round((o.y+(board?o.h:0))*100),0,500)+'</div><p class="field-hint">Na planta, a janela fica no alto e a entrada embaixo.</p>'+
    (o.note?'<p class="measurement-note">'+esc(o.note)+'</p>':'')+
    '<label class="range-row">Rotação <span>'+fmt(o.rotation,1)+'°</span><input data-field="rotation" type="range" min="-180" max="180" step="5" value="'+(((o.rotation+180)%360+360)%360-180)+'"></label>'+
    '<label class="color-row">Cor principal<input data-field="color" type="color" value="'+esc(o.color)+'"></label>'+
    '<label class="check-row"><input data-field="locked" type="checkbox" '+(o.locked?'checked':'')+'>Fixar posição para evitar mover sem querer</label>'+
    '<div class="mini-actions"><button data-action="rotate">'+icon('rotate')+'Girar 90°</button><button data-action="duplicate">'+icon('copy')+'Duplicar</button><button data-action="delete" class="danger">'+icon('trash')+'Remover</button></div>'+
    '<button class="button secondary wide" data-action="move">'+icon('move')+'Arrastar no quarto</button>'+
    (parent?'<p class="selected-label">Acompanha '+esc(parent.name.toLowerCase())+' ao mover. <button data-action="detach">Desvincular</button></p>':'')+
    (childCount?'<p class="selected-label">Ao mover ou remover, leva junto '+childCount+' '+(childCount===1?'item apoiado.':'itens apoiados.')+'</p>':'')+
    (!effectiveVisible(o,project)?'<p class="warn">Este item está oculto. Use o ícone de olho na lista para mostrar.</p>':'');
}
function renderRoom(){const r=project.room;for(const key of ['w','d','h'])$('room-'+key).value=r[key];$('wall-color').value=r.wallColor;$('floor-color').value=r.floorColor;$('wood-color').value=r.woodColor;$('measured').checked=!project.estimated;$('door-angle').value=r.door.angle;$('door-degrees').textContent=r.door.angle+'°';for(const key of ['w','h','sill'])$('win-'+key).value=round(r.window[key]*100);$('win-center').value=round((r.window.center+r.w/2)*100);for(const key of ['w','h','offset'])$('door-'+key).value=round(r.door[key]*100);
  $('room-notice').textContent=project.estimated?'As dimensões do quarto ainda são estimadas. Confira as medidas antes de planejar compras.':'Dimensões do quarto informadas por você. Objetos e posições sem medidas continuam aproximados.';
  $('measurement-details').innerHTML=(project.measurementNotes||[]).map(text=>'<p>'+esc(text)+'</p>').join('')||'<p>Este projeto não contém notas de medição.</p>';
  $('previous-project').hidden=!previousProject;
}
function setMode(next){mode=next;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));scene?.setMode(mode);$('scene-caption').textContent=currentView==='top'?'Planta em escala · selecione e arraste os móveis':mode==='move'?'Toque no móvel e arraste · Desfazer está sempre disponível':'Arraste para girar · Use dois dedos para aproximar';}
function switchView(view){currentView=view;const plan=view==='top';document.body.classList.toggle('floorplan-mode',plan);$('floorplan').hidden=!plan;scene?.setView(view);document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-pressed',String(b.dataset.view===view));});if(plan)renderFloorplan($('plan-canvas'),project,selectedId);setMode(mode);}
function removeObject(){const o=findSelected();if(!o)return;const ids=new Set([o.id]);let changed=true;while(changed){changed=false;for(const q of project.objects)if(q.parentId&&ids.has(q.parentId)&&!ids.has(q.id)){ids.add(q.id);changed=true;}}commit(()=>{project.objects=project.objects.filter(q=>!ids.has(q.id));selectedId=null;},o.name+' removido'+(ids.size>1?' com os itens apoiados.':'.')+' Você pode desfazer.');}
function duplicateObject(){const o=findSelected();if(!o)return;commit(()=>{const q=clone(o);q.id='obj-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);q.name=o.name+' (cópia)';q.x+=.15;q.z+=.15;delete q.parentId;boundPosition(q,project.room);project.objects.push(q);selectedId=q.id;},'Cópia adicionada.');}
function toggleVisible(id){const o=project.objects.find(q=>q.id===id);if(!o)return;commit(()=>{const visible=effectiveVisible(o,project);o.visible=!visible;if(!visible){let child=o;while(child.parentId){const p=project.objects.find(q=>q.id===child.parentId);if(!p)break;p.visible=true;child=p;}}});}
function modal(title,html,eyebrow='MEU ESPAÇO'){$('modal-title').textContent=title;$('modal-eyebrow').textContent=eyebrow;$('modal-body').innerHTML=html;if(!$('modal').open)$('modal').showModal();}
function closeModal(){$('modal').close();}
function catalog(){const types=['bed','tabletop','cabinet','chair','shelf','l_shelf','frame','wardrobe','nightstand','rug','plant','block','monitor','pc'];modal('Qual é a próxima ideia?','<p class="modal-copy">Adicione um item e ajuste suas medidas no painel.</p><div class="catalog">'+types.map(type=>{const c=CATALOG[type];return '<button data-add="'+type+'">'+icon(c.icon)+'<strong>'+c.label+'</strong><span>'+dimensionsText({...c,type})+' · '+fmt(c.h*100,1)+' cm de altura</span></button>';}).join('')+'</div>','ADICIONAR AO QUARTO');}
function addObject(type){if(!CATALOG[type]||project.objects.length>=150){toast('O projeto aceita até 150 objetos.');return;}commit(()=>{const c=CATALOG[type],id='obj-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);const o={id,type,name:c.label,x:0,z:.15,y:c.y||0,w:c.w,d:c.d,h:c.h,color:c.color,rotation:0,visible:true,locked:false};if(type==='l_shelf')o.shelfDepth=c.shelfDepth;boundPosition(o,project.room);project.objects.push(o);selectedId=id;},'Objeto adicionado. Ajuste o tamanho e a posição.');closeModal();switchTab(false);setMode('move');}
function showPhotos(){modal('Seu quarto, como ele é.','<p class="modal-copy">Estas fotos orientam a reconstrução. As medidas que você informou foram aplicadas; detalhes e posições sem cotas continuam aproximados.</p><div class="photo-grid">'+references.map(p=>'<figure><img src="'+esc(p.src)+'" alt="'+esc(p.caption)+'" loading="lazy"><figcaption>'+esc(p.caption)+'</figcaption></figure>').join('')+'</div>','REFERÊNCIAS REAIS');}
function showHelp(){modal('Como editar seu quarto','<div class="help-steps"><div class="help-step"><strong>Planta técnica em escala</strong><p>Clique em Planta para ver as cotas das paredes, janela, porta e móveis. Selecione ou arraste os móveis diretamente no desenho. A orientação da janela fica no alto.</p></div><div class="help-step"><strong>Explore o quarto em 3D</strong><p>Arraste para girar, use a rolagem para aproximar e escolha Entrar para olhar por dentro.</p></div><div class="help-step"><strong>Suas mudanças no GitHub</strong><p>O projeto é carregado do GitHub ao abrir a página. Para salvá-lo automaticamente após cada edição, clique em Conectar GitHub e informe um token pessoal limitado a este repositório. O token não fica salvo no navegador.</p></div><div class="help-step"><strong>Acerte a escala</strong><p>As dimensões do quarto são reais conforme informado; posições de alguns itens e detalhes sem cotas ainda são aproximados. Ajuste tudo na aba Ambiente ou no editor de cada objeto.</p></div></div>');}
function saveMenu(){modal('Exportar ou importar projeto','<p class="modal-copy">Seu projeto principal está no GitHub. Use uma cópia JSON para fazer backups e para importar projetos externos.</p><div class="export-grid"><button data-export="json">'+icon('folder')+'<strong>Projeto editável</strong><span>JSON · Todas as medidas, posições e objetos.</span></button><button data-export="glb">'+icon('download')+'<strong>Modelo 3D</strong><span>GLB · Objetos separados para outros editores.</span></button><button data-export="png">'+icon('camera')+'<strong>Imagem da vista</strong><span>PNG · Uma imagem do ângulo atual.</span></button></div><button id="import-project" class="button secondary import-button">'+icon('folder')+'Importar projeto JSON</button>'+(oldDraft?'<button id="legacy-project" class="button secondary import-button">'+icon('folder')+'Recuperar uma edição antiga deste navegador</button>':'')+'<button id="open-github-panel" class="button secondary import-button">'+icon('check')+'Conectar e salvar no GitHub</button>');}

function showGitHubConnect(){
 const state=cloud.state();
 if(rawEmbedded){toast('Esta cópia HTML offline não permite gravação no GitHub. Abra o site hospedado.');return;}
 const content=state.connected?
 '<div class="github-inline-status"><strong>Conta conectada</strong>Suas edições são enviadas automaticamente para o arquivo projeto-atual.json, com histórico de versões no GitHub.</div><div class="github-actions"><button id="save-github-now" class="button primary wide">Salvar alterações agora</button><button id="disconnect-github" class="button secondary wide">Desconectar esta aba</button></div>':
 '<p class="modal-copy">Seu quarto sempre é carregado do GitHub. Para salvar automaticamente, conecte a conta proprietária do repositório com um token de acesso <strong>limitado somente a este projeto</strong>.</p><div class="github-actions"><label>Token pessoal do GitHub<input id="github-token-input" type="password" autocomplete="off" spellcheck="false" placeholder="github_pat_..." aria-describedby="github-help"></label><p id="github-help">Crie um fine-grained token com acesso apenas a <strong>meu-quarto-3d</strong>, permissão <strong>Contents: Read and write</strong> e validade curta. Não cole seu token no chat. Ele fica só na memória desta aba, não em localStorage.</p><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">Criar token no GitHub</a><button id="connect-github-action" class="button primary wide">Conectar e ativar salvamento automático</button><p id="github-connect-error" role="alert"></p></div>';
 modal('Salvar diretamente no GitHub',content,'PROJETO NA NUVEM');
}

let currentDownloadUrl=null;
function download(blob,name){if(currentDownloadUrl)URL.revokeObjectURL(currentDownloadUrl);currentDownloadUrl=URL.createObjectURL(blob);modal('Sua cópia está pronta.','<p class="modal-copy">'+esc(name)+' · '+fmt(blob.size/1024,0)+' KB</p><a id="ready-download" class="button primary wide" style="text-decoration:none" href="'+currentDownloadUrl+'" download="'+esc(name)+'">'+icon('download')+'Baixar arquivo</a><p class="modal-copy">Depois de baixar, você pode continuar editando o quarto.</p>','SALVAR PROJETO');}
async function exportFile(type){
  try{
    if(type==='json'){download(new Blob([JSON.stringify({...project,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'}),'Meu_Quarto_Projeto.json');}
    else if(type==='png'){if(!scene)throw new Error('A visualização 3D precisa estar disponível para gerar a imagem.');const data=await scene.screenshot();const blob=await(await fetch(data)).blob();download(blob,'Meu_Quarto_3D.png');}
    else if(type==='glb'){if(!scene)throw new Error('A visualização 3D precisa estar disponível para exportar o modelo.');toast('Preparando o modelo 3D…');const buffer=await scene.exportGLB();download(new Blob([buffer],{type:'model/gltf-binary'}),'Meu_Quarto_3D.glb');}
    else if(type==='html'){
      let html;if(location.protocol==='file:')html='<!doctype html>\n'+document.documentElement.outerHTML;else{const response=await fetch('meu_quarto_3d.html');if(!response.ok)throw new Error('Não foi possível preparar o HTML. Baixe o JSON para guardar as mudanças.');html=await response.text();}
      const doc=new DOMParser().parseFromString(html,'text/html');doc.getElementById('embedded-project').textContent=JSON.stringify({...project,snapshotId:Date.now().toString(36)}).replace(/</g,'\\u003c');doc.getElementById('scene').innerHTML='';doc.getElementById('modal').removeAttribute('open');doc.getElementById('toast').classList.remove('show');doc.getElementById('loading').hidden=false;download(new Blob(['<!doctype html>\n'+doc.documentElement.outerHTML],{type:'text/html;charset=utf-8'}),'Meu_Quarto_Editor_3D.html');
    }
    toast('Arquivo pronto. Toque em Baixar arquivo para guardar.');
  }catch(e){toast(e.message||'Não foi possível exportar. Tente baixar o JSON.');}
}

$('object-list').addEventListener('click',e=>{const selectButton=e.target.closest('[data-select]'),eye=e.target.closest('[data-visibility]');if(selectButton)select(selectButton.dataset.select);if(eye)toggleVisible(eye.dataset.visibility);});
$('search').addEventListener('input',renderList);
$('inspector').addEventListener('change',e=>{const el=e.target,key=el.dataset.field,o=findSelected();if(!key||!o)return;if(key==='locked'){commit(()=>o.locked=el.checked);return;}if(key==='name'||key==='color'){const value=el.value;commit(()=>o[key]=value);return;}if(o.locked){toast('Desative “Fixar posição” para alterar este item.');renderInspector();return;}const n=Number(el.value);if(!Number.isFinite(n)||!el.checkValidity()){toast('Confira o valor informado.');renderInspector();return;}const value=key==='rotation'?n:n/100;commit(()=>{const patch=key==='top'?{y:Math.max(0,value-o.h)}:{[key]:value};if(key==='h'&&['tabletop','shelf','l_shelf'].includes(o.type))patch.y=Math.max(0,o.y+o.h-value);const candidate={...o,...patch};if(candidate.type==='l_shelf')candidate.shelfDepth=Math.min(candidate.shelfDepth||.25,candidate.w,candidate.d);if(!['y','top'].includes(key))boundPosition(candidate,project.room);moveObject(project,o.id,{...patch,x:candidate.x,z:candidate.z,...(candidate.type==='l_shelf'?{shelfDepth:candidate.shelfDepth}:{})});});});
$('inspector').addEventListener('click',e=>{const action=e.target.closest('[data-action]')?.dataset.action,o=findSelected();if(!action||!o)return;if(action==='delete')removeObject();if(action==='duplicate')duplicateObject();if(action==='detach')commit(()=>delete o.parentId,'Item desvinculado.');if(action==='rotate'){if(o.locked){toast('Este objeto está com a posição fixada.');return;}commit(()=>{const q={...o,rotation:((o.rotation+90+180)%360+360)%360-180};boundPosition(q,project.room);moveObject(project,o.id,{rotation:q.rotation,x:q.x,z:q.z});});}if(action==='move'){if(o.locked){toast('Desative “Fixar posição” para arrastar.');return;}setMode('move');if(innerWidth<731)$('viewport').scrollIntoView({behavior:'smooth',block:'start'});toast('Arraste o objeto na área do quarto.');}});
$('tab-objects').onclick=()=>switchTab(false);$('tab-room').onclick=()=>switchTab(true);$('dimension-badge').onclick=()=>{switchTab(true);if(innerWidth<731)$('room-panel').scrollIntoView({behavior:'smooth',block:'start'});};
$('undo').onclick=undo;$('redo').onclick=redo;$('add').onclick=catalog;$('help').onclick=showHelp;$('backup-help').onclick=saveMenu;$('photo-button').onclick=showPhotos;$('save-menu').onclick=saveMenu;$('github-connect').onclick=showGitHubConnect;$('save-status').onclick=showGitHubConnect;$('close-modal').onclick=closeModal;
$('modal').addEventListener('click',async e=>{
 const add=e.target.closest('[data-add]'),exp=e.target.closest('[data-export]');
 if(add)addObject(add.dataset.add);
 if(exp)exportFile(exp.dataset.export);
 if(e.target.closest('#open-github-panel'))showGitHubConnect();
 if(e.target.closest('#save-github-now')){const accepted=cloud.saveNow(project);toast(accepted?'Solicitada sincronização com o GitHub.':'Há um conflito de versões. Exporte seu JSON antes de tentar novamente.');}
 if(e.target.closest('#disconnect-github')){cloud.disconnect();closeModal();}
 if(e.target.closest('#legacy-project')&&oldDraft){
   try{const restored=validateProject(JSON.parse(oldDraft));commit(()=>{project=restored;selectedId=null;},'Rascunho antigo recuperado. Conecte o GitHub para salvar.');closeModal();}
   catch(error){toast(error.message||'Não foi possível recuperar o rascunho.');}
 }
 if(e.target.closest('#connect-github-action')){
   const button=e.target.closest('button'),input=$('github-token-input'),error=$('github-connect-error');
   if(!input)return;button.disabled=true;button.textContent='Conectando…';error.textContent='';
   try{await cloud.connect(input.value,project);input.value='';closeModal();toast('GitHub conectado. Suas edições agora serão salvas automaticamente.');}
   catch(err){error.textContent=err.message||'Não foi possível conectar.';button.disabled=false;button.textContent='Conectar e ativar salvamento automático';}
 }
 if(e.target.closest('#ready-download'))setTimeout(closeModal,250);
 if(e.target.closest('#import-project'))$('project-file').click();
 if(e.target===$('modal')){const r=$('modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}
});
$('project-file').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>2000000)throw new Error('O arquivo está maior do que o esperado para um projeto JSON.');const incoming=validateProject(JSON.parse(await file.text()));commit(()=>{project=incoming;selectedId=null;},'Projeto aberto. Você pode continuar editando.');switchView('3d');closeModal();}catch(error){toast(error.message||'Não foi possível abrir o arquivo.');}finally{e.target.value='';}});
for(const key of ['w','d','h'])$('room-'+key).addEventListener('change',e=>{const n=Number(e.target.value);if(!e.target.checkValidity()||!Number.isFinite(n)){renderRoom();toast('Confira as dimensões em metros.');return;}commit(()=>{project.room[key]=n;normalizeRoom(project.room);for(const o of project.objects.filter(x=>!x.parentId)){const q={...o};boundPosition(q,project.room);moveObject(project,o.id,{x:q.x,z:q.z});}},'Dimensões do quarto atualizadas.');scene?.setView(scene.view);});
for(const [id,key]of [['wall-color','wallColor'],['floor-color','floorColor'],['wood-color','woodColor']])$(id).addEventListener('change',e=>{const value=e.target.value;commit(()=>project.room[key]=value);});
$('wall-swatches').addEventListener('click',e=>{const color=e.target.closest('[data-color]')?.dataset.color;if(color)commit(()=>project.room.wallColor=color);});
$('measured').onchange=e=>commit(()=>project.estimated=!e.target.checked);
$('door-angle').oninput=e=>{$('door-degrees').textContent=e.target.value+'°';};$('door-angle').onchange=e=>{const value=Number(e.target.value);commit(()=>project.room.door.angle=value);};
for(const key of ['w','h','sill'])$('win-'+key).onchange=e=>{if(!e.target.checkValidity()){renderRoom();return;}const value=Number(e.target.value)/100;commit(()=>{project.room.window[key]=value;normalizeRoom(project.room);});};
$('win-center').onchange=e=>{if(!e.target.checkValidity()){renderRoom();return;}const v=Number(e.target.value)/100;commit(()=>{project.room.window.center=v-project.room.w/2;normalizeRoom(project.room);});};
for(const key of ['w','h','offset'])$('door-'+key).onchange=e=>{if(!e.target.checkValidity()){renderRoom();return;}const value=Number(e.target.value)/100;commit(()=>{project.room.door[key]=value;normalizeRoom(project.room);});};
$('auto-walls').onchange=e=>{if(scene){scene.autoWalls=e.target.checked;scene.dirty=true;}};$('snap').onchange=e=>snap=e.target.checked;
$('restore').onclick=()=>commit(()=>{project=clone(DEFAULT_PROJECT);selectedId=null;},'Medidas e disposição de referência reaplicadas. Você pode desfazer.');
$('previous-project').onclick=()=>{if(previousProject)download(new Blob([JSON.stringify(previousProject,null,2)],{type:'application/json'}),'Meu_Quarto_Antes_Das_Medidas.json');};
document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>switchView(button.dataset.view));
document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>setMode(button.dataset.mode));$('reset-view').onclick=()=>scene?.setView(scene.view);
document.querySelector('.brand').onclick=e=>{e.preventDefault();switchView('3d');};
document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)||$('modal').open)return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)redo();else undo();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo();}if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();removeObject();}if(e.key==='Escape')select(null);});

render();
try{
  scene=new RoomScene($('scene'),project,{
    select:id=>{select(id);if(id)switchTab(false);},locked:()=>toast('Este objeto está fixado. Desmarque a opção no painel para mover.'),
    startMove:()=>{moveStart=clone(project);},
    move:(id,x,z)=>{const o=project.objects.find(q=>q.id===id);if(!o)return;const q={...o,x,z};boundPosition(q,project.room,false);moveObject(project,id,{x:q.x,z:q.z});scene.sync(project);},
    endMove:moved=>{if(moved&&moveStart){const o=findSelected();if(o){const q={...o};boundPosition(q,project.room,snap);moveObject(project,o.id,{x:q.x,z:q.z});}if(JSON.stringify(project)!==JSON.stringify(moveStart)){remember(moveStart);persist();}render();}moveStart=null;}
  });
  $('loading').hidden=true;
}catch(error){console.error(error);$('loading').hidden=true;$('render-error').hidden=false;}
attachFloorplanHandlers($('plan-canvas'),()=>project,id=>{select(id);switchTab(false);},(id,x,z,finished)=>{
  const o=project.objects.find(q=>q.id===id);if(!o)return;
  if(!finished){if(!floorplanStart)floorplanStart=clone(project);const q={...o,x,z};boundPosition(q,project.room,false);moveObject(project,id,{x:q.x,z:q.z});scene?.sync(project);renderFloorplan($('plan-canvas'),project,selectedId);return;}
  if(floorplanStart){const q={...o};boundPosition(q,project.room,snap);moveObject(project,id,{x:q.x,z:q.z});if(JSON.stringify(floorplanStart)!==JSON.stringify(project)){remember(floorplanStart);persist();}render();}floorplanStart=null;
},toast);

// When supported, these tools expose the same actions as the visible editor.
// No external account, model service, or hidden data is accessed.
if(document.modelContext?.registerTool){
  const result=data=>({content:[{type:'text',text:JSON.stringify(data)}]});
  const state=()=>({schema:project.schema,room:clone(project.room),estimated:project.estimated,objects:clone(project.objects)});
  try{
    document.modelContext.registerTool({name:'read_room_project',description:'Read the current room dimensions and all furniture, including edits made in this browser.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:async()=>result(state())});
    document.modelContext.registerTool({name:'edit_room_object',description:'Edit an existing room object using its ID. Same actions as the visible editor; positions and dimensions are in meters. Changes can be undone.',inputSchema:{type:'object',properties:{id:{type:'string'},changes:{type:'object',properties:{x:{type:'number'},z:{type:'number'},y:{type:'number'},rotation:{type:'number'},w:{type:'number'},d:{type:'number'},h:{type:'number'},color:{type:'string'},visible:{type:'boolean'},name:{type:'string'}},additionalProperties:false}},required:['id','changes'],additionalProperties:false},execute:async input=>{if(!input||typeof input.id!=='string'||!input.changes||typeof input.changes!=='object')throw new Error('Provide an object ID and changes.');const o=project.objects.find(q=>q.id===input.id);if(!o)throw new Error('Object not found.');if(o.locked)throw new Error('Object position is locked.');const allowed=['x','z','y','rotation','w','d','h','color','visible','name'];if(Object.keys(input.changes).some(k=>!allowed.includes(k)))throw new Error('Unknown property.');const candidate=clone(project),co=candidate.objects.find(q=>q.id===o.id);Object.assign(co,input.changes);validateProject(candidate);for(const k of ['x','z','y','rotation','w','d','h'])if(k in input.changes&&(!Number.isFinite(input.changes[k])||Math.abs(input.changes[k])>20))throw new Error('Invalid numeric property.');for(const k of ['w','d','h'])if(k in input.changes&&input.changes[k]<=0)throw new Error('Dimensions must be positive.');if('color' in input.changes&&!/^#[0-9a-fA-F]{6}$/.test(input.changes.color))throw new Error('Invalid color.');if('name' in input.changes&&(typeof input.changes.name!=='string'||input.changes.name.length>100))throw new Error('Invalid name.');if('visible' in input.changes&&typeof input.changes.visible!=='boolean')throw new Error('Visibility must be boolean.');commit(()=>moveObject(project,o.id,clone(input.changes)));return result(state());}});
    document.modelContext.registerTool({name:'remove_room_object',description:'Remove an existing room object and items resting on it. Same as the Remove button. Can be undone.',inputSchema:{type:'object',properties:{id:{type:'string'}},required:['id'],additionalProperties:false},execute:async input=>{if(!input||typeof input.id!=='string'||!project.objects.some(o=>o.id===input.id))throw new Error('Object not found.');select(input.id);removeObject();return result(state());}});
  }catch(error){console.warn('Browser tools unavailable',error);}
}
