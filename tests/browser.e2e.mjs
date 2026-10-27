import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,dirname,extname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(await readFile(join(root,'projeto-atual.json'),'utf8'));
const sha='sha-browser-fixture-0';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const requested=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
  const path=resolve(root,'.'+requested);
  if(path!==root&&!path.startsWith(root+'/')){res.writeHead(403);res.end();return;}
  const bytes=await readFile(path);
  res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream','cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});

async function open(width,height){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,acceptDownloads:true});
 await context.route('https://api.github.com/repos/henriquegbianchini/meu-quarto-3d/contents/projeto-atual.json**',route=>{
  route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({sha,content:Buffer.from(JSON.stringify(data),'utf8').toString('base64')})});
 });
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#loading')?.hidden===true,null,{timeout:15000});
 await page.locator('#object-count').waitFor({timeout:10000});
 await page.waitForFunction(()=>document.querySelector('#object-count')?.textContent==='22',null,{timeout:8000});
 return {page,context,errors};
}

async function geometry(page){
 return page.evaluate(()=>{
  const rect=sel=>{
   const el=document.querySelector(sel),r=el.getBoundingClientRect();
   return {x:r.x,y:r.y,left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,display:getComputedStyle(el).display,visibility:getComputedStyle(el).visibility};
  };
  return {viewport:rect('#viewport'),objects:rect('.objects-sidebar'),inspector:rect('.inspector-sidebar'),save:rect('#save-status'),bodyScroll:document.documentElement.scrollWidth,windowWidth:innerWidth};
 });
}
const seen=[];
test.after(async()=>{await browser.close();await new Promise(resolve=>server.close(resolve));});

for(const [width,height] of [[1440,900],[1024,768],[768,1024],[390,844],[320,640]]){
 test('editor funcional e sem overflow horizontal a '+width+'×'+height,async()=>{
  const {page,context,errors}=await open(width,height);
  try{
   const g=await geometry(page);
   seen.push({width,height,geometry:g});
   assert.ok(g.bodyScroll<=width+3,'Overflow: '+JSON.stringify(g));
   assert.ok(g.viewport.width>=190,'Canvas deve permanecer utilizável '+JSON.stringify(g));
   assert.ok(g.save.width>30&&g.save.display!=='none','Status do GitHub deve aparecer');
   assert.ok(g.objects.width>120&&g.inspector.width>120,'Painéis acessíveis');
   if(width>=1180){
    assert.ok(g.objects.right<=g.viewport.left+2,'Objetos à esquerda');
    assert.ok(g.viewport.right<=g.inspector.left+2,'Inspetor à direita');
   }else if(width<740){
    assert.ok(g.viewport.bottom<=g.inspector.top+2,'Canvas acima do inspetor');
    assert.ok(g.inspector.bottom<=g.objects.top+2,'Objetos abaixo do inspetor');
   }
   assert.deepEqual(errors,[],'Exceções no navegador: '+errors);
   await page.screenshot({path:join(root,'test-evidence-'+width+'.png'),fullPage:true});
  }finally{await context.close();}
 });
}

test('planta, cotas, objeto selecionado e JSON exportado são consistentes',async()=>{
 const {page,context,errors}=await open(1440,900);
 try{
  await page.locator('[data-view="top"]').click();
  await page.locator('#plan-map').waitFor();
  const text=await page.locator('#plan-map').textContent();
  assert.match(text,/3,10 m/);
  assert.match(text,/2,90 m/);
  assert.match(text,/JANELA · 2,05 m/);
  await page.locator('[data-plan-select]').first().click();
  assert.equal(await page.locator('.plan-clearance-grid b').count(),4);
  await page.locator('#save-menu').click();
  await page.locator('[data-export="json"]').click();
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#ready-download').click()]);
  const json=JSON.parse(await readFile(await download.path(),'utf8'));
  assert.equal(json.objects.length,22);
  assert.deepEqual(json.room,{...data.room});
  assert.deepEqual(errors,[]);
 }finally{await context.close();}
});


test('mobile usa painel inferior retrátil, sem esconder o canvas ou status',async()=>{
 const {page,context,errors}=await open(390,844);
 try{
  const obj=page.locator('#mobile-panel-objects');
  const props=page.locator('#mobile-panel-inspector');
  assert.equal(await obj.count(),1,'Botão Objetos precisa existir');
  assert.equal(await props.count(),1,'Botão Propriedades precisa existir');
  assert.equal(await obj.getAttribute('aria-expanded'),'false');
  await obj.click();
  assert.equal(await obj.getAttribute('aria-expanded'),'true');
  assert.equal(await page.locator('.objects-sidebar').evaluate(el=>el.classList.contains('mobile-open')),true);
  await page.locator('.objects-sidebar .object-select').first().click();
  assert.equal(await props.getAttribute('aria-expanded'),'true');
  assert.equal(await page.locator('.inspector-sidebar').evaluate(el=>el.classList.contains('mobile-open')),true);
  await page.locator('#mobile-panel-close').click();
  assert.equal(await props.getAttribute('aria-expanded'),'false');
  assert.equal(await page.locator('.inspector-sidebar').evaluate(el=>el.classList.contains('mobile-open')),false);
  const g=await geometry(page);
  assert.ok(g.save.width>30&&g.save.display!=='none');
  assert.deepEqual(errors,[]);
 }finally{await context.close();}
});


test('criar objeto, desfazer, refazer e excluir preserva projeto padrão',async()=>{
 const {page,context,errors}=await open(1440,900);
 try{
  await page.locator('#add').click();
  await page.locator('[data-add="block"]').click();
  assert.equal(await page.locator('#object-count').textContent(),'23');
  await page.locator('#undo').click();
  assert.equal(await page.locator('#object-count').textContent(),'22');
  await page.locator('#redo').click();
  assert.equal(await page.locator('#object-count').textContent(),'23');
  await page.locator('.object-row.selected .object-select').click();
  await page.locator('[data-action="delete"]').click();
  assert.equal(await page.locator('#object-count').textContent(),'22');
  assert.deepEqual(errors,[]);
 }finally{await context.close();}
});

test('exportações PNG e GLB funcionam com o renderizador disponível',async()=>{
 const {page,context,errors}=await open(1440,900);
 try{
  assert.equal(await page.locator('#scene canvas').count(),1);
  assert.equal(await page.locator('#render-error').evaluate(el=>el.hidden),true);
  for(const [type,magic] of [
   ['png',Buffer.from([0x89,0x50,0x4e,0x47])],
   ['glb',Buffer.from('glTF')]
  ]){
   await page.locator('#save-menu').click();
   await page.locator('[data-export="'+type+'"]').click();
   await page.locator('#ready-download').waitFor({timeout:25000});
   const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#ready-download').click()]);
   const binary=await readFile(await download.path());
   assert.ok(binary.subarray(0,4).equals(magic),'Assinatura esperada para '+type);
   await page.waitForTimeout(300);
  }
  assert.deepEqual(errors,[]);
 }finally{await context.close();}
});
