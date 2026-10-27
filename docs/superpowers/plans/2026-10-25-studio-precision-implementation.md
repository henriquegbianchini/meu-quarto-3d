# Studio Precision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.
>
> **Estado: PLANEJADO / NÃO EXECUTADO.** Não implemente código até a revisão e aprovação da especificação detalhada. Somente use branch de trabalho; não faça merge na main ou publique sem autorização específica.

**Goal:** Evoluir a UI do Meu Quarto 3D para um editor técnico premium, preservar as 22 entidades e medidas reais e fortalecer persistência, planta 2D, 3D, segurança e qualidade.

**Architecture:** Preservar módulos ES nativos e HTML/CSS estáticos. Estabelecer limites explícitos entre modelo de dados, renderização SVG, renderização Three.js, estado de interface e GitHub Contents API. Adotar mudanças incrementais e testes que provem invariantes.

**Tech Stack:** JavaScript ES modules, HTML, CSS, Three.js r180 vendorizado, GitHub Pages, GitHub API, Node.js 22 LTS em CI (versão proposta), node:test; Playwright apenas para testes E2E/visual se justificado.

**Spec:** docs/superpowers/specs/2026-10-25-studio-precision-design.md

**Baseline:** main @ 8a3d0645794a967b5f9617645562a2806c22cf91

## Global Constraints

- Não alterar main nem GitHub Pages sem autorização específica.
- Não introduzir Cloudflare ou backend sem aprovação; GitHub segue origem autoritativa.
- Preservar medidas reais, revision e measurementNotes; 22 objetos padrão e vínculos parentId.
- Impedir o retorno dos IDs/types aposentados led, fan, backpack e dog na importação ou na cena.
- Não transformar estimativas em dados confirmados.
- Tokens GitHub nunca em repositório, localStorage, IndexedDB, commits, logs, URLs ou snapshots.
- Separar escrita de dados de versões de código; discutir branch exclusiva antes de migrar endpoint.
- Não declarar testes ou publicação sem executá-los e inspecionar evidências.

## Review Focus

1. Desconexão após uma edição: usuário recarrega; deve existir cópia recuperável do rascunho não sincronizado sem credenciais (Task 3).
2. Corrida com outro commit GitHub: 409/422 bloqueia autosave; “Salvar agora” não pode ignorar o conflito (Task 3).
3. JSON legado com um retired type usando ID novo: remover corretamente o tipo aposentado sem apagar os móveis corretos (Task 2).
4. Rotação de móvel com itens apoiados: filhos preservam deslocamentos e alturas, sem drift em movimentos encadeados (Task 4).
5. Planta sob zoom, rotação ou janela estreita: cotas externas e legenda permanecem visíveis sem recobrir conteúdo (Task 6).

## Phase 0 — Pré-condições não destrutivas

- [ ] Confirmar commit/base da branch de desenvolvimento e registrar o SHA.
- [ ] Capturar telas reais do site publicado quando navegador conectado for disponibilizado. Até lá, marcar auditoria de UX como parcial.
- [ ] Salvar backup JSON atual de teste, sem token, em fixture local na branch.
- [ ] Reconfirmar com o usuário a política de recuperação de rascunho pendente e a eventual branch exclusiva de dados antes de alterar persistência.
- [ ] Revisar protótipos Figma; mockups ainda são conceituais e não substituem execução.

## Task 1 — Contrato de projeto e testes de invariantes

**Files:** Create tests/model.test.mjs, tests/fixtures/room-baseline.json; modify package.json.

**Interfaces:** Consome DEFAULT_PROJECT, validateProject, removeRetiredObjects, boundPosition, moveObject de model.js; publica comandos npm test e npm run check:syntax.

- [ ] Escrever testes falhando: IDs exatos 22; ids únicos; 9 relações parentId válidas; medidas 3.1,2.9,2.7; janela 2.05,1.3,1; cama .9,2,.6; prateleiras 1.68 e 2.05 na superfície (y+h).
- [ ] Rodar node --test tests/model.test.mjs e registrar falhas.
- [ ] Corrigir apenas os contratos essenciais sem alterar a disposição.
- [ ] Rodar node --test tests/model.test.mjs e confirmar zero falhas.
- [ ] Criar rastreabilidade dos resultados e commit isolado (apenas branch).

**Aceite:** nenhum dado confirmado, id ou vínculo divergente.

## Task 2 — Importação segura e objetos aposentados

**Files:** Modify model.js; tests/import-retired.test.mjs; app.js para tratamento de erro se necessário.

**Interfaces:** sanitização e migração de dados legados antes de validação final; validateProject(raw) mantém contrato.

