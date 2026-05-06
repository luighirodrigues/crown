# 01 — Mouse-Trail Efect de Particulas Douradas

## Resumo
Criar um efeito de rastro (trail) de particulas douradas que seguem o cursor do mouse pelo site, reforcando o tema do "reino" e a identidade visual premium da Crown.

## Problema / Oportunidade
- A identidade visual da Crown ja usa dourado e temas de realeza, mas nao ha nenhum efeito visual que transmita essa sensacao de luxo e exclusividade.
- Sites SaaS modernos de alta conversao investem em micro-interacoes visuais memoraveis.
- E um efeito leve (performance) com alto retorno de percepcao de qualidade.

## Descricao Tecnica
- Criar um componente `MouseTrail` que renderiza um `<canvas>` em fixed position em tela cheia, com `pointer-events-none` e `z-50`.
- Cada `mousemove` spawna uma particula dourada com:
  - Raio decrescente ao longo do tempo
  - OPacidade que decai suavemente
  - Cor na escala `amber-400` a `yellow-200`
  - Leve efeito de glow via canvas `shadowBlur`
- O componente deve ser lazy-loaded via `next/dynamic` com `ssr: false` para evitar erros de hidratacao.
- Paralelamente, varias particulas maiores ("poeira dourada") podem spawnar espontaneamente para dar vida ao fundo.
- Adicionar um toggle no perfil do usuario para quem desejar desativar efeitos visuais.

## Referencias
- https://particles.js.org/
- https://codepen.io/collection/ ✕mouse-trail

## Prioridade: Media
