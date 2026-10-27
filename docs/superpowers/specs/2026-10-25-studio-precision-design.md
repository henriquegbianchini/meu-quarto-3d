# Studio Precision — Especificação de design v1

> Estado: **PROPOSTO / NÃO IMPLEMENTADO**. Direção visual A aprovada em 25/10/2026; detalhamento e mudanças funcionais dependem de validação antes de implementação. Nenhuma alteração de produção é autorizada por este documento.
>
> Linha de base: main @ 8a3d0645794a967b5f9617645562a2806c22cf91 (25/10/2026). Figma: https://www.figma.com/design/YkhRFm5Ipn7tMMZqfblhMI

## Propósito

Transformar o editor existente em um estúdio técnico profissional, de uso cotidiano, mantendo as medidas reais, as 22 entidades, o comportamento correto do editor 3D/2D, o GitHub como fonte persistente e o GitHub Pages como hospedagem estática.

### Objetivos

- Canvas dominante, campos de edição legíveis, sem sobreposição e com acessibilidade consistente.
- Informações técnicas: cotas em escala, medidas confirmadas versus estimativas, posições, colisões e vínculos.
- Integridade: não perder mudanças locais não sincronizadas nem sobrescrever versões concorrentes.
- Arquitetura incremental, sem adoção compulsória de React, TypeScript, Vite, backend ou Cloudflare.
- Responsividade real em desktop, notebook, tablet e mobile.

### Não objetivos na primeira entrega

- Reconstrução integral dos modelos e geometrias 3D; nenhuma dimensão estimada será apresentada como medida confirmada.
- Autenticação OAuth ou backend de sincronização sem decisão arquitetural aprovada.
- Substituir o salvamento remoto por localStorage/IndexedDB como fonte definitiva.
- Reintroduzir LED de parede, ventilador de chão, mochila ou cachorro na cama.
- Publicar, fazer merge na main ou executar gravações reais de dados sem autorização específica.

## Abordagem aprovada e descartadas

**A — Estúdio técnico:** painel de objetos recolhível à esquerda, canvas central expansível e inspetor contextual à direita. Escolhida pela legibilidade, previsibilidade e precisão.

**B — Canvas First:** excelente para exploração visual, mas exige mais abertura de painéis e dificulta conferência simultânea de cotas e propriedades. Incorporar apenas o recolhimento de painéis e a centralidade do canvas.

**C — Control Room:** densidade alta e visual escuro; não selecionada como identidade padrão.

## Design system

### Cores (variáveis no Figma)

- surface/app #F7F8F5; surface/panel #FFFFFF; surface/canvas #E9F0EA; surface/subtle #F0F4EF
- text/primary #24352F; text/secondary #61746A; border/default #DAE4DC
- brand/primary #44745C; brand/strong #30583F; brand/tint #DBEBDD
- state/success #277451; state/warning #A36C24; state/error #B95549
- scene/wall #E1E8DF; scene/furniture #B9CCC0

Foco em pares cromáticos com contraste WCAG 2.2 AA; contraste deve ser medido antes de considerar telas prontas. Medidas do ambiente são texto técnico, não elemento decorativo.

### Tipografia e espaçamento

- Fonte: Inter existente em style.css com fallback de sistema; sem dependência de CDN.
- Títulos: 28/34 e 20/26; corpo padrão 14/21; rótulos 12/16; legenda 11/15 apenas para informação secundária não crítica.
- Escala de espaçamento: 4, 8, 12, 16, 24 e 32 px. Raios: 8, 12 e 16 px.
- Campos de edição: pelo menos 42 px de altura; alvos de interação que possam atingir 44 x 44 px sempre que possível; foco visível com contraste.
- Animações curtas e discretas; respeitar prefers-reduced-motion.

### Componentes necessários

AppHeader, SyncStatus, UndoRedo, ViewSwitcher, ToolRail, ObjectSearch, ObjectTree/Row, ObjectInspector, DimensionField, PrecisionFlag, PropertyGroup, RoomInspector, ViewportHost, FloorplanLegend, DimensionOverlay, ErrorBanner, ConfirmationDialog, RecoverDraftDialog, ExportMenu, BottomSheetMobile, Toast/LiveStatus. Prever variantes loading, empty, selected, disabled, saving, saved, pending, offline, failed e conflict quando aplicáveis.

## Telas e breakpoints

### Desktop de referência: 1440 x 900

- Topbar fixa: 68 px, com projeto, desfazer/refazer, indicador persistente de sincronização e exportação.
- Painel de objetos: 256 px, recolhível; busca, categorias, lista e visibilidade/bloqueio.
- Inspetor contextual: 312 px, recolhível; dimensões, rotação, posição, apoio e fonte/certeza da medida.
- Canvas: largura remanescente (872 px em 1440 px com ambos os painéis); recebe vistas 3D, Planta e Medir.
- Barra inferior: 32 px com unidades, dimensões e estado dos dados.
- Não sobrepor cotas, overlays de ferramentas ou textos ao quarto: atribuir zonas e níveis próprios.