- [ ] Testes falhando para antigos IDs e para objetos com type led/fan/backpack/dog sob IDs diferentes; verificar preservação de todos os objetos legítimos.
- [ ] Testar id duplicado, parentId circular, parentId inválido, dimensões NaN/extremas, nome de objeto com caracteres especiais.
- [ ] Implementar migração explícita para aposentados antes de rejeitar tipos desconhecidos; retirar entradas aposentadas do catálogo exposto e de paths de adição.
- [ ] Executar testes, validar histórico e verificar que a importação de projeto customizado não impõe sempre exatamente 22 objetos.
- [ ] Commit pequeno e revisão.

**Aceite:** projeto padrão 22; antigos passam por migração controlada; demais dados não são apagados silenciosamente.

## Task 3 — Sincronização remota confiável e recuperação

**Files:** Modify github-sync.js e app.js; create tests/github-sync.test.mjs, tests/helpers/fetch-mock.mjs; criar módulo pending-draft-store.js apenas se recuperação secundária local for aprovada.

**Interfaces propostas:** createGitHubStore(callback, adapters?) mantém load/connect/schedule/state/disconnect/saveNow; modela estados ready, dirty, saving, saved, auth-required, transient-error e conflict. Adapters de fetch e draft store injetáveis para testes.

- [ ] Criar testes de GET remoto + SHA, PUT com SHA anterior, confirmação por SHA retornado e recarga subsequente com dados preservados.
- [ ] Criar teste concorrente: gravação A em andamento + edição B não perde B; último estado confirmado igual ao novo JSON.
- [ ] Criar testes de 401,403,404,409,422, 5xx, timeout/abort, offline, saída de página com alterações pendentes e retries limitados.
- [ ] Testar que saveNow não limpa blocked e não substitui remote.sha quando existe conflito.
- [ ] Implementar separação entre remote baseline, draft pendente, in-flight e estado apresentado. A versão GitHub segue única origem persistente; cache local, se autorizado, é somente mecanismo de recuperação do que ainda não foi enviado.
- [ ] Fazer leitura de controle ao reconectar/confirmar conflito quando necessário; nunca inserir token em console ou arquivo.
- [ ] Rodar node --test tests/github-sync.test.mjs com mocks; proibir PUT real em testes automatizados.
- [ ] Documentar limite: sem credencial ou backend OAuth, o site estático não salva anonimamente após recarregar.
- [ ] Commit e revisão de segurança.

**Aceite:** nenhum sucesso falso; nenhuma perda silenciosa em erros simulados; concorrência bloqueada sem sobrescrita automática.

## Task 4 — Contrato geométrico único

**Files:** Modify model.js; create geometry.js se necessário, tests/geometry.test.mjs; integrate app.js, floorplan.js, scene.js gradualmente.

**Interfaces propostas:** getObjectFootprint(object) -> polygon em metros; distanceToWalls(object, room) -> distâncias; detectFloorCollisions(project,id) -> pares e interseções; measureBetween(a,b) -> distância horizontal; mover pais via moveObject.

- [ ] Testes falhando para bbox rotacionada 0/90/45 graus, limites do quarto, snap de .05 m, câmera/zoom sem alterar posição real.
- [ ] Testar transformações de pai e filho, altura com aumento de tampo, movimento repetido e ausência de ciclos.
- [ ] Implementar funções matemáticas independentes do DOM/Three.js sem mover automaticamente outros móveis.
- [ ] Rodar node --test tests/geometry.test.mjs; compatibilizar desenho SVG e cena Three.js.
- [ ] Commit e revisão.

**Aceite:** coordenadas x/z em metros com origem no centro, y com semântica documentada, 2D/3D sem divergência calculada.

## Task 5 — Shell do Estúdio técnico desktop/mobile

**Files:** Modify index.html, style.css, app.js; criar ui/layout.js ou ui/panels.js somente se a responsabilidade justificar; tests/e2e/layout.spec.mjs.

**Interfaces:** manter IDs necessários aos módulos atuais; eventos de ObjectInspector, ViewSwitcher, ObjectTree, SyncStatus existentes não perdem handlers.

- [ ] Produzir testes/capturas de referência em 1440x900, 1024x768, 768x1024, 390x844 e 320x640.
- [ ] Escrever checks para sem rolagem horizontal, canvas não colapsado, status de salvamento visível e foco navegável.
- [ ] Implementar header 68 px desktop, objetos 256 px, inspetor 312 px, canvas expansível, barra inferior 32 px.
- [ ] Implementar em tablet gavetas laterais; mobile topbar e bottom sheet, sem ocultar estado pending/conflict.
- [ ] Implementar tokens CSS alinhados com Figma; não trocar framework ou criar CDN.
- [ ] Executar testes de screenshot com tolerâncias e revisão manual de textos e controles.
- [ ] Commit e revisão.

