# Meu quarto · Estúdio 3D

Editor de quarto em português, baseado nas fotos e nas medidas fornecidas
em 25/10/2026. O quarto mede 3,10 × 2,90 × 2,70 m; a parede de 3,10 m é a da
janela/porta. O modelo continua sendo uma representação de planejamento.
As medidas e as interpretações estão registradas em `measurementNotes`.

A moldura externa da janela mede 2,05 × 1,30 m, começa a 1,00 m do chão
e fica centralizada. A porta mede 0,90 × 2,10 m, com afastamento lateral zero.
A cama mede 2,00 × 0,90 × 0,60 m.

O tampo (2,10 × 0,62 × 0,04 m) é independente dos três gabinetes de 70 cm
de altura e 65 cm de profundidade. Os maiores somam 1,30 m, representados
provisoriamente por dois módulos de 65 cm; o menor mede 40 cm. O tampo fica
rente ao menor e deixa parte dos maiores descoberta, conforme esclarecimento.
A largura individual dos maiores e o trecho descoberto não foram medidos.

As prateleiras em L têm braços externos de 1,35 m e 0,50 m, profundidade de
25 cm e espessura de 2 cm. As superfícies ficam a 1,68 e 2,05 m: vão livre
de 35 cm e 65 cm entre a superfície superior e o teto. Os 35 cm foram
interpretados como vão livre. A superfície da prateleira dos quadros fica
a 1,60 m. Os quadros têm 5 cm de vão vertical e 15 cm horizontal; os limites
superior/inferior informados implicam altura individual de 22,5 cm. A largura
de 30 cm de cada quadro, o tamanho da prateleira pequena e posições sem cotas
continuam estimados.

## Usar

Abra o Site, ou `meu_quarto_3d.html` em um navegador. A versão HTML
inclui o código, os modelos e as seis fotos; não usa CDN nem serviços de IA.
WebGL é usado quando disponível e existe um renderizador Canvas com teste
de profundidade para aparelhos sem aceleração gráfica.

Selecione os móveis pela lista ou pelo 3D. Edite posição, medidas, cor,
rotação e visibilidade. Móveis podem ser adicionados, duplicados ou removidos.
Os itens apoiados na bancada, cama e prateleiras acompanham o móvel.
Tampo, gabinetes e quadros são objetos separados. Nas prateleiras, o campo
de altura de posição indica o topo da superfície, em centímetros.

## Planta em escala

Na aba **Planta**, a vista técnica usa SVG vetorial dimensionado a partir de
`room.w` e `room.d`, em metros. Exibe cotas externas, janela, porta com o
ângulo de abertura e o contorno dos móveis principais. Selecione ou arraste
um móvel na própria planta; as posições alteradas atualizam o 3D e permitem
desfazer/refazer. Equipamentos e objetos apoiados são editados na lista para
não sobrepor as medidas. Posições sem medições são aproximadas; a escala das
paredes e as cotas seguem as medidas informadas no projeto. Para o móvel
selecionado, a legenda calcula distâncias às quatro paredes e ao móvel
mais próximo, considerando rotação. Também avisa quando há interseção
volumétrica real; apenas encostar na parede ou em outro móvel não configura
sobreposição. Cotas derivadas das posições ainda estimadas não constituem
novas medidas confirmadas.

## Sincronização pelo GitHub (não pelo navegador)

O site lê automaticamente `projeto-atual.json` da branch `main` do
repositório via API do GitHub. `meu_quarto_medidas.json` permanece como
referência original e o histórico de alterações fica disponível nos commits.

Para ativar o **salvamento automático após cada edição**:

1. Abra o site no GitHub Pages e clique em **Conectar GitHub**.
2. Crie em https://github.com/settings/personal-access-tokens/new um token
   **Fine-grained**, restrito ao repositório **meu-quarto-3d**, com
   permissão **Contents: Read and write** e expiração curta (por exemplo, 7 dias).
3. Cole o token **somente no campo do site**, nunca no chat ou em arquivos.
   Após autorizar, cada alteração salva uma versão no repositório depois de
   uma pequena pausa. Status e falhas aparecem no cabeçalho.

