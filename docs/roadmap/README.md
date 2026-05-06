# Crown — Roadmap de Melhorias

> Documento mestre que consolida as melhorias de UI/UX e as novas features planejadas para a plataforma Crown. Cada item possui um link para o seu respectivo subdocumento de especificacao.

---

## 1. Melhorias de UI/UX (Fora da Caixa)

| # | Titulo | Subdocumento | Complexidade | Impacto |
|---|---------|------------|-------------|---------|
| 1 | [Mouse-Trail Effect de Particulas Douradas](#) | `01-mouse-trail-dourado.md` | Media | Alto |
| 2 | [Noise Grain Texture Overlay](#) | `02-noise-grain-overlay.md` | Baixa | Medio |
| 3 | [Liquid Glass / Frosted Glass UI](#) | `03-liquid-glass-ui.md` | Media | Alto |
| 4 | [Scroll-Driven 3D Parallax no Perfil](#) | `04-3d-parallax-perfil.md` | Alta | Alto |
| 5 | [Ambient Orb Glow no Bottom Nav](#) | `05-ambient-orb-glow.md` | Baixa | Alto |
| 6 | [Micro-interacoes Hapticas Visuais](#) | `06-haptic-visual-feedback.md` | Media | Medio |
| 7 | [Skeleton Screens Tematicas](#) | `07-skeleton-tematicas.md` | Media | Medio |
| 8 | [Magnetic Buttons com Elasticidade](#) | `08-magnetic-buttons.md` | Media | Medio |
| 9 | [Confetti Celebration em Acoes](#) | `09-confetti-celebration.md` | Baixa | Alto |
| 10 | [Scroll Progress Deco no Topo](#) | `10-scroll-progress-deco.md` | Media | Medio |
| 11 | [Spotlight Cursor Cards](#) | `11-spotlight-cursor-cards.md` | Media | Medio |
| 12 | [Kinetic Typography Hero](#) | `12-kinetic-typography.md` | Baixa | Medio |

---

## 2. Novas Features

| # | Titulo | Subdocumento | Complexidade | Impacto |
|---|---------|------------|-------------|---------|
| 1 | [Sistema de Reels / Short-Form Video](#) | `feat-01-reels.md` | Alta | Alto |
| 2 | [Dashboard de Analytics Pessoal](#) | `feat-02-analytics-pessoal.md` | Alta | Alto |
| 3 | [Sistema de Achievements e Insignias](#) | `feat-03-achievements-insignias.md` | Media | Alto |
| 4 | [Marketplace de Servicos entre Membros](#) | `feat-04-marketplace.md` | Alta | Alto |
| 5 | [Chat em Tempo Real entre Membros](#) | `feat-05-chat-tempo-real.md` | Alta | Medio |
| 6 | [Sistema de Anotacoes / Diario](#) | `feat-06-anotacoes-diario.md` | Media | Medio |
| 7 | [Match-Making entre Membros](#) | `feat-07-matchmaking.md` | Media | Alto |
| 8 | [Sistema de Votacoes e Enquetes](#) | `feat-08-votacoes-enquetes.md` | Baixa | Medio |
| 9 | [Programa de Indicacoes / Convites](#) | `feat-09-sistema-indicacoes.md` | Media | Alto |
| 10 | [Botao SOS / Pedir Ajuda](#) | `feat-10-botao-sos.md` | Media | Alto |
| 11 | [Clubs / Sub-comunidades](#) | `feat-11-clubs.md` | Alta | Medio |
| 12 | [Modo Foco / Pomodoro Coletivo](#) | `feat-12-modo-foco.md` | Media | Medio |

---

## Estrutura da Pasta

```
docs/roadmap/
|-- README.md                          # Este documento
|-- uiux/
|   |-- 01-mouse-trail-dourado.md
|   |-- 02-noise-grain-overlay.md
|   |-- 03-liquid-glass-ui.md
|   |-- 04-3d-parallax-perfil.md
|   |-- 05-ambient-orb-glow.md
|   |-- 06-haptic-visual-feedback.md
|   |-- 07-skeleton-tematicas.md
|   |-- 08-magnetic-buttons.md
|   |-- 09-confetti-celebration.md
|   |-- 10-scroll-progress-deco.md
|   |-- 11-spotlight-cursor-cards.md
|   `-- 12-kinetic-typography.md
`-- features/
    |-- feat-01-reels.md
    |-- feat-02-analytics-pessoal.md
    |-- feat-03-achievements-insignias.md
    |-- feat-04-marketplace.md
    |-- feat-05-chat-tempo-real.md
    |-- feat-06-anotacoes-diario.md
    |-- feat-07-matchmaking.md
    |-- feat-08-votacoes-enquetes.md
    |-- feat-09-sistema-indicacoes.md
    |-- feat-10-botao-sos.md
    |-- feat-11-clubs.md
    `-- feat-12-modo-foco.md
```

---

## Sobre este Documento

Os subdocumentos em `uiux/` e `features/` foram gerados com base numa analise completa da estrutura do projeto Crown (Next.js + Prisma + Tailwind). Cada subdocumento contem:

- **Resumo**: O que e e por que importa.
- **Problema / Oportunidade**: Contexto e justificativa.
- **Descricao Tecnica**: Como implementar.
- **Referencias**: Inspiracoes, pecas de UI semelhantes, etc.
- **Prioridade**: Qual deve ser.

Junte-os como quiser, como desejar, ou implemente por partes.