**Aceite:** nenhuma sobreposição relevante; ações existentes preservadas; controles principais acessíveis no mobile.

## Task 6 — Planta técnica e distâncias

**Files:** Modify floorplan.js, style.css, model.js/geometry.js; tests/floorplan.test.mjs; tests/e2e/floorplan.spec.mjs.

- [ ] Testar proporção 3.10:2.90, janela 2.05, porta .90, cota externa e legenda de 22 objetos no sistema completo.
- [ ] Testar coordenadas de drag com SVG getScreenCTM, zoom e snap em .05; teclado seleciona objeto.
- [ ] Acrescentar cotas internas e distâncias apenas para objeto selecionado; evitar rótulos longos no interior das formas.
- [ ] Lidar com colisões como avisos e não como mutações ocultas; excluir da detecção habitual itens apoiados sobre seus pais.
- [ ] Conferir captura da planta em desktop e mobile; comparar com referência aprovada.
- [ ] Commit e revisão.

**Aceite:** medidas físicas independentes de pixels; cotas legíveis e nenhuma divergência de posição após editar entre 2D e 3D.

## Task 7 — Editor 3D, fallback e memória

**Files:** Modify scene.js, software-renderer.js se necessário; tests/e2e/editor3d.spec.mjs.

- [ ] Testes/cenários para orbit, pan, zoom, raycast, seleção, objeto fixado, mover pai com filhos, exportar GLB/PNG, fallback sem WebGL.
- [ ] Medir fps ou tempo de render, número de geometries/textures com renderer.info antes/depois de criar/remover/editar repetidamente.
- [ ] Corrigir descarte de recursos de maneira segura para materiais/texturas compartilhados; manter lógica de renderização sob demanda.
- [ ] Reduzir trabalho por frame somente com perfil evidenciado; não prejudicar sombras/qualidade desnecessariamente.
- [ ] Regressão visual com referências e commit.

**Aceite:** sem crescimento não explicado de recursos por ciclo de edição; seleção e geometria consistentes.

## Task 8 — Exportações e build offline

**Files:** Modify scripts/build-offline.mjs, app.js; tests/offline-build.test.mjs; package.json, package-lock.json quando necessário.

- [ ] Testar que npm run build:offline não altera meu_quarto_medidas.json nem a fonte de verdade projeto-atual.json.
- [ ] Testar que HTML offline gerado tem fotos, módulos embutidos e snapshot consistente, sem dependências de CDN ou token.
- [ ] Validar exportação JSON/importação round-trip para os 22 objetos, vínculo e notas; GLB/PNG sem erro para cena suportada.
- [ ] Gerar offline determinístico e verificar diff previsto em branch de desenvolvimento.
- [ ] Commit e revisão.

**Aceite:** nenhuma referência original sobrescrita, nenhuma funcionalidade offline anunciada como disponível sem teste.

## Task 9 — CI, segurança e revisão

**Files:** Create .github/workflows/quality.yml, tests/e2e/*.spec.mjs e documentação; atualizar package.json/lock conforme necessário.

- [ ] Configurar Node 22 no CI, npm ci após gerar lock, syntax check, node --test e build offline.
- [ ] Se Playwright incluído, criar job separado com browsers fixados para e2e e screenshots.
- [ ] Rever os campos com innerHTML, escaping, importação JSON e construção de URLs; confirmar permissões mínimas e ausência de credenciais.
- [ ] Configurar restrições do workflow e dependabot apenas se coerentes com modelo simples do projeto.
- [ ] Executar CI na branch; anexar logs, fotos e resumo dos resultados.
- [ ] Revisar diferenças contra o commit base; não mudar main.
- [ ] Preparar PR com checklist, evidências, limitações e plano de rollback; aguardar aprovação explícita para merge/publicação.

**Aceite:** testes realmente executados e rastreáveis; nenhum segredo; registro explícito do que ainda não foi verificado.

## Sequência de entrega

1. **Foundation:** Tasks 1–3 para integridade e persistência.
2. **Technical:** Tasks 4,6,7 para geometria, planta e 3D.
3. **Experience:** Task 5 com direção visual aprovada e testes de layout.
4. **Release readiness:** Tasks 8–9 para build offline, CI, segurança e PR.

As tarefas podem ser reorganizadas por dependência, mas nenhuma mudança é aprovada por ter sido apenas planejada. O GitHub Pages segue intocado até um aceite posterior de publicação.
