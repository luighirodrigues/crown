# 04 — Scroll-Driven 3D Parallax no Perfil Publico

## Resumo
Transformar a pagina de perfil publico (`/perfil/[slug]`) em uma experiencia imersiva com efeito de profundidade 3D, onde elementos como avatar, banner e cards "flutuam" com velocidades diferentes ao rolar a pagina.

## Problema / Oportunidade
- A pagina de perfil hoje e uma lista linear: avatar, bio, stats, interesses...
- Experiencias memoraveis usam profundidade para criar hierarquia visual.
- O usuario final empreendedora precisa de um "cartao de visitas digital" impressionante que impacte quem ve.

## Descricao Tecnica
- Utilizar CSS `scroll-timeline` + `animation-timeline: view()` para animacoes vinculadas ao scroll, com fallback baseado em `useScroll` do Framer Motion para navegadores que nao suportam ainda (Safari).
- Criar uma componente de layout em camadas (z-index stacking) com o seguinte plano:
  - **Background layer (z-0)**: Banner de perfil com `translateZ(-100px)` e filtro de blur
  - **Avatar layer (z-10)**: Avatar com `translateZ(0px)` e escala que diminui levemente ao scroll
  - **Content layer (z-20)**: Cards de stats, interesses, historia — com cada card tendo `translateZ` diferente
  - **Foreground layer (z-30)**: Floating action buttons que sempre ficam acima
- Usar `perspective: 1000px` no container pai para ativar o espaco 3D.
- Degrades e shadows suaves nos cards para reforcar a sensacao de flutuacao.
- Implementar suavemente: sem scroll-jacking, transicoes suaves.
- O efeito deve ser desativado via `prefers-reduced-motion` accessibility.

## Referencias
- https://tympanus.net/codrops/2021/11/19/3d-parallax-on-scroll-using-css-variables/
- https://www.framer.com/motion/use-scroll/

## Prioridade: Alta
