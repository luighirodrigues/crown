# 02 — Noise Grain Texture Overlay

## Resumo
Aplicar um overlay sutil de film grain (ruido de filme analogico) sobre toda a interface para dar profundidade, textura e um toque de sofisticacao cinematografica ao app.

## Problema / Oportunidade
- UIs flat e limpas sao padrao web, mas carecem de "tactilidade" e carater.
- Cores solidas e gradientes lisos podem parecer "digit demais".
- Uma textura de ruido sutil transforma o design em algo que parece impresso ou em tecido, alinhado ao tema de realeza e tecidos nobres.

## Descricao Tecnica
- Adicionar um `::after` pseudo-elemento ao `<body>` ou um `<div>` overlay fixo com:
  - `background-image: url(/noise.png)` (PNG transparente 200x200px com ruido)
  - `opacity: 0.03` a `0.05`
  - `pointer-events: none`
  - `mix-blend-mode: overlay`
- Usar CSS animation para mudar o `background-position` suavemente, criando um efeito "vivo". 
- Alternativa: gerar o ruido via CSS `filter: url(#grain)` com um SVG feathernoise filter inline.
- Deve ser opcional: adicionar em `globals.css` e garantir performance via `will-change: opacity` apenas quando necessario.

## Referencias
- https://grainy-gradients.vercel.app/
- https://css-tricks.com/snippets/css/animated-grainy-texture/

## Prioridade: Baixa
