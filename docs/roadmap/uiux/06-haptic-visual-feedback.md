# 06 — Micro-interacoes Hapticas Visuais

## Resumo
Adicionar feedback visual que simula resposta haptica em tocas/like/check-ins — elementos que pulsam, escala, esmagam ou se expandem, dando uma sensacao de "resistencia" e resposta fisica velha — combinando Framer Motion e Tailwind JIT.

## Problema / Oportunidade
- O aplicativo e primeiro mobile (max-w-[430px] no mobile), e o feedback tactil e esperado.
- Hoje os cliques e likes nao tem animacao ou feedback visual.
- Em um app baseado em gamificacao, cada acao precisa de celebracao visual.
- Feedback haptico real nao e confiavel na web; feedback visual e a alternativa principal.

## Descricao Tecnica
- Criar um utilitario `usePressFeedback` hook que encapsula:
  - `whileTap={{ scale: 0.95 }}` no Framer Motion (esmagamento no toque)
  - `whileHover={{ scale: 1.02 }}` (leve expansao no hover desktop)
- Aplicar em toda interface que tem cliques:
  - `PostCard` de likes (coração que aumenta e explode em particulas douradas)
  - `MissionCard` quando se completa uma missao (card se expande com glow dourado)
  - `RitualCard` no check-in (check anima, coraçao aparece, tela tremer levemente)
  - `BottomNavigation` quando se troca de tab (leve bounce no icone)
  - `Button` generico (ripple effect ao clicar, tipo Material Design mas dourado)
- Usar `framer-motion` com `AnimatePresence` para garantir que as animacoes entrem e saiam com suavidade.
- Examples de variações:
  ```tsx
  // Like logic
  whileTap={{ scale: [1, 1.4, 1], transition: { duration: 0.3 } }}
  // Missao concluida
  animate={{ boxShadow: ["0 0 0px amber", "0 0 20px amber", "0 0 0px amber"] }} repeat={1}
  ```

## Referencias
- https://www.toptal.com/designers/ui/micro-interactions
- https://framer.com/motion

## Prioridade: Media