### Notebook estreito e tablet: 740–1179 px

- Canvas prioritário; permitir apenas um painel lateral aberto por vez ou drawers laterais temporários.
- Topbar compactada sem ocultar status de edição pendente ou erro de sincronização.
- Ferramentas essenciais acessíveis sem hover; demais no menu.

### Mobile: até 739 px

- Topbar ~56–64 px com nome abreviado e estado de sincronização visível.
- Canvas por padrão dominante, com alternância de vista e ação de enquadrar.
- Objetos/Inspetor como bottom sheet acessível com estados fechado, parcial e expandido.
- Botões e campos de toque com alvos confortáveis; sem rolagem horizontal ou controles essenciais escondidos.
- Modal de conflito nunca pode ser substituído por toast que desaparece.

### Zoom e escala

- Geometria em metros como fonte canônica; desenho em SVG ou Three.js conforme a vista.
- Zoom não altera dimensões reais, apenas transformação da câmera/viewBox/viewport.
- Cotas externas sempre legíveis; cotas internas, até paredes e entre móveis exibidas sob demanda ou na seleção para evitar poluição.
- Rótulos de móveis na planta por números e legenda externa; não desenhar textos longos sobre geometrias pequenas.

## Arquitetura de informações e fluxos

1. **Abrir:** carregar projeto remoto com SHA. Mostrar origem remota e hora/versão; falhas não são confundidas com “salvo”.
2. **Selecionar:** objeto destacado de forma sincronizada na lista, na planta e no 3D. Painel de propriedades revela categoria, medidas, posições, vínculos e notas.
3. **Editar:** validação de faixa e de geometria antes de confirmar; preservar histórico de desfazer/refazer e vínculos a itens apoiados.
4. **Sincronizar:** states remote-clean, dirty, saving, saved, auth-required, network-error e conflict. Nunca afirmar sucesso apenas por PUT disparado. Confirmação remota por SHA retornado e leitura de controle quando necessário.
5. **Falha/recuperação:** manter rascunho não confirmado e opção exportar. Um possível cache local de recuperação é secundário, explícito e nunca substitui a versão autoritativa do GitHub; credenciais nunca são armazenadas nele.
6. **Conflito:** bloquear sobrescrita, oferecer backup/download e comparação da versão local x remota. Nunca apagar o bloqueio com “Salvar agora” sem refazer o controle de versão.
7. **Exportar:** JSON, GLB, PNG e offline com mensagens verificáveis e dados íntegros.
8. **Mobile:** seleção e edição via drawer; status e erros persistentes e acessíveis.

## Dados invariantes

- Ambiente: 3,10 × 2,90 × 2,70 m.
- Janela: 2,05 × 1,30 m, base a 1,00 m; porta 0,90 × 2,10 m.
- Cama: 2,00 × 0,90 × 0,60 m.
- Tampo: 2,10 × 0,62 × 0,04 m.
- Gabinetes: largura conjunta 1,30 m dos maiores; cada um ter 0,65 m é provisório; profundidade 0,65 m, altura 0,70 m. Menor 0,40 × 0,65 × 0,70 m.
- Prateleiras em L: braços de 1,35 m e 0,50 m; profundidade 0,25 m; espessura 0,02 m; superfícies 1,68 m e 2,05 m.
- Confirmar os 22 IDs originais e 9 vínculos parentId em testes. IDs, tipos e objetos aposentados nunca retornam mesmo via importação legada.
- Notas measurementNotes e dados de posição aproximada precisam ser preservados e identificados sem virar “confirmados”.

## Persistência e segurança

GitHub Pages hospedará a aplicação estática. Sincronização atual usa GitHub Contents API com SHA e token temporário somente em memória. Não existe autenticação persistente silenciosa sem credencial ou backend autorizado. A separação de commits de dados e código será estudada por branch dedicada, sem alteração de produção nesta fase. Nunca inserir token em repositório, URL, logs ou screenshots. Dados do quarto publicados no repositório público podem ser públicos; oferecer aviso de privacidade.

## Acessibilidade e QA visual

- Navegação por teclado e foco visível; sem dependência exclusiva de hover.
- Papel, rótulo, status e mensagens para leitor de tela; status de sincronização via aria-live.
- Telas de referência 1440x900, 1024x768, 768x1024, 390x844 e 320x640.
- Verificar textos/cotas truncados, campos e ações tocáveis, modais, desenhos com zoom e estados de erro.
- Contraste WCAG 2.2 AA e efeitos de movimento reduzido submetidos a validação funcional.
- Mockups no Figma são conceituais e editáveis, **não** evidência de execução do app nem prova de fidelidade geométrica.

## Critérios para liberar implementação

Design document aprovado, evidências de estado publicado obtidas quando o navegador estiver disponível, conjunto de testes de invariantes preparado, política de recuperação de rascunhos escolhida, alternativas para a branch de dados revisadas. Implementar somente em branch isolada. PR pode ser criado para revisão, sem merge e sem deploy.