**Segurança e limites:** GitHub Pages é um site estático, incapaz de gravar no
repositório sem uma credencial autorizada ou um backend de autenticação.
O token **não é armazenado no navegador**, nem incluído no código, arquivos
de projeto ou commits: ele só permanece na memória até atualizar/fechar
a página. Por isso é necessário reconectar a cada nova visita. Quando
não conectado, o site permite editar e exportar JSON, mas avisa que as
mudanças ainda não foram enviadas ao GitHub. Conflitos de versão não são
sobrescritos automaticamente; exporte o JSON e recarregue para conciliar.
O arquivo do quarto está em um repositório **público**, portanto as medidas
e posições gravadas nele também são públicas.

Se existia um rascunho antigo salvo neste navegador, pode recuperá-lo uma
única vez em **Exportar → Recuperar uma edição antiga deste navegador**.
Como proteção contra falhas de rede ou fechamento acidental, o editor também
mantém temporariamente em `localStorage` uma cópia **somente do JSON ainda
não confirmado no GitHub** (com o SHA de base). Isso não substitui o
repositório como origem persistente e **nunca armazena o token**. Ao voltar,
é oferecida recuperação explícita; se a versão remota mudou, só permite
baixar o rascunho para conciliar manualmente, sem sobrescrever o GitHub.

Continuam disponíveis as exportações JSON, GLB e PNG; o arquivo HTML
monolítico `meu_quarto_3d.html` é uma cópia offline com o snapshot embutido,
atualizada pelo build da branch após os testes. A versão offline não exige
GitHub e não salva no repositório; exporte o JSON para guardar as mudanças.
O build nunca sobrescreve `meu_quarto_medidas.json` nem `projeto-atual.json`.

## Código

`model.js` contém o projeto inicial e validação de arquivos.
`scene.js` monta a geometria paramétrica; `floorplan.js` cria a planta cotada;
`github-sync.js` sincroniza o projeto com o GitHub; `app.js` controla a interface.
`software-renderer.js` implementa a alternativa Canvas. Three.js r180
está em `vendor` e conserva a licença MIT em `THREE-LICENSE.txt`.

O Site é estático e não exige build para servir `index.html`.
Após alterar o código, gere novamente o HTML autossuficiente:

```sh
npm install
npm run build:offline
```

O build também aceita o caminho absoluto de uma instalação de esbuild como
primeiro argumento de `scripts/build-offline.mjs`.

## Hospedagem no GitHub Pages

Este projeto é um site estático independente, sem backend ou Cloudflare.
No GitHub, configure Pages com a branch `main` e a pasta `/(root)`.
O arquivo `.nojekyll` preserva os arquivos estáticos e os módulos locais.

## Objetos removidos

LED de parede, ventilador de chão, mochila e cachorro sobre a cama foram
excluídos dos dados iniciais. O projeto tem 22 objetos. Projetos JSON antigos
e dados locais são limpos desses quatro **IDs e tipos** ao abrir; não se trata de
visibilidade. Os outros objetos, medidas e posições foram preservados.


## Studio Precision e controle de qualidade

O layout desktop organiza **Objetos à esquerda, Canvas expansível ao centro
e Propriedades à direita**. Os botões de painel no cabeçalho podem recolher
Objetos e Propriedades. No celular, a barra inferior permite abrir,
expandir, recolher e fechar as gavetas sem bloquear permanentemente o canvas.
O estado de salvamento permanece no cabeçalho. O código de governança e
implementação fica em `docs/superpowers/`.

Testes locais (Node.js 22):

```sh
npm install
npm run check:syntax
npm run build:offline
npm test
```

No pull request, o GitHub Actions executa regressões de modelo, recuperação,
colisões, exportação offline e testes Chromium em 1440, 1024, 768, 390 e
320 pixels, inclusive fluxos reais de edição e exportações JSON, PNG e GLB.
As imagens ficam disponíveis nos artefatos das execuções. Depois de um
workflow aprovado, a branch de trabalho sincroniza automaticamente o
HTML offline gerado; **isso não faz merge, não executa deploy e não altera
`main`**.

### Sobre Cloudflare

A aplicação continua hospedável diretamente no GitHub Pages: não necessita
de Worker, Cloudflare Pages, D1 ou backend. Mudar apenas o provedor de
arquivos estáticos não remove a necessidade de autenticação GitHub para
gravar `projeto-atual.json`. Qualquer ambiente de preview deve isolar o
alvo das gravações para não editar dados de produção.
