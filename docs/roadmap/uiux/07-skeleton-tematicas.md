# 07 — Skeleton Screens Tematicas

## Resumo
Substituir os estados de loading genericos (spinner, texto "Carregando...") por skeleton screens cenica e on-brand, como pilastros dourados se construindo, coroas sendo forjadas, ou texto borrado que se torna legivel, de acordo com o contexto da pagina.

## Problema / Oportunidade
- O app atual usa loading states muito basicos e sem identidade.
- A experiencia de espera deve transmitir a marca e reforcar o "reino" da Crown.
- Skeleton screens reduzem percepção de lentidao e mantem a estrutura do layout.
- Fazer skeletons com tema fortemente tematizado (e nao so retângulos cinzas) aumenta o lembrança_do_brand.

## Descrição Tecnica
- Criar componentes `Skeleton` de alta-fidelidade para diferentes paginas/contextos, combinando Tailwind `animate-pulse`, `bg-amber-100` e `#F7E7CE` (backgrounds dourados suaves).
- Criar variacoes tematicas:
  - **Salao dos Rituais (Rituals page)**: Skeleton de um pequeno altar ou pilastras com lampadas piscando.
  - **Carta de Rainha (Perfil)**: Um cetro (line art SVG) que gradualmente brilha, lentes piscam...
  - **Mural (Comunidade)**: Tiles de posts com blocos de texto e avatar "ghost" com sombra dourada.
  - **Cursos**: Unfolding scrolls (feito com CSS) que abrem lentamente.
- Implementar usando `framer-motion` para animacoes mais interessantes do que simples pulse:
  - Use `animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}`
  - Aplicar `background: linear-gradient(...)` com shimmer animation via `background-size: 200%` e `background-position` animando via CSS keyframes para simular brilho metalico se movendo.
- Exports:
  ```tsx
  // ui/skeleton/ritual-skeleton.tsx
  // ui/skeleton/profile-skeleton.tsx
  // ui/skeleton/feed-skeleton.tsx
  // ui/skeleton/course-skeleton.tsx
  ```

## Referencias
- https://nextui.org/docs/components/skeleton
- https://m3.material.io/components/skeleton/overview

## Prioridade: Media
