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

Ao abrir uma versão antiga salva no navegador pela primeira vez depois desta
atualização, a aplicação guarda o projeto completo anterior antes de carregar
o modelo com as medidas informadas. A cópia anterior pode ser baixada em
Ambiente. Importações JSON posteriores são preservadas como foram abertas.

As edições são salvas no armazenamento deste navegador. Isso não é
sincronização em nuvem. Baixe o JSON ou um novo HTML para guardar as mudanças,
transferir para outro aparelho ou enviá-las para revisão no ChatGPT.
Também é possível exportar GLB com objetos separados e PNG da vista atual.

## Código

`model.js` contém o projeto inicial e validação de arquivos.
`scene.js` monta a geometria paramétrica; `app.js` controla a interface.
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
e dados locais são limpos desses quatro IDs ao abrir; não se trata de
visibilidade. Os outros objetos, medidas e posições foram preservados.
